import { useMemo, useState, type ReactNode } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { DueByPill, dueBySla, slaInfoOf } from './TicketTable';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* Calendar view of the request queue — the same records the grid and board show, each placed
   on its own date. The SLA deadline stays a separate fact (the tooltip computes it from the
   created moment plus the priority window) — the calendar axis is when the request SITS.

   Records may carry a planned END (`dueEnd`) as well — the Change queue's schedule
   windows. Those render Outlook-style: one bar stretched across every day the window
   covers (month rows and a week banner above the time grid), its ends clipped with a
   chevron where the window continues into the neighbouring week.

   Prototyped in the Views Lab. It is not wired into the Requests listing. */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** The mini month uses the compact labels DateTimePickerPopup already established. */
const MINI_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** SLA tone drives the chip colour — the same rule the grid's Due By pill uses. */
const TONE: Record<string, { dot: string; bg: string; fg: string }> = {
  breached: { dot: '#EF4444', bg: '#FEF2F2', fg: '#B42318' },
  due: { dot: '#F59E0B', bg: '#FFFAEB', fg: '#B54708' },
  ok: { dot: '#22C55E', bg: '#F0FDF4', fg: '#15803D' },
  done: { dot: '#94A3B8', bg: '#F8FAFC', fg: '#64748B' },
};

/** Status and priority dots, same values the grid and board use. */
const STATUS_DOT: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#6366F1',
  Pending: '#fb923c',
  Completed: '#22c55e',
  Closed: '#6b7280',
  Cancelled: '#ef4444',
};
const PRIORITY_DOT: Record<string, string> = { Urgent: '#dc2626', High: '#ef4444', Medium: '#fb923c', Low: '#22c55e' };

