import { ChevronDown, ChevronRight, Mail, X, Clock, MoreVertical, Edit2, Plus, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { CreateApprovalPopup } from './CreateApprovalPopup';
import { ApprovalCommentPopup } from './ApprovalCommentPopup';

interface Approver {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Ignored';
  statusChangedAt?: string;
}

interface ApprovalLevel {
  level: number;
  approvers: Approver[];
}

interface Approval {
  id: string;
  subject: string;
  createdBy: string;
  createdAt: string;
  type: 'Unanimous' | 'Majority' | 'Anyone' | 'First Approval';
  status: 'Pending' | 'Approved' | 'Rejected';
  levels: ApprovalLevel[];
}

interface ApprovalsTabContentProps {
  ticketId?: string;
  approvalSubjects?: [string, string];
  showCreateApprovalPopup?: boolean;
  onCloseApprovalPopup?: () => void;
  onOpenApprovalPopup?: () => void;
  onApprove?: () => void;
}

export function ApprovalsTabContent({
  ticketId,
  approvalSubjects,
  showCreateApprovalPopup: externalShowPopup,
  onCloseApprovalPopup,
  onOpenApprovalPopup,
  onApprove
}: ApprovalsTabContentProps = {}) {
  // Empty state for blank ticket (INC-32)
  const isBlankTicket = ticketId === 'INC-32';
  
  const [expandedApprovalId, setExpandedApprovalId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [internalShowPopup, setInternalShowPopup] = useState(false);
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  // Use external popup state if provided, otherwise use internal state
  const showCreateApprovalPopup = externalShowPopup !== undefined ? externalShowPopup : internalShowPopup;
  const handleOpenPopup = onOpenApprovalPopup || (() => setInternalShowPopup(true));
  const handleClosePopup = onCloseApprovalPopup || (() => setInternalShowPopup(false));

  // Mock current logged-in user
  const currentUserEmail = 'jane.smith@company.com';

  // Problem records (PBM-xxx) get problem-management-relevant approvals
  const isProblem = ticketId?.startsWith('PBM');

  const problemApprovals: Approval[] = [
    {
      id: '1',
      subject: approvalSubjects?.[0] ?? 'Approval Required: Restore MX Records & DNS Rollback',
      createdBy: 'Rakesh Rathod',
      createdAt: 'Mar 11, 6:34 PM',
      type: 'Anyone',
      status: 'Pending',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '1', name: 'John Doe', email: 'john.doe@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:06 PM' },
            { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        },
        {
          level: 2,
          approvers: [
            { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '5', name: 'Tom Brown', email: 'tom.brown@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        }
      ]
    },
    {
      id: '2',
      subject: approvalSubjects?.[1] ?? 'Emergency Change Approval: Mail Server Configuration Fix',
      createdBy: 'Admin User',
      createdAt: 'Mar 10, 2:15 PM',
      type: 'Majority',
      status: 'Approved',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '6', name: 'Alice Cooper', email: 'alice.cooper@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 2:45 PM' },
            { id: '7', name: 'Bob Martin', email: 'bob.martin@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 3:12 PM' },
            { id: '8', name: 'Carol White', email: 'carol.white@company.com', status: 'Rejected', statusChangedAt: 'Tue, 10 Mar 3:30 PM' },
          ]
        }
      ]
    }
  ];

  const defaultApprovals: Approval[] = [
    {
      id: '1',
      subject: 'Approval Required: Apple MacBook Pro',
      createdBy: 'Rakesh Rathod',
      createdAt: 'Mar 11, 6:34 PM',
      type: 'Anyone',
      status: 'Pending',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '1', name: 'John Doe', email: 'john.doe@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:06 PM' },
            { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        },
        {
          level: 2,
          approvers: [
            { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '5', name: 'Tom Brown', email: 'tom.brown@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        }
      ]
    },
    {
      id: '2',
      subject: 'Software License Approval',
      createdBy: 'Admin User',
      createdAt: 'Mar 10, 2:15 PM',
      type: 'Majority',
      status: 'Approved',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '6', name: 'Alice Cooper', email: 'alice.cooper@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 2:45 PM' },
            { id: '7', name: 'Bob Martin', email: 'bob.martin@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 3:12 PM' },
            { id: '8', name: 'Carol White', email: 'carol.white@company.com', status: 'Rejected', statusChangedAt: 'Tue, 10 Mar 3:30 PM' },
          ]
        }
      ]
    }
  ];

  // Mock data
  // Records that pass approvalSubjects (Problem, Change) get the contextual two-approval set; others keep the default.
  const initialApprovals: Approval[] = isBlankTicket ? [] : ((isProblem || approvalSubjects) ? problemApprovals : defaultApprovals);

  // State for approvals
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);

  // Filter out second approval for INC-35
  const filteredApprovals = ticketId === 'INC-35' ? approvals.filter(a => a.id === '1') : approvals;

  // Function to update approver status
  const updateApproverStatus = (approvalId: string, approverId: string, newStatus: 'Approved' | 'Rejected') => {
    setApprovals(prevApprovals => 
      prevApprovals.map(approval => {
        if (approval.id === approvalId) {
          return {
            ...approval,
            status: newStatus, // Update overall approval status
            levels: approval.levels.map(level => ({
              ...level,
              approvers: level.approvers.map(approver => {
                if (approver.id === approverId) {
                  const now = new Date();
                  const formattedDate = now.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return {
                    ...approver,
                    status: newStatus,
                    statusChangedAt: formattedDate
                  };
                }
                return approver;
              })
            }))
          };
        }
        return approval;
      })
    );
    
    // Call onApprove callback when user approves
    if (newStatus === 'Approved' && onApprove) {
      onApprove();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
      case 'Rejected':
        return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
      case 'Pending':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
      case 'Ignored':
        return 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]';
      default:
        return 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]';
    }
  };

  const getTypeColor = (type: string) => {
    return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
  };

  const toggleAccordion = (approvalId: string) => {
    if (expandedApprovalId === approvalId) {
      setExpandedApprovalId(null);
    } else {
      setExpandedApprovalId(approvalId);
      setSelectedLevel(2);
    }
  };

  if (filteredApprovals.length === 0) {
    return (
      <div className="px-6 pb-6 pt-3">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <Mail className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#364658] mb-2">No Approvals</h3>
            <p className="text-[13px] text-[#7B8FA5]">
              There are no approval requests for this ticket
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-3">
      <div className="space-y-3">
        {filteredApprovals.map((approval) => {
          const isExpanded = expandedApprovalId === approval.id;
          const currentLevel = approval.levels.find(l => l.level === selectedLevel);

          return (
            <div
              key={approval.id}
              className="bg-white border border-[#E5E7EB] rounded-lg hover:border-[#3D8BD0] transition-colors"
            >
              {/* Collapsed Header */}
              <div 
                onClick={() => toggleAccordion(approval.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors rounded-lg cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAccordion(approval.id);
                      }}
                      className="text-left"
                    >
                      <h3 className="text-[14px] font-semibold text-[#364658]">
                        {approval.subject}
                      </h3>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingApproval(approval);
                        handleOpenPopup();
                      }}
                      className="p-1 hover:bg-[#E5E7EB] rounded transition-colors flex-shrink-0"
                      title="Edit Approval"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle chat functionality
                        setSelectedApprovalId(approval.id);
                        setShowCommentPopup(true);
                      }}
                      className="p-1 hover:bg-[#E5E7EB] rounded transition-colors flex-shrink-0"
                      title="Approval Comment"
                    >
                      <MessageSquare size={14} className="text-[#7B8FA5]" />
                    </button>
                  </div>
                  <p className="text-[12px] text-[#7B8FA5]">
                    Created by {approval.createdBy} • {approval.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded border ${getTypeColor(approval.type)}`}>
                    {approval.type}
                  </span>
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded border ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion(approval.id);
                    }} 
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-[#6B7280]" />
                    ) : (
                      <ChevronRight size={16} className="text-[#6B7280]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#E5E7EB]">
                  {/* Level Tabs */}
                  {approval.levels.length > 1 && (
                    <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-medium text-[#6B7280] mr-2">
                          Approval Level
                        </span>
                        {approval.levels.map((level) => (
                          <button
                            key={level.level}
                            onClick={() => setSelectedLevel(level.level)}
                            className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                              selectedLevel === level.level
                                ? 'bg-[#3D8BD0] text-white'
                                : 'bg-white text-[#364658] border border-[#DFE5ED] hover:border-[#3D8BD0]'
                            }`}
                          >
                            Level {level.level}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approvers Table */}
                  {currentLevel && (
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E5E7EB]">
                            <th className="pb-2 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
                              Approver
                            </th>
                            <th className="pb-2 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
                              Status
                            </th>
                            <th className="pb-2 text-right text-[12px] font-semibold text-[#364658] tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLevel.approvers.map((approver) => (
                            <tr key={approver.id} className="border-b border-[#E5E7EB] last:border-0">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-[24px] h-[24px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-[10px] font-medium">
                                    {approver.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] text-[#364658] font-medium">
                                      {approver.name}
                                    </span>
                                    <span className="text-[12px] text-[#7B8FA5]">
                                      {approver.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="group relative inline-block">
                                  <span className={`inline-flex items-center px-2.5 py-1 text-[12px] font-medium rounded border ${getStatusColor(approver.status)}`}>
                                    {approver.status}
                                  </span>
                                  {approver.statusChangedAt && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-[#1F2937] text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                      {approver.status === 'Pending' ? 'Pending since' : `${approver.status} on`} {approver.statusChangedAt}
                                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2937]"></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {approver.status === 'Pending' && approver.name === 'Sarah Johnson' && (
                                    <>
                                      <button 
                                        onClick={() => updateApproverStatus(approval.id, approver.id, 'Approved')}
                                        className="px-3 py-1 bg-[#059669] text-white text-[12px] font-medium rounded hover:bg-[#047857] transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => updateApproverStatus(approval.id, approver.id, 'Rejected')}
                                        className="px-3 py-1 bg-[#DC2626] text-white text-[12px] font-medium rounded hover:bg-[#B91C1C] transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {approver.status === 'Pending' && (
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenDropdownId(openDropdownId === approver.id ? null : approver.id)}
                                        className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                                      >
                                        <MoreVertical size={16} className="text-[#6B7280]" />
                                      </button>
                                      {openDropdownId === approver.id && (
                                        <div className="absolute right-0 top-full mt-1 w-[140px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-10">
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Ignore
                                          </button>
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Remind
                                          </button>
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#EF4444] hover:bg-[#FEE2E2] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="mt-4 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded-lg hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
        onClick={handleOpenPopup}
      >
        <Plus size={16} />
        Create Approval
      </button>
      {showCreateApprovalPopup && (
        <CreateApprovalPopup
          isOpen={showCreateApprovalPopup}
          onClose={() => {
            handleClosePopup();
            setEditingApproval(null);
          }}
          approval={editingApproval}
        />
      )}
      {showCommentPopup && selectedApprovalId && (
        <ApprovalCommentPopup
          isOpen={showCommentPopup}
          onClose={() => setShowCommentPopup(false)}
          approvalId={selectedApprovalId}
          approvalSubject={approvals.find(a => a.id === selectedApprovalId)?.subject || ''}
        />
      )}
    </div>
  );
}