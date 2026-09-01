import { useState } from 'react';
import { MessageSquare, ListChecks, UserCheck } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { DueByPill, slaInfoOf } from './TicketTable';

/* Kanban view of the same requests the grid shows. Columns come from the chosen group
   field; a card can be dragged to another column to change that field, which is the whole
   point of a board — triage by moving, not by opening each record. */

export type KanbanGroup = 'status' | 'priority' | 'assignedTo' | 'requester' | 'sla';

export const KANBAN_GROUPS: { key: KanbanGroup; label: string }[] = [
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'sla', label: 'SLA Status' },
];

const STATUS_ORDER = ['Open', 'In Progress', 'Pending', 'Completed', 'Closed', 'Cancelled'];
const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'];
const SLA_ORDER = ['Breached', 'Due soon', 'On track', 'Met'];

const DOT: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#3D8BD0',
  Pending: '#fb923c',
  Completed: '#22c55e',
  Closed: '#6b7280',
  Cancelled: '#ef4444',
  Low: '#22c55e',
  Medium: '#fb923c',
  High: '#ef4444',
  Urgent: '#dc2626',
  Breached: '#ef4444',
  'Due soon': '#f59e0b',
  'On track': '#22c55e',
  Met: '#94a3b8',
};

const slaLabelOf = (t: Ticket) => {
  const tone = slaInfoOf(t).tone;
  return tone === 'breached' ? 'Breached' : tone === 'due' ? 'Due soon' : tone === 'done' ? 'Met' : 'On track';
};

const PEOPLE_GROUP = (g: KanbanGroup) => g === 'assignedTo' || g === 'requester';
const AVATAR_BG = (g: KanbanGroup) => (g === 'requester' ? '#E67E22' : '#3D8BD0');

const groupValue = (t: Ticket, g: KanbanGroup) =>
  g === 'assignedTo' ? t.assignedTo.name : g === 'sla' ? slaLabelOf(t) : (t[g] as string);

const initialsOf = (name: string) => {
  const p = name.split(' ').filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
};


export function TicketKanban({
  tickets,
  group,
  onTicketClick,
  onUpdateTicket,
}: {
  tickets: Ticket[];
  group: KanbanGroup;
  onTicketClick: (t: Ticket) => void;
  onUpdateTicket?: (id: string, patch: Partial<Ticket>) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // Column set: a fixed lifecycle order where one exists, otherwise the values present.
  const present = Array.from(new Set(tickets.map((t) => groupValue(t, group))));
  const order =
    group === 'status' ? STATUS_ORDER : group === 'priority' ? PRIORITY_ORDER : group === 'sla' ? SLA_ORDER : null;
  const columns = order ? order.filter((v) => present.includes(v)) : present.sort((a, b) => a.localeCompare(b));

  // Only fields the card actually owns can be set by dropping.
  const canDrop = group === 'status' || group === 'priority' || group === 'assignedTo';

  const drop = (col: string) => {
    setOverCol(null);
    if (!dragId || !canDrop || !onUpdateTicket) return;
    const t = tickets.find((x) => x.id === dragId);
    setDragId(null);
    if (!t || groupValue(t, group) === col) return;
    if (group === 'assignedTo') {
      onUpdateTicket(t.id, { assignedTo: { name: col, initials: initialsOf(col) } });
    } else {
      onUpdateTicket(t.id, { [group]: col } as Partial<Ticket>);
    }
  };

  return (
    <div className="flex h-full gap-5 overflow-x-auto bg-[#F7F9FC] px-6 pb-4 pt-4">
      {columns.map((col) => {
        const cards = tickets.filter((t) => groupValue(t, group) === col);
        const isOver = overCol === col && canDrop;
        return (
          <div
            key={col}
            onDragOver={(e) => {
              if (!canDrop) return;
              e.preventDefault();
              setOverCol(col);
            }}
            onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
            onDrop={() => drop(col)}
            className="flex w-[388px] flex-shrink-0 flex-col"
          >
            {/* Column header — the value, its count, and nothing else. */}
            <div className="flex items-center gap-2 pb-2.5">
              {PEOPLE_GROUP(group) ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                    style={{ background: AVATAR_BG(group) }}
                  >
                    {initialsOf(col)}
                  </span>
                  <span className="max-w-[240px] truncate text-[12px] font-semibold text-[#364658]">{col}</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-semibold"
                  style={{ background: `${DOT[col] ?? '#94A3B8'}1A`, color: '#364658' }}
                >
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[col] ?? '#94A3B8' }} />
                  <span className="max-w-[220px] truncate">{col}</span>
                </span>
              )}
              <span className="text-[12px] font-medium tabular-nums text-[#94A3B8]">{cards.length}</span>
            </div>

            <div
              className={`flex-1 space-y-2.5 overflow-y-auto rounded-lg border-2 border-dashed p-1 transition-colors ${
                isOver ? 'border-[#3D8BD0] bg-[#EBF5FF]/60' : 'border-transparent'
              }`}
            >
              {cards.map((t) => {
                const sla = slaInfoOf(t);
                const done = t.tasksDone ?? 0;
                const total = t.tasksTotal ?? 0;
                return (
                  <div
                    key={t.id}
                    draggable={canDrop}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onTicketClick(t)}
                    className={`cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:border-[#C9D4E0] hover:shadow-[0_3px_10px_rgba(16,24,40,0.08)] ${
                      dragId === t.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                      <span className="ml-auto">
                        <DueByPill tone={sla.tone} label={sla.label} />
                      </span>
                    </div>

                    <div className={`mt-1.5 line-clamp-2 text-[13px] text-[#364658] ${(t.unread ?? 0) > 0 ? 'font-semibold' : 'font-medium'}`}>
                      {t.subject}
                    </div>

                    {/* Row intelligence, same signals the grid's subject cell carries. */}
                    {((t.unread ?? 0) > 0 || t.approval || total > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {(t.unread ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">
                            <MessageSquare size={11} />
                            {t.unread} new
                          </span>
                        )}
                        {t.approval && (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-medium text-[#B45309]">
                            <UserCheck size={11} />
                            Approval
                          </span>
                        )}
                        {total > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                              done === total ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            <ListChecks size={11} />
                            {done}/{total}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center gap-2 border-t border-[#F1F5F9] pt-2">
                      {group === 'assignedTo' ? (
                        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
                          <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[t.status] }} />
                          <span className="truncate text-[12px] text-[#64748B]">{t.status}</span>
                        </span>
                      ) : (
                        <>
                          <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                            {t.assignedTo.initials}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[12px] text-[#64748B]">{t.assignedTo.name}</span>
                        </>
                      )}
                      {group !== 'priority' && (
                        <span
                          className="inline-flex flex-shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                          style={{ background: `${DOT[t.priority]}1A`, color: DOT[t.priority] }}
                        >
                          <span className="size-1.5 rounded-full" style={{ background: DOT[t.priority] }} />
                          {t.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#DFE5ED] bg-white/50 py-7 text-center text-[12px] text-[#94A3B8]">
                  {canDrop ? 'Drop a request here' : 'No requests'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
