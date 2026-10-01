/* ── Knowledge folder rail ───────────────────────────────────────────────────
   The knowledge base is navigated by FOLDER, so the folders sit where the CMDB puts
   its class tree: left of the grid, sharing that slot with the views rail. Same
   chrome as the CMDB rail — title row built to the grid's own header recipe, a
   search, rows with count chips and the light-blue selected fill — because two
   navigators that behave alike should look alike.

   Flat rather than a tree: a folder holds articles, not other folders. */
import { useState } from 'react';
import { Folder, FolderOpen, PanelLeftClose, PanelLeftOpen, Plus, Search, Trash2, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

export interface FolderRow {
  id: string;
  label: string;
  count: number;
}

const SHELL = 'group/fr flex items-center gap-1 rounded px-1.5 transition-colors';
const LABEL = 'flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-[13px] transition-colors';
const COUNT = 'ml-auto min-w-[26px] flex-shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums transition-colors';

export function KnowledgeFolderRail({
  folders,
  total,
  trash,
  active,
  onSelect,
  forceCollapsed = false,
  onExpand,
}: {
  folders: FolderRow[];
  total: number;
  trash: number;
  active: string;
  onSelect: (id: string) => void;
  /** The page needs the slot for the views rail — show the strip instead. */
  forceCollapsed?: boolean;
  onExpand?: () => void;
}) {
  const [collapsedLocal, setCollapsed] = useState(false);
  const collapsed = collapsedLocal || forceCollapsed;
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  const shown = query ? folders.filter((f) => f.label.toLowerCase().includes(query)) : folders;

  const row = (id: string, label: string, icon: React.ReactNode, count: number) => {
    const on = active === id;
    return (
      <div key={id} className={`${SHELL} ${on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
        <button onClick={() => onSelect(id)} className={`${LABEL} ${on ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}>
          <span className={`flex-shrink-0 ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{icon}</span>
          <span className="truncate">{label}</span>
          <span className={`${COUNT} ${on ? 'bg-[#DBEAFE] text-[#3D8BD0]' : 'bg-[#F1F5F9] text-[#64748B] group-hover/fr:bg-[#E8EDF3]'}`}>{count}</span>
        </button>
      </div>
    );
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setCollapsed(false); onExpand?.(); }}
            className="group/strip flex w-[48px] flex-shrink-0 flex-col items-center border-r border-[#E5E7EB] bg-white py-3 text-left transition-colors hover:bg-[#F7F9FC]"
          >
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors group-hover/strip:border-[#3D8BD0] group-hover/strip:bg-[#EBF5FF] group-hover/strip:text-[#3D8BD0]">
              <PanelLeftOpen size={16} />
            </span>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] [writing-mode:vertical-rl]">
              {active === 'all' ? 'All Folders' : active === 'trash' ? 'Trash' : folders.find((f) => f.id === active)?.label ?? 'Folders'}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Show folders</TooltipContent>
      </Tooltip>
    );
  }

  return (
    /* The same 344px the CMDB's class rail uses — two navigators in the same slot should
       not shift the grid's left edge when you move between modules. */
    <div className="flex w-[344px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      {/* Built to the same recipe as the grid's title row, so the two sit on one line. */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1E293B]">Folders</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => toast('New folder — coming soon')}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <Plus size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New folder</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(true)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <PanelLeftClose size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide folders</TooltipContent>
        </Tooltip>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search folders"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3D8BD0]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {row('all', 'All Folders', <FolderOpen size={15} />, total)}
        <div className="my-1.5 border-t border-[#F0F2F5]" />
        {shown.map((f) => row(f.id, f.label, <Folder size={15} />, f.count))}
        {query && !shown.length && (
          <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No folder matches “{q}”.</div>
        )}
        {!query && (
          <>
            <div className="my-1.5 border-t border-[#F0F2F5]" />
            {row('trash', 'Trash', <Trash2 size={15} />, trash)}
          </>
        )}
      </div>
    </div>
  );
}
