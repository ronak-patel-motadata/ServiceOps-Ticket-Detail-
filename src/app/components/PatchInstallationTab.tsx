import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Search, X, Monitor, LayoutGrid, List as ListIcon, Filter, Check, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { PatchInstallation, InstallationStatus } from './PatchComputersTab';

// Full set of installation-status values the filter can pick from (superset of what's in the data).
const STATUS_FILTER_OPTIONS = [
  'Yet to Receive', 'Partially Installed', 'In Progress', 'Success', 'Failed',
  'Cancelled', 'Not Applicable', 'Not Ready', 'Received', 'Resolving Dependency',
];

// Clean status-badge palette (soft tint bg + strong text + dot) per installation status.
const STATUS_META: Record<InstallationStatus, { bg: string; text: string; dot: string }> = {
  'Yet to Receive': { bg: '#F2F4F7', text: '#475467', dot: '#667085' },
  'In Progress': { bg: '#FFF8EB', text: '#B54708', dot: '#F79009' },
  'Success': { bg: '#ECFDF3', text: '#067647', dot: '#12B76A' },
  'Failed': { bg: '#FEF3F2', text: '#B42318', dot: '#F04438' },
};

function StatusPill({ status }: { status: InstallationStatus }) {
  const m = STATUS_META[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12px] font-medium cursor-default" style={{ backgroundColor: m.bg, color: m.text }}>
          <span className="size-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.dot }} />
          {status}
        </span>
      </TooltipTrigger>
      <TooltipContent>Installation Status</TooltipContent>
    </Tooltip>
  );
}

const downloadDot = (s: string) => (s === 'Success' ? '#22C55E' : s === 'Failed' ? '#EF4444' : '#64748B');

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

interface PatchInstallationTabProps {
  installations: PatchInstallation[];
  setInstallations: Dispatch<SetStateAction<PatchInstallation[]>>;
  /** Called when a deployment's status turns Success → moves the agent into the Installed bucket. */
  onInstalled: (agentId: string) => void;
}

