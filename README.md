# Elevate 215 — Funder Reporting Workflow

## Overview

This project explores the **funder reporting workflow at Elevate 215** and identifies opportunities to make the process easier, faster, and less dependent on manual coordination.

The project came from a discovery process focused on understanding how Elevate 215 gathers information when a funder asks:

> **“What did my money do?”**

The research showed that the information needed to answer that question already exists, but it is spread across different people and places. The challenge is bringing those pieces together so the team can see **the whole story**.

The project now includes a working first step toward that goal: a **read-only School Data Dashboard** that brings school performance data, Renée's school notes and funder/grant information together in one place for Stacy to review.

---

## The School Data Dashboard

The dashboard is built with **SvelteKit** in the [`app/`](app/) folder and follows [SPEC1.md](SPEC1.md).

It connects three existing sources, without anyone re-entering information:

| Source | What it holds |
|---|---|
| School Rollup (PHL School Performance Model) | 301 schools: PSSA and Keystone results, predicted scores, residuals, performance bands, Fill Tier, EAPI Tier |
| Renée's school notes | Visit date, metric, latest result, status, attendance, update notes, next follow-up |
| Funder report data | Grant name and ID, purpose, metric, target, dates, amount pledged and received, payment status |

### What Stacy sees

A searchable list of every school. Each school's page shows:

* **Performance**: test results from the rollup, the latest result from Renée's notes, and each grant's metric and target
* **Latest Update**: the most recent visit date, update and next follow-up
* **Status**: Fill Tier, EAPI Tier, exclusion status, the note's status and each grant's payment status
* **Notes**: every note connected to the school
* **Flags**: anything that is **missing**, **outdated** (from an older reporting year) or has a **data problem**

### How it protects the information

* **Nothing is changed, guessed or dropped.** Every value appears exactly as it does in the source file, and blanks show as "No Data", never as 0.
* **Every value can be traced back to where it came from**: each section shows the source file and row.
* **Schools are matched carefully.** The notes and funder files name schools, but don't give a School Number. A row is connected to a school only when the name matches exactly or appears in a small name map. Anything that can't be matched is listed under **Unmatched records** instead of disappearing.
* **School data stays private.** The `schooldata/` folder is git-ignored and is read only by the server, never published.
* **Tests check the data**: they compare every school, number, date and note in the dashboard against the source files.

### Running it

```sh
cd app
npm install
npm run dev     # open http://localhost:5173
npm test        # check the dashboard against the source files
```

Place the source CSV files in `schooldata/` first (see [app/README.md](app/README.md) for the file names).

### What's next

* **Add a School Number** to Renée's notes and the funder sheet so every row connects to the right school automatically. The current sample files use placeholder school names, so they show as unmatched.
* **Move from CSV files to a database.** The dashboard was built so this can happen without changing the pages. The plan is in [docs/database-migration.md](docs/database-migration.md).
* **Add payment information from Priya**, the third piece of the funder story.

---

## About Elevate 215

Elevate 215 works to improve educational outcomes for Philadelphia students by increasing the number of high-quality schools.

The organization works across different parts of the education system, with a focus on understanding whether investments are **“moving the needle for kids.”**

---

## The Problem

When a funder requests an update about their investment, Stacy has to bring together several pieces of information:

* **Renée** → School performance and visit notes
* **Stacy** → Grant agreement and reporting requirements
* **Priya** → Payment and financial information

The information exists, but it does not all live together.

As Stacy explained:

> **“Each of us owns a piece, but none of us own the whole story.”**

She also described the dependency in the current process:

> **“I’m the process.”**

The actual assembly can take about an hour once all the information is available, but the process can take **about a week from start to finish** because of waiting, follow-up, gathering, and checking.

---

## Current Workflow

```text
Funder asks:
“What did my money do?”

        ↓

Stacy gathers information

        ↓

Renée
School Notes

        +

Grant Agreement

        +

Priya
Payment Information

        ↓

Wait for missing pieces

        ↓

Stacy connects the information

        ↓

Reviews + checks information

        ↓

Writes response

        ↓

Funder receives report
```

### Main friction points

