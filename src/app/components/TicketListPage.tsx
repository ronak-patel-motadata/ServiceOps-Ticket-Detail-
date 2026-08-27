import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { TicketTable } from './TicketTable';
import { ChevronUp } from 'lucide-react';
import { TicketGroupSuggestions } from './TicketGroupSuggestions';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { TicketDrawer } from './TicketDrawer';

export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  dueBy: Date;
  createdBy: Date;
  assignedTo: {
    name: string;
    initials: string;
    avatar?: string;
  };
  status: 'Open' | 'In Progress' | 'Completed' | 'Pending' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  /** Unread conversation replies — drives the blue chip + bold subject on the listing. */
  unread?: number;
  lastMsg?: { from: string; snippet: string; time: string };
  /** Task progress mirrored from the detail page (every request seeds 3-4; INC-35 = 13 staged). */
  tasksDone?: number;
  tasksTotal?: number;
  /** A pending approval on the detail page — the amber chip on the listing. */
  approval?: { approver: string; level: number; totalLevels: number; waiting: string };
}

// Mock data
export const generateMockTickets = (): Ticket[] => {
  const subjects = [
    "Don't you hate me too? it name it that...",
    "Employee Onboarding",
    "My Internet Down",
    "WiFi is not working",
    "Employee Onboarding",
    "Request for Apple MacBook Pro Allocation",
    "Employee Onboarding",
    "help",
    "Employee Onboarding",
    "Laptop charger not working",
    "WiFi is not working",
    "Employee Onboarding",
    "help",
    "Employee Onboarding",
    "My Internet Down",
    "Employee Onboarding",
    "WiFi is not working"
  ];
  
  const requesters = ['Jainam Shah', 'Nandini Patel', 'Darshak Modi', 'Meera Iyer', 'Samuel Githugu', 'Kavit Gohel', 'Hetal Mori', 'Rohit Kulkarni', 'Ersin Sevinç'];
  const assignees = [
    { name: 'Amou Desai', initials: 'AD' },
    { name: 'Keetion Dale', initials: 'KD' },
    { name: 'Shreyak Dalal', initials: 'SD' },
    { name: 'Kaison Potai', initials: 'KP' },
    { name: 'Novak Potai', initials: 'NP' },
    { name: 'Rahul Shukla', initials: 'RS' },
    { name: 'Keetion Dale', initials: 'KD' },
    { name: 'Pratik Patial', initials: 'PP' }
  ];
  
  const statuses: Ticket['status'][] = ['Open', 'In Progress', 'Completed', 'Pending', 'Closed'];
  const priorities: Ticket['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
  
  const MSG_SNIPPETS = [
    "I'm still seeing the same error after the restart — sharing a screenshot now.",
    'This started happening again after the latest update. Can someone take a look today?',
    'Thanks for the quick fix yesterday — unfortunately it is back again this morning.',
    'Adding my manager here. We need this resolved before the client call at 4 PM.',
    'Tried the steps you shared, but step 3 fails with "access denied".',
  ];
  const MSG_TIMES = ['8m ago', '24m ago', '1h ago', '2h ago', '4h ago'];
  const APPROVERS = ['Rakesh Rathod', 'Priya Nair', 'Vikram Sethi', 'Sarah Johnson'];
  const APPROVAL_WAITS = ['2d', '5h', '1d', '3d'];

  return Array.from({ length: 84 }, (_, i) => {
    const requester = requesters[i % requesters.length];
    const assignee = assignees[i % assignees.length];
    // New replies land on roughly a third of the rows; the sender is the requester
    // (or the collaborator on manually-created tickets, which have no named requester).
    const unread = i % 3 === 0 ? (i % 2 === 0 ? 2 : 3) : i % 7 === 4 ? 1 : 0;
    // Task counts mirror the detail page seeding: 3-4 per request, 13 staged on INC-35.
    const tasksTotal = i === 5 ? 13 : 3 + (i % 2);
    const status = i === 9 ? ('Closed' as const) : i === 2 ? ('Open' as const) : statuses[i % statuses.length]; // INC-39 (index 9) should be Closed, INC-32 (index 2) should be Open
    // A pending approval blocks OPEN work only — settled rows never carry one.
    const hasApproval =
      i % 4 === 1 && status !== 'Closed' && status !== 'Completed';
    return {
      id: `INC-${String(i + 30).padStart(2, '0')}`,
      subject: subjects[i % subjects.length],
      requester,
      dueBy: new Date(2022, 3, 20 + (i % 10), 2 + (i % 12), 34),
      createdBy: new Date(2022, 3, 19 + (i % 8), 3 + (i % 12), 30),
      assignedTo: assignee,
      status,
      priority: priorities[i % priorities.length],
      unread,
      lastMsg: unread > 0
        ? { from: requester, snippet: MSG_SNIPPETS[i % MSG_SNIPPETS.length], time: MSG_TIMES[i % MSG_TIMES.length] }
        : undefined,
      tasksTotal,
      tasksDone: i === 5 ? 6 : i % (tasksTotal + 1),
      approval: hasApproval
        ? { approver: APPROVERS[i % APPROVERS.length], level: 1 + (i % 2), totalLevels: 2, waiting: APPROVAL_WAITS[i % APPROVAL_WAITS.length] }
        : undefined,
    };
  });
};

export function TicketListPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(generateMockTickets());
  // Assignee / Status / Priority are editable straight from the grid.
  const updateTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  // While the grid is grouped it pages per group — the outer bar becomes a pinned summary.
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ label: string; groups: number; total: number; list?: { key: string; count: number }[] } | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');
  const [clearGroupTick, setClearGroupTick] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Ticket | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenTicket = (ticket: Ticket) => {
    // INC-33 opens the SECOND design option of the detail page (TicketDrawerV2);
    // every other ticket keeps the existing V1 TicketDrawer.
    openInStack(ticket.id === 'INC-33' ? 'request-v2' : 'request', ticket.id, ticket.subject, ticket);
  };

  const handleCloseDrawer = () => {
    setOpenTickets([]);
    setActiveTicketId(null);
  };

  const handleCloseTab = (ticketId: string) => {
    const newOpenTickets = openTickets.filter(t => t.id !== ticketId);
    setOpenTickets(newOpenTickets);
    
    // If closing active ticket, switch to another tab or close drawer
    if (activeTicketId === ticketId) {
      if (newOpenTickets.length > 0) {
        setActiveTicketId(newOpenTickets[newOpenTickets.length - 1].id);
      } else {
        setActiveTicketId(null);
      }
    }
  };

  const handleTabChange = (ticketId: string) => {
    setActiveTicketId(ticketId);
  };

  // Open a clicked relation (Problem / Change / Release / Asset …) as a new tab in the same drawer.
  const handleOpenRelation = (rel: { ticketId: string; subject: string; status: string; priority: string; assignedTo: { name: string } }) => {
    const mapStatus = (s: string): Ticket['status'] => {
      const v = (s || '').toLowerCase();
      if (v.includes('progress')) return 'In Progress';
      if (v.includes('resolved') || v.includes('complete')) return 'Completed';
      if (v.includes('pending')) return 'Pending';
      if (v.includes('closed')) return 'Closed';
      if (v.includes('cancel')) return 'Cancelled';
      return 'Open';
    };
    const mapPriority = (p: string): Ticket['priority'] => {
      const v = (p || '').toLowerCase();
      if (v.includes('urgent') || v === 'p1') return 'Urgent';
      if (v.includes('high') || v === 'p2') return 'High';
      if (v.includes('low') || v === 'p4') return 'Low';
      return 'Medium';
    };
    const name = rel.assignedTo?.name || 'Unassigned';
    handleOpenTicket({
      id: rel.ticketId,
      subject: rel.subject,
      requester: name,
      dueBy: new Date(),
      createdBy: new Date(),
      assignedTo: { name, initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() },
      status: mapStatus(rel.status),
      priority: mapPriority(rel.priority),
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentTicketIds = new Set(
        tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(t => t.id)
      );
      setSelectedTickets(currentTicketIds);
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  /* `dir` comes from the column header menu ("Sort A → Z" / "Z → A"); a bare click on a
     sortable header still toggles. */
  const handleSort = (column: keyof Ticket, dir?: "asc" | "desc") => {
    if (dir) {
      setSortColumn(column);
      setSortDirection(dir);
      return;
    }
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter tickets based on search query
  let filteredTickets = tickets;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredTickets = tickets.filter(ticket => {
      // Search by ticket ID
      if (ticket.id.toLowerCase().includes(query)) return true;
      // Search by subject
      if (ticket.subject.toLowerCase().includes(query)) return true;
      // Search by requester
      if (ticket.requester.toLowerCase().includes(query)) return true;
      // Search by assignee name
      if (ticket.assignedTo.name.toLowerCase().includes(query)) return true;
      // Search by status
      if (ticket.status.toLowerCase().includes(query)) return true;
      // Search by priority
      if (ticket.priority.toLowerCase().includes(query)) return true;
      return false;
    });
  }

  // Sort tickets
  let sortedTickets = [...filteredTickets];
  if (sortColumn) {
    sortedTickets.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'assignedTo') {
        aVal = (a.assignedTo as any).name;
        bVal = (b.assignedTo as any).name;
      }

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }

  // Paginate
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentPageTickets = paginatedTickets.map(t => t.id);
  const allCurrentPageSelected = currentPageTickets.every(id => selectedTickets.has(id)) && currentPageTickets.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="request" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selectedTickets.size} />
        <Toolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <TicketGroupSuggestions />
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <TicketTable
              tickets={paginatedTickets}
              selectedTickets={selectedTickets}
              allSelected={allCurrentPageSelected}
              onSelectAll={handleSelectAll}
              onSelectTicket={handleSelectTicket}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onTicketClick={handleOpenTicket}
              onUpdateTicket={updateTicket}
              allTickets={sortedTickets}
              onGroupedChange={(g, info) => { setIsGrouped(g); setGroupInfo(g ? info ?? null : null); }}
              clearGroupingSignal={clearGroupTick}
            />
            
          </div>
            {!isGrouped && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sortedTickets.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
            )}
            {/* Grouped mode keeps a PINNED footer — paging lives inside the groups, so
                this bar summarises the grouping instead of duplicating page controls. */}
            {isGrouped && groupInfo && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-6 py-2.5">
                <span className="text-[12px] text-[#64748B] tabular-nums">
                  Showing <span className="font-medium text-[#364658]">{groupInfo.total}</span> requests in{' '}
                  <span className="font-medium text-[#364658]">{groupInfo.groups}</span> groups
                </span>
                <span className="flex items-center gap-2 text-[12px] text-[#64748B]">
                  {(groupInfo.list?.length ?? 0) > 1 && (
                    <span className="relative mr-1">
                      <button
                        onClick={() => {
                          setJumpOpen((v) => !v);
                          setJumpQuery('');
                        }}
                        className="inline-flex h-7 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5FAFF]"
                      >
                        Jump to group
                        <ChevronUp size={13} className={`text-[#9CA3AF] transition-transform ${jumpOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {jumpOpen && (
                        <div className="absolute bottom-full right-0 z-50 mb-1.5 w-[280px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl">
                          <div className="p-2">
                            <input
                              autoFocus
                              value={jumpQuery}
                              onChange={(e) => setJumpQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setJumpOpen(false);
                              }}
                              onBlur={() => setJumpOpen(false)}
                              placeholder={'Search ' + groupInfo.label.toLowerCase() + '...'}
                              className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                            />
                          </div>
                          {/* onMouseDown beats the input blur so the pick lands. */}
                          <div className="max-h-[300px] overflow-y-auto pb-1">
                            {(() => {
                              const q = jumpQuery.trim().toLowerCase();
                              const rows = (groupInfo.list ?? []).filter((g) => !q || g.key.toLowerCase().includes(q));
                              if (!rows.length) return <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching groups</div>;
                              return rows.map((g) => (
                                <button
                                  key={g.key}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    window.dispatchEvent(new CustomEvent('jump-to-group', { detail: g.key }));
                                    setJumpOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                                >
                                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{g.key}</span>
                                  <span className="flex-shrink-0 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#64748B]">{g.count}</span>
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </span>
                  )}
                  Grouped by <span className="font-medium text-[#364658]">{groupInfo.label}</span>
                  <button
                    onClick={() => setClearGroupTick((t) => t + 1)}
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
                  >
                    Clear
                  </button>
                </span>
              </div>
            )}
        </main>
      </div>
      
      <TicketDrawer
        openTickets={openTickets}
        activeTicketId={activeTicketId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
export const MOCK_TICKETS: Ticket[] = generateMockTickets();
