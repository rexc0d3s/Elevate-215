/**
 * SPEC1 (specs/SPEC1.md) acceptance tests.
 *
 * Output: each school's performance, latest update, status and notes, with anything
 * missing or outdated clearly flagged.
 * Done when: every school, number, date and note matches the source files exactly,
 * nothing changed, guessed or dropped.
 *
 * Part 1 reads the real schooldata/ files with a separate plain-split reader and compares
 * them cell by cell with what the repository gives the pages (skipped when the data is absent).
 * Part 2 uses small generated files for the edge cases the real files may not contain.
 */
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CsvSchoolRepository } from '../src/lib/server/csv-repository';
import {
	GRANTS,
	NAME_MAP,
	NOTE_COLS,
	NOTES,
	ROLLUP,
	ROLLUP_REQUIRED,
	ROLLUP_SHOWN,
	STATUS_COLS,
	SUMMARY_COLS,
	TESTS,
	testColumns
} from '../src/lib/server/sources';

const DIR = resolve(__dirname, '../../schooldata');
const hasData = existsSync(join(DIR, ROLLUP.file));
/** Pinned so the outdated flags do not change with the calendar: school year 2026-27. */
const TODAY = () => new Date(2026, 8, 30);

/** Independent reader: these files contain no quotes, so a plain split is exact. */
function simpleRead(dir: string, file: string) {
	const text = readFileSync(join(dir, file), 'utf8');
	expect(text.includes('"'), `${file} has quotes; simpleRead would not be exact`).toBe(false);
	const lines = text.split(/\r?\n/);
	if (lines.at(-1) === '') lines.pop();
	const [header, ...rows] = lines.map((l) => l.split(','));
	return { header, rows };
}

