import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, CopyPlus, Home, LayoutList, MoreVertical, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { FilterRule } from './TicketFilterBar';

/* ─── Request listing views ──────────────────────────────────────────────────
   The Dashboards sidebar pattern brought to the listing: a DOCKED left rail
   (toggled from the panel icon beside the title) with search, tabs, favourite
   and recently-used groups, and the full view catalog. Picking a view applies
   its filter set to the grid and the page title takes the view's name. */

export interface TicketView {
  name: string;
  /** The grid filters this view applies (ids are stamped on apply). */
  rules: Omit<FilterRule, 'id'>[];
  /** User-created (saved/cloned) view — predefined ones ship with the product. */
  custom?: boolean;
  /** Technician who saved it; only the owner may delete it. */
  owner?: string;
  visibility?: 'My Self' | 'All Technician' | 'Technician In Group';
  /** Only for 'Technician In Group' — the group the view was shared with. */
  group?: string;
}

/** The signed-in technician — decides what lands in "My Views". */
export const CURRENT_USER = 'Sarah Johnson';

export const TICKET_VIEWS: TicketView[] = [
  { name: 'All Requests', rules: [] },
  { name: 'All Open Requests', rules: [{ field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] }] },
  { name: 'My Urgent or High Priority Requests', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  { name: 'My Overdue Requests', rules: [{ field: 'sla', condition: 'is', values: ['Breached'] }] },
  { name: 'Unassigned Requests in My Group', rules: [{ field: 'assignedTo', condition: 'empty', values: [] }] },
  { name: 'My Unresolved Requests', rules: [{ field: 'status', condition: 'is not', values: ['Closed', 'Completed'] }] },
  {
    name: 'Urgent or High Priority Requests in my Group',
    rules: [
      { field: 'priority', condition: 'is', values: ['Urgent', 'High'] },
      { field: 'status', condition: 'is', values: ['Open', 'In Progress', 'Pending'] },
    ],
  },
  { name: 'All Incidents', rules: [] },
  { name: 'All Service Requests', rules: [{ field: 'approval', condition: 'is', values: ['Pending approval'] }] },
  { name: 'All Spam Requests', rules: [{ field: 'subject', condition: 'contains', values: ['spam'] }] },
  { name: 'Requests Watched By Me', rules: [{ field: 'unread', condition: 'is', values: ['Has unread'] }] },
  { name: 'All Archived Requests', rules: [{ field: 'status', condition: 'is', values: ['Closed'] }] },
];

/* Saved (custom) views — what technicians build from the filter bar and share. Mine
   appear under My Views; a colleague's reaches me only through its visibility. */
export const CUSTOM_VIEW_SEEDS: TicketView[] = [
  { name: 'P1 Bridge Queue', custom: true, owner: CURRENT_USER, visibility: 'All Technician', rules: [{ field: 'priority', condition: 'is', values: ['Urgent'] }, { field: 'status', condition: 'is not', values: ['Closed', 'Completed'] }] },
  { name: 'My Hardware Replacements', custom: true, owner: CURRENT_USER, visibility: 'My Self', rules: [{ field: 'subject', condition: 'contains', values: ['laptop', 'charger', 'adapter', 'docking'] }] },
  { name: 'Awaiting Requester 3 Days+', custom: true, owner: CURRENT_USER, visibility: 'My Self', rules: [{ field: 'status', condition: 'is', values: ['Pending'] }] },
  { name: 'Floor 3 Network Escalations', custom: true, owner: CURRENT_USER, visibility: 'Technician In Group', rules: [{ field: 'subject', condition: 'contains', values: ['wifi', 'internet', 'network', 'floor 3'] }, { field: 'priority', condition: 'is', values: ['Urgent', 'High'] }] },
  { name: 'Onboarding Backlog (HR)', custom: true, owner: 'Keetion Dale', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['onboarding'] }] },
  { name: 'VPN & Remote Access', custom: true, owner: 'Shreyak Dalal', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['vpn', 'remote'] }] },
  { name: 'Printer & Peripherals', custom: true, owner: 'Novak Potai', visibility: 'Technician In Group', rules: [{ field: 'subject', condition: 'contains', values: ['printer', 'monitor', 'keyboard', 'mouse'] }] },
  { name: 'Executive Requests', custom: true, owner: 'Rahul Shukla', visibility: 'All Technician', rules: [{ field: 'priority', condition: 'is', values: ['Urgent', 'High'] }, { field: 'approval', condition: 'is', values: ['Pending approval'] }] },
  { name: 'Breached This Week', custom: true, owner: 'Kaison Potai', visibility: 'Technician In Group', rules: [{ field: 'sla', condition: 'is', values: ['Breached'] }] },
  { name: 'Access & Account Requests', custom: true, owner: 'Pratik Patial', visibility: 'All Technician', rules: [{ field: 'subject', condition: 'contains', values: ['access', 'password', 'account', 'login'] }] },
];

