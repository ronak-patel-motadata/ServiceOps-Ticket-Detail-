import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpDown, Check, ChevronDown, Columns3, GripVertical, ListChecks, MessageSquare, Move, Search, UserCheck } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Inline-editable cell — the Key Information recipe from the detail page: borderless value
   that fills on hover with a chevron appearing at its right, click opens the option list.
   The menu renders in a body PORTAL because the grid scrolls on both axes and would
   otherwise clip it. */
interface CellOption { label: string; color?: string; initials?: string; statusColor?: string }
function InlineSelect({
  options,
  value,
  onPick,
  user,
  accent = '#3D8BD0',
  showUnassigned = true,
  searchPlaceholder = 'Search for users...',
  children,
}: {
  options: CellOption[];
  value?: string;
  onPick: (label: string) => void;
  /* User picker — the detail-page Assignee menu: search box, an Unassigned row, avatars,
     a presence dot and a check on the current person. `accent` colours the avatars
     (blue technicians, orange requesters); requesters have no Unassigned row. */
  user?: boolean;
  accent?: string;
  showUnassigned?: boolean;
  searchPlaceholder?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = user ? 300 : Math.min(options.length * 38 + 16, 260);
    const w = user ? 288 : Math.max(r.width, 190);
    const below = window.innerHeight - r.bottom > menuH + 8;
    setPos({
      top: below ? r.bottom + 4 : Math.max(8, r.top - 4 - menuH),
      left: Math.min(r.left, window.innerWidth - w - 16),
      width: w,
    });
    setQuery('');
    setOpen(true);
  };
  /* A scroll of the PAGE invalidates the anchor, so close rather than let the menu drift —
     but scrolling INSIDE the menu (its own option list) must not close it. */
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  return (
    <div className="group/cell relative inline-flex max-w-full">
      <button
        ref={btnRef}
        onClick={toggle}
        className={`inline-flex h-7 max-w-full items-center rounded px-2 pr-6 text-left transition-colors ${open ? 'bg-[#EEF1F5]' : 'hover:bg-[#F3F4F6]'}`}
      >
        <span className="min-w-0 truncate">{children}</span>
      </button>
      <ChevronDown
        size={14}
        className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#7B8FA5] transition-opacity ${open ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100'}`}
      />
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="z-[9999] rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {user ? (
              <>
                <div className="px-3 pb-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      autoFocus
                      type="text"
                      placeholder={searchPlaceholder}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                    />
                  </div>
                </div>
                {showUnassigned && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPick('Unassigned'); setOpen(false); }}
                    className={`flex w-full items-center gap-3 border-b border-[#E5E7EB] px-3 py-2 text-left transition-colors ${value === 'Unassigned' ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}
                  >
                    <span className="size-5 flex-shrink-0 rounded-full border-2 border-dashed border-[#9CA3AF]" />
                    <span className={`min-w-0 flex-1 truncate text-[13px] ${value === 'Unassigned' ? 'font-medium text-[#1E293B]' : 'text-[#364658]'}`}>Unassigned</span>
                    <span className="size-2 flex-shrink-0" />
                    <Check size={15} className={`flex-shrink-0 ${value === 'Unassigned' ? 'text-[#3D8BD0]' : 'invisible'}`} />
                  </button>
                )}
                <div className="max-h-[190px] overflow-y-auto py-1">
                  {(() => {
                    const list = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
                    if (!list.length) {
                      return <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No users found</div>;
                    }
                    return list.map((o) => {
                      const active = value === o.label;
                      return (
                        <button
                          key={o.label}
                          onClick={(e) => { e.stopPropagation(); onPick(o.label); setOpen(false); }}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${active ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}
                        >
                          <span
                            className={`flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white ${active ? 'ring-2 ring-[#3D8BD0]/30' : ''}`}
                            style={{ backgroundColor: accent }}
                          >
                            {o.initials}
                          </span>
                          <span className={`min-w-0 flex-1 truncate text-[13px] ${active ? 'font-medium text-[#1E293B]' : 'text-[#364658]'}`}>{o.label}</span>
                          <span
                            className="size-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: o.statusColor }}
                            title={presenceLabel(o.statusColor)}
                          />
                          <Check size={15} className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'invisible'}`} />
                        </button>
                      );
                    });
                  })()}
                </div>
              </>
            ) : (
              <div className="max-h-[260px] overflow-y-auto py-1">
                {options.map((o) => {
                  const active = value === o.label;
                  return (
                    <button
                      key={o.label}
                      onClick={(e) => { e.stopPropagation(); onPick(o.label); setOpen(false); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${active ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}
                    >
                      <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                      <span className={`min-w-0 flex-1 truncate text-[13px] ${active ? 'font-medium text-[#1E293B]' : 'text-[#364658]'}`}>{o.label}</span>
                      <Check size={15} className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'invisible'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

const STATUS_OPTIONS: CellOption[] = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Pending', color: '#fb923c' },
  { label: 'Completed', color: '#22c55e' },
  { label: 'Closed', color: '#6b7280' },
  { label: 'Cancelled', color: '#ef4444' },
];
const PRIORITY_OPTIONS: CellOption[] = [
  { label: 'Low', color: '#22c55e' },
  { label: 'Medium', color: '#fb923c' },
  { label: 'High', color: '#ef4444' },
  { label: 'Urgent', color: '#dc2626' },
];
const ASSIGNEE_OPTIONS: CellOption[] = [
  { label: 'Amou Desai', initials: 'AD', color: '#3D8BD0', statusColor: '#10B981' },
  { label: 'Keetion Dale', initials: 'KD', color: '#8B5CF6', statusColor: '#10B981' },
  { label: 'Shreyak Dalal', initials: 'SD', color: '#EC4899', statusColor: '#F59E0B' },
  { label: 'Kaison Potai', initials: 'KP', color: '#F59E0B', statusColor: '#6B7280' },
  { label: 'Novak Potai', initials: 'NP', color: '#10B981', statusColor: '#10B981' },
  { label: 'Rahul Shukla', initials: 'RS', color: '#0EA5E9', statusColor: '#10B981' },
  { label: 'Pratik Patial', initials: 'PP', color: '#14B8A6', statusColor: '#F59E0B' },
];
/* Every profile chip in the grid is the PRIMARY BLUE — one calm colour column instead of
   a rainbow; identity comes from the initials, presence/status from their own columns. */
const requesterAvatar = (name: string) => {
  const clean = name?.trim() || '';
  const initials = clean.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return { initials, color: '#3D8BD0' };
};
/* Task names shown in the hover card, themed by subject — the same mapping idea the
   detail page's seedTasksFor/TASK_THEMES uses, so both screens tell one story. */
const taskListFor = (subject: string): string[] => {
  const s2 = subject.toLowerCase();
  if (s2.includes('onboarding')) return ['IT - Acquire Laptop', 'IT - Create Email ID and Accounts', 'Admin - Workstation Allocation', 'Admin - Joining Kit Allocation'];
  if (s2.includes('macbook') || s2.includes('request for')) return ['Manager approval', 'Procurement review', 'Vendor PO creation', 'Asset tagging & handover'];
  if (s2.includes('internet') || s2.includes('wifi')) return ['Check access point health', 'Verify VLAN and DHCP scope', 'Reset network adapter', 'Confirm stable connectivity'];
  if (s2.includes('laptop') || s2.includes('charger')) return ['Diagnose hardware fault', 'Arrange replacement unit', 'Transfer user data', 'Update asset record'];
  return ['Initial diagnosis', 'Apply resolution steps', 'Verify with requester', 'Close with resolution note'];
};
const REQUESTER_OPTIONS: CellOption[] = ['Manual', 'Prashant Pandhe', 'Arnav Desai', 'Agnika Mir', 'Ashish', 'Jainam Shah', 'Kavit Gohel', 'Hetal Mori', 'Darshak Modi'].map((n) => ({
  label: n,
  initials: requesterAvatar(n).initials,
}));
interface ColDef { key: string; label: string; flex?: boolean; w?: number }

/* ------- Optional columns (the Manage-columns popup) + their derived values ------- */
const EXTRA_COLS: ColDef[] = [
  { key: 'createdByUser', label: 'Created By', w: 150 },
  { key: 'dueByDate', label: 'Due By', w: 185 },
  { key: 'techGroup', label: 'Technician Group', w: 165 },
  { key: 'urgency', label: 'Urgency', w: 110 },
  { key: 'impact', label: 'Impact', w: 130 },
  { key: 'department', label: 'Department', w: 140 },
  { key: 'source', label: 'Source', w: 135 },
  { key: 'location', label: 'Location', w: 150 },
  { key: 'tags', label: 'Tags', w: 150 },
  { key: 'supportLevel', label: 'Support Level', w: 120 },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', w: 185 },
  { key: 'lastUpdatedBy', label: 'Last Updated By', w: 150 },
  { key: 'firstResponseDueBy', label: 'First Response Due By', w: 190 },
  { key: 'closedBy', label: 'Closed By', w: 140 },
  { key: 'resolvedBy', label: 'Resolved By', w: 140 },
  { key: 'requestAge', label: 'Request Age', w: 160 },
  { key: 'approvalStatus', label: 'Approval Status', w: 135 },
  { key: 'lastApprovedDate', label: 'Last Approved Date', w: 185 },
  { key: 'digitalSignature', label: 'Digital Signature Status', w: 175 },
  { key: 'lastSignedDate', label: 'Last Signed Date', w: 185 },
  { key: 'resolutionTime', label: 'Resolution Time', w: 150 },
  { key: 'closedDuration', label: 'Closed Time Duration', w: 165 },
];

const DAYS3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d: Date) => {
  const h12 = d.getHours() % 12 || 12;
  const ap = d.getHours() < 12 ? 'AM' : 'PM';
  return `${DAYS3[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${MONS3[d.getMonth()]}/${d.getFullYear()} ${String(h12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
};
// Deterministic per-ticket hash so every optional column shows stable, believable values.
const hx = (id: string, salt: number) => {
  let n = salt;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return n;
};
const extraValue = (key: string, t: Ticket): string => {
  const closed = t.status === 'Closed' || t.status === 'Completed';
  const h = (salt: number, mod: number) => hx(t.id, salt) % mod;
  switch (key) {
    case 'createdByUser': return [t.requester, 'System', t.assignedTo.name][h(1, 3)];
    case 'dueByDate': return fmtDate(t.dueBy);
    case 'techGroup': return ['IT Support Group', 'Network Operations', 'Hardware Support Team', 'Software Support Team'][h(2, 4)];
    case 'urgency': return t.priority;
    case 'impact': return ['On Users', 'On Department', 'Low', 'On Business'][h(3, 4)];
    case 'department': return ['Finance', 'Human Resources', 'Engineering', 'Sales', 'Operations'][h(4, 5)];
    case 'source': return ['Email', 'Support Portal', 'Technician Portal', 'Walk-in'][h(5, 4)];
    case 'location': return ['Ahmedabad HQ', 'Mumbai Office', 'Bengaluru DC', 'Pune Office'][h(6, 4)];
    case 'tags': return ['network, vpn', 'hardware', 'onboarding, access', 'printer', 'wifi, urgent'][h(7, 5)];
    case 'supportLevel': return ['Tier 1', 'Tier 2', 'Tier 3'][h(8, 3)];
    case 'lastUpdatedDate': return fmtDate(new Date(t.createdBy.getTime() + (h(9, 40) + 8) * 3600e3));
    case 'lastUpdatedBy': return t.assignedTo.name;
    case 'firstResponseDueBy': return fmtDate(new Date(t.createdBy.getTime() + 4 * 3600e3));
    case 'closedBy': return closed ? t.assignedTo.name : '---';
    case 'resolvedBy': return closed ? t.assignedTo.name : '---';
    case 'requestAge': return `${18 + h(10, 9)} day(s) ${h(11, 23)} hours`;
    case 'approvalStatus': return t.approval ? 'Pending' : closed ? 'Approved' : '---';
    case 'lastApprovedDate': return !t.approval && closed ? fmtDate(t.dueBy) : '---';
    case 'digitalSignature': return ['Not Required', 'Signed', 'Pending'][h(12, 3)];
    case 'lastSignedDate': return h(12, 3) === 1 ? fmtDate(t.dueBy) : '---';
    case 'resolutionTime': return closed ? ['3d 2hr 26min', '19hr 41min', '5d 4hr 12min', '23hr 38min'][h(13, 4)] : '---';
    case 'closedDuration': return closed ? `${17 + h(14, 8)} day(s)` : '---';
    default: return '---';
  }
};

/* Manage-columns popup — active set on top (drag to reorder, untick to remove), then a
   searchable list of everything addable; Apply commits. Body portal, anchored under the
   trigger, which is sticky — so it never drifts while the grid scrolls. */
function ColumnManager({
  anchor,
  catalog,
  active,
  onApply,
  onClose,
}: {
  anchor: { right: number; bottom: number };
  catalog: ColDef[];
  active: string[];
  onApply: (keys: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(active);
  const [q, setQ] = useState('');
  const [rowDrag, setRowDrag] = useState<string | null>(null);
  const [rowOver, setRowOver] = useState<string | null>(null);
  /* A freshly ticked column appends at the END of the active list, which scrolls — so
     auto-scroll it into view and flash it blue for a beat, or the add is invisible. */
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!justAdded) return;
    bodyRef.current
      ?.querySelector(`[data-colrow="${justAdded}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const t = window.setTimeout(() => setJustAdded(null), 1400);
    return () => window.clearTimeout(t);
  }, [justAdded]);
  const W = 292;
  const left = Math.max(8, Math.min(anchor.right - W, window.innerWidth - W - 8));
  const top = anchor.bottom + 6;
  const maxH = Math.min(580, window.innerHeight - top - 16);
  const activeDefs = draft.map((k) => catalog.find((c) => c.key === k)).filter(Boolean) as ColDef[];
  const availDefs = catalog.filter((c) => !draft.includes(c.key) && c.label.toLowerCase().includes(q.trim().toLowerCase()));
  const dropRow = (target: string) => {
    if (rowDrag && rowDrag !== target) {
      setDraft((d) => {
        const next = d.filter((k) => k !== rowDrag);
        next.splice(next.indexOf(target), 0, rowDrag);
        return next;
      });
    }
    setRowDrag(null);
    setRowOver(null);
  };
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{ position: 'fixed', top, left, width: W, maxHeight: maxH }}
        className="z-[9999] flex flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
      >
        <div className="border-b border-[#F0F2F5] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Manage columns</div>
        {/* Active columns — in grid order */}
        {/* ONE scroll for both sections — on short screens the available list can use the
            whole popup height instead of being squeezed to two rows by a fixed top box. */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="py-1">
          {activeDefs.map((c) => (
            <div
              key={c.key}
              data-colrow={c.key}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setRowDrag(c.key); }}
              onDragOver={(e) => { e.preventDefault(); if (rowOver !== c.key) setRowOver(c.key); }}
              onDragLeave={() => { if (rowOver === c.key) setRowOver(null); }}
              onDrop={(e) => { e.preventDefault(); dropRow(c.key); }}
              onDragEnd={() => { setRowDrag(null); setRowOver(null); }}
              className={`relative flex cursor-grab select-none items-center gap-2.5 px-3 py-1.5 transition-colors duration-500 ${justAdded === c.key ? 'bg-[#EBF5FF]' : 'hover:bg-[#F9FAFB]'} ${rowDrag === c.key ? 'opacity-40' : ''}`}
            >
              {rowOver === c.key && rowDrag && rowDrag !== c.key && (
                <span className="absolute inset-x-2 top-0 h-[2px] rounded bg-[#3D8BD0]" />
              )}
              <Move size={13} className="flex-shrink-0 text-[#9CA3AF]" />
              <input
                type="checkbox"
                checked
                onChange={() => setDraft((d) => d.filter((k) => k !== c.key))}
                className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0]"
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.label}</span>
            </div>
          ))}
        </div>
        {/* Addable columns */}
          <div className="sticky top-0 z-10 border-y border-[#E5E7EB] bg-white px-3 py-2">
            <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
            />
          </div>
        </div>
          <div className="py-1">
          {availDefs.length ? (
            availDefs.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-[#F9FAFB]">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => { setDraft((d) => [...d, c.key]); setJustAdded(c.key); }}
                  className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0]"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.label}</span>
              </label>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No columns found</div>
          )}
          </div>
        </div>
        <div className="flex justify-end border-t border-[#E5E7EB] px-3 py-2.5">
          <button
            onClick={() => { onApply(draft); onClose(); }}
            className="h-8 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
          >
            Apply
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

const presenceLabel = (c?: string) => (c === '#10B981' ? 'Available' : c === '#F59E0B' ? 'Away' : 'Offline');
const statusColor = (v: string) => STATUS_OPTIONS.find((o) => o.label === v)?.color ?? '#6b7280';

/* Due By Status — the SLA pill from the detail page: an hourglass in the SLA colour with a
   tinted background. Breached flips the glass over (sand run out) and turns red, a tight
   deadline is amber, anything comfortable is green. Closed rows have nothing left to run. */
type SlaTone = 'breached' | 'due' | 'ok' | 'done';
const SLA_TONE: Record<SlaTone, { bg: string; fg: string; flip?: boolean }> = {
  breached: { bg: '#FFEBEE', fg: '#E74C3C', flip: true },
  due: { bg: '#FFF3E0', fg: '#F39C12' },
  ok: { bg: '#E8F5E9', fg: '#27AE60' },
  done: { bg: '#F1F5F9', fg: '#64748B' },
};
function DueByPill({ tone, label }: { tone: SlaTone; label: string }) {
  const t = SLA_TONE[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5" style={{ backgroundColor: t.bg }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="13"
        viewBox="0 0 12 16"
        fill="none"
        style={t.flip ? { transform: 'scaleY(-1)' } : undefined}
        className="flex-shrink-0"
      >
        <g clipPath="url(#clip_sla_hourglass)">
          <path
            d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z"
            fill={t.fg}
          />
        </g>
        <defs>
          <clipPath id="clip_sla_hourglass">
            <rect width="12" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)" />
          </clipPath>
        </defs>
      </svg>
      <span className="text-[12px] font-semibold" style={{ color: t.fg }}>{label}</span>
    </span>
  );
}
/* Mock SLA clock — deterministic per ticket so a row always reads the same, and coherent
   with the row: closed/completed work is settled, urgent work runs hot. */
