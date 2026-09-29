# School Data Dashboard — Spec v2

## Purpose

Build a simple, read-only dashboard for Elevate 215 that brings school performance and school-level information into one organized view, allowing Stacy to quickly review the most current information available for each school.

## Input

The dashboard will use the School Rollup spreadsheet as the primary school-performance data source.

The source currently contains 301 schools and includes:

**School identification**
- AUN
- School Number
- District Name
- School Name
- School Type
- Grade Span

**Student population**
- % Black/Hispanic
- % Low Income
- Current Enrollment
- Authorized Enrollment Cap
- Unused Seats

**Performance data**
- PSSA Reading
- PSSA Math
- Keystone Algebra I
- Keystone Biology
- Keystone Literature

**Performance calculations**
- Number of students scored
- % proficient
- Predicted proficiency
- Residual
- Performance Band

**School-level performance summaries**
- Simple Average Residual
- Enrollment-Weighted Average Residual
- Above Line Count
- Within 5 Count
- Below Line Count
- Tests With Data

**School classifications**
- Fill Tier
- EAPI Tier
- Excluded Selection Criteria

## Dashboard Structure

The dashboard should have a master school index that uses the SchoolNumber as the primary school identifier.

Each school should have its own view/card containing:

### School Overview
- School Name
- School Number
- AUN
- School Type
- Grade Span
- District

### Student & Enrollment Information
- Current Enrollment
- Authorized Enrollment Cap
- Unused Seats
- % Black/Hispanic
- % Low Income

### Academic Performance
- Reading: Actual % Proficient
- Reading: Predicted %
- Reading: Residual
- Reading: Performance Band
- Math: Actual % Proficient
- Math: Predicted %
- Math: Residual
- Math: Performance Band
- Keystone results when applicable

### Overall Performance
- Simple Average Residual
- Enrollment-Weighted Average Residual
- Above Line Count
- Within 5 Count
- Below Line Count
- Tests With Data

### School Status / Classification
- Fill Tier
- EAPI Tier
- Excluded Selection Criteria

## Data Handling Rules

The dashboard must preserve the source data exactly.

- Do not change, estimate, or invent values.
- Do not replace missing values with guesses.
- Missing data should be displayed as "No Data" or another clearly defined missing-data indicator.
- A missing value should not automatically be treated as zero.
- Performance bands should be displayed exactly as provided by the source.
- School names should remain exactly as they appear in the source.
- School Numbers should be used to distinguish schools with the same or similar names.
- The dashboard should preserve the distinction between 0, blank/missing, and not applicable.
- Schools marked ExcludedSelectionCriteria = True should remain visible but clearly identified as excluded.
- Keystone metrics should only appear as available when the source contains data for that school.

## Filtering / Navigation

Stacy should be able to quickly find a school using:

- School Name
- School Number
- AUN
- School Type
- Grade Span
- EAPI Tier
- Fill Tier
- Performance Band
- Excluded Selection Criteria

The dashboard should allow Stacy to select a school and see its complete available record without having to search through the original spreadsheet.

## Missing / Outdated Information

The dashboard should clearly flag information that is:

- Missing from the source
- Not applicable to the school
- Excluded by the source's selection criteria
- From a different reporting year

The dashboard should not create its own interpretation of whether a school is "good" or "bad." It should display the source's actual measurements, residuals, bands, and classifications.

## Future School Notes Integration

The dashboard should be designed so that Renée's school visit/update notes can eventually be connected to the same school record.

When notes are added, they should connect to the school using the same SchoolNumber/school identifier rather than relying only on the school name.

Each note should retain its original:

- School
- Date
- Note/update
- Source/person
- Status, if provided

This allows performance data and qualitative school updates to be viewed together without changing the original information.

## Read-Only Design

The dashboard is intended primarily as a viewing layer, not a replacement for the systems Elevate 215 already uses.

The goal is:

> Existing school data → dashboard → Stacy views current information

Rather than requiring Stacy or Renée to manually re-enter information into the dashboard.

## Definition of Done

The dashboard is complete when:

- Every school in the source is represented.
- Every school has a unique school identifier.
- School information matches the source exactly.
- Performance numbers match the source exactly.
- Missing values are preserved and clearly identified.
- Performance bands and classifications match the source exactly.
- Filters allow Stacy to locate schools quickly.
- Selecting a school displays its complete available information.
- No values are guessed, calculated differently, renamed, or silently dropped.
- The structure allows future school visit/update notes to connect to the correct school record.
- The dashboard can function as a read-only view of information already maintained in Elevate 215's existing data sources.
