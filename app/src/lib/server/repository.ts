/**
 * The only way pages get school data. Today it is backed by the CSV files;
 * a database-backed implementation can be added later (see docs/database-migration.md)
 * without changing any page.
 */
import type { SchoolRecord, SchoolSummary, SourceInfo, Unmatched } from '$lib/types';
import { CsvSchoolRepository } from './csv-repository';

export interface SchoolRepository {
	listSchools(): Promise<SchoolSummary[]>;
	/** By URL key (the SchoolNumber). Returns null when there is no such school. */
	getSchool(key: string): Promise<SchoolRecord | null>;
	/** Notes and grant rows that could not be linked to a school. */
	getUnmatched(): Promise<Unmatched[]>;
	sourceInfo(): Promise<SourceInfo[]>;
}

export type RepositoryEnv = Record<string, string | undefined> & {
	DATA_SOURCE?: string;
	SCHOOLDATA_DIR?: string;
};

export function getRepository(env: RepositoryEnv): SchoolRepository {
	const source = env.DATA_SOURCE || 'csv';
	if (source === 'csv') return new CsvSchoolRepository(env.SCHOOLDATA_DIR || '../schooldata');
	throw new Error(`DATA_SOURCE="${source}" is not supported yet. Only "csv" is built.`);
}
