# Handoff — 2026-07-29 01:47

## Read first
CLAUDE.md `## Structure` → the new **Vulnerability** bullet (two listing pages + two drawer clones + the flyout), and `## Key context` → the **Deployment tab has THREE views** and **Deployment Topology View** bullets — the topology canvas is the big new artifact and its bullet encodes all the iterated rules (group-only leaf nodes, 4-color delivery edges, lane routing, hover/panel behavior). The V2 rule still stands ("version 2" asks → `TicketDrawerV2.tsx` only).

## What we worked on this session
Built the **Vulnerability module** (sidebar icon + flyout, Vulnerabilities listing + drawer clone, Detected CVEs listing + drawer clone) and then the **Deployment Topology View** — a third view of the shared Deployment tab: a horizontal React Flow canvas of the patch-distribution architecture across 5 scenarios, iterated heavily per user direction (group leaf nodes, status-colored edges with delivery semantics, lane-routed Internet links, hover cards + endpoint side panel, search/filter/fullscreen/keyboard).

## Completed
- **Vulnerability sidebar module**: `IconVulnerability` (user-provided shield SVG) placed before the Patch icon; flyout = Vulnerabilities (page) · Detected CVEs (page) · Endpoint (placeholder by explicit request — must NOT link to the Patch module's page).
- **Vulnerabilities listing** (`VulnerabilitiesListPage/Table`): "Detected Vulnerability Patches" view, PCH ids, Exploited/Non-Exploited CVEs, CVSS, Impacted Endpoints; **`VulnerabilityDrawer`** = 1:1 `PatchDrawer` clone (separate file, `vulnerabilityToPatchShape`, StackModule `'vulnerabilities'`).
- **Detected CVEs listing** (`DetectedCvesListPage/Table`): real 2024 Patch-Tuesday CVEs, tinted severity pills, CWE/exploit/status columns; **`DetectedCveDrawer`** = 1:1 `PatchDeploymentDrawer` clone (`cveToPatchShape`, StackModule `'detected-cves'`).
- **Superseded map**: bus-label tooltip now triggers on the whole pill (was icon-only).
- **Deployment tab**: segmented **Card · List · Topology** toggle + **Full screen** overlay button (all views); topology mode gets the compact Ctrl+F node search + the list-view status Filter pill (spotlight/fade semantics).
- **`DeploymentTopologyView.tsx`** (new, ~800 lines): 5-scenario picker; ServiceOps → Main FS → DS → endpoint-GROUP columns with Internet lane above; fixed-height centered cards; straight same-row edges; 4-status edge colors with delivery semantics (group mix → any success = green, red only when ALL failed; Waiting servers inherit downstream `subtreeFlow` evidence; ServiceOps→MainFS always green); no fallback edges; double-arrow Internet links routed via custom `LaneEdge` through free corridors; node hover card (anchored, hover-persistent, group Endpoints-by-Status + full-width "View all endpoints" strip) → `GroupEndpointsPanel` side popup (pills/chip/search/grid, data matches `endpointStats` exactly); keyboard shortcuts + ⌨ popup; CMDB-style d-pad + grouped zoom/fit/reset cards; live-measured full-height canvas.
- **SHORTCUTS.md** §4 added for the topology canvas.
- `npm run build` clean throughout (last bundle `index-BMFYkhoI.js`). Dev server may still be running (`npm run dev`, background task bg1y62apb).

## In progress
Nothing mid-flight. All requested topology iterations are applied and built.

## Next steps
- **Publish** — everything after commit `21d107d` is unpushed: the whole Vulnerability module (both listings + both drawer clones), the superseded pill tooltip, and the entire Deployment Topology View + toolbar changes + SHORTCUTS.md §4.
- Await Vulnerability/Detected-CVE detail-page change lists (both drawers are still raw clones).
- Endpoint-page leftovers from earlier still pending user re-spec: Vulnerabilities tab, Overview Deployments gauge (old clone data), Audit Trail content, static right-panel values.

## Decisions made
- Topology leaf nodes are endpoint **GROUPS** (Local Office default) — individual endpoints only appear in the side panel, because real tenants have too many machines for the canvas.
- Edge color = **delivery evidence**, not raw target status: mixed groups stay green (endpoint-local failures like shut-down machines must not redden the path); red into a group ⇒ ALL endpoints failed; Waiting servers inherit downstream success/progress; ServiceOps→Main FS always green (management link).
- Fallback (cached-path) edges were **removed entirely** — many remote offices would each add a dashed line; the cache rule lives on the Main FS card text instead.
- Internet links use a custom `LaneEdge` (top lane → inter-column corridor → target's left) because default smoothstep dropped lines behind stacked cards.
- Fixed per-kind card heights + center-based rows so connectors hit exact node centers AND same-row lines stay horizontal (two prior approaches — estimates-only, then header-pinned handles — each satisfied only one of the two).
- Detected CVE drawer clones the **Patch Deployment** drawer (user's explicit choice), not the Patch drawer.

## Gotchas & notes
- `DeploymentTopologyView` measures canvas height as `window.innerHeight - wrapper.top` (rAF after layout; re-measured on resize + fullscreen toggle). A fixed calc() left a bottom gap — don't reintroduce one.
- The topology Filter pill REUSES `STATUS_FILTER_OPTIONS` from the list view; on canvas, "Yet to Receive" maps to Pending/Waiting in the matcher.
- Group cards carry `status` in data but deliberately do NOT render it (chips + stacked bar instead); the hover card also skips the Status row for groups and the whole card for Internet.
- `LaneEdge` corridor math assumes the COL_X gaps stay ≥ ~110px wide and the Internet card's center x sits in the col1–col2 gap; `data.lane` staggers parallel edges by 10px.
- The hover card is hover-persistent (180ms grace, card cancels hide on mouseenter) so its "View all endpoints" strip is clickable — don't revert it to `pointer-events-none`.
- `gh` CLI not logged in; pushes work via Windows credential manager; publish verification = poll the live URL for the exact bundle hash.
