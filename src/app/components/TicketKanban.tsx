import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, MessageSquare, ListChecks, UserCheck, X } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { slaInfoOf, SlaPill } from './TicketTable';
import { describeSubject, descriptionImageAfter, fullDescriptionFor } from './requestDescriptions';
import { DescriptionInlineImage } from './DescriptionInlineImage';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

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

/** Tinted value chip — one shape for status and priority so slots stay interchangeable. */
/** Wraps any card element with the standard tooltip. */
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function ValueChip({ label, color, big, tip }: { label: string; color: string; big?: boolean; tip?: string }) {
  const chip = (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1 font-medium ${big ? 'rounded px-2 py-0.5 text-[12px]' : 'rounded-sm px-1.5 py-0.5 text-[11px]'}`}
      style={{ background: `${color}1A`, color }}
    >
      <span className={big ? 'size-2 rounded-full' : 'size-1.5 rounded-full'} style={{ background: color }} />
      {label}
    </span>
  );
  return tip ? <Tip text={tip}>{chip}</Tip> : chip;
}
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
  // Full-description popup (opened from the hover expand on a card).
  const [descTicket, setDescTicket] = useState<Ticket | null>(null);
  useEffect(() => {
    if (!descTicket) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDescTicket(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [descTicket]);

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
    <div className="w-max min-w-full pb-6 pl-6 pr-4">
      <div className="flex min-h-full gap-5 rounded-lg bg-[#FAFBFC] px-5 pb-5">
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
            <div className="sticky top-[var(--tb,0px)] z-20 flex items-center gap-2 bg-[#FAFBFC] px-3 pb-2.5 pt-4">
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
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#364658]">
                  <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[col] ?? '#94A3B8' }} />
                  <span className="max-w-[240px] truncate">{col}</span>
                </span>
              )}
              <span className="text-[12px] font-medium tabular-nums text-[#94A3B8]">{cards.length}</span>
            </div>

            <div
              className={`flex-1 space-y-2.5 rounded-lg border-2 border-dashed p-1 transition-colors ${
                isOver ? 'border-[#3D8BD0] bg-[#EBF5FF]/60' : 'border-transparent'
              }`}
            >
              {cards.map((t) => {
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
                    className={`group/card cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:border-[#C9D4E0] hover:shadow-[0_3px_10px_rgba(16,24,40,0.08)] ${
                      dragId === t.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tip text={`${t.id} · raised by ${t.requester}`}>
                        <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                      </Tip>
                      <span className="ml-auto">
                        {group === 'sla' ? (
                          <ValueChip label={t.status} color={DOT[t.status] ?? '#94A3B8'} big tip={`Status: ${t.status}`} />
                        ) : (
                          <SlaPill ticket={t} />
                        )}
                      </span>
                    </div>

                    <div className={`mt-1.5 line-clamp-2 text-[13px] text-[#364658] ${(t.unread ?? 0) > 0 ? 'font-semibold' : 'font-medium'}`}>
                      {t.subject}
                    </div>

                    {/* Same themed description the quick peek shows — two quiet lines. */}
                    <div className="relative">
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#64748B]">{describeSubject(t.subject).short}</p>
                      <Tip text="View full description">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDescTicket(t);
                          }}
                          className="absolute -bottom-0.5 right-0 hidden size-6 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] shadow-sm transition-colors hover:bg-[#F5F7FA] hover:text-[#364658] group-hover/card:flex"
                        >
                          <Maximize2 size={11} />
                        </button>
                      </Tip>
                    </div>

                    {/* Row intelligence, same signals the grid's subject cell carries. */}
                    {((t.unread ?? 0) > 0 || t.approval || total > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {(t.unread ?? 0) > 0 && (
                          <Tip text={`${t.unread} unread ${t.unread === 1 ? 'reply' : 'replies'}${t.lastMsg ? ` from ${t.lastMsg.from}` : ''}`}>
                            <span className="inline-flex items-center gap-1 rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">
                              <MessageSquare size={11} />
                              {t.unread} new
                            </span>
                          </Tip>
                        )}
                        {t.approval && (
                          <Tip
                            text={`Waiting on ${t.approval.approver} · Level ${t.approval.level} of ${t.approval.totalLevels} · ${t.approval.waiting}`}
                          >
                            <span className="inline-flex items-center gap-1 rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-medium text-[#B45309]">
                              <UserCheck size={11} />
                              Approval
                            </span>
                          </Tip>
                        )}
                        {total > 0 && (
                          <Tip text={`${done} of ${total} tasks completed`}>
                            <span
                              className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                                done === total ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                            >
                              <ListChecks size={11} />
                              {done}/{total}
                            </span>
                          </Tip>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center gap-2 border-t border-[#F1F5F9] pt-2">
                      {group === 'assignedTo' ? (
                        <Tip text={`Status: ${t.status}`}>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ background: DOT[t.status] }} />
                            <span className="truncate text-[12px] text-[#64748B]">{t.status}</span>
                          </span>
                        </Tip>
                      ) : (
                        <Tip text={`Assigned to ${t.assignedTo.name}`}>
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                              {t.assignedTo.initials}
                            </span>
                            <span className="min-w-0 truncate text-[12px] text-[#64748B]">{t.assignedTo.name}</span>
                          </span>
                        </Tip>
                      )}
                      <span className="ml-auto flex flex-shrink-0 items-center">
                        {group === 'priority' ? (
                          <ValueChip label={t.status} color={DOT[t.status] ?? '#94A3B8'} tip={`Status: ${t.status}`} />
                        ) : (
                          <ValueChip label={t.priority} color={DOT[t.priority]} tip={`Priority: ${t.priority}`} />
                        )}
                      </span>
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
      {descTicket &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDescTicket(null);
            }}
          >
            <div className="w-[560px] max-w-full overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[#F0F2F5] px-5 py-4">
                <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{descTicket.id}</span>
                <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#1E293B]">{descTicket.subject}</h3>
                <button
                  onClick={() => setDescTicket(null)}
                  className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
                >
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Description</div>
                <div className="space-y-3">
                  {fullDescriptionFor(descTicket.id, descTicket.subject).map((p, i) => (
                    <Fragment key={i}>
                      <p className="text-[13px] leading-relaxed text-[#364658]">{p}</p>
                      {i === descriptionImageAfter(descTicket.id) && <DescriptionInlineImage />}
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#F0F2F5] px-5 py-3">
                <button
                  onClick={() => setDescTicket(null)}
                  className="rounded border border-[#DFE5ED] px-3 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onTicketClick(descTicket);
                    setDescTicket(null);
                  }}
                  className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
                >
                  Open request
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
