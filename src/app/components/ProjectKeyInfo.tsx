import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Project } from './ProjectsListPage';

/* Key Information for the PROJECT detail page — replaces the ticket-field set.
   Upfront: Status · Priority · Project Type · Project Owner · Milestones ·
   Tasks · Completion. View more: due pill, Project Risk, Location, Vendor,
   Source, the planning dates and the created/updated by lines. */

const STATUS_OPTS = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'Planning', color: '#8B5CF6' },
  { label: 'Implementation', color: '#22C55E' },
  { label: 'On Hold', color: '#D97706' },
  { label: 'Completed', color: '#94A3B8' },
  { label: 'Cancelled', color: '#EF4444' },
];
const PRIORITY_OPTS = [
  { label: 'Critical', color: '#DC2626' },
  { label: 'High', color: '#F97316' },
  { label: 'Medium', color: '#94A3B8' },
  { label: 'Low', color: '#22C55E' },
];
const RISK_OPTS = [
  { label: 'Low', color: '#22C55E' },
  { label: 'Medium', color: '#D97706' },
  { label: 'High', color: '#DC2626' },
];
const TYPE_OPTS = ['None', 'Business Initiative', 'Infrastructure Upgrade', 'Software Rollout', 'Compliance & Audit'];
const LOCATION_OPTS = ['Ahmedabad HQ', 'Pune Office', 'Chennai DC', 'Bengaluru Office', 'Remote'];
const VENDOR_OPTS = ['Dell Technologies', 'Microsoft', 'Cisco Systems', 'TCS', 'Accenture'];

const AVATAR_COLORS = ['#3D8BD0', '#7C3AED', '#0EA5E9', '#16A34A', '#D97706', '#DC2626', '#0D9488'];
const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const fmtDT = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }) +
  ' ' +
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

/* One field row: quiet label column, value column. */
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-h-[28px] items-center gap-3">
    <span className="w-[128px] flex-shrink-0 text-[12px] text-[#7B8FA5]">{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

/* Editable value: color dot + quiet borderless select that fills on hover. */
const DotSelect = ({
  value,
  opts,
  onChange,
}: {
  value: string;
  opts: { label: string; color: string }[];
  onChange: (v: string) => void;
}) => (
  <span className="-ml-1.5 inline-flex min-w-0 items-center gap-1.5">
    <span className="ml-1.5 size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: opts.find((o) => o.label === value)?.color ?? '#94A3B8' }} />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="app-select cursor-pointer rounded border border-transparent bg-transparent py-0.5 pl-1 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F3F5F8] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
    >
      {opts.map((o) => (
        <option key={o.label}>{o.label}</option>
      ))}
    </select>
  </span>
);

/* Plain quiet select, with a grey "Select" placeholder like the product. */
const PlainSelect = ({ value, opts, onChange, placeholder = 'Select' }: { value: string; opts: string[]; onChange: (v: string) => void; placeholder?: string }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`app-select -ml-1 cursor-pointer rounded border border-transparent bg-transparent py-0.5 pl-1 text-[13px] transition-colors hover:bg-[#F3F5F8] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0] ${
      value ? 'font-medium text-[#364658]' : 'text-[#9CA3AF]'
    }`}
  >
    <option value="">{placeholder}</option>
    {opts.map((o) => (
      <option key={o} value={o} className="text-[#364658]">
        {o}
      </option>
    ))}
  </select>
);