describe.skipIf(!hasData)('SPEC1 against the real source files', () => {
	const repo = new CsvSchoolRepository(DIR, TODAY);

	it('every school in the rollup is listed, in source order, with a unique key', async () => {
		const src = simpleRead(DIR, ROLLUP.file);
		const id = src.header.indexOf('SchoolNumber');
		const name = src.header.indexOf('SchoolName');
		const list = await repo.listSchools();
		expect(list).toHaveLength(src.rows.length);
		expect(list).toHaveLength(301);
		expect(list.map((s) => s.number)).toEqual(src.rows.map((r) => r[id]));
		expect(list.map((s) => s.name)).toEqual(src.rows.map((r) => r[name]));
		expect(new Set(list.map((s) => s.key)).size).toBe(list.length);
	});

	it('the rollup has every column the school page shows', async () => {
		const src = simpleRead(DIR, ROLLUP.file);
		for (const c of ROLLUP_REQUIRED) expect(src.header, c).toContain(c);
		const info = (await repo.sourceInfo()).find((s) => s.file === ROLLUP.file)!;
		expect(info.found).toBe(true);
		expect(info.problems).toEqual([]);
	});

	it('every number, band and status matches the source cell exactly (raw text, blanks kept)', async () => {
		const src = simpleRead(DIR, ROLLUP.file);
		const records = await repo.listRecords();
		src.rows.forEach((cells, i) => {
			const r = records[i];
			src.header.forEach((col, j) => {
				expect(typeof r.rollup.fields[col]).toBe('string');
				expect(r.rollup.fields[col], `${r.number} / ${col}`).toBe(cells[j]);
			});
		});
	});

	it('flags exactly the blank shown cells as missing, and never a 0', async () => {
		for (const r of await repo.listRecords()) {
			const missing = r.flags.filter((f) => f.kind === 'missing' && f.where.startsWith(ROLLUP.label));
			const blank = ROLLUP_SHOWN.filter((c) => r.rollup.fields[c].trim() === '');
			expect(missing.map((f) => f.field).sort(), r.number).toEqual([...blank].sort());
			for (const c of ROLLUP_SHOWN)
				if (r.rollup.fields[c] === '0') expect(missing.some((f) => f.field === c), `${r.number} / ${c}`).toBe(false);
		}
	});

	it('flags the 2025 test-year columns as outdated in school year 2026-27', async () => {
		const r = (await repo.getSchool('7825'))!;
		const outdated = new Set(r.flags.filter((f) => f.kind === 'outdated').map((f) => f.field));
		for (const t of TESTS) {
			expect(outdated.has(`${t} — N Scored_2025`)).toBe(true);
			expect(outdated.has(`${t} — PctProficient_2025`)).toBe(true);
			expect(outdated.has(`${t} — Band`)).toBe(false); // no year in the column name
		}
	});

	it('AD PRIMA CS (7825) shows its performance and status exactly as in the source', async () => {
		const r = (await repo.getSchool('7825'))!;
		expect(r.name).toBe('AD PRIMA CS');
		const f = r.rollup.fields;
		expect(f['PSSA Reading — PctProficient_2025']).toBe('37.4');
		expect(f['PSSA Reading — Predicted']).toBe('17.39325055');
		expect(f['PSSA Reading — Residual']).toBe('20.00674945');
		expect(f['PSSA Reading — Band']).toBe('Above Line (5+)');
		expect(f['PSSA Math — PctProficient_2025']).toBe('20.4');
		expect(f['Within 5 Count']).toBe('0');
		expect(f['Fill Tier']).toBe('Fill-B');
		expect(f['EAPI Tier']).toBe('EAPI-A');
		expect(f['ExcludedSelectionCriteria']).toBe('FALSE');
		// Keystone columns are blank in the source: kept blank and flagged, not filled in.
		for (const c of testColumns('Keystone Biology')) {
			expect(f[c]).toBe('');
			expect(r.flags.some((x) => x.kind === 'missing' && x.field === c)).toBe(true);
		}
	});

	it('every note and grant row is either on a school page or in Unmatched records, none dropped', async () => {
		const records = await repo.listRecords();
		const unmatched = await repo.getUnmatched();
		for (const [file, key] of [
			[NOTES.file, 'notes'],
			[GRANTS.file, 'grants']
		] as const) {
			const src = simpleRead(DIR, file);
			const linked = records.flatMap((r) => r[key]);
			const un = unmatched.filter((u) => u.file === file);
			expect(linked.length + un.length, file).toBe(src.rows.length);
			// Each source row appears once, with every cell unchanged.
			const shown = [...linked.map((r) => ({ row: r.row, fields: r.fields })), ...un.map((u) => ({ row: u.row, fields: u.fields }))];
			src.rows.forEach((cells, i) => {
				const hit = shown.filter((s) => s.row === i + 2);
				expect(hit, `${file} row ${i + 2}`).toHaveLength(1);
				src.header.forEach((col, j) => expect(hit[0].fields[col], `${file} row ${i + 2} / ${col}`).toBe(cells[j]));
			});
		}
	});

	it('the sample notes and grants are unmatched today (their names are not rollup schools)', async () => {
		const unmatched = await repo.getUnmatched();
		expect(unmatched.filter((u) => u.file === NOTES.file)).toHaveLength(3);
		expect(unmatched.filter((u) => u.file === GRANTS.file)).toHaveLength(3);
		for (const u of unmatched) expect(u.reason).toMatch(/No school with this name/);
	});

	it('a school with no linked notes has its Latest Update flagged missing', async () => {
		const r = (await repo.getSchool('7825'))!;
		expect(r.notes).toEqual([]);
		expect(r.flags.some((f) => f.kind === 'missing' && f.field === 'Latest Update')).toBe(true);
	});
});

/* ---------- Generated fixtures for edge cases ---------- */

const ROLLUP_HEADER = ['AUN', 'SchoolNumber', 'DistrictName', 'SchoolName', 'SchoolType', ...ROLLUP_REQUIRED.filter(
	(c) => !['AUN', 'SchoolNumber', 'DistrictName', 'SchoolName', 'SchoolType'].includes(c)
)];

function rollupRow(over: Record<string, string>) {
	const base: Record<string, string> = Object.fromEntries(ROLLUP_HEADER.map((c) => [c, '1']));
	return ROLLUP_HEADER.map((c) => (c in over ? over[c] : base[c])).join(',');
}

