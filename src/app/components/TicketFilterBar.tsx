import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  CalendarDays,
  Check,
  CircleDot,
  Filter,
  Flag,
  Hash,
  Hourglass,
  ListChecks,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { extraValue, slaToneOf } from './TicketTable';

/* Attribute-based filter builder (Attio / DevRev pattern): pick an attribute → it becomes
   a chip reading "Attribute · condition · value", each segment independently editable.
   Beats fixed dropdowns because every column is filterable through one predictable shape. */

export interface FilterRule {
  id: string;
  field: string;
  condition: Condition;
  values: string[];
}

type Condition = 'is' | 'is not' | 'contains' | 'is before' | 'is after' | 'empty' | 'not empty';

interface Attr {
  key: string;
  label: string;
  icon: typeof Hash;
  type: 'text' | 'select' | 'date';
  options?: { label: string; color?: string }[];
  /** Person-valued: options show an avatar in the listing's role colour. */
  people?: 'requester' | 'technician';
}

const STATUS_OPTS = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Pending', color: '#fb923c' },
  { label: 'Completed', color: '#22c55e' },
  { label: 'Closed', color: '#6b7280' },
  { label: 'Cancelled', color: '#ef4444' },
];
const PRIORITY_OPTS = [
  { label: 'Low', color: '#22c55e' },
  { label: 'Medium', color: '#fb923c' },
  { label: 'High', color: '#ef4444' },
  { label: 'Urgent', color: '#dc2626' },
];
const SLA_OPTS = [
  { label: 'Breached', color: '#ef4444' },
  { label: 'Due soon', color: '#f59e0b' },
  { label: 'On track', color: '#22c55e' },
  { label: 'Met', color: '#94a3b8' },
];
const REQUESTERS = ['Jainam Shah', 'Nandini Patel', 'Darshak Modi', 'Meera Iyer', 'Samuel Githugu', 'Kavit Gohel', 'Hetal Mori', 'Rohit Kulkarni', 'Ersin Sevinç'];
const ASSIGNEES = ['Amou Desai', 'Keetion Dale', 'Shreyak Dalal', 'Kaison Potai', 'Novak Potai', 'Rahul Shukla', 'Pratik Patial'];
const TECH_GROUPS = ['IT Support Group', 'Network Operations', 'Hardware Support Team', 'Software Support Team'];
const IMPACTS = ['On Users', 'On Department', 'Low', 'On Business'];
const DEPARTMENTS = ['Finance', 'Human Resources', 'Engineering', 'Sales', 'Operations'];
const SOURCES = ['Email', 'Support Portal', 'Technician Portal', 'Walk-in'];
const LOCATIONS = ['Ahmedabad HQ', 'Mumbai Office', 'Bengaluru DC', 'Pune Office'];
const TAGS = ['network, vpn', 'hardware', 'onboarding, access', 'printer', 'wifi, urgent'];
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const SIGNATURES = ['Not Required', 'Signed', 'Pending'];
const APPROVAL_STATES = ['Pending', 'Approved', '---'];
const opts = (list: string[]) => list.map((label) => ({ label }));
const AVATAR_BG = { requester: '#E67E22', technician: '#3D8BD0' } as const;
const initialsOf = (name: string) => {
  const p = name.split(' ').filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
};

const DATE_OPTS = [{ label: 'Today' }, { label: 'Last 7 days' }, { label: 'Last 30 days' }, { label: 'Last 90 days' }, { label: 'Older than 90 days' }];

