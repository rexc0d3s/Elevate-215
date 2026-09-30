# Moving the School Data Dashboard from CSV files to a database

**Status:** planned. Nothing here is built yet. The dashboard reads CSV files today.

## Why the move is small

Pages never read files directly. They call `SchoolRepository` in [app/src/lib/server/repository.ts](../app/src/lib/server/repository.ts), which currently has one implementation, `CsvSchoolRepository`. Moving to a database means:

1. adding a `DbSchoolRepository` that implements the same four methods (`listSchools`, `getSchool`, `getUnmatched`, `sourceInfo`), and
2. setting `DATA_SOURCE=db` in `app/.env`.

No page or component changes.

## The rule that doesn't change

Values are stored as the **exact source text**. A blank stays blank, `0` stays `0`, `48%` stays `48%` and `2026-09-15` stays `2026-09-15`. Every value column is `TEXT`. If typed columns are ever needed for sorting or charts, add them **next to** the text columns (for example `amount_pledged_num NUMERIC`) and fill them from the text. Never replace the text columns.

## Tables

Every data table has the same two tracing columns, `source_file TEXT NOT NULL` and `source_row INTEGER NOT NULL`, so any value can be traced back to the row it came from.

| Table | Key | Columns |
|---|---|---|
| `imports` | `id` | `file`, `sha256`, `imported_at`, `row_count`: one row per file loaded |
| `schools` | `school_number TEXT PRIMARY KEY` | one `TEXT` column per School Rollup column (all 45, named as in the CSV), plus `import_id` |
| `school_notes` | `id` | `school_number` (nullable FK to `schools`), `source_school_name`, plus the 8 note columns (`visit_date`, `metric`, `latest_result`, `status`, `attendance_result`, `school_update_notes`, `next_follow_up`), plus `import_id` |
| `grants` | `grant_id TEXT PRIMARY KEY` | `school_number` (nullable FK), `source_school_name`, plus the 11 funder columns, plus `import_id` |
| `school_name_map` | `source_name TEXT PRIMARY KEY` | `school_number` (FK to `schools`) |

In `school_notes` and `grants`, `school_number` is nullable on purpose. A row that can't be linked is still stored, and it shows up as **Unmatched**, exactly as it does today.

SQLite is enough for one organization and a few hundred schools. The same schema works in Postgres if Elevate 215 later wants a hosted database.

## Import script (`app/scripts/import-csv.ts`)

1. Read each CSV with the existing `parseCsv` in [app/src/lib/server/csv.ts](../app/src/lib/server/csv.ts), so the database gets exactly what the dashboard shows today.
2. Link notes and grants to schools with the existing `linkName` in [app/src/lib/server/link.ts](../app/src/lib/server/link.ts): name map first, then exact name, otherwise unmatched.
3. Load each file in **one transaction**: insert the `imports` row, then upsert the file's rows (by `school_number` for the rollup, by `grant_id` for grants, and replace all rows from that file for notes). If anything fails, that file's old data stays as it was.
4. Stop without writing if the file-level checks fail, such as a missing expected column or a duplicate SchoolNumber. These are the same checks as `loadTable` in [app/src/lib/server/csv-repository.ts](../app/src/lib/server/csv-repository.ts).

## Checking the migration

The migration is done only when the existing fidelity test passes against the database:

- Run [app/tests/fidelity.test.ts](../app/tests/fidelity.test.ts) with `DbSchoolRepository` in place of `CsvSchoolRepository`.
- Every school, cell, note and grant must match the CSV exactly: the same 301 schools, blanks still blank, and every note and grant row either linked or unmatched.
- Compare `listSchools()` and `getSchool()` output from both repositories for every school. The results must be identical.

## Cutover

1. Run the import.
2. Run the fidelity test against the database.
3. Set `DATA_SOURCE=db`.
4. Keep the CSV files. They stay the audit source, and switching back to `DATA_SOURCE=csv` is the rollback.

## Recommended before or with the move

Add a **SchoolNumber** column to Renée's notes sheet and the funder report sheet. They identify schools only by name today, which is why the name map exists. With a SchoolNumber in the source, links become exact and the map can be retired.
