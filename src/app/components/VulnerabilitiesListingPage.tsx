/* ── Vulnerabilities listing ─────────────────────────────────────────────────
   The shared register chrome over the real `mockVulnerabilities`, replacing the module's
   hand-rolled table: the same columns it always showed, now with the filter builder,
   saved views, grouping, multi-sort and the two layouts the module actually needs.

   TWO layouts — **List + KPI** and **Dashboard**. The KPI strip and the dashboard both
   answer the question the detail page opens with (see VulnerabilityDrawer's Overview:
   severity, exploitation, how much of the fleet is touched), so a reader meets the same
   story at every zoom level. */
import { useMemo, useState } from 'react';
import { Bug, Monitor, ShieldAlert, ShieldCheck, Gauge } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { PatchVulnEndpointsPanel } from './PatchVulnEndpointsPanel';
import { endpointsForCve } from './PatchVulnerabilitiesTab';
import { INITIAL_COMPUTERS } from './PatchComputersTab';
import { VULN_FILTER_ATTRS, VULN_QUICK_FILTERS, cvssBand } from './vulnFilterAttrs';
import {
  mockVulnerabilities, vulnApprovalOf, vulnCvssVectorOf, vulnerabilityToPatchShape, vulnKbOf,
  vulnRebootOf, vulnSupportUriOf, type Vulnerability,
} from './VulnerabilitiesListPage';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

/* "Tue, Apr 14, 2026 05:00 PM" → a real Date, so the column sorts chronologically and the
   date buckets read the true value. */
const parsePublished = (s: string): Date | null => {
  const d = new Date(s.replace(/^[A-Za-z]{3},\s*/, ''));
  return Number.isNaN(d.getTime()) ? null : d;
};

const SEV_COLOR: Record<string, string> = {
  Critical: '#DC2626', Important: '#F97316', Moderate: '#F59E0B', Low: '#22C55E', Unspecified: '#94A3B8',
};

