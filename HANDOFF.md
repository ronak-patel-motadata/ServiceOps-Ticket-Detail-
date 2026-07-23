# Handoff — 2026-07-24 00:07

## Read first
CLAUDE.md `## Structure` → the **Ticket detail V2** bullet (the V2-only rule lives there: "version 2" asks → `TicketDrawerV2.tsx` / `IncidentDetailsTabV2.tsx` ONLY, V1 is final), and `## Key context` → the new **Ticket detail V2 (INC-33 only)**, **Tab-strip overflow**, **Control height = 32px**, **Pagination min-items rule**, and **Onboarding tour is TICKET-page-only** bullets — those five are the durable output of this session.

## What we worked on this session
Built the **Ticket detail page V2** (a full `TicketDrawer` clone opened only by INC-33 via the new `'request-v2'` DrawerStack module) and iterated it heavily per user direction: the new **Incident Details** tab, the slimmed V2 right panel, then several **product-wide consistency sweeps** (corner radius, 32px control height, tab-strip overflow, pagination threshold, onboarding scope). Published twice mid-session (`2ef4c4a`, `fe32899`).

## Completed
- **V2 clone + routing**: `TicketDrawerV2.tsx` (data-v2 marker), `'request-v2'` in `DrawerStack`, `TicketListPage.handleOpenTicket` branches on `INC-33`. V1 verified untouched at clone time.
- **Incident Details tab** (`IncidentDetailsTabV2.tsx`): sticky pill/search/filter toolbar; pills = smooth-scroll anchors + scroll-spy (both sections in ONE scroll); functional search + All/Empty/Filled/Required filter across both sections; Ticket Fields card (7 quick fields SHARING drawer state with the right panel + moved Category/Department/Source/Location/Vendor/Support Level + full-width Tags chip editor with focus-on-Add + 2-col System Fields w/ small-view stacking); Additional Fields card (built-ins + Description + 50+ grouped custom fields, `mt-8 pt-6` separators); 16px card titles.
- **V2 right panel** (opt-in props `compactTicketFields`/`hideAdditionalFields` + `SystemFieldsRenderer twoColumn`/`hidePin`): only the 7 quick fields; removed Additional Fields accordion (own storage key), field search/filter row, pin icons (12 gated in `TicketFieldsAccordion`), Customize Layout, and the pin/search/filter hints card.
- **Consistency sweeps (ALL modules, explicit user instruction — V1 included)**: ~1,090 controls to `rounded` 4px; ~62 controls from 36px → 32px (`h-8`); tab-strip `overflow-x-clip` + computed `moreButtonWidth` (widest label + 24) in all 14 drawers; V2 overflow detection un-gated + badge-inclusive tab widths; `Pagination` hides at ≤10 items (central rule); onboarding auto-open disabled in the 12 non-ticket drawers; Patch Affected Products panel type moved to per-row sub-line.
- **Published**: everything through `fe32899` is live; work after it (pin/hints/Customize removals, onboarding scope, pagination rule, affected-products sub-line) builds clean (`index-BALwbT2f.js`) but is **NOT yet pushed**.

## In progress
Nothing mid-flight. `npm run build` clean.

## Next steps
- **Publish** the unpushed tail (everything after `fe32899` — V2 panel removals, onboarding scoping, pagination threshold, affected-products sub-line).
- Await the user's next V2 iteration on INC-33 — remember the saved memory rule (`ticket-v2-changes-only`): drawer edits in `TicketDrawerV2.tsx`, shared-panel divergence via opt-in props only.
- Still-optional older items: remaining `Paginated` coverage (License/Purchase/Software-Asset/History tables), PatchDrawer cleanups (unused `AssetAiSummary` import, barcode/QR state), right-panel Patch Fields hardcodes vs header chips.

## Decisions made
- V2 = drawer-file-only clone (user-confirmed); shared components diverge via opt-in props, never direct edits.
- Incident Details pills are scroll ANCHORS (user changed from separate sub-tab views to one continuous scroll).
- Consistency sweeps intentionally include V1 — the user's explicit "check all module detail pages" instructions supersede the V2-only rule for product-wide polish (told the user each time).
- Pagination threshold = 10 because it's the smallest per-page option (no possible page 2 at ≤10).
- More button reserves the widest label because it RELABELS to the selected overflow tab.

## Gotchas & notes
- **Sticky + `space-y`**: the Incident Details toolbar required moving `space-y-5` off the root onto a content wrapper (Tailwind v4 margin-bottom clamps the sticky pin).
- **`AuditTrailsTabContent` styles via a const string (`iconBtn`)** — className-matching sweeps miss it; also regex `\bh-\[36px\]\b` NEVER matches (no word boundary after `]`) — a whole sweep pass silently no-oped until caught.
- React Flow v12: non-draggable+non-selectable nodes need a canvas-level `onNodeClick` for pointer events (Superseded map, documented in CLAUDE.md).
- V2 tab overflow was dead because the V1 clone gated it to INC-35; also tab width estimates MUST include count badges.
- `Pagination` has no hooks, so its `totalItems <= 10 → null` early return is safe.
- `gh` CLI not logged in on this machine; pushes work via Windows credential manager.
