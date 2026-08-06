import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell } from 'recharts';

/* Shared Overview KPI card forms. The gauge rows on the patch-family Overviews mix these so
 * sibling cards don't all repeat the same donut: DONUT (part-to-whole with the total in the
 * middle) · BAR LIST (per-status proportional track bars + total headline) · COLUMNS (recharts
 * mini column chart, value-labelled). All share one CardShell so headers line up exactly. */

export interface KpiSegment { label: string; value: number; color: string }

function CardShell({ label, icon: Icon, color, onClick, children }: {
  label: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${color}1A`, color }}>
          <Icon size={15} />
        </span>
        <span className="text-[13px] text-[#64748B]">{label}</span>
        {onClick && (
          <button onClick={onClick} className="ml-auto flex flex-shrink-0 items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View more<ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/** Horizontal bar list — a bold total headline, then one proportional track bar per status. */
export function BarListKpiCard({ label, icon, color, total, segments, onClick, totalLabel = 'Total' }: {
  label: string;
  icon: LucideIcon;
  color: string;
  total: number;
  segments: KpiSegment[];
  onClick?: () => void;
  totalLabel?: string;
}) {
  const segs = segments.filter((s) => s.value > 0);
  return (
    <CardShell label={label} icon={icon} color={color} onClick={onClick}>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold leading-none tabular-nums text-[#364658]">{total}</span>
        <span className="text-[11px] text-[#7B8FA5]">{totalLabel}</span>
      </div>
      <div className="mt-3 flex flex-1 flex-col justify-center gap-2.5">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="min-w-[68px] truncate text-[12px] text-[#64748B]">{s.label}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="h-full rounded-full" style={{ width: `${(s.value / Math.max(total, 1)) * 100}%`, backgroundColor: s.color }} />
            </div>
            <span className="w-9 flex-shrink-0 text-right text-[13px] font-semibold tabular-nums text-[#364658]">{s.value}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

/** Mini column chart — one rounded column per status with the value labelled on top, a
 *  Y axis with counts + soft gridlines (Patch-Status-by-Category treatment), and a bold
 *  total headline. */
export function ColumnKpiCard({ label, icon, color, total, segments, onClick, height = 132, totalLabel = 'Total' }: {
  label: string;
  icon: LucideIcon;
  color: string;
  total?: number;
  segments: KpiSegment[];
  onClick?: () => void;
  height?: number;
  totalLabel?: string;
}) {
  const data = segments.map((s) => ({ name: s.label, value: s.value, color: s.color }));
  return (
    <CardShell label={label} icon={icon} color={color} onClick={onClick}>
      {total !== undefined && (
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-[22px] font-semibold leading-none tabular-nums text-[#364658]">{total}</span>
          <span className="text-[11px] text-[#7B8FA5]">{totalLabel}</span>
        </div>
      )}
      <div className="mt-1 flex-1" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 14, right: 4, bottom: 0, left: -26 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#F0F2F5" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: '#7B8FA5' }} axisLine={{ stroke: '#EEF1F4' }} tickLine={false} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#364658' }} />
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}
