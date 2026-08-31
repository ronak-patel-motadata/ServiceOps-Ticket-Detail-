import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { slaToneOf } from './TicketTable';

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

export function TicketStatsRow({ tickets }: { tickets: Ticket[] }) {
  const open = tickets.filter(isOpen);
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
  }[] = [
    { label: 'Open requests', value: open.length, sub: `${tickets.length} total` },
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
    },
    {
      label: 'Due today',
      value: dueSoon,
      sub: <span className="text-[#B45309]">resolution due &lt; 24h</span>,
    },
    {
      label: 'Penalty exposure',
      value: `$${penalty.toLocaleString()}`,
      sub: `${breached} breached × $250`,
      trend: { pct: '8%', up: true, good: false },
    },
    { label: 'Urgent priority', value: urgent, sub: 'vs last week', trend: { pct: '4.5%', up: true, good: false } },
    { label: 'Pending approval', value: pendingApproval, sub: 'awaiting approvers' },
    { label: 'Waiting on requester', value: waitingRequester, sub: 'no reply yet' },
    { label: 'Unread updates', value: unreadTotal, sub: `across ${unreadRows.length} requests` },
    { label: 'Open tasks', value: openTasks, sub: `in ${taskRows.length} requests` },
    // Flow: how much is leaving the queue and how fast (resolution avg from the detail page).
    { label: 'Resolved', value: closed, sub: 'avg 4d 11h to resolve', trend: { pct: '12%', up: true, good: true } },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 pl-6 pr-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 ${
            c.wide ? 'flex-[1_0_268px]' : 'flex-[1_0_196px]'
          }`}
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
      ))}
    </div>
  );
}
