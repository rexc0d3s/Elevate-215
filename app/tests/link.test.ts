import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/server/csv';
import { columnSchoolYear, isBlank, parseDate, schoolYearStart } from '../src/lib/server/flags';
import { buildIndex, linkName } from '../src/lib/server/link';

const schools = [
	{ number: '1', name: 'ALPHA CS' },
	{ number: '2', name: 'TWIN CS' },
	{ number: '3', name: 'TWIN CS' }
];

describe('linkName', () => {
	const idx = buildIndex(schools, [
		{ name: 'Alpha Charter', number: '1' },
		{ name: 'Twin North', number: '3' },
		{ name: 'Gone School', number: '99' },
		{ name: 'Split', number: '1' },
		{ name: 'Split', number: '2' }
	]);

	it('links an exact name', () => expect(linkName('ALPHA CS', idx)).toEqual({ number: '1' }));
	it('uses the map first', () => expect(linkName('Alpha Charter', idx)).toEqual({ number: '1' }));
	it('uses the map to resolve a duplicate name', () => expect(linkName('Twin North', idx)).toEqual({ number: '3' }));
	it('does not match different case or spacing', () => {
		expect(linkName('alpha cs', idx)).toHaveProperty('reason');
		expect(linkName('ALPHA  CS', idx)).toHaveProperty('reason');
		expect(linkName(' ALPHA CS', idx)).toHaveProperty('reason');
	});
	it('does not guess between schools with the same name', () =>
		expect(linkName('TWIN CS', idx)).toEqual({ reason: expect.stringMatching(/More than one school/) }));
	it('rejects a map entry to an unknown SchoolNumber', () =>
		expect(linkName('Gone School', idx)).toEqual({ reason: expect.stringMatching(/not in the School Rollup/) }));
	it('rejects a name mapped to two SchoolNumbers', () =>
		expect(linkName('Split', idx)).toEqual({ reason: expect.stringMatching(/more than one SchoolNumber/) }));
	it('reports unknown and blank names', () => {
		expect(linkName('Nowhere', idx)).toEqual({ reason: expect.stringMatching(/No school with this name/) });
		expect(linkName('', idx)).toEqual({ reason: 'No school name in this row' });
	});
});

describe('parseCsv', () => {
	it('keeps cells exactly', () => {
		expect(parseCsv('a,b,c\n 1 ,,0\n')).toEqual([
			['a', 'b', 'c'],
			[' 1 ', '', '0']
		]);
	});
	it('handles quotes, commas, newlines and CRLF', () => {
		expect(parseCsv('n,t\r\n1,"He said ""hi"", then\nleft"\r\n2,x')).toEqual([
			['n', 't'],
			['1', 'He said "hi", then\nleft'],
			['2', 'x']
		]);
	});
	it('keeps trailing empty cells', () => expect(parseCsv('a,b\n1,')).toEqual([['a', 'b'], ['1', '']]));
});

describe('flag rules', () => {
	it('blank vs zero', () => {
		expect(isBlank('')).toBe(true);
		expect(isBlank('  ')).toBe(true);
		expect(isBlank('0')).toBe(false);
	});
	it('reads real dates only', () => {
		expect(parseDate('2026-09-15')?.toISOString()).toBe('2026-09-15T00:00:00.000Z');
		expect(parseDate('9/15/2026')?.toISOString()).toBe('2026-09-15T00:00:00.000Z');
		expect(parseDate('2026-02-30')).toBeNull();
		expect(parseDate('next week')).toBeNull();
	});
	it('school year rolls over on July 1', () => {
		expect(schoolYearStart(new Date(2026, 5, 30))).toBe(2025);
		expect(schoolYearStart(new Date(2026, 6, 1))).toBe(2026);
	});
	it('reads the year from column names', () => {
		expect(columnSchoolYear('PctBlackHispanic_2025-26')).toEqual({ start: 2025, label: '2025-26' });
		expect(columnSchoolYear('PSSA Math — N Scored_2025')).toEqual({ start: 2024, label: '2025' });
		expect(columnSchoolYear('PSSA Math — Band')).toBeNull();
	});
});
