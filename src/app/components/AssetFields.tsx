import { useState, useRef, useEffect } from 'react';
import { DateField } from './DateField';
import { ChevronDown, ChevronUp, ChevronRight, Check, Search, Filter, Laptop, Server, Monitor as MonitorIcon, HardDrive, User, Pin as PinIcon, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/** Asset detail values used to seed the editable asset field dropdowns. */
export interface AssetFieldValues {
  id?: string;
  assetType: string;
  status: string;
  impact: string;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string };
  ci?: string;
}

/** Controlled state (values + setters) for the editable asset fields. */
export interface AssetFieldState {
  assetType: string; setAssetType: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  impact: string; setImpact: (v: string) => void;
  managedByGroup: string; setManagedByGroup: (v: string) => void;
  managedBy: { name: string; initials?: string; color?: string };
  setManagedBy: (v: { name: string; initials?: string; color?: string }) => void;
  ci?: string;
  // Software-asset only: the Software Type field (Managed / Discovered / Unmanaged).
  softwareType?: string;
  setSoftwareType?: (v: string) => void;
  // Software-license only: Product (read-only) + License Type (editable dropdown).
  product?: string;
  licenseType?: string;
  setLicenseType?: (v: string) => void;
  // Values for the "View more" additional fields, keyed by field label.
  extra?: Record<string, string>;
  setExtra?: (v: Record<string, string>) => void;
}

export const SOFTWARE_TYPE_OPTIONS = ['Managed', 'Discovered', 'Unmanaged'];

export const LICENSE_TYPE_OPTIONS = [
  'Single Machine', 'Multiple Machines', 'Unlimited Machines', 'Node Locked',
  'Single User', 'Volume Users', 'Unlimited Users', 'Enterprise-Perpetual',
  'OEM', 'Free License', 'Enterprise Subscription',
];

export const CONTRACT_TYPE_OPTIONS = ['Lease', 'Warranty', 'Maintenance', 'Support'];

/** Purchase order status options (dot color per status). */
export const PURCHASE_STATUS_OPTIONS = [
  { label: 'Generated', color: '#3D8BD0' },
  { label: 'Sent For Approval', color: '#D97706' },
  { label: 'Approved', color: '#22C55E' },
  { label: 'Ordered', color: '#8B5CF6' },
  { label: 'Partially Received', color: '#9CA3AF' },
  { label: 'Received', color: '#16A34A' },
];

export const COST_CENTER_OPTIONS = ['IT Operations', 'Procurement', 'Finance', 'Infrastructure', 'Administration'];

/** User options for the contract Owner picker (mirrors the ticket Assignee dropdown). */
const OWNER_OPTIONS: { name: string; initials: string; color: string; status: string }[] = [
  { name: 'Sarah Johnson', initials: 'SJ', color: '#3D8BD0', status: '#22C55E' },
  { name: 'Michael Chen', initials: 'MC', color: '#8B5CF6', status: '#22C55E' },
  { name: 'Emma Wilson', initials: 'EW', color: '#EC4899', status: '#F59E0B' },
  { name: 'David Kim', initials: 'DK', color: '#64748B', status: '#9CA3AF' },
  { name: 'Lisa Anderson', initials: 'LA', color: '#22C55E', status: '#22C55E' },
];

/** Field labels in display order — also used for pinning and search matching. */
export const ASSET_FIELD_LABELS = [
  'Asset Type', 'Status', 'Impact', 'Managed By Group', 'Managed By', 'CI',
  'Asset Group', 'Product', 'Used By', 'Location', 'Category', 'Department',
  'Host Name', 'Domain Name', 'UUID', 'IP Address', 'MAC Address', 'Subnet Mask',
  'Vendor', 'Asset Condition', 'Movement Status', 'Under Change Control',
  'Business Service', 'Origin', 'Acquisition Date', 'Assignment Date',
];

