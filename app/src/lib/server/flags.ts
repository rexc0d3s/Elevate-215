/** Rules for flagging missing, outdated and problem values. Nothing here changes a value. */
import type { Flag } from '$lib/types';

/** Blank means empty or only spaces. "0" is a value, never missing. */
export const isBlank = (v: string | undefined) => v === undefined || v.trim() === '';

/** Reads YYYY-MM-DD or M/D/YYYY. Returns null when the text is not a real calendar date. */
export function parseDate(text: string): Date | null {
	const s = text.trim();
	let y: number, m: number, d: number;
	let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (match) [y, m, d] = [+match[1], +match[2], +match[3]];
	else if ((match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [m, d, y] = [+match[1], +match[2], +match[3]];
	else return null;
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}

/** First calendar year of the school year containing `today` (school years start July 1). */
export const schoolYearStart = (today: Date) =>
	today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;

export const schoolYearLabel = (start: number) => `${start}-${String((start + 1) % 100).padStart(2, '0')}`;

/**
 * Reporting year from a column name suffix:
 *   "_2025-26" → school year 2025-26
 *   "_2025"    → test year 2025, i.e. school year 2024-25 (spring testing)
 * Columns without a year suffix return null and are never flagged outdated.
 */
export function columnSchoolYear(column: string): { start: number; label: string } | null {
	const range = column.match(/_(\d{4})-(\d{2})$/);
	if (range) return { start: +range[1], label: `${range[1]}-${range[2]}` };
	const single = column.match(/_(\d{4})$/);
	if (single) return { start: +single[1] - 1, label: single[1] };
	return null;
}

export function missingFlags(fields: Record<string, string>, columns: string[], where: string): Flag[] {
	return columns
		.filter((c) => isBlank(fields[c]))
		.map((c) => ({
			kind: 'missing' as const,
			field: c,
			where,
			detail: c in fields ? 'Blank in the source' : 'Column not in the source file'
		}));
}

export function outdatedFlags(columns: string[], where: string, today: Date): Flag[] {
	const current = schoolYearStart(today);
	const flags: Flag[] = [];
	for (const c of columns) {
		const y = columnSchoolYear(c);
		if (y && y.start < current)
			flags.push({
				kind: 'outdated',
				field: c,
				where,
				detail: `Reporting year ${y.label}; current school year is ${schoolYearLabel(current)}`
			});
	}
	return flags;
}

export function dateFlags(fields: Record<string, string>, columns: string[], where: string): Flag[] {
	return columns
		.filter((c) => !isBlank(fields[c]) && parseDate(fields[c]) === null)
		.map((c) => ({ kind: 'problem' as const, field: c, where, detail: `Unreadable date “${fields[c]}”` }));
}
