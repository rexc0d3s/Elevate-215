# School Data Dashboard — Spec v1: Reconcile Check

## Goal

Build a simple dashboard for Elevate 215 that brings school performance information and school visit/update notes into one place so Stacy can quickly review the latest information for each school.

## Input

Excel spreadsheets provided by Renée containing information such as:

- School names
- Performance metrics
- Results and numbers
- Dates
- Statuses
- School visit notes
- School updates

The attached/sample spreadsheets are the source of truth.

## Output

An organized dashboard where each school has a clear view of:

- School name
- Performance metrics
- Results/numbers
- Date of the information
- Current status
- Latest school update
- School visit/notes
- Missing information
- Potentially outdated information

Information that is missing, incomplete, or outdated is clearly flagged, never filled in.

## Reconciliation Rules

The dashboard must preserve the source data exactly.

1. **Do not change numbers.**
2. **Do not change dates.**
3. **Do not rename or alter school names from the source.**
4. **Do not rewrite or paraphrase notes.**
5. **Do not invent missing information.**
6. **Do not infer a status that is not explicitly provided.**
7. **Do not drop records, schools, metrics, dates, or notes.**
8. **If multiple updates exist, preserve them rather than silently replacing older information.**
9. **If information conflicts between source files, flag the conflict instead of choosing one value.**
10. **Keep the source and dashboard traceable so a user can verify where each piece of information came from** (e.g., source file, sheet, and row).

## Reconcile Check

The dashboard includes a validation/reconciliation check that compares the dashboard against the original spreadsheets.

The check identifies:

- Missing schools
- Missing metrics
- Missing numbers/results
- Missing dates
- Missing statuses
- Missing notes
- Changed values
- Changed dates
- Changed school names
- Duplicate records
- Conflicting information between source files
- Potentially outdated information

Each issue is clearly flagged for review.

### Reconciliation Status

The dashboard shows an overall result:

- ✅ **Match** — dashboard matches the source exactly
- ⚠️ **Needs Review** — missing, duplicate, conflicting, or outdated information
- ❌ **Mismatch** — a dashboard value differs from the source

### Flagged Items

Every flagged item is listed in a table like:

| School   | Field      | Source   | Dashboard | Issue       |
| -------- | ---------- | -------- | --------- | ----------- |
| School A | Attendance | 91%      | 89%       | ❌ Mismatch |
| School B | Visit Date | 09/12/26 | —         | ⚠️ Missing  |
| School C | Status     | On Track | On Track  | ✅ Match    |

## Done When

> **Every school, number, date, status, and note in the dashboard matches the source files exactly. Nothing is changed, guessed, paraphrased, or dropped.**

The reconciliation check shows whether the dashboard matches the source data and identifies any discrepancies that still need review.
