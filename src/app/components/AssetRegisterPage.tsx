/* ── Asset-register listing chrome ───────────────────────────────────────────
   The shared listing layer (grid toolbar, saved-views rail, filter rules,
   multi-sort, grouping footer, pagination, List + List&KPI layouts) for the
   asset/procurement REGISTERS: Software, Non-IT, Consumable, Software License,
   Contract and Purchase. Each module hands in its rows (mock data mapped onto
   the Ticket shape), its KPI card builder (the module DETAIL page's story
   rolled up), and its identity (route, views store, columns) — so a module
   file stays a thin adapter while every register shares one behavior set.
   Hardware keeps its own full clone (HardwareAssetsListingPage); registers
   deliberately offer List + List&KPI only — no work-in-flight axis. */
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable, useOpenFromUrl, MONEY_COLS, moneyNumber } from './TicketTable';
import { ArrowLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { AssetDashboardView, type DashConfig } from './AssetDashboardView';
import { CURRENT_USER } from './technicianRoster';
import { StatsCardsRow, type StatCard } from './AssetStatsRow';
import { TicketGridToolbar } from './TicketGridToolbar';
import { TicketViewsSidebar, getDefaultView, type TicketView, type ViewStore } from './TicketViewsPanel';
import { applyFilters, type FilterRule } from './TicketFilterBar';
import { DEFAULT_CARD_FIELDS, type KanbanGroup } from './TicketKanban';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { Ticket } from './TicketListPage';

/* A drill-down REPLACES the listing's own header (the hardware-listing recipe):
   the parent crumb is the way back, the tile's words become the title. */
function DrillCrumb({
  label,
  shown,
  total,
  footerNoun,
  onBack,
}: {
  label: string;
  shown: number;
  total: number;
  footerNoun: string;
  onBack: () => void;
}) {
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2.5 px-6 py-3">
        <button
          onClick={onBack}
          title="Back to the dashboard"
          className="group inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
        >
          <ArrowLeft size={15} className="flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
          Dashboard
        </button>
        <ChevronRight size={16} className="flex-shrink-0 text-[#CBD5E1]" />
        <h1 className="truncate text-[17px] font-semibold text-[#1E293B]">{label}</h1>
        <span className="h-4 w-px flex-shrink-0 bg-[#E5E7EB]" />
        <span className="flex-shrink-0 text-[12px] text-[#7B8FA5]">
          <span className="font-medium tabular-nums text-[#364658]">{shown}</span> of {total} {footerNoun}
        </span>
      </div>
    </div>
  );
}

