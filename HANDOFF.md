# Handoff — 2026-07-13 01:29

## Read first
Two updated/new `CLAUDE.md` bullets: **"Asset Relationship tab = React Flow topology"** (now in all 5 drawers; new "Expand direction" + "Mock profiles" facts at the end) and the new **"CMDB detail page is MAP-FIRST"** bullet (Dependency Map / CI Details toggle, Running Process tab, removed tabs).

## What we worked on this session
Ported the Relationship topology to the remaining 4 detail pages (Software, Non-IT, Consumable, CMDB), then rebuilt the CMDB detail page as **map-first** (lands on a full-bleed Dependency Map with a header toggle to classic CI Details), added a **Running Process** tab, gave the CMDB map realistic CI names + varied relation labels, and fixed the expand-direction/overlap issues in the shared layout engine.

## Completed
All of this builds clean and is headless-verified, but is **UNPUBLISHED** (last live commit `c6df6e2`):
- **Topology port**: the Hardware Relationship block (356-line IIFE + rel* states + hotkey effect) node-sweep transplanted into `SoftwareAssetDrawer`, `NonItAssetDrawer`, `ConsumableAssetDrawer`, `CmdbDrawer`; `RelSliderRow` extracted to a shared file (`RelSliderRow.tsx`, NEW) and Hardware refactored to import it.
- **CMDB map-first layout**: `ciView 'map'|'details'` (default map, reset per CI), header segmented toggle **Dependency Map / CI Details**, map = `renderRelationshipMap()` (hoisted old IIFE), details content hidden-but-mounted (`display:none`), tab-overflow re-measures on view switch, topology hotkeys keyed to map view, tab-memory guards vs the removed `'relationship'` tab.
- **CMDB tabs**: removed **Baseline + Financials + Relationship**; added **Running Process** (after Software): searchable standard table over the `RUNNING_PROCESSES` mock.
- **CMDB realistic relations**: `RelNodeInput.rel` + `mockProfile="cmdb"` (`cmdbChild()` in `RelationshipGraph.tsx`) → CI-style names (PRDC-ESX-02, MS SQL Server 2022, PROD-DB-CLUSTER…) with matching relations (Hosted On/Depends On/Connected to/Send Data to/Impacted By/Used By/Users…) at every depth; first-level `nodes` in `CmdbDrawer` carry explicit `rel`s; grid view shows them too. CMDB-only (other drawers unchanged).
- **Layout engine fix (shared — all 5 drawers)**: expanded sub-groups now open AWAY from their parent — away-side arc seeding + outward-cone constraint (±83°, runs before collision each iteration so overlap-resolution always wins) + stronger final leaf de-overlap (30 iters). Stress-verified: 86 nodes, 0 overlapping pairs, all first-level groups open exactly outward.

## In progress
Nothing mid-flight — the batch above just needs `/publish`.

## Next steps
- **Run `/publish`** (5 drawer files + `RelationshipGraph.tsx` + new `RelSliderRow.tsx` + `CLAUDE.md`/`HANDOFF.md`).
- Possible next: real API hookups for the mocks (`genChildren`/`cmdbChild`, `activeIssuesFor`, `RUNNING_PROCESSES`, Add Relationship record lists — all deterministic and designed to swap cleanly).

## Decisions made
- **CMDB is map-first** (user + competitor review: ServiceNow "Dependency Views", Freshservice "View Relationship Map"): the map is the CI's landing experience; "CI Details" is the secondary layout. Toggle = always-visible segmented control, not a swapping single button.
- **CMDB has no Relationship tab** — the map replaces it; Baseline/Financials also dropped (asset-financial concerns don't belong on CIs).
- **Direction is a bias, overlap-freedom is a guarantee**: the outward-cone constraint runs before the collision pass in each physics iteration, so crowded groups may slide sideways into whitespace but can never flip inward, and nodes never pile up.
- Keep the details content mounted (hidden) in map view so tab/scroll state survives toggling.

## Gotchas & notes
- **Hidden-strip measurement**: anything measuring itself (`calculateTabOverflow`) reads width 0 while `display:none` — that's why `ciView` is in its dep array. Same trap applies to any future hidden-but-mounted layout.
- Direction tests on groups of **6+ children are meaningless via centroid** — they legitimately ring the node fully (2π/n < the 1.15-rad arc cap); check the HUB's angle instead.
- The IDE's bogus `react/jsx-runtime` TS error persists (pnpm types) — `npm run build` is the source of truth.
- Headless CMDB nav: `button[title=CMDB]` in the sidebar (the assets flyout does NOT contain CMDB).
- The transplant scripts live in the session scratchpad (`transplant.js`) — same approach if another drawer ever needs the topology.
