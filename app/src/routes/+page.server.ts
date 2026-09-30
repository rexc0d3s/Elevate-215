import { repo } from '$lib/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const r = repo();
	const [schools, unmatched, sources] = await Promise.all([r.listSchools(), r.getUnmatched(), r.sourceInfo()]);
	return { schools, unmatched, sources };
};