/** Every filterable column, in grid order — the picker is a mirror of the table. */
export const FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Subject', icon: AlignLeft, type: 'text' },
  { key: 'requester', label: 'Requester', icon: UserRound, type: 'select', people: 'requester', options: REQUESTERS.map((label) => ({ label })) },
  { key: 'assignedTo', label: 'Assigned to', icon: UserCheck, type: 'select', people: 'technician', options: ASSIGNEES.map((label) => ({ label })) },
  { key: 'sla', label: 'SLA Status', icon: Hourglass, type: 'select', options: SLA_OPTS },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: STATUS_OPTS },
  { key: 'priority', label: 'Priority', icon: Flag, type: 'select', options: PRIORITY_OPTS },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date', options: DATE_OPTS },
  { key: 'approval', label: 'Approval', icon: UserCheck, type: 'select', options: [{ label: 'Pending approval', color: '#f59e0b' }, { label: 'No approval', color: '#94a3b8' }] },
  { key: 'unread', label: 'Unread updates', icon: MessageSquare, type: 'select', options: [{ label: 'Has unread', color: '#3D8BD0' }, { label: 'All read', color: '#94a3b8' }] },
  { key: 'openTasks', label: 'Tasks', icon: ListChecks, type: 'select', options: [{ label: 'Has open tasks', color: '#f59e0b' }, { label: 'All tasks done', color: '#22c55e' }] },
  /* The optional columns from Manage columns — same values the grid derives. */
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: opts([...ASSIGNEES, ...REQUESTERS, 'System']) },
  { key: 'dueByDate', label: 'Due By', icon: CalendarDays, type: 'text' },
  { key: 'techGroup', label: 'Technician Group', icon: UserCheck, type: 'select', options: opts(TECH_GROUPS) },
  { key: 'urgency', label: 'Urgency', icon: Flag, type: 'select', options: PRIORITY_OPTS },
  { key: 'impact', label: 'Impact', icon: CircleDot, type: 'select', options: opts(IMPACTS) },
  { key: 'department', label: 'Department', icon: CircleDot, type: 'select', options: opts(DEPARTMENTS) },
  { key: 'source', label: 'Source', icon: CircleDot, type: 'select', options: opts(SOURCES) },
  { key: 'location', label: 'Location', icon: CircleDot, type: 'select', options: opts(LOCATIONS) },
  { key: 'tags', label: 'Tags', icon: AlignLeft, type: 'select', options: opts(TAGS) },
  { key: 'supportLevel', label: 'Support Level', icon: CircleDot, type: 'select', options: opts(TIERS) },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'text' },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'firstResponseDueBy', label: 'First Response Due By', icon: CalendarDays, type: 'text' },
  { key: 'closedBy', label: 'Closed By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'resolvedBy', label: 'Resolved By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'requestAge', label: 'Request Age', icon: Hourglass, type: 'text' },
  { key: 'approvalStatus', label: 'Approval Status', icon: UserCheck, type: 'select', options: opts(APPROVAL_STATES) },
  { key: 'lastApprovedDate', label: 'Last Approved Date', icon: CalendarDays, type: 'text' },
  { key: 'digitalSignature', label: 'Digital Signature Status', icon: CircleDot, type: 'select', options: opts(SIGNATURES) },
  { key: 'lastSignedDate', label: 'Last Signed Date', icon: CalendarDays, type: 'text' },
  { key: 'resolutionTime', label: 'Resolution Time', icon: Hourglass, type: 'text' },
  { key: 'closedDuration', label: 'Closed Time Duration', icon: Hourglass, type: 'text' },
];

const CONDITIONS: Record<Attr['type'], Condition[]> = {
  text: ['is', 'is not', 'contains', 'empty', 'not empty'],
  select: ['is', 'is not', 'empty', 'not empty'],
  date: ['is', 'is before', 'is after', 'empty', 'not empty'],
};
const NEEDS_VALUE = (c: Condition) => c !== 'empty' && c !== 'not empty';

export const attrOf = (key: string) => FILTER_ATTRS.find((a) => a.key === key);

/** The grid names a few columns differently from their underlying field. */
const COL_TO_ATTR: Record<string, string> = {
  assignee: 'assignedTo',
  dueStatus: 'sla',
  created: 'createdBy',
};

/* ── Evaluation ───────────────────────────────────────────────────────────── */

const DAY = 86400000;
const valueFor = (t: Ticket, field: string): string => {
  switch (field) {
    case 'assignedTo':
      return t.assignedTo.name;
    case 'sla': {
      const tone = slaToneOf(t);
      return tone === 'breached' ? 'Breached' : tone === 'due' ? 'Due soon' : tone === 'done' ? 'Met' : 'On track';
    }
    case 'approval':
      return t.approval ? 'Pending approval' : 'No approval';
    case 'unread':
      return (t.unread ?? 0) > 0 ? 'Has unread' : 'All read';
    case 'openTasks':
      return (t.tasksTotal ?? 0) - (t.tasksDone ?? 0) > 0 ? 'Has open tasks' : 'All tasks done';
    default:
      if (field in t) return String((t as any)[field] ?? '');
      return extraValue(field, t);
  }
};

/** Relative date buckets — "Last 7 days" style windows measured from now. */
const inDateBucket = (d: Date, bucket: string) => {
  const age = Date.now() - d.getTime();
  switch (bucket) {
    case 'Today':
      return age < DAY;
    case 'Last 7 days':
      return age < 7 * DAY;
    case 'Last 30 days':
      return age < 30 * DAY;
    case 'Last 90 days':
      return age < 90 * DAY;
    case 'Older than 90 days':
      return age >= 90 * DAY;
    default:
      return true;
  }
};