* Information is spread across multiple people and systems
* Stacy has to coordinate the different pieces
* The workflow depends on people responding before the process can move forward
* Information may need to be checked for freshness
* There is no single place to see the full story
* The process can take about a week even though the actual assembly takes about an hour

---

## Proposed Workflow

The proposed solution does **not** remove the people who own the information or take human judgment out of the process.

Instead, it focuses on connecting the existing information so the team can review it together.

```text
Funder asks:
“What did my money do?”

        ↓

Grant + School + Payment
information comes together

        ↓

Information is reviewed
for freshness

        ↓

Outdated / missing information
is flagged

        ↓

If someone is unavailable:
→ Alert the team
→ Update the information
→ Use the most recent available information
→ Reroute review when needed

        ↓

Stacy reviews the whole story

        ↓

Stacy uses her judgment
+ writes response

        ↓

Funder receives report
```

---

## What Changes?

The biggest change is the shift from:

**“Where is this information?”**

to:

**“Here’s the information I need. Now I can review it and respond.”**

Instead of Stacy spending her time chasing down information from Renée, Priya, and others, the relevant information can be brought together for review.

The system could also:

* Flag information that has not been updated within a set amount of time
* Alert the appropriate person when an update is needed
* Help the team use the most recent available information when someone is unavailable
* Reroute a review if Stacy is unavailable
* Keep the human review and decision-making process in place

---

## Expected Impact

### Less Waiting

The current process can take approximately **one week from start to finish**.

The proposed workflow focuses on reducing the waiting and coordination between each piece of information.

### Less Dependency

The workflow currently depends heavily on Stacy coordinating information from different people.

The goal is to make the process easier for the entire team to navigate without requiring Stacy to personally hold all the pieces together.

### Easier Review

Stacy can focus on:

* Reviewing the information
* Using her judgment
* Understanding the full story
* Determining whether the investment is **“moving the needle for kids”**
* Responding to the funder

---

## Discovery Questions

Several questions still need to be confirmed with the people who own each part of the workflow before the dashboard goes beyond sample data.

### Renée

What makes a school note complete and current?

### Priya

How is payment information matched to the correct school and grant?

### Stacy

What exact information needs to be visible together before a funder response is considered ready?

These questions help make sure the solution reflects the actual workflow rather than assumptions about how the team works.

---

## Project Focus

This project focuses specifically on **funder reporting**.

Other workflows were explored during discovery, including:

### Board Deck

The board deck includes recurring manual work and financial information that can change, but the process is predictable and scheduled.

### Index & School Data

Attendance and other public school data may only be released periodically, which can cause information to become stale.

Funder reporting was selected because it showed the clearest gap between **having the information** and being able to **see the whole story when it is needed**.

---

## Key Takeaway

The information needed for funder reporting already exists.

The opportunity is to make it easier to **connect the pieces, identify what needs attention, and get to the whole story without unnecessary waiting and coordination.**

The goal is not to replace the people doing the work.

**The goal is to make their work easier.**

---

## Project Deliverables

* Discovery research
* Interview notes
* Workflow analysis
* Current-state workflow map
* Proposed future-state workflow
* Scope document
* Presentation
* Proposed solution and improvement opportunities
* Dashboard specs ([SPEC1.md](SPEC1.md) and [SPEC.md](SPEC.md))
* School Data Dashboard (SvelteKit) with source-matching tests
* Database migration plan

---

## Repository Contents

| Path | What it is |
|---|---|
| [`app/`](app/) | The School Data Dashboard (SvelteKit) |
| [`SPEC1.md`](SPEC1.md) | The spec the dashboard follows |
| [`SPEC.md`](SPEC.md) | Spec v2, a more detailed spec for the school performance data |
| [`docs/database-migration.md`](docs/database-migration.md) | Plan for moving from CSV files to a database |
| [`dashboard/`](dashboard/) | An earlier single-file prototype of the dashboard |
| `Elevate_215_Agent_Context.md` | Discovery context: people, workflows, systems and open questions |
| `*.pdf`, `*.docx` | Scope document, current workflow and solution proposal |
| `schooldata/` | Source data files (kept local, not in the repository) |

---

## Author

**Bianca Ruiz**

AI Foundations / Launchpad Philly

September 2026
