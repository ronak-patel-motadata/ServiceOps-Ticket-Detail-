import { CheckSquare, Plus, Search, Filter, X, Check } from 'lucide-react';
import { TaskCardFields } from './TaskCardFields';
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

interface TasksTabContentProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TasksTabContent({ tasks, onAddTask, onEditTask, onUpdateTask, onDeleteTask }: TasksTabContentProps) {
  const [isTaskSearchExpanded, setIsTaskSearchExpanded] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [showTaskSortMenu, setShowTaskSortMenu] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'unresolved' | 'closed'>('all');
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<string, string> = {
    'Open': '#3D8BD0',
    'In Progress': '#F59E0B',
    'On Hold': '#9CA3AF',
    'Completed': '#10B981',
    'Cancelled': '#EF4444',
    'Closed': '#10B981',
  };

  const priorityColors: Record<string, string> = {
    'Low': '#10B981',
    'Normal': '#3D8BD0',
    'High': '#F59E0B',
    'Critical': '#EF4444',
  };

  // Click outside handler for sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowTaskSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks based on search query and filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.subject.toLowerCase().includes(taskSearchQuery.toLowerCase());
    const matchesFilter = 
      taskFilter === 'all' ? true :
      taskFilter === 'unresolved' ? task.status !== 'Closed' :
      taskFilter === 'closed' ? task.status === 'Closed' :
      true;
    return matchesSearch && matchesFilter;
  });

  if (tasks.length === 0) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <CheckSquare className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#364658] mb-2">No Tasks Yet</h3>
            <p className="text-[13px] text-[#7B8FA5] max-w-md mb-4">
              Get started by adding your first task to this service request.
            </p>
            <button
              onClick={onAddTask}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-sm font-medium rounded-lg hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Task list view
  return (
    <div className="px-6 pb-6 pt-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search Block */}
        {!isTaskSearchExpanded ? (
          <button 
            className="p-1.5 hover:bg-[#f9fafb] rounded transition-colors"
            title="Search"
            onClick={() => setIsTaskSearchExpanded(true)}
          >
            <Search size={16} className="text-[#6b7280]" />
          </button>
        ) : (
          <div className="flex items-center gap-2 h-9 px-3 border border-[#DFE5ED] rounded-lg bg-white flex-1">
            <Search size={16} className="text-[#7B8FA5]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="outline-none text-sm bg-transparent placeholder:text-[#9CA3AF] text-[#364658] flex-1"
              autoFocus
            />
            <button 
              className="p-0.5 hover:bg-[#F5F7FA] rounded transition-colors"
              onClick={() => {
                setIsTaskSearchExpanded(false);
                setTaskSearchQuery('');
              }}
            >
              <X size={14} className="text-[#7B8FA5]" />
            </button>
          </div>
        )}

        {/* Sort Icon */}
        <div className="relative task-sort-menu-container" ref={sortMenuRef}>
          <button
            onClick={() => setShowTaskSortMenu(!showTaskSortMenu)}
            className="p-1.5 hover:bg-[#f9fafb] rounded transition-colors"
            title="Sort tasks"
          >
            <Filter size={16} className="text-[#6b7280]" />
          </button>
          {showTaskSortMenu && (
            <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-[#DFE5ED] rounded-lg shadow-lg py-2 z-50">
              <button 
                onClick={() => {
                  setTaskFilter('unresolved');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'unresolved' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                Unresolved Tasks
                {taskFilter === 'unresolved' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
              <button 
                onClick={() => {
                  setTaskFilter('closed');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'closed' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                Closed Tasks
                {taskFilter === 'closed' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
              <button 
                onClick={() => {
                  setTaskFilter('all');
                  setShowTaskSortMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-[#364658] hover:bg-[#F5F7FA] transition-colors flex items-center justify-between ${
                  taskFilter === 'all' ? 'bg-[#F0F7FF] text-[#3D8BD0]' : ''
                }`}
              >
                All Tasks
                {taskFilter === 'all' && <Check size={16} className="text-[#3D8BD0]" />}
              </button>
            </div>
          )}
        </div>

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded-lg hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white border border-[#DFE5ED] rounded-lg p-4 hover:shadow-sm transition-shadow group"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={task.status === 'Closed'}
                  onChange={(e) => {
                    onUpdateTask({ 
                      ...task, 
                      completed: e.target.checked, 
                      status: e.target.checked ? 'Closed' : 'Open' 
                    });
                  }}
                  className="mt-0.5 w-4 h-4 text-[#00A9E0] border-[#DFE5ED] rounded focus:ring-[#00A9E0] focus:ring-2 cursor-pointer"
                />
                <h4 className={`text-sm font-semibold flex-1 ${task.status === 'Closed' ? 'line-through' : ''}`}>
                  <span className="text-[#3D8BD0] hover:underline cursor-pointer">TA-{task.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}</span>
                  <span className="text-[#364658]"> - {task.subject}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditTask(task)}
                  className="text-[#7B8FA5] hover:text-[#3D8BD0] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete task "${task.subject}"?`)) {
                      onDeleteTask(task.id);
                    }
                  }}
                  className="text-[#7B8FA5] hover:text-[#E74C3C] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6.66667 2.66667V2H9.33333V2.66667H6.66667ZM5.33333 2.66667V2C5.33333 1.26362 5.93029 0.666667 6.66667 0.666667H9.33333C10.0697 0.666667 10.6667 1.26362 10.6667 2V2.66667H13.3333H14.6667V4H13.3333V13.3333C13.3333 14.0697 12.7364 14.6667 12 14.6667H4C3.26362 14.6667 2.66667 14.0697 2.66667 13.3333V4H1.33333V2.66667H2.66667H5.33333ZM4 4V13.3333H12V4H4ZM6 6H7.33333V11.3333H6V6ZM9.33333 6H8V11.3333H9.33333V6Z" fill="#E74C3C" />
                  </svg>
                </button>
              </div>
            </div>

            <TaskCardFields 
              task={task}
              statusColors={statusColors}
              priorityColors={priorityColors}
              onUpdateTask={onUpdateTask}
            />
          </div>
        ))}
      </div>
    </div>
  );
}