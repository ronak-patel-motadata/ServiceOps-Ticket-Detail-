import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Inbox,
  MessageSquare,
  Timer,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { slaToneOf, SlaPill } from './TicketTable';
import type { Ticket } from './TicketListPage';
import { AGE_BUCKETS, ageHoursOf, type FilterRule } from './TicketFilterBar';
import { TECHNICIANS, groupOfTechnician } from './technicianRoster';
import { DEPARTMENTS } from './orgDepartments';
import { BreakdownPanel } from './BreakdownPanel';
import { TechnicianWorkloadPanel, type TechRow } from './TechnicianWorkloadPanel';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Dashboard layout of the request queue — the service-desk view a lead opens first:
   where the desk stands (headline tiles), where it is at risk (SLA, aging, breach list),
   how the work splits (status / priority / technician / department / source) and how it
   flows (received vs resolved). Every number derives from the SAME filtered ticket set the
   grid renders and the grid's own SLA rule, so no two surfaces can disagree.
   Charts are pure CSS/SVG — no chart library in the listing bundle. */

const isOpen = (t: Ticket) => t.status !== 'Closed' && t.status !== 'Completed' && t.status !== 'Cancelled';
const OPEN_STATES = ['Open', 'In Progress', 'Pending'];

const STATUS_COLORS: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#6366F1',
  Pending: '#fb923c',
  Completed: '#22c55e',
  Closed: '#6b7280',
  Cancelled: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = { Urgent: '#dc2626', High: '#ef4444', Medium: '#fb923c', Low: '#22c55e' };
const SLA_META = [
  { tone: 'breached' as const, label: 'Breached', color: '#ef4444' },
  { tone: 'due' as const, label: 'Due soon', color: '#f59e0b' },
  { tone: 'ok' as const, label: 'On track', color: '#22c55e' },
  { tone: 'done' as const, label: 'Met', color: '#94a3b8' },
];

/** Deterministic per-ticket hash — keeps every derived figure stable across renders. */
const hx = (id: string, salt: number) => {
  let n = salt;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return n;
};
const SOURCES = ['Email', 'Support Portal', 'Technician Portal', 'Walk-in'];
const deptOf = (t: Ticket) => DEPARTMENTS[hx(t.id, 4) % DEPARTMENTS.length];
const sourceOf = (t: Ticket) => SOURCES[hx(t.id, 5) % SOURCES.length];

const initialsOf = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

interface Seg {
  label: string;
  color: string;
  value: number;
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

function Card({
  title,
  sub,
  action,
  className = '',
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col rounded-lg border border-[#DFE5ED] bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#1E293B]">{title}</div>
          {sub && <div className="mt-0.5 text-[11px] text-[#94A3B8]">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Headline number. Clicking drills into the list with that filter applied. */
function Tile({
  icon: Icon,
  color,
  label,
  value,
  sub,
  trend,
  onClick,
  hint,
}: {
  icon: typeof Inbox;
  color: string;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  trend?: { pct: string; up: boolean; good: boolean };
  onClick?: () => void;
  hint?: string;
}) {
  const body = (
    <div
      className={`flex items-start gap-3 rounded-lg border border-[#DFE5ED] bg-white p-3.5 text-left transition-all ${
        onClick ? 'cursor-pointer hover:border-[#C9D4E0] hover:shadow-[0_2px_10px_rgba(16,24,40,0.07)]' : ''
      }`}
    >
      <span
        className="flex size-8 flex-shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Icon size={16} style={{ color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-[#64748B]">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums">{value}</span>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                trend.good ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {trend.pct}
              {trend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            </span>
          )}
        </div>
        {sub && <div className="truncate text-[11px] text-[#94A3B8]">{sub}</div>}
      </div>
    </div>
  );
  if (!onClick) return body;
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <button onClick={onClick} className="block w-full">
          {body}
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint ?? 'Open in list view'}</TooltipContent>
    </Tooltip>
  );
}

/* ── Charts ─────────────────────────────────────────────────────────────── */

function Donut({
  segs,
  total,
  centerLabel,
  size = 132,
  active = null,
}: {
  segs: Seg[];
  total: number;
  centerLabel: string;
  size?: number;
  /** Label of the slice being pointed at; the rest recede. */
  active?: string | null;
}) {
  const hot = active ? segs.find((s) => s.label === active) ?? null : null;
  let acc = 0;
  const stops = segs
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = (acc / total) * 360;
      acc += s.value;
      /* Receding slices keep their OWN hue at low alpha instead of turning grey — the ring
         still reads as the same chart, just quieter, so the eye tracks one wedge without
         losing its bearings. */
      const paint = !hot || hot.label === s.label ? s.color : `${s.color}24`;
      return `${paint} ${from}deg ${(acc / total) * 360}deg`;
    })
    .join(', ');
  return (
    <div
      className="relative flex-shrink-0 rounded-full"
      style={{ width: size, height: size, background: total > 0 ? `conic-gradient(${stops})` : '#F1F5F9' }}
    >
      <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-white px-3">
        {/* The centre answers the hover: that slice's count, in its own colour. */}
        <span
          className="text-[20px] font-semibold leading-none tabular-nums transition-colors"
          style={{ color: hot ? hot.color : '#1E293B' }}
        >
          {hot ? hot.value : total}
        </span>
        <span className="mt-1 w-full truncate text-center text-[10px] text-[#7B8FA5]">{hot ? hot.label : centerLabel}</span>
      </div>
    </div>
  );
}

