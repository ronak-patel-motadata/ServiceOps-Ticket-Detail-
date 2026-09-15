import { useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, TriangleAlert } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { slaInfoOf } from './TicketTable';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* Calendar view of the request queue — the same records the grid and board show, placed on
   the date they are DUE. A service desk reads a calendar to answer "what lands when", so due
   date is the axis; created date would just redraw the intake chart the dashboard already has.

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

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const fmtTime = (d: Date) => {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`;
};

type Mode = 'week' | 'month';

export function TicketCalendarView({
  tickets,
  onTicketClick,
}: {
  tickets: Ticket[];
  onTicketClick: (t: Ticket) => void;
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
  const [railOpen, setRailOpen] = useState(true);
  const today = new Date();

  /** Requests bucketed by the day they are due — built once per ticket set. */
  const byDay = useMemo(() => {
    const m = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const k = keyOf(t.dueBy);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    // Earliest due first inside a day, so a cell reads top-to-bottom in time order.
    m.forEach((arr) => arr.sort((a, b) => a.dueBy.getTime() - b.dueBy.getTime()));
    return m;
  }, [tickets]);

  const eventsOn = (d: Date) => byDay.get(keyOf(d)) ?? [];

  /* The visible range: the weeks the month actually occupies, or the containing Sun–Sat
     for week. One helper, so the header label and the body can never disagree. */
  const days = useMemo(() => {
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
  // Row count drives the grid; the classes are spelled out so Tailwind emits all three.
  const weekRows = days.length / 7;
  const rowsClass = weekRows === 6 ? 'grid-rows-6' : weekRows === 4 ? 'grid-rows-4' : 'grid-rows-5';

  const title = useMemo(() => {
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
    if (mode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const totalShown = days.reduce((n, d) => n + eventsOn(d).length, 0);

  /* One chip = one request. Colour carries the SLA state, so a week of red reads as trouble
     before a single word is parsed. */
  const Chip = ({ t, showTime = true }: { t: Ticket; showTime?: boolean }) => {
    const tone = TONE[slaInfoOf(t).tone] ?? TONE.done;
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onTicketClick(t)}
            style={{ backgroundColor: tone.bg }}
            className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:brightness-95"
          >
            <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
            {showTime && (
              <span className="flex-shrink-0 text-[10px] font-medium tabular-nums" style={{ color: tone.fg }}>
                {fmtTime(t.dueBy)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[11px] text-[#364658]">{t.subject}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-wrap">
          <span className="font-semibold">{t.id}</span> · {t.subject}
          <br />
          Due {fmtTime(t.dueBy)} · {t.priority} · {t.assignedTo.name || 'Unassigned'}
        </TooltipContent>
      </Tooltip>
    );
  };

  /* Everything the rail needs. "Needs attention" is the calendar's answer to the question a
     change manager actually opens it with: what is at risk, soonest first. */
  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return { lead: first.getDay(), count };
  }, [cursor]);

  const atRisk = useMemo(
    () =>
      tickets
        .filter((t) => {
          const tone = slaInfoOf(t).tone;
          return tone === 'breached' || tone === 'due';
        })
        .sort((a, b) => a.dueBy.getTime() - b.dueBy.getTime())
        .slice(0, 6),
    [tickets],
  );

  /* Upcoming = the next things due from the visible period's start. On a mock queue dated
     2022 "from now" would always be empty, so it reads forward from the cursor instead. */
  const upcoming = useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getTime();
    return tickets
      .filter((t) => t.dueBy.getTime() >= from)
      .sort((a, b) => a.dueBy.getTime() - b.dueBy.getTime())
      .slice(0, 6);
  }, [tickets, cursor]);

  const pickedEvents = picked ? eventsOn(picked) : [];

  const RailRow = ({ t, showDate = false }: { t: Ticket; showDate?: boolean }) => {
    const tone = TONE[slaInfoOf(t).tone] ?? TONE.done;
    return (
      <button
        onClick={() => onTicketClick(t)}
        className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-white hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
      >
        <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] text-[#364658]">{t.subject}</span>
          <span className="mt-0.5 block text-[11px] text-[#94A3B8]">
            {t.id} · {showDate ? `${MONTHS[t.dueBy.getMonth()].slice(0, 3)} ${t.dueBy.getDate()}, ` : ''}
            {fmtTime(t.dueBy)}
          </span>
        </span>
      </button>
    );
  };

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
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setRailOpen((v) => !v)}
              className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                railOpen
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                  : 'border-[#DFE5ED] bg-white text-[#6b7280] hover:bg-[#F5F7FA] hover:text-[#364658]'
              }`}
            >
              {railOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{railOpen ? 'Hide side panel' : 'Show side panel'}</TooltipContent>
        </Tooltip>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-[#1E293B]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">
            {totalShown} {totalShown === 1 ? 'request' : 'requests'} due in this {mode}
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
        {railOpen && (
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

            {/* Picked day, or the attention list when none is chosen. */}
            {picked ? (
              <div className="min-h-0 flex-1 px-2 py-3">
                <div className="mb-1.5 flex items-center gap-2 px-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#1E293B]">
                    {WEEKDAYS[picked.getDay()]}, {MONTHS[picked.getMonth()].slice(0, 3)} {picked.getDate()}
                  </span>
                  <button
                    onClick={() => setPicked(null)}
                    className="flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
                  >
                    Clear
                  </button>
                </div>
                {pickedEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#F1F5F9]">
                      <CalendarClock size={16} className="text-[#94A3B8]" />
                    </span>
                    <span className="text-[12px] text-[#64748B]">Nothing due on this day.</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {pickedEvents.map((t) => (
                      <RailRow key={t.id} t={t} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="min-h-0 flex-1 px-2 py-3">
                <div className="mb-1.5 flex items-center gap-1.5 px-2">
                  <TriangleAlert size={12} className="flex-shrink-0 text-[#F59E0B]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Needs attention</span>
                </div>
                {atRisk.length === 0 ? (
                  <div className="px-2 pb-3 text-[12px] text-[#64748B]">Nothing breached or due soon.</div>
                ) : (
                  <div className="space-y-0.5">
                    {atRisk.map((t) => (
                      <RailRow key={t.id} t={t} showDate />
                    ))}
                  </div>
                )}

                <div className="mb-1.5 mt-4 flex items-center gap-1.5 border-t border-[#F0F2F5] px-2 pt-3">
                  <CalendarClock size={12} className="flex-shrink-0 text-[#94A3B8]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Upcoming</span>
                </div>
                {upcoming.length === 0 ? (
                  <div className="px-2 text-[12px] text-[#64748B]">Nothing scheduled ahead.</div>
                ) : (
                  <div className="space-y-0.5">
                    {upcoming.map((t) => (
                      <RailRow key={t.id} t={t} showDate />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Weekday rail */}
          <div className="grid flex-shrink-0 grid-cols-7 border-b border-[#EEF1F4]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                {w}
              </div>
            ))}
          </div>

          {/* Day cells — a fixed 6-row month, or one tall row for a week. */}
          <div
            className={`grid min-h-0 flex-1 grid-cols-7 overflow-y-auto ${mode === 'month' ? rowsClass : 'grid-rows-1'}`}
          >
            {days.map((d) => {
              const events = eventsOn(d);
              const outside = mode === 'month' && d.getMonth() !== cursor.getMonth();
              const isToday = sameDay(d, today);
              // A month cell shows three and counts the rest; a week column has room for all.
              const cap = mode === 'month' ? 4 : events.length;
              return (
                <div
                  key={keyOf(d)}
                  className={`flex min-h-[132px] min-w-0 flex-col gap-1 border-b border-r border-[#EEF1F4] p-1.5 ${
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
                    {events.length > 0 && !outside && (
                      <span className="text-[10px] font-medium tabular-nums text-[#B6C2D1]">{events.length}</span>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {events.slice(0, cap).map((t) => (
                      <Chip key={t.id} t={t} />
                    ))}
                  </div>
                  {/* Outside the scroll area, so it sits on the floor of the cell instead of
                      riding away with the chips — the count of what's hidden has to stay
                      visible for it to mean anything. */}
                  {events.length > cap && (
                    <div className="relative -mt-1 flex-shrink-0">
                      {/* The KPI strip's fade, turned vertical: the last chip dissolves into
                         the link instead of being cut by a rule, which also says "there is
                         more above this" rather than just "here is a footer". */}
                      <span className="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-t from-white to-transparent" />
                      <button
                        onClick={() => {
                          setCursor(new Date(d));
                          setMode('week');
                        }}
                        className="relative w-full rounded bg-white px-1.5 py-0.5 text-left text-[10px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
                      >
                        +{events.length - cap} more
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}