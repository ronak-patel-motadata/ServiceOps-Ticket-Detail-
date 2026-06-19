**On session start:** If `HANDOFF.md` exists in this directory, read it before anything else for the latest state of the work.

# ServiceOps Ticket Detail

## What this is
A high-fidelity UI prototype of the Motadata ServiceOps ITSM product — list pages and full detail "drawers" for Tickets/Requests, Problems, Changes, Releases, and Hardware Assets. It's a front-end mockup (mock data, no backend) used to design and demo the detail-page experience.

## Tech stack
- React + TypeScript
- Vite (build/dev)
- Tailwind CSS for styling
- lucide-react icons, Radix UI + MUI components, sonner for toasts
- Deploys as a static build to GitHub Pages

## Structure
- `src/app/App.tsx` — top-level page switcher (`request` | `problem` | `change` | `release` | `hardware-assets`).
- `src/app/components/` — all UI. Pattern per module: `XListPage` + `XTable` + `XDrawer` (the detail page is a full-screen drawer opened from a row).
  - Tickets: `TicketListPage`, `TicketTable`, `TicketDrawer` (~6.5k lines, the base detail page all others clone).
  - Changes: `ChangeListPage`, `ChangeDrawer`. Releases: `ReleaseDrawer`.
  - Hardware Assets: `HardwareAssetsListPage`, `HardwareAssetsTable`, `HardwareAssetDrawer`, `AssetFields`, `HardwareAssetActionsMenu` (asset-specific 3-dot menu).
  - Shared detail panels: `TicketPropertiesPanel` (right-side properties; also hosts the asset-only `users`/`notes` groups), `TicketFieldsAccordion`, `PinnedFieldsAccordion`, `TicketDrawerUtils` (field lists/options/helpers), `Sidebar`, `Header`.

## How to run
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Key context
- **Detail pages are clones.** `ChangeDrawer`, `ReleaseDrawer`, and `HardwareAssetDrawer` are all clones of `TicketDrawer`, adapted to their data type. They reuse the shared panels (`TicketPropertiesPanel`, `TicketFieldsAccordion`, `PinnedFieldsAccordion`).
- **`HardwareAssetDrawer` uses an adapter** (`assetToTicket`) to map a `HardwareAsset` onto the `Ticket` shape so the cloned body compiles unchanged. Asset-specific UI is toggled with an `assetMode` prop threaded through the shared panels — keep asset changes gated on `assetMode` so tickets/changes/releases are unaffected.
- **Asset drawer tabs** (in `HardwareAssetDrawer`): Overview (default — dashboard cards), Properties, Hardware (category sub-nav of computer-system/OS/BIOS/RAM/…), Software (inventory table w/ column toggle), Approvals, Audit Trails. Tab order/overflow ("More" dropdown) is computed in the `calculateTabOverflow` effect — `allTabs` is built there, so when adding/removing tabs update both the base arrays AND the approvals/relations insert anchors.
- The asset right panel (`TicketPropertiesPanel`) adds asset-only groups **`users`** and **`notes`** (icons in the right rail); ticket field labels read "Asset Fields", and "Requester Information" becomes "Agent Information".
- Shared-component customization pattern: add an optional prop (e.g. `showSla`, `fieldsTitle`, `assetMode`) with a default that preserves existing behavior, then opt-in from the specific drawer.
- All data is mock/in-component. Selections in detail drawers are local React state (prototype behavior), not persisted.
- Hardware asset IDs are `AST-001`, `AST-002`, … (mock data in `HardwareAssetsListPage`).
- The Customize Layout section order persists in `localStorage` under a per-module key (`ticketPropertiesSectionOrder` / `changePropertiesSectionOrder` / `assetPropertiesSectionOrder`) so layouts don't leak across modules.
- Verify changes with `npm run build` (no standalone typecheck script; TypeScript isn't installed globally). Note: edit files with the proper tools — a PowerShell `Get-Content`/`Set-Content` round-trip can corrupt the UTF-8 em-dashes (—) in asset names.
- `main` is the deploy branch — pushing to it auto-deploys via GitHub Actions to the live URL.

## Deployment
Repo: https://github.com/ronak-patel-motadata/ServiceOps-Ticket-Detail-
Live URL: https://ronak-patel-motadata.github.io/ServiceOps-Ticket-Detail-/

## Handoff
Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
