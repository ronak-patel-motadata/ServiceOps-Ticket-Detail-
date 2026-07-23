# Handoff — 2026-07-23 17:10

## Read first
CLAUDE.md `## Key context`: the **six new Patch bullets** (Patch detail page / Overview / Endpoint / Vulnerabilities / **Superseded map** / Pagination) — the Superseded bullet documents the two React Flow gotchas you WILL hit if you touch that tab. Also the **Close-button standard**, **toast colors**, and **tooltip `text-balance`** bullets — they're product-wide conventions now. `SHORTCUTS.md` gained **§3 Patch Superseded map**.

## What we worked on this session
Finished the Patch Overview KPI row (View-more links, single-type Affected Products, 50/50 preview cards with copy/download), then **rebuilt the Superseded tab three times by user direction** — flat timeline → static SVG tree → full **React Flow bidirectional supersedence map** with complete CMDB Dependency-Map parity (pan/zoom/d-pad/fit, expandable recursive children, fullscreen, expand-all, keyboard shortcuts + cheat sheet, measured hover cards, bus-label info tooltips). One `/publish` ran mid-session (commit `fc779d7`).

## Completed
- **Overview KPI cards:** bare chevrons → "View more ›" links; **only the link navigates** (cards are plain divs, hover border removed); Affected Products + Files are half-width (6-track grid, `col-span-3`) with the first 2 records inline + "+N more ›" (count moved out of the card body); Files rows have working **Copy link / Download** (also wired the File Details panel's inert buttons); `Language:` label added.
- **Affected Products single-type:** `PATCH_AFFECTED_PRODUCTS` is now all-OS (10 Windows editions); panel states the type once in its header; row badges / split bar auto-return only if data ever mixes.
- **Superseded tab (`PatchSupersededTab`, fully rewritten):** center patch card, Superseded By UP (green) / Superseded DOWN (gray), rectangle nodes w/ KB + shortTitle + build inside, elbow edges, recursive deterministic children (`buildTrees`, depth 3) with count badges — click expands + zoom-focuses, **minus badge is the only collapse**; tidy-tree layout; toolbar search (highlight/dim) + Expand/Collapse-all + Fullscreen (fixed overlay + refit signal); d-pad/zoom/fit/keyboard-popup canvas controls; canvas keys ↑↓←→ +− F R, tab keys Ctrl+F / Ctrl+Shift+F / E; CMDB-style hover card with `useLayoutEffect` height re-measure; bus labels got Info-icon tooltips (copy rewritten for the tree design — no more "This tab…").
- **Published mid-session** (`fc779d7`): everything up to the Language-label change is live. Verified by polling for the new bundle hash, not just HTTP 200.
- `SHORTCUTS.md` §3 added; CLAUDE.md gained the Patch module documentation (Structure bullet + 10 Key-context bullets).

## In progress
Nothing mid-flight. Everything builds (`npm run build` clean, last bundle `index-DYC7gVQp.js`).

## Next steps
- **Publish** — all Superseded-map work after `fc779d7` (React Flow rebuild, cards-in-nodes, expand/collapse, fullscreen, shortcuts, hover cards, tooltips) is **unpublished**; live URL still serves the older build.
- Optional pagination coverage (user chose "auto-hide when it fits", never answered whether to continue): wrap License (Allocation/Installation/User Allocation/Attachments), Purchase (Items, Settlements), Software Asset (Consolidated/Installation), and the ~40 History tables in `Paginated`.
- Flagged cleanups in PatchDrawer: unused `AssetAiSummary` import, unused `showBarcodeMenu`/`showQrMenu` state; right-panel "Patch Category: Updates" / "KB Number: ---" hardcodes can disagree with the header chips.

## Decisions made
- **Superseded node color = direction, not severity** (green = newer/Superseded By, gray = older/Superseded); severity kept in the hover card only.
- **Click never collapses** a node (expand + zoom-focus only); collapse is minus-badge-only — matches CMDB map.
- Built a purpose-built React Flow canvas instead of reusing `RelationshipGraph` (it can only fan children downward; supersedence needs both directions).
- Long patch titles → nodes show `shortTitle()` (release month + type, boilerplate stripped); full title in hover card.
- Fixed `text-balance` blank-space at the two call sites, NOT in the shared tooltip component (global change would reflow every reviewed tooltip).

## Gotchas & notes
- **React Flow v12 pointer-events trap:** non-draggable + non-selectable nodes are click-transparent unless a canvas-level `onNodeClick` is registered. Card-level onClick alone silently never fires (also kills hover tooltips). Handle clicks at canvas level; badge buttons `stopPropagation` to avoid double-toggles.
- **Map tab must not scroll:** PatchDrawer's content wrapper conditionally becomes `flex-1 min-h-0 overflow-hidden flex flex-col` for `activeMainTab === 'superseded'` — using `h-full` inside the scroller over-resolved and clipped the bottom d-pad.
- React Flow does NOT refit on container resize — fullscreen toggle needs the explicit `fitSignal` refit.
- Hover-card placement needs real measured height (`useLayoutEffect`) — fixed estimates break on wrapped titles and the card overlaps its node.
- Shared `TooltipContent` has `text-balance`; override with `text-wrap` (tailwind-merge) when tooltip text wraps.
- Scripts in `PatchSupersededTab` use explicit-arg `new Date(y,m,d)` (fine) — argless Date/`Math.random` are banned in Workflow scripts only, but the mock chain is hash-deterministic anyway so renders are stable.
- `gh` CLI is **not logged in** on this machine — `/publish` works because git push uses the Windows credential manager; `gh auth login` needed only for Actions debugging.
