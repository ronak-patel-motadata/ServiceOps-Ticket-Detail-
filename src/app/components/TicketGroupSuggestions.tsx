import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronUp, Clock, Info, Plus, Shield, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { AiSparkle } from './AiSparkle';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* ─── ServiceOps AI: suggested request groups ─────────────────────────────────
   When many users raise requests about the same underlying issue (Wi-Fi down,
   a stalled onboarding step, a bad hardware batch), the AI clusters them so a
   technician can merge them or raise one Problem instead of solving 15 tickets
   one by one. Banner above the listing grid → side popup (group list → group
   detail with merge / create-problem / ignore). All mock, local state. */

interface GroupTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  assignee: string;
  requester: string;
  /** Request (default) | Asset | CI | Problem | Change — a MIXED group gets Relations-style type pills. */
  itemType?: string;
}

interface SuggestedGroup {
  id: string;
  name: string;
  window: string;
  age: string;
  /** Detected since the user last reviewed — renders under "New suggestions". */
  isNew?: boolean;
  confidence: { level: 'High' | 'Medium' | 'Low'; pct: number };
  /** One-line evidence shown on the list card. */
  summary: string;
  /** Fuller context shown on the detail view. */
  description: string;
  /** Why the AI clustered these — the signals it matched on. */
  reason: string;
  tickets: GroupTicket[];
}

