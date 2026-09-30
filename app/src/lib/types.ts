/** Every value is the exact text from the source file. Nothing is converted to numbers or dates. */
export type Fields = Record<string, string>;

/** One data row from a source file, with where it came from. */
export interface SourceRow {
	file: string;
	/** Line number in the file (row 1 is the header). */
	row: number;
	fields: Fields;
}

export type FlagKind = 'missing' | 'outdated' | 'problem';

export interface Flag {
	kind: FlagKind;
	/** Column name as it appears in the source. */
	field: string;
	/** e.g. "School Rollup row 2" */
	where: string;
	detail: string;
}

export interface SchoolRecord {
	/** URL key: the SchoolNumber (plus the row if the number is duplicated in the source). */
	key: string;
	number: string;
	name: string;
	rollup: SourceRow;
	/** Newest Visit_Date first; notes with unreadable dates last, in file order. */
	notes: SourceRow[];
	grants: SourceRow[];
	flags: Flag[];
}

export interface SchoolSummary {
	key: string;
	number: string;
	name: string;
	flagCounts: Record<FlagKind, number>;
}

export interface Unmatched {
	file: string;
	row: number;
	name: string;
	reason: string;
}

export interface SourceInfo {
	file: string;
	label: string;
	found: boolean;
	rows: number;
	/** File-level problems, e.g. an expected column that is not in the header. */
	problems: string[];
}
