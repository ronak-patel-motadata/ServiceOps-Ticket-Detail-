/* ── Endpoints listing ───────────────────────────────────────────────────────
   The shared register chrome over the real `mockEndpoints`. Same columns the module
   always showed — including the agent-health dot before the id pill — now with the filter
   builder, saved views, grouping and multi-sort.

   TWO layouts — **List + KPI** and **Dashboard**, both built from what the endpoint detail
   page leads with (see EndpointDrawer's header: system health, missing patches, reboot
   required, last scan) so a fleet reads the same way whole or one machine at a time. */
import { useMemo } from 'react';
import { AlertTriangle, MapPin, Monitor, RefreshCw, WifiOff } from 'lucide-react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { ENDPOINT_FILTER_ATTRS, ENDPOINT_QUICK_FILTERS } from './vulnFilterAttrs';
import {
  endpointDomainOf, endpointIpRangeOf, endpointOsVulnsOf, endpointScanDateOf,
  endpointSoftwareVulnsOf, endpointToPatchShape, endpointVulnCountOf, mockEndpoints,
  type Endpoint,
} from './EndpointsListPage';
import type { DashConfig } from './AssetDashboardView';
import type { StatCard } from './AssetStatsRow';
import type { Ticket } from './TicketListPage';

const HEALTH_COLOR: Record<string, string> = {
  Healthy: '#22C55E', Warning: '#F59E0B', Critical: '#DC2626', 'Not reported': '#94A3B8',
};

/* The OS family rather than the full build string — "Microsoft Windows 11 Pro" and
   "…10 Pro" are one platform decision, and a chart of twenty build numbers says nothing. */
const familyOf = (os: string) =>
  /windows server/i.test(os) ? 'Windows Server'
    : /windows 11/i.test(os) ? 'Windows 11'
      : /windows 10/i.test(os) ? 'Windows 10'
        : /macos/i.test(os) ? 'macOS'
          : /ubuntu|red hat|linux/i.test(os) ? 'Linux'
            : 'Other';

const ENDPOINTS: { rows: Ticket[]; byId: Map<string, Endpoint> } = (() => {
  const byId = new Map<string, Endpoint>();
  const rows = mockEndpoints.map((e, i) => {
    byId.set(e.id, e);
    /* Endpoints carry no date of their own; the id order is the order a fleet list is
       read in anyway, and the grid needs something to sort its date machinery on. */
    const seen = new Date(Date.now() - i * 36e5);
    return {
      id: e.id,
      subject: e.hostName,
      requester: '',
      assignedTo: { name: '', initials: '' },
      dueBy: seen,
      createdBy: seen,
      status: 'Open' as Ticket['status'],
      priority: 'Medium' as Ticket['priority'],
      /* The agent dot the module has always shown before the id. */
      x_idDot: e.agentOnline ? '#22C55E' : '#94A3B8',
      x_idDotTip: e.agentOnline ? 'Agent online' : 'Agent offline',
      x_agent: e.agentOnline ? 'Online' : 'Offline',
      x_ip: e.ipAddress,
      x_os: e.osName,
      x_osFamily: familyOf(e.osName),
      x_version: e.version ?? '',
      x_servicePack: e.servicePack ?? '',
      x_arch: e.architecture,
      x_office: e.remoteOffice ?? '',
      x_health: e.systemHealth ?? 'Not reported',
      /* The rest of the product's attribute set, derived in EndpointsListPage. A machine that
         has never reported an inventory has never been scanned, so its scan date is empty
         rather than a zero that would read as "scanned, nothing found". */
      x_domain: endpointDomainOf(e),
      x_ipRange: endpointIpRangeOf(e),
      x_scanDate: endpointScanDateOf(e),
      x_osVulns: endpointOsVulnsOf(e),
      x_softwareVulns: endpointSoftwareVulnsOf(e),
      x_vulnCount: endpointVulnCountOf(e),
      x_tags: e.tags,
      x_reboot: e.rebootRequired,
    } as unknown as Ticket;
  });
  return { rows, byId };
})();

const healthOf = (t: Ticket) => String((t as any).x_health ?? '');

/* What a fleet manager checks each morning: who is unreachable, who is unhealthy, who is
   waiting on a reboot to finish patching, and who has never reported an inventory. */
const buildCards = (rows: Ticket[]): StatCard[] => {
  const offline = rows.filter((t) => (t as any).x_agent === 'Offline');
  const unhealthy = rows.filter((t) => healthOf(t) === 'Warning' || healthOf(t) === 'Critical');
  const reboot = rows.filter((t) => (t as any).x_reboot === 'Yes');
  const noInventory = rows.filter((t) => !String((t as any).x_version ?? '').trim());
  return [
    { label: 'Managed endpoints', value: rows.length, sub: `${rows.length - offline.length} agents online` },
    {
      label: 'Agents offline', value: offline.length, sub: 'not reporting right now',
      valueColor: offline.length ? '#B45309' : undefined,
      filter: [{ field: 'x_agent', condition: 'is', values: ['Offline'] }],
    },
    {
      label: 'Health warnings', value: unhealthy.length, sub: 'warning or critical',
      valueColor: unhealthy.length ? '#DC2626' : undefined,
      filter: [{ field: 'x_health', condition: 'is', values: ['Warning', 'Critical'] }],
    },
    {
      label: 'Reboot required', value: reboot.length, sub: 'patching not finished',
      valueColor: reboot.length ? '#F97316' : undefined,
      filter: [{ field: 'x_reboot', condition: 'is', values: ['Yes'] }],
    },
    {
      label: 'No inventory', value: noInventory.length, sub: 'agent has not reported a build',
      filter: [{ field: 'x_version', condition: 'empty', values: [] }],
    },
  ];
};

