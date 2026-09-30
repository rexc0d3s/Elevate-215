/**
 * Links a school name from the notes or funder file to a rollup SchoolNumber.
 * Rules, in order (no fuzzy matching, no guessing):
 *   1. An entry in the hand-maintained name map.
 *   2. An exact, case- and space-sensitive match to exactly one rollup SchoolName.
 *   3. Otherwise unmatched, with the reason.
 */

export type LinkResult = { number: string } | { reason: string };

export interface LinkIndex {
	/** Source_Name → every SchoolNumber the map lists for it. */
	map: Map<string, string[]>;
	/** Rollup SchoolName → every SchoolNumber with that exact name. */
	names: Map<string, string[]>;
	/** Every SchoolNumber in the rollup. */
	numbers: Set<string>;
}

export function buildIndex(
	schools: { number: string; name: string }[],
	mapRows: { name: string; number: string }[]
): LinkIndex {
	const push = (m: Map<string, string[]>, k: string, v: string) => m.set(k, [...(m.get(k) ?? []), v]);
	const names = new Map<string, string[]>();
	for (const s of schools) push(names, s.name, s.number);
	const map = new Map<string, string[]>();
	for (const r of mapRows) push(map, r.name, r.number);
	return { map, names, numbers: new Set(schools.map((s) => s.number)) };
}

export function linkName(name: string, idx: LinkIndex): LinkResult {
	if (name.trim() === '') return { reason: 'No school name in this row' };

	const mapped = idx.map.get(name);
	if (mapped) {
		const distinct = [...new Set(mapped)];
		if (distinct.length > 1)
			return { reason: `Name map lists this name for more than one SchoolNumber (${distinct.join(', ')})` };
		if (!idx.numbers.has(distinct[0]))
			return { reason: `Name map points to SchoolNumber ${distinct[0]}, which is not in the School Rollup` };
		return { number: distinct[0] };
	}

	const exact = idx.names.get(name);
	if (!exact) return { reason: 'No school with this name in the School Rollup, and no name map entry' };
	if (exact.length > 1)
		return { reason: `More than one school has this exact name (SchoolNumbers ${exact.join(', ')}); add a name map entry` };
	return { number: exact[0] };
}