const GROUP_SEEDS: SuggestedGroup[] = [
  {
    id: 'grp-1',
    name: 'Wi-Fi drops on Floor 3 — Ahmedabad HO',
    window: 'all within 96 min',
    age: '2h ago',
    isNew: true,
    confidence: { level: 'High', pct: 92 },
    summary:
      'Five requests raised between 13:30 and 15:06, all from Ahmedabad HO Floor 3, all describing loss of wireless connectivity.',
    description:
      'A burst of connectivity requests from the same floor of Ahmedabad HO. All five requesters report Wi-Fi dropping or fully unavailable, starting around 13:30. No other floor or office has raised a connectivity request in the same window. Network monitoring shows access point AP-AMD-3F-04 restarted its radio six times between 13:25 and 15:00, and the two neighbouring APs on Floor 3 absorbed roughly 60 extra clients in the same period — consistent with a single flapping AP rather than a building-wide outage. The switch port feeding that AP (SW-AMD-3F-01, port 14) has been logging CRC errors since the morning, which points at a cabling or SFP fault rather than a controller misconfiguration. Impact is contained to Floor 3, but that floor hosts the Finance and HR bays, and two of the affected requesters are processing month-end payroll today.',
    reason:
      'Same site and floor, same symptom category, raised within a 96-minute window. Four of the five requests name access point AP-AMD-3F-04, which logged 6 radio resets in the same period — a strong signal of one underlying network issue.',
    tickets: [
      { id: 'INC-32', subject: 'My Internet Down', status: 'Open', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Darshak Modi' },
      { id: 'INC-33', subject: 'WiFi is not working', status: 'Pending', priority: 'Urgent', assignee: 'Kaison Potai', requester: 'Meera Iyer' },
      { id: 'INC-40', subject: 'WiFi is not working', status: 'Open', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Nandini Patel' },
      { id: 'INC-41', subject: 'Internet dropping every few minutes', status: 'In Progress', priority: 'Urgent', assignee: 'Kaison Potai', requester: 'Darshak Modi' },
      { id: 'INC-43', subject: 'Cannot open shared drive from Floor 3', status: 'Pending', priority: 'Medium', assignee: 'Rahul Shukla', requester: 'Samuel Githugu' },
    ],
  },
  {
    id: 'grp-2',
    name: 'Onboarding requests stalled at AD account creation',
    window: 'stalled 2+ days',
    age: '5h ago',
    isNew: true,
    confidence: { level: 'Medium', pct: 78 },
    summary:
      'Five Employee Onboarding requests are all sitting on the same workflow task — Create AD account — for more than two days.',
    description:
      'Five onboarding requests share the same catalog workflow and every one of them is parked on the "Create AD account" task. The approver queue is identical across all five, and no task in that queue has closed since 20/Apr. The identity technician who normally clears AD-account tasks is on leave this week, and the backup approver was never added to the queue — so all five tasks are waiting on a person who will not action them. Each stalled request is a new joiner with a confirmed start date; two of them start on Monday, and their laptops cannot be imaged until the AD account exists. Reassigning the approver once would release all five workflows in a single step.',
    reason:
      'Same service-catalog workflow, same open task, same approver group, and identical stall duration. When one workflow step blocks many requests at once, clearing the step (or its approver) resolves the whole set.',
    tickets: [
      { id: 'INC-31', subject: 'Employee Onboarding', status: 'In Progress', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Nandini Patel' },
      { id: 'INC-34', subject: 'Employee Onboarding', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Samuel Githugu' },
      { id: 'INC-36', subject: 'Employee Onboarding', status: 'In Progress', priority: 'High', assignee: 'Keetion Dale', requester: 'Hetal Mori' },
      { id: 'INC-38', subject: 'Employee Onboarding', status: 'Pending', priority: 'Low', assignee: 'Amou Desai', requester: 'Ersin Sevinç' },
      { id: 'INC-45', subject: 'Employee Onboarding', status: 'Open', priority: 'Urgent', assignee: 'Pratik Patial', requester: 'Hetal Mori' },
      { id: 'AST-4102', subject: 'Dell Latitude 5440 — staged for new joiners', status: 'In Stock', priority: '', assignee: 'Keetion Dale', requester: 'Nandini Patel', itemType: 'Asset' },
      { id: 'CI-214', subject: 'AD-DC-01 — Primary Domain Controller', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Nandini Patel', itemType: 'CI' },
    ],
  },
  {
    id: 'grp-3',
    name: 'Power adapter failures — Dell 65W batch DLC-2231',
    window: 'across 4 days',
    age: '1d ago',
    confidence: { level: 'Medium', pct: 64 },
    summary:
      'Three charger failures in four days. All three assets are Dell 65W adapters from procurement batch DLC-2231, issued in January.',
    description:
      'Three hardware requests describe the same failure mode — the laptop charger stops charging or overheats. Asset records tie all three adapters to purchase batch DLC-2231, issued in January. The baseline failure rate for this model is one per quarter, so three failures inside four days is roughly twelve times the expected rate. All three adapters shipped in the same procurement order of 40 units, meaning around 37 potentially faulty units are still in circulation across the Ahmedabad and Pune offices. One requester also reported a burnt smell, which raises this from an inconvenience to a potential safety issue worth flagging to the vendor alongside a batch recall.',
    reason:
      'Same asset model, same procurement batch, same failure symptom, and a failure rate 12× above baseline. A batch-level hardware fault is the likely root cause — worth a Problem and possibly a vendor claim.',
    tickets: [
      { id: 'INC-39', subject: 'Laptop charger not working', status: 'Closed', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Jainam Shah' },
      { id: 'INC-42', subject: 'Charger stopped charging the laptop', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Meera Iyer' },
      { id: 'INC-46', subject: 'Burnt smell from power adapter', status: 'Open', priority: 'High', assignee: 'Pratik Patial', requester: 'Rohit Kulkarni' },
    ],
  },
];

/* Requests OUTSIDE every suggested group — the manual "Add request" picker
   draws from these. */
const CANDIDATE_POOL: GroupTicket[] = [
  { id: 'INC-35', subject: 'Request for Apple MacBook Pro Allocation', status: 'Open', priority: 'Medium', assignee: 'Rahul Shukla', requester: 'Kavit Gohel' },
  { id: 'INC-37', subject: 'help', status: 'Completed', priority: 'Urgent', assignee: 'Pratik Patial', requester: 'Rohit Kulkarni' },
  { id: 'INC-44', subject: 'My Internet Down', status: 'Closed', priority: 'High', assignee: 'Keetion Dale', requester: 'Kavit Gohel' },
  { id: 'INC-47', subject: 'VPN keeps disconnecting', status: 'Open', priority: 'Medium', assignee: 'Shreyak Dalal', requester: 'Meera Iyer' },
  { id: 'INC-48', subject: 'Cannot connect to office Wi-Fi', status: 'Open', priority: 'Low', assignee: 'Kaison Potai', requester: 'Jainam Shah' },
  { id: 'INC-49', subject: 'New joiner laptop setup', status: 'In Progress', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Nandini Patel' },
  { id: 'INC-50', subject: 'Docking station not detected', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Darshak Modi' },
  { id: 'AST-4106', subject: 'Dell Latitude 5440 — hot spare', status: 'In Stock', priority: '', assignee: 'Keetion Dale', requester: 'Nandini Patel', itemType: 'Asset' },
  { id: 'AST-3988', subject: 'HP EliteBook 840 G9 — imaging bench', status: 'In Use', priority: '', assignee: 'Novak Potai', requester: 'Hetal Mori', itemType: 'Asset' },
  { id: 'CI-208', subject: 'AD-DC-02 — Secondary Domain Controller', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Nandini Patel', itemType: 'CI' },
  { id: 'CI-341', subject: 'Okta Identity Gateway', status: 'Operational', priority: '', assignee: 'Shreyak Dalal', requester: 'Meera Iyer', itemType: 'CI' },
];

const STATUS_DOT: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#3B82F6',
  Pending: '#F59E0B',
  Completed: '#22C55E',
  Closed: '#94A3B8',
  'In Stock': '#22C55E',
  'In Use': '#3D8BD0',
  Operational: '#94A3B8',
};

const PRIORITY_DOT: Record<string, string> = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#EF4444',
  Urgent: '#DC2626',
};

const CONFIDENCE_TINT: Record<string, string> = {
  High: 'bg-[#DCFCE7] text-[#15803D]',
  Medium: 'bg-[#FEF3C7] text-[#B45309]',
  Low: 'bg-[#F1F5F9] text-[#64748B]',
};

const initialsOf = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

/** Rows that are actual requests — assets/CIs in mixed groups do not count. */
const requestItems = (g: SuggestedGroup) => g.tickets.filter((t) => !t.itemType || t.itemType === 'Request');

const uniqueRequesters = (g: SuggestedGroup) => new Set(requestItems(g).map((t) => t.requester)).size;

function ConfidencePill({ confidence }: { confidence: SuggestedGroup['confidence'] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex flex-shrink-0 cursor-default items-center rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${CONFIDENCE_TINT[confidence.level]}`}>
          {confidence.level} · {confidence.pct}%
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[10000]">Confidence</TooltipContent>
    </Tooltip>
  );
}

/** Add-record button + searchable picker — the Add-request recipe, reusable per section. */
function AddRecordButton({
  label,
  placeholder,
  candidates,
  exclude,
  onAdd,
}: {
  label: string;
  placeholder: string;
  candidates: GroupTicket[];
  exclude: Set<string>;
  onAdd: (t: GroupTicket) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [openUp, setOpenUp] = useState(false);
  const query = q.trim().toLowerCase();
  const rows = candidates.filter(
    (t) => !exclude.has(t.id) && (!query || t.id.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query)),
  );
  return (
    <div className="relative mt-3">
      <button
        onClick={(e) => {
          // Flip upward when the popup would run past the viewport bottom.
          setOpenUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 340);
          setOpen((v) => !v);
          setQ('');
        }}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[#DFE5ED] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]"
      >
        <Plus size={16} />
        {label}
      </button>
      {open && (
        <div className={`absolute left-0 z-50 w-[460px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-lg ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              onBlur={() => setOpen(false)}
              placeholder={placeholder}
              className="h-9 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
            />
          </div>
          {/* onMouseDown beats the input blur, so the picker stays open for multi-add. */}
          <div className="max-h-[240px] overflow-y-auto pb-1">
            {rows.length ? (
              rows.map((t) => (
                <button
                  key={t.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAdd(t);
                  }}
                  className="group/cand flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{t.subject}</span>
                  <span className="flex flex-shrink-0 items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                    <span className="text-[12px] text-[#64748B]">{t.status}</span>
                  </span>
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] transition-colors group-hover/cand:bg-[#E8EEF5]">
                    <Plus size={12} className="text-[#64748B]" />
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-[12px] text-[#94A3B8]">No matching records</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TicketGroupSuggestions({ panelOnly = false }: { panelOnly?: boolean } = {}) {
  const [groups, setGroups] = useState<SuggestedGroup[]>(GROUP_SEEDS);
  const [dismissed, setDismissed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addOpenUp, setAddOpenUp] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [itemTypeFilter, setItemTypeFilter] = useState('All');

  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;
  const coveredRequests = groups.reduce((n, g) => n + requestItems(g).length, 0);
  const triagePct = coveredRequests > 0 ? Math.round((1 - groups.length / coveredRequests) * 100) : 0;

  const typeOfItem = (t: GroupTicket) => t.itemType ?? 'Request';
  const groupTypes = openGroup ? Array.from(new Set(openGroup.tickets.map(typeOfItem))) : [];
  const mixedTypes = groupTypes.length > 1;
  const visibleTickets = openGroup
    ? mixedTypes && itemTypeFilter !== 'All'
      ? openGroup.tickets.filter((t) => typeOfItem(t) === itemTypeFilter)
      : openGroup.tickets
    : [];
  // What the Add button adds — follows the active type pill in mixed groups.
  // Option-2 layout demo (group 2 only): Why band leads and carries the actions.
  const detailV2 = openGroup?.id === 'grp-2';
  const v2Assets = openGroup ? openGroup.tickets.filter((t) => t.itemType && t.itemType !== 'Request') : [];
  const v2Requests = openGroup ? openGroup.tickets.filter((t) => !t.itemType || t.itemType === 'Request') : [];
  const addType = detailV2 ? 'Request' : mixedTypes ? itemTypeFilter : 'Request';
  const addNoun = addType === 'CI' ? 'CI' : addType.toLowerCase();
  const addNounPlural = addType === 'CI' ? 'CIs' : addType.toLowerCase() + 's';

  // Esc steps back: detail → list → closed.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openGroupId) setOpenGroupId(null);
      else setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, openGroupId]);

  // The toolbar shows a compact reopen button while the banner is dismissed.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('suggested-groups-state', { detail: { hidden: dismissed, count: groups.length } }));
  }, [dismissed, groups.length]);
  useEffect(() => {
    const onOpen = () => {
      if (groups.length) setPanelOpen(true);
    };
    window.addEventListener('open-suggested-groups', onOpen);
    return () => window.removeEventListener('open-suggested-groups', onOpen);
  }, [groups.length]);

  // Other pages (e.g. the AI-suggested row on the Problem listing) open a group directly.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = String((e as CustomEvent).detail ?? '');
      if (!groups.some((g) => g.id === id)) return;
      setOpenGroupId(id);
      setPanelOpen(true);
    };
    window.addEventListener('open-suggested-group', onOpen as EventListener);
    return () => window.removeEventListener('open-suggested-group', onOpen as EventListener);
  }, [groups]);

  // Fresh picker per group.
  useEffect(() => {
    setAddOpen(false);
    setAddQuery('');
    setDescExpanded(false);
    setItemTypeFilter(() => {
      const g = groups.find((gr) => gr.id === openGroupId);
      if (!g) return 'All';
      const types = Array.from(new Set(g.tickets.map((t) => t.itemType ?? 'Request')));
      return types.length > 1 ? types[0] : 'All';
    });
  }, [openGroupId]);

  /** A group leaves the list after merge / create-problem / ignore. */
  const consumeGroup = (id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      if (next.length === 0) setPanelOpen(false);
      return next;
    });
    setOpenGroupId(null);
  };

  const removeTicket = (groupId: string, ticketId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tickets: g.tickets.filter((t) => t.id !== ticketId) } : g)),
    );
  };

  const addTicket = (groupId: string, ticket: GroupTicket) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.tickets.some((t) => t.id === ticket.id) ? { ...g, tickets: [...g.tickets, ticket] } : g,
      ),
    );
  };

  const panel = panelOpen
    ? createPortal(
        <div className="fixed inset-0 z-[9998]">
          <div className="absolute inset-0 bg-black/20" onClick={() => setPanelOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[760px] max-w-full flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-5 py-3.5">
              {openGroup ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setOpenGroupId(null)}
                        className="-ml-1 flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                        title="Back to groups"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <h2 className="truncate text-[15px] font-semibold text-[#1E293B]">{openGroup.name}</h2>
                    </div>
                    {/* pl aligns the KPI row under the title text (chevron 24 − ml 4 + gap 6). */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[26px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Requests</span>
                        <span className="text-[12px] font-medium text-[#364658]">{requestItems(openGroup).length}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Requesters</span>
                        <span className="text-[12px] font-medium text-[#364658]">{uniqueRequesters(openGroup)}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Detected</span>
                        <span className="text-[12px] font-medium text-[#364658]">{openGroup.age}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Confidence</span>
                        <ConfidencePill confidence={openGroup.confidence} />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AiSparkle size={16} className="flex-shrink-0" />
                  <h2 className="flex-1 text-[15px] font-semibold text-[#1E293B]">Suggested request groups</h2>
                  <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{groups.length}</span>
                </>
              )}
              {openGroup && detailV2 && (
                <button
                  onClick={() => {
                    toast(`Group "${openGroup.name}" ignored`);
                    consumeGroup(openGroup.id);
                  }}
                  className="flex-shrink-0 rounded px-2.5 py-1.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                >
                  Ignore
                </button>
              )}
              <button
                onClick={() => setPanelOpen(false)}
                className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
              >
                <X size={18} className="text-[#64748B]" />
              </button>
            </div>

            {openGroup ? (
              <>
                {/* ── Group detail ── */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {(() => {
                    const descriptionBlock = (
                      <div className={detailV2 ? 'mt-4' : ''}>
                        <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Description</div>
                        <p className={`text-[13px] leading-relaxed text-[#475569] ${descExpanded ? '' : 'line-clamp-3'}`}>{openGroup.description}</p>
                        <button
                          onClick={() => setDescExpanded((v) => !v)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:text-[#2E6BA4]"
                        >
                          {descExpanded ? 'View less' : 'View more'}
                          {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    );
                    const whyBand = (
                      <div
                        className={`rounded-lg border border-[#EFE9FA] px-3.5 py-3 ${detailV2 ? '' : 'mt-4'}`}
                        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.05) 0%, rgba(115, 30, 251, 0.05) 41.49%, rgba(249, 17, 227, 0.05) 100%), #FFF' }}
                      >
                        <div className="flex items-center gap-1.5 pb-1">
                          <AiSparkle size={12} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Why ServiceOps grouped these</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-[#475569]">{openGroup.reason}</p>
                        {/* V2: the suggested actions live right on the AI reasoning card. */}
                        {detailV2 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                                consumeGroup(openGroup.id);
                              }}
                              style={{
                                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                                border: '1px solid transparent',
                              }}
                              className="h-8 rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                            >
                              Create Problem
                            </button>
                            {!panelOnly && (
                              <button
                                onClick={() => {
                                  toast.success(`${openGroup.tickets.length} requests merged into ${openGroup.tickets[0]?.id ?? 'one request'}`);
                                  consumeGroup(openGroup.id);
                                }}
                                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
                                className="h-8 rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                              >
                                Merge Requests
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    return detailV2 ? (
                      <>
                        {whyBand}
                        {descriptionBlock}
                      </>
                    ) : (
                      <>
                        {descriptionBlock}
                        {whyBand}
                      </>
                    );
                  })()}

                  <div className="mt-5">
                    {detailV2 && (() => {
                      {/* Same row recipe as the filtered list — labelled, hover-remove. */}
                      const renderItem = (t: GroupTicket) => (
                        <div key={t.id} className="group border-b border-[#F1F5F9] py-3 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658]">{t.subject}</span>
                            <button
                              onClick={() => removeTicket(openGroup.id, t.id)}
                              className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors hover:bg-[#FEE2E2] group-hover:opacity-100"
                              title="Remove from group"
                            >
                              <X size={16} className="text-[#EF4444]" />
                            </button>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-8 gap-y-1.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Assignee:</span>
                              <span className="flex size-[18px] flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[8px] font-medium text-white">
                                {initialsOf(t.assignee)}
                              </span>
                              <span className="truncate text-[13px] font-medium text-[#364658]">{t.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Status:</span>
                              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                                <span className="size-2 rounded-full" style={{ background: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                                {t.status}
                              </span>
                            </div>
                            {t.priority && (
                              <div className="flex items-center gap-1.5">
                                <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Priority:</span>
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                                  <span className="size-2 rounded-full" style={{ background: PRIORITY_DOT[t.priority] ?? '#94A3B8' }} />
                                  {t.priority}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            Affected Items ({v2Assets.length})
                          </div>
                          <div>{v2Assets.map(renderItem)}</div>
                          <AddRecordButton
                            label="Add Items"
                            placeholder="Search assets and CIs by ID or subject..."
                            candidates={CANDIDATE_POOL.filter((t) => t.itemType && t.itemType !== 'Request')}
                            exclude={new Set(openGroup.tickets.map((t) => t.id))}
                            onAdd={(t) => addTicket(openGroup.id, t)}
                          />
                          <div className="mt-6 border-t border-[#F0F2F5] pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            Impacted requests ({v2Requests.length})
                          </div>
                          <div>{v2Requests.map(renderItem)}</div>
                        </>
                      );
                    })()}
                    {!detailV2 && (<>
                    <div className="pb-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                        {mixedTypes ? 'Relation' : 'Similar requests'} ({openGroup.tickets.length})
                      </div>
                      {/* Mixed groups: the Relations-tab pill recipe, live counts. */}
                      {mixedTypes && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {groupTypes.map((fl) => {
                            const count = openGroup.tickets.filter((t) => typeOfItem(t) === fl).length;
                            return (
                              <button
                                key={fl}
                                onClick={() => setItemTypeFilter(fl)}
                                className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  itemTypeFilter === fl
                                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                                    : 'border-[#DFE5ED] bg-white text-[#7B8FA5] hover:bg-[#F5F7FA]'
                                }`}
                              >
                                {fl}
                                <span className={`text-[10px] ${itemTypeFilter === fl ? 'text-[#3D8BD0]' : 'text-[#9CA3AF]'}`}>{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      {visibleTickets.map((t) => (
                        <div key={t.id} className="group border-b border-[#F1F5F9] py-3 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658]">{t.subject}</span>
                            <button
                              onClick={() => removeTicket(openGroup.id, t.id)}
                              className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors hover:bg-[#FEE2E2] group-hover:opacity-100"
                              title="Remove from group"
                            >
                              <X size={16} className="text-[#EF4444]" />
                            </button>
                          </div>
                          {/* Relations-tab recipe: muted 12px labels, 13px medium values. */}
                          <div className="mt-1 flex flex-wrap items-center gap-x-8 gap-y-1.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Assignee:</span>
                              <span className="flex size-[18px] flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[8px] font-medium text-white">
                                {initialsOf(t.assignee)}
                              </span>
                              <span className="truncate text-[13px] font-medium text-[#364658]">{t.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Status:</span>
                              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                                <span className="size-2 rounded-full" style={{ background: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                                {t.status}
                              </span>
                            </div>
                            {t.priority && (
                              <div className="flex items-center gap-1.5">
                                <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">Priority:</span>
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                                  <span className="size-2 rounded-full" style={{ background: PRIORITY_DOT[t.priority] ?? '#94A3B8' }} />
                                  {t.priority}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    </>)}
                    {/* Manual escape hatch: the AI seeds the group, the technician curates it. */}
                    <div className="relative mt-3">
                      <button
                        onClick={(e) => {
                          setAddOpenUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 340);
                          setAddOpen((v) => !v);
                          setAddQuery('');
                        }}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[#DFE5ED] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F7FA]"
                      >
                        <Plus size={16} />
                        Add {addNoun}
                      </button>
                      {addOpen && (
                        <div className={`absolute left-0 z-50 w-[460px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-lg ${addOpenUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                          <div className="p-2">
                            <input
                              autoFocus
                              value={addQuery}
                              onChange={(e) => setAddQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  setAddOpen(false);
                                }
                              }}
                              onBlur={() => setAddOpen(false)}
                              placeholder={'Search ' + addNounPlural + ' by ID or subject...'}
                              className="h-9 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                            />
                          </div>
                          {/* onMouseDown beats the input blur, so the picker stays open for multi-add. */}
                          <div className="max-h-[240px] overflow-y-auto pb-1">
                            {(() => {
                              const q = addQuery.trim().toLowerCase();
                              const inGroup = new Set(openGroup.tickets.map((t) => t.id));
                              const candidates = CANDIDATE_POOL.filter(
                                (t) =>
                                  (t.itemType ?? 'Request') === addType &&
                                  !inGroup.has(t.id) &&
                                  (!q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)),
                              );
                              if (!candidates.length) {
                                return <div className="px-3 py-3 text-[12px] text-[#94A3B8]">No matching {addNounPlural}</div>;
                              }
                              return candidates.map((t) => (
                                <button
                                  key={t.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    addTicket(openGroup.id, t);
                                  }}
                                  className="group/cand flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                                >
                                  <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{t.subject}</span>
                                  <span className="flex flex-shrink-0 items-center gap-1.5">
                                    <span className="size-2 rounded-full" style={{ background: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                                    <span className="text-[12px] text-[#64748B]">{t.status}</span>
                                  </span>
                                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] transition-colors group-hover/cand:bg-[#E8EEF5]">
                                    <Plus size={12} className="text-[#64748B]" />
                                  </span>
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                {!detailV2 && (
                <div className="border-t border-[#E5E7EB] px-5 py-3">
                  {!detailV2 && <div className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Suggested action</div>}
                  <div className="flex items-center gap-2">
{!panelOnly && !detailV2 && (
                  <button
                    onClick={() => {
                      toast.success(`${openGroup.tickets.length} requests merged into ${openGroup.tickets[0]?.id ?? 'one request'}`);
                      consumeGroup(openGroup.id);
                    }}
                    style={{
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                      border: '1px solid transparent',
                    }}
                    className="h-9 rounded px-4 text-[13px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                  >
                    Merge Requests
                  </button>
                  )}
                  {!detailV2 && (
                  <button
                    onClick={() => {
                      toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                      consumeGroup(openGroup.id);
                    }}
                    style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
                    className="h-9 rounded px-4 text-[13px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                  >
                    Create Problem
                  </button>
                  )}
                  <button
                    onClick={() => {
                      toast(`Group "${openGroup.name}" ignored`);
                      consumeGroup(openGroup.id);
                    }}
                    className="ml-auto h-9 rounded px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                  >
                    Ignore
                  </button>
                  </div>
                </div>
                )}
              </>
            ) : (
              /* ── Group list ── */
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {(() => {
                  const renderCard = (g: SuggestedGroup) => (
                  <div
                    key={g.id}
                    onClick={() => setOpenGroupId(g.id)}
                    className="cursor-pointer rounded-lg border border-[#DFE5ED] bg-white p-4 transition-all hover:border-[#C9D4E0] hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1E293B]">{g.name}</div>
                      <ConfidencePill confidence={g.confidence} />
                    </div>
                    <div className="mt-1 text-[12px] text-[#64748B]">
                      {requestItems(g).length} requests · {uniqueRequesters(g)} requesters · {g.age}
                    </div>
                    <p className="mt-2 border-l-2 border-[#DFE5ED] pl-2.5 text-[12px] leading-relaxed text-[#64748B]">{g.summary}</p>
                  </div>
                  );
                  const fresh = groups.filter((g) => g.isNew);
                  const older = groups.filter((g) => !g.isNew);
                  return (
                    <>
                      {fresh.length > 0 && (
                        <>
                          <div className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            New suggestions ({fresh.length})
                          </div>
                          <div className="space-y-3">{fresh.map(renderCard)}</div>
                        </>
                      )}
                      {older.length > 0 && (
                        <>
                          <div className={`pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] ${fresh.length > 0 ? 'pt-5' : ''}`}>
                            Awaiting review ({older.length})
                          </div>
                          <div className="space-y-3">{older.map(renderCard)}</div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  if (panelOnly) return <>{panel}</>;
  if (dismissed || groups.length === 0) return <>{panel}</>;

  return (
    <div className="px-6 pb-3">
      {/* Banner — bare gradient sparkle + title row; description, triage stat and actions share row 2. */}
      <div
        className="rounded-lg border border-[#DFE5ED] px-4 py-3"
        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.04) 0%, rgba(115, 30, 251, 0.04) 41.49%, rgba(249, 17, 227, 0.04) 100%), #FFF' }}
      >
        <div className="flex items-center gap-2">
          <AiSparkle size={16} className="flex-shrink-0" />
          <span className="text-[14px] font-semibold text-[#1E293B]">
            Grouped by AI: {groups.length} {groups.length === 1 ? 'group' : 'groups'} ready to review
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#731EFB]"
            style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
          >
            Beta
          </span>
          {/* How-it-works explainer — white tooltip card (DrawerTabStrip recipe). */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex size-5 cursor-default items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-white/70 hover:text-[#64748B]">
                <Info size={13} />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              sideOffset={6}
              hideArrow
              className="z-[10000] max-w-none border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-xl"
            >
              <div className="w-[360px] px-4 py-3.5">
                <div className="text-[13px] font-semibold text-[#1E293B]">How ServiceOps groups requests</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
                  Open requests are compared on five signals. A group forms when enough of them line up.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {['Symptom text', 'Site', 'Workflow step', 'Affected asset', 'Time window'].map((sig) => (
                    <span key={sig} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#364658]">
                      <span className="size-1.5 flex-shrink-0 rounded-full bg-[#731EFB]" />
                      {sig}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-[#F1F5F9] pt-2.5">
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <Clock size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    Runs every 15 minutes on open requests.
                  </div>
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <Shield size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    Nothing is merged or closed until you confirm it.
                  </div>
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <User size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    You only see groups containing requests you have access to.
                  </div>
                </div>
                <div className="mt-2.5 text-[12px] font-medium text-[#3D8BD0]">How grouping works →</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        {/* pl-6 = icon (16) + gap (8): row 2 aligns under the title text. */}
        <div className="mt-1 flex items-center gap-4 pl-6">
          <p className="min-w-0 max-w-[680px] text-[12px] leading-relaxed text-[#64748B]">
            ServiceOps watches your open requests for repeats and groups the ones that share a cause, so you triage the pattern
            instead of the tickets.
          </p>
          <span className="h-8 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <div className="flex-shrink-0">
            <div className="text-[16px] font-semibold leading-5 text-[#3D8BD0]">{triagePct}%</div>
            <div className="text-[11px] text-[#7B8FA5]">Fewer items to triage</div>
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="h-8 rounded px-2.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-white/70 hover:text-[#364658]"
            >
              Not now
            </button>
            <button
              onClick={() => setPanelOpen(true)}
              className="h-8 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
            >
              Review groups ({groups.length})
            </button>
          </div>
        </div>
      </div>
      {panel}
    </div>
  );
}
