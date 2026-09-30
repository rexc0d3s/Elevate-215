/**
 * SPEC1 "done when": every school, number, date and note matches the source files exactly.
 * The source files are read here with a separate, simple parser and compared cell by cell
 * with what the repository gives the pages.
 */
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CsvSchoolRepository } from '../src/lib/server/csv-repository';
import { GRANTS, NOTES, ROLLUP } from '../src/lib/server/sources';

const DIR = resolve(__dirname, '../../schooldata');
const hasData = existsSync(join(DIR, ROLLUP.file));
const TODAY = () => new Date(2026, 8, 30);

/** Independent reader: these files contain no quotes, so a plain split is exact. */
function simpleRead(file: string) {
	const text = readFileSync(join(DIR, file), 'utf8');
	expect(text.includes('"'), `${file} has quotes; simpleRead would not be exact`).toBe(false);
	const lines = text.split(/\r?\n/);
	if (lines.at(-1) === '') lines.pop();
	const [header, ...rows] = lines.map((l) => l.split(','));
	return { header, rows };
}

describe.skipIf(!hasData)('source fidelity (real schooldata/)', () => {
	const repo = new CsvSchoolRepository(DIR, TODAY);

	it('has every rollup school, each with a unique SchoolNumber', async () => {
		const src = simpleRead(ROLLUP.file);
		const list = await repo.listSchools();
		expect(list.length).toBe(src.rows.length);
		expect(list.length).toBe(301);
		expect(new Set(list.map((s) => s.key)).size).toBe(list.length);
		const numbers = src.rows.map((r) => r[src.header.indexOf('SchoolNumber')]);
		expect(list.map((s) => s.number)).toEqual(numbers);
	});

	it('keeps every rollup cell exactly, including blanks', async () => {
		const src = simpleRead(ROLLUP.file);
		const idCol = src.header.indexOf('SchoolNumber');
		for (const cells of src.rows) {
			const s = await repo.getSchool(cells[idCol]);
			expect(s, `school ${cells[idCol]}`).not.toBeNull();
			src.header.forEach((col, j) => expect(s!.rollup.fields[col], `${cells[idCol]} / ${col}`).toBe(cells[j]));
		}
	});

	it('never treats 0 as missing', async () => {
		const src = simpleRead(ROLLUP.file);
		const idCol = src.header.indexOf('SchoolNumber');
		for (const cells of src.rows) {
			const s = (await repo.getSchool(cells[idCol]))!;
			const missing = new Set(s.flags.filter((f) => f.kind === 'missing').map((f) => f.field));
			src.header.forEach((col, j) => {
				if (cells[j] !== '') expect(missing.has(col), `${cells[idCol]} / ${col}`).toBe(false);
			});
		}
	});

	it('accounts for every note and grant row (linked or unmatched), none dropped', async () => {
		const unmatched = await repo.getUnmatched();
		const schools = await Promise.all((await repo.listSchools()).map((s) => repo.getSchool(s.key)));
		for (const [src, key] of [
			[NOTES, 'notes'],
			[GRANTS, 'grants']
		] as const) {
			const { rows } = simpleRead(src.file);
			const linked = schools.flatMap((s) => s![key]).filter((r) => r.file === src.file).length;
			const un = unmatched.filter((u) => u.file === src.file).length;
			expect(linked + un).toBe(rows.length);
		}
	});

	it('shows the sample notes and grants as unmatched (their names are not rollup schools)', async () => {
		const unmatched = await repo.getUnmatched();
		expect(unmatched.filter((u) => u.file === NOTES.file)).toHaveLength(3);
		expect(unmatched.filter((u) => u.file === GRANTS.file)).toHaveLength(3);
		for (const u of unmatched) expect(u.reason).toMatch(/No school with this name/);
	});

	it('flags AD PRIMA Keystone blanks as missing and 2025 columns as outdated', async () => {
		const s = (await repo.getSchool('7825'))!;
		expect(s.name).toBe('AD PRIMA CS');
		expect(s.rollup.fields['PSSA Reading — PctProficient_2025']).toBe('37.4');
		const missing = s.flags.filter((f) => f.kind === 'missing').map((f) => f.field);
		expect(missing).toContain('Keystone Biology — Band');
		expect(missing).toContain('Latest Update');
		const outdated = s.flags.filter((f) => f.kind === 'outdated').map((f) => f.field);
		expect(outdated).toContain('PSSA Reading — N Scored_2025');
		expect(outdated).not.toContain('PSSA Reading — Residual');
	});

	it('links notes and grants through the name map, verbatim and newest first', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'e215-'));
		for (const f of [ROLLUP.file, NOTES.file, GRANTS.file]) copyFileSync(join(DIR, f), join(dir, f));
		writeFileSync(
			join(dir, 'school-name-map.csv'),
			'Source_Name,SchoolNumber\nExample West Philadelphia K-8 School,7825\nExample North Philadelphia K-8 School,7825\n'
		);
		const mapped = new CsvSchoolRepository(dir, TODAY);
		const s = (await mapped.getSchool('7825'))!;
		expect(s.notes.map((n) => n.fields.Visit_Date)).toEqual(['2026-09-15', '2026-09-10']);
		expect(s.notes[0].fields.Status).toBe('On track');
		expect(s.notes[0].fields.Latest_Result).toBe('48%');
		expect(s.grants.map((g) => g.fields.Payment_Status)).toEqual(['Partially received', 'Fully received']);
		expect(s.grants[0].fields.Amount_Pledged).toBe('75000');
		expect(s.flags.map((f) => f.field)).not.toContain('Latest Update');
		expect(await mapped.getUnmatched()).toHaveLength(2); // the Southwest note and grant
	});
});