export function ProjectKeyInfo({ project, title = 'Key Information' }: { project: Project | null; title?: string }) {
  const [expanded, setExpanded] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [status, setStatus] = useState(project?.status ?? 'Open');
  const [priority, setPriority] = useState(project?.priority ?? 'Medium');
  const [ptype, setPtype] = useState('None');
  const [risk, setRisk] = useState(project?.priority === 'Critical' ? 'High' : project?.priority === 'Low' ? 'Low' : 'Medium');
  const [location, setLocation] = useState('');
  const [vendor, setVendor] = useState('');

  // Re-seed when another project opens in the same drawer instance.
  useEffect(() => {
    setStatus(project?.status ?? 'Open');
    setPriority(project?.priority ?? 'Medium');
    setPtype('None');
    setRisk(project?.priority === 'Critical' ? 'High' : project?.priority === 'Low' ? 'Low' : 'Medium');
    setLocation('');
    setVendor('');
    setShowMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const completion = project?.completion ?? 0;
  const owner = project?.owner ?? null;
  const start = project?.start ?? null;
  const implStart = start ? new Date(start.getTime() + 5 * 864e5) : null;
  const lastUpdated = new Date(Date.now() - 864e5 * 1 - 3600e3 * 3);

  return (
    <div className="rounded-lg border border-[#DFE5ED]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg p-4 transition-colors hover:bg-[#F8F9FB]"
      >
        <span className="text-[13px] font-medium text-[#364658]">{title}</span>
        {expanded ? <ChevronUp size={16} className="text-[#7B8FA5]" /> : <ChevronDown size={16} className="text-[#7B8FA5]" />}
      </button>
      {expanded && (
        <div className="space-y-2.5 px-4 pb-4">
          <Row label="Status">
            <DotSelect value={status} opts={STATUS_OPTS} onChange={setStatus} />
          </Row>
          <Row label="Priority">
            <DotSelect value={priority} opts={PRIORITY_OPTS} onChange={setPriority} />
          </Row>
          <Row label="Project Type">
            <PlainSelect value={ptype === 'None' ? '' : ptype} opts={TYPE_OPTS.filter((t) => t !== 'None')} onChange={(v) => setPtype(v || 'None')} placeholder="None" />
          </Row>
          <Row label="Project Owner">
            {owner ? (
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white" style={{ backgroundColor: avatarColor(owner) }}>
                  {initials(owner)}
                </span>
                <span className="truncate text-[13px] font-medium text-[#364658]">{owner}</span>
              </span>
            ) : (
              <span className="text-[13px] text-[#9CA3AF]">Unassigned</span>
            )}
          </Row>
          <Row label="Milestones">
            <span className="text-[13px] font-medium tabular-nums text-[#364658]">
              {project ? `${project.milestonesDone}/${project.milestonesTotal}` : '0/0'}
            </span>
          </Row>
          <Row label="Tasks">
            <span className="text-[13px] font-medium tabular-nums text-[#364658]">
              {project ? `${project.tasksDone}/${project.tasksTotal}` : '0/0'}
            </span>
          </Row>
          <Row label="Completion (%)">
            <span className="flex min-w-0 items-center gap-2">
              <span className="block h-[4px] w-24 overflow-hidden rounded-full bg-[#EEF1F4]">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${completion}%`, backgroundColor: completion === 100 ? '#16A34A' : '#3D8BD0' }}
                />
              </span>
              <span className="text-[13px] font-medium tabular-nums text-[#364658]">{completion}%</span>
            </span>
          </Row>

          {showMore && (
            <div className="space-y-2.5">
              <Row label="Project Risk">
                <DotSelect value={risk} opts={RISK_OPTS} onChange={setRisk} />
              </Row>
              <Row label="Location">
                <PlainSelect value={location} opts={LOCATION_OPTS} onChange={setLocation} />
              </Row>
              <Row label="Vendor">
                <PlainSelect value={vendor} opts={VENDOR_OPTS} onChange={setVendor} />
              </Row>
              <Row label="Source">
                <span className="text-[13px] font-medium text-[#364658]">Manual</span>
              </Row>
              <Row label="Planning Start Date">
                <span className="text-[13px] text-[#364658]">{start ? fmtDT(start) : '---'}</span>
              </Row>
              <Row label="Implementation Start Date">
                <span className="text-[13px] text-[#364658]">{implStart ? fmtDT(implStart) : '---'}</span>
              </Row>
              <Row label="Last Updated Date">
                <span className="text-[13px] text-[#364658]">{fmtDT(lastUpdated)}</span>
              </Row>
              <Row label="Created By">
                <span className="cursor-pointer text-[13px] font-medium text-[#3D8BD0] hover:underline">{owner ?? 'System'}</span>
              </Row>
              <Row label="Last Updated By">
                <span className="cursor-pointer text-[13px] font-medium text-[#3D8BD0] hover:underline">Sarah Johnson</span>
              </Row>
            </div>
          )}

          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1 pt-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
          >
            {showMore ? 'View less' : 'View more'}
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