/* A colleague's view is only visible to me when they shared it beyond themselves. */
const visibleToMe = (v: TicketView) => v.owner === CURRENT_USER || v.visibility !== 'My Self';
const ownedByMe = (v: TicketView) => !!v.custom && (v.owner ?? CURRENT_USER) === CURRENT_USER;

const FAV_KEY = 'ticketViewFavs';
const CUSTOM_KEY = 'ticketViewCustom';
const DEFAULT_KEY = 'ticketViewDefault';

const load = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const save = (key: string, v: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable — the lists just won't persist */
  }
};

export const VIEWS_CHANGED = 'ticket-views-changed';

/** Saved views this user has stored locally (their own saves and clones). */
export const loadCustomViews = (): TicketView[] => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]') as TicketView[];
  } catch {
    return [];
  }
};

/** Create or overwrite one of MY saved views, then tell any open rail to refresh. */
export const upsertCustomView = (view: TicketView) => {
  const mine = loadCustomViews();
  const i = mine.findIndex((v) => v.name === view.name);
  const next = i >= 0 ? mine.map((v, idx) => (idx === i ? view : v)) : [...mine, view];
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the view lives for this session only */
  }
  window.dispatchEvent(new CustomEvent(VIEWS_CHANGED));
};

/** True when this name belongs to a view the signed-in user may overwrite. */
export const isMyCustomView = (name: string) =>
  [...CUSTOM_VIEW_SEEDS, ...loadCustomViews()].some((v) => v.name === name && (v.owner ?? CURRENT_USER) === CURRENT_USER);

/** The view the listing should open on, or null when the user has not set one. */
export const getDefaultView = (): TicketView | null => {
  try {
    const name = localStorage.getItem(DEFAULT_KEY);
    if (!name) return null;
    const custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]') as TicketView[];
    return [...TICKET_VIEWS, ...CUSTOM_VIEW_SEEDS, ...custom].find((v) => v.name === name) ?? null;
  } catch {
    return null;
  }
};

