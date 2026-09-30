# Elevate 215 School Data Dashboard (SvelteKit)

Read-only dashboard built to [SPEC1](../specs/SPEC1.md). Each school page shows **Performance, Latest Update, Status, Notes and Flags**, with every value exactly as it appears in the source files.

## Data

The server reads these files from `../schooldata/` (git-ignored, never committed) on every page load:

| File | Required | Joins to a school by |
|---|---|---|
| `Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv` | yes | `SchoolNumber` |
| `sample_renee_school_notes.csv` | no | `School_Name` |
| `sample_funder_report_data.csv` | no | `School_Name` |
| `school-name-map.csv` (`Source_Name,SchoolNumber`) | no | links a name from the notes or funder file to a SchoolNumber |

A notes or grant row is linked when its name is in the name map, or when it exactly matches one rollup `SchoolName`. Anything else is listed under **Unmatched records** on the home page. Names are never guessed or fuzzy-matched.

## Flags

- **Missing**: a blank cell, shown as "No Data". `0` is a value, not missing.
- **Outdated**: a rollup column whose year suffix (`_2025`, `_2025-26`) is older than the current school year (school years start July 1).
- **Data problems**: an unreadable date, a duplicate SchoolNumber, a row with the wrong number of cells, or an expected column that's missing.

## Run

```sh
npm install
npm run dev       # http://localhost:5173
npm test          # checks every value against the source files
npm run check     # types
```

Settings are in `.env` (copy `.env.example`): `SCHOOLDATA_DIR` (default `../schooldata`) and `DATA_SOURCE` (only `csv` is built so far).

Moving to a database is planned in [docs/database-migration.md](../docs/database-migration.md).
