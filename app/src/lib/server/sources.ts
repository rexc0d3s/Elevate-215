/** The source files the dashboard reads, and the columns it expects in each. */

export const ROLLUP = {
	label: 'School Rollup',
	file: 'Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv',
	required: true
};
export const NOTES = {
	label: "Renée's school notes",
	file: 'sample_renee_school_notes.csv',
	required: false
};
export const GRANTS = {
	label: 'Funder report',
	file: 'sample_funder_report_data.csv',
	required: false
};
/** Optional, maintained by hand: links a school name used in the notes/funder files to a SchoolNumber. */
export const NAME_MAP = {
	label: 'School name map',
	file: 'school-name-map.csv',
	required: false
};

export const ID = 'SchoolNumber';
export const NAME = 'SchoolName';

export const TESTS = [
	'PSSA Reading',
	'PSSA Math',
	'Keystone Algebra I',
	'Keystone Biology',
	'Keystone Literature'
] as const;

/** The five columns shown per test, in source order. */
export const testColumns = (t: string) => [
	`${t} — N Scored_2025`,
	`${t} — PctProficient_2025`,
	`${t} — Predicted`,
	`${t} — Residual`,
	`${t} — Band`
];

export const SUMMARY_COLS = [
	'Simple Avg Residual',
	'Enrollment-Weighted Avg Residual',
	'Above Line Count',
	'Within 5 Count',
	'Below Line Count',
	'Tests With Data'
];

export const STATUS_COLS = ['Fill Tier', 'EAPI Tier', 'ExcludedSelectionCriteria'];

/** Every rollup column the school page shows (missing/outdated flags only apply to these). */
export const ROLLUP_SHOWN = [...TESTS.flatMap(testColumns), ...SUMMARY_COLS, ...STATUS_COLS];

export const ROLLUP_REQUIRED = [ID, NAME, ...ROLLUP_SHOWN];

export const NOTE_COLS = [
	'School_Name',
	'Visit_Date',
	'Metric',
	'Latest_Result',
	'Status',
	'Attendance_Result',
	'School_Update_Notes',
	'Next_Follow_Up'
];

export const GRANT_COLS = [
	'Grant_ID',
	'Grant_Name',
	'School_Name',
	'Grant_Purpose',
	'Grant_Metric',
	'Grant_Target',
	'Grant_Start_Date',
	'Grant_End_Date',
	'Amount_Pledged',
	'Amount_Received',
	'Payment_Status'
];

export const MAP_COLS = ['Source_Name', 'SchoolNumber'];
