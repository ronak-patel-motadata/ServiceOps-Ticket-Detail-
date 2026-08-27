import { useEffect, useState } from 'react';
import { ChevronDown, Download, Upload, Calendar, LayoutGrid, Star } from 'lucide-react';
import { AiSparkle } from './AiSparkle';

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Toolbar({ searchQuery, setSearchQuery }: ToolbarProps) {
  // Mirrors the AI grouping banner: when the user hits "Not now", this compact
  // AI pill appears here so the suggestions stay one click away.
  const [aiGroups, setAiGroups] = useState<{ hidden: boolean; count: number }>({ hidden: false, count: 0 });
  useEffect(() => {
    const onState = (e: Event) => setAiGroups((e as CustomEvent).detail as { hidden: boolean; count: number });
    window.addEventListener('suggested-groups-state', onState as EventListener);
    return () => window.removeEventListener('suggested-groups-state', onState as EventListener);
  }, []);
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
          {aiGroups.hidden && aiGroups.count > 0 && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-suggested-groups'))}
              className="mr-1 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                border: '1px solid transparent',
              }}
            >
              <AiSparkle size={13} />
              Suggested groups
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums text-[#364658]"
                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%)' }}
              >
                {aiGroups.count}
              </span>
            </button>
          )}
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