function fixture(files: { rollup: string[]; notes?: string[]; map?: string[] }) {
	const dir = mkdtempSync(join(tmpdir(), 'spec1-'));
	writeFileSync(join(dir, ROLLUP.file), [ROLLUP_HEADER.join(','), ...files.rollup].join('\n') + '\n');
	if (files.notes) writeFileSync(join(dir, NOTES.file), [NOTE_COLS.join(','), ...files.notes].join('\n') + '\n');
	if (files.map) writeFileSync(join(dir, NAME_MAP.file), ['Source_Name,SchoolNumber', ...files.map].join('\n') + '\n');
	return new CsvSchoolRepository(dir, TODAY);
}

describe('SPEC1 edge cases (generated files)', () => {
	it('keeps numbers and text exactly: leading zeros, trailing zeros, spaces, case', async () => {
		const repo = fixture({
			rollup: [
				rollupRow({
					SchoolNumber: '0042',
					SchoolName: 'Mixed  Case School ',
					'PSSA Reading — PctProficient_2025': '37.40',
					'PSSA Reading — Residual': '-0.0',
					'PSSA Reading — Band': 'Within 5 (±5)',
					'Fill Tier': ' Fill-B'
				})
			]
		});
		const r = (await repo.getSchool('0042'))!;
		expect(r.number).toBe('0042');
		expect(r.name).toBe('Mixed  Case School ');
		expect(r.rollup.fields['PSSA Reading — PctProficient_2025']).toBe('37.40');
		expect(r.rollup.fields['PSSA Reading — Residual']).toBe('-0.0');
		expect(r.rollup.fields['PSSA Reading — Band']).toBe('Within 5 (±5)');
		expect(r.rollup.fields['Fill Tier']).toBe(' Fill-B');
	});

	it('flags a blank as missing but never a 0', async () => {
		const repo = fixture({ rollup: [rollupRow({ SchoolNumber: '1', 'Within 5 Count': '0', 'EAPI Tier': '' })] });
		const r = (await repo.getSchool('1'))!;
		const missing = r.flags.filter((f) => f.kind === 'missing').map((f) => f.field);
		expect(missing).toContain('EAPI Tier');
		expect(missing).not.toContain('Within 5 Count');
		expect(r.rollup.fields['EAPI Tier']).toBe('');
	});

	it('flags outdated columns by their year suffix, with a July 1 rollover', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'spec1-'));
		writeFileSync(join(dir, ROLLUP.file), [ROLLUP_HEADER.join(','), rollupRow({ SchoolNumber: '1' })].join('\n'));
		const outdated = async (d: Date) =>
			new Set(
				(await new CsvSchoolRepository(dir, () => d).getSchool('1'))!.flags
					.filter((f) => f.kind === 'outdated')
					.map((f) => f.field)
			);
		// _2025 is test year 2025 = school year 2024-25. On June 30 2025 that is still current.
		const june = await outdated(new Date(2025, 5, 30));
		expect(june.has('PSSA Reading — PctProficient_2025')).toBe(false);
		// July 1 2025 starts 2025-26, so the 2025 test columns are now outdated.
		const july = await outdated(new Date(2025, 6, 1));
		expect(july.has('PSSA Reading — PctProficient_2025')).toBe(true);
		expect(july.has('PSSA Math — N Scored_2025')).toBe(true);
		// SPEC1 flags only the columns its page shows; Grade Span is not one of them.
		expect(july.has('GradeSpan_2025-26')).toBe(false);
		// Columns without a year are never outdated.
		for (const c of [...SUMMARY_COLS, ...STATUS_COLS]) expect(july.has(c), c).toBe(false);
	});

	it('links notes by exact name, shows the newest Visit_Date first, and keeps every cell', async () => {
		const repo = fixture({
			rollup: [rollupRow({ SchoolNumber: '1', SchoolName: 'Alpha School' })],
			notes: [
				'Alpha School,2026-08-01,Reading,40%,On track,90%,Older note,Follow up',
				'Alpha School,2026-09-15,Reading,48%,On track,91%,Newest note,Follow up',
				'Alpha School,9/1/2026,Math,0,Needs attention,,Middle note,'
			]
		});
		const r = (await repo.getSchool('1'))!;
		expect(r.notes.map((n) => n.fields.School_Update_Notes)).toEqual(['Newest note', 'Middle note', 'Older note']);
		const mid = r.notes[1].fields;
		expect(mid.Visit_Date).toBe('9/1/2026'); // date text is not reformatted
		expect(mid.Latest_Result).toBe('0');
		expect(mid.Attendance_Result).toBe('');
		expect(r.flags.some((f) => f.kind === 'missing' && f.field === 'Attendance_Result')).toBe(true);
		expect(r.flags.some((f) => f.field === 'Latest Update')).toBe(false);
	});

	it('never fuzzy-matches: a case or spacing difference is unmatched, not dropped', async () => {
		const repo = fixture({
			rollup: [rollupRow({ SchoolNumber: '1', SchoolName: 'Alpha School' })],
			notes: ['alpha school,2026-09-01,Reading,40%,On track,90%,Lower case,', 'Alpha  School,2026-09-01,Reading,40%,On track,90%,Two spaces,']
		});
		expect((await repo.getSchool('1'))!.notes).toEqual([]);
		const un = await repo.getUnmatched();
		expect(un.map((u) => u.name)).toEqual(['alpha school', 'Alpha  School']);
		expect(un[0].fields.School_Update_Notes).toBe('Lower case');
	});

	it('links through the name map when the note uses a different name', async () => {
		const repo = fixture({
			rollup: [rollupRow({ SchoolNumber: '1', SchoolName: 'Alpha School' })],
			notes: ['Example West Philadelphia K-8 School,2026-09-15,Reading,48%,On track,91%,Mapped,'],
			map: ['Example West Philadelphia K-8 School,1']
		});
		expect((await repo.getSchool('1'))!.notes.map((n) => n.fields.School_Update_Notes)).toEqual(['Mapped']);
		expect(await repo.getUnmatched()).toEqual([]);
	});

	it('with the real sample notes and a name map, they link to the mapped schools', async () => {
		if (!hasData) return;
		const dir = mkdtempSync(join(tmpdir(), 'spec1-'));
		for (const f of [ROLLUP.file, NOTES.file, GRANTS.file]) copyFileSync(join(DIR, f), join(dir, f));
		writeFileSync(
			join(dir, NAME_MAP.file),
			'Source_Name,SchoolNumber\nExample West Philadelphia K-8 School,7825\n'
		);
		const repo = new CsvSchoolRepository(dir, TODAY);
		const r = (await repo.getSchool('7825'))!;
		expect(r.notes).toHaveLength(1);
		expect(r.notes[0].fields.Visit_Date).toBe('2026-09-15');
		expect(r.notes[0].fields.Latest_Result).toBe('48%');
		expect(r.grants.map((g) => g.fields.Grant_ID)).toEqual(['GR-2026-014']);
		expect((await repo.getUnmatched()).filter((u) => u.file === NOTES.file)).toHaveLength(2);
	});

	it('flags duplicate SchoolNumbers and unreadable dates as problems, keeping both rows', async () => {
		const repo = fixture({
			rollup: [rollupRow({ SchoolNumber: '5', SchoolName: 'Dup A' }), rollupRow({ SchoolNumber: '5', SchoolName: 'Dup B' }), rollupRow({ SchoolNumber: '6', SchoolName: 'Six' })],
			notes: ['Six,2026-02-30,Reading,40%,On track,90%,Bad date,']
		});
		const list = await repo.listSchools();
		expect(list.map((s) => s.key)).toEqual(['5~row2', '5~row3', '6']);
		expect(list.slice(0, 2).every((s) => s.flagCounts.problem > 0)).toBe(true);
		const six = (await repo.getSchool('6'))!;
		expect(six.notes[0].fields.Visit_Date).toBe('2026-02-30');
		expect(six.flags.some((f) => f.kind === 'problem' && f.field === 'Visit_Date')).toBe(true);
	});
});