/** Labels rendered behind the "View more" toggle, with the input type to use for each. */
export const ASSET_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Hemal Patel', 'John Doe', 'Jane Smith', 'Ravi Kumar', 'Sara Lee'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Category', type: 'select', options: ['Hardware', 'Software', 'Network Device', 'Peripheral'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Host Name', type: 'editable' },
  { label: 'Domain Name', type: 'editable' },
  { label: 'UUID', type: 'editable' },
  { label: 'IP Address', type: 'editable' },
  { label: 'MAC Address', type: 'editable' },
  { label: 'Subnet Mask', type: 'editable' },
  { label: 'Vendor', type: 'select', options: ['Lenovo', 'Dell', 'HP', 'Apple', 'Microsoft'] },
  { label: 'Asset Condition', type: 'select', options: ['Good', 'Fair', 'Poor', 'Damaged'] },
  { label: 'Movement Status', type: 'select', options: ['None', 'In Transit', 'Delivered', 'Returned'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for CMDB CIs — CI Group instead of Asset Group; no Category /
 * Asset Condition / Movement Status / Under Change Control / Acquisition Date. */
export const CMDB_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'CI Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Hemal Patel', 'John Doe', 'Jane Smith', 'Ravi Kumar', 'Sara Lee'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Host Name', type: 'editable' },
  { label: 'Domain Name', type: 'editable' },
  { label: 'UUID', type: 'editable' },
  { label: 'IP Address', type: 'editable' },
  { label: 'MAC Address', type: 'editable' },
  { label: 'Subnet Mask', type: 'editable' },
  { label: 'Vendor', type: 'select', options: ['Lenovo', 'Dell', 'HP', 'Apple', 'Microsoft'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for Non-IT assets — like ASSET_MORE_FIELDS but without the network fields (Host Name/IP/MAC/…) and with a Last-Scan field. */
export const NONIT_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Used By', type: 'select', options: ['Neha Raje', 'Farah Sheikh', 'Rohan Mehta', 'Priya Nair', 'Vikram Sethi'] },
  { label: 'Location', type: 'location', options: ['KRISHNAPATNAM', 'AHMEDABAD', 'MUMBAI', 'DELHI', 'BANGALORE'] },
  { label: 'Category', type: 'select', options: ['Furniture', 'Fixtures', 'Office Equipment', 'Appliance', 'Pantry'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Facilities'] },
  { label: 'Vendor', type: 'select', options: ['Herman Miller', 'Steelcase', 'IKEA', 'Godrej', 'Test vendor'] },
  { label: 'Asset Condition', type: 'select', options: ['None', 'Good', 'Fair', 'Poor', 'Damaged'] },
  { label: 'Movement Status', type: 'select', options: ['None', 'In Transit', 'Delivered', 'Returned'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** "View more" fields for Software assets — Version + Software Category; no network/Used By/Location fields. */
export const SOFTWARE_MORE_FIELDS: { label: string; type: 'static' | 'select' | 'editable' | 'date' | 'location'; options?: string[] }[] = [
  { label: 'Asset Group', type: 'static' },
  { label: 'Product', type: 'static' },
  { label: 'Version', type: 'editable' },
  { label: 'Category', type: 'select', options: ['Application', 'Operating System', 'Utility', 'Driver', 'Middleware'] },
  { label: 'Software Category', type: 'select', options: ['Managed', 'Unmanaged', 'Prohibited', 'Freeware', 'Shareware'] },
  { label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Sales'] },
  { label: 'Vendor', type: 'select', options: ['Microsoft', 'Adobe', 'Google', 'Oracle', 'Atlassian'] },
  { label: 'Under Change Control', type: 'select', options: ['Yes', 'No'] },
  { label: 'Business Service', type: 'select', options: ['Core Banking', 'Payments', 'CRM', 'ERP'] },
  { label: 'Origin', type: 'static' },
  { label: 'Acquisition Date', type: 'date' },
  { label: 'Assignment Date', type: 'date' },
];

/** Labels whose label text is shown in red (required-style emphasis). Empty — all labels use the standard gray. */
const ASSET_REQUIRED_LABELS: string[] = [];

/** Values shown in the Agent Information block (replaces Requester Information on the asset page). */
export interface AgentInfo {
  id: string;
  /** Agent name (e.g. AGENT-417) shown as the Agent Information header */
  agentName?: string;
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
    case 'CI':
      return state.ci
        ? <span className="text-[13px] text-[#3D8BD0] cursor-pointer hover:underline">{state.ci}</span>
        : <span className="text-[13px] text-[#9CA3AF]">---</span>;
    case 'Software Type':
      return <span className="text-[13px] text-[#364658]">{state.softwareType || '---'}</span>;
    default:
      if (state.extra && field in state.extra) {
        const v = state.extra[field];
        return v
          ? <span className="text-[13px] text-[#364658]">{v}</span>
          : <span className="text-[13px] text-[#9CA3AF]">---</span>;
      }
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
const FieldRow = ({ label, pinned, onPin, children, labelColor }: { label: string; pinned: boolean; onPin: () => void; children: React.ReactNode; labelColor?: string }) => (
  <div className="flex items-center justify-between gap-3">
    <div className={`text-[12px] flex-shrink-0 w-[120px] group/label flex items-center gap-1 ${labelColor ? '' : 'text-[#4A5568]'}`} style={labelColor ? { color: labelColor } : undefined}>
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

type Field = string | null;

interface AssetFieldsProps {
  state: AssetFieldState;
  pinnedFields: string[];
  togglePinField: (field: string) => void;
  propertiesSearchQuery: string;
  // Software-asset variant: shows Software Type and hides CI / "View more" extras.
  softwareMode?: boolean;
  // Non-IT variant: like softwareMode (CI / "View more" hidden) but WITHOUT the software-only Software Type field.
  nonItMode?: boolean;
  // Software-license variant: shows ONLY Product (read-only) + License Type (dropdown).
  licenseMode?: boolean;
  // Contract variant: shows ONLY the contract fields (number/dates/cost/type/vendor).
  contractMode?: boolean;
  // Purchase variant: shows ONLY the purchase fields (status/order number/cost/cost center/dates).
  purchaseMode?: boolean;
  // Patch variant: shows ONLY the patch fields (category/severity/approval/test/release date/…).
  patchMode?: boolean;
  // CMDB variant: display-label swaps only — 'Asset Type' → 'CI Type', 'CI' → 'Asset'.
  cmdbMode?: boolean;
  // Extra content (the System Fields subsection) rendered at the bottom of the
  // "View more" expansion — so ONE "View more" reveals both the extra fields AND system fields.
  footer?: React.ReactNode;
}

export function AssetFields({ state, pinnedFields, togglePinField, propertiesSearchQuery, softwareMode = false, nonItMode = false, licenseMode = false, contractMode = false, purchaseMode = false, patchMode = false, cmdbMode = false, footer }: AssetFieldsProps) {
  const { assetType, setAssetType, status, setStatus, impact, setImpact, managedByGroup, setManagedByGroup, managedBy, setManagedBy, ci } = state;
  const softwareType = state.softwareType ?? '';
  const setSoftwareType = state.setSoftwareType ?? (() => {});
  const licenseType = state.licenseType ?? '';
  const setLicenseType = state.setLicenseType ?? (() => {});
  const extra = state.extra ?? {};
  const setExtra = state.setExtra ?? (() => {});

  const [open, setOpen] = useState<Field>(null);
  const [showMore, setShowMore] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [licenseTypeSearch, setLicenseTypeSearch] = useState('');
  const [contractTypeSearch, setContractTypeSearch] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [owner, setOwner] = useState<{ name: string; initials: string; color: string } | null>(OWNER_OPTIONS[0]);
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

  // --- "View more" additional-field renderers (label/input/dropdown match the core asset rows) ---
  const updateExtra = (label: string, value: string) => setExtra({ ...extra, [label]: value });
  const labelColorFor = (label: string) => (!nonItMode && !softwareMode && ASSET_REQUIRED_LABELS.includes(label) ? '#C0392B' : undefined);

  const renderStatic = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <span className="text-[13px] text-[#364658] px-3 py-2 block truncate">{extra[label] || '---'}</span>
    </FieldRow>
  );

  const renderEditable = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      {editingField === label ? (
        <input
          autoFocus
          value={extra[label] || ''}
          onChange={(e) => updateExtra(label, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
          className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
        />
      ) : (
        <div className="group/edit relative flex items-center">
          <span className="text-[13px] text-[#364658] px-3 py-2 truncate flex-1">{extra[label] || '---'}</span>
          <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity">
            <Edit size={14} />
          </button>
        </div>
      )}
    </FieldRow>
  );

  const renderSelect = (label: string, options: string[], showSubline = false) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <div className="group relative">
        <button className={`${triggerClass} pl-3`} title={extra[label]} onClick={() => toggle(label)}>
          {extra[label] ? <span className="truncate">{extra[label]}</span> : <span className="text-[#9CA3AF]">Select</span>}
        </button>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        {showSubline && extra[label] && <div className="text-[11px] text-[#3D8BD0] px-3 pt-0.5 truncate">{extra[label]}</div>}
        {open === label && (
          <div className={menuClass}>
            <div className="max-h-[280px] overflow-y-auto">
              {options.map((o) => (
                <button key={o} className={optionClass} onClick={() => { updateExtra(label, o); setOpen(null); }}>
                  <span className="text-[13px] text-[#364658] truncate">{o}</span>
                  {extra[label] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldRow>
  );

  const renderDate = (label: string) => (
    <FieldRow key={label} label={label} pinned={pinnedFields.includes(label)} onPin={() => togglePinField(label)} labelColor={labelColorFor(label)}>
      <div className="relative group">
        <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
      </div>
    </FieldRow>
  );

  const renderMoreField = (f: { label: string; type: string; options?: string[] }) => {
    if (!show(f.label)) return null;
    switch (f.type) {
      case 'static': return renderStatic(f.label);
      case 'editable': return renderEditable(f.label);
      case 'select': return renderSelect(f.label, f.options || []);
      case 'location': return renderSelect(f.label, f.options || [], true);
      case 'date': return renderDate(f.label);
      default: return null;
    }
  };

  // Patch variant: patch-specific fields (category / severity / approval / test / release date, then
  // KB Number / Superseded / Bulletin Id / Reference Url under "View more").
  if (patchMode) {
    const PATCH_CATEGORY_OPTIONS = ['Updates', 'Security Updates', 'Critical Updates', 'Update Rollups', 'Feature Packs', 'Service Packs', 'Definition Updates', 'Drivers', 'Tools'];
    const PATCH_SEVERITY_OPTIONS = [
      { label: 'Critical', color: '#EF4444' },
      { label: 'Important', color: '#F59E0B' },
      { label: 'Moderate', color: '#EAB308' },
      { label: 'Low', color: '#111827' },
      { label: 'Unspecified', color: '#6B7280' },
    ];
    const PATCH_APPROVAL_OPTIONS = [
      { label: 'Approved', color: '#22C55E' },
      { label: 'Not Approved', color: '#F59E0B' },
      { label: 'Declined', color: '#DC2626' },
    ];
    const PATCH_TEST_OPTIONS = ['Not Tested', 'Tested', 'Passed', 'Failed', 'In Progress'];
    const YES_NO = ['Yes', 'No'];

    // Current value: the edited value from `extra`, else the seeded default.
    const cur = (label: string, def: string) => (extra[label] !== undefined && extra[label] !== '' ? extra[label] : def);

    const plainSelect = (label: string, options: string[], def: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="group relative">
            <button className={`${triggerClass} pl-3`} title={cur(label, def)} onClick={() => toggle(label)}>
              <span className="truncate">{cur(label, def)}</span>
            </button>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            {open === label && (
              <div className={menuClass}>
                <div className="max-h-[280px] overflow-y-auto">
                  {options.map((o) => (
                    <button key={o} className={optionClass} onClick={() => { updateExtra(label, o); setOpen(null); }}>
                      <span className="text-[13px] text-[#364658] truncate">{o}</span>
                      {cur(label, def) === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    const dotSelect = (label: string, options: { label: string; color: string }[], def: string) => {
      const curVal = cur(label, def);
      const curColor = options.find((o) => o.label === curVal)?.color || '#9CA3AF';
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
          <div className="flex-1 min-w-0">
            <div className="group relative">
              <button className="w-full pr-8 pl-3 py-2 flex items-center gap-2 text-[13px] text-[#364658] bg-transparent rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left" title={curVal} onClick={() => toggle(label)}>
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: curColor }} />
                <span className="truncate">{curVal}</span>
              </button>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              {open === label && (
                <div className={menuClass}>
                  <div className="max-h-[280px] overflow-y-auto">
                    {options.map((o) => (
                      <button key={o.label} className={optionClass} onClick={() => { updateExtra(label, o.label); setOpen(null); }}>
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                          <span className="text-[13px] text-[#364658] truncate">{o.label}</span>
                        </span>
                        {curVal === o.label && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    const textRow = (label: string, def = '') => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          {editingField === label ? (
            <input autoFocus value={extra[label] ?? def} onChange={(e) => updateExtra(label, e.target.value)} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }} className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
          ) : (
            <div className="group/edit relative flex items-center">
              <span className={`text-[13px] px-3 py-2 truncate flex-1 ${cur(label, def) && cur(label, def) !== '---' ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{cur(label, def) || '---'}</span>
              <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );

    const linkRow = (label: string, def: string) => {
      const v = cur(label, def);
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
          <div className="flex-1 min-w-0">
            {editingField === label ? (
              <input autoFocus value={extra[label] ?? def} onChange={(e) => updateExtra(label, e.target.value)} onBlur={() => setEditingField(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }} className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent" />
            ) : (
              <div className="group/edit relative flex items-center">
                {v && v !== '---' ? (
                  <a href={v} target="_blank" rel="noopener noreferrer" className="text-[13px] px-3 py-2 truncate flex-1 text-[#3D8BD0] hover:underline" onClick={(e) => e.stopPropagation()}>{v}</a>
                ) : (
                  <span className="text-[13px] px-3 py-2 truncate flex-1 text-[#9CA3AF]">---</span>
                )}
                <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const dateRow = (label: string, def: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <DateField value={extra[label] ?? def} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
          </div>
        </div>
      </div>
    );

    // Read-only informational fields shown after Reference Url (patch metadata / audit info).
    const PATCH_INFO_FIELDS: { label: string; value: string; link?: boolean; sub?: string }[] = [
      { label: 'UUID', value: 'win_rar-windows-x64-exe-7.20' },
      { label: 'Architecture', value: '64 BIT' },
      { label: 'Source', value: 'Patch Scanning' },
      { label: 'Status', value: 'Published' },
      { label: 'Download Status', value: 'Success' },
      { label: 'Download On', value: 'Mon, Jul 20, 2026 05:01 PM' },
      { label: 'Download Size', value: '3.77 MB' },
      { label: 'Reboot Required', value: 'No' },
      { label: 'Support Uninstallation', value: 'No' },
      { label: 'Approved By', value: 'Rakesh Rathod', link: true },
      { label: 'Approved On', value: 'Mon, Jul 20, 2026 04:56 PM' },
      { label: 'Patch Type', value: 'Third Party Patch' },
      { label: 'Created Date', value: 'Tue, Mar 10, 2026 10:52 PM', sub: '(4 months ago)' },
      { label: 'Last Updated Date', value: 'Mon, Jul 20, 2026 05:01 PM', sub: '(25 minutes ago)' },
      { label: 'Created By', value: 'System' },
      { label: 'Last Updated By', value: 'Rakesh Rathod', link: true },
    ];
    const infoRow = (f: { label: string; value: string; link?: boolean; sub?: string }) => (
      <div key={f.label} className="flex items-start justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568] pt-2">{f.label}</div>
        <div className="flex-1 min-w-0 px-3 py-2">
          <span className={`text-[13px] block break-words ${f.link ? 'text-[#3D8BD0]' : 'text-[#364658]'}`}>{f.value}</span>
          {f.sub && <span className="text-[12px] text-[#9CA3AF] block">{f.sub}</span>}
        </div>
      </div>
    );

    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {(!q || 'patch category'.includes(q)) && plainSelect('Patch Category', PATCH_CATEGORY_OPTIONS, 'Updates')}
        {(!q || 'severity'.includes(q)) && dotSelect('Severity', PATCH_SEVERITY_OPTIONS, 'Low')}
        {(!q || 'approval status'.includes(q)) && dotSelect('Approval Status', PATCH_APPROVAL_OPTIONS, 'Approved')}
        {(!q || 'test status'.includes(q)) && plainSelect('Test Status', PATCH_TEST_OPTIONS, 'Not Tested')}
        {(!q || 'release date'.includes(q)) && dateRow('Release Date', '2026-02-01')}

        {/* The Patch page has a single accordion, so all fields show by default (no "View more"). */}
        {(!q || 'kb number'.includes(q)) && textRow('KB Number')}
        {(!q || 'superseded status'.includes(q)) && plainSelect('Superseded Status', YES_NO, 'No')}
        {(!q || 'bulletin id'.includes(q)) && textRow('Bulletin Id')}
        {(!q || 'refrence url'.includes(q) || 'reference url'.includes(q)) && linkRow('Refrence Url', 'https://www.win-rar.com/support.html')}

        {/* Read-only patch metadata / audit info (after Reference Url) */}
        {PATCH_INFO_FIELDS.filter((f) => !q || f.label.toLowerCase().includes(q)).map(infoRow)}
      </div>
    );
  }

  // Software-license variant: only Product (read-only) + License Type (dropdown).
  if (licenseMode) {
    const filteredLicenseTypes = LICENSE_TYPE_OPTIONS.filter((o) => o.toLowerCase().includes(licenseTypeSearch.toLowerCase()));
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {/* Product (read-only) */}
        {(!q || 'product'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Product</div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-[#364658] px-3 py-2 block truncate">{state.product || '---'}</span>
            </div>
          </div>
        )}

        {/* License Type (dropdown) */}
        {(!q || 'license type'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">License Type</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={licenseType} onClick={() => toggle('licenseType')}>
                  {licenseType ? <span className="truncate">{licenseType}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'licenseType' && (
                  <div className={menuClass}>
                    <SearchBox value={licenseTypeSearch} onChange={setLicenseTypeSearch} />
                    <div className="max-h-[280px] overflow-y-auto">
                      {filteredLicenseTypes.map((o) => (
                        <button key={o} className={optionClass} onClick={() => { setLicenseType(o); setOpen(null); setLicenseTypeSearch(''); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {licenseType === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Fields (moved here) — license has no "View more", so shown inline */}
        {footer}
      </div>
    );
  }

  // Contract variant: contract number / dates / cost / type / vendor.
  if (contractMode) {
    const filteredContractTypes = CONTRACT_TYPE_OPTIONS.filter((o) => o.toLowerCase().includes(contractTypeSearch.toLowerCase()));
    const textRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          {editingField === label ? (
            <input
              autoFocus
              value={extra[label] || ''}
              onChange={(e) => updateExtra(label, e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
              className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
            />
          ) : (
            <div className="group/edit relative flex items-center">
              <span className={`text-[13px] px-3 py-2 truncate flex-1 ${extra[label] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra[label] || '---'}</span>
              <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );
    const dateRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
          </div>
        </div>
      </div>
    );
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {(!q || 'contract number'.includes(q)) && textRow('Contract Number')}
        {(!q || 'contract start date'.includes(q)) && dateRow('Contract Start Date')}
        {(!q || 'contract end date'.includes(q)) && dateRow('Contract End Date')}
        {(!q || 'cost'.includes(q)) && textRow('Cost')}
        {(!q || 'contract type'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Contract Type</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={extra['Contract Type']} onClick={() => toggle('contractType')}>
                  {extra['Contract Type'] ? <span className="truncate">{extra['Contract Type']}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'contractType' && (
                  <div className={menuClass}>
                    <SearchBox value={contractTypeSearch} onChange={setContractTypeSearch} />
                    <div className="max-h-[280px] overflow-y-auto">
                      {filteredContractTypes.map((o) => (
                        <button key={o} className={optionClass} onClick={() => { updateExtra('Contract Type', o); setOpen(null); setContractTypeSearch(''); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {extra['Contract Type'] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(!q || 'vendor'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Vendor</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Vendor'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Vendor'] || '---'}</span>
            </div>
          </div>
        )}

        {/* View more fields: Owner (user picker) + Department (dropdown) */}
        {(showMore || q) && (!q || 'owner'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Owner</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {owner ? (
                    <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: owner.color }}>{owner.initials}</span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
                  )}
                </span>
                <button className={`${triggerClass} pl-9`} title={owner?.name} onClick={() => toggle('owner')}>{owner?.name || 'Unassigned'}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'owner' && (
                  <div className={menuClass}>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for users..."
                          autoFocus
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => { setOwner(null); setOpen(null); setOwnerSearch(''); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                          <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                        </span>
                        {!owner && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {OWNER_OPTIONS.filter((o) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o) => (
                        <button key={o.name} className={optionClass} onClick={() => { setOwner(o); setOpen(null); setOwnerSearch(''); }}>
                          <span className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                            <span className="text-[13px] text-[#364658] truncate">{o.name}</span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="size-2 rounded-full" style={{ backgroundColor: o.status }} />
                            {owner?.name === o.name && <Check size={14} className="text-[#3D8BD0]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'department'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Department</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <button className={`${triggerClass} pl-3`} title={extra['Department']} onClick={() => toggle('contractDepartment')}>
                  {extra['Department'] ? <span className="truncate">{extra['Department']}</span> : <span className="text-[#9CA3AF]">Select</span>}
                </button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'contractDepartment' && (
                  <div className={menuClass}>
                    <div className="max-h-[280px] overflow-y-auto">
                      {['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Procurement'].map((o) => (
                        <button key={o} className={optionClass} onClick={() => { updateExtra('Department', o); setOpen(null); }}>
                          <span className="text-[13px] text-[#364658] truncate">{o}</span>
                          {extra['Department'] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Fields (moved here) — revealed by the SAME "View more" */}
        {(showMore || q) && footer}

        {/* View more / View less toggle (hidden while searching) */}
        {!q && (
          <div className="pt-1">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
            >
              {showMore ? 'View less' : 'View more'}
              {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Purchase variant: status / order number / cost / cost center / required & order dates.
  if (purchaseMode) {
    const purchaseStatusColor = PURCHASE_STATUS_OPTIONS.find((o) => o.label === status)?.color || '#9CA3AF';
    const textRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          {editingField === label ? (
            <input
              autoFocus
              value={extra[label] || ''}
              onChange={(e) => updateExtra(label, e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
              className="w-full px-3 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
            />
          ) : (
            <div className="group/edit relative flex items-center">
              <span className={`text-[13px] px-3 py-2 truncate flex-1 ${extra[label] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra[label] || '---'}</span>
              <button onClick={() => setEditingField(label)} className="absolute right-2 text-[#7B8FA5] opacity-0 group-hover/edit:opacity-100 transition-opacity"><Edit size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );
    const dateRow = (label: string) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <DateField value={extra[label] || ''} onChange={(v) => updateExtra(label, v)} className="!border-0 !bg-transparent hover:!bg-[#F3F4F6]" />
          </div>
        </div>
      </div>
    );
    const selectRow = (label: string, options: string[]) => (
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">{label}</div>
        <div className="flex-1 min-w-0">
          <div className="group relative">
            <button className={`${triggerClass} pl-3`} title={extra[label]} onClick={() => toggle(label)}>
              {extra[label] ? <span className="truncate">{extra[label]}</span> : <span className="text-[#9CA3AF]">Select</span>}
            </button>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            {open === label && (
              <div className={menuClass}>
                <div className="max-h-[280px] overflow-y-auto">
                  {options.map((o) => (
                    <button key={o} className={optionClass} onClick={() => { updateExtra(label, o); setOpen(null); }}>
                      <span className="text-[13px] text-[#364658] truncate">{o}</span>
                      {extra[label] === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
    return (
      <div className="px-4 pb-4 space-y-2" ref={ref}>
        {/* Status (read-only) */}
        {(!q || 'status'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Status</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: purchaseStatusColor }} />
                <span className={`text-[13px] truncate ${status ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{status || '---'}</span>
              </div>
            </div>
          </div>
        )}
        {(!q || 'order number'.includes(q)) && textRow('Order Number')}
        {(!q || 'cost (inr)'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Cost (INR)</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Cost (INR)'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Cost (INR)'] || '---'}</span>
            </div>
          </div>
        )}
        {(!q || 'cost center'.includes(q)) && selectRow('Cost Center', COST_CENTER_OPTIONS)}
        {(!q || 'purchase required by'.includes(q)) && dateRow('Purchase Required By')}
        {(!q || 'purchase order date'.includes(q)) && dateRow('Purchase Order Date')}

        {/* View more fields */}
        {(showMore || q) && (!q || 'owner'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Owner</div>
            <div className="flex-1 min-w-0">
              <div className="group relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {owner ? (
                    <span className="flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: owner.color }}>{owner.initials}</span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><User size={12} /></span>
                  )}
                </span>
                <button className={`${triggerClass} pl-9`} title={owner?.name} onClick={() => toggle('owner')}>{owner?.name || 'Unassigned'}</button>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                {open === 'owner' && (
                  <div className={menuClass}>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for users..."
                          autoFocus
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                        onClick={() => { setOwner(null); setOpen(null); setOwnerSearch(''); }}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0" />
                          <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                        </span>
                        {!owner && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                      </button>
                      {OWNER_OPTIONS.filter((o) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o) => (
                        <button key={o.name} className={optionClass} onClick={() => { setOwner(o); setOpen(null); setOwnerSearch(''); }}>
                          <span className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: o.color }}>{o.initials}</span>
                            <span className="text-[13px] text-[#364658] truncate">{o.name}</span>
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <span className="size-2 rounded-full" style={{ backgroundColor: o.status }} />
                            {owner?.name === o.name && <Check size={14} className="text-[#3D8BD0]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'vendor'.includes(q)) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] flex-shrink-0 w-[120px] text-[#4A5568]">Vendor</div>
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] px-3 py-2 block truncate ${extra['Vendor'] ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{extra['Vendor'] || '---'}</span>
            </div>
          </div>
        )}
        {(showMore || q) && (!q || 'gl code'.includes(q)) && selectRow('GL Code', ['5010 - IT Equipment', '5020 - Software', '5030 - Services', '6010 - Maintenance', '6020 - Consumables'])}
        {(showMore || q) && (!q || 'print template'.includes(q)) && selectRow('Print Template', ['Standard', 'Detailed', 'Compact'])}
        {(showMore || q) && (!q || 'invoice received'.includes(q)) && selectRow('Invoice Received', ['None', 'Partial', 'Full'])}
        {(showMore || q) && (!q || 'payment status'.includes(q)) && selectRow('Payment Status', ['None', 'Pending', 'Partially Paid', 'Paid'])}
        {(showMore || q) && (!q || 'total invoice amount'.includes(q)) && textRow('Total Invoice Amount')}
        {(showMore || q) && (!q || 'total payment amount'.includes(q)) && textRow('Total Payment Amount')}

        {/* System Fields (moved here) — revealed by the SAME "View more" */}
        {(showMore || q) && footer}

        {/* View more / View less toggle (hidden while searching) */}
        {!q && (
          <div className="pt-1">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
            >
              {showMore ? 'View less' : 'View more'}
              {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-2" ref={ref}>
      {/* Asset Type */}
      {show('Asset Type') && (
      <FieldRow label={cmdbMode ? 'CI Type' : 'Asset Type'} pinned={pinnedFields.includes('Asset Type')} onPin={() => togglePinField('Asset Type')}>
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

      {/* Software Type (software assets only — not Non-IT) */}
      {softwareMode && !nonItMode && show('Software Type') && (
      <FieldRow label="Software Type" pinned={pinnedFields.includes('Software Type')} onPin={() => togglePinField('Software Type')}>
        <div className="group relative">
          <button className={`${triggerClass} pl-3`} title={softwareType} onClick={() => toggle('softwareType')}>
            {softwareType ? <span className="truncate">{softwareType}</span> : <span className="text-[#9CA3AF]">Select</span>}
          </button>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {open === 'softwareType' && (
            <div className={menuClass}>
              <div className="max-h-[280px] overflow-y-auto">
                {SOFTWARE_TYPE_OPTIONS.map((o) => (
                  <button key={o} className={optionClass} onClick={() => { setSoftwareType(o); setOpen(null); }}>
                    <span className="text-[13px] text-[#364658] truncate">{o}</span>
                    {softwareType === o && <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />}
                  </button>
                ))}
              </div>
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

      {/* CI (hardware assets only) */}
      {!softwareMode && show('CI') && (
      <FieldRow label={cmdbMode ? 'Asset' : 'CI'} pinned={pinnedFields.includes('CI')} onPin={() => togglePinField('CI')}>
        <div className="px-0 py-2">
          {ci
            ? <span className="text-[13px] text-[#3D8BD0] cursor-pointer hover:underline">{ci}</span>
            : <span className="text-[13px] text-[#9CA3AF]">---</span>}
        </div>
      </FieldRow>
      )}

      {/* Additional fields behind "View more" — per-module field set (license/contract/purchase render their own set above and never reach here) */}
      {(showMore || q) && (cmdbMode ? CMDB_MORE_FIELDS : nonItMode ? NONIT_MORE_FIELDS : softwareMode ? SOFTWARE_MORE_FIELDS : ASSET_MORE_FIELDS).map(renderMoreField)}

      {/* System Fields (moved here) — revealed by the SAME "View more" */}
      {(showMore || q) && footer}

      {/* View more / View less toggle (hidden while searching) */}
      {!q && (
        <div className="pt-1">
          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-[13px] text-[#3D8BD0] hover:text-[#2563EB] font-medium flex items-center gap-1 transition-colors"
          >
            {showMore ? 'View less' : 'View more'}
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