export function applyFilters(tickets: Ticket[], rules: FilterRule[]): Ticket[] {
  const live = rules.filter((r) => !NEEDS_VALUE(r.condition) || r.values.length > 0);
  if (!live.length) return tickets;
  return tickets.filter((t) =>
    live.every((r) => {
      const attr = attrOf(r.field);
      if (attr?.type === 'date') {
        const d = (t as any)[r.field] as Date;
        if (r.condition === 'empty') return !d;
        if (r.condition === 'not empty') return !!d;
        if (!d) return false;
        if (r.condition === 'is') return r.values.some((v) => inDateBucket(d, v));
        // Before/after use the bucket edge: "is before Last 7 days" = older than 7 days.
        const before = r.condition === 'is before';
        return r.values.some((v) => (before ? !inDateBucket(d, v) : inDateBucket(d, v)));
      }
      const val = valueFor(t, r.field);
      switch (r.condition) {
        case 'empty':
          return !val;
        case 'not empty':
          return !!val;
        case 'contains':
          return r.values.some((v) => val.toLowerCase().includes(v.toLowerCase()));
        case 'is not':
          return !r.values.some((v) => val.toLowerCase() === v.toLowerCase());
        default:
          return r.values.some((v) => val.toLowerCase() === v.toLowerCase());
      }
    }),
  );
}

/* ── UI ───────────────────────────────────────────────────────────────────── */

const POPUP = 'absolute z-[60] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl';

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

/** Attribute picker — the list of columns you can filter on. */
function AttrPicker({ onPick, onClose, align = 'left' }: { onPick: (key: string) => void; onClose: () => void; align?: 'left' | 'right' }) {
  const [q, setQ] = useState('');
  const ref = useOutside<HTMLDivElement>(true, onClose);
  const rows = FILTER_ATTRS.filter((a) => a.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div ref={ref} className={`${POPUP} top-full mt-1 w-[280px] ${align === 'left' ? 'left-0' : 'right-0'}`}>
      <div className="border-b border-[#F0F2F5] p-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search attributes..."
            className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-[300px] overflow-y-auto py-1">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Request attributes</div>
        {rows.length ? (
          rows.map((a) => (
            <button
              key={a.key}
              onClick={() => onPick(a.key)}
              className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
            >
              {a.label}
            </button>
          ))
        ) : (
          <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching attributes</div>
        )}
      </div>
    </div>
  );
}

