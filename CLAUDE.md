**On session start:** If `HANDOFF.md` exists in this directory, read it before anything else for the latest state of the work.

# ServiceOps Ticket Detail

## What this is
A high-fidelity UI prototype of the Motadata ServiceOps ITSM product — list pages and full detail "drawers" for Tickets/Requests, Problems, Changes, Releases, and the Asset modules (Hardware, Software, Non-IT, Consumable). It's a front-end mockup (mock data, no backend) used to design and demo the detail-page experience.

## Tech stack
- React + TypeScript
- Vite (build/dev)
- Tailwind CSS for styling
- lucide-react icons, Radix UI + MUI components, sonner for toasts
- Deploys as a static build to GitHub Pages

## Structure
- `src/app/App.tsx` — top-level page switcher (`request` | `problem` | `change` | `release` | `hardware-assets` | `software-assets` | `non-it-assets` | `consumable-assets`).
- `src/app/components/` — all UI. Pattern per module: `XListPage` + `XTable` + `XDrawer` (the detail page is a full-screen drawer opened from a row).
  - Tickets: `TicketListPage`, `TicketTable`, `TicketDrawer` (~6.5k lines, the base detail page all others clone).
  - Changes: `ChangeListPage`, `ChangeDrawer`. Releases: `ReleaseDrawer`.
  - Hardware Assets: `HardwareAssetsListPage`, `HardwareAssetsTable`, `HardwareAssetDrawer`, `AssetFields`, `HardwareAssetActionsMenu` (asset-specific 3-dot menu). This is the only asset module with a full detail drawer.
  - Software / Non-IT / Consumable Assets: list-page + table only (no detail drawer yet) — `SoftwareAssetsListPage`+`SoftwareAssetsTable`, `NonItAssetsListPage`+`NonItAssetsTable`, `ConsumableAssetsListPage`+`ConsumableAssetsTable`. All clone the Hardware list page, reuse the shared `Header`/`AssetsToolbar`/`Pagination`, and carry realistic mock data (no test/demo).
  - Shared list chrome: `AssetsToolbar` (title + view dropdown + action icons + search; `title`/`viewLabel` props per module), `Pagination`, `Sidebar` (Assets hover flyout maps labels → pages in `pageFor`/`sectionActive`).
  - Shared detail panels: `TicketPropertiesPanel` (right-side properties; hosts the asset-only `users`/`notes` groups, the top-pinned Agent Information block, and the warranty pill), `TicketFieldsAccordion`, `PinnedFieldsAccordion`, `AdditionalFieldsAccordion` + `SystemFieldsRenderer`, `TicketDrawerUtils` (field lists/options/helpers), `Sidebar`, `Header`.

## How to run
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Key context
- **Detail pages are clones.** `ChangeDrawer`, `ReleaseDrawer`, and `HardwareAssetDrawer` are all clones of `TicketDrawer`, adapted to their data type. They reuse the shared panels (`TicketPropertiesPanel`, `TicketFieldsAccordion`, `PinnedFieldsAccordion`).
- **`HardwareAssetDrawer` uses an adapter** (`assetToTicket`) to map a `HardwareAsset` onto the `Ticket` shape so the cloned body compiles unchanged. Asset-specific UI is toggled with an `assetMode` prop threaded through the shared panels — keep asset changes gated on `assetMode` so tickets/changes/releases are unaffected.
- **Asset drawer tabs** (in `HardwareAssetDrawer`): Overview (default — dashboard cards), Properties, Hardware (category sub-nav of computer-system/OS/BIOS/RAM/…), Software (inventory — defaults to **card view**, toggle to list/table w/ column toggle), Baseline, Relationship, Approvals, Financials (dashboard: hero cost cards + depreciation chart + cost timeline; Add Cost / Configure Depreciation side drawers), History (renamed from Audit Trails; category dropdown + date-range/filter/download toolbar; timeline + table histories incl. Baseline/Variance). Tab order/overflow ("More" dropdown) is computed in the `calculateTabOverflow` effect — `allTabs` is built there, so when adding/removing tabs update both the base arrays AND the approvals/relations insert anchors.
- The asset right panel (`TicketPropertiesPanel`, gated on `assetMode`): a **warranty pill** + **Agent Information** block are pinned at the very top (rendered explicitly, NOT reorderable sections — Agent was removed from the Customize Layout list and the section-order storage key bumped to `assetPropertiesSectionOrderV3`). Asset Fields ("Ticket Fields") has a **View more** toggle revealing extra fields incl. a **CI** link (see `ASSET_MORE_FIELDS` in `AssetFields`); values live in `assetState.extra`. The Additional Fields → System Fields tab shows asset-specific system fields via `SystemFieldsRenderer` (`assetMode`). Asset-only `users`/`notes` groups live in the right rail; ticket field title reads "Asset Fields".
- Asset header (top-right, in `HardwareAssetDrawer`): **Barcode** and **QR Code** buttons (hover/click dropdowns — barcode preview + 4 actions; QR preview + Print QR Code) sit left of **Add Relation**. The 3-dot `HardwareAssetActionsMenu` has an **Add Barcode** action opening a small popup; "Print Qrcode" was removed from that menu.
- Shared-component customization pattern: add an optional prop (e.g. `showSla`, `fieldsTitle`, `assetMode`) with a default that preserves existing behavior, then opt-in from the specific drawer.
- All data is mock/in-component. Selections in detail drawers are local React state (prototype behavior), not persisted.
- Asset list IDs by module: Hardware `AST-###`, Software `SWAST-#####`, Non-IT `NON-####`, Consumable `CON-0000070##` (all mock, in each `XListPage`).
- The Customize Layout section order persists in `localStorage` under a per-module key (`ticketPropertiesSectionOrder` / `changePropertiesSectionOrder` / `assetPropertiesSectionOrderV3`) so layouts don't leak across modules.
- Container queries (Tailwind v4 `@container` + `@xl:`/`@4xl:` variants) drive the Software card grid (responds to the drawer width, not the viewport; capped at 3 columns).
- Verify changes with `npm run build` (no standalone typecheck script; TypeScript isn't installed globally). Note: edit files with the proper tools — a PowerShell `Get-Content`/`Set-Content` round-trip can corrupt the UTF-8 em-dashes (—) in asset names.
- `main` is the deploy branch — pushing to it auto-deploys via GitHub Actions to the live URL.

## Deployment
Repo: https://github.com/ronak-patel-motadata/ServiceOps-Ticket-Detail-
Live URL: https://ronak-patel-motadata.github.io/ServiceOps-Ticket-Detail-/

## Handoff
Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
