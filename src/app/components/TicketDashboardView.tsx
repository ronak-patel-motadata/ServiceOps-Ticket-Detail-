import { slaToneOf } from './TicketTable';
import type { Ticket } from './TicketListPage';

/* Dashboard layout of the same request pool — pure-CSS charts (no chart lib in the
   listing bundle): status bars, priority + SLA donuts, technician load, daily volume.
   Everything derives live from the filtered ticket set, so filters shape the dashboard
   exactly like they shape the grid. */

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

interface Seg {
  label: string;
  color: string;
  value: number;
}

function Card({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-[#DFE5ED] bg-white p-4 ${className}`}>
      <div className="mb-3 text-[13px] font-semibold text-[#1E293B]">{title}</div>
      {children}
    </div>
  );
}

function Donut({ segs, total, centerLabel }: { segs: Seg[]; total: number; centerLabel: string }) {
  let acc = 0;
  const stops = segs
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = (acc / total) * 360;
      acc += s.value;
      return `${s.color} ${from}deg ${(acc / total) * 360}deg`;
    })
    .join(', ');
  return (
    <div
      className="relative size-[120px] flex-shrink-0 rounded-full"
      style={{ background: total > 0 ? `conic-gradient(${stops})` : '#F1F5F9' }}
    >
      <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-white">
        <span className="text-[20px] font-semibold leading-none text-[#1E293B]">{total}</span>
        <span className="mt-1 text-[10px] text-[#7B8FA5]">{centerLabel}</span>
      </div>
    </div>
  );
}

function Legend({ segs, total }: { segs: Seg[]; total: number }) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      {segs.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="min-w-0 flex-1 truncate text-[#64748B]">{s.label}</span>
          <span className="font-semibold text-[#364658]">{s.value}</span>
          <span className="w-9 text-right text-[11px] text-[#94A3B8]">{total ? Math.round((s.value / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

const initialsOf = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function TicketDashboardView({ tickets }: { tickets: Ticket[] }) {
  const total = tickets.length;

  const statusSegs: Seg[] = Object.keys(STATUS_COLORS)
    .map((sv) => ({ label: sv, color: STATUS_COLORS[sv], value: tickets.filter((t) => t.status === sv).length }))
    .filter((x) => x.value > 0);
  const maxStatus = Math.max(...statusSegs.map((x) => x.value), 1);

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

  const techMap = new Map<string, number>();
  tickets.forEach((t) => {
    const n = t.assignedTo.name || 'Unassigned';
    techMap.set(n, (techMap.get(n) ?? 0) + 1);
  });
  const techs = [...techMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTech = Math.max(...techs.map(([, v]) => v), 1);

  const dayMap = new Map<string, { label: string; value: number; ts: number }>();
  tickets.forEach((t) => {
    const d = t.createdBy;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const cur = dayMap.get(key);
    if (cur) cur.value += 1;
    else
      dayMap.set(key, {
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        value: 1,
        ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
      });
  });
  const days = [...dayMap.values()].sort((a, b) => a.ts - b.ts);
  const maxDay = Math.max(...days.map((d) => d.value), 1);

  if (total === 0) {
    return <div className="px-6 py-16 text-center text-[13px] text-[#94A3B8]">No requests match the current filters.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 px-6 pb-6 pt-4">
      <Card title="Requests by status">
        <div className="space-y-2.5">
          {statusSegs.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 text-[12px]">
              <span className="w-[84px] flex-shrink-0 truncate text-[#64748B]">{s.label}</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                <div className="h-full rounded-full" style={{ width: `${(s.value / maxStatus) * 100}%`, backgroundColor: s.color }} />
              </div>
              <span className="w-6 flex-shrink-0 text-right font-semibold text-[#364658]">{s.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Priority mix">
        <div className="flex items-center gap-5">
          <Donut segs={prioSegs} total={total} centerLabel="requests" />
          <Legend segs={prioSegs} total={total} />
        </div>
      </Card>

      <Card title="SLA health">
        <div className="flex items-center gap-5">
          <Donut segs={slaSegs} total={total} centerLabel="requests" />
          <Legend segs={slaSegs} total={total} />
        </div>
      </Card>

      <Card title="Technician workload">
        <div className="space-y-2">
          {techs.map(([name, value]) => (
            <div key={name} className="flex items-center gap-2 text-[12px]">
              <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                {initialsOf(name)}
              </span>
              <span className="w-[104px] flex-shrink-0 truncate text-[#64748B]">{name}</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                <div className="h-full rounded-full bg-[#3D8BD0]" style={{ width: `${(value / maxTech) * 100}%` }} />
              </div>
              <span className="w-6 flex-shrink-0 text-right font-semibold text-[#364658]">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Requests created per day" className="col-span-2">
        <div className="flex h-[132px] items-end gap-2">
          {days.map((d) => (
            <div key={d.ts} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 self-stretch">
              <span className="text-[11px] font-semibold text-[#364658]">{d.value}</span>
              <div className="w-full max-w-[44px] rounded-t bg-[#3D8BD0]/80" style={{ height: `${(d.value / maxDay) * 84}px` }} />
              <span className="text-[10px] text-[#7B8FA5]">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