/** Per-row overflow menu. Body-portalled so the rail’s scroll box cannot clip it. */
function RowMenu({
  view,
  isDefault,
  onSetDefault,
  onClone,
  onDelete,
}: {
  view: TicketView;
  isDefault: boolean;
  onSetDefault: () => void;
  onClone: () => void;
  onDelete: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const items = [
    { key: 'default', label: isDefault ? 'Remove as default view' : 'Set as default view', icon: Home, run: onSetDefault },
    { key: 'clone', label: 'Clone', icon: CopyPlus, run: onClone },
    // Predefined views ship with the product — only user-made copies can be removed.
    ...(ownedByMe(view) ? [{ key: 'delete', label: 'Delete', icon: Trash2, run: onDelete, danger: true }] : []),
  ];

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          const r = btnRef.current?.getBoundingClientRect();
          if (r) setPos({ top: r.bottom + 4, left: Math.min(r.left - 150, window.innerWidth - 210) });
          setOpen((v) => !v);
        }}
        title="More actions"
        className={`flex size-6 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658] ${open ? 'visible bg-[#F1F5F9] text-[#364658]' : 'invisible group-hover:visible'}`}
      >
        <MoreVertical size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[9999] w-[200px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-xl"
          >
            {items.map((it) => (
              <button
                key={it.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  it.run();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#F9FAFB] ${it.danger ? 'text-[#DC2626]' : 'text-[#364658]'}`}
              >
                <it.icon size={14} className={`flex-shrink-0 ${it.danger ? 'text-[#DC2626]' : 'text-[#64748B]'}`} />
                <span className="flex-1 truncate">{it.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/** Collapsible section with a count badge — the Dashboards-rail group recipe. */
function ViewGroup({
  label,
  count,
  icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  count: number;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mx-2 flex w-[calc(100%-1rem)] items-center gap-1.5 rounded px-1.5 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
      >
        {open ? <ChevronDown size={14} className="flex-shrink-0 text-[#94A3B8]" /> : <ChevronRight size={14} className="flex-shrink-0 text-[#94A3B8]" />}
        {icon}
        <span className="flex-1 truncate text-[12px] font-semibold text-[#1E293B]">{label}</span>
        <span className="rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium leading-none tabular-nums text-[#64748B]">{count}</span>
      </button>
      {open && children}
    </div>
  );
}

/** View name that measures itself — the full-name tooltip appears ONLY when truncated. */
function ViewName({ name, active }: { name: string; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setClipped(el.scrollWidth > el.clientWidth + 1);
  }, [name, active]);
  const span = (
    <span ref={ref} className={`flex-1 truncate pl-1.5 pr-2 text-[12px] ${active ? 'font-medium text-[#3D8BD0]' : 'text-[#475569]'}`}>
      {name}
    </span>
  );
  if (!clipped) return span;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent side="right" className="text-wrap max-w-[280px]">{name}</TooltipContent>
    </Tooltip>
  );
}

export function TicketViewsSidebar({ active, onSelect }: { active: string; onSelect: (view: TicketView) => void }) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'all' | 'predefined' | 'mine' | 'shared'>('all');
  const [favs, setFavs] = useState<string[]>(() => load(FAV_KEY));
  const [customs, setCustoms] = useState<TicketView[]>(loadCustomViews);
  // A view saved from the toolbar must appear here immediately.
  useEffect(() => {
    const onChanged = () => setCustoms(loadCustomViews());
    window.addEventListener(VIEWS_CHANGED, onChanged);
    return () => window.removeEventListener(VIEWS_CHANGED, onChanged);
  }, []);
  const [defaultView, setDefaultView] = useState<string>(() => localStorage.getItem(DEFAULT_KEY) ?? '');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabFadeL, setTabFadeL] = useState(false);
  const [tabFadeR, setTabFadeR] = useState(false);
  const updateTabFades = () => {
    const el = tabsRef.current;
    if (!el) return;
    setTabFadeL(el.scrollLeft > 2);
    setTabFadeR(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };
  useEffect(() => {
    updateTabFades();
    const el = tabsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateTabFades);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCustoms = (next: TicketView[]) => {
    setCustoms(next);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — clones just will not persist */
    }
  };

  const setAsDefault = (name: string) => {
    const next = defaultView === name ? '' : name;
    setDefaultView(next);
    try {
      if (next) localStorage.setItem(DEFAULT_KEY, next);
      else localStorage.removeItem(DEFAULT_KEY);
    } catch {
      /* ignore */
    }
    toast.success(next ? `“${name}” is now your default view` : 'Default view cleared');
  };

  const cloneView = (v: TicketView) => {
    // "Copy of X", then "Copy of X (2)"… so repeated clones never collide.
    let name = `Copy of ${v.name}`;
    const taken = (n: string) => [...TICKET_VIEWS, ...CUSTOM_VIEW_SEEDS, ...customs].some((x) => x.name === n);
    for (let i = 2; taken(name); i += 1) name = `Copy of ${v.name} (${i})`;
    saveCustoms([...customs, { name, rules: v.rules, custom: true, owner: CURRENT_USER, visibility: 'My Self' }]);
    toast.success(`“${name}” created`);
  };

  const deleteView = (v: TicketView) => {
    saveCustoms(customs.filter((c) => c.name !== v.name));
    setFavs((prev) => {
      const next = prev.filter((fv) => fv !== v.name);
      save(FAV_KEY, next);
      return next;
    });
    if (defaultView === v.name) setAsDefault(v.name);
    toast.success(`“${v.name}” deleted`);
  };

  const toggleFav = (name: string) =>
    setFavs((prev) => {
      const next = prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name];
      save(FAV_KEY, next);
      return next;
    });


  const ql = q.trim().toLowerCase();
  const match = (v: TicketView) => !ql || v.name.toLowerCase().includes(ql);
  const saved = [...CUSTOM_VIEW_SEEDS, ...customs];
  const pool =
    tab === 'mine'
      ? saved.filter(ownedByMe)
      : tab === 'shared'
        ? saved.filter((v) => !ownedByMe(v) && visibleToMe(v))
        : tab === 'predefined'
          ? TICKET_VIEWS
          : [...TICKET_VIEWS, ...saved.filter(visibleToMe)];
  const catalog = pool.filter(match);
  const favViews = catalog.filter((v) => favs.includes(v.name));
  const otherViews = catalog.filter((v) => !favs.includes(v.name));
  /* Each view now lives in exactly one section, so the selected row is unique. */
  const activeSection = favViews.some((v) => v.name === active) ? 'fav' : 'all';

  const row = (v: TicketView, section: 'fav' | 'all' = 'all') => {
    const isActive = active === v.name && section === activeSection;
    const fav = favs.includes(v.name);
    return (
      <div
        key={v.name}
        onClick={() => onSelect(v)}
        className={`group mx-2 flex cursor-pointer items-center gap-0 rounded py-1.5 pl-1.5 pr-1.5 transition-colors ${isActive ? 'bg-[#EBF5FF]' : 'hover:bg-[#F9FAFB]'}`}
      >
        {/* Leading status slot — Home marks the view the listing opens on. */}
        <span className="flex w-4 flex-shrink-0 items-center justify-center">
          {defaultView === v.name && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Home size={12} className="text-[#3D8BD0]" />
              </TooltipTrigger>
              <TooltipContent side="right">Default view</TooltipContent>
            </Tooltip>
          )}
        </span>
        <ViewName name={v.name} active={isActive} />
        {/* Star marks a favourite in the catalog list; inside My Favourite every row is one,
            so there it stays hover-only and the row reads as just the name. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(v.name);
          }}
          title={fav ? 'Remove from favourites' : 'Add to favourites'}
          className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F1F5F9] ${fav && section !== 'fav' ? 'visible' : 'invisible group-hover:visible'}`}
        >
          <Star size={14} className={fav ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#94A3B8]'} />
        </button>
        <RowMenu
          view={v}
          isDefault={defaultView === v.name}
          onSetDefault={() => setAsDefault(v.name)}
          onClone={() => cloneView(v)}
          onDelete={() => deleteView(v)}
        />
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      <div className="flex-shrink-0 px-4 pb-1 pt-3.5">
        <h2 className="text-[16px] font-semibold text-[#1E293B]">Views</h2>
      </div>

      <div className="flex-shrink-0 px-3 pt-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            placeholder="Search views..."
            className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white"
          />
        </div>
      </div>

      {/* Tabs — All / Predefined / My Views / Shared with me; scrolls when they overflow. */}
      <div className="relative flex-shrink-0 border-b border-[#E5E7EB]">
        <div
          ref={tabsRef}
          onScroll={updateTabFades}
          className="no-scrollbar-ever flex items-center gap-2.5 overflow-x-auto px-2.5 pt-1.5"
        >
        {(
          [
            ['all', 'All'],
            ['mine', 'My Views'],
            ['shared', 'Shared with me'],
            ['predefined', 'Predefined'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-2 py-2 text-[12.5px] font-medium whitespace-nowrap transition-colors ${tab === key ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
          >
            {label}
          </button>
        ))}
        </div>
        {/* Fades sit ABOVE the row, each shown only while that side can still scroll. */}
        {tabFadeL && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        )}
        {tabFadeR && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {tab === 'mine' && catalog.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[#64748B]">You haven’t saved any views yet.</p>
            <p className="mt-1 text-[12px] text-[#9CA3AF]">Filter the list, then use “Save view” in the toolbar.</p>
          </div>
        ) : tab === 'shared' && catalog.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[#64748B]">No one has shared a view with you yet.</p>
          </div>
        ) : (
          <>
            {favViews.length > 0 && (
              <ViewGroup label="My Favourite" count={favViews.length} icon={<Star size={13} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />}>
                {favViews.map((v) => row(v, 'fav'))}
              </ViewGroup>
            )}
            {otherViews.length > 0 && (
              <ViewGroup
                label={favViews.length > 0 ? 'Other Views' : 'All Views'}
                count={otherViews.length}
                icon={<LayoutList size={13} className="flex-shrink-0 text-[#64748B]" />}
              >
                {otherViews.map((v) => row(v, 'all'))}
              </ViewGroup>
            )}
            {catalog.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">No views match “{q.trim()}”</div>
            )}
          </>
        )}
      </div>

    </aside>
  );
}
