# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is a discovery project for Elevate 215, a Philadelphia education nonprofit, focused on the funder-reporting workflow. The question it serves is "What did my money do?". Answering it means pulling together Renée's school notes, Stacy's grant requirements and Priya's payment information.

- `README.md` and `elevate-context/` (the agent context file plus the PDF and DOCX files) are the discovery and context material. `elevate-context/Elevate_215_Agent_Context.md` separates confirmed facts from open questions. Don't invent people, systems, metrics or workflows beyond it.
- `specs/SPEC1.md` is the spec the SvelteKit app implements. `specs/SPEC.md` (Spec v2) is a more detailed rollup-only spec used by the older static dashboard.
- `app/` is the SvelteKit dashboard, and the current build.
- `dashboard/` is an earlier static prototype (`test-dashboard.html` plus `build-data.py`, which wraps the CSVs into `schooldata/*.js`). It is independent of `app/`.
- `docs/database-migration.md` is the planned move from CSV to a database. It is planned only, not built.

## Commands (run from `app/`)

```sh
npm install
npm run dev                         # http://localhost:5173
npm test                            # vitest run (tests/**/*.test.ts)
npx vitest run tests/link.test.ts   # one file
npx vitest run -t "linkName"        # tests matching a name
npm run check                       # svelte-kit sync + svelte-check (types)
npm run build                       # adapter-node output in app/build
```

There is no linter or formatter configured.

## Data rules (the core requirement)

SPEC1's definition of done: every school, number, date and note matches the source files exactly, with nothing changed, guessed or dropped.

- Cells are carried as **raw strings** from start to finish. Don't convert them to numbers or dates, and don't trim or normalize them for display. A blank shows as "No Data". `0` is a value, never missing.
- `schooldata/` is **git-ignored** and holds real school data. Never commit it, copy it into `app/`, or bundle it client-side. It is read only in server code.
- Notes and grant rows link to a school only through `schooldata/school-name-map.csv` (`Source_Name,SchoolNumber`) or through an exact, case-sensitive match to one rollup `SchoolName`. No fuzzy matching. A row that doesn't link must appear in **Unmatched records** and must never be dropped silently.
- A school page shows exactly SPEC1's output shape: Performance, Latest Update, Status, Notes, Flags. The user asked for "nothing extra".

## Architecture (`app/src/lib/server/`)

- `sources.ts` holds the file names of the four sources and every column the app expects. Column names contain em dashes, for example `PSSA Reading — PctProficient_2025`. Change file names or columns here.
- `csv.ts` is an RFC-4180 parser that returns `string[][]`.
- `csv-repository.ts` (`CsvSchoolRepository`) re-reads all the CSVs on **every call**, with no caching, so a replaced file shows up on the next page load. It:
  - builds `SchoolRecord`s keyed by SchoolNumber (a duplicate or blank number gets the key `number~rowN`),
  - attaches notes and grants using `link.ts`,
  - sorts notes newest `Visit_Date` first,
  - collects `Flag`s.
- `flags.ts` has the flag rules:
  - **Missing:** a blank cell.
  - **Outdated:** a rollup column with a year suffix older than the current school year, with a July 1 rollover. `_2025-26` means school year 2025-26. `_2025` means test year 2025, which is school year 2024-25.
  - **Problem:** an unreadable date, a duplicate ID, or a row with the wrong cell count.
- `repository.ts` defines the `SchoolRepository` interface and `getRepository(env)`, which picks the implementation from `DATA_SOURCE` (only `csv` exists). `index.ts` wires it to `$env/dynamic/private` (`SCHOOLDATA_DIR`, default `../schooldata`). Pages call `repo()` and never touch files. A future `DbSchoolRepository` plugs in here.
- Routes: `src/routes/+page.*` is the list, search box and Unmatched block. `src/routes/school/[key]/+page.*` is one school's page. The school page's `+page.server.ts` passes the column lists to the Svelte page, because `.svelte` files can't import `$lib/server`.

## Tests

- `tests/fidelity.test.ts` reads the real `../schooldata/` files with a separate plain-split parser, then compares them cell by cell with the repository. It skips when the data isn't present. It pins today's date to 2026-09-30 and asserts some current facts:
  - 301 schools,
  - all 3 sample notes and all 3 grants unmatched,
  - AD PRIMA CS (7825) values.

  Update those expectations if the source files change.
- The name-map scenario is tested by copying the CSVs into a temp directory together with a generated map file.
- `tests/link.test.ts` covers the linking rules, the parser and the flag rules.

## Style

- Svelte 5 runes mode: `$props`, `$state`, `$derived`, and snippets.
- Tabs for indentation.
- The brand color is navy `#0e2a68` (`--brand`), with white.
