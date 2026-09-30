import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Flag, SchoolRecord, SchoolSummary, SourceInfo, SourceRow, Unmatched } from '$lib/types';
import { parseCsv } from './csv';
import { dateFlags, isBlank, missingFlags, outdatedFlags, parseDate } from './flags';
import { buildIndex, linkName } from './link';
import type { SchoolRepository } from './repository';
import {
	GRANT_COLS,
	GRANTS,
	ID,
	MAP_COLS,
	NAME,
	NAME_MAP,
	NOTE_COLS,
	NOTES,
	ROLLUP,
	ROLLUP_REQUIRED,
	ROLLUP_SHOWN
} from './sources';

interface Table {
	info: SourceInfo;
	rows: SourceRow[];
	/** Row-level problems keyed by row number (e.g. wrong number of cells). */
	rowProblems: Map<number, string>;
}

type Source = { label: string; file: string; required: boolean };

/** Reads one CSV file. Cells are kept exactly; a header column that appears twice is reported, not merged. */
function loadTable(dir: string, src: Source, expected: string[]): Table {
	const path = resolve(dir, src.file);
	const info: SourceInfo = { file: src.file, label: src.label, found: false, rows: 0, problems: [] };
	const rowProblems = new Map<number, string>();
	if (!existsSync(path)) {
		if (src.required) info.problems.push(`File not found in ${dir}`);
		return { info, rows: [], rowProblems };
	}
	info.found = true;
	const [header = [], ...data] = parseCsv(readFileSync(path, 'utf8'));

	for (const c of expected) if (!header.includes(c)) info.problems.push(`Expected column “${c}” is not in the header`);
	const seen = new Set<string>();
	for (const c of header) {
		if (seen.has(c)) info.problems.push(`Column “${c}” appears more than once in the header; the first one is used`);
		seen.add(c);
	}

	const rows = data.map((cells, i) => {
		const row = i + 2;
		const fields: Record<string, string> = {};
		header.forEach((c, j) => {
			if (!(c in fields)) fields[c] = cells[j] ?? '';
		});
		if (cells.length !== header.length)
			rowProblems.set(row, `Row has ${cells.length} cells but the header has ${header.length} columns`);
		return { file: src.file, row, fields };
	});
	info.rows = rows.length;
	return { info, rows, rowProblems };
}

const where = (label: string, r: SourceRow) => `${label} row ${r.row}`;

/** Newest real date first; unreadable or blank dates go last, keeping file order. */
function byVisitDateDesc(a: SourceRow, b: SourceRow) {
	const da = parseDate(a.fields.Visit_Date ?? ''), db = parseDate(b.fields.Visit_Date ?? '');
	if (da && db) return db.getTime() - da.getTime() || a.row - b.row;
	if (da) return -1;
	if (db) return 1;
	return a.row - b.row;
}

interface Snapshot {
	schools: SchoolRecord[];
	unmatched: Unmatched[];
	sources: SourceInfo[];
}

export class CsvSchoolRepository implements SchoolRepository {
	constructor(
		private dir: string,
		private today: () => Date = () => new Date()
	) {}

