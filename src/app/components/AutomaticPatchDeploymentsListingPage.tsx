/* ── Automatic Patch Deployments listing ─────────────────────────────────────
   The shared register chrome over `mockAutomaticPatchDeployments`. The module's own columns —
   ID · Name · Last Execution Time · Next Execution Time · Enable · Actions — now with the
   filter builder, saved views, grouping and multi-sort.

   TWO layouts, List + KPI and Dashboard, like the rest of the Patch module. A deployment
   schedule is read for one thing: are approved patches still reaching the fleet, or has the
   rollout quietly stopped? So the strip leads with what is live, what is overdue to fire and
   what has never run at all. */
import { useMemo, useState } from 'react';
import { CalendarClock, PlayCircle, Power, PowerOff, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { AssetRegisterPage } from './AssetRegisterPage';
import { AutomaticPatchDeploymentPanel } from './AutomaticPatchDeploymentPanel';
import {
  APD_FILTER_ATTRS, APD_QUICK_FILTERS, apdActivityOf, mockAutomaticPatchDeployments,
  type AutomaticPatchDeployment,
} from './automaticPatchDeployments';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* "Fri, Oct 02, 2026 12:00 AM" → a real Date, so the column sorts chronologically and the
   date buckets read the true value. */
const parseExec = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

const toRow = (d: AutomaticPatchDeployment): Ticket => ({
  id: d.id,
  subject: d.name,
  requester: '',
  assignedTo: { name: '', initials: '' },
  dueBy: parseExec(d.nextExecution) ?? new Date(),
  createdBy: parseExec(d.lastExecution) ?? new Date(),
  status: 'Open' as Ticket['status'],
  priority: 'Medium' as Ticket['priority'],
  x_lastExecution: parseExec(d.lastExecution),
  x_nextExecution: parseExec(d.nextExecution),
  x_enabled: d.enabled ? 'Enabled' : 'Disabled',
  x_policy: d.deploymentPolicy,
  x_createdBy: d.createdBy,
  x_activity: apdActivityOf(d),
  /* NULL where the schedule has created none — the grid prints a dash, which is the module's
     own answer for "never built out", not a zero claiming it ran and shipped nothing. */
  x_deployments: d.totalDeployments,
} as unknown as Ticket);

const enabledOf = (t: Ticket) => (t as any).x_enabled === 'Enabled';
const activityOf = (t: Ticket) => String((t as any).x_activity);

/* Reads as "is the rollout doing its job": how many schedules exist, how many are live, how
   much they have actually shipped, and what is switched off or has never fired. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const on = rows.filter(enabledOf);
  const shipped = rows.reduce((a, t) => a + Number((t as any).x_deployments ?? 0), 0);
  const never = rows.filter((t) => activityOf(t) === 'Never run' || activityOf(t) === 'Scheduled');
  const stopped = rows.filter((t) => activityOf(t) === 'Stopped');
  return [
    { label: 'Deployment schedules', value: rows.length, sub: 'across the patch catalogue' },
    {
      label: 'Enabled', value: on.length, sub: `of ${rows.length} schedules`,
      valueColor: on.length ? '#22A06B' : undefined,
      filter: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }],
    },
    { label: 'Deployments created', value: shipped, sub: 'by every schedule to date' },
    {
      label: 'Never run', value: never.length, sub: 'enabled but never fired',
      valueColor: never.length ? '#B45309' : undefined,
      filter: [{ field: 'x_activity', condition: 'is', values: ['Never run', 'Scheduled'] }],
    },
    {
      label: 'Stopped', value: stopped.length, sub: 'switched off, will not run again',
      valueColor: stopped.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_activity', condition: 'is', values: ['Stopped'] }],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;
  const shippedOf = (t: Ticket) => Number((t as any).x_deployments ?? 0);

  const activitySegs = ['Running', 'Scheduled', 'Never run', 'Stopped']
    .map((label) => ({
      label,
      value: by((t) => activityOf(t) === label),
      color: label === 'Running' ? '#22C55E' : label === 'Scheduled' ? '#3D8BD0' : label === 'Never run' ? '#94A3B8' : '#DC2626',
      filter: [{ field: 'x_activity', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const enableRows = ['Enabled', 'Disabled']
    .map((label) => ({
      label, value: by((t) => (t as any).x_enabled === label),
      color: label === 'Enabled' ? '#22C55E' : '#94A3B8',
      filter: [{ field: 'x_enabled', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  const policyRows = [...new Set(rows.map((t) => String((t as any).x_policy)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_policy === label), color: '#3D8BD0',
      filter: [{ field: 'x_policy', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  const ownerRows = [...new Set(rows.map((t) => String((t as any).x_createdBy)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_createdBy === label), color: '#8B5CF6',
      filter: [{ field: 'x_createdBy', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  /* The schedules shipping the most — where the fleet's patching actually comes from. */
  const busiest = [...rows]
    .filter((t) => shippedOf(t) > 0)
    .sort((a, b) => shippedOf(b) - shippedOf(a))
    .map((t) => ({ label: t.id, value: shippedOf(t), color: '#22C55E' }));

  const live = by(enabledOf);
  return {
    tiles: [
      { icon: Power, color: '#22C55E', label: 'Enabled', value: live, sub: `of ${rows.length} schedules`, filter: [{ field: 'x_enabled', condition: 'is', values: ['Enabled'] }] },
      { icon: PowerOff, color: '#94A3B8', label: 'Disabled', value: rows.length - live, sub: 'will not run again', filter: [{ field: 'x_enabled', condition: 'is', values: ['Disabled'] }] },
      { icon: PlayCircle, color: '#3D8BD0', label: 'Running', value: by((t) => activityOf(t) === 'Running'), sub: 'have fired at least once', filter: [{ field: 'x_activity', condition: 'is', values: ['Running'] }] },
      { icon: CalendarClock, color: '#B45309', label: 'Never run', value: by((t) => activityOf(t) === 'Never run' || activityOf(t) === 'Scheduled'), sub: 'enabled but never fired', filter: [{ field: 'x_activity', condition: 'is', values: ['Never run', 'Scheduled'] }] },
      { icon: Rocket, color: '#8B5CF6', label: 'Deployments created', value: rows.reduce((a, t) => a + shippedOf(t), 0), sub: 'across all schedules' },
    ],
    sections: [
      { kind: 'donut', title: 'By schedule activity', sub: 'Where each schedule stands', centerLabel: 'Schedules', segs: activitySegs },
      { kind: 'columns', title: 'Enable state', sub: 'What is live and what is switched off', rows: enableRows },
      { kind: 'bars', title: 'By deployment policy', sub: 'How the fleet is being rolled to', rows: policyRows.slice(0, 6), allRows: policyRows, panelSubject: 'schedules', panelColumnLabel: 'Deployment Policy', panelCountLabel: 'Schedules' },
      { kind: 'bars', title: 'By owner', sub: 'Who maintains the schedules', rows: ownerRows.slice(0, 6), allRows: ownerRows, panelSubject: 'schedules', panelColumnLabel: 'Created By', panelCountLabel: 'Schedules' },
      { kind: 'bars', title: 'Busiest schedules', sub: 'Which ones have created the most deployments', rows: busiest.slice(0, 6), allRows: busiest, panelSubject: 'schedules', panelColumnLabel: 'Schedule', panelCountLabel: 'Deployments' },
      {
        kind: 'gauge', title: 'Rollout coverage', sub: 'Schedules currently enabled',
        pct: rows.length ? Math.round((live / rows.length) * 100) : 0,
        caption: `${live} of ${rows.length} schedules enabled`,
      },
    ],
  };
};

export function AutomaticPatchDeploymentsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* A schedule has no detail DRAWER — it opens as a side panel, which is what the module does
     and what its two tabs fit. `onOpenRow` is the register's hook for exactly this. */
  const [open, setOpen] = useState<AutomaticPatchDeployment | null>(null);
  /* The Enable switch writes back, so the rows are state rather than a constant — toggling a
     schedule off has to move it out of the "Enabled" KPI and any applied filter. */
  const [rows, setRows] = useState<Ticket[]>(() => mockAutomaticPatchDeployments.map(toRow));
  const byId = useMemo(() => new Map(mockAutomaticPatchDeployments.map((d) => [d.id, d])), []);

  return (
    <>
      <AssetRegisterPage
        activePage="automatic-patch-deployments"
        stackModule="automatic-patch-deployments"
        viewsStore="apd"
        noun="deployment schedule"
        moduleCols="apd"
        defaultViewName="Automatic Patch Deployments"
        footerNoun="deployment schedules"
        rows={rows}
        recordOf={(id) => byId.get(id)}
        filterAttrs={APD_FILTER_ATTRS}
        quickFilters={APD_QUICK_FILTERS}
        layouts={['list-kpi', 'dashboard']}
        buildCards={buildCards}
        buildDashboard={buildDashboard}
        searchFields={['x_createdBy', 'x_enabled', 'x_policy']}
        /* No views rail — the panel toggle beside the title goes with it. */
        showViews={false}
        /* No rule builder: a schedule carries six fields and the only cut anyone makes here
           is on/off, which the quick filter already is. The catalogue stays wired, so the
           KPI cards and saved views keep filtering on activity and policy. */
        showFilterBuilder={false}
        /* ⚠️ Dropping the gear also drops the LAYOUT PICKER and Manage columns with it, so the
           Dashboard built above is no longer reachable from the UI and the optional columns
           cannot be added. The wiring is left in place — removing this one entry brings both
           back. (Same trade-off Automatic Patch Tests and My Team make.) */
        hideTools={['export', 'settings']}
        moreActions={[]}
        primaryAction={{ label: 'Create Automatic Patch Deployment' }}
        primaryActionInTitle
        /* The Enable switch is the one thing this grid edits in place. */
        onUpdateTicket={(id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
        onRowAction={(t, action) => {
          if (action === 'edit') toast(`Edit ${t.id} — coming soon`);
        }}
        /* Clicking the id or the name opens the schedule's panel. */
        onOpenRow={(t) => setOpen(byId.get(t.id) ?? null)}
        onNavigate={onNavigate}
      />
      <AutomaticPatchDeploymentPanel isOpen={!!open} onClose={() => setOpen(null)} deployment={open} />
    </>
  );
}
