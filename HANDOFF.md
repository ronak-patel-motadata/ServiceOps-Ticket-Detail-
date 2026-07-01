# Handoff — 2026-07-02 00:53

## Read first
Focus on the two Key-context bullets in `CLAUDE.md`: **"Cross-module drawer host (`DrawerStack.tsx`)"** (new this session) and **"Drawer minimize + open-item tabs"** (updated). Together they explain how one drawer now hosts items from every module and how the view/minimize state is shared. Everything is mock/in-component as usual.

## What we worked on this session
Finished and hardened the **cross-module drawer** experience: clicking a related item (Relations tab OR the "Open related records" Impact popup) now opens the *real* other-module detail page as a tab in the same drawer. Then fixed three UX follow-ups: view-mode persistence on tab close, auto-minimize when navigating to another module's list, and a shorter tab bar.

## Completed
- **Impact-popup → same drawer** (`HardwareAssetDrawer`, `SoftwareAssetDrawer`, `NonItAssetDrawer`, `PurchaseDrawer`, `ContractDrawer`, `CmdbDrawer`): the "Open related records" popup record rows now call `onOpenRelation(...)` (Incident→Request mapping) so they open the real detail page as a tab, matching the Relations tab. Verified AST-001 → INC-32 opens as a tab.
- **Small/full view persists across tab close** (`DrawerStack.tsx` + all 12 drawers): lifted `drawerWidth` intent to the host via **`stackWidth`/`onStackWidthChange`**. Each drawer inits `drawerWidth` from `stackWidth` (falls back to full on first open), uses it in the first-open reset, and reports every toggle back. Closing a tab that swaps in a different-module drawer no longer resets to full. Verified: open INC-31 + PBM-1001 → small view → close active → stayed 1080.
- **Auto-minimize on navigation** (`DrawerStack.tsx` + `App.tsx` + all 12 drawers): the provider now takes `activePage`; an effect minimizes the open drawer whenever you switch to another module's list page (list shows behind the slim rail). Lifted `minimized` to the host via **`stackMinimized`/`onStackMinimizedChange`** (drawer's local `minimized` defers to host). `open()` clears minimized so clicking any item restores. Verified: open ticket → click Problem nav (drawer minimizes, "All Open Problems" visible) → click PBM-627 (restores, tabs `["INC-31","PBM-627"]`).
- **Shorter drawer tab bar**: tabs `py-3`→`py-2` in `DrawerTabStrip.tsx` (incl. the "More (N)" button); window-control buttons `p-3`→`p-2` in all 12 drawers. Bar is now ~36px (was ~42px). Verified by screenshot — still comfortable and balanced.
- All verified: `npm run build` passes each time; headless puppeteer probes confirmed each flow.

## In progress
Nothing mid-flight. The cross-module drawer host is complete and all three follow-up fixes are in and verified.

## Next steps
- **Push the batch live** — this is a LARGE unpushed batch: the whole `DrawerStack` cross-module refactor, Impact-popup wiring, `stackWidth`/`stackMinimized` lifted state, minimize-on-navigate, and the tab-bar height trim. The last `/publish` predates ALL of it. Run `/publish` when ready.
- Optional: anchor near-expiry day-count math to a fixed date if a permanent demo is wanted (carried over from last session).

## Decisions made
- **Full DrawerStack refactor over a cheaper swap** — the user explicitly wanted the actual other-module detail page (not just id/subject swapped), so a single context host that renders the matching module's real drawer was the only faithful option.
- **Lift view + minimize state to the host, not per-drawer** — because closing a tab or navigating can swap in a *different* module's drawer component (a remount), per-instance state resets. Host-owned `stackWidth`/`stackMinimized` survive the swap.
- **`REL_MAP` pools are lazy getters** — list pages import `DrawerStack` and vice-versa; eager pool refs threw "Cannot access X before initialization". Access the pool at call time.
- **Tab bar to ~36px** — `py-2`/`p-2` keeps 32–36px click targets (standard desktop toolbar size) while returning ~6px to content.

## Gotchas & notes
- **The long-running dev server on :5173 can go stale** after many edits (Vite HMR + the `DrawerStack`↔list-page circular imports). Symptom this session: clicking a list row stopped opening any drawer, with NO console/page error, while a fresh `npm run dev` worked fine. Fix = restart the dev server (killed the stale PID and relaunched on :5173). If detail pages "stop opening," restart before debugging code.
- **12-drawer sweeps rely on byte-identical anchors** (`stackTabs` interface line + destructure, `drawerWidth` init, `!hasDrawerBeenInitialized` first-open block, `const [minimized, setMinimized] = useState(false)`, `p-3 hover:bg-[#e5e7eb]`). All were grep-verified as 1×/3× per file before each node sweep — re-verify counts before any future bulk edit.
- Problem list IDs are **`PBM-###`** (not `PRB-`); ID chips across list tables share `bg-[#e8f4fd]` — handy for headless selectors.
- Don't round-trip files through PowerShell `Get-Content`/`Set-Content` — it corrupts the UTF-8 em-dashes (—) in asset names. Use the editor tools / node.
- Verify with `npm run build` (no standalone typecheck). Headless puppeteer probes live in the session scratchpad; `element.click()` bypasses the first-run onboarding overlay.
