import { Fragment, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeftRight, ArrowLeftToLine, ArrowRightToLine, ArrowUp, ArrowUpDown, Check, CheckCheck, ChevronDown, CircleCheck, Lightbulb, Lock, ChevronLeft, ChevronRight, Columns3, EyeOff, Filter, Flag, GripVertical, Layers, ListChecks, MessageSquare, PanelRightOpen, Pin, Plus, Search, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { AiSparkle } from './AiSparkle';
import { describeSubject } from './requestDescriptions';
import { groupOfTechnician } from './technicianRoster';
import { DEPARTMENTS } from './orgDepartments';
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
    <div className="group/cell relative w-full">
      <button
        ref={btnRef}
        onClick={toggle}
        className={`flex h-12 w-full items-center gap-1.5 rounded-md border px-2 text-left transition-colors ${open ? 'border-[#DFE5ED] bg-white' : 'border-transparent hover:border-[#DFE5ED] hover:bg-[#F9FAFB]'}`}
      >
        <span className="min-w-0 truncate">{children}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-[#7B8FA5] transition-opacity ${open ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100'}`}
        />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="app-menu z-[9999] rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg"
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
const IMPACT_OPTIONS: CellOption[] = [
  { label: 'Low', color: '#22c55e' },
  { label: 'On Users', color: '#fb923c' },
  { label: 'On Department', color: '#ef4444' },
  { label: 'On Business', color: '#dc2626' },
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
export const taskListFor = (subject: string): string[] => {
  const s2 = subject.toLowerCase();
  if (s2.includes('onboarding')) return ['IT - Acquire Laptop', 'IT - Create Email ID and Accounts', 'Admin - Workstation Allocation', 'Admin - Joining Kit Allocation'];
  if (s2.includes('macbook') || s2.includes('request for')) return ['Manager approval', 'Procurement review', 'Vendor PO creation', 'Asset tagging & handover'];
  if (s2.includes('internet') || s2.includes('wifi')) return ['Check access point health', 'Verify VLAN and DHCP scope', 'Reset network adapter', 'Confirm stable connectivity'];
  if (s2.includes('laptop') || s2.includes('charger')) return ['Diagnose hardware fault', 'Arrange replacement unit', 'Transfer user data', 'Update asset record'];
  return ['Initial diagnosis', 'Apply resolution steps', 'Verify with requester', 'Close with resolution note'];
};
const REQUESTER_OPTIONS: CellOption[] = ['Jainam Shah', 'Nandini Patel', 'Darshak Modi', 'Meera Iyer', 'Samuel Githugu', 'Kavit Gohel', 'Hetal Mori', 'Rohit Kulkarni', 'Ersin Sevinç', 'Ajay Kumar Rai', 'Dhaval Raval', 'Priya Mehta', 'Farhan Qureshi'].map((n) => ({
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
  { key: 'tags', label: 'Tags', w: 230 },
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
const fmtDate = (d: Date) => {
  const h12 = d.getHours() % 12 || 12;
  const ap = d.getHours() < 12 ? 'AM' : 'PM';
  return `${DAYS3[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(h12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
};
const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded border border-[#DFE5ED] bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[#364658]">{children}</kbd>
);

interface PeekAi { analysis: string; resolution: string; actions: { label: string; conf: number }[] }
const peekAiFor = (subject: string): PeekAi => {
  const t = subject.toLowerCase();
  if (t.includes('outlook'))
    return {
      analysis: 'Crash signature matches a conflict between the June Office update and the legacy attachment-preview handler.',
      resolution: 'Repair the Office installation, clear the local Outlook cache, then re-enable the preview handler. OWA can bridge the gap meanwhile.',
      actions: [{ label: 'Repair Office Installation', conf: 94 }, { label: 'Clear Outlook Attachment Cache', conf: 88 }],
    };
  if (t.includes('onboarding'))
    return {
      analysis: 'Standard joiner pack — every item maps to an existing automation in the onboarding workflow.',
      resolution: 'Trigger the New Joiner workflow with the start date; hardware bundle and access grants queue automatically from the role template.',
      actions: [{ label: 'Trigger Onboarding Workflow', conf: 96 }, { label: 'Assign Standard Hardware Bundle', conf: 90 }],
    };
  if (t.includes('wifi') || t.includes('wi-fi'))
    return {
      analysis: 'Drop-after-association pattern points at roaming aggressiveness on the laptop adapter clashing with Floor 3 AP firmware.',
      resolution: 'Push the current Wi-Fi driver, set roaming aggressiveness to medium, and verify the Floor 3 APs are on the rolled-out firmware.',
      actions: [{ label: 'Run Network Diagnostic', conf: 92 }, { label: 'Push Wi-Fi Driver Update', conf: 87 }],
    };
  if (t.includes('internet'))
    return {
      analysis: 'Periodic drops on both wired and wireless suggest an uplink flap rather than a device fault.',
      resolution: 'Check the access-switch uplink counters for the desk port, then fail the user over to the secondary SSID while the link is inspected.',
      actions: [{ label: 'Run Link Stability Test', conf: 91 }, { label: 'Check Switch Port Health', conf: 85 }],
    };
  if (t.includes('macbook') || t.includes('allocation'))
    return {
      analysis: 'Request fits the designer hardware profile; budget line for the quarter still has headroom.',
      resolution: 'Route for manager and finance approval, then raise the purchase order against the approved Apple catalog item.',
      actions: [{ label: 'Send for Approval', conf: 95 }, { label: 'Raise Purchase Order Draft', conf: 82 }],
    };
  if (t.includes('hr portal') || t.includes('log in') || t.includes('login') || t.includes('password'))
    return {
      analysis: 'Account is lockout-flagged in AD and the self-service reset mail is being quarantined by the spam filter.',
      resolution: 'Unlock the account, release the quarantined reset mail, and force a password change at next logon before payroll cut-off.',
      actions: [{ label: 'Unlock AD Account', conf: 97 }, { label: 'Release Quarantined Email', conf: 89 }],
    };
  if (t.includes('charger') || t.includes('charging'))
    return {
      analysis: 'Symptoms match a failing adapter cable rather than the battery — charge resumes only at an angle.',
      resolution: 'Issue a replacement adapter from stock and inspect the charging port for pin damage when it is swapped.',
      actions: [{ label: 'Issue Replacement Adapter', conf: 93 }, { label: 'Book Port Inspection', conf: 80 }],
    };
  if (t.includes('drive'))
    return {
      analysis: 'User dropped out of the share security group during last week\u2019s group cleanup — teammates kept access.',
      resolution: 'Re-add the user to the Floor 3 share group and confirm inheritance on the affected folder.',
      actions: [{ label: 'Restore Group Membership', conf: 95 }, { label: 'Verify Folder Permissions', conf: 86 }],
    };
  return {
    analysis: 'Signals in the request thread point at a known, low-risk cause with an established fix path.',
    resolution: 'Apply the standard resolution for this category and confirm with the requester before closing.',
    actions: [{ label: 'Apply Standard Fix', conf: 84 }, { label: 'Request More Details', conf: 78 }],
  };
};

// Deterministic per-ticket hash so every optional column shows stable, believable values.
const hx = (id: string, salt: number) => {
  let n = salt;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return n;
};
export const extraValue = (key: string, t: Ticket): string => {
  const closed = t.status === 'Closed' || t.status === 'Completed';
  const h = (salt: number, mod: number) => hx(t.id, salt) % mod;
  switch (key) {
    case 'createdByUser': return [t.requester, 'System', t.assignedTo.name][h(1, 3)];
    case 'dueByDate': return fmtDate(t.dueBy);
    case 'techGroup': return groupOfTechnician(t.assignedTo.name);
    case 'urgency': return t.priority;
    case 'impact': return t.impact ?? ['On Users', 'On Department', 'Low', 'On Business'][h(3, 4)];
    case 'department': return DEPARTMENTS[h(4, DEPARTMENTS.length)];
    case 'source': return ['Email', 'Support Portal', 'Technician Portal', 'Walk-in'][h(5, 4)];
    case 'location': return ['Ahmedabad HQ', 'Mumbai Office', 'Bengaluru DC', 'Pune Office'][h(6, 4)];
    case 'tags': {
      const POOL = ['network', 'vpn', 'hardware', 'onboarding', 'access', 'printer', 'wifi', 'urgent', 'floor-3', 'vip', 'recurring', 'email', 'sla-watch', 'remote'];
      const count = 2 + h(7, 5);
      const start = h(13, POOL.length);
      const step = 1 + h(14, 3);
      return Array.from({ length: count }, (_, i) => POOL[(start + i * step) % POOL.length])
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ');
    }
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

/** Columns whose values are unique per request — grouping them yields one row per group. */
const NO_GROUP = new Set(['id', 'subject']);

/* Column header menu — the per-column actions (click the heading). No flyouts: "Change
   Column" swaps the card IN PLACE for a searchable picker; Insert drops a placeholder
   slot into the grid. Filter hands the column to the toolbar filter bar. */
function HeaderMenu({
  anchor,
  col,
  catalog,
  visible,
  groupedBy,
  onGroup,
  frozen,
  freezeDisabled,
  onFreeze,
  onHide,
  onInsertSlot,
  onChange,
  onClose,
}: {
  anchor: { left: number; bottom: number };
  col: ColDef;
  catalog: ColDef[];
  visible: string[];
  groupedBy: boolean;
  onGroup: () => void;
  frozen: boolean;
  freezeDisabled: boolean;
  onFreeze: () => void;
  onHide: () => void;
  onInsertSlot: (side: 'left' | 'right') => void;
  onChange: (key: string) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<'root' | 'change'>('root');
  const [cq, setCq] = useState('');
  const W = 214;
  const left = Math.min(anchor.left, window.innerWidth - W - 24);
  const top = anchor.bottom + 4;
  const addable = catalog.filter((c) => !visible.includes(c.key) && c.label.toLowerCase().includes(cq.trim().toLowerCase()));
  const row =
    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]';
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{ position: 'fixed', top, left, width: W }}
        className="app-menu z-[9999] flex max-h-[420px] flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white py-1.5 shadow-xl"
      >
        {view === 'root' ? (
          <>
            <div className="px-3 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{col.label}</div>
            <button className={row} onClick={() => { window.dispatchEvent(new CustomEvent('add-column-filter', { detail: col.key })); onClose(); }}>
              <Filter size={14} className="flex-shrink-0 text-[#7B8FA5]" /> Filter
            </button>
            {!NO_GROUP.has(col.key) && (
            <button className={row} onClick={() => { onGroup(); onClose(); }}>
              <Layers size={14} className="flex-shrink-0 text-[#7B8FA5]" />
              <span className="flex-1">{groupedBy ? 'Ungroup' : 'Group'}</span>
              {groupedBy && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
            </button>
            )}
            <div className="my-1 border-t border-[#F0F2F5]" />
            <button className={row} onClick={() => { onHide(); onClose(); }}>
              <EyeOff size={14} className="flex-shrink-0 text-[#7B8FA5]" /> Hide
            </button>
            {(!freezeDisabled || frozen) && (
            <button className={row} onClick={() => { onFreeze(); onClose(); }}>
              <Pin size={14} className="flex-shrink-0 text-[#7B8FA5]" />
              <span className="flex-1">{frozen ? 'Unfreeze Columns' : 'Freeze Up to Column'}</span>
              {frozen && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
            </button>
            )}
            <div className="my-1 border-t border-[#F0F2F5]" />
            <button className={row} onClick={() => { onInsertSlot('left'); onClose(); }}>
              <ArrowLeftToLine size={14} className="flex-shrink-0 text-[#7B8FA5]" /> Insert Left
            </button>
            <button className={row} onClick={() => { onInsertSlot('right'); onClose(); }}>
              <ArrowRightToLine size={14} className="flex-shrink-0 text-[#7B8FA5]" /> Insert Right
            </button>
            <button className={row} onClick={() => setView('change')}>
              <ArrowLeftRight size={14} className="flex-shrink-0 text-[#7B8FA5]" />
              <span className="flex-1">Change Column</span>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </button>
          </>
        ) : (
          <>
            {/* In-place picker — back chevron returns to the actions. */}
            <div className="flex items-center gap-1 px-2 pb-1 pt-0.5">
              <button onClick={() => { setView('root'); setCq(''); }} className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]">
                <ChevronLeft size={15} />
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Change column</span>
            </div>
            <div className="px-2.5 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  autoFocus
                  value={cq}
                  onChange={(e) => setCq(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setView('root'); setCq(''); } }}
                  placeholder="Search columns..."
                  className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-1.5 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                />
              </div>
            </div>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Available · {addable.length}</div>
            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-0.5">
              {addable.length ? (
                addable.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => { onChange(c.key); onClose(); }}
                    className="group/ch flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F5F7FA]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.label}</span>
                    <ArrowLeftRight size={13} className="flex-shrink-0 text-[#3D8BD0] opacity-0 transition-opacity group-hover/ch:opacity-100" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No columns found</div>
              )}
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}
/* Manage-columns popup — TWO PANES: everything addable on the left (click to move it
   across), the columns shown in the table on the right (drag to reorder, ✕ to remove).
   One search filters both sides. Draft state — Apply commits, Cancel/outside discards. */
export function ColumnManager({
  anchor,
  catalog,
  active,
  title = 'Manage columns',
  shownLabel = 'Shown in table',
  searchPlaceholder = 'Search columns...',
  onApply,
  onClose,
  onBack,
  lockedKeys = [],
}: {
  anchor: { right: number; bottom: number };
  catalog: ColDef[];
  active: string[];
  /** Dialog heading — the kanban opens the same dialog for card fields. */
  title?: string;
  shownLabel?: string;
  searchPlaceholder?: string;
  onApply: (keys: string[]) => void;
  onClose: () => void;
  /** Present when the dialog was opened from a menu — returns to it. */
  onBack?: () => void;
  /** The designed baseline: these rows pin to the top in this order, can't be removed
      or dragged — user customisation happens BELOW them. Empty = everything editable. */
  lockedKeys?: string[];
}) {
  const isLocked = (k: string) => lockedKeys.includes(k);
  /* Locked keys always present, always first, always in their own order — whatever
     state arrives (older saved sets included) normalises to that shape. */
  const normalize = (d: string[]) => [...lockedKeys, ...d.filter((k) => !isLocked(k))];
  const [draft, setDraft] = useState<string[]>(() => normalize(active));
  const [q, setQ] = useState('');
  const [rowDrag, setRowDrag] = useState<string | null>(null);
  const [rowOver, setRowOver] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const shownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!justAdded) return;
    shownRef.current
      ?.querySelector(`[data-colrow="${justAdded}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const t = window.setTimeout(() => setJustAdded(null), 1200);
    return () => window.clearTimeout(t);
  }, [justAdded]);
  const W = 560;
  const left = Math.max(8, Math.min(anchor.right - W, window.innerWidth - W - 8));
  const top = anchor.bottom + 6;
  const maxH = Math.min(560, window.innerHeight - top - 16);
  const query = q.trim().toLowerCase();
  const activeDefs = draft.map((k) => catalog.find((c) => c.key === k)).filter(Boolean) as ColDef[];
  const availDefs = catalog.filter((c) => !draft.includes(c.key) && c.label.toLowerCase().includes(query));
  const shownDefs = query ? activeDefs.filter((c) => c.label.toLowerCase().includes(query)) : activeDefs;
  const dropRow = (target: string) => {
    if (rowDrag && rowDrag !== target && !isLocked(rowDrag)) {
      setDraft((d) => {
        const next = d.filter((k) => k !== rowDrag);
        // Dropping onto the locked block lands the row right below it instead.
        const at = isLocked(target) ? lockedKeys.length : next.indexOf(target);
        next.splice(at, 0, rowDrag);
        return normalize(next);
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
        className="app-menu z-[9999] flex flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
      >
        {/* Title + one search across both panes */}
        <div className="border-b border-[#F0F2F5] px-4 pb-3 pt-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            {onBack && (
              <button
                onClick={onBack}
                className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
              >
                <ChevronLeft size={15} />
              </button>
            )}
            <span className="text-[13px] font-semibold text-[#364658]">{title}</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          {/* LEFT — addable columns */}
          <div className="flex min-w-0 flex-1 flex-col border-r border-[#F0F2F5]">
            <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Available</div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {availDefs.length ? (
                availDefs.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => { setDraft((d) => [...d, c.key]); setJustAdded(c.key); }}
                    className="group/av flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F5F7FA]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.label}</span>
                    <Plus size={14} className="flex-shrink-0 text-[#3D8BD0] opacity-0 transition-opacity group-hover/av:opacity-100" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-[12px] text-[#94A3B8]">{query ? 'No columns found' : 'All columns are shown'}</div>
              )}
            </div>
          </div>
          {/* RIGHT — shown in the table, in grid order */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{shownLabel} · {activeDefs.length}</div>
            <div ref={shownRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {shownDefs.map((c, i) => {
                const locked = isLocked(c.key);
                return (
                <Fragment key={c.key}>
                {/* Hairline where the designed card ends and the user's additions begin. */}
                {!query && !locked && i > 0 && isLocked(shownDefs[i - 1].key) && (
                  <div className="mx-2 my-1.5 flex items-center gap-2">
                    <span className="h-px flex-1 bg-[#F0F2F5]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#B6C2D1]">Added by you</span>
                    <span className="h-px flex-1 bg-[#F0F2F5]" />
                  </div>
                )}
                <div
                  data-colrow={c.key}
                  draggable={!locked}
                  onDragStart={locked ? undefined : (e) => { e.dataTransfer.effectAllowed = 'move'; setRowDrag(c.key); }}
                  onDragOver={(e) => { e.preventDefault(); if (rowOver !== c.key) setRowOver(c.key); }}
                  onDragLeave={() => { if (rowOver === c.key) setRowOver(null); }}
                  onDrop={(e) => { e.preventDefault(); dropRow(c.key); }}
                  onDragEnd={() => { setRowDrag(null); setRowOver(null); }}
                  title={locked ? 'Default field — always on the card' : undefined}
                  className={`group/sh relative flex select-none items-center gap-2 rounded px-2 py-1.5 transition-colors duration-500 ${locked ? 'cursor-default' : 'cursor-grab'} ${justAdded === c.key ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'} ${rowDrag === c.key ? 'opacity-40' : ''}`}
                >
                  {rowOver === c.key && rowDrag && rowDrag !== c.key && !isLocked(rowDrag) && !locked && (
                    <span className="absolute inset-x-2 top-0 h-[2px] rounded bg-[#3D8BD0]" />
                  )}
                  {locked ? (
                    <Lock size={12} className="flex-shrink-0 text-[#B6C2D1]" />
                  ) : (
                    <GripVertical size={13} className="flex-shrink-0 text-[#B6C2D1]" />
                  )}
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${locked ? 'text-[#64748B]' : 'text-[#364658]'}`}>{c.label}</span>
                  {!locked && (
                  <button
                    onClick={() => draft.length > 1 && setDraft((d) => d.filter((k) => k !== c.key))}
                    title={draft.length > 1 ? 'Remove from table' : 'At least one column must stay'}
                    className={`flex size-5 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] opacity-0 transition-all group-hover/sh:opacity-100 ${draft.length > 1 ? 'hover:bg-[#FEE2E2] hover:text-[#EF4444]' : 'cursor-not-allowed'}`}
                  >
                    <X size={13} />
                  </button>
                  )}
                </div>
                </Fragment>
                );
              })}
              {query && !shownDefs.length && (
                <div className="px-3 py-8 text-center text-[12px] text-[#94A3B8]">No columns found</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-4 py-2.5">
          <button
            onClick={onClose}
            className="h-8 rounded px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
          >
            Cancel
          </button>
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
/** The grid's SLA pill (flipped hourglass when breached) — also used by the Kanban cards. */
export function DueByPill({
  tone,
  label,
  className = '',
  compact = false,
}: {
  tone: SlaTone;
  label: string;
  className?: string;
  /** Kanban scale: 11px glyph and label, to sit level with the card's other chips. */
  compact?: boolean;
}) {
  const t = SLA_TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 ${className}`} style={{ backgroundColor: t.bg }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={compact ? 8 : 10}
        height={compact ? 11 : 13}
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
      <span className={compact ? 'text-[11px] font-semibold' : 'text-[12px] font-semibold'} style={{ color: t.fg }}>
        {label}
      </span>
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
/** Exposed for the listing KPI strip so its SLA numbers match the grid's pills exactly. */
export const slaToneOf = (t: Ticket): SlaTone => dueBySla(t).tone;
/** The SLA pill WITH its hover detail (due/met date · total time · SLA name).
 *  Used by the grid cell and the Kanban cards. */
export function SlaPill({
  ticket,
  className = '',
  compact = false,
}: {
  ticket: Ticket;
  className?: string;
  compact?: boolean;
}) {
  const sla = dueBySla(ticket);
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <DueByPill tone={sla.tone} label={sla.label} className={className} compact={compact} />
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
}

/** Tone + label for the Kanban cards, straight from the grid's own SLA rule. */
export const slaInfoOf = (t: Ticket): { tone: SlaTone; label: string } => {
  const i = dueBySla(t);
  return { tone: i.tone, label: i.label };
};
export const SLA_PILL_TONE: Record<string, string> = {
  breached: 'bg-[#FEE2E2] text-[#B91C1C]',
  due: 'bg-[#FEF3C7] text-[#B45309]',
  ok: 'bg-[#DCFCE7] text-[#15803D]',
  done: 'bg-[#F1F5F9] text-[#64748B]',
};
const priorityColor = (v: string) => PRIORITY_OPTIONS.find((o) => o.label === v)?.color ?? '#6b7280';
const impactColor = (v: string) => IMPACT_OPTIONS.find((o) => o.label === v)?.color ?? '#6b7280';

interface TicketTableProps {
  tickets: Ticket[];
  selectedTickets: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectTicket: (ticketId: string, checked: boolean) => void;
  onSort: (column: keyof Ticket, dir?: 'asc' | 'desc') => void;
  sortColumn: keyof Ticket | null;
  sortDirection: 'asc' | 'desc';
  /** Full multi-column sort chain — index drives the priority badge. */
  sorts?: { column: keyof Ticket; dir: 'asc' | 'desc' }[];
  onTicketClick: (ticket: Ticket) => void;
  onUpdateTicket?: (id: string, patch: Partial<Ticket>) => void;
  /** Full sorted set — grouping spans ALL rows and pages within each group. */
  allTickets?: Ticket[];
  onGroupedChange?: (grouped: boolean, info?: { label: string; groups: number; total: number; list?: { key: string; count: number }[] }) => void;
  /** Bump to clear grouping from outside (the pinned footer's Clear link). */
  clearGroupingSignal?: number;
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
  sorts,
  onTicketClick,
  onUpdateTicket,
  allTickets,
  onGroupedChange,
  clearGroupingSignal
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
  // Only user-dragged widths live here — defaults come from each ColDef, so width tweaks
  // in COL_DEFS actually take effect (a seeded map silently overrode them).
  const [colW, setColW] = useState<Record<string, number>>({});
  const CHECK_W = 52;
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
  // Frozen-edge shade appears only while the grid is horizontally scrolled —
  // at rest the edge is just a hairline, scrolled it reads as depth (Notion-style).
  const [hScrolled, setHScrolled] = useState(false);
  useEffect(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;
    const onScroll = () => setHScrolled(el.scrollLeft > 0);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  // Shared frozen-edge shadow pieces.
  const EDGE_HAIR = 'inset -1px 0 0 #E5E7EB';
  const EDGE_SHADE = '10px 0 16px -6px rgba(16,24,40,0.22)';
  const frozenEdgeShadow = hScrolled ? EDGE_HAIR + ', ' + EDGE_SHADE : EDGE_HAIR;
  // "Jump to group": the pinned footer dispatches a group key — expand it if
  // collapsed, smooth-scroll its block to the top, and flash its title briefly.
  const [flashGroup, setFlashGroup] = useState<string | null>(null);
  useEffect(() => {
    const onJump = (e: Event) => {
      const key = String((e as CustomEvent).detail ?? '');
      const el = wrapRef.current?.querySelector(`[data-group-block="${CSS.escape(key)}"]`) as HTMLElement | null;
      if (!el) return;
      setCollapsed((p) => {
        if (!p.has(key)) return p;
        const n = new Set(p);
        n.delete(key);
        return n;
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setFlashGroup(key);
      window.setTimeout(() => setFlashGroup((cur) => (cur === key ? null : cur)), 1800);
    };
    window.addEventListener('jump-to-group', onJump as EventListener);
    return () => window.removeEventListener('jump-to-group', onJump as EventListener);
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
  const TH = 'group/th sticky top-[var(--tb,0px)] z-30 cursor-grab select-none shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase text-[#64748B] tracking-wide transition-colors hover:bg-[#F7F9FB] hover:text-[#364658]';
  /* Columns are drag-to-reorder from the header (tab-strip DnD recipe: dimmed source,
     blue left drop indicator); the order persists like the Customize Layout sections.
     `flex` columns share out leftover width; the rest hold the width they were given. */
  const COL_DEFS: ColDef[] = [
    { key: 'id', label: 'ID', w: 96 },
    { key: 'subject', label: 'Subject', flex: true, w: 460 },
    { key: 'requester', label: 'Requester', flex: true, w: 170 },
    { key: 'assignee', label: 'Assigned to', flex: true, w: 170 },
    { key: 'dueStatus', label: 'SLA Status', w: 142 },
    { key: 'status', label: 'Status', w: 152 },
    { key: 'priority', label: 'Priority', w: 132 },
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
  const [menuCol, setMenuCol] = useState<{ key: string; left: number; bottom: number } | null>(null);
  /* Freeze — Notion's model: everything from the left EDGE up to and including the chosen
     column sticks in place while the grid scrolls horizontally. */
  /* Insert Left/Right drops an EMPTY placeholder column at the slot; a picker card hangs
     off it (search + everything addable). Choosing a column fills the slot; dismissing
     removes it. */
  const [insertAt, setInsertAt] = useState<{ index: number } | null>(null);
  const [phQ, setPhQ] = useState('');
  const [phRect, setPhRect] = useState<{ left: number; bottom: number } | null>(null);
  const phPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!insertAt) { setPhRect(null); return; }
    const el = document.getElementById('ph-col-th') ?? document.querySelector('[data-ph-col]');
    if (el) {
      const r = el.getBoundingClientRect();
      setPhRect({ left: r.left, bottom: r.bottom });
    }
    const onScroll = (e: Event) => {
      const t = e.target as Node | null;
      if (t && phPickerRef.current?.contains(t)) return;
      setInsertAt(null);
    };
    const close = () => setInsertAt(null);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [insertAt]);
  const commitInsert = (key: string) => {
    if (!insertAt) return;
    const next = colOrder.filter((k) => k !== key);
    next.splice(Math.min(insertAt.index, next.length), 0, key);
    applyColumns(next);
    setInsertAt(null);
    setPhQ('');
  };
  const MAX_FROZEN = 3;
  const [frozenUpTo, setFrozenUpTo] = useState<string | null>(null);
  // Grouping — toggled from any column header menu; every group band is collapsible.
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  // One rows-per-page setting for ALL groups — mixed per-group sizes would be chaos.
  const [groupPageSize, setGroupPageSize] = useState(5);
  useEffect(() => {
    if (!clearGroupingSignal) return;
    setGroupBy(null);
    setCollapsed(new Set());
    setGroupPages({});
    onGroupedChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearGroupingSignal]);
  /* Which Ticket field each column sorts on; the optional catalog columns have no backing
     field, so their menu sorts by created date as a sensible stand-in. */
  /* Sort control: unsorted → asc → desc → off, with a rank badge once more than one
     column is in play, so the tie-break order is never a guess. */
  const sortChain = sorts ?? (sortColumn ? [{ column: sortColumn, dir: sortDirection }] : []);
  const sortButton = (field: keyof Ticket, hoverGroup: string) => {
    const idx = sortChain.findIndex((s) => s.column === field);
    const entry = idx >= 0 ? sortChain[idx] : null;
    const rank = sortChain.length > 1 && idx >= 0 ? idx + 1 : null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onSort(field); }}
        title={
          entry
            ? `Sorted ${entry.dir === 'asc' ? 'ascending' : 'descending'}${rank ? ` (${rank} of ${sortChain.length})` : ''} — click to ${entry.dir === 'asc' ? 'reverse' : 'remove'}`
            : sortChain.length
              ? 'Add to sort'
              : 'Sort'
        }
        className={`flex h-5 flex-shrink-0 items-center justify-center gap-0.5 rounded px-0.5 transition-all hover:bg-[#E8ECF1] ${entry ? '' : `opacity-0 ${hoverGroup}`}`}
      >
        {entry ? (entry.dir === 'asc' ? <ArrowUp size={12} className="text-[#3D8BD0]" /> : <ArrowDown size={12} className="text-[#3D8BD0]" />) : <ArrowUpDown size={12} className="text-[#9CA3AF]" />}
        {rank && (
          <span className="flex size-3.5 items-center justify-center rounded-sm bg-[#EBF5FF] text-[9px] font-semibold leading-none text-[#3D8BD0]">
            {rank}
          </span>
        )}
      </button>
    );
  };
  const SORT_FIELD: Record<string, keyof Ticket> = {
    id: 'id', subject: 'subject', requester: 'requester', assignee: 'assignedTo',
    dueStatus: 'dueBy', status: 'status', priority: 'priority', created: 'createdBy',
  };
  const hideColumn = (key: string) => applyColumns(colOrder.filter((k) => k !== key));

  const changeColumn = (fromKey: string, toKey: string) =>
    applyColumns(colOrder.map((k) => (k === fromKey ? toKey : k)));
  const [showColMgr, setShowColMgr] = useState(false);
  useEffect(() => {
    const cols = colOrder.map((k) => ({ key: k, label: CATALOG.find((c) => c.key === k)?.label ?? k }));
    window.dispatchEvent(new CustomEvent('grid-columns', { detail: cols }));
  }, [colOrder]);
  /* The grid toolbar's Settings menu asks for the column manager; anchor it to the
     header gutter icon so it opens exactly where a direct click would put it. */
  useEffect(() => {
    const onOpen = () => {
      const el = document.querySelector('[data-col-mgr-anchor]');
      if (el) {
        const r = el.getBoundingClientRect();
        setMgrRect({ right: r.right, bottom: r.bottom });
      }
      setShowColMgr(true);
    };
    window.addEventListener('open-column-manager', onOpen);
    const onGroupReq = (e: Event) => applyGroup(((e as CustomEvent).detail as string) || null);
    window.addEventListener('set-group-by', onGroupReq as EventListener);
    window.addEventListener('open-column-manager', onOpen);
    return () => {
      window.removeEventListener('open-column-manager', onOpen);
      window.removeEventListener('set-group-by', onGroupReq as EventListener);
    };
  }, []);
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
  // Display list: the real columns with the placeholder slot woven in (ri = real index).
  const PH_W = 200;
  const displayCols: (ColDef | null)[] = insertAt
    ? [...cols.slice(0, insertAt.index), null, ...cols.slice(insertAt.index)]
    : (cols as (ColDef | null)[]);
  let __ri = 0;
  const displayMeta = displayCols.map((col) => ({ col, ri: col ? __ri++ : -1 }));
  // Frozen-column geometry: each pinned cell sticks at the sum of the widths before it.
  const frozenIdx = frozenUpTo ? cols.findIndex((c) => c.key === frozenUpTo) : -1;
  const leftOf = (i: number) => CHECK_W + fitted.slice(0, i).reduce((n, w) => n + w, 0);
  // The last frozen column carries the edge: a hairline + soft shadow over the scrolling side.
  const frozenCellCls = (i: number, picked: boolean, kbFocus = false) =>
    `sticky z-20 ${kbFocus ? 'bg-[#F5FAFF]' : picked ? 'bg-[#f9fafb]' : 'bg-white group-hover:bg-[#f9fafb]'}`;

  /* One renderer per column, so the body follows whatever order the header is dragged into. */
  const renderCell = (key: string, ticket: Ticket) => {
    switch (key) {
      case 'id':
        return (
              <td data-col="id" className="overflow-hidden px-4 py-3">
                {/* The peek is anchored to the PILL, not this wrapper — the attention badge
                    overhangs the corner, and hovering it used to bubble up here and open the
                    quick view behind its own tooltip. One hover target, one popup. */}
                <span className="relative inline-block">
                  <span
                    className="whitespace-nowrap inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] cursor-pointer hover:bg-[#d0e8f9] transition-colors"
                    onMouseEnter={() => hoverPeekStart(ticket.id)}
                    onMouseLeave={hoverPeekEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTicketClick(ticket);
                    }}
                  >
                    {ticket.id}
                  </span>
                  <RowAttention ticket={ticket} />
                </span>
              </td>
        );
      case 'subject':
        return (
              <td
                data-col="subject"
                className="relative cursor-pointer overflow-hidden px-4 py-3 text-[12px] text-[#364658]"
                onClick={() => onTicketClick(ticket)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {/* Unread rows read bold, Gmail-style. */}
                  <span className={`min-w-0 flex-1 truncate decoration-[#94A3B8] decoration-dotted underline-offset-[3px] group-hover:underline ${ticket.unread ? 'font-semibold text-[#1E293B]' : 'font-medium'}`}>{ticket.subject}</span>
                </span>
                {/* Row hover: an explicit way in, so "click the row" is never the only clue. */}
                <span className={`pointer-events-none absolute inset-y-[2px] right-0 hidden items-center pl-10 pr-4 group-hover:flex ${ticket.id === kbFocusId ? 'bg-gradient-to-l from-[#F5FAFF] via-[#F5FAFF] via-70% to-transparent' : 'bg-gradient-to-l from-[#f9fafb] via-[#f9fafb] via-70% to-transparent'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTicketClick(ticket);
                    }}
                    className="pointer-events-auto inline-flex h-6 flex-shrink-0 items-center gap-1 rounded border border-[#DFE5ED] bg-white px-2 text-[11px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                  >
                    <PanelRightOpen size={12} className="flex-shrink-0" />
                    Open
                  </button>
                </span>
              </td>
        );
      case 'requester':
        return (
              <td className="px-2 py-0 text-[12px] text-[#364658] whitespace-nowrap">
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
              <td className="px-2 py-0 whitespace-nowrap">
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
                <SlaPill ticket={ticket} />
              </td>
        );
      case 'status':
        return (
              <td className="px-2 py-0 whitespace-nowrap">
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
              <td className="px-2 py-0">
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
      case 'impact': {
        const iv = extraValue('impact', ticket);
        return (
              <td className="px-2 py-0">
                <InlineSelect options={IMPACT_OPTIONS} value={iv} onPick={(label) => onUpdateTicket?.(ticket.id, { impact: label } as Partial<Ticket>)}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: impactColor(iv) }} />
                    <span className="truncate text-[12px] text-[#4A5568]">{iv}</span>
                  </span>
                </InlineSelect>
              </td>
        );
      }
      case 'tags': {
        const tags = extraValue('tags', ticket).split(', ').filter(Boolean);
        const shown = tags.slice(0, 2);
        const extra = tags.length - shown.length;
        return (
          <td className="overflow-hidden whitespace-nowrap px-4 py-3">
            <span className="flex items-center gap-1">
              {shown.map((tag) => (
                <span key={tag} className="max-w-[120px] truncate rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                  {tag}
                </span>
              ))}
              {extra > 0 && (
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <span className="flex-shrink-0 cursor-default rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#475569]">+{extra}</span>
                  </TooltipTrigger>
                  <TooltipContent className="text-wrap">
                    <div className="flex max-w-[220px] flex-wrap gap-1 py-0.5">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded bg-white/15 px-2 py-0.5 text-[11px]">{tag}</span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </td>
        );
      }
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
  /* ---------- Grouping ---------- */
  const SLA_GROUP: Record<SlaTone, string> = {
    breached: 'SLA Breached', due: 'Due Soon', ok: 'On Track', done: 'Met',
  };
  const SLA_GROUP_COLOR: Record<string, string> = {
    'SLA Breached': '#E74C3C', 'Due Soon': '#F39C12', 'On Track': '#27AE60', Met: '#64748B',
  };
  // What VALUE a row contributes when grouped by a column; catalog columns use their
  // derived cell value, so grouping works for every column the same way.
  /** Apply (or clear) grouping and report it upward — shared by the column menu and
   *  the toolbar's Group by row, so the two can never disagree. */
  const applyGroup = (key: string | null) => {
    setGroupBy(key);
    setCollapsed(new Set());
    setGroupPages({});
    if (!key) {
      onGroupedChange?.(false);
      return;
    }
    const src = allTickets ?? tickets;
    const counts = new Map<string, number>();
    for (const t of src) {
      const v = groupValueOf(key, t);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const ord = GROUP_ORDERS[key];
    const ks = [...counts.keys()].sort((a, b) => (ord ? ord.indexOf(a) - ord.indexOf(b) : a.localeCompare(b)));
    onGroupedChange?.(true, {
      label: CATALOG.find((c) => c.key === key)?.label ?? key,
      groups: counts.size,
      total: src.length,
      list: ks.map((k) => ({ key: k, count: counts.get(k)! })),
    });
  };

  const groupValueOf = (key: string, t: Ticket): string => {
    switch (key) {
      case 'id': return t.id;
      case 'subject': return t.subject;
      case 'requester': return t.requester;
      case 'assignee': return t.assignedTo.name;
      case 'status': return t.status;
      case 'priority': return t.priority;
      case 'dueStatus': return SLA_GROUP[dueBySla(t).tone];
      case 'created': { const p = fmtDate(t.createdBy).split(' '); return `${p[0]} ${p[1]}`; }
      default: return extraValue(key, t);
    }
  };
  // Lifecycle-ordered where the values have a natural order; alphabetical otherwise.
  const GROUP_ORDERS: Record<string, string[]> = {
    status: ['Open', 'In Progress', 'Pending', 'Completed', 'Closed', 'Cancelled'],
    priority: ['Urgent', 'High', 'Medium', 'Low'],
    dueStatus: ['SLA Breached', 'Due Soon', 'On Track', 'Met'],
    impact: ['On Business', 'On Department', 'On Users', 'Low'],
  };
  // The band shows the value in its column's own visual language.
  const groupBand = (colKey: string, value: string) => {
    const label = value === '---' ? 'No value' : value;
    const text = 'text-[12px] font-semibold text-[#364658]';
    if (colKey === 'status') {
      return <span className={`inline-flex items-center gap-1.5 ${text}`}><span className="size-2 rounded-full" style={{ backgroundColor: statusColor(value) }} />{label}</span>;
    }
    if (colKey === 'impact') {
      return <span className={`inline-flex items-center gap-1.5 ${text}`}><span className="size-2 rounded-full" style={{ backgroundColor: impactColor(value) }} />{label}</span>;
    }
    if (colKey === 'priority' || colKey === 'urgency') {
      return <span className={`inline-flex items-center gap-1.5 ${text}`}><span className="size-2 rounded-full" style={{ backgroundColor: priorityColor(value) }} />{label}</span>;
    }
    if (colKey === 'assignee' || colKey === 'requester' || colKey === 'closedBy' || colKey === 'resolvedBy' || colKey === 'lastUpdatedBy' || colKey === 'createdByUser') {
      const accent = colKey === 'requester' ? '#E67E22' : '#3D8BD0';
      return (
        <span className={`inline-flex items-center gap-1.5 ${text}`}>
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-medium text-white" style={{ backgroundColor: accent }}>
            {requesterAvatar(label).initials}
          </span>
          {label}
        </span>
      );
    }
    if (colKey === 'dueStatus') {
      return <span className={`inline-flex items-center gap-1.5 ${text}`}><span className="size-2 rounded-full" style={{ backgroundColor: SLA_GROUP_COLOR[value] ?? '#94A3B8' }} />{label}</span>;
    }
    return <span className={text}>{label}</span>;
  };
  // The tbody renders this flat list: band rows interleaved with their tickets.
  /* Grouped rendering = ONE TABLE PER GROUP, each preceded by a sticky title; the title +
     that group's header stick while its rows scroll and are pushed out when the group ends
     (sticky is constrained to the group block). */
  interface GroupBlock { key: string; colKey: string; all: Ticket[]; slice: Ticket[]; page: number; pages: number; start: number; end: number }
  const groupBlocks: GroupBlock[] = [];
  if (groupBy) {
    const source = allTickets ?? tickets;
    const buckets = new Map<string, Ticket[]>();
    for (const t of source) {
      const v = groupValueOf(groupBy, t);
      if (!buckets.has(v)) buckets.set(v, []);
      buckets.get(v)!.push(t);
    }
    const order = GROUP_ORDERS[groupBy];
    const keys = [...buckets.keys()].sort((a, b) => (order ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b)));
    for (const k of keys) {
      const arr = buckets.get(k)!;
      const pages = Math.ceil(arr.length / groupPageSize);
      const page = Math.min(groupPages[k] ?? 1, pages);
      const start = (page - 1) * groupPageSize;
      const slice = arr.slice(start, start + groupPageSize);
      groupBlocks.push({ key: k, colKey: groupBy, all: arr, slice, page, pages, start: start + 1, end: start + slice.length });
    }
  }
  const groupArrowBtn = 'flex h-8 w-8 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#64748B]';
  const colGroupJSX = (
    <colgroup>
      <col style={{ width: CHECK_W }} />
      {displayMeta.map((m) =>
        m.col ? (
          <col key={m.col.key} style={{ width: fitted[m.ri], backgroundColor: dragCol === m.col.key ? '#F5F7FA' : undefined }} />
        ) : (
          <col key="__ph" style={{ width: PH_W }} />
        ),
      )}
      <col style={{ width: ICON_W }} />
    </colgroup>
  );
  /* Corner badge on the ID pill summarising what needs attention (unread replies, a
     pending approval, open tasks). It is an arrival nudge, not a permanent marker:
     every card row can be ACKNOWLEDGED — the count shrinks per ack and the badge
     disappears once everything is cleared. Session-only state by design; the next
     visit re-surfaces whatever is still genuinely pending. Keys are `id|signal`. */
  const [ackedAttn, setAckedAttn] = useState<Set<string>>(new Set());
  const ackAttn = (...keys: string[]) => setAckedAttn((prev) => new Set([...prev, ...keys]));

  const [kbFocusId, setKbFocusId] = useState<string | null>(null);
  const [kbPeek, setKbPeek] = useState(false);
  const peekRef = useRef<HTMLDivElement | null>(null);
  const [peekPos, setPeekPos] = useState<{ top: number; left: number } | null>(null);
  const [peekAiView, setPeekAiView] = useState(false);
  const [hoverPeekId, setHoverPeekId] = useState<string | null>(null);
  const hoverOpenT = useRef<number | null>(null);
  const hoverCloseT = useRef<number | null>(null);
  const hoverPeekStart = (id: string) => {
    if (kbPeek) return;
    if (hoverCloseT.current) {
      clearTimeout(hoverCloseT.current);
      hoverCloseT.current = null;
    }
    if (hoverOpenT.current) clearTimeout(hoverOpenT.current);
    hoverOpenT.current = window.setTimeout(() => setHoverPeekId(id), hoverPeekId ? 150 : 550);
  };
  const hoverPeekEnd = () => {
    if (hoverOpenT.current) {
      clearTimeout(hoverOpenT.current);
      hoverOpenT.current = null;
    }
    if (kbPeek) return;
    hoverCloseT.current = window.setTimeout(() => setHoverPeekId(null), 150);
  };
  const hoverPeekHold = () => {
    if (hoverCloseT.current) {
      clearTimeout(hoverCloseT.current);
      hoverCloseT.current = null;
    }
  };
  useEffect(
    () => () => {
      if (hoverOpenT.current) clearTimeout(hoverOpenT.current);
      if (hoverCloseT.current) clearTimeout(hoverCloseT.current);
    },
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape' && e.key.toLowerCase() !== 'a') return;
      const t = e.target as HTMLElement;
      if (t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[data-drawer]')) return;
      if (!tickets.length) return;
      const idx = tickets.findIndex((x) => x.id === kbFocusId);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next =
          idx < 0
            ? e.key === 'ArrowDown'
              ? 0
              : tickets.length - 1
            : Math.min(tickets.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)));
        const id = tickets[next].id;
        setKbFocusId(id);
        document.querySelector(`[data-row-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
      } else if (idx >= 0 && e.key === 'Enter') {
        setKbPeek(false);
        onTicketClick(tickets[idx]);
      } else if (idx >= 0 && e.key === ' ') {
        e.preventDefault();
        setKbPeek((v) => !v);
      } else if (e.key === 'Escape') {
        // First Esc closes the peek; the next one clears the row focus entirely.
        if (kbPeek) setKbPeek(false);
        else if (hoverPeekId) setHoverPeekId(null);
        else if (kbFocusId) setKbFocusId(null);
      } else if (e.key.toLowerCase() === 'a' && (kbPeek || hoverPeekId)) {
        e.preventDefault();
        setPeekAiView((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tickets, kbFocusId, kbPeek, hoverPeekId, onTicketClick]);

  /* Anchor the peek card to the focused row — below it, flipping above near the viewport
     bottom. The card renders off-screen first so the REAL height drives the flip. */
  const peekId = kbPeek ? kbFocusId : hoverPeekId;
  useLayoutEffect(() => {
    if (!peekId) return;
    const place = () => {
      const row = document.querySelector(`[data-row-id="${peekId}"]`);
      if (!row) {
        setPeekPos(null);
        return;
      }
      const r = (row as HTMLElement).getBoundingClientRect();
      const h = peekRef.current?.offsetHeight ?? 240;
      const sc = (row as HTMLElement).querySelector('[data-col="subject"]');
      const anchorLeft = sc ? sc.getBoundingClientRect().left + 16 : r.left + 48;
      const left = Math.min(Math.max(anchorLeft, 16), Math.max(16, window.innerWidth - 536));
      const bite = Math.round(r.height * 0.6) + 5;
      let top = r.top + bite;
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.bottom - bite - h);
      setPeekPos({ top, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [peekId, kbPeek, peekAiView]);

  useEffect(() => {
    if (!kbPeek && !hoverPeekId) setPeekAiView(false);
  }, [kbPeek, hoverPeekId]);

  useEffect(() => {
    if (!kbPeek && !hoverPeekId) return;
    const onDown = (e: MouseEvent) => {
      if (peekRef.current?.contains(e.target as Node)) return;
      setKbPeek(false);
      setHoverPeekId(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [kbPeek]);
  const RowAttention = ({ ticket }: { ticket: Ticket }) => {
    const total = ticket.tasksTotal ?? 0;
    const done = ticket.tasksDone ?? 0;
    const hasUnread = !!ticket.unread && !ackedAttn.has(`${ticket.id}|unread`);
    const hasApproval = !!ticket.approval && !ackedAttn.has(`${ticket.id}|approval`);
    const openTasks = total > 0 && done < total && !ackedAttn.has(`${ticket.id}|tasks`);
    /* Open tasks alone never badge a row (every request has tasks) — they only ride
       along in the card once replies or an approval already earned the badge. */
    if (!hasUnread && !hasApproval) return null;
    const items = [hasUnread, hasApproval, openTasks].filter(Boolean).length;
    // Dark slate so the tiny corner count stays legible; detail is the hover card’s job.
    const tone = { bg: '#475569', fg: '#FFFFFF' };
    const names = taskListFor(ticket.subject);
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            /* Sliding off the pill onto the badge leaves an open peek behind — close it so
               the attention card is the only thing on screen. */
            onMouseEnter={hoverPeekEnd}
            className="absolute -right-2 -top-1.5 z-10 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold tabular-nums ring-2 ring-white"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
          >
            {items}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" sideOffset={6} hideArrow className="w-[272px] border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-lg">
          <div className="px-3 py-2.5 text-left">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Needs attention</div>
            <div className="space-y-2.5">
              {hasUnread && (
                <div className="group/att flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF]">
                    <MessageSquare size={11} className="text-[#3D8BD0]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold">
                      {ticket.unread} new message{ticket.unread === 1 ? '' : 's'}
                    </div>
                    {ticket.lastMsg && (
                      <p className="mt-0.5 text-[11px] leading-snug text-[#64748B] line-clamp-2 text-wrap">
                        {ticket.lastMsg.from}: {ticket.lastMsg.snippet}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label="Acknowledge messages"
                    onClick={(e) => {
                      e.stopPropagation();
                      ackAttn(`${ticket.id}|unread`);
                    }}
                    className="invisible mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#EAF7F0] hover:text-[#22A06B] group-hover/att:visible"
                  >
                    <Check size={12} />
                  </button>
                </div>
              )}
              {hasApproval && ticket.approval && (
                <div className="group/att flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF3E0]">
                    <UserCheck size={11} className="text-[#F39C12]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold">Approval pending</div>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      {ticket.approval.approver} · Level {ticket.approval.level} of {ticket.approval.totalLevels} · waiting {ticket.approval.waiting}
                    </p>
                  </div>
                  <button
                    aria-label="Acknowledge approval"
                    onClick={(e) => {
                      e.stopPropagation();
                      ackAttn(`${ticket.id}|approval`);
                    }}
                    className="invisible mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#EAF7F0] hover:text-[#22A06B] group-hover/att:visible"
                  >
                    <Check size={12} />
                  </button>
                </div>
              )}
              {openTasks && (
                <div className="group/att flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F1F5F9]">
                    <ListChecks size={11} className="text-[#64748B]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold">Tasks</span>
                      <span className="text-[11px] font-semibold text-[#64748B]">{done} of {total} done</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#EEF1F4]">
                      <div className="h-full rounded-full bg-[#22A06B]" style={{ width: `${Math.round((done / total) * 100)}%` }} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-[#64748B]">Next: {names[done] ?? names[0]}</p>
                  </div>
                  <button
                    aria-label="Acknowledge tasks"
                    onClick={(e) => {
                      e.stopPropagation();
                      ackAttn(`${ticket.id}|tasks`);
                    }}
                    className="invisible mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#EAF7F0] hover:text-[#22A06B] group-hover/att:visible"
                  >
                    <Check size={12} />
                  </button>
                </div>
              )}
            </div>
            {/* One-click clear for the whole card. */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                ackAttn(`${ticket.id}|unread`, `${ticket.id}|approval`, `${ticket.id}|tasks`);
              }}
              className="-mx-3 -mb-2.5 mt-2.5 flex w-[calc(100%+24px)] items-center justify-center gap-1.5 rounded-b-md border-t border-[#F1F5F9] px-3 py-2 text-[11px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F5FAFF]"
            >
              <CheckCheck size={13} />
              Acknowledge all
            </button>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderTicketRow = (ticket: Ticket) => {
    const picked = selectedTickets.has(ticket.id);
    const kbFocus = ticket.id === kbFocusId;
    return (
            <tr
              key={ticket.id}
              data-row-id={ticket.id}
              className={`group scroll-mt-11 scroll-mb-1 border-b border-[#F1F5F9] transition-colors ${kbFocus ? 'bg-[#F5FAFF] [outline:1px_solid_#3D8BD0] [outline-offset:-1px]' : picked ? 'bg-[#f9fafb]' : 'hover:bg-[#f9fafb]'}`}
            >
              <td className={`relative py-3 pl-6 pr-4 ${frozenIdx >= 0 ? `sticky left-0 z-20 ${kbFocus ? 'bg-[#F5FAFF]' : picked ? 'bg-[#f9fafb]' : 'bg-white group-hover:bg-[#f9fafb]'}` : ''}`}>
                {/* Left accent — keeps a picked row obvious while scanning down the grid. */}
                {picked && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#DFE5ED]" />}
                <input
                  type="checkbox"
                  checked={picked}
                  onChange={(e) => onSelectTicket(ticket.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>
              {displayMeta.map((m) => {
                if (!m.col) return <td key="__ph" className="bg-[#FAFBFC]" />;
                const c = m.col;
                const ci = m.ri;
                const el = renderCell(c.key, ticket);
                if (ci <= frozenIdx && isValidElement(el)) {
                  const props = el.props as { className?: string; style?: React.CSSProperties };
                  return (
                    <Fragment key={c.key}>
                      {cloneElement(el as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
                        className: `${props.className ?? ''} ${frozenCellCls(ci, picked, kbFocus)}`,
                        style: { ...(props.style ?? {}), left: leftOf(ci), ...(ci === frozenIdx ? { boxShadow: frozenEdgeShadow } : {}) },
                      })}
                    </Fragment>
                  );
                }
                return <Fragment key={c.key}>{el}</Fragment>;
              })}
              <td />
            </tr>
    );
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
      {!groupBy ? (
      <table className="w-full table-fixed" style={{ minWidth: baseTotal + (insertAt ? PH_W : 0) }}>
        {colGroupJSX}
        {/* Grouped view: each group repeats the headings, so the common header hides. */}
        {!groupBy && (
        <thead>
          <tr className="bg-white">
            <th className={`sticky top-[var(--tb,0px)] z-30 shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] bg-white py-2.5 pl-6 pr-4 text-left ${frozenIdx >= 0 ? 'left-0 z-[35]' : ''}`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
              />
            </th>
            {displayMeta.map((m) => {
              if (!m.col) {
                return (
                  <th key="__ph" id="ph-col-th" className="sticky top-[var(--tb,0px)] z-30 shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] bg-[#F8FAFC] px-4 py-2.5 text-left">
                    <span className="text-[12px] font-medium italic text-[#94A3B8]">New column</span>
                  </th>
                );
              }
              const c = m.col;
              const ci = m.ri;
              return (
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
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setMenuCol({ key: c.key, left: r.left, bottom: r.bottom });
                }}
                style={
                  ci <= frozenIdx
                    ? {
                        left: leftOf(ci),
                        ...(ci === frozenIdx
                          ? { boxShadow: frozenEdgeShadow + ', inset 0 -1px 0 #E5E7EB, 0 2px 3px rgba(16,24,40,0.04)' }
                          : {}),
                      }
                    : undefined
                }
                className={`${TH} ${ci <= frozenIdx ? 'z-[35]' : ''} ${dragCol === c.key ? 'opacity-40' : ''} ${dragCol && dragCol !== c.key && dragOver?.key === c.key ? 'bg-[#EBF5FF]' : menuCol?.key === c.key ? 'bg-[#F1F5F9]' : 'bg-white'}`}
              >
                {/* Grip — the "you can drag this" affordance, revealed on hover. */}
                <GripVertical size={12} className="pointer-events-none absolute left-[3px] top-1/2 -translate-y-1/2 text-[#9CA3AF] opacity-0 transition-opacity group-hover/th:opacity-100" />
                <span className="flex items-center gap-0.5">
                  <span className="truncate">{c.label}</span>
                  {/* One-click sort toggle — the most-used action lives on the header
                      itself; the menu keeps the rest. */}
                  {SORT_FIELD[c.key] && sortButton(SORT_FIELD[c.key], 'group-hover/th:opacity-100')}
                </span>
                {resizer(c.key)}
              </th>
              );
            })}
            {/* Manage columns — pinned at the right edge of the header. */}
            <th className="sticky right-0 top-[var(--tb,0px)] z-40 shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] bg-white p-0">
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
                    <Columns3 size={15} data-col-mgr-anchor />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Manage columns</TooltipContent>
              </Tooltip>
            </th>
          </tr>
        </thead>
        )}
        {/* No tbody background — it would paint over the <col> tint of the dragged column.
            No divide either: ticket rows carry their own light border, so group headers
            and pagers stay line-free. */}
        <tbody>
          {tickets.map((ticket) => renderTicketRow(ticket))}
        </tbody>
      </table>
      ) : (
      <div className="pb-1">
        {groupBlocks.map((g) => {
          const isCollapsed = collapsed.has(g.key);
          const allSel = g.all.every((t) => selectedTickets.has(t.id));
          const go = (p: number) => setGroupPages((gp) => ({ ...gp, [g.key]: Math.min(Math.max(1, p), g.pages) }));
          return (
            <div key={g.key} data-group-block={g.key} className="mb-3">
              {/* Sticky group title — pinned while its rows scroll, pushed out at the end. */}
              <div className={`sticky left-0 top-[var(--tb,0px)] z-40 flex h-12 items-center px-6 transition-colors duration-500 ${flashGroup === g.key ? 'bg-[#EBF5FF]' : 'bg-white'}`}>
                <button
                  onClick={() =>
                    setCollapsed((p) => {
                      const n = new Set(p);
                      if (n.has(g.key)) n.delete(g.key);
                      else n.add(g.key);
                      return n;
                    })
                  }
                  className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-[#F5F7FA]"
                >
                  <ChevronDown size={14} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  {groupBand(g.colKey, g.key)}
                  <span className="text-[12px] font-medium text-[#94A3B8]">{g.all.length}</span>
                </button>
              </div>
              {!isCollapsed && (
                <table className="w-full table-fixed" style={{ minWidth: baseTotal + (insertAt ? PH_W : 0) }}>
                  {colGroupJSX}
                  {/* The group header sticks just under the title (h-12 = 48px). */}
                  <thead>
                    <tr>
                      <th className={`sticky top-[calc(var(--tb,0px)+48px)] shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] bg-white py-1.5 pl-6 pr-4 text-left ${frozenIdx >= 0 ? 'left-0 z-30' : 'z-20'}`}>
                        <input
                          type="checkbox"
                          checked={allSel}
                          onChange={(e) => g.all.forEach((t) => onSelectTicket(t.id, e.target.checked))}
                          onClick={(e) => e.stopPropagation()}
                          title="Select all in this group"
                          className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0]"
                        />
                      </th>
                      {displayMeta.map((m) =>
                        m.col ? (
                          <th
                            key={m.col.key}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragGhost(e, m.col!.label); setDragCol(m.col!.key); }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              const r = e.currentTarget.getBoundingClientRect();
                              const after = e.clientX > r.left + r.width / 2;
                              if (!dragOver || dragOver.key !== m.col!.key || dragOver.after !== after) setDragOver({ key: m.col!.key, after });
                            }}
                            onDragLeave={() => { if (dragOver?.key === m.col!.key) setDragOver(null); }}
                            onDrop={(e) => { e.preventDefault(); dropColumn(); }}
                            onDragEnd={() => { setDragCol(null); setDragOver(null); }}
                            style={
                              m.ri >= 0 && m.ri <= frozenIdx
                                ? {
                                    left: leftOf(m.ri),
                                    ...(m.ri === frozenIdx
                                      ? { boxShadow: frozenEdgeShadow + ', inset 0 -1px 0 #E5E7EB, 0 2px 4px rgba(16,24,40,0.06)' }
                                      : {}),
                                  }
                                : undefined
                            }
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setMenuCol({ key: m.col!.key, left: r.left, bottom: r.bottom });
                            }}
                            className={`group/gh sticky top-[calc(var(--tb,0px)+48px)] shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] cursor-grab select-none truncate whitespace-nowrap px-4 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B] transition-colors hover:bg-[#F7F9FB] hover:text-[#364658] ${m.ri >= 0 && m.ri <= frozenIdx ? 'z-30' : 'z-20'} ${dragCol === m.col.key ? 'opacity-40' : ''} ${dragCol && dragCol !== m.col.key && dragOver?.key === m.col.key ? 'bg-[#EBF5FF]' : menuCol?.key === m.col.key ? 'bg-[#F1F5F9]' : 'bg-white'}`}
                          >
                            <GripVertical size={12} className="pointer-events-none absolute left-[3px] top-1/2 -translate-y-1/2 text-[#9CA3AF] opacity-0 transition-opacity group-hover/gh:opacity-100" />
                            <span className="flex items-center gap-0.5">
                              <span className="truncate">{m.col.label}</span>
                              {SORT_FIELD[m.col.key] && sortButton(SORT_FIELD[m.col.key], 'group-hover/gh:opacity-100')}
                            </span>
                          </th>
                        ) : (
                          <th key="__ph" data-ph-col className="sticky top-[calc(var(--tb,0px)+48px)] z-20 shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] whitespace-nowrap bg-white px-4 py-1.5 text-left text-[11px] font-medium italic text-[#94A3B8]">
                            New column
                          </th>
                        ),
                      )}
                      <th className="sticky top-[calc(var(--tb,0px)+48px)] z-20 shadow-[inset_0_-1px_0_#E5E7EB,0_2px_4px_rgba(16,24,40,0.06)] bg-white" />
                    </tr>
                  </thead>
                  <tbody>{g.slice.map((t) => renderTicketRow(t))}</tbody>
                </table>
              )}
              {!isCollapsed && g.pages > 1 && (
                <div className="px-4 pb-2 pt-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-3 py-1 pl-7">
                    <span className="text-[12px] text-[#64748B] tabular-nums">
                      Showing <span className="font-medium text-[#364658]">{g.start}–{g.end}</span> of{' '}
                      <span className="font-medium text-[#364658]">{g.all.length}</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-[12px] text-[#64748B]">Rows per page</span>
                        <select
                          value={groupPageSize}
                          onChange={(e) => { setGroupPageSize(Number(e.target.value)); setGroupPages({}); }}
                          className="app-select h-8 cursor-pointer rounded border border-transparent bg-[#F7F9FB] pl-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F1F5F9] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                        >
                          {[5, 10, 15, 25].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => go(g.page - 1)} disabled={g.page === 1} title="Previous page" className={groupArrowBtn}>
                          <ChevronLeft size={16} />
                        </button>
                        {g.pages <= 7 ? (
                          Array.from({ length: g.pages }, (_, p) => p + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => go(p)}
                              aria-current={g.page === p ? 'page' : undefined}
                              className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-[12px] tabular-nums transition-colors ${g.page === p ? 'bg-[#EBF5FF] font-semibold text-[#3D8BD0]' : 'font-medium text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#364658]'}`}
                            >
                              {p}
                            </button>
                          ))
                        ) : (
                          <span className="px-1 text-[12px] text-[#64748B]">Page {g.page} of {g.pages}</span>
                        )}
                        <button onClick={() => go(g.page + 1)} disabled={g.page === g.pages} title="Next page" className={groupArrowBtn}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
      {menuCol && (() => {
        const c = CATALOG.find((x) => x.key === menuCol.key);
        if (!c) return null;
        return (
          <HeaderMenu
            anchor={{ left: menuCol.left, bottom: menuCol.bottom }}
            col={c}
            catalog={CATALOG}
            visible={colOrder}
            groupedBy={groupBy === c.key}
            frozen={(() => {
              const i2 = colOrder.indexOf(c.key);
              const fi = frozenUpTo ? colOrder.indexOf(frozenUpTo) : -1;
              return fi >= 0 && i2 >= 0 && i2 <= fi;
            })()}
            freezeDisabled={(() => {
              const i2 = colOrder.indexOf(c.key);
              const fi = frozenUpTo ? colOrder.indexOf(frozenUpTo) : -1;
              const within = fi >= 0 && i2 <= fi;
              return !within && i2 >= MAX_FROZEN;
            })()}
            onFreeze={() => {
              const i2 = colOrder.indexOf(c.key);
              const fi = frozenUpTo ? colOrder.indexOf(frozenUpTo) : -1;
              if (fi >= 0 && i2 <= fi) {
                setFrozenUpTo(null);
                return;
              }
              // Freezing "up to" this column pins i2 + 1 columns — cap at MAX_FROZEN.
              if (i2 >= MAX_FROZEN) {
                toast.error(`You can freeze up to ${MAX_FROZEN} columns`);
                return;
              }
              setFrozenUpTo(c.key);
            }}
            onGroup={() => applyGroup(groupBy === c.key ? null : c.key)}
            onHide={() => hideColumn(c.key)}
            onInsertSlot={(side) => {
              const i2 = colOrder.indexOf(c.key);
              setInsertAt({ index: i2 + (side === 'right' ? 1 : 0) });
              setPhQ('');
            }}
            onChange={(key) => changeColumn(c.key, key)}
            onClose={() => setMenuCol(null)}
          />
        );
      })()}
      {insertAt && phRect && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setInsertAt(null)} />
          <div
            ref={phPickerRef}
            style={{ position: 'fixed', top: phRect.bottom + 4, left: Math.min(phRect.left, window.innerWidth - 272), width: 264 }}
            className="app-menu z-[9999] flex max-h-[340px] flex-col overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
          >
            <div className="border-b border-[#F0F2F5] px-3 pb-2 pt-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  autoFocus
                  value={phQ}
                  onChange={(e) => setPhQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setInsertAt(null); }}
                  placeholder="Search columns..."
                  className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                />
              </div>
            </div>
            {(() => {
              const avail = CATALOG.filter((cc) => !colOrder.includes(cc.key) && cc.label.toLowerCase().includes(phQ.trim().toLowerCase()));
              return (
                <>
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Available · {avail.length}</div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
                    {avail.length ? (
                      avail.map((cc) => (
                        <button
                          key={cc.key}
                          onClick={() => commitInsert(cc.key)}
                          className="group/ph flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F5F7FA]"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{cc.label}</span>
                          <Plus size={14} className="flex-shrink-0 text-[#3D8BD0] opacity-0 transition-opacity group-hover/ph:opacity-100" />
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No columns found</div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </>,
        document.body,
      )}
      {peekId &&
        (() => {
          const t = tickets.find((x) => x.id === peekId);
          return t ? (
            <TicketPeekCard
              t={t}
              kbPeek={kbPeek}
              aiView={peekAiView}
              cardRef={peekRef}
              pos={peekPos}
              onHold={hoverPeekHold}
              onEnd={hoverPeekEnd}
            />
          ) : null;
        })()}
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
/* ── Quick peek ──────────────────────────────────────────────────────────────
   The hover/keyboard preview card, lifted out of the grid so the KANBAN board can
   raise the identical card from its own ID pills. Everything it needs already lives
   in this module (statusColor, SlaPill, peekAiFor, Kbd…), so it stays here rather
   than dragging half of them into a new file. */
export function TicketPeekCard({
  t,
  kbPeek = false,
  aiView,
  cardRef,
  pos,
  onHold,
  onEnd,
}: {
  t: Ticket;
  /** Keyboard-opened peeks teach the whole key set; hover peeks hint only the one that works. */
  kbPeek?: boolean;
  aiView: boolean;
  cardRef: { current: HTMLDivElement | null };
  pos: { top: number; left: number } | null;
  onHold: () => void;
  onEnd: () => void;
}) {
  const done = t.tasksDone ?? 0;
  const total = t.tasksTotal ?? 0;
  const cb = t.createdBy;
  const createdStr = `${String(cb.getDate()).padStart(2, '0')}/${String(cb.getMonth() + 1).padStart(2, '0')}/${cb.getFullYear()} ${String(cb.getHours()).padStart(2, '0')}:${String(cb.getMinutes()).padStart(2, '0')}`;
  const daysAgo = 2 + (Number(t.id.replace(/\D/g, '')) % 12);
  const ai = peekAiFor(t.subject);
  return createPortal(
    <div
      ref={cardRef}
      onMouseEnter={onHold}
      onMouseLeave={onEnd}
      className="app-menu fixed z-[9990] w-[520px] overflow-hidden rounded-lg border border-[#CBD5E1] bg-white shadow-xl"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
    >
      <div className="px-4 pb-3.5 pt-3.5">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{t.id}</span>
          <span className="h-3 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#364658]">
                <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: statusColor(t.status) }} />
                {t.status}
              </span>
            </TooltipTrigger>
            <TooltipContent>Status: {t.status}</TooltipContent>
          </Tooltip>
          <span className="h-3 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#364658]">
                <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">{t.assignedTo.initials || 'UA'}</span>
                <span className="truncate">{t.assignedTo.name || 'Unassigned'}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Assignee: {t.assignedTo.name || 'Unassigned'}</TooltipContent>
          </Tooltip>
          <span className="h-3 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span className="inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#364658]">
                <Flag size={12} fill="currentColor" style={{ color: priorityColor(t.priority) }} />
                {t.priority}
              </span>
            </TooltipTrigger>
            <TooltipContent>Priority: {t.priority}</TooltipContent>
          </Tooltip>
          <span className="ml-auto flex-shrink-0">
            <SlaPill ticket={t} />
          </span>
        </div>
        <div className="mt-2.5 text-[13px] font-semibold leading-snug text-[#1E293B]">{t.subject}</div>
        {aiView ? (
          <>
            <div className="mt-3 flex items-center gap-1.5">
              <AiSparkle size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8B5CF6]">AI Analysis</span>
            </div>
            <div className="relative mt-2 overflow-hidden rounded-lg p-3">
              <span
                className="pointer-events-none absolute inset-0"
                style={{ opacity: 0.045, background: 'linear-gradient(90deg,#4CB1FE 0%,#731EFB 41.49%,#F911E3 100%)' }}
              />
              <div className="relative flex items-start gap-2">
                <span className="mt-px flex size-5 flex-shrink-0 items-center justify-center rounded bg-white">
                  <CircleCheck size={12} className="text-[#8B5CF6]" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#8B5CF6]">Analysis</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#364658]">{ai.analysis}</p>
                </div>
              </div>
              <div className="relative mt-2.5 flex items-start gap-2">
                <span className="mt-px flex size-5 flex-shrink-0 items-center justify-center rounded bg-white">
                  <Lightbulb size={12} className="text-[#8B5CF6]" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#8B5CF6]">Resolution</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#364658]">{ai.resolution}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-medium text-[#64748B]">Suggested Actions</div>
            {ai.actions.map((a) => (
              <button
                key={a.label}
                onClick={() => toast(`${a.label} — coming soon`)}
                className="mt-1.5 flex w-full items-center gap-2 rounded border border-[#DFE5ED] bg-white px-2.5 py-2 text-left transition-colors hover:bg-[#F5F7FA]"
              >
                <AiSparkle size={12} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#364658]">{a.label}</span>
                <span className="h-1 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#EEF1F4]">
                  <span className="block h-full rounded-full bg-[#8B5CF6]" style={{ width: `${a.conf}%` }} />
                </span>
                <span className="flex-shrink-0 text-[11px] font-semibold text-[#8B5CF6]">{a.conf}%</span>
              </button>
            ))}
          </>
        ) : (
          <>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#E67E22] text-[9px] font-semibold text-white">{requesterAvatar(t.requester).initials || '–'}</span>
          <span className="text-[12px] font-semibold text-[#364658]">{t.requester || 'Unknown requester'}</span>
          <span className="min-w-0 truncate text-[12px] text-[#6b7280]">
            Created at {createdStr} ({daysAgo} days ago) via <span className="font-medium text-[#364658]">Email</span>
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[#364658] line-clamp-3">{describeSubject(t.subject).short}</p>
        {total > 0 && (
          <div className="mt-3 flex items-center gap-2.5">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
              <ListChecks size={13} />
              Tasks
            </span>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
              <div className="h-full rounded-full bg-[#22A06B]" style={{ width: `${Math.round((done / total) * 100)}%` }} />
            </div>
            <span className={`flex-shrink-0 text-[11px] font-semibold ${done >= total ? 'text-[#22A06B]' : 'text-[#364658]'}`}>
              {done}/{total}
            </span>
          </div>
        )}
        {!!t.unread && t.lastMsg && (
          <div className="mt-3 flex items-start gap-2 rounded bg-[#F8FAFC] px-2.5 py-2">
            <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-white">
              <MessageSquare size={11} className="text-[#3D8BD0]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-[#1E293B]">{t.unread} new message{t.unread === 1 ? '' : 's'}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-[#64748B] line-clamp-2">
                <span className="font-medium text-[#364658]">{t.lastMsg.from}:</span> {t.lastMsg.snippet}
              </p>
            </div>
          </div>
        )}
        {t.approval && (
          <div className="mt-3 flex items-center gap-2 rounded bg-[#FFF7EB] px-2.5 py-2">
            <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-white">
              <UserCheck size={11} className="text-[#F39C12]" />
            </span>
            <p className="min-w-0 truncate text-[11px] leading-snug">
              <span className="font-semibold text-[#B45309]">Approval pending</span>
              <span className="text-[#8A6D3B]"> · {t.approval.approver} · Level {t.approval.level} of {t.approval.totalLevels}</span>
            </p>
          </div>
        )}
          </>
        )}
      </div>
      {/* Keyboard-opened peek teaches its whole key set; the hover peek only
          hints the one key that works without row focus. */}
      <div className="flex items-center gap-3 border-t border-[#EEF1F4] bg-[#F8FAFC] px-4 py-2 text-[11px] text-[#64748B]">
        {kbPeek && (
          <>
            <span className="inline-flex items-center gap-1">
              <Kbd>Enter</Kbd> open
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>Esc</Kbd> close
            </span>
          </>
        )}
        <span className="inline-flex items-center gap-1">
          <Kbd>A</Kbd> {aiView ? 'details' : 'AI view'}
        </span>
        {kbPeek && (
          <span className="ml-auto inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* Hover plumbing for the peek: open/close delays, placement and the keys that drive it.
   The grid keeps its own copy because its peek is entangled with row keyboard focus;
   this is for surfaces that only ever hover, like the board. */
export function useHoverPeek() {
  const [peekId, setPeekId] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [aiView, setAiView] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const openT = useRef<number | null>(null);
  const closeT = useRef<number | null>(null);

  const start = (id: string) => {
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = null;
    }
    if (openT.current) clearTimeout(openT.current);
    // Second and later peeks open fast — the long delay is only there to stop the
    // first card firing while the pointer is merely crossing the surface.
    openT.current = window.setTimeout(() => setPeekId(id), peekId ? 150 : 550);
  };
  const end = () => {
    if (openT.current) {
      clearTimeout(openT.current);
      openT.current = null;
    }
    closeT.current = window.setTimeout(() => setPeekId(null), 150);
  };
  const hold = () => {
    if (closeT.current) {
      clearTimeout(closeT.current);
      closeT.current = null;
    }
  };

  /* Anchored to the element that raised it, biting into its lower edge, flipping above
     when the card would run past the viewport bottom. Measured after render so the REAL
     height decides the flip. */
  useLayoutEffect(() => {
    if (!peekId) return;
    const place = () => {
      const anchor = document.querySelector(`[data-peek-anchor="${peekId}"]`) as HTMLElement | null;
      if (!anchor) {
        setPos(null);
        return;
      }
      const r = anchor.getBoundingClientRect();
      const h = cardRef.current?.offsetHeight ?? 240;
      const left = Math.min(Math.max(r.left, 16), Math.max(16, window.innerWidth - 536));
      const bite = Math.round(r.height * 0.6) + 5;
      let top = r.top + bite;
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.bottom - bite - h);
      setPos({ top, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [peekId, aiView]);

  useEffect(() => {
    if (!peekId) setAiView(false);
  }, [peekId]);

  useEffect(() => {
    if (!peekId) return;
    const onDown = (e: MouseEvent) => {
      if (cardRef.current?.contains(e.target as Node)) return;
      setPeekId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'Escape') setPeekId(null);
      else if (e.key.toLowerCase() === 'a') setAiView((v) => !v);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [peekId]);

  return { peekId, pos, aiView, cardRef, start, end, hold };
}
