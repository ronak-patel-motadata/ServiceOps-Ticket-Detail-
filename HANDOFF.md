# Handoff — 2026-09-17 19:27

## Read first
CLAUDE.md → the **Listing layer** bullet in Structure, then the six new Key-context bullets from **"Per-module saved-view stores"** down to **"Patch-script hygiene"** — they document everything this session built (Change/Release listing modules, calendar schedule windows, the Gantt view, readiness). The older Ticket-listing data-grid bullets cover the shared grid these pages ride on.

## What we worked on this session
Promoted the Views-Lab listing recipe into two real modules — the **Change listing** and the **Release listing** — then grew the calendar into a schedule-window view (Outlook-style spans) and built a hand-rolled **Gantt view** for releases with stage-derived readiness.

## Completed
- **Change listing** (`ChangeListingPage`, routed): all five layouts over real `mockChanges`; change-named view catalog with its own storage; "request→change" noun sweep via opt-in `noun` props on every shared component; Similarity group-by gated to requests.
- **Release listing** (`ReleaseListingPage`, routed): same clone over `mockReleases` (grown to 30) + the **Gantt** sixth layout.
- **Schedule windows**: `changeScheduleOf/changeImpactOf` and `releaseScheduleOf/releaseImpactOf` — one deterministic source shared by detail pages (ChangeDrawer Planning tab seeds from it), calendar, rail, tooltip and Gantt. Releases run a May–July 2026 "release train" (2 days→3 weeks).
- **Calendar**: month spanning bars w/ lane packing + "+N more"; week bars stretch from start-hour across days; day view "All day" shelf; mini-month navigation; every grid date drills into Day view; redesigned rail cards (SLA accent, clock line, clamped impact).
- **White hover card (`EventTip`)**: Superseded-card styling, corner avatar, stage-aware status chip, single-row chips w/ adaptive card width, tinted **Readiness band** ("38% — 3 of 8 stages complete", red "blocked" on failed review) — shared by both calendars and the Gantt.
- **Gantt**: frozen 280px rail + sticky header, two-axis scroll, 64px-min day columns, 76px rows with full-width readiness meters, SLA-toned range-labelled bars, row-hover wash.
- **Fixes**: filter white-screen (undefined `noun` in `AttrPicker`), impact line-clamp vs `block` display conflict, nested-Radix tooltip flicker (replaced with in-card CSS `CardTip`), tooltip chip row wrapping.
- Published three times this session; last deploy `4867228` verified live by bundle-hash + string grep.

## In progress
**Two files are uncommitted** (work after the last publish): `TicketCalendarView.tsx` + `TicketGanttView.tsx` — the stage-arithmetic readiness (pct = stages complete ÷ ladder), the tooltip Readiness band, 76px Gantt rows. Built + verified locally; just needs `/publish`.

## Next steps
- `/publish` the uncommitted readiness work.
- Likely next asks in this thread: Gantt for the Change listing (`showGantt` is already a one-prop opt-in), milestone/diamond markers, or a readiness/gates detail popup like the reference screenshot ("What is holding it" card).
- Older, still open: sweep the `TicketTable` data-grid recipe to the remaining plain module tables; clear the unread chip on open; persist column widths; report stubs.

## Decisions made
- **Hand-rolled Gantt** (no chart library) — keeps theme/tooltips native and matches how everything else in the repo is built.
- **Readiness is pure stage arithmetic** (n/m of the module's stage ladder) after the user rejected jittered percentages that disagreed with "1 of 8 stages complete".
- **Per-module view stores** namespace localStorage; 'ticket' keeps legacy keys so existing saves survive.
- Calendar time-grids plot windows at their **start row** (no banner) per user direction — except Day view's sticky "All day" shelf for carried-over windows, which the user asked back in.
- In-card micro-tooltips are **CSS, not nested Radix** (portal flicker).

## Gotchas & notes
- `ReleaseListPage.tsx` had **mixed line endings** and a CRLF-split patch script mis-indexed and ate the file head — repaired from git HEAD (final diff purely additive). Always `split(/\r?\n/)`.
- esbuild builds don't typecheck: an undefined identifier inside a sub-component (AttrPicker's `noun`) white-screens at runtime only. The scratchpad `initcheck.mjs` catches init-order bugs but not these — a scope-audit grep was used; consider promoting it.
- `ChangeListPage.tsx`/`ReleaseListPage.tsx` are unrouted but must stay: they export the types, mock pools, and schedule/impact helpers everything else imports.
- Day-count chips in headers use real `new Date()` — the 2026-dated mock windows will eventually read as past.