function Legend({
  segs,
  total,
  onPick,
  active = null,
  onHover,
}: {
  segs: Seg[];
  total: number;
  onPick?: (label: string) => void;
  active?: string | null;
  onHover?: (label: string | null) => void;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5" onMouseLeave={onHover ? () => onHover(null) : undefined}>
      {segs.map((s) => {
        const dim = !!active && active !== s.label;
        return (
          <button
            key={s.label}
            onClick={onPick ? () => onPick(s.label) : undefined}
            /* Focus mirrors hover so tabbing through the legend lights the ring too. */
            onMouseEnter={onHover ? () => onHover(s.label) : undefined}
            onFocus={onHover ? () => onHover(s.label) : undefined}
            onBlur={onHover ? () => onHover(null) : undefined}
            className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-[12px] transition-all duration-150 ${
              onPick ? 'hover:bg-[#F5F7FA]' : 'cursor-default'
            } ${dim ? 'opacity-40' : ''} ${active === s.label ? 'bg-[#F5F7FA]' : ''}`}
          >
            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className={`min-w-0 flex-1 truncate text-left ${active === s.label ? 'text-[#364658]' : 'text-[#64748B]'}`}>
              {s.label}
            </span>
            <span className="font-semibold tabular-nums text-[#364658]">{s.value}</span>
            <span className="w-9 text-right text-[11px] tabular-nums text-[#94A3B8]">
              {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* Donut and its legend have to share one hovered slice, so they are one component rather
   than two siblings and a lifted state in every card that wants a ring. */
function DonutWithLegend({
  segs,
  total,
  centerLabel,
  onPick,
}: {
  segs: Seg[];
  total: number;
  centerLabel: string;
  onPick?: (label: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-4">
      <Donut segs={segs} total={total} centerLabel={centerLabel} active={active} />
      <Legend segs={segs} total={total} onPick={onPick} active={active} onHover={setActive} />
    </div>
  );
}


/** House chart tooltip: white card, bold dark value — never a tinted default box. */
function ChartTip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="app-menu min-w-[132px] rounded-lg border border-[#DFE5ED] bg-white px-3 py-2 shadow-lg">
      {label !== undefined && <div className="mb-1 text-[11px] font-medium text-[#7B8FA5]">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p: any) => {
          const dot = p.color || p.payload?.color || p.payload?.fill;
          return (
            <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[12px]">
              {dot && <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
              <span className="text-[#64748B]">{p.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-[#1E293B]">
                {p.value}
                {suffix ?? ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Labelled horizontal bar row — kept for the rows where identity (an avatar) leads. */
function BarRow({
  label,
  value,
  max,
  color,
  lead,
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  lead?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded px-1 py-1 text-[12px] ${
        onClick ? 'transition-colors hover:bg-[#F5F7FA]' : 'cursor-default'
      }`}
    >
      {lead}
      <span className="w-[104px] flex-shrink-0 truncate text-left text-[#64748B]">{label}</span>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
        <span
          className="block h-full rounded-full transition-all"
          style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-7 flex-shrink-0 text-right font-semibold tabular-nums text-[#364658]">{value}</span>
    </button>
  );
}

/** Semi-circle SLA gauge — same treatment as the listing's KPI strip. */
function Gauge({ pct }: { pct: number }) {
  const r = 52;
  const len = Math.PI * r;
  const color = pct >= 90 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative h-[78px] w-[124px] flex-shrink-0">
      <svg width="124" height="68" viewBox="0 0 124 68" aria-hidden>
        <path d="M8 62 A52 52 0 0 1 116 62" fill="none" stroke="#E9EEF4" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M8 62 A52 52 0 0 1 116 62"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(len * pct) / 100} ${len}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center leading-none">
        <span className="text-[24px] font-semibold text-[#1E293B] tabular-nums">{pct}</span>
        <span className="text-[12px] font-medium text-[#64748B]">%</span>
        <div className="mt-1 text-[10px] text-[#94A3B8]">SLA met</div>
      </div>
    </div>
  );
}

/* ── The dashboard ──────────────────────────────────────────────────────── */

export function TicketDashboardView({
  tickets,
  onTicketClick,
  onDrillDown,
}: {
  tickets: Ticket[];
  onTicketClick?: (t: Ticket) => void;
  onDrillDown?: (rules: Omit<FilterRule, 'id'>[], label: string) => void;
}) {
  /* Always a bounded window — an unbounded range would mean one column per day for the
     customer's whole history. It opens on the SMALLEST range so the first query the
     dashboard fires is the cheapest one; 15 days is an explicit opt-in. */
  const [flowDays, setFlowDays] = useState(7);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const total = tickets.length;

  if (total === 0) {
    return <div className="px-6 py-16 text-center text-[13px] text-[#94A3B8]">No requests match the current filters.</div>;
  }

  /* Every drill-down names itself so the list can show WHERE the user came from, not just
     that some filter is on. The label is the thing they clicked, in their words. */
  const drill = (rules: Omit<FilterRule, 'id'>[], label: string) =>
    onDrillDown ? () => onDrillDown(rules, label) : undefined;

  /* ── Figures ── */
  const open = tickets.filter(isOpen);
  const resolved = tickets.filter((t) => t.status === 'Completed' || t.status === 'Closed');
  const breached = open.filter((t) => slaToneOf(t) === 'breached');
  const dueSoon = open.filter((t) => slaToneOf(t) === 'due');
  const urgent = open.filter((t) => t.priority === 'Urgent');
  const approvals = tickets.filter((t) => !!t.approval);
  const unread = tickets.filter((t) => (t.unread ?? 0) > 0);
  const unreadTotal = unread.reduce((n, t) => n + (t.unread ?? 0), 0);
  const slaPct = open.length ? Math.round(((open.length - breached.length) / open.length) * 100) : 100;
  const penalty = breached.length * 250;

  const statusSegs: Seg[] = Object.keys(STATUS_COLORS)
    .map((sv) => ({ label: sv, color: STATUS_COLORS[sv], value: tickets.filter((t) => t.status === sv).length }))
    .filter((x) => x.value > 0);

  const prioSegs: Seg[] = Object.keys(PRIORITY_COLORS).map((p) => ({
    label: p,
    color: PRIORITY_COLORS[p],
    value: tickets.filter((t) => t.priority === p).length,
  }));

  const slaSegs: Seg[] = SLA_META.map((m) => ({
    label: m.label,
    color: m.color,
    value: tickets.filter((t) => slaToneOf(t) === m.tone).length,
  }));

  const techMap = new Map<string, { open: number; breached: number; dueToday: number }>();
  const bumpTech = (name: string) => {
    const cur = techMap.get(name) ?? { open: 0, breached: 0, dueToday: 0 };
    techMap.set(name, cur);
    return cur;
  };
  TECHNICIANS.forEach((t) => bumpTech(t.name));
  open.forEach((t) => {
    const cur = bumpTech(t.assignedTo.name || 'Unassigned');
    cur.open += 1;
    if (slaToneOf(t) === 'breached') cur.breached += 1;
    if (slaToneOf(t) === 'due') cur.dueToday += 1;
  });
  const techRows: TechRow[] = [...techMap.entries()].map(([name, v]) => ({
    name,
    initials: initialsOf(name === 'Unassigned' ? 'UA' : name),
    group: groupOfTechnician(name),
    ...v,
  }));
  const techs = [...techMap.entries()].filter(([, v]) => v.open > 0).sort((a, b) => b[1].open - a[1].open);
  const topTechs = techs.slice(0, 6);
  const maxTech = Math.max(...topTechs.map(([, v]) => v.open), 1);


  const deptRows = DEPARTMENTS.map((d) => ({ label: d, value: tickets.filter((t) => deptOf(t) === d).length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const DEPT_TOP = 6;
  const deptTop = deptRows.slice(0, DEPT_TOP);
  const deptRest = deptRows.slice(DEPT_TOP);
  const deptChart = [
    ...deptTop.map((d) => ({ ...d, name: d.label, color: '#3D8BD0' })),
    ...(deptRest.length
      ? [
          {
            label: `Other (${deptRest.length})`,
            name: `Other (${deptRest.length})`,
            value: deptRest.reduce((n, d) => n + d.value, 0),
            color: '#CBD5E1',
            other: true,
          },
        ]
      : []),
  ];

  const sourceSegs: Seg[] = SOURCES.map((sv, i) => ({
    label: sv,
    color: ['#3D8BD0', '#8B5CF6', '#22C55E', '#F59E0B'][i],
    value: tickets.filter((t) => sourceOf(t) === sv).length,
  })).filter((s) => s.value > 0);

  /* Backlog aging — the classic ITSM health check on unresolved work. Buckets come from
     the filter layer so a bar and the list it drills into can never disagree. */
  const agingRows = AGE_BUCKETS.map((a) => ({ ...a, value: open.filter((t) => a.test(ageHoursOf(t))).length }));

  /* Received vs resolved per day — inflow against outflow, the flow chart every
     service-desk dashboard leads with. */
  const dayMap = new Map<string, { label: string; created: number; closed: number; ts: number }>();
  const dayRow = (d: Date) => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = dayMap.get(key);
    if (existing) return existing;
    const r = {
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      created: 0,
      closed: 0,
      ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    };
    dayMap.set(key, r);
    return r;
  };
  tickets.forEach((t) => {
    dayRow(t.createdBy).created += 1;
    if (t.status === 'Completed' || t.status === 'Closed') {
      // Closed 1-4 days after it arrived, so outflow trails inflow instead of mirroring it.
      const done = new Date(t.createdBy);
      done.setDate(done.getDate() + 1 + (hx(t.id, 31) % 4));
      dayRow(done).closed += 1;
    }
  });
  const allDays = [...dayMap.values()].sort((a, b) => a.ts - b.ts);
  const lastTs = allDays.length ? allDays[allDays.length - 1].ts : Date.now();
  const DAY_MS = 86400000;
  const days = Array.from({ length: flowDays }, (_, i) => {
    const ts = lastTs - (flowDays - 1 - i) * DAY_MS;
    const d = new Date(ts);
    return (
      allDays.find((x) => x.ts === ts) ?? {
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        created: 0,
        closed: 0,
        ts,
      }
    );
  });

  /* Performance — mock service metrics in the shape a real desk reports them. */
  const avgResolve = `${2 + (total % 3)}d ${4 + (total % 8)}h`;
  const avgResponse = `${1 + (total % 3)}h ${12 + (total % 40)}m`;
  const fcr = 62 + (total % 12);
  const reopened = Math.max(1, Math.round(resolved.length * 0.06));

  /* Attention list — the unresolved work most at risk, worst first. */
  const atRiskTotal = open.filter((t) => slaToneOf(t) === 'breached' || slaToneOf(t) === 'due').length;
  const atRisk = [...open]
    .filter((t) => slaToneOf(t) === 'breached' || slaToneOf(t) === 'due')
    .sort((a, b) => {
      const rank = (t: Ticket) => (slaToneOf(t) === 'breached' ? 0 : 1);
      return rank(a) - rank(b) || ageHoursOf(b) - ageHoursOf(a);
    })
    .slice(0, 10);

  const requesterMap = new Map<string, number>();
  tickets.forEach((t) => requesterMap.set(t.requester, (requesterMap.get(t.requester) ?? 0) + 1));
  const topRequesters = [...requesterMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxRequester = Math.max(...topRequesters.map(([, v]) => v), 1);

  return (
    <div className="space-y-4 px-6 pb-8 pt-4">
      {/* ── Headline tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Tile
          icon={Inbox}
          color="#3D8BD0"
          label="Open requests"
          value={open.length}
          sub={`${total} total`}
          onClick={drill([{ field: 'status', condition: 'is', values: OPEN_STATES }], 'Open requests')}
          hint="Show unresolved requests in the list"
        />
        <Tile
          icon={AlertTriangle}
          color="#EF4444"
          label="SLA breached"
          value={breached.length}
          sub={`$${penalty.toLocaleString()} exposure`}
          trend={{ pct: '8%', up: true, good: false }}
          onClick={drill([{ field: 'sla', condition: 'is', values: ['Breached'] }], 'SLA breached')}
          hint="Show breached requests"
        />
        <Tile
          icon={Clock}
          color="#F59E0B"
          label="Due today"
          value={dueSoon.length}
          sub="resolution due < 24h"
          onClick={drill([{ field: 'sla', condition: 'is', values: ['Due soon'] }], 'Due today')}
          hint="Show requests due within 24 hours"
        />
        <Tile
          icon={Flame}
          color="#DC2626"
          label="Urgent priority"
          value={urgent.length}
          sub="unresolved"
          trend={{ pct: '4.5%', up: true, good: false }}
          onClick={drill(
            [
              { field: 'priority', condition: 'is', values: ['Urgent'] },
              { field: 'status', condition: 'is', values: OPEN_STATES },
            ],
            'Urgent priority',
          )}
          hint="Show unresolved urgent requests"
        />
        <Tile
          icon={UserCheck}
          color="#8B5CF6"
          label="Pending approval"
          value={approvals.length}
          sub="awaiting approvers"
          onClick={drill([{ field: 'approval', condition: 'is', values: ['Pending approval'] }], 'Pending approval')}
          hint="Show requests awaiting an approver"
        />
        <Tile
          icon={CheckCircle2}
          color="#22C55E"
          label="Resolved"
          value={resolved.length}
          sub={`avg ${avgResolve} to resolve`}
          trend={{ pct: '12%', up: true, good: true }}
          onClick={drill([{ field: 'status', condition: 'is', values: ['Completed', 'Closed'] }], 'Resolved')}
          hint="Show resolved requests"
        />
      </div>

      {/* ── SLA · status · priority ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="SLA compliance" sub={`${open.length} unresolved requests measured`}>
          <div className="flex items-center gap-4">
            <Gauge pct={slaPct} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {slaSegs.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[12px]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-[#64748B]">{s.label}</span>
                  <span className="font-semibold tabular-nums text-[#364658]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-3">
            <div>
              <div className="text-[11px] text-[#94A3B8]">Avg first response</div>
              <div className="text-[14px] font-semibold text-[#1E293B]">{avgResponse}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#94A3B8]">Avg resolution</div>
              <div className="text-[14px] font-semibold text-[#1E293B]">{avgResolve}</div>
            </div>
          </div>
        </Card>

        <Card title="Requests by status" sub="Whole queue">
          <DonutWithLegend
            segs={statusSegs}
            total={total}
            centerLabel="requests"
            onPick={
              onDrillDown
                ? (label) => onDrillDown([{ field: 'status', condition: 'is', values: [label] }], `${label} requests`)
                : undefined
            }
          />
        </Card>

        <Card title="Requests by priority" sub="Whole queue">
          <div className="h-[148px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prioSegs} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }} barSize={16}>
                <CartesianGrid horizontal={false} stroke="#F0F2F5" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={64}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RTooltip cursor={{ fill: '#F8FAFC' }} content={<ChartTip />} />
                <Bar
                  dataKey="value"
                  name="Requests"
                  radius={[0, 4, 4, 0]}
                  onClick={(d: any) =>
                    onDrillDown?.([{ field: 'priority', condition: 'is', values: [d.label] }], `${d.label} priority`)
                  }
                  className={onDrillDown ? 'cursor-pointer' : ''}
                >
                  {prioSegs.map((p) => (
                    <Cell key={p.label} fill={p.color} />
                  ))}
                  <LabelList dataKey="value" position="right" className="fill-[#364658]" style={{ fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-3">
            <div>
              <div className="text-[11px] text-[#94A3B8]">First contact resolution</div>
              <div className="text-[14px] font-semibold text-[#1E293B]">{fcr}%</div>
            </div>
            <div>
              <div className="text-[11px] text-[#94A3B8]">Reopened</div>
              <div className="text-[14px] font-semibold text-[#1E293B]">{reopened}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Technician load · backlog aging · intake source ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Technician workload"
          sub={`Top ${topTechs.length} of ${techRows.length} technicians by open work`}
        >
          <div className="space-y-0.5 pt-1">
            {topTechs.map(([name, v]) => (
              <BarRow
                key={name}
                label={name}
                value={v.open}
                max={maxTech}
                color={v.breached ? '#EF4444' : '#3D8BD0'}
                lead={
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                    {initialsOf(name)}
                  </span>
                }
                onClick={drill(
                  [
                    { field: 'assignedTo', condition: 'is', values: [name] },
                    { field: 'status', condition: 'is', values: OPEN_STATES },
                  ],
                  `Assigned to ${name}`,
                )}
              />
            ))}
          </div>
          <div className="mt-auto border-t border-[#F1F5F9] pt-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-[#64748B]">
                {techRows.length} technicians on the roster
              </span>
              <button
                onClick={() => setRosterOpen(true)}
                className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
              >
                View all
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="mt-1 text-[11px] text-[#94A3B8]">Red bars carry at least one breached request.</div>
          </div>
        </Card>

        <Card title="Backlog aging" sub="How long unresolved work has been open">
          <div className="h-[152px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingRows} margin={{ top: 14, right: 4, bottom: 0, left: -22 }} barSize={38}>
                <CartesianGrid vertical={false} stroke="#F0F2F5" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#7B8FA5' }}
                  axisLine={{ stroke: '#EEF1F4' }}
                  tickLine={false}
                />
                <RTooltip cursor={{ fill: '#F8FAFC' }} content={<ChartTip />} />
                <Bar
                  dataKey="value"
                  name="Requests"
                  radius={[4, 4, 0, 0]}
                  /* The bar counts OPEN work, so the drill has to carry the same status
                     constraint — an age filter on its own would pull in closed requests. */
                  onClick={(d: any) =>
                    onDrillDown?.(
                      [
                        { field: 'age', condition: 'is', values: [d.label] },
                        { field: 'status', condition: 'is', values: OPEN_STATES },
                      ],
                      `Open ${d.label}`,
                    )
                  }
                  className={onDrillDown ? 'cursor-pointer' : ''}
                >
                  {agingRows.map((a) => (
                    <Cell key={a.label} fill={a.color} />
                  ))}
                  <LabelList dataKey="value" position="top" className="fill-[#364658]" style={{ fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2.5 flex items-center gap-2 border-t border-[#F1F5F9] pt-2.5">
            <Timer size={13} className="flex-shrink-0 text-[#94A3B8]" />
            <span className="text-[11px] text-[#64748B]">
              <span className="font-semibold text-[#B45309]">{agingRows[3].value}</span> requests older than a week
            </span>
          </div>
        </Card>

        <Card title="Requests by source" sub="How the desk is being reached">
          <DonutWithLegend segs={sourceSegs} total={total} centerLabel="requests" />
        </Card>
      </div>

      {/* ── Flow ── */}
      <Card
        title="Received vs resolved"
        sub={`Daily inflow against outflow · last ${flowDays} days`}
        action={
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="hidden items-center gap-3 text-[11px] text-[#64748B] sm:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#3D8BD0]" />
                Received
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#22C55E]" />
                Resolved
              </span>
            </span>
            <div className="flex items-center rounded border border-[#DFE5ED] p-0.5">
              {[7, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setFlowDays(n)}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    flowDays === n ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#64748B] hover:bg-[#F5F7FA]'
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="dashResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F0F2F5" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fontSize: 10, fill: '#7B8FA5' }}
                axisLine={{ stroke: '#EEF1F4' }}
                tickLine={false}
              />
              <RTooltip cursor={{ fill: '#F8FAFC' }} content={<ChartTip />} />
              <Bar dataKey="created" name="Received" fill="#3D8BD0" radius={[4, 4, 0, 0]} barSize={22} />
              <Area
                type="monotone"
                dataKey="closed"
                name="Resolved"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#dashResolved)"
                dot={{ r: 3, fill: '#22C55E', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Attention list · department split · top requesters ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Needs attention"
          sub={`Breached and due-soon requests, worst first · showing ${atRisk.length} of ${atRiskTotal}`}
          className="lg:col-span-2"
          action={
            onDrillDown && (
              <button
                onClick={() => onDrillDown([{ field: 'sla', condition: 'is', values: ['Breached', 'Due soon'] }], 'Needs attention')}
                className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
              >
                View all
                <ChevronRight size={13} />
              </button>
            )
          }
        >
          {atRisk.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[#94A3B8]">Nothing at risk right now.</div>
          ) : (
            <div className="-mx-4 -mb-4 overflow-x-auto">
              <table className="w-full min-w-[620px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[92px]" />
                  <col />
                  <col className="w-[160px]" />
                  <col className="w-[112px]" />
                  <col className="w-[104px]" />
                </colgroup>
                <thead>
                  {/* Same header treatment as the listing grid: white, one hairline UNDER the
                      row. The old banded top-and-bottom rule read as a separate box floating
                      inside the card. */}
                  <tr>
                    {[
                      { k: 'id', label: 'ID', cls: 'pl-4 pr-3' },
                      { k: 'subject', label: 'Subject', cls: 'px-3' },
                      { k: 'assignee', label: 'Assigned to', cls: 'px-3' },
                      { k: 'priority', label: 'Priority', cls: 'px-3' },
                      { k: 'sla', label: 'SLA status', cls: 'pl-3 pr-4' },
                    ].map((c) => (
                      <th
                        key={c.k}
                        className={`${c.cls} whitespace-nowrap bg-white py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B] shadow-[inset_0_-1px_0_#E5E7EB]`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((t) => (
                    <tr
                      key={t.id}
                      onClick={onTicketClick ? () => onTicketClick(t) : undefined}
                      className="group cursor-pointer border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F9FAFB]"
                    >
                      <td className="py-2.5 pl-4 pr-3">
                        <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                      </td>
                      <td className="overflow-hidden px-3 py-2.5">
                        <span className="block truncate text-[12px] font-medium text-[#364658] decoration-[#94A3B8] decoration-dotted underline-offset-[3px] group-hover:underline">
                          {t.subject}
                        </span>
                      </td>
                      <td className="overflow-hidden px-3 py-2.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                            {t.assignedTo.initials}
                          </span>
                          <span className="min-w-0 truncate text-[12px] text-[#4A5568]">{t.assignedTo.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#4A5568]">
                          <span className="size-2 flex-shrink-0 rounded-full" style={{ background: PRIORITY_COLORS[t.priority] }} />
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 pr-4">
                        <SlaPill ticket={t} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card
            title="Requests by department"
            sub={
              deptRest.length
                ? `Top ${DEPT_TOP} of ${deptRows.length} departments`
                : 'Where the work comes from'
            }
          >
            <div className="h-[204px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChart} layout="vertical" margin={{ top: 4, right: 26, bottom: 0, left: 0 }} barSize={14}>
                  <CartesianGrid horizontal={false} stroke="#F0F2F5" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={116}
                    interval={0}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip cursor={{ fill: '#F8FAFC' }} content={<ChartTip />} />
                  <Bar
                    dataKey="value"
                    name="Requests"
                    radius={[0, 4, 4, 0]}
                    onClick={(d: any) =>
                      d.other
                        ? setDeptOpen(true)
                        : onDrillDown?.([{ field: 'department', condition: 'is', values: [d.label] }], `${d.label} department`)
                    }
                    className={onDrillDown ? 'cursor-pointer' : ''}
                  >
                    {deptChart.map((d) => (
                      <Cell key={d.label} fill={(d as any).other ? '#CBD5E1' : '#3D8BD0'} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-[#364658]"
                      style={{ fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto flex items-center gap-2 border-t border-[#F1F5F9] pt-2.5">
              <span className="min-w-0 flex-1 truncate text-[11px] text-[#64748B]">
                {deptRows.length} departments raising requests
              </span>
              <button
                onClick={() => setDeptOpen(true)}
                className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
              >
                View all
                <ChevronRight size={13} />
              </button>
            </div>
          </Card>

          <Card title="Top requesters" sub="Most requests raised">
            <div className="space-y-0.5 pt-1">
              {topRequesters.map(([name, count]) => (
                <BarRow
                  key={name}
                  label={name}
                  value={count}
                  max={maxRequester}
                  color="#E67E22"
                  lead={
                    <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#E67E22] text-[9px] font-semibold text-white">
                      {initialsOf(name)}
                    </span>
                  }
                  onClick={drill([{ field: 'requester', condition: 'is', values: [name] }], `Raised by ${name}`)}
                />
              ))}
            </div>
          </Card>

          <Card title="Conversation backlog" sub="Replies waiting on the desk">
            <div className="flex items-center gap-3">
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF]">
                <MessageSquare size={17} className="text-[#3D8BD0]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[20px] font-semibold leading-6 text-[#1E293B] tabular-nums">{unreadTotal}</div>
                <div className="text-[11px] text-[#94A3B8]">unread across {unread.length} requests</div>
              </div>
              {onDrillDown && (
                <button
                  onClick={() => onDrillDown([{ field: 'unread', condition: 'is', values: ['Has unread'] }], 'Unread replies')}
                  className="inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
                >
                  Open
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {rosterOpen && (
        <TechnicianWorkloadPanel
          rows={techRows}
          onClose={() => setRosterOpen(false)}
          onPick={(name) => {
            setRosterOpen(false);
            onDrillDown?.(
              [
                { field: 'assignedTo', condition: 'is', values: [name] },
                { field: 'status', condition: 'is', values: OPEN_STATES },
              ],
              `Assigned to ${name}`,
            );
          }}
        />
      )}

      {deptOpen && (
        <BreakdownPanel
          title="Requests by department"
          subject="departments"
          columnLabel="Department"
          rows={deptRows}
          onClose={() => setDeptOpen(false)}
          onPick={(label) => {
            setDeptOpen(false);
            onDrillDown?.([{ field: 'department', condition: 'is', values: [label] }], `${label} department`);
          }}
        />
      )}
    </div>
  );
}
