import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Search, Filter, Laptop, Server, Monitor as MonitorIcon, HardDrive, User, Pin as PinIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/** Asset detail values used to seed the editable asset field dropdowns. */
export interface AssetFieldValues {
  id?: string;
  assetType: string;
  status: string;
  impact: string;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string };
}

/** Controlled state (values + setters) for the editable asset fields. */
export interface AssetFieldState {
  assetType: string; setAssetType: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  impact: string; setImpact: (v: string) => void;
  managedByGroup: string; setManagedByGroup: (v: string) => void;
  managedBy: { name: string; initials?: string; color?: string };
  setManagedBy: (v: { name: string; initials?: string; color?: string }) => void;
}

/** Field labels in display order — also used for pinning and search matching. */
export const ASSET_FIELD_LABELS = ['Asset Type', 'Status', 'Impact', 'Managed By Group', 'Managed By'];

/** Values shown in the Agent Information block (replaces Requester Information on the asset page). */
export interface AgentInfo {
  id: string;
  hostName: string;
  hostStatusColor?: string;
  ipAddress: string;
  poller: string;
  os: string;
  version: string;
  domainName: string;
  lastSyncDate: string;
}

/** Field labels in the Agent Information block — used for search matching. */
export const AGENT_FIELD_LABELS = ['ID', 'Host Name', 'IP Address', 'Poller', 'OS', 'Version', 'Domain Name', 'Agent Last Sync Date'];

export const STATUS_OPTIONS = [
  { label: 'In Stock', color: '#9CA3AF' },
  { label: 'In Use', color: '#22C55E' },
  { label: 'Missing', color: '#EF4444' },
  { label: 'Retired', color: '#EAB308' },
];

export const IMPACT_OPTIONS = [
  { label: 'Low', color: '#22C55E' },
  { label: 'On Users', color: '#EAB308' },
  { label: 'On Department', color: '#F59E0B' },
  { label: 'On Business', color: '#EF4444' },
];

const GROUP_OPTIONS = [
  'Unassigned',
  'Network Operations Group',
  'IT Support Group',
  'General Support Group',
  'Change Advisory Board (CAB)',
  'HR Support Group',
  'Emergency Change Advisory Board (ECAB)',
  'Hardware Support Team',
  'Software Support Team',
];

interface ManagerOption { name: string; email: string; initials: string; color: string; }
const MANAGER_OPTIONS: ManagerOption[] = [
  { name: 'Kavit Gohel',       email: 'kavit.gohel@motadata.com',      initials: 'KG', color: '#22C55E' },
  { name: 'vaibhav prajapati', email: 'vaibhav.prajapati@motadata.com', initials: 'VP', color: '#3D8BD0' },
  { name: 'hemal',             email: 'hemal.parmar@motadata.com',      initials: 'HE', color: '#3D8BD0' },
  { name: 'Tabrez',            email: 'tabrez@rasinfotech-dubai.com',   initials: 'TA', color: '#10B981' },
  { name: 'Udit',              email: 'udit.hotchandani@motadata.com',  initials: 'UD', color: '#8B5CF6' },
  { name: 'Rosy',              email: 'rosy.cordeiro@motadata.com',     initials: 'RO', color: '#EC4899' },
  { name: 'Hardik',            email: 'hardik.prajapati@motadata.com',  initials: 'HA', color: '#EF4444' },
  { name: 'Navin Gadhvi',      email: 'navin.gadhvi@smgsuzuki.co.in',   initials: 'NG', color: '#14B8A6' },
  { name: 'dhaval',            email: 'dhaval.zala@motadata.com',       initials: 'DH', color: '#64748B' },
  { name: 'naitik',            email: 'naitik.piparia@motadata.com',    initials: 'NA', color: '#A78BFA' },
  { name: 'Sridhar',           email: 'sridhar@techfruitspl.com',       initials: 'SR', color: '#0EA5E9' },
  { name: 'Abhishek Tiwari',   email: 'abhishek.tiwari@motadata.com',   initials: 'AT', color: '#F59E0B' },
  { name: 'Training',          email: 'training@motadata.com',          initials: 'TR', color: '#6366F1' },
  { name: 'Ryan',              email: 'ryan.cronje@corrserve.co.za',    initials: 'RY', color: '#22C55E' },
  { name: 'Jay Vegda',         email: 'jay.vegda@motadata.com',         initials: 'JV', color: '#14B8A6' },
  { name: 'Rakesh Rathod',     email: 'rakesh.rathod@motadata.com',     initials: 'RR', color: '#EF4444' },
  { name: 'Parita',            email: 'parita.kumbhani@motadata.com',   initials: 'PA', color: '#A78BFA' },
  { name: 'sanat',             email: 'sanat.patel@motadata.com',       initials: 'SA', color: '#F97316' },
  { name: 'Sakshi',            email: 'sakshi.sudhani@motadata.com',    initials: 'SA', color: '#EC4899' },
];