const buildDashboard = (rows: Ticket[]): DashConfig => {
  const by = (pred: (t: Ticket) => boolean) => rows.filter(pred).length;
  const healthSegs = ['Healthy', 'Warning', 'Critical', 'Not reported']
    .map((label) => ({
      label, value: by((t) => healthOf(t) === label), color: HEALTH_COLOR[label],
      filter: [{ field: 'x_health', condition: 'is' as const, values: [label] }],
    }))
    .filter((s) => s.value > 0);

  const osRows = [...new Set(rows.map((t) => String((t as any).x_osFamily)))]
    .map((label) => ({ label, value: by((t) => (t as any).x_osFamily === label), color: '#3D8BD0' }))
    .sort((a, b) => b.value - a.value);

  const officeRows = [...new Set(rows.map((t) => String((t as any).x_office)).filter(Boolean))]
    .map((label) => ({
      label, value: by((t) => (t as any).x_office === label), color: '#8B5CF6',
      filter: [{ field: 'x_office', condition: 'is' as const, values: [label] }],
    }))
    .sort((a, b) => b.value - a.value);

  const online = by((t) => (t as any).x_agent === 'Online');
  const reboot = by((t) => (t as any).x_reboot === 'Yes');
  return {
    tiles: [
      { icon: Monitor, color: '#3D8BD0', label: 'Managed endpoints', value: rows.length, sub: 'in the fleet' },
      { icon: WifiOff, color: '#B45309', label: 'Agents offline', value: rows.length - online, sub: 'not reporting', filter: [{ field: 'x_agent', condition: 'is', values: ['Offline'] }] },
      { icon: AlertTriangle, color: '#DC2626', label: 'Health warnings', value: by((t) => healthOf(t) === 'Warning' || healthOf(t) === 'Critical'), sub: 'warning or critical', filter: [{ field: 'x_health', condition: 'is', values: ['Warning', 'Critical'] }] },
      { icon: RefreshCw, color: '#F97316', label: 'Reboot required', value: reboot, sub: 'patching unfinished', filter: [{ field: 'x_reboot', condition: 'is', values: ['Yes'] }] },
      { icon: MapPin, color: '#22C55E', label: 'Sites covered', value: officeRows.length, sub: 'remote offices reporting' },
    ],
    sections: [
      { kind: 'donut', title: 'By system health', sub: 'The state of the fleet', centerLabel: 'Endpoints', segs: healthSegs },
      { kind: 'columns', title: 'By operating system', sub: 'What the fleet runs', rows: osRows },
      { kind: 'bars', title: 'By remote office', sub: 'Where the machines are', rows: officeRows.slice(0, 6), allRows: officeRows, panelSubject: 'endpoints', panelColumnLabel: 'Remote office', panelCountLabel: 'Endpoints' },
      { kind: 'gauge', title: 'Agent coverage', sub: 'Agents reporting right now', pct: rows.length ? Math.round((online / rows.length) * 100) : 0, caption: `${online} of ${rows.length} online`, note: 'An offline agent cannot be patched or scanned.' },
      { kind: 'stack', title: 'Reboot backlog', sub: 'Machines holding a pending reboot', segs: [
        { label: 'Reboot required', value: reboot, color: '#F97316', filter: [{ field: 'x_reboot', condition: 'is', values: ['Yes'] }] },
        { label: 'Up to date', value: rows.length - reboot, color: '#22C55E', filter: [{ field: 'x_reboot', condition: 'is', values: ['No'] }] },
      ] },
    ],
  };
};

export function EndpointsListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rows = useMemo(() => ENDPOINTS.rows, []);
  return (
    <AssetRegisterPage
      activePage="endpoints"
      stackModule="endpoints"
      viewsStore="endpoint"
      noun="endpoint"
      moduleCols="endpoint"
      defaultViewName="All Endpoints"
      footerNoun="endpoints"
      rows={rows}
      recordOf={(id) => { const e = ENDPOINTS.byId.get(id); return e ? endpointToPatchShape(e) : undefined; }}
      filterAttrs={ENDPOINT_FILTER_ATTRS}
      quickFilters={ENDPOINT_QUICK_FILTERS}
      layouts={['list-kpi', 'dashboard']}
      buildCards={buildCards}
      buildDashboard={buildDashboard}
      searchFields={['x_ip', 'x_os', 'x_version', 'x_office', 'x_health']}
      moreActions={[]}
      onNavigate={onNavigate}
    />
  );
}
