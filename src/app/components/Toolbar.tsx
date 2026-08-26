import { ChevronDown, Download, Upload, Calendar, LayoutGrid, Star } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Toolbar({ searchQuery, setSearchQuery }: ToolbarProps) {
  return (
    <div className="bg-white">
      {/* First Row: Title, Filters, and Actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
            <span>All Open Requests</span>
            <ChevronDown size={16} className="text-[#6b7280]" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="Download">
            <Download size={16} />
          </button>
          
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="Upload">
            <Upload size={16} />
          </button>
          
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="Calendar">
            <Calendar size={16} />
          </button>
          
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="Grid">
            <LayoutGrid size={16} />
          </button>
          
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="More">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/>
            </svg>
          </button>
          
          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA]" title="Settings">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}