const SLA_NAME: Record<string, string> = {
  Urgent: 'P1 Critical – Resolution SLA',
  High: 'P2 High – Resolution SLA',
  Medium: 'P3 Standard – Resolution SLA',
  Low: 'P4 Low – Resolution SLA',
};
const SLA_TARGET: Record<string, string> = { Urgent: '4 hours', High: '8 hours', Medium: '3 days', Low: '5 days' };
const LONG_DATE = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LONG_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDateTime = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  const ap = d.getHours() < 12 ? 'AM' : 'PM';
  return `${LONG_DATE[d.getDay()]}, ${LONG_MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
};
interface SlaInfo { tone: SlaTone; label: string; name: string; target: string; when: string }
const dueBySla = (t: Ticket): SlaInfo => {
  const name = SLA_NAME[t.priority];
  const target = SLA_TARGET[t.priority];
  const n = Number(t.id.replace(/\D/g, ""));
  if (t.status === 'Closed' || t.status === 'Completed') {
    return { tone: 'done', label: 'Met', name, target, when: `Met ${longDateTime(t.dueBy)}` };
  }
  const when = `Due by ${longDateTime(t.dueBy)}`;
  if (t.priority === 'Urgent' || n % 5 === 0) {
    return { tone: 'breached', label: ['2d 6h', '1d 4h', '18h 1m', '3d 2h'][n % 4], name, target, when };
  }
  if (t.priority === 'High' || n % 3 === 0) {
    return { tone: 'due', label: ['4h', '1h 20m', '45m', '2h 10m'][n % 4], name, target, when };
  }
  return { tone: 'ok', label: ['18h 1m', '2d 3h', '1w 2d', '5d 6h'][n % 4], name, target, when };
};
const priorityColor = (v: string) => PRIORITY_OPTIONS.find((o) => o.label === v)?.color ?? '#6b7280';

interface TicketTableProps {
  tickets: Ticket[];
  selectedTickets: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectTicket: (ticketId: string, checked: boolean) => void;
  onSort: (column: keyof Ticket) => void;
  sortColumn: keyof Ticket | null;
  sortDirection: 'asc' | 'desc';
  onTicketClick: (ticket: Ticket) => void;
  onUpdateTicket?: (id: string, patch: Partial<Ticket>) => void;
}

export function TicketTable({
  tickets,
  selectedTickets,
  allSelected,
  onSelectAll,
  onSelectTicket,
  onSort,
  sortColumn,
  sortDirection,
  onTicketClick,
  onUpdateTicket
}: TicketTableProps) {
  const formatDateTime = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes} PM`;
  };

  const SortButton = ({ column, children }: { column: keyof Ticket; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-[#3D8BD0]"
    >
      {children}
      <ArrowUpDown
        size={12}
        className={sortColumn === column ? 'text-[#3D8BD0]' : 'text-[#9ca3af]'}
      />
    </button>
  );

  /* Column widths are drag-adjustable from the header dividers. Widths live in state as
     PROPORTIONS: the table runs `table-fixed` + a <colgroup>, and whenever the columns would
     leave slack the widths are scaled up to fit the container exactly — so the grid always
     fills the full width, with no dead strip on the right. Past the container width the
     scale stops at 1 and the table scrolls horizontally instead. */
  const [colW, setColW] = useState<Record<string, number>>({
    id: 96, subject: 340, requester: 150, assignee: 180, dueStatus: 130,
    status: 130, priority: 120, created: 190,
  });
  const CHECK_W = 44;
  const ICON_W = 40; // manage-columns gutter at the right edge
  const MIN_W = 80;
  const wOf = (c: ColDef) => colW[c.key] ?? c.w ?? 150;
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWrapW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const startResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const idx = cols.findIndex((c) => c.key === key);
    dragRef.current = { key, startX: e.clientX, startW: idx >= 0 ? fitted[idx] : (colW[key] ?? 150) };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const next = Math.max(MIN_W, d.startW + ev.clientX - d.startX);
      // Flex columns render scaled, so store the unscaled value; fixed ones map 1:1.
      const isFlex = !!cols.find((c) => c.key === d.key)?.flex;
      setColW((w) => ({ ...w, [d.key]: isFlex && scale > 1 ? next / scale : next }));
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  /* The divider itself — a wide invisible grab strip straddling the column edge, with a thin
     rule drawn down the middle that turns blue while pointed at or dragged. */
  const resizer = (key: string) => (
    <span
      onMouseDown={(e) => startResize(key, e)}
      onClick={(e) => e.stopPropagation()}
      className="group/rz absolute right-0 top-0 z-10 flex h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center"
      title="Drag to resize column"
    >
      <span className="h-4 w-px bg-[#E5E7EB] transition-colors group-hover/rz:h-full group-hover/rz:w-[2px] group-hover/rz:bg-[#3D8BD0]" />
    </span>
  );
  const TH = 'group/th sticky top-0 z-30 cursor-grab select-none border-b border-[#e5e7eb] px-4 py-2.5 text-left text-[12px] font-semibold text-[#64748B] tracking-wide transition-colors hover:bg-[#F7F9FB] hover:text-[#364658]';
  /* Columns are drag-to-reorder from the header (tab-strip DnD recipe: dimmed source,
     blue left drop indicator); the order persists like the Customize Layout sections.
     `flex` columns share out leftover width; the rest hold the width they were given. */
  const COL_DEFS: ColDef[] = [
    { key: 'id', label: 'ID', w: 96 },
    { key: 'subject', label: 'Subject', flex: true, w: 340 },
    { key: 'requester', label: 'Requester', flex: true, w: 150 },
    { key: 'assignee', label: 'Assigned to', flex: true, w: 180 },
    { key: 'dueStatus', label: 'Due By Status', w: 130 },
    { key: 'status', label: 'Status', w: 130 },
    { key: 'priority', label: 'Priority', w: 120 },
    { key: 'created', label: 'Created Date', flex: true, w: 190 },
  ];
  const CATALOG: ColDef[] = [...COL_DEFS, ...EXTRA_COLS];
  // The stored value is the ordered VISIBLE set — removing a column persists too.
  const COL_ORDER_KEY = 'ticketListColumnsV2';
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COL_ORDER_KEY) || 'null');
      if (Array.isArray(saved)) {
        const valid = saved.filter((k) => CATALOG.some((c) => c.key === k));
        if (valid.length) return valid;
      }
    } catch { /* corrupted storage — fall back to the default set */ }
    return COL_DEFS.map((c) => c.key);
  });
  const cols = colOrder.map((k) => CATALOG.find((c) => c.key === k)!);
  const applyColumns = (next: string[]) => {
    setColOrder(next);
    localStorage.setItem(COL_ORDER_KEY, JSON.stringify(next));
  };
  const [showColMgr, setShowColMgr] = useState(false);
  const [mgrRect, setMgrRect] = useState<{ right: number; bottom: number } | null>(null);
  const [dragCol, setDragCol] = useState<string | null>(null);
  /* The drop target carries WHICH SIDE of the hovered column the pointer is on, so a
     column can land before OR after it — and the insertion line sits exactly where the
     drop will put it. */
  const [dragOver, setDragOver] = useState<{ key: string; after: boolean } | null>(null);
  const dropColumn = () => {
    if (dragCol && dragOver && dragOver.key !== dragCol) {
      const { key, after } = dragOver;
      setColOrder((ord) => {
        const next = ord.filter((k) => k !== dragCol);
        next.splice(next.indexOf(key) + (after ? 1 : 0), 0, dragCol);
        localStorage.setItem(COL_ORDER_KEY, JSON.stringify(next));
        return next;
      });
    }
    setDragCol(null);
    setDragOver(null);
  };
  /* A crisp labelled pill as the drag image, instead of the browser's washed-out snapshot
     of the whole header cell. Parked offscreen and removed on the next tick — the browser
     rasterises it synchronously on dragstart. */
  const setDragGhost = (e: React.DragEvent, label: string) => {
    const ghost = document.createElement('div');
    ghost.textContent = label;
    ghost.style.cssText =
      'position:fixed;top:-200px;left:-200px;padding:7px 14px;background:#ffffff;' +
      'border:1px solid #3D8BD0;border-left:3px solid #3D8BD0;border-radius:6px;' +
      'box-shadow:0 10px 28px rgba(15,42,68,0.22);color:#1E293B;font-size:12px;' +
      'font-weight:600;white-space:nowrap;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 18, 16);
    window.setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const baseTotal = CHECK_W + ICON_W + cols.reduce((n, c) => n + wOf(c), 0);
  // The checkbox + icon gutters and the narrow columns keep their width; the flex columns
  // split whatever is left over, so the grid still spans the container exactly.
  const avail = wrapW - CHECK_W - ICON_W;
  const fixedTotal = cols.filter((c) => !c.flex).reduce((n, c) => n + wOf(c), 0);
  const flexTotal = cols.filter((c) => c.flex).reduce((n, c) => n + wOf(c), 0);
  const room = avail - fixedTotal;
  const scale = flexTotal > 0 && room > flexTotal ? room / flexTotal : 1;
  const fitted = cols.map((c) => Math.round(wOf(c) * (c.flex ? scale : 1)));
  if (scale > 1) {
    const lastFlex = cols.map((c) => !!c.flex).lastIndexOf(true);
    if (lastFlex >= 0) fitted[lastFlex] += avail - fitted.reduce((n, w) => n + w, 0);
  }

  /* One renderer per column, so the body follows whatever order the header is dragged into. */
  const renderCell = (key: string, ticket: Ticket) => {
    switch (key) {
      case 'id':
        return (
              <td className="overflow-hidden px-4 py-3">
                <span 
                  className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTicketClick(ticket);
                  }}
                >
                  {ticket.id}
                </span>
              </td>
        );
      case 'subject':
        return (
              <td className="overflow-hidden px-4 py-3 text-[12px] text-[#364658]">
                <span className="flex min-w-0 items-center gap-2">
                  {/* Unread rows read bold, Gmail-style. */}
                  <span className={`min-w-0 flex-1 truncate ${ticket.unread ? 'font-semibold text-[#1E293B]' : 'font-medium'}`}>{ticket.subject}</span>
                  {/* New-message chip → hover card previews the latest reply. */}
                  {!!ticket.unread && ticket.lastMsg && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 flex-shrink-0 items-center gap-1 rounded-full bg-[#EBF5FF] px-2 text-[11px] font-semibold text-[#3D8BD0]">
                          <MessageSquare size={11} className="flex-shrink-0" />
                          {ticket.unread} new
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" sideOffset={4} hideArrow className="w-[268px] border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-lg">
                        <div className="px-3 py-2.5 text-left">
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            {ticket.unread} new message{ticket.unread === 1 ? '' : 's'}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-medium text-white">
                              {requesterAvatar(ticket.lastMsg.from).initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[12px] font-semibold">{ticket.lastMsg.from}</span>
                                <span className="flex-shrink-0 text-[11px] text-[#94A3B8]">{ticket.lastMsg.time}</span>
                              </div>
                              <p className="mt-0.5 text-[12px] leading-snug text-[#64748B] line-clamp-2 text-wrap">{ticket.lastMsg.snippet}</p>
                            </div>
                          </div>
                          <div className="mt-2 border-t border-[#F0F2F5] pt-1.5 text-[11px] font-medium text-[#3D8BD0]">Open the request to reply</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Pending-approval chip → amber, hover card names the approver + level. */}
                  {ticket.approval && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 flex-shrink-0 items-center gap-1 rounded-full bg-[#FFF3E0] px-2 text-[11px] font-semibold text-[#F39C12]">
                          <UserCheck size={11} className="flex-shrink-0" />
                          Approval
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" sideOffset={4} hideArrow className="w-[248px] border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-lg">
                        <div className="px-3 py-2.5 text-left">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Pending approval</span>
                            <span className="rounded-sm bg-[#FFF3E0] px-1.5 py-0.5 text-[10px] font-semibold text-[#F39C12]">Level {ticket.approval.level} of {ticket.approval.totalLevels}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-medium text-white">
                              {requesterAvatar(ticket.approval.approver).initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-semibold">{ticket.approval.approver}</div>
                              <div className="text-[11px] text-[#94A3B8]">Waiting for {ticket.approval.waiting}</div>
                            </div>
                          </div>
                          <div className="mt-2 border-t border-[#F0F2F5] pt-1.5 text-[11px] font-medium text-[#3D8BD0]">Open the request to review</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Task-progress chip → hover card with a progress bar + first tasks. */}
                  {!!ticket.tasksTotal && (() => {
                    const total = ticket.tasksTotal!;
                    const done = ticket.tasksDone ?? 0;
                    const allDone = done >= total;
                    const names = taskListFor(ticket.subject);
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`inline-flex h-5 flex-shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium ${allDone ? 'bg-[#E8F5E9] text-[#27AE60]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                            <ListChecks size={11} className="flex-shrink-0" />
                            {done}/{total}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" sideOffset={4} hideArrow className="w-[248px] border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-lg">
                          <div className="px-3 py-2.5 text-left">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Tasks</span>
                              <span className="text-[11px] font-semibold">{done} of {total} done</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-[#EEF1F4]">
                              <div className="h-full rounded-full bg-[#22A06B]" style={{ width: `${Math.round((done / total) * 100)}%` }} />
                            </div>
                            <div className="mt-2 space-y-1">
                              {names.slice(0, 3).map((n, k) => (
                                <div key={n} className="flex items-center gap-1.5 text-[12px]">
                                  <span className="flex size-3 flex-shrink-0 items-center justify-center">
                                    {k < done ? <Check size={12} className="text-[#22A06B]" /> : <span className="size-1.5 rounded-full bg-[#CBD5E1]" />}
                                  </span>
                                  <span className={`truncate ${k < done ? 'text-[#94A3B8] line-through' : 'text-[#4A5568]'}`}>{n}</span>
                                </div>
                              ))}
                              {total > 3 && <div className="pl-[18px] text-[11px] text-[#94A3B8]">+{total - 3} more task{total - 3 === 1 ? '' : 's'}</div>}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })()}
                </span>
              </td>
        );
      case 'requester':
        return (
              <td className="px-2 py-2.5 text-[12px] text-[#364658] whitespace-nowrap">
                <InlineSelect
                  user
                  accent="#E67E22"
                  showUnassigned={false}
                  searchPlaceholder="Search requesters..."
                  options={REQUESTER_OPTIONS}
                  value={ticket.requester}
                  onPick={(label) => onUpdateTicket?.(ticket.id, { requester: label })}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#E67E22] text-[9px] font-medium text-white">
                      {requesterAvatar(ticket.requester).initials}
                    </span>
                    <span className="truncate text-[12px] text-[#364658]">{ticket.requester}</span>
                  </span>
                </InlineSelect>
              </td>
        );
      case 'assignee':
        return (
              <td className="px-2 py-2.5 whitespace-nowrap">
                <InlineSelect
                  user
                  options={ASSIGNEE_OPTIONS}
                  value={ticket.assignedTo.name}
                  onPick={(label) => {
                    const pick = ASSIGNEE_OPTIONS.find((o) => o.label === label);
                    onUpdateTicket?.(ticket.id, { assignedTo: { name: label, initials: pick?.initials ?? '' } });
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {ticket.assignedTo.name === 'Unassigned' ? (
                      <span className="size-5 flex-shrink-0 rounded-full border-2 border-dashed border-[#9CA3AF]" />
                    ) : (
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-medium text-white">
                        {ticket.assignedTo.initials}
                      </span>
                    )}
                    <span className="truncate text-[12px] text-[#364658]">{ticket.assignedTo.name}</span>
                  </span>
                </InlineSelect>
              </td>
        );
      case 'dueStatus':
        return (
              <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                {(() => {
                  const sla = dueBySla(ticket);
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <DueByPill tone={sla.tone} label={sla.label} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="min-w-[180px] divide-y divide-white/15 text-left text-wrap">
                          <div className="pb-1.5">{sla.when}</div>
                          <div className="py-1.5"><span className="opacity-60">Total time:</span> {sla.target}</div>
                          <div className="pt-1.5"><span className="opacity-60">SLA Name:</span> {sla.name}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </td>
        );
      case 'status':
        return (
              <td className="px-2 py-2.5 whitespace-nowrap">
                <InlineSelect options={STATUS_OPTIONS} value={ticket.status} onPick={(label) => onUpdateTicket?.(ticket.id, { status: label as Ticket['status'] })}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: statusColor(ticket.status) }} />
                    <span className="truncate text-[12px] text-[#4A5568]">{ticket.status}</span>
                  </span>
                </InlineSelect>
              </td>
        );
      case 'priority':
        return (
              <td className="px-2 py-2.5">
                <InlineSelect options={PRIORITY_OPTIONS} value={ticket.priority} onPick={(label) => onUpdateTicket?.(ticket.id, { priority: label as Ticket['priority'] })}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: priorityColor(ticket.priority) }} />
                    <span className="truncate text-[12px] text-[#4A5568]">{ticket.priority}</span>
                  </span>
                </InlineSelect>
              </td>
        );
      case 'created':
        return (
              <td className="overflow-hidden truncate px-4 py-3 whitespace-nowrap">
                <span className="text-[12px] text-[#364658]">{formatDateTime(ticket.createdBy)}</span>
              </td>
        );
      default: {
        // Optional catalog columns — plain text, dashes dimmed.
        const v = extraValue(key, ticket);
        return (
          <td className="overflow-hidden truncate whitespace-nowrap px-4 py-3 text-[12px]">
            <span className={v === '---' ? 'text-[#B6C2D1]' : 'text-[#4A5568]'}>{v}</span>
          </td>
        );
      }
    }
  };
  return (
    <div className="relative" ref={wrapRef}>
      {/* Full-height insertion line — lands exactly where the drop will place the column. */}
      {dragCol && dragOver && dragOver.key !== dragCol && (() => {
        const ti = cols.findIndex((c) => c.key === dragOver.key);
        if (ti === -1) return null;
        let x = CHECK_W;
        for (let k = 0; k < ti; k++) x += fitted[k];
        if (dragOver.after) x += fitted[ti];
        return (
          <span
            className="pointer-events-none absolute inset-y-0 z-20 w-[3px] rounded-full bg-[#3D8BD0] shadow-[0_0_0_3px_rgba(61,139,208,0.18)]"
            style={{ left: x - 1 }}
          />
        );
      })()}
      <table className="w-full table-fixed" style={{ minWidth: baseTotal }}>
        <colgroup>
          <col style={{ width: CHECK_W }} />
          {cols.map((c, i) => (
            <col key={c.key} style={{ width: fitted[i], backgroundColor: dragCol === c.key ? '#F5F7FA' : undefined }} />
          ))}
          <col style={{ width: ICON_W }} />
        </colgroup>
        <thead className="border-b border-[#e5e7eb]">
          <tr className="bg-white">
            <th className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white px-4 py-2.5 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
              />
            </th>
            {cols.map((c) => (
              <th
                key={c.key}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragGhost(e, c.label); setDragCol(c.key); }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const r = e.currentTarget.getBoundingClientRect();
                  const after = e.clientX > r.left + r.width / 2;
                  if (!dragOver || dragOver.key !== c.key || dragOver.after !== after) setDragOver({ key: c.key, after });
                }}
                onDragLeave={() => { if (dragOver?.key === c.key) setDragOver(null); }}
                onDrop={(e) => { e.preventDefault(); dropColumn(); }}
                onDragEnd={() => { setDragCol(null); setDragOver(null); }}
                className={`${TH} ${dragCol === c.key ? 'opacity-40' : ''} ${dragCol && dragCol !== c.key && dragOver?.key === c.key ? 'bg-[#EBF5FF]' : 'bg-white'}`}
              >
                {/* Grip — the "you can drag this" affordance, revealed on hover. */}
                <GripVertical size={12} className="pointer-events-none absolute left-[3px] top-1/2 -translate-y-1/2 text-[#9CA3AF] opacity-0 transition-opacity group-hover/th:opacity-100" />
                <span className="block truncate">{c.label}</span>
                {resizer(c.key)}
              </th>
            ))}
            {/* Manage columns — pinned at the right edge of the header. */}
            <th className="sticky right-0 top-0 z-40 border-b border-[#e5e7eb] bg-white p-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setMgrRect({ right: r.right, bottom: r.bottom });
                      setShowColMgr(true);
                    }}
                    className="flex h-full w-full items-center justify-center py-2.5 text-[#7B8FA5] transition-colors hover:bg-[#F7F9FB] hover:text-[#3D8BD0]"
                  >
                    <Columns3 size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Manage columns</TooltipContent>
              </Tooltip>
            </th>
          </tr>
        </thead>
        {/* No tbody background — it would paint over the <col> tint of the dragged column. */}
        <tbody className="divide-y divide-[#e5e7eb]">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="group hover:bg-[#f9fafb] transition-colors cursor-pointer"
              onClick={() => onTicketClick(ticket)}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedTickets.has(ticket.id)}
                  onChange={(e) => onSelectTicket(ticket.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              {cols.map((c) => (
                <Fragment key={c.key}>{renderCell(c.key, ticket)}</Fragment>
              ))}
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      {showColMgr && mgrRect && (
        <ColumnManager
          anchor={mgrRect}
          catalog={CATALOG}
          active={colOrder}
          onApply={applyColumns}
          onClose={() => setShowColMgr(false)}
        />
      )}
    </div>
  );
}