import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Filter, RefreshCw, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket } from './TicketListPage';

/* Toolbar directly above the grid — the controls that act ON the grid live with the grid,
   not up in the page header. Left: find and narrow. Right: refresh, sort, display. */

export interface GridFilters {
  status: string[];
  priority: string[];
}

const STATUSES = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Pending', color: '#fb923c' },
  { label: 'Completed', color: '#22c55e' },
  { label: 'Closed', color: '#6b7280' },
  { label: 'Cancelled', color: '#ef4444' },
];
const PRIORITIES = [
  { label: 'Low', color: '#22c55e' },
  { label: 'Medium', color: '#fb923c' },
  { label: 'High', color: '#ef4444' },
  { label: 'Urgent', color: '#dc2626' },
];
const SORTABLE: { field: keyof Ticket; label: string }[] = [
  { field: 'id', label: 'ID' },
  { field: 'subject', label: 'Subject' },
  { field: 'requester', label: 'Requester' },
  { field: 'assignedTo', label: 'Assigned to' },
  { field: 'dueBy', label: 'SLA Status' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
  { field: 'createdBy', label: 'Created Date' },
];

const ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]';
const POPUP = 'absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl';

/** Closes a popup on any outside click — shared by the three right-hand menus. */
function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

export function TicketGridToolbar({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  sorts,
  onSort,
  onClearSorts,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: GridFilters;
  setFilters: (f: GridFilters) => void;
  sorts: { column: keyof Ticket; dir: 'asc' | 'desc' }[];
  onSort: (column: keyof Ticket) => void;
  onClearSorts: () => void;
}) {
  // Search stays collapsed to an icon until used — it costs nothing at rest and
  // expands in place, so the toolbar never carries a permanently empty field.
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const filterRef = useOutside<HTMLDivElement>(filterOpen, () => setFilterOpen(false));
  const sortRef = useOutside<HTMLDivElement>(sortOpen, () => setSortOpen(false));
  const gearRef = useOutside<HTMLDivElement>(gearOpen, () => setGearOpen(false));

  const activeFilters = filters.status.length + filters.priority.length;

  const toggle = (key: keyof GridFilters, value: string) => {
    const list = filters[key];
    setFilters({ ...filters, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  const refresh = () => {
    setSpinning(true);
    window.setTimeout(() => setSpinning(false), 700);
    toast.success('Requests refreshed');
  };

  const FilterGroup = ({ title, k, options }: { title: string; k: keyof GridFilters; options: typeof STATUSES }) => (
    <div className="px-3 py-2.5">
      <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = filters[k].includes(o.label);
          return (
            <button
              key={o.label}
              onClick={() => toggle(k, o.label)}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] transition-colors ${
                on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
              }`}
            >
              <span className="size-2 flex-shrink-0 rounded-full" style={{ background: o.color }} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2 pb-2.5 pl-6 pr-4">
      {/* ── Left: find and narrow ── */}
      {searchOpen || searchQuery ? (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => !searchQuery && setSearchOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                setSearchOpen(false);
              }
            }}
            placeholder="Search requests..."
            className="h-8 w-[260px] rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#364658]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => setSearchOpen(true)} className={ICON_BTN} title="Search">
          <Search size={16} />
        </button>
      )}

      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${
            activeFilters ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'
          }`}
        >
          <Filter size={14} />
          Filters
          {activeFilters > 0 && (
            <span className="flex size-4 items-center justify-center rounded-sm bg-[#3D8BD0] text-[10px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        {filterOpen && (
          <div className={`${POPUP} left-0 w-[300px]`}>
            <FilterGroup title="Status" k="status" options={STATUSES} />
            <div className="border-t border-[#F0F2F5]" />
            <FilterGroup title="Priority" k="priority" options={PRIORITIES} />
            <div className="flex items-center justify-between border-t border-[#F0F2F5] px-3 py-2">
              <button
                onClick={() => setFilters({ status: [], priority: [] })}
                className="text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#364658]"
              >
                Clear all
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="h-7 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: refresh, sort, display ── */}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={refresh} className={ICON_BTN} title="Refresh">
          <RefreshCw size={16} className={spinning ? 'animate-spin' : ''} />
        </button>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className={`${ICON_BTN} ${sorts.length ? '!border-[#3D8BD0] !bg-[#EBF5FF] !text-[#3D8BD0]' : ''}`}
            title="Sort"
          >
            <ArrowUpDown size={16} />
          </button>
          {sortOpen && (
            <div className={`${POPUP} w-[248px]`}>
              <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                Sort by
              </div>
              {/* Each row cycles asc → desc → off, mirroring the header controls, and the
                  rank badge shows which column breaks ties first. */}
              <div className="pb-1">
                {SORTABLE.map((s) => {
                  const i = sorts.findIndex((x) => x.column === s.field);
                  const entry = i >= 0 ? sorts[i] : null;
                  return (
                    <button
                      key={String(s.field)}
                      onClick={() => onSort(s.field)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <span className={`flex-1 truncate text-[13px] ${entry ? 'font-medium text-[#364658]' : 'text-[#64748B]'}`}>
                        {s.label}
                      </span>
                      {entry && sorts.length > 1 && (
                        <span className="flex size-4 items-center justify-center rounded-sm bg-[#EBF5FF] text-[10px] font-semibold text-[#3D8BD0]">
                          {i + 1}
                        </span>
                      )}
                      {entry ? (
                        entry.dir === 'asc' ? (
                          <ArrowUp size={13} className="text-[#3D8BD0]" />
                        ) : (
                          <ArrowDown size={13} className="text-[#3D8BD0]" />
                        )
                      ) : (
                        <ArrowUpDown size={13} className="text-[#CBD5E1]" />
                      )}
                    </button>
                  );
                })}
              </div>
              {sorts.length > 0 && (
                <div className="border-t border-[#F0F2F5] px-3 py-2">
                  <button
                    onClick={() => {
                      onClearSorts();
                      setSortOpen(false);
                    }}
                    className="text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
                  >
                    Clear sorting
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={gearRef}>
          <button onClick={() => setGearOpen((v) => !v)} className={ICON_BTN} title="Settings">
            <Settings2 size={16} />
          </button>
          {gearOpen && (
            <div className={`${POPUP} w-[220px] py-1`}>
              <button
                onClick={() => {
                  // The grid owns the column manager; the toolbar just asks for it.
                  window.dispatchEvent(new CustomEvent('open-column-manager'));
                  setGearOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
              >
                <Settings2 size={14} className="text-[#7B8FA5]" />
                Manage columns
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('ticketListColumnsV2');
                  toast.success('Grid layout reset — reloading');
                  window.setTimeout(() => window.location.reload(), 600);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
              >
                <Check size={14} className="text-[#7B8FA5]" />
                Reset grid layout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
