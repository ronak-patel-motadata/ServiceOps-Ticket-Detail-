import { Calendar, User, ChevronDown, Search, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Task {
  id: string;
  subject: string;
  userGroup: string;
  assignee: string;
  taskType: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  notifyBefore: string;
  notifyUnit: string;
  description: string;
  completed?: boolean;
}

interface TaskCardFieldsProps {
  task: Task;
  statusColors: Record<string, string>;
  priorityColors: Record<string, string>;
  onUpdateTask: (task: Task) => void;
}

export function TaskCardFields({ task, statusColors, priorityColors, onUpdateTask }: TaskCardFieldsProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { label: 'Open', color: '#F59E0B' },
    { label: 'In Progress', color: '#3D8BD0' },
    { label: 'Pending', color: '#F59E0B' },
    { label: 'Rejected', color: '#EF4444' },
    { label: 'Resolved', color: '#10B981' },
    { label: 'Closed', color: '#9CA3AF' },
  ];

  const priorityOptions = [
    { label: 'Low', color: '#10B981' },
    { label: 'Normal', color: '#3D8BD0' },
    { label: 'High', color: '#F59E0B' },
    { label: 'Critical', color: '#EF4444' },
  ];

  const assigneeOptions = [
    { label: 'John Doe', initials: 'JD', color: '#3D8BD0', statusColor: '#10B981' },
    { label: 'Sarah Smith', initials: 'SS', color: '#F59E0B', statusColor: '#10B981' },
    { label: 'Michael Chen', initials: 'MC', color: '#8B5CF6', statusColor: '#EF4444' },
    { label: 'Emily Rodriguez', initials: 'ER', color: '#EC4899', statusColor: '#F59E0B' },
  ];

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Status, Priority, Assignee, Timeline Row */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr', marginLeft: '-8px', marginRight: '-8px' }}>
        {/* Status */}
        <div className="relative group" ref={statusRef}>
          <label className="text-[12px] text-[#7B8FA5] mb-1 block pl-2">Status</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusDropdown(!showStatusDropdown);
            }}
            className="flex items-center gap-1.5 hover:bg-[#F5F7FA] px-2 py-1 rounded transition-colors w-full"
          >
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: statusOptions.find(opt => opt.label === task.status)?.color || '#7B8FA5' }}
            />
            <span className="text-[13px] font-medium text-[#364658] truncate flex-1 text-left">{task.status}</span>
            <ChevronDown size={12} className="text-[#7B8FA5] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {statusOptions.map((option) => (
                <button
                  key={option.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ 
                      ...task, 
                      status: option.label,
                      completed: option.label === 'Closed' ? true : task.completed
                    });
                    setShowStatusDropdown(false);
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-[13px] text-[#364658]">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative group" ref={priorityRef}>
          <label className="text-[12px] text-[#7B8FA5] mb-1 block pl-2">Priority</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPriorityDropdown(!showPriorityDropdown);
            }}
            className="flex items-center gap-1.5 hover:bg-[#F5F7FA] px-2 py-1 rounded transition-colors"
          >
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: priorityColors[task.priority] || '#7B8FA5' }}
            />
            <span className="text-[13px] font-medium text-[#364658]">{task.priority}</span>
            <ChevronDown size={12} className="text-[#7B8FA5] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {showPriorityDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {priorityOptions.map((option) => (
                <button
                  key={option.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ ...task, priority: option.label });
                    setShowPriorityDropdown(false);
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-[13px] text-[#364658]">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="relative group" ref={assigneeRef}>
          <label className="text-[12px] text-[#7B8FA5] mb-1 block pl-2">Assignee</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAssigneeDropdown(!showAssigneeDropdown);
            }}
            className="flex items-center gap-1.5 hover:bg-[#F5F7FA] px-2 py-1 rounded transition-colors w-full"
          >
            {task.assignee === 'Unassigned' ? (
              <div className="size-[14px] rounded-full border border-dashed border-[#9CA3AF] flex-shrink-0"></div>
            ) : (
              <div 
                className="size-[18px] rounded flex items-center justify-center text-[8px] font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: assigneeOptions.find(opt => opt.label === task.assignee)?.color || '#3D8BD0' }}
              >
                {assigneeOptions.find(opt => opt.label === task.assignee)?.initials || task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <span className="text-[13px] font-medium text-[#364658] truncate flex-1 text-left">{task.assignee}</span>
            <ChevronDown size={12} className="text-[#7B8FA5] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
          
          {showAssigneeDropdown && (
            <div className="absolute top-full right-0 mt-1 w-full min-w-[240px] max-w-[260px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
              {/* Search Box */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search for users..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-9 pr-3 py-1.5 text-[13px] text-[#364658] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Unassigned Option */}
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors border-b border-[#E5E7EB]"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTask({ ...task, assignee: 'Unassigned' });
                  setShowAssigneeDropdown(false);
                  setAssigneeSearchQuery('');
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-6 rounded-full border-2 border-dashed border-[#9CA3AF] flex-shrink-0"></div>
                  <span className="text-[13px] text-[#364658] truncate">Unassigned</span>
                </div>
                {task.assignee === 'Unassigned' && (
                  <Check size={14} className="text-[#3D8BD0] flex-shrink-0" />
                )}
              </button>
              
              {/* Assignee Options */}
              {assigneeOptions
                .filter(option => option.label.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
                .map((option) => (
                  <button
                    key={option.label}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTask({ ...task, assignee: option.label });
                      setShowAssigneeDropdown(false);
                      setAssigneeSearchQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      >
                        {option.initials}
                      </div>
                      <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div 
                        className="size-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.statusColor }}
                      />
                      {task.assignee === option.label && (
                        <Check size={14} className="text-[#3D8BD0]" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Start Date and End Date */}
        <div className="relative group" ref={dateRef}>
          <label className="text-[12px] text-[#7B8FA5] mb-1 block pl-2">Due Date</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDateDropdown(!showDateDropdown);
            }}
            className="w-full flex items-center gap-1.5 hover:bg-[#F5F7FA] px-2 py-1 rounded transition-colors"
          >
            <Calendar size={14} className="text-[#7B8FA5] flex-shrink-0" />
            <div className="text-[13px] font-medium text-[#364658] flex-1 text-left">
              {task.endDate ? (
                <span>{formatDate(task.endDate)} {new Date(task.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              ) : (
                <span>Set Due Date</span>
              )}
            </div>
            <ChevronDown size={12} className="text-[#7B8FA5] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {showDateDropdown && (
            <div className="absolute top-full right-0 mt-1 w-full min-w-[280px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] p-4 z-50">
              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Start Date</label>
                  <input
                    type="datetime-local"
                    value={task.startDate}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateTask({ ...task, startDate: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-[13px] text-[#364658] font-medium bg-white border border-[#DFE5ED] rounded px-3 py-2 outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                  />
                </div>
                
                {/* End Date */}
                <div>
                  <label className="text-[12px] text-[#7B8FA5] mb-1 block">Due Date</label>
                  <input
                    type="datetime-local"
                    value={task.endDate}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateTask({ ...task, endDate: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-[13px] text-[#364658] font-medium bg-white border border-[#DFE5ED] rounded px-3 py-2 outline-none focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}