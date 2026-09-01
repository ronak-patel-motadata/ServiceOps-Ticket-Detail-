import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { slaToneOf } from './TicketTable';
import type { FilterRule } from './TicketFilterBar';

/* KPI strip above the ticket listing — the numbers a service-desk lead scans before
   touching a single row, ordered by urgency: workload → SLA risk → money at stake →
   things waiting on people → flow. Every countable value derives from the SAME ticket
   set the grid renders (and the grid's own SLA rule), so strip and table always agree.
   The row scrolls horizontally; on ultra-wide screens the cards stretch to fill. */

const isOpen = (t: Ticket) => t.status !== 'Closed' && t.status !== 'Completed' && t.status !== 'Cancelled';

/** Semi-circle gauge — SLA compliance at a glance, colour-graded like the SLA pills. */
function SlaGauge({ pct }: { pct: number }) {
  const r = 42;
  const len = Math.PI * r;
  const color = pct >= 90 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative h-[62px] w-[96px] flex-shrink-0">
      <svg width="96" height="54" viewBox="0 0 96 54" aria-hidden>
        <path d="M6 50 A42 42 0 0 1 90 50" fill="none" stroke="#E5E7EB" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M6 50 A42 42 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(len * pct) / 100} ${len}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center leading-none">
        <span className="text-[18px] font-semibold text-[#1E293B] tabular-nums">{pct}</span>
        <span className="text-[11px] font-medium text-[#64748B]">%</span>
        <div className="mt-1 text-[10px] text-[#94A3B8]">SLA met</div>
      </div>
    </div>
  );
}

/** Small week-over-week movement chip. `good` says whether the direction helps the desk. */
function Trend({ pct, up, good }: { pct: string; up: boolean; good: boolean }) {
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${good ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
      {pct}
      <Icon size={11} />
    </span>
  );
}

/** A card's filter, minus the ids the bar assigns when it is applied. */
type CardFilter = Omit<FilterRule, 'id'>[];
const OPEN_STATES = ['Open', 'In Progress', 'Pending'];

/** True when the bar is currently showing exactly this card's filter. */
const isApplied = (rules: FilterRule[], label: string, card?: CardFilter) =>
  !!card &&
  rules.length === card.length &&
  card.every((c, i) =>
    rules[i].id.startsWith(`kpi-${label}-`) &&
    rules[i].field === c.field &&
    rules[i].condition === c.condition &&
    rules[i].values.length === c.values.length &&
    c.values.every((v) => rules[i].values.includes(v)),
  );

