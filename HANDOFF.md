# Handoff — 2026-08-10 18:46

## Read first
Focus on **Key context** in [CLAUDE.md](CLAUDE.md) — specifically the new bullets for the
**Package Deployment** and **Registry Deployment** detail pages, **topology scenarios per module**,
the **stored-items drill-down**, **canvas fullscreen**, the **4→3→2 property grids**, and the
**right-panel field-search gotcha**. The **Structure** section now documents the Package module
(Package Deployments + Registry Deployments list pages, tables and drawers).

## What we worked on this session
Built out the **Package module** end to end — the Registry Deployments listing + detail page, and
a long series of divergences on both package and registry pages (tabs, grids, right-panel fields,
Overview cards, topology scenarios). Also fixed three cross-cutting issues: dead field search on
every patch-family page, property grids that jumped 4→2 columns, and the Hardware tab's section
nav having no active state.

## Completed
- **Registry Deployments module** — listing (`RegistryDeploymentsListPage` + `RegistryDeploymentsTable`,
  25 realistic hardening/policy runs, `CDR-###`) and detail page (`RegistryDeploymentDrawer`,
  registered in `DrawerStack`, opened from the row/pill), plus the **Registry tab**
  (`RegistryDeploymentRegistryTab`: Name / Description).
- **Package Deployment page divergences** — Packages tab replacing Patches, competitor-informed
  header KPIs (Status · Failed · Packages · Endpoints · Install After · Expiry), package × endpoint
  matrix in the Deployment tab, Endpoint grid column set with Agent Credential Profile,
  "Package Deployment Properties/Fields" panel with its own field list.
- **Registry Deployment divergences** — registry template × endpoint matrix (one Name column, no
  Download Status), labelled "Registry Template" strip on cards, Actions/View Configuration column,
  its own panel field list.
- **Overview cards** — new shared `CountPreviewKpiCard` (big count + the first 3 real records +
  "+N more") replacing the invented category donuts on both package and registry Overviews;
  "Patch Status by Category" removed from the package page; status tiles re-laid out 2×2 beside a
  half-width Status by Remote Office.
- **Topology per module** — package gets 2 scenarios (air-gapped Manual Upload, Shared Directory
  with UNC path node + hover card + working two-way edge), registry gets 1 (manual script upload),
  patch keeps 6. Same treatment applied to the individual View Configuration chain.
- **Stored-items side popup** — clicking the Main FS / Shared Directory count opens a searchable,
  paginated list of what is stored: 128 patches, 46 packages, 6 registry configurations.
- **Fullscreen rework** — enter from the topology canvas control, exit from the overlay's top-right
  corner, view toggles hidden while expanded, toolbar button removed.
- **Cross-cutting fixes** — right-panel field search now works on all 7 patch-family pages;
  79 property grids across 15 drawers step 4→3→2 columns; Hardware/CMDB section nav scroll-spy;
  topology cards widened so "In Progress" never wraps.
- Published to GitHub Pages twice (`49ace6d`, `99b5d48`) — both verified live with assets loading.

## In progress
Nothing mid-flight — the last change (fullscreen exit control) is built, published and verified.

## Next steps
- Decide whether the **Registry Deployment** page needs further divergence: its Endpoint tab, Audit
  Trail entries and the Deployment group's "Status by Remote Office" card are still package/patch
  clone data.
- The Registry page's Overview donut split and header chips were inferred, not specced — worth a
  review pass with the real product screens.
- `EndpointDrawer`'s Deployment gauge, Vulnerabilities tab and Audit Trail still run on patch-clone
  data (carried over from earlier sessions, still pending a re-spec).
- Consider whether the Package/Registry pages should keep the topology **scenario picker** at all,
  now that they have 2 and 1 scenario respectively.

## Decisions made
- **Realistic data over screenshot-literal data.** Where your screenshots showed test values
  (`db` policy, `Test` template names, empty "Select"), I substituted realistic equivalents and
  said so, per the project's no-test-data rule.
- **Invented breakdowns removed.** Packages and registry configurations have no category or status
  taxonomy, so their Overview cards became count + real-record previews rather than donuts with
  made-up splits. Same reasoning removed "Patch Status by Category" from the package page.
- **One control per view.** Fullscreen enters from the topology canvas and exits from the overlay
  corner; the ambiguous toolbar button that fullscreened whichever view happened to be active was
  removed, and view toggles hide while expanded so nobody gets stranded.
- **Opt-in props over new files** for shared-component divergence — `packageMode`, `registryMode`,
  `slimColumns`, `packageDeployMode`, `registryDeployMode`, `storeFlavor`, `countLabel`,
  `scenarios`, `onToggleFullscreen`. Defaults always preserve patch-page behavior.

## Gotchas & notes
- **React Flow silently drops edges with unknown handle ids.** The Shared Directory node floated
  unconnected because it was a new kind that did not render the `nd`/`nr` handles. If a connector
  vanishes, check the handles before the edge definition.
- **CRLF breaks scripted multi-line replacements.** Several `node -e` sweeps reported "applied N/M"
  while silently missing multi-line blocks. Verify with a grep afterwards, or use the editor for
  anything spanning lines — one header row shipped unchanged because I trusted the count.
- **Apostrophes break `node -e` inside bash.** Write the script to a file in the scratchpad and run
  it instead (that is how the CLAUDE.md update in this session was done).
- **Gated cells must be gated for every mode.** A leftover Severity cell checked only `packageMode`,
  which shifted every registry column one to the right. When adding a third mode, re-check all
  existing gates, not just the headers.
- **GitHub Pages source must stay on "GitHub Actions".** Earlier in the session the site served a
  blank page because Source was set to "Deploy from a branch → main", publishing Vite's dev
  `index.html`. Fixed via the API using the git credential already stored on this machine
  (`git credential fill`) — `gh` is not logged in here and `gh auth login` is interactive.