/** One filter chip: attribute · condition · value · ⋮ */
function Chip({
  rule,
  onChange,
  onRemove,
  autoOpen,
}: {
  rule: FilterRule;
  onChange: (r: FilterRule) => void;
  onRemove: () => void;
  /** Added from a column header — open the value list so the next click picks a value. */
  autoOpen?: boolean;
}) {
  const [condOpen, setCondOpen] = useState(false);
  const [valOpen, setValOpen] = useState(!!autoOpen);
  /** Selection as of popup-open — drives the selected-first ordering for this open. */
  const openOrderRef = useRef<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const condRef = useOutside<HTMLDivElement>(condOpen, () => setCondOpen(false));
  const valRef = useOutside<HTMLDivElement>(valOpen, () => setValOpen(false));
  const menuRef = useOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  const attr = attrOf(rule.field);
  if (!attr) return null;
  const Icon = attr.icon;
  const needsValue = NEEDS_VALUE(rule.condition);
  const options = attr.options ?? [];
  const shown = [...options]
    .sort((a, b) => Number(openOrderRef.current.has(b.label)) - Number(openOrderRef.current.has(a.label)))
    .filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));

  const toggleValue = (v: string) =>
    onChange({ ...rule, values: rule.values.includes(v) ? rule.values.filter((x) => x !== v) : [...rule.values, v] });

  const seg = 'flex h-full items-center px-2 text-[12px] transition-colors hover:bg-[#F1F5F9]';

  return (
    <div className="relative flex h-8 items-stretch overflow-visible rounded border border-[#DFE5ED] bg-white">
      {/* Attribute — fixed; change it by removing the chip, which keeps the row honest. */}
      <span className="flex items-center border-r border-[#EEF1F4] px-2 text-[12px] font-medium text-[#364658]">
        {attr.label}
      </span>

      {/* Condition */}
      <div className="relative flex" ref={condRef}>
        <button onClick={() => setCondOpen((v) => !v)} className={`${seg} border-r border-[#EEF1F4] text-[#64748B]`}>
          {rule.condition}
        </button>
        {condOpen && (
          <div className={`${POPUP} left-0 top-full mt-1 w-[150px] py-1`}>
            {CONDITIONS[attr.type].map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange({ ...rule, condition: c, values: NEEDS_VALUE(c) ? rule.values : [] });
                  setCondOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
              >
                {c}
                {rule.condition === c && <Check size={13} className="text-[#3D8BD0]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value */}
      {needsValue && (
        <div className="relative flex" ref={valRef}>
          <button
            onClick={() => {
              if (!valOpen) openOrderRef.current = new Set(rule.values);
              setValOpen(!valOpen);
            }}
            className={`${seg} gap-1 border-r border-[#EEF1F4]`}
          >
            {rule.values.length === 0 ? (
              <span className="text-[#9CA3AF]">Select option...</span>
            ) : (
              <>
                <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#364658]">{rule.values[0]}</span>
                {rule.values.length > 1 && <span className="text-[11px] text-[#64748B]">+{rule.values.length - 1}</span>}
              </>
            )}
          </button>
          {valOpen && (
            <div className={`${POPUP} left-0 top-full mt-1 w-[260px]`}>
              {attr.type === 'text' ? (
                <div className="p-2">
                  <input
                    autoFocus
                    value={rule.values[0] ?? ''}
                    onChange={(e) => onChange({ ...rule, values: e.target.value ? [e.target.value] : [] })}
                    onKeyDown={(e) => e.key === 'Enter' && setValOpen(false)}
                    placeholder={`Enter ${attr.label.toLowerCase()}...`}
                    className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <div className="border-b border-[#F0F2F5] p-2">
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search..."
                      className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="max-h-[260px] overflow-y-auto py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Options</div>
                    {shown.length ? (
                      shown.map((o) => {
                        const on = rule.values.includes(o.label);
                        return (
                          <button
                            key={o.label}
                            onClick={() => toggleValue(o.label)}
                            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[#F9FAFB]"
                          >
                            <input type="checkbox" readOnly checked={on} tabIndex={-1} className="pointer-events-none" />
                            {attr.people ? (
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <span
                                  className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                                  style={{ background: AVATAR_BG[attr.people] }}
                                >
                                  {initialsOf(o.label)}
                                </span>
                                <span className="truncate text-[13px] text-[#364658]">{o.label}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#364658]">
                                {o.color && <span className="size-2 flex-shrink-0 rounded-full" style={{ background: o.color }} />}
                                {o.label}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching options</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row menu */}
      <div className="relative flex" ref={menuRef}>
        <button onClick={() => setMenuOpen((v) => !v)} className={`${seg} px-1.5 text-[#9CA3AF]`}>
          <MoreVertical size={13} />
        </button>
        {menuOpen && (
          <div className={`${POPUP} right-0 top-full mt-1 w-[160px] py-1`}>
            <button
              onClick={() => onChange({ ...rule, values: [] })}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
            >
              <X size={13} className="text-[#7B8FA5]" />
              Clear value
            </button>
            <button
              onClick={onRemove}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
            >
              <Trash2 size={13} />
              Delete filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketFilterBar({ rules, setRules }: { rules: FilterRule[]; setRules: (r: FilterRule[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  /* A column header's Filter action adds that column here and opens its value list —
     the filter always lives in one place, no matter where it was created. */
  useEffect(() => {
    const onAdd = (e: Event) => {
      const colKey = String((e as CustomEvent).detail ?? '');
      const key = COL_TO_ATTR[colKey] ?? colKey;
      const attr = attrOf(key);
      if (!attr) return;
      const existing = rules.find((r) => r.field === key);
      if (existing) {
        // Already filtered on this column — reopen it instead of stacking a duplicate.
        setAutoOpenId(existing.id);
        return;
      }
      const id = `${key}-${Date.now()}`;
      setRules([...rules, { id, field: key, condition: CONDITIONS[attr.type][0], values: [] }]);
      setAutoOpenId(id);
    };
    window.addEventListener('add-column-filter', onAdd as EventListener);
    return () => window.removeEventListener('add-column-filter', onAdd as EventListener);
  }, [rules, setRules]);

  const addRule = (field: string) => {
    const attr = attrOf(field)!;
    setRules([...rules, { id: `${field}-${rules.length}-${Date.now()}`, field, condition: CONDITIONS[attr.type][0], values: [] }]);
    setPickerOpen(false);
  };

  return (
    <>
      {rules.map((r) => (
        <Chip
          key={autoOpenId === r.id ? `${r.id}-open` : r.id}
          rule={r}
          onChange={(next) => setRules(rules.map((x) => (x.id === r.id ? next : x)))}
          onRemove={() => setRules(rules.filter((x) => x.id !== r.id))}
          autoOpen={autoOpenId === r.id}
        />
      ))}

      {/* Entry point: a labelled button while empty, a compact + once chips exist. */}
      <div className="relative">
        {rules.length === 0 ? (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >
            <Filter size={14} />
            Filters
          </button>
        ) : (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-dashed border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
            title="Add filter"
          >
            <Plus size={15} />
          </button>
        )}
        {pickerOpen && <AttrPicker onPick={addRule} onClose={() => setPickerOpen(false)} />}
      </div>

      {rules.length > 0 && (
        <button
          onClick={() => setRules([])}
          className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
        >
          Clear all
        </button>
      )}
    </>
  );
}