export function TicketStatsRow({
  tickets,
  rules,
  onApplyFilter,
}: {
  tickets: Ticket[];
  rules: FilterRule[];
  onApplyFilter: (rules: FilterRule[]) => void;
}) {
  const open = tickets.filter(isOpen);
  const openOnly = tickets.filter((t) => t.status === 'Open');
  const closed = tickets.length - open.length;
  const breached = open.filter((t) => slaToneOf(t) === 'breached').length;
  const dueSoon = open.filter((t) => slaToneOf(t) === 'due').length;
  const slaPct = open.length ? Math.round(((open.length - breached) / open.length) * 100) : 100;
  const pendingApproval = open.filter((t) => t.approval).length;
  const waitingRequester = open.filter((t) => t.status === 'Pending').length;
  const unreadRows = tickets.filter((t) => (t.unread ?? 0) > 0);
  const unreadTotal = unreadRows.reduce((n, t) => n + (t.unread ?? 0), 0);
  const taskRows = open.filter((t) => (t.tasksTotal ?? 0) - (t.tasksDone ?? 0) > 0);
  const openTasks = taskRows.reduce((n, t) => n + ((t.tasksTotal ?? 0) - (t.tasksDone ?? 0)), 0);
  const urgent = open.filter((t) => t.priority === 'Urgent').length;
  // The detail page's SLA penalty model: a breached request carries a $250 penalty.
  const penalty = breached * 250;

  const label = 'text-[12px] text-[#64748B] whitespace-nowrap';
  const valueCls = 'mt-1 text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums';
  const subCls = 'text-[12px] text-[#94A3B8] whitespace-nowrap';

  /* Declarative cards keep ten KPIs readable; `wide`/`gauge`/`trend` are the only specials. */
  const cards: {
    label: string;
    value: string | number;
    sub: React.ReactNode;
    trend?: { pct: string; up: boolean; good: boolean };
    gauge?: number;
    wide?: boolean;
    filter?: CardFilter;
    hint?: string;
  }[] = [
    {
      label: 'Open requests',
      value: openOnly.length,
      sub: `${open.length} unresolved · ${tickets.length} total`,
      filter: [{ field: 'status', condition: 'is', values: ['Open'] }],
      hint: 'Show requests with status Open',
    },
    {
      label: 'SLA compliance',
      value: open.length - breached,
      sub: (
        <>
          <span className={breached ? 'text-[#EF4444]' : ''}>{breached} breached</span> · {dueSoon} due soon
        </>
      ),
      gauge: slaPct,
      wide: true,
      filter: [{ field: 'sla', condition: 'is', values: ['Breached'] }],
      hint: 'Show breached requests',
    },
    {
      label: 'Due today',
      value: dueSoon,
      sub: <span className="text-[#B45309]">resolution due &lt; 24h</span>,
      filter: [{ field: 'sla', condition: 'is', values: ['Due soon'] }],
      hint: 'Show requests due within 24 hours',
    },
    {
      label: 'Penalty exposure',
      value: `$${penalty.toLocaleString()}`,
      sub: `${breached} breached × $250`,
      trend: { pct: '8%', up: true, good: false },
      filter: [{ field: 'sla', condition: 'is', values: ['Breached'] }],
      hint: 'Show the breached requests carrying a penalty',
    },
    {
      label: 'Urgent priority',
      value: urgent,
      sub: 'vs last week',
      trend: { pct: '4.5%', up: true, good: false },
      filter: [
        { field: 'priority', condition: 'is', values: ['Urgent'] },
        { field: 'status', condition: 'is', values: OPEN_STATES },
      ],
      hint: 'Show unresolved urgent requests',
    },
    {
      label: 'Pending approval',
      value: pendingApproval,
      sub: 'awaiting approvers',
      filter: [{ field: 'approval', condition: 'is', values: ['Pending approval'] }],
      hint: 'Show requests awaiting an approver',
    },
    {
      label: 'Waiting on requester',
      value: waitingRequester,
      sub: 'no reply yet',
      filter: [{ field: 'status', condition: 'is', values: ['Pending'] }],
      hint: 'Show requests waiting on the requester',
    },
    {
      label: 'Unread updates',
      value: unreadTotal,
      sub: `across ${unreadRows.length} requests`,
      filter: [{ field: 'unread', condition: 'is', values: ['Has unread'] }],
      hint: 'Show requests with unread replies',
    },
    {
      label: 'Open tasks',
      value: openTasks,
      sub: `in ${taskRows.length} requests`,
      filter: [
        { field: 'openTasks', condition: 'is', values: ['Has open tasks'] },
        { field: 'status', condition: 'is', values: OPEN_STATES },
      ],
      hint: 'Show unresolved requests with open tasks',
    },
    // Flow: how much is leaving the queue and how fast (resolution avg from the detail page).
    {
      label: 'Resolved',
      value: closed,
      sub: 'avg 4d 11h to resolve',
      trend: { pct: '12%', up: true, good: true },
      filter: [{ field: 'status', condition: 'is', values: ['Completed', 'Closed'] }],
      hint: 'Show resolved and closed requests',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 pl-6 pr-4">
      {cards.map((c) => {
        const on = isApplied(rules, c.label, c.filter);
        return (
        <div
          key={c.label}
          role={c.filter ? 'button' : undefined}
          tabIndex={c.filter ? 0 : undefined}
          title={c.filter ? (on ? 'Showing this view — click to clear' : c.hint) : undefined}
          onClick={() => c.filter && onApplyFilter(on ? [] : c.filter.map((r, i) => ({ ...r, id: `kpi-${c.label}-${i}` })))}
          onKeyDown={(e) => {
            if (c.filter && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onApplyFilter(on ? [] : c.filter.map((r, i) => ({ ...r, id: `kpi-${c.label}-${i}` })));
            }
          }}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
            c.wide ? 'flex-[1_0_268px]' : 'flex-[1_0_196px]'
          } ${
            on
              ? 'border-[#3D8BD0] bg-[#F5FAFF] shadow-[0_1px_3px_rgba(61,139,208,0.15)]'
              : 'border-[#E5E7EB] bg-white'
          } ${c.filter ? 'cursor-pointer hover:border-[#C9D4E0] hover:shadow-sm' : ''}`}
        >
          <div>
            <div className={label}>{c.label}</div>
            {c.trend ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums">{c.value}</span>
                <Trend {...c.trend} />
              </div>
            ) : (
              <div className={valueCls}>{c.value}</div>
            )}
            <div className={subCls}>{c.sub}</div>
          </div>
          {c.gauge !== undefined && <SlaGauge pct={c.gauge} />}
        </div>
        );
      })}
    </div>
  );
}