const VULNS: { rows: Ticket[]; byId: Map<string, Vulnerability> } = (() => {
  const byId = new Map<string, Vulnerability>();
  const rows = mockVulnerabilities.map((v) => {
    byId.set(v.id, v);
    const published = parsePublished(v.publishedDate) ?? new Date();
    return {
      id: v.id,
      subject: v.name,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: published,
      createdBy: published,
      status: 'Open' as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      x_severity: v.severity,
      x_exploitedCves: v.exploitedCves,
      x_otherCves: v.nonExploitedCves,
      x_category: v.category,
      x_cvss: v.cvssScore,
      x_cvssBand: cvssBand(v.cvssScore),
      x_published: published,
      x_impacted: v.impactedEndpoints,
      /* The advisory attributes the product's filter offers. Derived in VulnerabilitiesListPage
         so the row and the detail page it opens can never disagree. */
      x_kb: vulnKbOf(v),
      x_supportUri: vulnSupportUriOf(v),
      x_reboot: vulnRebootOf(v),
      x_approvalStatus: vulnApprovalOf(v),
      x_cvssVector: vulnCvssVectorOf(v),
      /* The module's load-bearing cut, pre-computed so the KPI card, the quick filter and
         the saved view all test one field. */
      x_exploited: v.exploitedCves.length > 0 ? 'Yes' : 'No',
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const sevOf = (t: Ticket) => String((t as any).x_severity ?? '');
const isExploited = (t: Ticket) => (t as any).x_exploited === 'Yes';
const endpointsOf = (t: Ticket) => Number((t as any).x_impacted ?? 0);

/* The strip reads top-down as a triage queue: how much is there, how much of it is
   critical, how much is ALREADY being exploited, how much of the fleet that touches. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const critical = rows.filter((t) => sevOf(t) === 'Critical');
  const exploited = rows.filter(isExploited);
  const highScore = rows.filter((t) => Number((t as any).x_cvss ?? 0) >= 9);
  const fleet = rows.reduce((a, t) => a + endpointsOf(t), 0);
  return [
    { label: 'Detected vulnerabilities', value: rows.length, sub: 'across the patch catalogue' },
    {
      label: 'Critical severity', value: critical.length, sub: `of ${rows.length} detected`,
      valueColor: critical.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_severity', condition: 'is', values: ['Critical'] }],
    },
    {
      label: 'Exploited in the wild', value: exploited.length, sub: 'fix these first',
      valueColor: exploited.length ? '#B42318' : undefined,
      filter: [{ field: 'x_exploited', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'CVSS 9.0+', value: highScore.length, sub: 'critical-scored advisories',
      valueColor: highScore.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_cvssBand', condition: 'is', values: ['Critical (9.0+)'] }],
    },
    { label: 'Endpoints exposed', value: fleet, sub: 'summed across all findings' },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;
  const sevSegs = ['Critical', 'Important', 'Moderate', 'Low', 'Unspecified']
    .map((label) => ({
      label, value: by((t) => sevOf(t) === label), color: SEV_COLOR[label],
      filter: [{ field: 'x_severity', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const catRows = [...new Set(rows.map((t) => String((t as any).x_category)))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_category === label), color: '#3D8BD0',
      filter: [{ field: 'x_category', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  const bandRows = ['Critical (9.0+)', 'High (7.0–8.9)', 'Medium (4.0–6.9)', 'Low (0.1–3.9)', 'Not scored']
    .map((label) => ({
      label, value: by((t) => (t as any).x_cvssBand === label),
      color: label.startsWith('Critical') ? '#DC2626' : label.startsWith('High') ? '#EF4444' : label.startsWith('Medium') ? '#F59E0B' : label.startsWith('Low') ? '#22C55E' : '#94A3B8',
      filter: [{ field: 'x_cvssBand', condition: 'is' as const, values: [label] }],
    }))
    .filter((r) => r.value > 0);

  /* The ten findings touching the most machines — where remediation buys the most. */
  const reach = [...rows]
    .sort((a, b) => endpointsOf(b) - endpointsOf(a))
    .map((t) => ({ label: t.id, value: endpointsOf(t), color: '#8B5CF6' }));

  const exploited = by(isExploited);
  return {
    tiles: [
      { icon: ShieldAlert, color: '#DC2626', label: 'Critical severity', value: by((t) => sevOf(t) === 'Critical'), sub: `of ${rows.length} detected`, filter: [{ field: 'x_severity', condition: 'is', values: ['Critical'] }] },
      { icon: Bug, color: '#B42318', label: 'Exploited in the wild', value: exploited, sub: 'active exploitation known', filter: [{ field: 'x_exploited', condition: 'is', values: ['Yes'] }] },
      { icon: Gauge, color: '#F97316', label: 'CVSS 9.0+', value: by((t) => Number((t as any).x_cvss ?? 0) >= 9), sub: 'critical-scored', filter: [{ field: 'x_cvssBand', condition: 'is', values: ['Critical (9.0+)'] }] },
      { icon: Monitor, color: '#3D8BD0', label: 'Endpoints exposed', value: rows.reduce((a, t) => a + endpointsOf(t), 0), sub: 'summed across findings' },
      { icon: ShieldCheck, color: '#22C55E', label: 'Not exploited', value: rows.length - exploited, sub: 'no known exploitation', filter: [{ field: 'x_exploited', condition: 'is', values: ['No'] }] },
    ],
    sections: [
      { kind: 'donut', title: 'By severity', sub: 'Where the risk sits', centerLabel: 'Findings', segs: sevSegs },
      { kind: 'bars', title: 'By category', sub: 'Which update stream they come from', rows: catRows.slice(0, 6), allRows: catRows, panelSubject: 'vulnerabilities', panelColumnLabel: 'Category', panelCountLabel: 'Findings' },
      { kind: 'columns', title: 'By CVSS band', sub: 'How they score', rows: bandRows },
      { kind: 'bars', title: 'Widest blast radius', sub: 'Findings touching the most endpoints', rows: reach.slice(0, 6), allRows: reach, panelSubject: 'vulnerabilities', panelColumnLabel: 'Finding', panelCountLabel: 'Endpoints' },
      { kind: 'stack', title: 'Exploitation', sub: 'Known exploitation versus not', segs: [
        { label: 'Exploited', value: exploited, color: '#DC2626', filter: [{ field: 'x_exploited', condition: 'is', values: ['Yes'] }] },
        { label: 'Not exploited', value: rows.length - exploited, color: '#22C55E', filter: [{ field: 'x_exploited', condition: 'is', values: ['No'] }] },
      ] },
    ],
  };
};

export function VulnerabilitiesListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => VULNS.rows, []);
  /* The row whose Impacted Endpoints count was clicked — the same side popup the patch
     detail page opens from its Vulnerabilities grid, over the same deterministic picker, so
     a finding names the same machines wherever a reader meets it. */
  const [impacted, setImpacted] = useState<Ticket | null>(null);
  return (
    <>
    <AssetRegisterPage
      activePage="vulnerabilities"
      stackModule="vulnerabilities"
      viewsStore="vuln"
      noun="vulnerability"
      moduleCols="vuln"
      defaultViewName="Detected Vulnerability Patches"
      footerNoun="vulnerabilities"
      rows={rows}
      recordOf={(id) => { const v = VULNS.byId.get(id); return v ? vulnerabilityToPatchShape(v) : undefined; }}
      filterAttrs={VULN_FILTER_ATTRS}
      quickFilters={VULN_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      /* A KB number is the single thing anyone pastes into a search box when chasing an
         advisory, so it searches alongside the id and the title. */
      searchFields={['x_kb', 'x_category', 'x_severity', 'x_cvssBand']}
      moreActions={[]}
      onRowAction={(t, action) => { if (action === 'impacted-endpoints') setImpacted(t); }}
      onNavigate={onNavigate}
    />
    <PatchVulnEndpointsPanel
      isOpen={!!impacted}
      onClose={() => setImpacted(null)}
      cveId={impacted?.id}
      endpoints={impacted ? endpointsForCve(impacted.id, Number((impacted as any).x_impacted ?? 0), INITIAL_COMPUTERS) : []}
    />
    </>
  );
}
