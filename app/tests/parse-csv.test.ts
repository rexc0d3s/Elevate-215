import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/server/csv';

describe('parseCsv', () => {
	it('turns one line into one row of exact strings', () => {
		expect(parseCsv('School A,100,Good')).toEqual([['School A', '100', 'Good']]);
	});
});
