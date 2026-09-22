import { useMemo, useState } from 'react';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { slaInfoOf } from './TicketTable';
import { EventTip, TONE, dayFloor, endOf, fmtDay, fmtTime, readinessOf } from './TicketCalendarView';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* ── Gantt view ──────────────────────────────────────────────────────────────
   The queue on a time axis — the release-timeline pattern the ITSM field leads
   with (ServiceNow release Gantt, Jira Plans, ManageEngine SDP): one row per
   record, a bar spanning its planned window, a Month/Quarter grain and the same
   period navigator the Calendar view uses, opening on the busiest month.

   Bars wear the record's SLA tone — the same colour its pill wears in the grid
   and calendar — with the calendar's continuation language at the edges (clipped
   corner + "→ landing day" when a window runs past the visible period). Hovering
   opens the calendar's white record card; clicking anything opens the record.

   Hand-rolled on the product's own primitives — no chart library, so the theme,
   tooltips and typography are native rather than skinned. */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_MS = 864e5;
const RAIL_W = 280;
/** Week-grain weekday labels — those columns have room for more than a letter. */
const WD3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const fmtDur = (ms: number) => {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/* The white phase card — the record hover card's surface, for one bar segment. */
const SEG_TIP =
  'max-w-none rounded-lg border border-[#E5E7EB] bg-white p-0 text-wrap text-[#364658] shadow-[0_8px_24px_rgba(15,23,42,0.12)]';
const SEG_ARROW = 'border-b border-r border-[#E5E7EB] bg-white fill-white';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type Grain = 'week' | 'month' | 'quarter';

/* readinessOf is shared with the hover card — it lives beside EventTip now. */

export function TicketGanttView({
  tickets,
  onTicketClick,
  noun = 'request',
}: {
  tickets: Ticket[];
  onTicketClick: (t: Ticket) => void;
  /** What one record is called — the Release listing passes "release". */
  noun?: string;
}) {
  /* Open on the month with the most windows — the calendar's rule, for the same
     reason: a timeline's first impression should be its content. */
  const busiest = useMemo(() => {
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

  const [grain, setGrain] = useState<Grain>('month');
  const [cursor, setCursor] = useState<Date>(busiest);
  /* Brush zoom: dragging a span across the timeline sets a CUSTOM range that
     overrides the grain; Reset (or picking a grain) returns to the grains, a
     double-click widens the view one step. */
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [brush, setBrush] = useState<{ a: number; b: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const didBrushRef = useRef(false);
  const today = new Date();

  const range = useMemo(() => {
    if (customRange) return customRange;
    if (grain === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    if (grain === 'month') {
      return {
        start: new Date(cursor.getFullYear(), cursor.getMonth(), 1),
        end: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
      };
    }
    const q = Math.floor(cursor.getMonth() / 3) * 3;
    return { start: new Date(cursor.getFullYear(), q, 1), end: new Date(cursor.getFullYear(), q + 3, 0) };
  }, [cursor, grain, customRange]);

  const rangeStartMs = dayFloor(range.start).getTime();
  const dayCount = Math.round((dayFloor(range.end).getTime() - rangeStartMs) / DAY_MS) + 1;
  const spanMs = dayCount * DAY_MS;
  const days = useMemo(
    () =>
      Array.from(
        { length: dayCount },
        (_, i) => new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate() + i),
      ),
    [range, dayCount],
  );
  /* Quarter columns are weeks — a 91-day axis has no room for day labels. */
  const weeks = useMemo(() => days.filter((d) => d.getDay() === 0), [days]);

  /* How the axis DRAWS: a brushed range styles itself by its own day count. */
  const presGrain: Grain = customRange ? (dayCount <= 10 ? 'week' : dayCount <= 45 ? 'month' : 'quarter') : grain;

  /* Each day keeps a readable minimum width. On a wide screen the columns still
     stretch to fill (the % maths is width-agnostic); on a small one the timeline
     overflows into horizontal scroll under the frozen rail instead of shrinking. */
  /* Month: 76px = the row height, so a cell reads as a clean square. Week: roomy
     120px columns where the windows' hour-level starts become visible. */
  const tlMin = Math.round(dayCount * (presGrain === 'week' ? 120 : presGrain === 'month' ? 76 : 18));

  /* Every record whose window touches the period, earliest start first — the reading
     order a timeline promises. */
  const rows = useMemo(
    () =>
      tickets
        .filter(
          (t) =>
            dayFloor(t.dueBy).getTime() <= dayFloor(range.end).getTime() &&
            dayFloor(endOf(t)).getTime() >= rangeStartMs,
        )
        .sort((a, b) => a.dueBy.getTime() - b.dueBy.getTime() || endOf(b).getTime() - endOf(a).getTime()),
    [tickets, range, rangeStartMs],
  );

  const title = customRange
    ? `${fmtDay(days[0])} – ${fmtDay(days[days.length - 1])}, ${days[days.length - 1].getFullYear()}`
    : grain === 'week'
      ? days[0].getMonth() === days[6].getMonth()
        ? `${MONTHS[days[0].getMonth()]} ${days[0].getDate()} – ${days[6].getDate()}, ${days[0].getFullYear()}`
        : `${MONTHS[days[0].getMonth()]} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()]} ${days[6].getDate()}, ${days[6].getFullYear()}`
      : grain === 'month'
        ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : `Q${Math.floor(cursor.getMonth() / 3) + 1} ${cursor.getFullYear()} · ${MONTHS[Math.floor(cursor.getMonth() / 3) * 3].slice(0, 3)} – ${MONTHS[Math.floor(cursor.getMonth() / 3) * 3 + 2].slice(0, 3)}`;

  const step = (dir: 1 | -1) => {
    if (customRange) {
      const s0 = new Date(customRange.start);
      const e0 = new Date(customRange.end);
      s0.setDate(s0.getDate() + dir * dayCount);
      e0.setDate(e0.getDate() + dir * dayCount);
      setCustomRange({ start: s0, end: e0 });
      return;
    }
    if (grain === 'week') {
      const d = new Date(cursor);
      d.setDate(d.getDate() + dir * 7);
      setCursor(d);
      return;
    }
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir * (grain === 'month' ? 1 : 3), 1));
  };

  /* Brush-to-zoom. The gesture lives on the rows canvas: press on the timeline
     (not the rail), drag ≥5px to draw the blue selection, release to zoom to the
     day-snapped span. The captured click after a brush is swallowed so the bar
     under the pointer does not open. */
  const tlFrac = (clientX: number) => {
    const el = bodyRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const w = r.width - RAIL_W;
    if (w <= 0) return null;
    return Math.max(0, Math.min(1, (clientX - r.left - RAIL_W) / w));
  };
  const onBrushDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = bodyRef.current;
    if (!el) return;
    if (e.clientX - el.getBoundingClientRect().left < RAIL_W) return;
    const a0 = tlFrac(e.clientX);
    if (a0 === null) return;
    const startClientX = e.clientX;
    let started = false;
    const move = (ev: MouseEvent) => {
      if (!started && Math.abs(ev.clientX - startClientX) < 5) return;
      started = true;
      ev.preventDefault();
      const b = tlFrac(ev.clientX);
      if (b !== null) setBrush({ a: a0, b });
    };
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      setBrush(null);
      if (!started) return;
      didBrushRef.current = true;
      const b = tlFrac(ev.clientX) ?? a0;
      const lo = Math.min(a0, b);
      const hi = Math.max(a0, b);
      const s0 = dayFloor(new Date(rangeStartMs + lo * spanMs));
      const e0 = dayFloor(new Date(rangeStartMs + Math.max(hi * spanMs - 1, lo * spanMs)));
      setCustomRange({ start: s0, end: e0.getTime() < s0.getTime() ? s0 : e0 });
      setCursor(new Date(s0));
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const zoomOut = (e: React.MouseEvent) => {
    const el = bodyRef.current;
    if (!el || e.clientX - el.getBoundingClientRect().left < RAIL_W) return;
    const newSpan = Math.min(dayCount * 2, 366);
    const s0 = dayFloor(new Date(rangeStartMs + spanMs / 2 - (newSpan / 2) * DAY_MS));
    const e0 = new Date(s0);
    e0.setDate(s0.getDate() + newSpan - 1);
    setCustomRange({ start: s0, end: e0 });
    setCursor(new Date(s0));
  };

  /* A moment's horizontal position, clamped to the visible period. */
  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - rangeStartMs) / spanMs) * 100));
  const todayPct =
    dayFloor(today).getTime() >= rangeStartMs && dayFloor(today).getTime() <= dayFloor(range.end).getTime()
      ? ((dayFloor(today).getTime() + DAY_MS / 2 - rangeStartMs) / spanMs) * 100
      : null;

  const segBtn = (g: Grain, label: string) => (
    <button
      key={g}
      onClick={() => {
        setCustomRange(null);
        setGrain(g);
      }}
      className={`h-7 rounded px-3 text-[12px] font-medium transition-colors ${
        !customRange && grain === g ? 'bg-white text-[#3D8BD0] shadow-sm' : 'text-[#64748B] hover:text-[#364658]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar — period left, navigation and grain right; the calendar's recipe. */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-6 py-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-[#1E293B]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#94A3B8]">
            {rows.length} {rows.length === 1 ? noun : `${noun}s`} in this {customRange ? 'range' : grain}
            {customRange ? ' · double-click the timeline to widen' : ' · drag across the timeline to zoom'}
          </div>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {customRange && (
            <button
              onClick={() => setCustomRange(null)}
              title="Back to the Week / Month / Quarter grains"
              className="inline-flex h-8 items-center gap-1 rounded border border-[#3D8BD0] bg-[#F5FAFF] px-2.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
            >
              <X size={13} />
              Reset zoom
            </button>
          )}
          {/* Phase legend — the bars carry two overlays worth naming. */}
          <span className="mr-1 hidden items-center gap-3 text-[11px] text-[#94A3B8] md:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-[3px] bg-[#3D8BD0]" />
              Rollout
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-[3px] bg-[#EF4444]" />
              Down time
            </span>
          </span>
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
            {segBtn('quarter', 'Quarter')}
          </div>
        </div>
      </div>

      {/* One scroller for BOTH axes: the header row sticks to the top, the record
          rail sticks to the left (the corner cell to both), and the timeline pans
          beneath that frozen frame. */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative min-h-full" style={{ minWidth: RAIL_W + tlMin }}>
      {/* Axis header: the record rail's title, then the time scale. */}
      <div className="sticky top-0 z-30 flex border-b border-[#E5E7EB] bg-white">
        <div
          className="sticky left-0 z-10 flex flex-shrink-0 items-center border-r border-[#E5E7EB] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]"
          style={{ width: RAIL_W }}
        >
          {`${noun.charAt(0).toUpperCase() + noun.slice(1)}s`}
        </div>
        <div className="relative h-[44px] min-w-0 flex-1">
          {presGrain !== 'quarter'
            ? days.map((d) => {
                const isToday = sameDay(d, today);
                const wknd = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={d.getTime()}
                    className="absolute inset-y-0 flex flex-col items-center justify-center gap-0.5"
                    style={{ left: `${pct(dayFloor(d).getTime())}%`, width: `${100 / dayCount}%` }}
                  >
                    <span className="text-[9px] font-semibold uppercase text-[#C3CDD9]">
                      {presGrain === 'week' ? WD3[d.getDay()] : 'SMTWTFS'[d.getDay()]}
                    </span>
                    <span
                      className={`inline-flex size-[18px] items-center justify-center rounded-full text-[11px] tabular-nums ${
                        isToday ? 'bg-[#3D8BD0] font-semibold text-white' : wknd ? 'text-[#B6C2D1]' : 'text-[#64748B]'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })
            : weeks.map((d) => (
                <div
                  key={d.getTime()}
                  className="absolute inset-y-0 flex items-center pl-2 text-[11px] font-medium text-[#64748B]"
                  style={{ left: `${pct(dayFloor(d).getTime())}%` }}
                >
                  {fmtDay(d)}
                </div>
              ))}
        </div>
      </div>

      {/* Body — rows over one shared grid layer; also the brush-zoom canvas. */}
      <div
        ref={bodyRef}
        onMouseDown={onBrushDown}
        onDoubleClick={zoomOut}
        onClickCapture={(e) => {
          if (didBrushRef.current) {
            didBrushRef.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={`relative cursor-crosshair ${brush ? 'select-none [&_*]:pointer-events-none' : ''}`}
      >
          {/* The timeline's backdrop: weekend wash, column hairlines, the today rule.
              Absolute inside the scrolled content, so it spans every row exactly. */}
          <div className="pointer-events-none absolute inset-y-0 right-0" style={{ left: RAIL_W }}>
            {presGrain !== 'quarter' &&
              days
                .filter((d) => d.getDay() === 0 || d.getDay() === 6)
                .map((d) => (
                  <span
                    key={`w${d.getTime()}`}
                    className="absolute inset-y-0 bg-[#FAFBFC]"
                    style={{ left: `${pct(dayFloor(d).getTime())}%`, width: `${100 / dayCount}%` }}
                  />
                ))}
            {(presGrain === 'quarter' ? weeks : days).map((d) => (
              <span
                key={d.getTime()}
                className="absolute inset-y-0 border-l border-[#F5F7FA]"
                style={{ left: `${pct(dayFloor(d).getTime())}%` }}
              />
            ))}
            {todayPct !== null && (
              <span className="absolute inset-y-0 w-px bg-[#3D8BD0]" style={{ left: `${todayPct}%` }} />
            )}
          </div>

          {rows.map((t) => {
            const tone = TONE[slaInfoOf(t).tone] ?? TONE.done;
            const left = pct(t.dueBy.getTime());
            const width = Math.max(pct(endOf(t).getTime()) - left, 0.5);
            const contL = t.dueBy.getTime() < rangeStartMs;
            const contR = endOf(t).getTime() > rangeStartMs + spanMs;
            /* A two-hour window in a quarter is a sliver — it stays a clean tick mark
               rather than a squashed pill full of clipped text. */
            const slim = width < 3;
            return (
              <div key={t.id} className="group relative flex h-[76px] items-center border-b border-[#F5F7FA] transition-colors hover:bg-[#64748B]/[0.05]">
                <button
                  onClick={() => onTicketClick(t)}
                  className="sticky left-0 z-20 flex h-full flex-shrink-0 flex-col justify-center border-r border-[#E5E7EB] bg-white px-4 text-left transition-colors group-hover:bg-[#F3F5F8]"
                  style={{ width: RAIL_W }}
                >
                  {(() => {
                    const r = readinessOf(t);
                    return (
                      <>
                        <span className="flex w-full items-center gap-2">
                          <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#364658]">{t.subject}</span>
                        </span>
                        <span className="mt-1 flex w-full items-center gap-1.5 pl-[14px]">
                          <span className="flex-shrink-0 text-[10.5px] font-medium text-[#94A3B8]">{t.id}</span>
                          {r?.note && (
                            <>
                              <span className="text-[10px] text-[#CBD5E1]">·</span>
                              <span className="truncate text-[10px] font-medium" style={{ color: r.color }}>
                                {r.note}
                              </span>
                            </>
                          )}
                          {r && (
                            <span className="ml-auto flex-shrink-0 text-[10.5px] font-medium tabular-nums text-[#64748B]">
                              {Math.min(r.pct, 100)}%
                            </span>
                          )}
                        </span>
                        {r && (
                          <span className="mt-1.5 ml-[14px] block h-[4px] overflow-hidden rounded-full bg-[#EEF1F4]" style={{ width: RAIL_W - 32 - 14 }}>
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${Math.min(r.pct, 100)}%`, backgroundColor: r.color }}
                            />
                          </span>
                        )}
                      </>
                    );
                  })()}
                </button>
                <div className="relative h-full min-w-0 flex-1">
                  <div
                    className="absolute top-1/2 h-[22px] -translate-y-1/2"
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                  >
                  <EventTip t={t}>
                    <button
                      onClick={() => onTicketClick(t)}
                      style={{ backgroundColor: `${tone.dot}59` }}
                      className={`absolute inset-0 block shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[filter] hover:brightness-95 ${
                        contL ? '' : 'rounded-l'
                      } ${contR ? '' : 'rounded-r'}`}
                    />
                  </EventTip>
                  {t.rollout &&
                    (() => {
                      const sl = pct(t.rollout.start.getTime());
                      const sw = pct(t.rollout.end.getTime()) - sl;
                      if (sw <= 0) return null;
                      const rl = Math.max(0, ((sl - left) / width) * 100);
                      const rw = Math.min(100 - rl, (sw / width) * 100);
                      return (
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <span
                              onClick={() => onTicketClick(t)}
                              className="absolute inset-y-0 z-10 cursor-pointer bg-[#3D8BD0] ring-2 ring-white transition-colors hover:bg-[#2F7AB8]"
                              style={{ left: `${rl}%`, width: `${rw}%`, minWidth: 6 }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className={SEG_TIP} arrowClassName={SEG_ARROW}>
                            <div className="w-[272px] px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="size-2 flex-shrink-0 rounded-full bg-[#3D8BD0]" />
                                <span className="text-[12px] font-semibold text-[#1E293B]">Planned Rollout</span>
                                <span className="ml-auto text-[11px] font-medium text-[#94A3B8]">{t.id}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-[56px_1fr] items-center gap-x-3 gap-y-1.5 border-t border-[#F0F1F3] pt-2 text-[11px]">
                                <span className="text-[#7B8FA5]">Starts</span>
                                <span className="font-medium text-[#475569]">{fmtDay(t.rollout.start)}, {fmtTime(t.rollout.start)}</span>
                                <span className="text-[#7B8FA5]">Ends</span>
                                <span className="font-medium text-[#475569]">{fmtDay(t.rollout.end)}, {fmtTime(t.rollout.end)}</span>
                                <span className="text-[#7B8FA5]">Duration</span>
                                <span className="font-medium text-[#475569]">{fmtDur(t.rollout.end.getTime() - t.rollout.start.getTime())}</span>
                              </div>
                              {t.rollout.note && (
                                <p className="mt-2 border-t border-[#F0F1F3] pt-2 text-[11px] leading-4 text-[#64748B]">
                                  {t.rollout.note}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  {t.downtime &&
                    (() => {
                      const dl = pct(t.downtime.start.getTime());
                      const dw = pct(t.downtime.end.getTime()) - dl;
                      if (dw <= 0) return null;
                      const el2 = Math.max(0, ((dl - left) / width) * 100);
                      const ew = Math.min(100 - el2, (dw / width) * 100);
                      return (
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <span
                              onClick={() => onTicketClick(t)}
                              className="absolute inset-y-0 z-20 cursor-pointer bg-[#EF4444] ring-2 ring-white transition-colors hover:bg-[#DC2626]"
                              style={{ left: `${el2}%`, width: `${ew}%`, minWidth: 6 }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className={SEG_TIP} arrowClassName={SEG_ARROW}>
                            <div className="w-[272px] px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="size-2 flex-shrink-0 rounded-full bg-[#EF4444]" />
                                <span className="text-[12px] font-semibold text-[#1E293B]">Down Time</span>
                                <span className="ml-auto text-[11px] font-medium text-[#94A3B8]">{t.id}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-[56px_1fr] items-center gap-x-3 gap-y-1.5 border-t border-[#F0F1F3] pt-2 text-[11px]">
                                <span className="text-[#7B8FA5]">Starts</span>
                                <span className="font-medium text-[#475569]">{fmtDay(t.downtime.start)}, {fmtTime(t.downtime.start)}</span>
                                <span className="text-[#7B8FA5]">Ends</span>
                                <span className="font-medium text-[#475569]">{fmtDay(t.downtime.end)}, {fmtTime(t.downtime.end)}</span>
                                <span className="text-[#7B8FA5]">Duration</span>
                                <span className="font-medium text-[#475569]">{fmtDur(t.downtime.end.getTime() - t.downtime.start.getTime())}</span>
                              </div>
                              <p className="mt-2 border-t border-[#F0F1F3] pt-2 text-[11px] leading-4 text-[#64748B]">
                                {t.downtime.note}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                  <span
                    className="pointer-events-none absolute z-[1] flex items-center gap-1.5 whitespace-nowrap text-[10.5px] font-medium text-[#64748B]"
                    style={{ left: `${left}%`, top: 'calc(50% - 29px)' }}
                  >
                    <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
                    <span className="tabular-nums">
                      {sameDay(t.dueBy, endOf(t))
                        ? `${fmtTime(t.dueBy)} – ${fmtTime(endOf(t))}`
                        : `${fmtDay(t.dueBy)} – ${fmtDay(endOf(t))}`}
                    </span>
                    {contR && <span className="text-[10px]">→ {fmtDay(endOf(t))}</span>}
                  </span>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="px-6 py-16 text-center text-[13px] text-[#94A3B8]">
              Nothing scheduled in this {customRange ? 'range' : grain}.
            </div>
          )}
          {/* The live selection — a chart brush: tinted span, edge rules, and a
              date chip naming what release brings you when you let go. */}
          {brush && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-30" style={{ left: RAIL_W }}>
              <div
                className="absolute inset-y-0 border-x-2 border-[#3D8BD0]/60 bg-[#3D8BD0]/10"
                style={{
                  left: `${Math.min(brush.a, brush.b) * 100}%`,
                  width: `${Math.abs(brush.b - brush.a) * 100}%`,
                }}
              >
                <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1E293B] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md">
                  {fmtDay(new Date(rangeStartMs + Math.min(brush.a, brush.b) * spanMs))} –{' '}
                  {fmtDay(new Date(rangeStartMs + Math.max(brush.a, brush.b) * spanMs))}
                </span>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