/** The SLA target window in hours per priority — mirrors the listing's SLA_TARGET. */
const TARGET_HOURS: Record<string, number> = { Urgent: 4, High: 8, Medium: 72, Low: 120 };
/** When the SLA clock runs out: created + target. A concrete moment, not a duration. */
const slaDeadline = (t: Ticket) => new Date(t.createdBy.getTime() + (TARGET_HOURS[t.priority] ?? 72) * 3600e3);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const fmtTime = (d: Date) => {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`;
};

const fmtDay = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
const dayFloor = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** The scheduled end — a missing or inverted end falls back to the start (a point event). */
const endOf = (t: Ticket) => (t.dueEnd && t.dueEnd.getTime() > t.dueBy.getTime() ? t.dueEnd : t.dueBy);
const isMultiDay = (t: Ticket) => !sameDay(t.dueBy, endOf(t));
const coversDay = (t: Ticket, d: Date) => {
  const x = dayFloor(d).getTime();
  return dayFloor(t.dueBy).getTime() <= x && x <= dayFloor(endOf(t)).getTime();
};
/** The whole window in one phrase — "Jun 9, 6:00 PM – Jun 10, 1:00 AM". */
const windowLabel = (t: Ticket) =>
  isMultiDay(t)
    ? `${fmtDay(t.dueBy)}, ${fmtTime(t.dueBy)} – ${fmtDay(endOf(t))}, ${fmtTime(endOf(t))}`
    : `${fmtTime(t.dueBy)} – ${fmtTime(endOf(t))}`;

/* ── The Outlook lane-packer ─────────────────────────────────────────────────
   For one Sun–Sat strip: every event whose window touches the week becomes a bar
   [s..e] in day indexes, clipped to the week with continuation flags, and greedily
   assigned the first lane that is free across its whole span. Longer bars are placed
   first so a window keeps the same visual weight from week to week. */
type PlacedBar = { t: Ticket; s: number; e: number; lane: number; contL: boolean; contR: boolean };
const packWeek = (week: Date[], list: Ticket[]): { placed: PlacedBar[]; laneCount: number } => {
  const w0 = dayFloor(week[0]).getTime();
  const w6 = dayFloor(week[6]).getTime();
  const rows = list
    .filter((t) => dayFloor(t.dueBy).getTime() <= w6 && dayFloor(endOf(t)).getTime() >= w0)
    .map((t) => {
      const sT = dayFloor(t.dueBy).getTime();
      const eT = dayFloor(endOf(t)).getTime();
      return {
        t,
        s: Math.max(0, Math.round((sT - w0) / 864e5)),
        e: Math.min(6, Math.round((eT - w0) / 864e5)),
        contL: sT < w0,
        contR: eT > w6,
      };
    })
    .sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s) || a.t.dueBy.getTime() - b.t.dueBy.getTime());
  const laneEnds: number[] = [];
  const placed = rows.map((r) => {
    let lane = laneEnds.findIndex((end) => end < r.s);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(r.e);
    } else laneEnds[lane] = r.e;
    return { ...r, lane };
  });
  return { placed, laneCount: laneEnds.length };
};

const CardTip = ({ tip, align = 'center', children }: { tip: string; align?: 'center' | 'right'; children: ReactNode }) => (
  <span className="group/tip relative inline-flex">
    {children}
    <span
      className={`pointer-events-none absolute bottom-full z-10 mb-1.5 whitespace-nowrap rounded bg-[#1E293B] px-2 py-1 text-[11px] font-normal text-white opacity-0 shadow-md transition-opacity delay-150 group-hover/tip:opacity-100 ${
        align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
      }`}
    >
      {tip}
      <span className={`absolute top-full border-4 border-transparent border-t-[#1E293B] ${align === 'right' ? 'right-2' : 'left-1/2 -ml-1'}`} />
    </span>
  </span>
);

/** Month cells keep this many bar lanes; anything deeper folds into "+N more". */
const MAX_MONTH_LANES = 4;

type Mode = 'day' | 'week' | 'month';

export function TicketCalendarView({
  tickets,
  onTicketClick,
  noun = 'request',
}: {
  tickets: Ticket[];
  onTicketClick: (t: Ticket) => void;
  /** What one record is called — the Change listing passes "change". */
  noun?: string;
}) {
  /* Open on the month the data actually lives in. Landing on the real "today" would show an
     empty grid for a mock queue dated 2022 — a calendar's first impression should be its
     content, not its emptiness. */
  const busiestMonth = useMemo(() => {
    const counts = new Map<string, { d: Date; n: number }>();
    for (const t of tickets) {
      const k = `${t.dueBy.getFullYear()}-${t.dueBy.getMonth()}`;
      const cur = counts.get(k);
      if (cur) cur.n += 1;
      else counts.set(k, { d: new Date(t.dueBy.getFullYear(), t.dueBy.getMonth(), 1), n: 1 });
    }
    let best: { d: Date; n: number } | null = null;
    counts.forEach((v) => {
      if (!best || v.n > best.n) best = v;
    });
    return best?.d ?? new Date();
  }, [tickets]);

  const [mode, setMode] = useState<Mode>('month');
  const [cursor, setCursor] = useState<Date>(busiestMonth);
  /* The rail's selected day. Starts unset so the rail opens on "what needs attention"
     rather than an arbitrary date the user never chose. */
  const [picked, setPicked] = useState<Date | null>(null);
  const today = new Date();

  /** Every event, earliest window first — all the span queries walk this one list. */
  const events = useMemo(
    () => [...tickets].sort((a, b) => a.dueBy.getTime() - b.dueBy.getTime()),
    [tickets],
  );
  /** Everything whose window COVERS the day — a Tuesday inside a week-long freeze counts. */
  const eventsOn = (d: Date) => events.filter((t) => coversDay(t, d));

  /* The visible range: the weeks the month actually occupies, or the containing Sun–Sat
     for week. One helper, so the header label and the body can never disagree. */
  const days = useMemo(() => {
    if (mode === 'day') return [new Date(cursor)];
    if (mode === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    // Leading blanks + the month's own days, rounded up to whole weeks (4, 5 or 6).
    const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, mode]);

  const title = useMemo(() => {
    if (mode === 'day')
      return `${WEEKDAYS[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    if (mode === 'week') {
      const a = days[0];
      const b = days[6];
      const sameMonth = a.getMonth() === b.getMonth();
      return sameMonth
        ? `${MONTHS[a.getMonth()]} ${a.getDate()} – ${b.getDate()}, ${a.getFullYear()}`
        : `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }, [cursor, mode, days]);

  const step = (dir: 1 | -1) => {
    const d = new Date(cursor);
    if (mode === 'day') d.setDate(d.getDate() + dir);
    else if (mode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  /* Distinct records whose window touches the visible range — a 3-day window is one
     change, not three. */
  const totalShown = useMemo(() => {
    const a = dayFloor(days[0]).getTime();
    const b = dayFloor(days[days.length - 1]).getTime();
    return events.filter((t) => dayFloor(t.dueBy).getTime() <= b && dayFloor(endOf(t)).getTime() >= a).length;
  }, [events, days]);

  /* One tooltip for every calendar surface — chip, bar, banner — so the hover card
     never depends on which rendering the record happened to get. */
  const EventTip = ({ t, children }: { t: Ticket; children: ReactNode }) => (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-none rounded-lg border border-[#E5E7EB] bg-white p-0 text-wrap text-[#364658] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
          arrowClassName="border-b border-r border-[#E5E7EB] bg-white fill-white"
        >
          <div className="w-[286px] px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#94A3B8]">{t.id}</div>
                <div className="mt-0.5 text-[12.5px] font-semibold leading-snug text-[#1E293B]">{t.subject}</div>
              </div>
              {/* The kanban card's corner-avatar recipe: face only, name on hover. */}
              <CardTip
                align="right"
                tip={t.assignedTo.name && t.assignedTo.name !== 'Unassigned' ? `Assigned to ${t.assignedTo.name}` : 'Unassigned'}
              >
                {t.assignedTo.name && t.assignedTo.name !== 'Unassigned' ? (
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">
                    {t.assignedTo.initials}
                  </span>
                ) : (
                  <span className="size-5 flex-shrink-0 rounded-full border-2 border-dashed border-[#9CA3AF]" />
                )}
              </CardTip>
            </div>
            {(endOf(t).getTime() > t.dueBy.getTime() || t.windowNote) && (
              <div className="mt-2 grid grid-cols-[58px_1fr] items-start gap-x-3 gap-y-2 border-t border-[#F0F1F3] pt-2.5 text-[11px]">
                {/* First fact on a calendar: the window is WHY the pill sits where it does. */}
                {endOf(t).getTime() > t.dueBy.getTime() && (
                  <>
                    <span className="text-[#7B8FA5]">Schedule</span>
                    <span className="min-w-0 font-medium text-[#475569]">{windowLabel(t)}</span>
                  </>
                )}
                {t.windowNote && (
                  <>
                    <span className="text-[#7B8FA5]">Impact</span>
                    <span className="min-w-0 text-[#475569] line-clamp-3">{t.windowNote}</span>
                  </>
                )}
              </div>
            )}
            {/* The glanceable facts share one chip row — the kanban card's meta recipe
                translated to the dark card. The SLA pill keeps its own tint;
                the full deadline stays one click away on the record. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#F0F1F3] pt-2.5">
              <CardTip tip={`Status: ${t.status}`}>
                <span className="inline-flex h-[22px] items-center gap-1.5 rounded border border-[#E5E7EB] px-1.5 text-[11px] text-[#364658]">
                  <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                  {t.status}
                </span>
              </CardTip>
              <CardTip tip={`Priority: ${t.priority}`}>
                <span className="inline-flex h-[22px] items-center gap-1.5 rounded border border-[#E5E7EB] px-1.5 text-[11px] text-[#364658]">
                  <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_DOT[t.priority] ?? '#94A3B8' }} />
                  {t.priority}
                </span>
              </CardTip>
              {(() => {
                const sla = dueBySla(t);
                const dl = slaDeadline(t);
                return (
                  <CardTip tip={`${sla.tone === 'done' ? 'SLA met' : 'SLA due'} ${fmtDay(dl)}, ${fmtTime(dl)}`}>
                    <DueByPill tone={sla.tone} label={sla.label} compact className="h-[22px] flex-shrink-0" />
                  </CardTip>
                );
              })()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
  );

  /* One chip = one record sitting at its start time. Colour carries the SLA state, so a
     week of red reads as trouble before a single word is parsed. */
  const Chip = ({ t, showTime = true, showRange = false }: { t: Ticket; showTime?: boolean; showRange?: boolean }) => {
    const tone = TONE[slaInfoOf(t).tone] ?? TONE.done;
    return (
      <EventTip t={t}>
        <button
          onClick={() => onTicketClick(t)}
          style={{ backgroundColor: tone.bg }}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:brightness-95"
        >
          <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
          {showTime && (
            <span className="flex-shrink-0 text-[10px] font-medium tabular-nums" style={{ color: tone.fg }}>
              {fmtTime(t.dueBy)}
              {showRange && !isMultiDay(t) && endOf(t).getTime() > t.dueBy.getTime() ? ` – ${fmtTime(endOf(t))}` : ''}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#364658]">{t.subject}</span>
          {/* A window that runs past today carries its landing day — the hover card has
              the full window, this is just enough to say "this one keeps going". */}
          {isMultiDay(t) && (
            <span className="flex-shrink-0 text-[10px] font-medium" style={{ color: tone.fg }}>
              → {fmtDay(endOf(t))}
            </span>
          )}
        </button>
      </EventTip>
    );
  };

  /* A spanning bar — the Outlook treatment: one pill stretched across every day the
     window covers. A clipped end loses its rounding and gains a chevron: "this window
     continues past what you can see here". */
  const Bar = ({ t, contL = false, contR = false, showTime = false, tail }: { t: Ticket; contL?: boolean; contR?: boolean; showTime?: boolean; tail?: string }) => {
    const tone = TONE[slaInfoOf(t).tone] ?? TONE.done;
    return (
      <EventTip t={t}>
        <button
          onClick={() => onTicketClick(t)}
          style={{ backgroundColor: tone.bg }}
          className={`flex h-[20px] w-full min-w-0 items-center gap-1.5 px-1.5 text-left transition-colors hover:brightness-95 ${contL ? '' : 'rounded-l'} ${contR ? '' : 'rounded-r'}`}
        >
          {contL ? (
            <ChevronLeft size={10} className="flex-shrink-0" style={{ color: tone.fg }} />
          ) : (
            <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
          )}
          {showTime && (
            <span className="flex-shrink-0 text-[10px] font-medium tabular-nums" style={{ color: tone.fg }}>
              {fmtTime(t.dueBy)}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#364658]">{t.subject}</span>
          {contR ? (
            <span className="ml-auto flex-shrink-0 text-[10px] font-medium" style={{ color: tone.fg }}>
              → {fmtDay(endOf(t))}
            </span>
          ) : tail ? (
            <span className="ml-auto flex-shrink-0 text-[10px] font-medium" style={{ color: tone.fg }}>
              {tail}
            </span>
          ) : null}
        </button>
      </EventTip>
    );
  };

  /* Everything the rail needs. "Needs attention" is the calendar's answer to the question a
     change manager actually opens it with: what is at risk, soonest first. */
  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return { lead: first.getDay(), count };
  }, [cursor]);

  /* The rail shows one day's SCHEDULE. With nothing picked it falls back to the first
     day of the visible month that has entries, so the panel is never an empty box. */
  const firstScheduledDay = useMemo(() => {
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= count; day++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      if (eventsOn(d).length > 0) return d;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, events]);

  const segBtn = (m: Mode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      /* Same segmented recipe as the dashboard scope toggle: a white raised pill marks the
         active grain against the light track. */
      className={`h-7 rounded px-3 text-[12px] font-medium transition-colors ${
        mode === m ? 'bg-white text-[#3D8BD0] shadow-sm' : 'text-[#64748B] hover:text-[#364658]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar — period left, navigation and grain right. */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-6 py-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-[#1E293B]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">
            {totalShown} {totalShown === 1 ? noun : `${noun}s`} in this {mode}
          </div>
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <div className="flex items-center overflow-hidden rounded border border-[#DFE5ED]">
            <button
              onClick={() => step(-1)}
              className="inline-flex h-8 w-8 items-center justify-center border-r border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => step(1)}
              className="inline-flex h-8 w-8 items-center justify-center bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 rounded border border-[#DFE5ED] bg-[#F8FAFC] p-0.5">
            {segBtn('day', 'Day')}
            {segBtn('week', 'Week')}
            {segBtn('month', 'Month')}
          </div>

        </div>
      </div>

      {/* ── Day: a single agenda column ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Side rail: mini month, the picked day, then what needs attention ──
            The pattern every ITSM change calendar lands on: a small month to jump around
            without losing the big grid, and a column that answers "what should I look at"
            when no specific day is chosen. */}
        <div className="flex w-[264px] flex-shrink-0 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-[#F8FAFC]">
            {/* Mini month — the DateTimePickerPopup cell recipe, sized down. */}
            <div className="m-3 flex-shrink-0 rounded-lg border border-[#EEF1F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#364658]">
                  {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                    className="flex size-6 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                    className="flex size-6 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </span>
              </div>
              <div className="grid grid-cols-7">
                {MINI_WEEKDAYS.map((w) => (
                  <div key={w} className="py-1 text-center text-[10px] font-medium text-[#A9B6C6]">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: monthDays.lead + monthDays.count }, (_, i) => {
                  if (i < monthDays.lead) return <span key={`b${i}`} />;
                  const day = i - monthDays.lead + 1;
                  const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
                  const n = eventsOn(d).length;
                  const sel = picked ? sameDay(d, picked) : false;
                  return (
                    <button
                      key={day}
                      onClick={() => setPicked(sel ? null : d)}
                      className={`relative flex h-7 items-center justify-center rounded text-[12px] transition-colors ${
                        sel
                          ? 'bg-[#3D8BD0] font-semibold text-white'
                          : sameDay(d, today)
                            ? 'border border-[#3D8BD0] font-semibold text-[#364658]'
                            : 'text-[#364658] hover:bg-[#EFF3F8]'
                      }`}
                    >
                      {day}
                      {/* A dot marks a day with work — the reason to look at it. */}
                      {n > 0 && (
                        <span
                          className={`absolute bottom-0.5 size-1 rounded-full ${sel ? 'bg-white' : 'bg-[#3D8BD0]'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* The picked day's schedule — the Change detail page's Change Calendar
                pattern: date heading, then one card per scheduled entry. */}
            {(() => {
              const day = picked ?? firstScheduledDay;
              const dayEvents = day ? eventsOn(day) : [];
              return (
                <div className="min-h-0 flex-1 px-3 py-3">
                  {day ? (
                    <>
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#1E293B]">
                          {WEEKDAYS[day.getDay()]}, {MONTHS[day.getMonth()].slice(0, 3)} {day.getDate()}
                        </span>
                        {picked && (
                          <button
                            onClick={() => setPicked(null)}
                            className="flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {dayEvents.length === 0 ? (
                        <div className="px-1 text-[12px] text-[#64748B]">Nothing scheduled on this day.</div>
                      ) : (
                        <div className="space-y-1.5">
                          {dayEvents.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => onTicketClick(t)}
                              className="w-full rounded border border-[#EEF1F4] border-l-2 border-l-[#3D8BD0] bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:shadow-[0_2px_6px_rgba(16,24,40,0.08)]"
                            >
                              <span className="block truncate text-[12px] font-medium text-[#364658]">{t.subject}</span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                                <span className="flex-shrink-0 font-medium text-[#64748B]">{t.id}</span>
                                <span className="flex-shrink-0 text-[#CBD5E1]">·</span>
                                <span className="min-w-0 truncate font-medium tabular-nums text-[#64748B]">
                                {!isMultiDay(t)
                                  ? endOf(t).getTime() > t.dueBy.getTime()
                                    ? `${fmtTime(t.dueBy)} – ${fmtTime(endOf(t))}`
                                    : `Scheduled start · ${fmtTime(t.dueBy)}`
                                  : sameDay(t.dueBy, day)
                                    ? `Starts ${fmtTime(t.dueBy)}`
                                    : sameDay(endOf(t), day)
                                      ? `Ends ${fmtTime(endOf(t))}`
                                      : `Runs through ${fmtDay(endOf(t))}`}
                                </span>
                              </span>
                              {/* The window's impact, clamped so a wordy statement can
                                  never push the day's other entries off the rail. */}
                              {t.windowNote && (
                                <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-[#94A3B8]">
                                  {t.windowNote}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-1 text-[12px] text-[#64748B]">Nothing scheduled this month.</div>
                  )}
                </div>
              );
            })()}
        </div>

        {mode === 'day' ? (
          /* Day = the classic hour grid: time gutter left, hairline per hour, chips in the
             hour they sit in. The rail stays — its mini month is how you hop between days
             without leaving the grain. */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Day masthead — small weekday over the big date, the calendar convention. */}
            {/* Weekday + date centred over the 86px time gutter, so the masthead reads as
                the head of the time column — the convention the reference follows. */}
            <div className="flex flex-shrink-0 items-end gap-3 border-b border-[#EEF1F4] py-2">
              <div className="w-[86px] flex-shrink-0 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                  {WEEKDAYS[cursor.getDay()]}
                </div>
                <div className="text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums">{cursor.getDate()}</div>
              </div>
              {/* The masthead always says what the day holds — the count when there is work,
                  with the first time as the useful detail, and the same quiet sentence
                  as before when there is none. */}
              {(() => {
                const ev = eventsOn(cursor);
                const starts = ev.filter((t) => sameDay(t.dueBy, cursor));
                return (
                  <span className="pb-1 text-[12px] text-[#94A3B8]">
                    {ev.length === 0
                      ? 'Nothing on this day.'
                      : `${ev.length} ${ev.length === 1 ? noun : `${noun}s`}${
                          starts.length ? ` · first at ${fmtTime(starts[0].dueBy)}` : ' · carried over'
                        }`}
                  </span>
                );
              })()}
            </div>
            {/* The full 24 hours, 12:00 AM – 11:00 PM — the grid scrolls, so quiet
                hours cost nothing and no due time can ever fall off the clock. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* The "All day" shelf — windows that started on an EARLIER day and run
                  through this one. They have no start row here, so they hold a sticky
                  shelf at the top: in-flight work stays in sight while the hours scroll.
                  A left chevron says "came from earlier"; the right end either lands
                  today ("Ends 1:15 AM") or points at its landing day ("→ Jun 21"). */}
              {(() => {
                const carried = eventsOn(cursor).filter((t) => isMultiDay(t) && !sameDay(t.dueBy, cursor));
                if (carried.length === 0) return null;
                return (
                  <div className="sticky top-0 z-10 flex border-b border-[#EEF1F4] bg-[#FCFDFE]">
                    <span className="w-[86px] flex-shrink-0 pr-4 pt-2 text-right text-[10px] font-semibold uppercase tracking-wide text-[#A9B6C6]">
                      All day
                    </span>
                    <div className="min-w-0 flex-1 space-y-1 border-l border-[#EEF1F4] py-1.5 pl-2 pr-6">
                      {carried.map((t) => (
                        <Bar
                          key={t.id}
                          t={t}
                          contL
                          contR={!sameDay(endOf(t), cursor)}
                          tail={sameDay(endOf(t), cursor) ? `Ends ${fmtTime(endOf(t))}` : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                const slot = eventsOn(cursor).filter((t) => sameDay(t.dueBy, cursor) && t.dueBy.getHours() === h);
                return (
                  <div key={h} className="flex min-h-[52px] border-b border-[#EEF1F4]">
                    <span className="w-[86px] flex-shrink-0 pr-4 pt-1.5 text-right text-[11px] tabular-nums text-[#94A3B8]">
                      {((h + 11) % 12) + 1}:00 {h >= 12 ? 'PM' : 'AM'}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1 border-l border-[#EEF1F4] py-1 pl-2 pr-6">
                      {slot.map((t) => (
                        <span key={t.id} className={`block ${isMultiDay(t) ? '' : 'max-w-[560px]'}`}>
                          <Chip t={t} showRange />
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : mode === 'week' ? (
          /* Week = the day view's hour grid, seven columns wide. Same gutter, same 24
             rows, so switching grains never re-teaches the layout. */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Day headers over their columns; the date number picks that day into the rail. */}
            <div className="flex flex-shrink-0 border-b border-[#EEF1F4]">
              <span className="w-[86px] flex-shrink-0" />
              {days.map((d) => {
                const isToday = sameDay(d, today);
                const isPicked = picked ? sameDay(d, picked) : false;
                return (
                  <div key={keyOf(d)} className="min-w-0 flex-1 border-l border-[#EEF1F4] py-1.5 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                      {WEEKDAYS[d.getDay()]}
                    </div>
                    <button
                      onClick={() => setPicked(isPicked ? null : new Date(d))}
                      className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-colors ${
                        isPicked
                          ? 'bg-[#1E293B] text-white'
                          : isToday
                            ? 'bg-[#3D8BD0] text-white'
                            : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
            {/* 24 hour rows × 7 day columns. Each row is its own positioning context:
                an entry anchors in the hour it STARTS and stretches as one bar across
                every day column its window covers — width IS the duration. Windows that
                run past Saturday clip with a "→ landing day" tail; overlapping windows
                in the same hour stack into lanes and the row grows to fit. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                const { placed, laneCount } = packWeek(
                  days,
                  events.filter((t) => t.dueBy.getHours() === h && days.some((d) => sameDay(t.dueBy, d))),
                );
                return (
                  <div
                    key={h}
                    className="relative flex border-b border-[#EEF1F4]"
                    style={{ minHeight: Math.max(52, laneCount * 24 + 10) }}
                  >
                    <span className="w-[86px] flex-shrink-0 pr-4 pt-1.5 text-right text-[11px] tabular-nums text-[#94A3B8]">
                      {((h + 11) % 12) + 1}:00 {h >= 12 ? 'PM' : 'AM'}
                    </span>
                    {days.map((d) => (
                      <span key={keyOf(d)} className="min-w-0 flex-1 border-l border-[#EEF1F4]" />
                    ))}
                    {placed.map((q) => (
                      <div
                        key={`${q.t.id}-${q.s}`}
                        className="absolute"
                        style={{
                          top: 5 + q.lane * 24,
                          left: `calc(86px + (100% - 86px) * ${q.s / 7} + 3px)`,
                          width: `calc((100% - 86px) * ${(q.e - q.s + 1) / 7} - 6px)`,
                        }}
                      >
                        <Bar t={q.t} contR={q.contR} showTime />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Weekday rail */}
          <div className="grid flex-shrink-0 grid-cols-7 border-b border-[#EEF1F4]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                {w}
              </div>
            ))}
          </div>

          {/* Week rows — each one the positioning context for its Outlook-style bars:
              a window crosses cell borders as one continuous pill, clipped ends marking
              a continuation into the neighbouring week. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7)).map((week) => {
              const { placed } = packWeek(week, events);
              const hiddenOn = (idx: number) =>
                placed.filter((q) => q.lane >= MAX_MONTH_LANES && q.s <= idx && idx <= q.e).length;
              return (
                <div key={keyOf(week[0])} className="relative grid min-h-[150px] flex-1 grid-cols-7">
                  {week.map((d, idx) => {
                    const outside = d.getMonth() !== cursor.getMonth();
                    const isToday = sameDay(d, today);
                    const count = eventsOn(d).length;
                    const hidden = hiddenOn(idx);
                    return (
                      <div
                        key={keyOf(d)}
                        className={`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-r border-[#EEF1F4] p-1.5 ${
                          outside ? 'bg-[#FCFDFE]' : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-shrink-0 items-center justify-between px-0.5">
                          {/* The date is the handle: clicking it loads that day into the rail
                              instead of navigating away from the month you are reading. */}
                          <button
                            onClick={() => setPicked(picked && sameDay(d, picked) ? null : new Date(d))}
                            className={`inline-flex size-6 items-center justify-center rounded-full text-[12px] tabular-nums transition-colors ${
                              picked && sameDay(d, picked)
                                ? 'bg-[#1E293B] font-semibold text-white'
                                : isToday
                                  ? 'bg-[#3D8BD0] font-semibold text-white'
                                  : outside
                                    ? 'text-[#CBD5E1] hover:bg-[#F1F5F9]'
                                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                            }`}
                          >
                            {d.getDate()}
                          </button>
                          {count > 0 && !outside && (
                            <span className="text-[10px] font-medium tabular-nums text-[#B6C2D1]">{count}</span>
                          )}
                        </div>
                        {/* Pinned to the cell floor, under the bar lanes — the way into the
                            day when more windows cross it than the lanes can show. */}
                        {hidden > 0 && (
                          <button
                            onClick={() => {
                              setCursor(new Date(d));
                              setMode('day');
                            }}
                            className="mt-auto w-full flex-shrink-0 rounded bg-white px-1.5 py-0.5 text-left text-[10px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
                          >
                            +{hidden} more
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {/* The bars themselves, laned under the date row and laid over the whole
                      week so each window is one uninterrupted pill. */}
                  {placed
                    .filter((q) => q.lane < MAX_MONTH_LANES)
                    .map((q) => (
                      <div
                        key={`${q.t.id}-${q.s}`}
                        className="absolute"
                        style={{
                          top: 32 + q.lane * 24,
                          left: `calc(${(q.s / 7) * 100}% + 4px)`,
                          width: `calc(${((q.e - q.s + 1) / 7) * 100}% - 8px)`,
                        }}
                      >
                        <Bar t={q.t} contL={q.contL} contR={q.contR} showTime={q.s === q.e && !q.contL && !q.contR} />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}