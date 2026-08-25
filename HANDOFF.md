# Handoff — 2026-08-24 19:35

## Read first
CLAUDE.md → the **Ticket listing = a real data-grid** bullet block under Key context (nine sub-bullets covering widths, drag-order, manage-columns, sticky header, inline editing, row-intel chips, the SLA pill and avatars). That is this session's work. The Report bullets below it cover the previous session.

## What we worked on this session
Turned the ticket listing from a static table into a proper data-grid, then layered on "row intelligence" — the signals a technician needs (new replies, pending approvals, task progress) without opening the request.

## Completed
- **Grid mechanics**: 25 rows by default; boxed toolbar icons; column order changed + "Due By" removed; **resizable columns** (flex vs fixed so ID hugs Subject and the grid always fills the width); **drag-to-reorder** with a custom drag ghost, full-height insertion line and side-aware drops; **sticky header** (white, hover-grey per column, grip affordance); **Manage Columns** popup with 22 optional columns, drag-reorder, search, Apply, single shared scroll and add-to-view feedback — order + visible set persisted in localStorage.
- **Inline editing** of Requester / Assigned to / Status / Priority via `InlineSelect` (detail-page Key-Information recipe, body-portal menus, people picker with search + presence dots + check, aligned fixed slots).
- **Row intelligence**: unread-message chip (bold subject + last-message hover card), pending-approval chip (approver, level, waiting), task-progress chip (bar + themed task names) — all seeded coherently with the detail page.
- **Due By Status** rebuilt as the detail page's SLA pill (hourglass, dynamic colour, 3-row tooltip).
- Avatars unified: orange requesters, blue technicians, 20px everywhere; Knowledge Key Information gained a Tags row.
- Published live twice (bc13bdd, ea4d2b6) — hash-verified on GitHub Pages.

## In progress
Nothing mid-flight.

## Next steps
- Natural follow-on: clear the unread chip once a ticket has been opened (currently static seed data).
- If the team likes the grid, sweep the same `TicketTable` recipe to the other module tables (Problem/Change/Release/assets) — they are still plain tables.
- Optional: persist column WIDTHS too (order + visibility already persist); make the Manage-columns set per saved view.
- Older, still open: report stubs (pencil Edit, 3-dot View History, listing-row Schedule edit); the unanswered "timestatmp" question about the report timeframe dropdown.

## Decisions made
- Columns are **flex vs fixed** rather than all-proportional: proportional scaling stretched ID away from Subject on wide screens, which the user flagged twice.
- All grid menus render in **body portals** — the grid scrolls on both axes and would clip them; they close on outside scroll but ignore scrolls inside themselves.
- Chips are **information only** (no click actions) so the whole row keeps one predictable behaviour: click opens the request. Colour language is urgency-ordered: blue event → amber action-needed → grey progress.
- Listing avatars are **role-coloured, not person-coloured** (user asked for single colours); the detail page keeps its per-person palette.
- Mock values for every new column/pill are **derived from a per-id hash** so rows stay stable across renders and agree with each other (e.g. Closed By only fills on closed rows).

## Gotchas & notes
- **Sticky headers need the right scroll container**: the table's own `overflow-x-auto` wrapper silently scrolls both axes, so `sticky top-0` did nothing until that wrapper was removed and the page container took over.
- **`tbody` must have no background** or it paints over the `<col>` tint used to grey the dragged column.
- **`TicketTable.tsx` / `TicketListPage.tsx` had mixed CRLF+LF line endings**; both were normalised to LF this session. Edit scripts should still try both forms.
- **Never write regexes through a bash-embedded node script** — `/\s+/` arrived as `/s+/` and split names on the letter "s". Write the script to the scratchpad with the editor tool instead (this is the trap already noted for sweeps).
- The listing's edits/widths are React state — they reset on reload by design; only column order/visibility persist.
