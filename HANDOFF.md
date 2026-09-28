# Handoff — 2026-09-29 00:38

## Read first
CLAUDE.md → the new **"Asset-register listing layer"** bullet in Structure, then the block of Key-context bullets from **"Asset-module listings are the ticket data-grid"** down to **"Gantt/Calendar record card (EventTip) is CURSOR-anchored"** — those seven bullets document everything built this session. The **Projects** Structure bullet is also new (that module existed but had never been written down).

## What we worked on this session
Rebuilt all six asset/procurement listing pages on the ticket data-grid, gave Hardware + those six registers real asset-flavoured **dashboards**, then did a long polish pass on the shared listing grid (unread dots, open-in-new-tab links, layout pinning, KPI-strip cleanup) and on the Gantt/Calendar record card.

## Completed
- **Six register listings rebuilt** — `AssetRegisterPage` (shared chrome) + thin `SoftwareAssetsListingPage` / `NonItAssetsListingPage` / `ConsumableAssetsListingPage` / `SoftwareLicensesListingPage` / `ContractsListingPage` / `PurchasesListingPage`. Each has its own columns, KPI strip, saved-views catalog/store, and opens its real drawer through DrawerStack. Old `XListPage` files are now data/type sources only.
- **Asset dashboards** (`AssetDashboardView`) on Hardware + all six registers: donut / stacked bar / gradient area / Recharts columns / bar rows / gauge, every segment drilling into the filtered list with a breadcrumb back, "View all ›" → `BreakdownPanel`, and a real **OpenStreetMap** map view on Hardware's "Assets by location".
- **Grid polish** (shared, so every listing got it): editable **Used By** multi-user picker; manage-columns gutter removed; ID hover-peek behind `ID_HOVER_PEEK`; attention badge replaced by the **role-coloured unread dot** (pulse ring + 5% row tint, cleared when the record is opened); **open-in-new-tab** icon link on rows and on the drawer tab hover card, with `?page=&open=` deep links.
- **KPI strips made uniform** — gauges and trend chips removed everywhere; "SLA compliance %" → **"SLA breached"** count; Penalty-exposure card dropped.
- **Layout picker** — order is now List + KPI first; each tile has a **pin** that stores a per-module default layout; Kanban removed from Change/Release, Dashboard removed from Requests.
- **Views rail** — Predefined tab removed (lock marker in place), favouriting moved into the row ⋮ menu with the star as a leading state marker, menu widened so labels don't truncate.
- **Release Gantt** — rail readiness meter → stage · status chip (right-aligned, tooltipped); Readiness band removed from the hover card; `EventTip` is now **cursor-anchored** and hoverable.

## In progress
Nothing mid-flight — the last change (cursor-anchored `EventTip` in `TicketCalendarView.tsx`) is built and verified.

**Unpublished:** everything after commit `906955f` is uncommitted — 14 modified files (`App.tsx`, `AssetRegisterPage`, `ChangeListingPage`, `DrawerStack`, `DrawerTabStrip`, `HardwareAssetsListingPage`, `ProblemListingPage`, `ReleaseListingPage`, `TicketCalendarView`, `TicketGanttView`, `TicketGridToolbar`, `TicketListPage`, `TicketTable`, `TicketViewsPanel`). Run `/publish` to ship them.

## Next steps
1. `/publish` the uncommitted work (layout pin/order, new-tab links + deep links, views-rail changes, Gantt rail chip, cursor-anchored EventTip, Kanban/Dashboard layout removals).
2. **Open question left hanging:** the row hover pill is icon-only now, but I'd suggested labels earlier — confirm whether icon-only stays or a label ("New tab") comes back.
3. Optional: the **Requests dashboard** still has two trend chips on its SLA-breached / Urgent-priority tiles — the listing strips no longer use them, so strip those for consistency if wanted.
4. Optional: adopt the dashboard's `columns` + `mapGeo` treatment on the other registers (e.g. Non-IT by location) — the machinery is generic, it's one line per section.

## Decisions made
- **One shared `AssetRegisterPage` + thin module files** instead of six full clones — the modules differ only in data, columns and KPIs, and this keeps a single behaviour set for a developer to integrate. Hardware deliberately keeps its own clone (it has drill-down + its own dashboard wiring).
- **`x_<field>` generic columns**: the row adapter pre-formats values onto the Ticket shape, so a module adds columns/filters/KPIs without touching the grid's cell switch.
- **Percentages over gauges** in KPI cards — the user wanted one card shape everywhere; the number carries the same fact in less space.
- **Dashboard scope switch hidden** on asset pages (a register is always "overall") — replaced by a byline so the toolbar row stays anchored.
- **`ID_HOVER_PEEK` flag rather than deleting** the peek card, because the user may want it back.
- **Deep link consumed once and stripped from the URL** — leaving it in place re-opened the record on every remount (that was the bug reported after pinning a layout).

## Gotchas & notes
- **`EventTip` must stay hoverable.** Its chips use CSS `CardTip`s; making the card `pointer-events-none` silently kills them. It uses a 180ms grace timer instead.
- **Radix tooltip content is safe to click** — the close-on-pointer-down handler is on the *trigger*, which is why the ↗ link inside the tab hover card works.
- **Frozen cells need the row tint** (`--row-tint`, default white) or a tinted unread row goes stripey once a column is frozen.
- **`?open=` deep links only work where wired**: Requests, Problems, Changes, Releases, Hardware and (via `AssetRegisterPage`) the six registers. Other modules would land on their listing.
- The asset dashboards read `Recharts`, already in the project (Reports module) — no new dependency. Remember `pnpm add`, never `npm install <pkg>`, if one is ever needed.
- Verification loop used all session: `npm run build` → dev-server transform check → headless Edge (`--headless=new … --dump-dom`, grep `Uncaught`). Deep links were verified this way (`?page=request&open=INC-32`, `?page=contracts&open=CON-104`).