/** Asset type categories, shown as an expandable tree with search. */
const TYPE_TREE: { label: string; children: string[] }[] = [
  { label: 'Hardware',     children: ['Monitor', 'Projector', 'Scanner', 'Windows Laptop', 'Mac Laptop', 'Windows Desktop'] },
  { label: 'Public Cloud', children: ['AWS Instance', 'Azure VM', 'GCP Instance'] },
  { label: 'Storage',      children: ['SAN', 'NAS'] },
  { label: 'DataCenter',   children: ['HyperV Server', 'UNIX Server'] },
  { label: 'Mobile Device', children: ['iOS Device', 'Android Device'] },
  { label: 'SNMP Devices', children: ['Router', 'Switch', 'Firewall'] },
];

export function assetTypeIcon(type?: string) {
  switch (type) {
    case 'Mac Laptop':
    case 'Windows Laptop':
      return <Laptop size={14} />;
    case 'HyperV Server':
    case 'UNIX Server':
      return <Server size={14} />;
    case 'Windows Desktop':
    case 'Monitor':
      return <MonitorIcon size={14} />;
    default:
      return <HardDrive size={14} />;
  }
}

/** Read-only value indicator for a single asset field (used in the Pinned Fields section). */
export function AssetValueDisplay({ field, state }: { field: string; state: AssetFieldState }) {
  switch (field) {
    case 'Asset Type':
      return (
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">{assetTypeIcon(state.assetType)}</span>
          <span className="text-[13px] text-[#364658]">{state.assetType}</span>
        </div>
      );
    case 'Status': {
      const color = STATUS_OPTIONS.find((o) => o.label === state.status)?.color || '#9CA3AF';
      return (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[13px] text-[#364658]">{state.status}</span>
        </div>
      );
    }
    case 'Impact': {
      const color = IMPACT_OPTIONS.find((o) => o.label === state.impact)?.color || '#9CA3AF';
      return (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[13px] text-[#364658]">{state.impact}</span>
        </div>
      );
    }
    case 'Managed By Group':
      return <span className="text-[13px] text-[#364658]">{state.managedByGroup}</span>;
    case 'Managed By':
      return (
        <div className="flex items-center gap-2">
          {state.managedBy.initials ? (
            <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: state.managedBy.color || '#9CA3AF' }}>{state.managedBy.initials}</span>
          ) : (
            <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
          )}
          <span className="text-[13px] text-[#364658]">{state.managedBy.name}</span>
        </div>
      );
    default:
      return <span className="text-[13px] text-[#364658]">-</span>;
  }
}

const menuClass = 'absolute top-full right-0 mt-1 w-full min-w-[260px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50';
const optionClass = 'w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors';
const triggerClass = 'w-full pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left truncate';

const SearchBox = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="px-3 pb-2">
    <div className="relative">
      <input
        type="text"
        placeholder="Search"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
      />
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
    </div>
  </div>
);

