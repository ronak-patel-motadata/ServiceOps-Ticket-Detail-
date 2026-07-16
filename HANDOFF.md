# Handoff — 2026-07-17 01:49

## Read first
CLAUDE.md `## Key context`: the **demo-custom-fields bullet** (now grouped + editable + expand popup with Update), the **shared composer editor bullet** (`EditorToolbar.tsx`), the **RelationshipGraph** bullet (Saved Views "Update view" with dirty detection), and the **Structure → Shared list chrome** line (sidebar Radix tooltips + `IconKnowledge` = lucide Lightbulb).

## What we worked on this session
Polished the ticket **Additional Fields → Form Fields** experience (grouping, sticky header, an expand-all popup with draft/Update, fully editable custom fields), a topology **Saved Views "Update this view"** action that only shows on real edits, and a set of small consistency fixes (composer font-size menu clipping, Insert-Knowledge + sidebar icons unified to a bulb, sidebar module tooltips → Radix black). NOTE: the big shared **rich-text composer overhaul** (`EditorToolbar.tsx`) landed earlier in this same session before context was compacted — it's complete and documented in CLAUDE.md.

## Completed
- **Custom fields grouped:** 55 fields carry a `group`; `AdditionalFieldsAccordion` renders a clean section header (full-width hairline + whitespace + uppercase **12px `#1E293B`** title) at each group change. Built-in fields stay ungrouped on top.
- **Custom fields editable:** every custom field is now an inline editable input in the accordion (user-created fields, so editable) — values in `customFieldValues` state.
- **Expand-fields popup:** Maximize2 icon on the tab row → centered 720px modal, all fields **2-per-row** (real dropdowns/inputs + group titles at **14px**), edits go to a **draft**, **sticky footer** with **Update** (commits → accordion + toast) / **Cancel** (discards). Accordion header made **sticky** under the panel search bar.
- **Saved Views — "Update &lt;view&gt;":** appears in the popup ONLY when the applied view was edited (filter change / node expand / node drag / mode switch). Uses `viewFingerprint` (mode + both filters + expanded + pins; pan/zoom excluded) compared on popup-open. Clicking overwrites the view via `capture()`. Save input relabels to "Save as new view". E2E-verified (4 cases: after-save/no-change hidden, after-change shown, update persists).
- **Font-size menu clip fix:** removed `overflow-hidden` from all 45 composer cards (Collaborate/Note/Diagnosis/Solution across 12 drawers + ResolutionTabContent); gray header got its own `rounded-t-[6px]` so corners stay clean.
- **Icon consistency:** Insert-Knowledge (`EditorToolbar`) and sidebar Knowledge (`IconKnowledge`) both now use the lucide **`Lightbulb`**.
- **Sidebar tooltips:** module nav icons use the **Radix black tooltip** (`side="right"`) instead of the native gray `title`; Assets item keeps its flyout (`disableTooltip`).
- **Group title tweaks:** dark color + 12px in the accordion, 14px in the popup.

## In progress
Nothing mid-flight. Every change built clean (`npm run build`) and was verified with puppeteer screenshots / e2e.

## Next steps
1. **Publish** — this session's work is NOT yet pushed (last deploy = commit `8d2ce89`, Jul 15). This is a large batch: the whole editor overhaul + all the Additional-Fields work + Saved Views Update + sidebar/icon fixes.

## Decisions made
- **Compute "dirty" on popup-open, not live** — the Saved Views popup has a full-screen overlay, so all canvas edits happen while it's closed; recomputing on open is sufficient and avoids wiring live graph state into `RelSavedViews`.
- **Exclude raw pan/zoom from the dirty fingerprint** — it jitters sub-pixel and would false-trigger "Update"; the meaningful edits are filters, expansions, and node pins (which ARE included). Node "position" = manual pins, not viewport.
- **Draft + Update in the expand popup** (not live-write) — matches a form "edit → save" mental model; the accordion inputs stay live-write since they're the primary surface.
- **Sticky accordion header at `top-[85px]`** (panel search header is 86px) with NO extra border — an earlier border/spacing experiment was reverted per feedback; the plain white sticky was the approved version.
- **Reuse `IconKnowledge` as the single bulb source** so any Knowledge affordance across the product stays consistent from one component.

## Gotchas & notes
- Vite build does **not** typecheck — a missing import becomes a runtime `ReferenceError` at render (once crashed all composers, read as "drawer won't open"). Always exercise the actual UI, not just the build.
- Segmented view-mode buttons (Full/Tree/Grid) use **Radix tooltips**, so `title` is NOT an HTML attribute — puppeteer must select them by their lucide icon (`svg.lucide-list` etc.), not `button[title=...]`.
- After **Save** in Saved Views the popup stays OPEN with its `.fixed.inset-0.z-40` overlay — in tests, close it (click the overlay) before interacting with the canvas, or clicks hit the overlay.
- Once a saved view is applied, the pill label becomes the **view name** (not "Views") — selectors must target the pill by its bookmark+chevron icons, not by text.
- contentEditable caret-reset bug: never rewrite `innerHTML` on every keystroke (reverses typing) — `RichComposerArea` mirrors external value only when `document.activeElement !== el`.
- Sweep scripts: write `.cjs`/`.js` to the scratchpad with the Write tool and run `node <file>` — bash heredocs with template literals break quoting.
