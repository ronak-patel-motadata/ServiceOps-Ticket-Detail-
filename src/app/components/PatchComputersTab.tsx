import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Search, X, Trash2, Plus, User, Download, RotateCcw, Power, ScanLine, PackagePlus, FileDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';

export type Bucket = 'Missing' | 'Installed' | 'Ignored';

export interface PatchComputer {
  id: string;
  hostName: string;
  ipAddress: string;
  poller: string;
  createdBy: string;
  osName: string;
  version: string;
  servicePack: string;
  architecture: string;
  usedBy: string | null;
  systemHealth: 'Healthy' | 'Critical' | null;
  remoteOffice: string | null;
  bucket: Bucket;
}

// Realistic agent/computer inventory (mock) split across the three patch buckets.
export const INITIAL_COMPUTERS: PatchComputer[] = [
  { id: 'AGENT-380', hostName: 'ACIWSUSV-01', ipAddress: '192.168.1.13', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-397', hostName: 'Jevyjava-LT', ipAddress: '192.168.112.75', poller: '---', createdBy: '---', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.404', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-400', hostName: 'PARTH-UPADHYAY', ipAddress: '192.168.1.75', poller: '---', createdBy: 'default', osName: 'Microsoft Windows 11 Pro', version: '8.6.300', servicePack: '---', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: null, bucket: 'Missing' },
  { id: 'AGENT-396', hostName: 'DESKTOP-A19KJ', ipAddress: '10.20.41.40', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.7.200', servicePack: '---', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-392', hostName: 'DHRUVPANCHAL', ipAddress: '10.20.40.202', poller: '---', createdBy: 'RW', osName: 'Microsoft Windows 11 Enterprise', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-391', hostName: 'Adarsh-PC', ipAddress: '192.168.1.11', poller: '---', createdBy: 'Adarsh Fuinnc', osName: 'Microsoft Windows 10 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-389', hostName: 'DESKTOP-N81KQ', ipAddress: '10.20.41.103', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: 'requester test', systemHealth: null, remoteOffice: null, bucket: 'Missing' },
  { id: 'AGENT-388', hostName: 'PARTH-UPADHYAY-2', ipAddress: '10.20.40.182', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-386', hostName: 'DESKTOP-DK09P', ipAddress: '192.168.0.104', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: 'Chintan Makwana', systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-384', hostName: 'ARJUN-CHAUHAN', ipAddress: '192.168.1.14', poller: '---', createdBy: 'arjun system', osName: 'Microsoft Windows 10 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-383', hostName: 'DESKTOP-5F2AL', ipAddress: '192.168.29.101', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 11 Pro', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-382', hostName: 'ACI10068-LP', ipAddress: '20.0.20.32', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'ncx cjx', bucket: 'Missing' },
  { id: 'AGENT-350', hostName: 'DESKTOP-1P8YT', ipAddress: '192.168.177.20', poller: '---', createdBy: 'default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'OMAN', bucket: 'Missing' },
  { id: 'AGENT-349', hostName: 'DESKTOP-1KQZ9', ipAddress: '10.59.98.96', poller: '---', createdBy: 'default', osName: 'Microsoft Windows 11 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'OMAN', bucket: 'Missing' },

  { id: 'AGENT-311', hostName: 'FIN-LT-0188', ipAddress: '10.20.22.188', poller: 'Default', createdBy: 'Priya Nair', osName: 'Microsoft Windows 11 Pro', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: 'Priya Nair', systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Installed' },
  { id: 'AGENT-305', hostName: 'SAL-LT-0204', ipAddress: '10.20.23.204', poller: 'Default', createdBy: 'Ananya Iyer', osName: 'Microsoft Windows 10 Enterprise', version: '8.7.408', servicePack: 'None', architecture: '64 BIT', usedBy: 'Ananya Iyer', systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Installed' },
  { id: 'AGENT-298', hostName: 'ENG-LT-0312', ipAddress: '10.20.19.112', poller: 'Default', createdBy: 'Karan Malhotra', osName: 'Microsoft Windows 11 Pro', version: '8.7.404', servicePack: 'None', architecture: '64 BIT', usedBy: 'Karan Malhotra', systemHealth: 'Healthy', remoteOffice: 'OMAN', bucket: 'Installed' },
  { id: 'AGENT-284', hostName: 'DC1-APP-01', ipAddress: '10.20.40.21', poller: 'Default', createdBy: 'System', osName: 'Microsoft Windows Server 2019', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Installed' },
  { id: 'AGENT-277', hostName: 'DC1-DB-01', ipAddress: '10.20.40.33', poller: 'Default', createdBy: 'System', osName: 'Microsoft Windows Server 2022', version: '8.7.301', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Healthy', remoteOffice: 'ncx cjx', bucket: 'Installed' },

  { id: 'AGENT-260', hostName: 'REC-DT-0023', ipAddress: '10.20.21.23', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: 'Critical', remoteOffice: 'OMAN', bucket: 'Ignored' },
  { id: 'AGENT-241', hostName: 'SUP-LT-0108', ipAddress: '10.20.24.108', poller: '---', createdBy: 'Rahul Verma', osName: 'Microsoft Windows 11 Pro', version: '8.6.300', servicePack: 'None', architecture: '64 BIT', usedBy: 'Rahul Verma', systemHealth: null, remoteOffice: 'ncx cjx', bucket: 'Ignored' },
  { id: 'AGENT-233', hostName: 'OFC-PRT-0207', ipAddress: '10.20.30.207', poller: '---', createdBy: 'Default', osName: 'Microsoft Windows 10 Pro', version: '8.6.101', servicePack: 'None', architecture: '64 BIT', usedBy: null, systemHealth: null, remoteOffice: 'OMAN', bucket: 'Ignored' },
];

/* --- Installation (deployment) records: agents this patch has been pushed to. --------------- */
export type InstallationStatus = 'Yet to Receive' | 'In Progress' | 'Success' | 'Failed';

export interface PatchInstallation {
  id: string;
  agentId: string;
  hostName: string;
  ipAddress: string;
  configType: string;
  deploymentDate: string;
  installationStatus: InstallationStatus;
  retryStatus: number;
  downloadStatus: string;
  taskType: string;
}

// Three deployments, one per status (Yet to Receive / Success / Failed) to show each style.
export const INITIAL_INSTALLATIONS: PatchInstallation[] = [
  { id: 'INST-AGENT-380', agentId: 'AGENT-380', hostName: 'ACIWSUSV-01', ipAddress: '192.168.1.13', configType: 'Install', deploymentDate: '---', installationStatus: 'Yet to Receive', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-AGENT-397', agentId: 'AGENT-397', hostName: 'Jevyjava-LT', ipAddress: '192.168.112.75', configType: 'Install', deploymentDate: 'Mon, Jul 20, 2026 04:58 PM', installationStatus: 'Success', retryStatus: 0, downloadStatus: 'Success', taskType: 'Manual Remote Deployment' },
  { id: 'INST-AGENT-400', agentId: 'AGENT-400', hostName: 'PARTH-UPADHYAY', ipAddress: '192.168.1.75', configType: 'Install', deploymentDate: 'Mon, Jul 20, 2026 03:40 PM', installationStatus: 'Failed', retryStatus: 2, downloadStatus: 'Failed', taskType: 'Manual Remote Deployment' },
];

const BUCKETS: Bucket[] = ['Missing', 'Installed', 'Ignored'];

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

interface PatchComputersTabProps {
  computers: PatchComputer[];
  setComputers: Dispatch<SetStateAction<PatchComputer[]>>;
  /** Install the given agents — creates deployment records in the Installation tab. */
  onInstall: (agentIds: string[]) => void;
}

export function PatchComputersTab({ computers, setComputers, onInstall }: PatchComputersTabProps) {
  const [bucket, setBucket] = useState<Bucket>('Missing');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  // Bulk actions on the selected rows.
  const moveSelected = (to: Bucket, verb: string) => {
    const n = selected.size;
    setComputers((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, bucket: to } : c)));
    clearSelection();
    toast.success(`${n} computer${n > 1 ? 's' : ''} ${verb}`);
  };
  // Install Patch → push a deployment to the selected agents (they show up in the Installation
  // tab). The device stays "Missing" until its installation status turns Success.
  const installSelected = () => {
    onInstall(Array.from(selected));
    clearSelection();
  };
  const deleteSelected = () => {
    const n = selected.size;
    setComputers((prev) => prev.filter((c) => !selected.has(c.id)));
    clearSelection();
    toast.error(`${n} computer${n > 1 ? 's' : ''} removed`);
  };
  const notify = (msg: string) => { const n = selected.size; clearSelection(); toast.success(`${n} computer${n > 1 ? 's' : ''} — ${msg}`); };

  // Bulk actions available for the current bucket. `tone` drives styling; `danger` sorts last.
  type BulkAction = { key: string; label: string; icon: LucideIcon; tone?: 'primary' | 'danger'; buckets: Bucket[]; run: () => void };
  const ALL_ACTIONS: BulkAction[] = [
    { key: 'install', label: 'Install Patch', icon: Download, tone: 'primary', buckets: ['Missing', 'Ignored'], run: installSelected },
    { key: 'uninstall', label: 'Uninstall Patch', icon: RotateCcw, tone: 'primary', buckets: ['Installed'], run: () => moveSelected('Missing', 'marked as uninstalled') },
    { key: 'restore', label: 'Restore', icon: RotateCcw, buckets: ['Ignored'], run: () => moveSelected('Missing', 'restored') },
    { key: 'deploy', label: 'Add to Deployment', icon: PackagePlus, buckets: ['Ignored'], run: () => notify('added to deployment') },
    { key: 'scan', label: 'Scan Now', icon: ScanLine, buckets: ['Installed', 'Ignored'], run: () => notify('scan started') },
    { key: 'reboot', label: 'Reboot Computer', icon: Power, buckets: ['Installed', 'Ignored'], run: () => notify('reboot scheduled') },
    { key: 'export', label: 'Export Selected', icon: FileDown, buckets: ['Installed', 'Ignored'], run: () => notify('exported') },
    { key: 'delete', label: 'Delete', icon: Trash2, tone: 'danger', buckets: ['Missing', 'Installed', 'Ignored'], run: deleteSelected },
  ];
  // All bulk actions for the current bucket, shown in the single "Take Action" menu.
  const actions = ALL_ACTIONS.filter((a) => a.buckets.includes(bucket));

  const counts: Record<Bucket, number> = { Missing: 0, Installed: 0, Ignored: 0 };
  computers.forEach((c) => { counts[c.bucket] += 1; });

  const q = search.trim().toLowerCase();
  const rows = computers.filter((c) => c.bucket === bucket).filter((c) =>
    !q ||
    c.id.toLowerCase().includes(q) ||
    c.hostName.toLowerCase().includes(q) ||
    c.ipAddress.toLowerCase().includes(q) ||
    c.osName.toLowerCase().includes(q) ||
    (c.usedBy ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="px-6 py-4">
      {/* Filter pills — Missing / Installed / Ignored (Relations-tab pill style) */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {BUCKETS.map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[13px] font-medium transition-colors ${bucket === b ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            {b}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${bucket === b ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
              {counts[b]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Add button */}
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
        {/* Add button — only for the Missing bucket */}
        {bucket === 'Missing' && (
          <button className="flex h-[36px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0] flex-shrink-0">
            <Plus size={15} />
            Add Missing Computer
          </button>
        )}
      </div>

      {/* Bulk-action bar — appears when rows are selected. Single "Take Action" menu holds every
          action (scales to any number), with a selected-count chip + "Unselect all". */}
      {selected.size > 0 && (
        <div className="animate-slide-up mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[#E3E8EF] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_6px_rgba(16,24,40,0.06)]">
          {/* Take Action dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMore((v) => !v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors ${showMore ? 'border-[#3D8BD0] bg-[#F8FAFC]' : 'border-[#DFE5ED] hover:bg-[#F5F7FA]'}`}
            >
              Take Action <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="absolute left-0 top-full mt-1 z-50 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
                  {actions.map((a) => (
                    <div key={a.key}>
                      {a.tone === 'danger' && <div className="my-1 border-t border-[#F0F2F5]" />}
                      <button
                        onClick={() => { a.run(); setShowMore(false); }}
                        className={`w-full px-4 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 ${a.tone === 'danger' ? 'text-[#DC2626] hover:bg-[#FEF3F2]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                      >
                        <span className={`flex-shrink-0 ${a.tone === 'danger' ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}><a.icon size={15} /></span>
                        <span className="flex-1">{a.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Selected count + Unselect all */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#EAF2FB] text-[#3D8BD0] text-[12px] font-semibold tabular-nums">{selected.size}</span>
            <span className="text-[#64748B]">{selected.size === 1 ? 'record' : 'records'} selected</span>
            <span className="h-4 w-px bg-[#E3E8EF]" />
            <button onClick={clearSelection} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">Unselect all</button>
          </div>
        </div>
      )}

      {/* Table — standard borderless style (matches the other detail-page tabs) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1500px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <th className="w-[40px] px-4 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((c) => selected.has(c.id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((c) => c.id)) : new Set())}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </th>
              {['Agent ID', 'Host Name', 'IP Address', 'Poller', 'Agent Created By', 'OS Name', 'Version', 'Service Pack', 'Architecture', 'Used By', 'System Health', 'Remote Office', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {rows.length === 0 ? (
              <tr><td colSpan={14} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No {bucket.toLowerCase()} computers found.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={(e) => toggleRow(c.id, e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                </td>
                {/* Agent ID with health dot */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full flex-shrink-0 bg-[#EAB308]" />
                    <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{c.id}</button>
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[130px] truncate">{c.hostName}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.ipAddress}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.poller === '---' ? <Dash /> : c.poller}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.createdBy === '---' ? <Dash /> : c.createdBy}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[160px] truncate">{c.osName}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.version}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.servicePack === '---' ? <Dash /> : c.servicePack}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.architecture === '---' ? <Dash /> : c.architecture}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  {c.usedBy ? (
                    <span className="inline-flex items-center gap-1.5 text-[#3D8BD0]"><User size={12} className="text-[#9ca3af]" /><span className="max-w-[120px] truncate">{c.usedBy}</span></span>
                  ) : <Dash />}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  {c.systemHealth ? (
                    <span className="inline-flex items-center gap-1.5 text-[#364658]">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.systemHealth === 'Healthy' ? '#22C55E' : '#EF4444' }} />
                      {c.systemHealth}
                    </span>
                  ) : <Dash />}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  {c.remoteOffice ? (
                    <span className="inline-block rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">{c.remoteOffice}</span>
                  ) : <Dash />}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    title="Remove"
                    onClick={() => { setComputers((prev) => prev.filter((x) => x.id !== c.id)); setSelected((prev) => { const n = new Set(prev); n.delete(c.id); return n; }); toast.error(`${c.id} removed`); }}
                    className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