export function PatchInstallationTab({ installations }: PatchInstallationTabProps) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'card'>('card');
  const [filterOpen, setFilterOpen] = useState(false);
  // Status filter — empty = "All" (show everything); otherwise only the picked statuses.
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const filterActive = statusFilter.length > 0;
  const filterLabel = statusFilter.length === 0 ? 'All' : `${statusFilter[0]}${statusFilter.length > 1 ? ` +${statusFilter.length - 1}` : ''}`;
  const toggleStatus = (s: string) => setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const q = search.trim().toLowerCase();
  const rows = installations
    .filter((r) => statusFilter.length === 0 || statusFilter.includes(r.installationStatus))
    .filter((r) =>
      !q ||
      r.agentId.toLowerCase().includes(q) ||
      r.hostName.toLowerCase().includes(q) ||
      r.ipAddress.toLowerCase().includes(q) ||
      r.installationStatus.toLowerCase().includes(q) ||
      r.taskType.toLowerCase().includes(q)
    );

  return (
    <div className="px-6 py-4 @container">
      {/* Search + card/list view toggle */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Select field to search..."
            className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
        {/* Filter by installation status — "All" by default; picking statuses shows them as pills */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            title="Filter by status"
            className={`inline-flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors ${filterActive ? 'border-[#3D8BD0] bg-[#F0F8FF] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6]'}`}
          >
            <Filter size={15} className={filterActive ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            <span className="max-w-[160px] truncate">{filterLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''} ${filterActive ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-[260px] bg-white rounded-lg shadow-lg border border-[#DFE5ED]">
                {/* Selected pills */}
                {statusFilter.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-[#F0F2F5]">
                    {statusFilter.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
                        {s}
                        <button onClick={() => toggleStatus(s)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Options — "All" first, then each status */}
                <div className="max-h-[260px] overflow-y-auto py-1">
                  <button
                    onClick={() => setStatusFilter([])}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors ${statusFilter.length === 0 ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                  >
                    <span className="text-[#364658]">All</span>
                    {statusFilter.length === 0 && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                  {STATUS_FILTER_OPTIONS.map((opt) => {
                    const on = statusFilter.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleStatus(opt)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition-colors ${on ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        <span className="text-[#364658]">{opt}</span>
                        {on && <Check size={15} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#F0F2F5]">
                  <button onClick={() => setStatusFilter([])} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear all</button>
                  <button onClick={() => setFilterOpen(false)} className="rounded-md bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Done</button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          title={view === 'list' ? 'Card view' : 'List view'}
          onClick={() => setView((v) => (v === 'list' ? 'card' : 'list'))}
          className="size-9 flex-shrink-0 flex items-center justify-center rounded border border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
        >
          {view === 'list' ? <LayoutGrid size={16} /> : <ListIcon size={16} />}
        </button>
      </div>

      {installations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#F5F7FA] mb-3">
            <Monitor className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="text-[14px] font-medium text-[#364658]">No deployments yet</p>
          <p className="text-[13px] text-[#7B8FA5] mt-1">Select computers in the Computers tab and click <span className="font-medium">Install Patch</span> to deploy this patch.</p>
        </div>
      ) : view === 'list' ? (
        /* List (table) view */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Agent ID', 'Host Name', 'IP Address', 'Configuration Type', 'Deployment Date', 'Installation Status', 'Retry Status', 'Download Status', 'Task Type', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No deployments match your search.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                  {/* Agent ID with health dot */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full flex-shrink-0 bg-[#EAB308]" />
                      <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{r.agentId}</button>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[140px] truncate">{r.hostName}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.ipAddress}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.configType}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.deploymentDate === '---' ? <Dash /> : r.deploymentDate}</td>

                  {/* Installation Status — clean status pill */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusPill status={r.installationStatus} />
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.retryStatus}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                    <span className="inline-flex items-center gap-1.5 text-[#364658]">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: downloadDot(r.downloadStatus) }} />
                      {r.downloadStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[170px] truncate">{r.taskType}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="inline-block rounded bg-[#e8f4fd] px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">View Configuration</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#9CA3AF]">No deployments match your search.</div>
      ) : (
        /* Card view — container-query responsive; stays 1 column in the narrow drawer so cards
           never crowd (2 columns only from @2xl, 3 from @4xl). */
        <div className="grid gap-4 grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4 hover:border-[#3D8BD0] hover:shadow-sm transition-all">
              {/* Header: icon badge · (health dot + Agent ID + host) · status pill.
                  flex-wrap lets the pill drop below on very narrow cards instead of squashing. */}
              <div className="flex items-start gap-3 flex-wrap">
                <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]"><Monitor size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full flex-shrink-0 bg-[#EAB308]" />
                    <span className="inline-block whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{r.agentId}</span>
                  </div>
                  <button className="block mt-1 text-[13px] font-semibold text-[#3D8BD0] hover:underline truncate text-left max-w-full" title={r.hostName}>{r.hostName}</button>
                </div>
                <span className="flex-shrink-0"><StatusPill status={r.installationStatus} /></span>
              </div>

              {/* Details */}
              <div className="mt-3 pt-3 border-t border-[#F0F2F5] grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">IP Address</div><div className="text-[12px] text-[#364658] truncate">{r.ipAddress}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Configuration Type</div><div className="text-[12px] text-[#364658] truncate">{r.configType}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Deployment Date</div><div className="text-[12px] truncate" style={{ color: r.deploymentDate === '---' ? '#9ca3af' : '#364658' }}>{r.deploymentDate}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Retry Status</div><div className="text-[12px] text-[#364658]">{r.retryStatus}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Download Status</div><div className="text-[12px] text-[#364658] inline-flex items-center gap-1.5"><span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: downloadDot(r.downloadStatus) }} />{r.downloadStatus}</div></div>
                <div className="min-w-0"><div className="text-[11px] text-[#9CA3AF]">Task Type</div><div className="text-[12px] text-[#364658] truncate" title={r.taskType}>{r.taskType}</div></div>
              </div>

              <div className="mt-3">
                <button className="w-full rounded bg-[#e8f4fd] px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">View Configuration</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