/** Field row with a label + hover pin button (mirrors the ticket field rows). */
const FieldRow = ({ label, pinned, onPin, children }: { label: string; pinned: boolean; onPin: () => void; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="flex items-center">
            <PinIcon size={14} className={`transition-opacity ${pinned ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{pinned ? 'Unpin this field' : 'Pin this field on top'}</TooltipContent>
      </Tooltip>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

type Field = 'type' | 'status' | 'impact' | 'group' | 'manager' | null;

interface AssetFieldsProps {
  state: AssetFieldState;
  pinnedFields: string[];
  togglePinField: (field: string) => void;
  propertiesSearchQuery: string;
}

export function AssetFields({ state, pinnedFields, togglePinField, propertiesSearchQuery }: AssetFieldsProps) {
  const { assetType, setAssetType, status, setStatus, impact, setImpact, managedByGroup, setManagedByGroup, managedBy, setManagedBy } = state;

  const [open, setOpen] = useState<Field>(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Hardware']));

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = (f: Field) => setOpen((cur) => (cur === f ? null : f));

  // A field shows here only when it is not pinned (pinned fields move to the Pinned Fields section)
  // and when it matches the active properties search query.
  const q = propertiesSearchQuery.trim().toLowerCase();
  const show = (label: string) => !pinnedFields.includes(label) && (!q || label.toLowerCase().includes(q));

  const statusColor = STATUS_OPTIONS.find((o) => o.label === status)?.color || '#9CA3AF';
  const impactColor = IMPACT_OPTIONS.find((o) => o.label === impact)?.color || '#9CA3AF';

  const filteredStatus = STATUS_OPTIONS.filter((o) => o.label.toLowerCase().includes(statusSearch.toLowerCase()));
  const filteredGroups = GROUP_OPTIONS.filter((o) => o.toLowerCase().includes(groupSearch.toLowerCase()));
  const filteredManagers = MANAGER_OPTIONS.filter(
    (o) => o.name.toLowerCase().includes(managerSearch.toLowerCase()) || o.email.toLowerCase().includes(managerSearch.toLowerCase())
  );
  const typeQuery = typeSearch.trim().toLowerCase();

  return (
    <div className="px-4 pb-4 space-y-2" ref={ref}>
      {/* Asset Type */}
      {show('Asset Type') && (
      <FieldRow label="Asset Type" pinned={pinnedFields.includes('Asset Type')} onPin={() => togglePinField('Asset Type')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none z-10">{assetTypeIcon(assetType)}</span>
          <button className={`${triggerClass} pl-9`} title={assetType} onClick={() => toggle('type')}>{assetType || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'type' && (
            <div className={menuClass}>
              <SearchBox value={typeSearch} onChange={setTypeSearch} />
              <div className="max-h-[280px] overflow-y-auto">
                {typeQuery
                  ? TYPE_TREE.flatMap((g) => g.children).filter((c) => c.toLowerCase().includes(typeQuery)).map((leaf) => (
                      <button key={leaf} className={`${optionClass} pl-6`} onClick={() => { setAssetType(leaf); setOpen(null); setTypeSearch(''); }}>
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[#6B7280] flex-shrink-0">{assetTypeIcon(leaf)}</span>
                          <span className="text-[13px] text-[#364658] truncate">{leaf}</span>
                        </span>
                        {assetType === leaf && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                    ))
                  : TYPE_TREE.map((g) => (
                      <div key={g.label}>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => setExpanded((s) => { const n = new Set(s); n.has(g.label) ? n.delete(g.label) : n.add(g.label); return n; })}
                        >
                          {expanded.has(g.label) ? <ChevronDown size={14} className="text-[#7B8FA5] flex-shrink-0" /> : <ChevronRight size={14} className="text-[#7B8FA5] flex-shrink-0" />}
                          <span className="text-[#6B7280] flex-shrink-0"><HardDrive size={14} /></span>
                          <span className="text-[13px] text-[#364658] truncate">{g.label}</span>
                        </button>
                        {expanded.has(g.label) && g.children.map((leaf) => (
                          <button key={leaf} className={`${optionClass} pl-10`} onClick={() => { setAssetType(leaf); setOpen(null); setTypeSearch(''); }}>
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[#6B7280] flex-shrink-0">{assetTypeIcon(leaf)}</span>
                              <span className="text-[13px] text-[#364658] truncate">{leaf}</span>
                            </span>
                            {assetType === leaf && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Status */}
      {show('Status') && (
      <FieldRow label="Status" pinned={pinnedFields.includes('Status')} onPin={() => togglePinField('Status')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: statusColor }} />
          <button className={`${triggerClass} pl-6`} title={status} onClick={() => toggle('status')}>{status || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'status' && (
            <div className={menuClass}>
              <SearchBox value={statusSearch} onChange={setStatusSearch} />
              {filteredStatus.map((o) => (
                <button key={o.label} className={optionClass} onClick={() => { setStatus(o.label); setOpen(null); setStatusSearch(''); }}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <span className="text-[13px] text-[#364658] truncate">{o.label}</span>
                  </span>
                  {status === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Impact */}
      {show('Impact') && (
      <FieldRow label="Impact" pinned={pinnedFields.includes('Impact')} onPin={() => togglePinField('Impact')}>
        <div className="group relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10" style={{ backgroundColor: impactColor }} />
          <button className={`${triggerClass} pl-6`} title={impact} onClick={() => toggle('impact')}>{impact || 'Select'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'impact' && (
            <div className={menuClass}>
              {IMPACT_OPTIONS.map((o) => (
                <button key={o.label} className={optionClass} onClick={() => { setImpact(o.label); setOpen(null); }}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <span className="text-[13px] text-[#364658] truncate">{o.label}</span>
                  </span>
                  {impact === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Managed By Group */}
      {show('Managed By Group') && (
      <FieldRow label="Managed By Group" pinned={pinnedFields.includes('Managed By Group')} onPin={() => togglePinField('Managed By Group')}>
        <div className="group relative">
          <button className={`${triggerClass} pl-3`} title={managedByGroup} onClick={() => toggle('group')}>{managedByGroup}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'group' && (
            <div className={menuClass}>
              <SearchBox value={groupSearch} onChange={setGroupSearch} />
              <div className="max-h-[280px] overflow-y-auto">
                {filteredGroups.map((o) => (
                  <button key={o} className={optionClass} onClick={() => { setManagedByGroup(o); setOpen(null); setGroupSearch(''); }}>
                    <span className="text-[13px] text-[#364658] truncate">{o}</span>
                    {managedByGroup === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}

      {/* Managed By */}
      {show('Managed By') && (
      <FieldRow label="Managed By" pinned={pinnedFields.includes('Managed By')} onPin={() => togglePinField('Managed By')}>
        <div className="group relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            {managedBy.initials ? (
              <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: managedBy.color || '#9CA3AF' }}>{managedBy.initials}</span>
            ) : (
              <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
            )}
          </span>
          <button className={`${triggerClass} pl-9`} title={managedBy.name} onClick={() => toggle('manager')}>{managedBy.name || 'Unassigned'}</button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'manager' && (
            <div className={menuClass}>
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    autoFocus
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
                <button className="flex-shrink-0 size-9 flex items-center justify-center rounded-md border border-[#E5E7EB] text-[#3D8BD0] hover:bg-[#F3F4F6]" title="Filter">
                  <Filter size={14} />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={() => { setManagedBy({ name: 'Unassigned' }); setOpen(null); setManagerSearch(''); }}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                    <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                  </span>
                  {managedBy.name === 'Unassigned' && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
                {filteredManagers.map((o) => (
                  <button
                    key={o.email}
                    className={optionClass}
                    onClick={() => { setManagedBy({ name: o.name, initials: o.initials, color: o.color }); setOpen(null); setManagerSearch(''); }}
                  >
                    <span className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                      <span className="text-[13px] text-[#364658] truncate">{o.name} ({o.email})</span>
                    </span>
                    {managedBy.name === o.name && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FieldRow>
      )}
    </div>
  );
}
