# CS 837 / CS 736 — Project Alignment & Report Guide

This document maps the **course project requirements** (Winter 2026 PDF: *CS837-736-project*) to your **React + D3** application (`d3-visualization`), and outlines what to put in your **written report** and **submission folders**. It is a companion to your existing docs in `docs/`.

---

## 1. Does this application match the course project standards?

### 1.1 Topic domain (space & time, relationship, or text)

| Course requirement | Your project |
|--------------------|--------------|
| Choose one of three domains: **space & time**, relationship, or text/document | **Space & time** — respiratory virus surveillance across **Canadian provinces/territories** (space) and **epidemiological weeks** (time). |

**Verdict:** **Aligned.** The PDF asks for analysis of provided data and clear user purpose; your `docs/project-overview.md` and `docs/user-tasks-goals.md` state a surveillance-analyst use case and tasks consistent with space–time visualization.

---

### 1.2 Step 1 — Data wrangling and preliminary analysis

| Expectation | Implementation in this repo |
|-------------|------------------------------|
| Appropriate format/structure; optional DB | **No database** — CSV loaded in-browser (`d3.csv`), aggregated in memory (`src/utils/dataProcessing.js`, `useVirusData.js`). This is acceptable when the PDF says “in other cases… complex data structure in software.” |
| Understand source and meaning of data | Documented in `docs/project-overview.md`, `src/utils/constants.js` (column names), `provinceMapping.js` (lab → province). |
| Preliminary analysis | You should still submit **separate notes** (PDF asks for a **directory** of wrangling notes). The codebase supports exploration; **your write-up** should summarize distributions, missing values, and mapping coverage. |

**Verdict:** **Implementation supports** Step 1; **submission artifact** “notes about data wrangling” must be **your own** exported notes (not only this README).

---

### 1.3 Step 2 — Users’ tasks and goals (hypotheses)

| Expectation | Implementation |
|-------------|----------------|
| Hypotheses about users, tasks, goals | Covered in **`docs/user-tasks-goals.md`** (analyst persona, three goals, three tasks, table linking views). |

**Verdict:** **Aligned** with the spirit of the milestone. For UR Courses, include a **dedicated file/folder** of “notes about hypothetical users’ tasks and goals” if the instructor expects it separate from the report.

---

### 1.4 Step 3 — Literature review (4–6 articles, approved venues)

| Expectation | This codebase |
|-------------|---------------|
| 4–6 relevant articles | **Not in code** — belongs in the **report** (Step 6). |
| Only certain publishers (IEEE TVCG/VAST/InfoVis, EuroVis, PacificVis, IV journal, CHI, etc.) | You must **select and cite** papers yourself; no automated check in the app. |

**Verdict:** **Course requirement is academic writing**, not software. Your report section “relevant literature” must satisfy this; the visualization does not demonstrate it.

---

### 1.5 Step 4 — Visualization design (sketches, storyboards, IV foundations)

| Expectation | Implementation |
|-------------|----------------|
| Sketches + storyboards, iterative | **Submit as separate directory** per PDF (“progression of sketches and storyboards”). |
| Foundations: pre-attentive variables, Gestalt, colour, Bertin/Mackinlay, data-to-ink, expressiveness/effectiveness | **Reflected in design choices** you can describe in the report (e.g. choropleth + linked line chart + heatmap; colour as magnitude; small multiples via three views). |

**Verdict:** **App embodies** a design; **PDF explicitly wants** sketch/storyboard **artifacts**. Keep scans/photos of sketches for submission even if the final UI evolved (e.g. sidebar filters, removal of chart brush).

---

### 1.6 Step 5 — Project development (programming + thoughtful use of libraries)

| Course expectation | Your stack |
|--------------------|------------|
| Appropriate language/framework | **React (Vite) + D3** — standard for custom IV coursework. |
| Libraries allowed if documented | **D3**, **topojson-client**; document in report and `README.md`. |
| “Not just defaults cobbled together” | The project uses **custom** D3: geo paths, scales, axes, zoom on map, dual-thumb week range, heatmap layout, **separate colour scales** for map totals vs. matrix cells (to avoid misleading uniform colours for counts). |

**Verdict:** **Strong fit** for Step 5, provided the **report** explains design rationale and credits libraries (see Munzner on process).

---

### 1.7 Step 6 — Project report (conference-style, 7–10 pages, ACM)

The PDF requires:

- Problem domain (users, tasks, goals)
- Relevant literature
- Proposed solution
- Case study / scenario of use
- Benefits and limitations
- ACM formatting; read Munzner’s chapter on writing IV papers

**This repository** supplies **technical content** for “proposed solution” and **scenario** material you can turn into prose; **literature** and **ACM PDF** are **your** deliverables via TurnItIn.

---

### 1.8 What to submit (UR Courses zip) vs report (TurnItIn)

From the PDF:

| Item | Suggested location in your submission |
|------|--------------------------------------|
| 1. Data wrangling / preliminary analysis notes | Folder `notes/data-wrangling/` or PDF |
| 2. Users’ tasks and goals | `docs/user-tasks-goals.md` **or** expanded notes |
| 3. Sketches and storyboards | Folder `design/sketches/` |
| 4. Source code + install/run instructions | This repo + `README.md` (+ live URL if deployed) |
| Report | **Separate** TurnItIn submission, 7–10 pages ACM |

---

## 2. How you implemented each major course theme (for the report)

Use these bullets as **starter paragraphs**; rewrite in your own words for the paper.

### 2.1 Problem domain

- **Who:** Public health / surveillance-style analyst (hypothetical), as in `docs/user-tasks-goals.md`.
- **Data:** Weekly rows with geography (`ReportingLaboratory` → province via `provinceMapping.js`), time (`week` / `date`), and per-virus test/positive columns (`constants.js`).
- **Why visualize:** Compare **where** (map), **when** (trend), and **province × week** (heatmap) under shared filters.

### 2.2 Proposed solution (system)

- **Architecture:** Frontend-only SPA; `useVirusData` loads CSV + TopoJSON, aggregates by province–week, filters by week range indices (`dataProcessing.js`, `useVirusData.js`).
- **Views:** (1) Choropleth with zoom/pan; (2) Line chart with hover tooltips; (3) Sortable heatmap with full week axis and horizontal scroll when many weeks.
- **Interaction:** Virus, metric (positives / tests / positivity), dual-thumb week range in a **sticky sidebar**; province selection links map, trend, and heatmap rows; reset clears province and full week span.
- **Colour:** **Two sequential blue scales** — one for **regional totals over the range** (map legend), one for **province × week cells** (heatmap legend), so test volume and positives show variation in the matrix (not washed out by large map totals).

### 2.3 Scenario of use (example narrative for “case study”)

1. Analyst opens dashboard, selects virus and **positivity** or **test volume**, sets week range to last 8 weeks.
2. **Map:** Identifies darker provinces (higher aggregate metric).
3. **Clicks** a province → **trend chart** shows that province’s weekly series; **heatmap** row highlights context across weeks.
4. **Heatmap:** Sorts by mean to surface provinces consistently high; scrolls horizontally if many weeks.
5. **Limitation:** No backend; large CSV is client-side only; lab→province mapping must be maintained for new labs.

### 2.4 Benefits and limitations (discussion)

**Benefits:** Linked views; no server setup; transparent mapping files; D3 control over projections and scales.

**Limitations:** Literature review and sketches are **not** replaced by code; single-user desktop assumptions; accessibility and mobile layouts are basic; generative AI policy and automated writing assistant statement apply to the **report**, not this doc.

---

## 3. Gaps to close before submission

| Gap | Action |
|-----|--------|
| Literature 4–6 papers from approved venues | Write report section with proper citations. |
| Sketches / storyboards folder | Add even if “superseded” by final UI — course asks for **process**. |
| `docs/user-tasks-goals.md` mentions brush under chart | **Outdated** — brush was removed; week range is **sidebar only**. Update that file or rely on this guide. |
| README mentions brush | Update `README.md` for accuracy. |
| ACM 7–10 pages + Munzner guidance | Draft report in LaTeX ACM template if possible. |
| AI writing assistant | If used on the report, include the **required acknowledgement paragraph** from the syllabus/PDF. |

---

## 4. Quick technical reference (file map)

| Concern | Primary files |
|---------|----------------|
| CSV columns & viruses | `src/utils/constants.js` |
| Lab → province | `src/utils/provinceMapping.js` |
| Aggregation & metrics | `src/utils/dataProcessing.js` |
| Data hook | `src/hooks/useVirusData.js` |
| Map | `src/components/CanadaMap.jsx` |
| Trend | `src/components/TrendChart.jsx` |
| Heatmap | `src/components/Heatmap.jsx` |
| Filters | `src/components/Controls.jsx`, `WeekRangeSlider.jsx` |
| Colour scales (map vs heatmap) | `src/App.jsx` (`mapColorScale`, `heatmapColorScale`) |

---

## 5. Summary table: PDF step vs status

| Step | PDF requirement | Status |
|------|-----------------|--------|
| 1 | Data wrangling + analysis notes | **Code + docs** help; **notes folder** for course |
| 2 | User tasks/goals | **Documented** in `user-tasks-goals.md` |
| 3 | Literature 4–6 (approved venues) | **Report only** |
| 4 | Sketches + storyboards | **Artifact folder** required |
| 5 | Implementation | **This app** — strong match if described well |
| 6 | Report 7–10 p., ACM | **Your writing** |

---

*This guide is based on the project handout text (CS 837/736, Winter 2026) and the current `d3-visualization` codebase. It does not replace the official syllabus, Generative AI policy, or UR Courses instructions.*
