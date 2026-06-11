import { Clock } from 'lucide-react';

interface AuditTrailsTabContentProps {
  ticketId?: string;
}

export function AuditTrailsTabContent({ ticketId }: AuditTrailsTabContentProps = {}) {
  // Empty state for blank ticket (INC-32)
  const isBlankTicket = ticketId === 'INC-32';
  
  const auditTrails = isBlankTicket ? [] : [
    {
      id: '1',
      timestamp: '2024-03-10 14:32:15',
      user: 'Sarah Smith',
      userInitials: 'SS',
      userColor: '#F59E0B',
      action: 'Status Changed',
      details: 'Changed status from "Open" to "In Progress"',
      changes: [
        { field: 'Status', oldValue: 'Open', newValue: 'In Progress' }
      ]
    },
    {
      id: '2',
      timestamp: '2024-03-10 13:45:22',
      user: 'John Doe',
      userInitials: 'JD',
      userColor: '#3D8BD0',
      action: 'Priority Updated',
      details: 'Changed priority from "Normal" to "High"',
      changes: [
        { field: 'Priority', oldValue: 'Normal', newValue: 'High' }
      ]
    },
    {
      id: '3',
      timestamp: '2024-03-10 12:18:40',
      user: 'Michael Chen',
      userInitials: 'MC',
      userColor: '#8B5CF6',
      action: 'Assignee Changed',
      details: 'Assigned to Sarah Smith',
      changes: [
        { field: 'Assignee', oldValue: 'Unassigned', newValue: 'Sarah Smith' }
      ]
    },
    {
      id: '4',
      timestamp: '2024-03-10 11:05:13',
      user: 'System',
      userInitials: 'SYS',
      userColor: '#6B7280',
      action: 'Comment Added',
      details: 'Added a new comment to the ticket',
      changes: []
    },
    {
      id: '5',
      timestamp: '2024-03-10 10:22:55',
      user: 'Emily Rodriguez',
      userInitials: 'ER',
      userColor: '#EC4899',
      action: 'Attachment Added',
      details: 'Uploaded file: network_diagram.pdf',
      changes: []
    },
    {
      id: '6',
      timestamp: '2024-03-10 09:30:00',
      user: 'John Doe',
      userInitials: 'JD',
      userColor: '#3D8BD0',
      action: 'Custom Field Updated',
      details: 'Changed Impact from "Low" to "Medium"',
      changes: [
        { field: 'Impact', oldValue: 'Low', newValue: 'Medium' }
      ]
    },
    {
      id: '7',
      timestamp: '2024-03-09 16:45:30',
      user: 'Sarah Smith',
      userInitials: 'SS',
      userColor: '#F59E0B',
      action: 'Tag Added',
      details: 'Added tags: "Network Issue", "Urgent"',
      changes: []
    },
    {
      id: '8',
      timestamp: '2024-03-09 15:12:18',
      user: 'System',
      userInitials: 'SYS',
      userColor: '#6B7280',
      action: 'Ticket Created',
      details: 'Ticket was created by Alex Johnson',
      changes: []
    }
  ];

  return (
    <div className="px-6 py-6">
      <div className="space-y-4">
        {/* Empty State */}
        {auditTrails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <Clock className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Audit Trails Yet</h3>
            <p className="text-[13px] text-[#7B8FA5] max-w-[300px]">
              Audit trail entries will appear here as actions are performed on this ticket.
            </p>
          </div>
        ) : (
          /* Timeline */
          <div className="relative">
            {/* Audit Trail Items */}
            {auditTrails.map((audit, index, array) => (
            <div key={audit.id} className="relative flex gap-3 mb-4 p-3 -mx-3 rounded-lg hover:bg-[#F9FAFB] transition-colors">
              {/* Timeline Line */}
              {index !== array.length - 1 && (
                <div className="absolute left-[24px] top-[24px] bottom-[-24px] w-[1px] bg-[#E5E7EB]" />
              )}
              
              {/* User Avatar */}
              <div 
                className="size-[24px] rounded-[4px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 relative z-10"
                style={{ backgroundColor: audit.userColor }}
              >
                {audit.userInitials}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="py-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-[#364658]">{audit.user}</span>
                        <span className="text-[12px] text-[#7B8FA5]">•</span>
                        <span className="text-[12px] text-[#7B8FA5]">
                          {audit.action}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#364658]">{audit.details}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] whitespace-nowrap">
                      <Clock size={11} />
                      <span>{audit.timestamp}</span>
                    </div>
                  </div>
                  
                  {/* Changes Table */}
                  {audit.changes.length > 0 && (
                    <div className="mt-2 pl-0">
                      <div className="space-y-1.5">
                        {audit.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[12px]">
                            <span className="text-[#9CA3AF] min-w-[70px]">{change.field}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#EF4444] line-through">
                                {change.oldValue}
                              </span>
                              <span className="text-[#D1D5DB]">→</span>
                              <span className="text-[#10B981] font-medium">
                                {change.newValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}