	/** Files are read on every call so replacing a CSV shows up on the next page load. */
	private load(): Snapshot {
		const today = this.today();
		const rollup = loadTable(this.dir, ROLLUP, ROLLUP_REQUIRED);
		const notes = loadTable(this.dir, NOTES, NOTE_COLS);
		const grants = loadTable(this.dir, GRANTS, GRANT_COLS);
		const nameMap = loadTable(this.dir, NAME_MAP, MAP_COLS);

		// Duplicate SchoolNumbers are kept as separate schools and flagged.
		const numberCount = new Map<string, number>();
		for (const r of rollup.rows) numberCount.set(r.fields[ID], (numberCount.get(r.fields[ID]) ?? 0) + 1);

		const schools: SchoolRecord[] = rollup.rows.map((r) => {
			const number = r.fields[ID];
			const w = where(ROLLUP.label, r);
			const dup = (numberCount.get(number) ?? 0) > 1;
			const flags: Flag[] = [
				...missingFlags(r.fields, ROLLUP_SHOWN, w),
				...outdatedFlags(ROLLUP_SHOWN, w, today)
			];
			if (isBlank(number)) flags.push({ kind: 'problem', field: ID, where: w, detail: 'Blank SchoolNumber' });
			if (dup)
				flags.push({ kind: 'problem', field: ID, where: w, detail: `SchoolNumber ${number} appears on more than one row` });
			const p = rollup.rowProblems.get(r.row);
			if (p) flags.push({ kind: 'problem', field: '(row)', where: w, detail: p });
			return {
				key: dup || isBlank(number) ? `${number}~row${r.row}` : number,
				number,
				name: r.fields[NAME],
				rollup: r,
				notes: [],
				grants: [],
				flags
			};
		});

		const byNumber = new Map<string, SchoolRecord>();
		for (const s of schools) if (!byNumber.has(s.number)) byNumber.set(s.number, s);
		const idx = buildIndex(
			schools,
			nameMap.rows.map((r) => ({ name: r.fields.Source_Name ?? '', number: r.fields.SchoolNumber ?? '' }))
		);

		const unmatched: Unmatched[] = [];
		const attach = (table: Table, label: string, dateCols: string[], put: (s: SchoolRecord, r: SourceRow) => void) => {
			for (const r of table.rows) {
				const name = r.fields.School_Name ?? '';
				const link = linkName(name, idx);
				const school = 'number' in link ? byNumber.get(link.number) : undefined;
				if (!school) {
					unmatched.push({ file: r.file, row: r.row, name, reason: 'reason' in link ? link.reason : 'Unknown SchoolNumber' });
					continue;
				}
				// Duplicate SchoolNumbers would make the link ambiguous.
				if ((numberCount.get(school.number) ?? 0) > 1) {
					unmatched.push({ file: r.file, row: r.row, name, reason: `SchoolNumber ${school.number} is on more than one rollup row` });
					continue;
				}
				const w = where(label, r);
				put(school, r);
				school.flags.push(...missingFlags(r.fields, Object.keys(r.fields), w), ...dateFlags(r.fields, dateCols, w));
				const p = table.rowProblems.get(r.row);
				if (p) school.flags.push({ kind: 'problem', field: '(row)', where: w, detail: p });
			}
		};
		attach(notes, NOTES.label, ['Visit_Date'], (s, r) => s.notes.push(r));
		attach(grants, GRANTS.label, ['Grant_Start_Date', 'Grant_End_Date'], (s, r) => s.grants.push(r));
		for (const s of schools) {
			s.notes.sort(byVisitDateDesc);
			if (s.notes.length === 0)
				s.flags.push({
					kind: 'missing',
					field: 'Latest Update',
					where: notes.info.found ? NOTES.label : `${NOTES.label} (file not found)`,
					detail: 'No notes linked to this school'
				});
		}

		return { schools, unmatched, sources: [rollup.info, notes.info, grants.info, nameMap.info] };
	}

	async listSchools(): Promise<SchoolSummary[]> {
		return this.load().schools.map((s) => ({
			key: s.key,
			number: s.number,
			name: s.name,
			flagCounts: {
				missing: s.flags.filter((f) => f.kind === 'missing').length,
				outdated: s.flags.filter((f) => f.kind === 'outdated').length,
				problem: s.flags.filter((f) => f.kind === 'problem').length
			}
		}));
	}

	async getSchool(key: string): Promise<SchoolRecord | null> {
		return this.load().schools.find((s) => s.key === key) ?? null;
	}

	async getUnmatched(): Promise<Unmatched[]> {
		return this.load().unmatched;
	}

	async sourceInfo(): Promise<SourceInfo[]> {
		return this.load().sources;
	}
}