export function AssetRegisterPage({
  activePage,
  stackModule,
  viewsStore,
  noun,
  moduleCols,
  defaultViewName,
  footerNoun,
  rows,
  recordOf,
  buildCards,
  buildDashboard,
  mineHint,
  searchFields = [],
  filterAttrs,
  quickFilters,
  moreActions,
  primaryAction,
  showBarcodeTools = false,
  showQuickFilters = true,
  hideTools,
  allowColumnEdit = true,
  overview,
  rail,
  railLabel = 'classes',
  resetKey,
  lockedCells,
  initialOpenId,
  onInitialOpenConsumed,
  onNavigate,
}: {
  activePage: string;
  /** DrawerStack module the rows open into (e.g. 'software-assets'). */
  stackModule: string;
  viewsStore: ViewStore;
  /** What one record is called in the toolbar strings. */
  noun: string;
  moduleCols: React.ComponentProps<typeof TicketTable>['moduleCols'];
  defaultViewName: string;
  /** Plural word for the grouping footer ("assets", "licenses", "orders"…). */
  footerNoun: string;
  rows: Ticket[];
  /** The ORIGINAL module record for a row id — what the drawer actually opens. */
  recordOf: (id: string) => unknown;
  /** The module's KPI strip, for the List&KPI layout. A module that offers only the plain
      List (Knowledge) has nowhere to show one and passes none. */
  buildCards?: (tickets: Ticket[]) => StatCard[];
  /** Module dashboard config builder — providing it turns the Dashboard layout on. */
  buildDashboard?: (tickets: Ticket[]) => DashConfig;
  /** The module's own filter attributes / quick filters / ⋮ items (see the toolbar). */
  filterAttrs?: React.ComponentProps<typeof TicketGridToolbar>['filterAttrs'];
  quickFilters?: React.ComponentProps<typeof TicketGridToolbar>['quickFilters'];
  moreActions?: React.ComponentProps<typeof TicketGridToolbar>['moreActions'];
  primaryAction?: React.ComponentProps<typeof TicketGridToolbar>['primaryAction'];
  /** Registers whose records carry a physical label get the barcode / scan tools. */
  showBarcodeTools?: boolean;
  /** false drops the quick-filter icons entirely (a register with no useful one-click cut). */
  showQuickFilters?: boolean;
  /** Toolbar controls this module has no use for — see TicketGridToolbar's `hideTools`. */
  hideTools?: React.ComponentProps<typeof TicketGridToolbar>['hideTools'];
  /** Columns the grid must render READ-ONLY — a fact the system derives, not one a user sets. */
  lockedCells?: string[];
  /** false fixes the column set: no Columns row in the gear menu, and no Insert Left /
      Insert Right / Change Column in a column's own header menu. */
  allowColumnEdit?: boolean;
  /** A landing view for the module's "everything" state (Knowledge's most-read digest),
      rendered instead of the grid until the reader searches or filters. */
  overview?: React.ReactNode;
  /** A module's own navigation rail, rendered left of the grid (the CMDB's CI classes).
      The page owns its state and hands down already-filtered `rows`. It is a RENDER
      FUNCTION because the rail shares its slot with the views rail: `collapsed` says the
      slot is taken and the rail should show its strip, `expand` asks for it back. */
  rail?: (ctx: { collapsed: boolean; expand: () => void }) => React.ReactNode;
  /** What that rail is called, for the panel-swap button ("Back to CI classes"). */
  railLabel?: string;
  /** Changes whenever that rail navigates somewhere new — resets paging, selection and any
      drill-down WITHOUT remounting, so the rail keeps its own expanded branches. */
  resetKey?: string | null;
  /** Empty-state line for the dashboard's "Mine" scope on thinly-owned registers. */
  mineHint?: string;
  /** Extra row fields the free-text search also matches (x_ keys). */
  searchFields?: string[];
  initialOpenId?: string | null;
  onInitialOpenConsumed?: () => void;
  onNavigate?: (page: string) => void;
}) {
  /* The register keeps its own copy of the rows so an inline cell edit sticks. That copy is
     a WORKING copy, not a snapshot of the first render: when the page hands down a
     different set — the CMDB's class rail narrowing the database — take it. (Until this
     effect existed, the CMDB only re-read its rows because a `key` remounted the whole
     register, which took the rail's expanded branches down with it.) */
  const [tickets, setTickets] = useState<Ticket[]>(rows);
  useEffect(() => { setTickets(rows); }, [rows]);
  const updateTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ label: string; groups: number; total: number; list?: { key: string; count: number }[] } | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');
  const [clearGroupTick, setClearGroupTick] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sorts, setSorts] = useState<{ column: keyof Ticket; dir: 'asc' | 'desc' }[]>([]);
  const startView = getDefaultView(viewsStore);
  const [filterRules, setFilterRules] = useState<FilterRule[]>(
    () => startView?.rules.map((r, i) => ({ ...r, id: `view-${startView.name}-${i}` })) ?? [],
  );
  const [view, setView] = useState<'list' | 'list-kpi' | 'kanban' | 'dashboard' | 'calendar'>('list');
  /* Set only when the list was reached by clicking something on the dashboard —
     carries the trail back: the clicked label + the filters in force before. */
  const [drillFrom, setDrillFrom] = useState<{ label: string; rules: FilterRule[] } | null>(null);
  const backToDashboard = () => {
    if (drillFrom) setFilterRules(drillFrom.rules);
    setDrillFrom(null);
    setCurrentPage(1);
    setView('dashboard');
  };
  const [dashScope, setDashScope] = useState<'all' | 'mine'>('all');
  const [kanbanGroup, setKanbanGroup] = useState<KanbanGroup>('status');
  const [kanbanSubGroup, setKanbanSubGroup] = useState<KanbanGroup | null>(null);
  const [cardFields, setCardFields] = useState<string[]>(DEFAULT_CARD_FIELDS);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(0);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const measure = () => setStickyH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sortColumn = sorts[0]?.column ?? null;
  const sortDirection = sorts[0]?.dir ?? 'asc';
  const [activeView, setActiveView] = useState(startView?.name ?? defaultViewName);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /* A module that navigates INSIDE the register (the CMDB's CI-class rail) changes which
     rows exist without changing the page. Remounting to reset would be simpler, but it
     would also throw away the navigator's own state — which branches the reader had open —
     so the register resets only what actually goes stale: the page, the selection and any
     dashboard drill-down. Filters survive on purpose: they compose with the navigator. */
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) { firstReset.current = false; return; }
    setCurrentPage(1);
    setSelectedTickets(new Set());
    setDrillFrom(null);
    setActiveView(defaultViewName);
  }, [resetKey]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenTicket = (ticket: Ticket) =>
    openInStack(stackModule as any, ticket.id, ticket.subject, recordOf(ticket.id) ?? ticket);

  /* A row opened in a new browser tab lands here with ?open=<id>. */
  useOpenFromUrl(rows, handleOpenTicket);

  // Deep link support (e.g. a Software License's "Managed Softwares" card).
  useEffect(() => {
    if (!initialOpenId) return;
    const row = rows.find((r) => r.id === initialOpenId);
    if (row) handleOpenTicket(row);
    onInitialOpenConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t) => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };
  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const next = new Set(selectedTickets);
    if (checked) next.add(ticketId);
    else next.delete(ticketId);
    setSelectedTickets(next);
  };
  const handleSort = (column: keyof Ticket, dir?: 'asc' | 'desc') => {
    setCurrentPage(1);
    setSorts((prev) => {
      const i = prev.findIndex((s) => s.column === column);
      if (dir) {
        if (i < 0) return [...prev, { column, dir }];
        const next = [...prev];
        next[i] = { column, dir };
        return next;
      }
      if (i < 0) return [...prev, { column, dir: 'asc' }];
      if (prev[i].dir === 'asc') {
        const next = [...prev];
        next[i] = { column, dir: 'desc' };
        return next;
      }
      return prev.filter((s) => s.column !== column);
    });
  };

  let filteredTickets = tickets;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTickets = tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.assignedTo.name.toLowerCase().includes(q) ||
        (t.status as string).toLowerCase().includes(q) ||
        searchFields.some((f) => String((t as any)[f] ?? '').toLowerCase().includes(q)),
    );
  }
  filteredTickets = applyFilters(filteredTickets, filterRules);

  const sortedTickets = [...filteredTickets];
  if (sorts.length) {
    sortedTickets.sort((a, b) => {
      for (const { column, dir } of sorts) {
        let aVal: any = a[column];
        let bVal: any = b[column];
        if (column === 'assignedTo') {
          aVal = (a.assignedTo as any).name;
          bVal = (b.assignedTo as any).name;
        }
        let cmp = 0;
        /* Money sorts by its VALUE, not its text — "1,000,000.00 INR" precedes
           "500,000.00 INR" alphabetically, which would rank the portfolio wrongly. */
        if (MONEY_COLS.has(column as string)) cmp = moneyNumber(aVal) - moneyNumber(bVal);
        else if (aVal instanceof Date && bVal instanceof Date) cmp = aVal.getTime() - bVal.getTime();
        else if (typeof aVal === 'string' && typeof bVal === 'string') cmp = aVal.localeCompare(bVal);
        else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }

  /* A module can hand the register a landing view for its "everything" state. It gives way
     the moment the reader searches or filters — at that point they want rows, not a digest. */
  const showOverview = !!overview && !drillFrom && view === 'list' && !searchQuery.trim() && filterRules.length === 0;

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageTickets = paginatedTickets.map((t) => t.id);
  const allCurrentPageSelected = currentPageTickets.every((id) => selectedTickets.has(id)) && currentPageTickets.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* ONE panel at a time. The module's own navigation rail (the CMDB's CI-class
              tree) and the views rail share this slot, so opening Views folds the classes
              down to their strip — still on screen, still one click back — rather than
              taking the slot twice.
              The rail stays MOUNTED throughout: it would otherwise forget which branches
              the reader had open every time they glanced at Views. */}
          {rail && !drillFrom && rail({ collapsed: viewsOpen, expand: () => setViewsOpen(false) })}
          {viewsOpen && !drillFrom && (
            <TicketViewsSidebar
              store={viewsStore}
              active={activeView}
              onSelect={(v: TicketView) => {
                setActiveView(v.name);
                setFilterRules(v.rules.map((r, i) => ({ ...r, id: `view-${v.name}-${i}` })));
                setCurrentPage(1);
                setDrillFrom(null);
              }}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {drillFrom ? (
              <DrillCrumb
                label={drillFrom.label}
                shown={sortedTickets.length}
                total={tickets.length}
                footerNoun={footerNoun}
                onBack={backToDashboard}
              />
            ) : (
              <Toolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeView={activeView}
                viewsOpen={viewsOpen}
                onToggleViews={() => setViewsOpen((v) => !v)}
                /* With a rail in the slot, this button swaps panels rather than just
                   hiding one — say so, or the classes look like they vanished. */
                viewsLabels={rail ? { show: 'Show views', hide: `Back to ${railLabel}` } : undefined}
              />
            )}
            <main className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 bg-white min-h-0 overflow-auto [scrollbar-gutter:stable]" style={{ ['--tb' as any]: `${stickyH}px` }}>
                <div className="sticky left-0 bg-white pt-0.5">
                  {view === 'list-kpi' && !drillFrom && buildCards && (
                    <StatsCardsRow
                      cards={buildCards(tickets)}
                      rules={filterRules}
                      onApplyFilter={(r) => {
                        setFilterRules(r);
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
                <div ref={stickyRef} className="sticky left-0 top-0 z-[45] bg-white pt-0.5">
                  <TicketGridToolbar
                    noun={noun}
                    viewsStore={viewsStore}
                    showBarcodeTools={showBarcodeTools}
                    showQuickFilters={showQuickFilters}
                    hideTools={hideTools}
                    allowColumnEdit={allowColumnEdit}
                    filterAttrs={filterAttrs}
                    quickFilters={quickFilters}
                    moreActions={moreActions}
                    primaryAction={primaryAction}
                    layouts={buildDashboard ? ['list', 'dashboard'] : ['list']}
                    searchQuery={searchQuery}
                    setSearchQuery={(v) => {
                      setSearchQuery(v);
                      setCurrentPage(1);
                    }}
                    rules={filterRules}
                    setRules={(r) => {
                      setFilterRules(r);
                      setCurrentPage(1);
                    }}
                    sorts={sorts}
                    onSort={handleSort}
                    onClearSorts={() => setSorts([])}
                    activeView={activeView}
                    onViewSaved={(v: TicketView) => setActiveView(v.name)}
                    onRemoveSort={(column) => setSorts((prev) => prev.filter((s) => s.column !== column))}
                    onReorderSorts={(order) => setSorts((prev) => order.map((c) => prev.find((s) => s.column === c)!).filter(Boolean))}
                    listGroupLabel={isGrouped ? groupInfo?.label ?? null : null}
                    view={view}
                    setView={(v) => {
                      /* Reaching the dashboard by the view switcher has to undo the
                         drill too — otherwise the charts would silently redraw over
                         the drilled-down subset. */
                      if (v === 'dashboard' && drillFrom) return backToDashboard();
                      setView(v);
                    }}
                    kanbanGroup={kanbanGroup}
                    setKanbanGroup={setKanbanGroup}
                    kanbanSubGroup={kanbanSubGroup}
                    setKanbanSubGroup={setKanbanSubGroup}
                    cardFields={cardFields}
                    setCardFields={setCardFields}
                    dashScope={dashScope}
                    setDashScope={setDashScope}
                    dashScopeSwitch={false}
                  />
                </div>
                {view === 'dashboard' && buildDashboard ? (
                  (() => {
                    /* Deliberately the UNFILTERED set: the dashboard narrows itself
                       with the Overall/Mine switch, not with list filters. */
                    const scoped = dashScope === 'mine' ? tickets.filter((t) => t.assignedTo.name === CURRENT_USER) : tickets;
                    return (
                      <AssetDashboardView
                        config={buildDashboard(scoped)}
                        empty={scoped.length === 0 ? mineHint ?? `Nothing here is assigned to ${CURRENT_USER} yet.` : null}
                        onDrillDown={(r, label) => {
                          setDrillFrom({ label, rules: filterRules });
                          setFilterRules(r.map((x, i) => ({ ...x, id: `dash-${x.field}-${i}` })));
                          setCurrentPage(1);
                          setView('list');
                        }}
                      />
                    );
                  })()
                ) : showOverview ? (
                  /* The module's own landing — shown while nothing is being searched or
                     filtered. Searching or filtering reveals the grid, so the overview never
                     stands between the reader and their results. The register adds nothing
                     around it: what a landing shows is the module's business. */
                  overview
                ) : (
                <TicketTable
                  noun={noun}
                  openPage={activePage}
                  moduleCols={moduleCols}
                  lockedCells={lockedCells}
                  allowColumnEdit={allowColumnEdit}
                  tickets={paginatedTickets}
                  selectedTickets={selectedTickets}
                  allSelected={allCurrentPageSelected}
                  onSelectAll={handleSelectAll}
                  onSelectTicket={handleSelectTicket}
                  onSort={handleSort}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  sorts={sorts}
                  onTicketClick={handleOpenTicket}
                  onUpdateTicket={updateTicket}
                  allTickets={sortedTickets}
                  onGroupedChange={(g, info) => {
                    setIsGrouped(g);
                    setGroupInfo(g ? info ?? null : null);
                  }}
                  clearGroupingSignal={clearGroupTick}
                  emptyFiltered={searchQuery.trim() !== '' || filterRules.length > 0}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setFilterRules([]);
                    setCurrentPage(1);
                  }}
                />
                )}
              </div>
              {!isGrouped && view !== 'dashboard' && !showOverview && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={sortedTickets.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                />
              )}
              {isGrouped && groupInfo && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-6 py-2.5">
                  <span className="text-[12px] text-[#64748B] tabular-nums">
                    Showing <span className="font-medium text-[#364658]">{groupInfo.total}</span> {footerNoun} in{' '}
                    <span className="font-medium text-[#364658]">{groupInfo.groups}</span> groups
                  </span>
                  <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
                    {(groupInfo.list?.length ?? 0) > 1 && (
                      <span className="relative mr-1">
                        <button
                          onClick={() => {
                            setJumpOpen((v) => !v);
                            setJumpQuery('');
                          }}
                          className="inline-flex h-7 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5FAFF]"
                        >
                          Jump to group
                          <ChevronUp size={13} className={`text-[#9CA3AF] transition-transform ${jumpOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {jumpOpen && (
                          <div className="app-menu absolute bottom-full right-0 z-50 mb-1.5 w-[280px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl">
                            <div className="p-2">
                              <input
                                autoFocus
                                value={jumpQuery}
                                onChange={(e) => setJumpQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setJumpOpen(false);
                                }}
                                onBlur={() => setJumpOpen(false)}
                                placeholder={'Search ' + (groupInfo.label ?? '').toLowerCase() + '...'}
                                className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto pb-1">
                              {(() => {
                                const q = jumpQuery.trim().toLowerCase();
                                const rowsL = (groupInfo.list ?? []).filter((g) => !q || g.key.toLowerCase().includes(q));
                                if (!rowsL.length) return <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching groups</div>;
                                return rowsL.map((g) => (
                                  <button
                                    key={g.key}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      window.dispatchEvent(new CustomEvent('jump-to-group', { detail: g.key }));
                                      setJumpOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{g.key}</span>
                                    <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#64748B]">{g.count}</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </span>
                    )}
                    Grouped by <span className="font-medium text-[#364658]">{groupInfo.label}</span>
                    <button
                      onClick={() => setClearGroupTick((t) => t + 1)}
                      className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
                    >
                      Clear
                    </button>
                  </span>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
