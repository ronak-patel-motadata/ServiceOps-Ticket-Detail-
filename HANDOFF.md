# Handoff — 2026-10-03 11:13

## Read first
In `CLAUDE.md`, the new **"The two SCHEDULE modules — Automatic Patch Test + Automatic
Patch Deployment"** bullet under Structure. It is the whole of this session's work and the
only part of the app where a row opens a **side panel instead of a detail drawer**, so the
usual `XListPage` + `XTable` + `XDrawer` pattern does not apply there.

Also worth a glance before touching shared code: the **listing-layer** bullets (the
`AssetRegisterPage` opt-in-prop convention) and the ⚠️ **patch-script hygiene** note at the
bottom of Key context.

## What we worked on this session
Finished the Automatic Patch Test panel's Analytics tab (card chrome, hover behaviour,
tooltip, per-office chart), then cloned the whole module into a new **Automatic Patch
Deployment** module — listing, side panel, data and routing. Published twice along the way.

## Completed
- **Automatic Patch Test panel — Analytics polish.** Widget cards took the dashboard's
  banded `#F8FAFC` header; donut legends highlight on hover and dim the rest; the stacked
  bar chart does the same and uses the Patch Deployment overview's dark `#111827`
  breakdown tooltip; the chart now groups by **remote office** instead of by day
  (card retitled "Patch Test Results by Remote Office").
- **Automatic Patch Test panel — Actions column.** Edit removed; the bin became a red **✕
  "Remove from this test"** (red at rest, wash on hover).
- **New Automatic Patch Deployment module**, three new files plus wiring:
  `automaticPatchDeployments.ts` (12 `APD-` schedules + filter catalogue),
  `AutomaticPatchDeploymentsListingPage.tsx`, `AutomaticPatchDeploymentPanel.tsx`.
  Routed in `App.tsx`, linked from the Patch sidebar flyout, `moduleCols: 'apd'` in
  `TicketTable`, views store `'apd'` + `APD_VIEWS` in `TicketViewsPanel`.
- **`showFilterBuilder` prop** (`AssetRegisterPage` → `TicketGridToolbar` →
  `TicketFilterBar`, default `true`): drops the "Filters" rule builder while keeping the
  quick filters and their chips. Both schedule listings pass `false`.
- **Layout-picker pin icon** bumped 12px → 14px in `TicketGridToolbar` (same 20px box, so
  nothing shifts). A larger redesign was tried first — always-visible pins, a chip for the
  pinned one, and a hint line under the tiles — and **rejected**; it is reverted, so the
  behaviour is unchanged apart from the icon size.
- Published to GitHub Pages — commits `438ed21` and `b0b9c09`. Live and verified by bundle
  hash (not just a 200).

## In progress
Nothing mid-flight. Everything above is built, built-clean (`npm run build`), driven in a
real browser over CDP and pushed.

## Next steps
- Wire the **Create Automatic Patch Deployment** / **Create** CTAs — both listings' primary
  buttons are visual-only today, as is the row Edit (it fires a toast).
- Decide whether the **APD panel grid should get the ✕ remove column** the APT panel now
  has. Left out deliberately — the product screenshot shows seven columns and no Actions —
  but the two sibling panels now differ. It is a ~4-line add.
- If the Dashboards are wanted, remove `'settings'` from `hideTools` on either listing (see
  the gotcha below).
- The remaining module listings that are still plain tables could take the same treatment,
  if that sweep is still wanted.

## Decisions made
- **Cloned into separate files rather than parameterising one module.** The two schedules
  already carry different grid columns and different Analytics questions; a shared
  component would have been a pile of flags on day one.
- **One arithmetic truth per number.** `totalInstallationOf()` sums a run's
  installed/failed/pending/expired instead of storing a total, and a run's outcomes follow
  its status — so the Total Installation column, the six tiles and the status label cannot
  contradict each other.
- **"Devices Patched" counts endpoints, not installations.** The product reference showed
  973 patches against 1 device, which only parses once the two are different units; the
  tile's sub-line says which it is.
- **Office chart keeps every site, including empty ones** — an empty column says "Pune got
  nothing this week", which is an answer; dropping the site hides the question.
- **Weighted office draw, not round-robin** — a flat split would claim a branch runs HQ's
  volume.
- **Hid the filter BUILDER but kept the chips.** A quick filter applies as a rule, so its
  chip is the only way to see what is on and switch it off.
- **Remove-cross stays grey→red in the grid, red-at-rest in the panel.** The user corrected
  my first pass here: a column of small evenly-spaced red crosses reads as a column, not as
  alarm, so the panel matches the ticket Relations tab exactly.
- **The layout pin stays hover-only.** Making it always visible, chipping the pinned state
  and adding an explanatory line was tried and turned down — the preference is the quiet
  version, just a touch bigger. Don't re-propose it.

## Gotchas & notes
- ⚠️ **`gh` is not logged in on this machine.** It did not matter — the repo, remote and
  `deploy.yml` already exist, so stored git credentials carry the push. But a `/publish`
  that needs to CREATE a repo or re-enable Pages will need `! gh auth login` first.
- ⚠️ **There is no typecheck.** `npm run build` is esbuild only and TypeScript is not
  installed, so a wrong prop shape or an undefined identifier builds fine and fails at
  runtime. Everything here was verified by driving the real UI over CDP.
- ⚠️ **Verify a deploy by BUNDLE HASH, not a 200** — the old build answers 200 the whole
  time. Compare `dist/index.html`'s `assets/index-*.js` against the live page's.
- ⚠️ **Give the dev server ~2s before probing.** A CDP probe at 1.2s found zero rows on a
  page that was rendering perfectly; 2.2s is reliable.
- ⚠️ **Both schedule listings hide the gear**, which takes the layout picker and Manage
  columns with it — so the Dashboards defined in both files are unreachable from the UI
  right now. Deliberate, and one `hideTools` entry away from coming back.
- Python is not on PATH here; use the Write/Edit tools or a scratchpad `.mjs` for any sweep,
  never inline `node -e` (it mangles regex and backticks).
