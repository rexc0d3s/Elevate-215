import { error } from '@sveltejs/kit';
import { repo } from '$lib/server';
import { GRANTS, NOTE_COLS, NOTES, ROLLUP, STATUS_COLS, SUMMARY_COLS, TESTS, testColumns } from '$lib/server/sources';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const school = await repo().getSchool(params.key);
	if (!school) error(404, `No school with School Number ${params.key} in the School Rollup`);
	return {
		school,
		tests: TESTS.map((t) => ({ test: t, cols: testColumns(t) })),
		summaryCols: SUMMARY_COLS,
		statusCols: STATUS_COLS,
		noteCols: NOTE_COLS,
		labels: { rollup: ROLLUP.label, notes: NOTES.label, grants: GRANTS.label }
	};
};
