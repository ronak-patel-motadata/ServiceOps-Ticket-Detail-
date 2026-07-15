import { useEffect, useState } from 'react';
import { Bookmark, Check, ChevronDown, RotateCcw, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { RelViewSnapshot } from './RelationshipGraph';

/** A user-saved Relationship/Dependency-map view: toolbar state + canvas snapshot. */
export interface SavedRelView {
  id: string;
  name: string;
  /** Toolbar view mode ('graph' | 'tree' | 'grid'). */
  mode: string;
  /** Toolbar type filter (null = All). */
  filter: string | null;
  /** Toolbar connection-type filter (null = All). */
  connFilter?: string | null;
  /** Canvas state (expansions / pins / viewport) — null when saved from grid view. */
  graph: RelViewSnapshot | null;
}

interface RelSavedViewsProps {
  /** localStorage key (per module) so saved views persist across sessions. */
  storageKey: string;
  /** Snapshot the CURRENT toolbar + canvas state (called when the user saves). */
  capture: () => Omit<SavedRelView, 'id' | 'name'>;
  /** Re-apply a saved view to the toolbar + canvas. */
  apply: (view: SavedRelView) => void;
  /** Return to the DEFAULT view (no saved view applied): clear filters + reset the canvas. */
  reset?: () => void;
}

/**
 * Toolbar "Saved Views" button + popup for the Relationship / Dependency map.
 * Lets the user name-and-save the current canvas state (view mode, filter, expanded
 * nodes, manual pins, viewport) and re-apply any saved view with one click.
 */
export function RelSavedViews({ storageKey, capture, apply, reset }: RelSavedViewsProps) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedRelView[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { return []; }
  });
  const [name, setName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Persist on every change.
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(views)); } catch { /* storage full/blocked — view list just won't persist */ }
  }, [storageKey, views]);

  const saveCurrent = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const view: SavedRelView = { id: `v-${Date.now()}`, name: trimmed, ...capture() };
    setViews((prev) => [...prev, view]);
    setActiveId(view.id);
    setName('');
  };

  // Pill label: the applied view's name (highlighted blue), else a neutral "Views".
  const activeView = views.find((v) => v.id === activeId) ?? null;
  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors ${activeView ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            <Bookmark size={14} className={activeView ? 'text-[#3D8BD0]' : 'text-[#6b7280]'} />
            <span className="max-w-[140px] truncate">{activeView?.name ?? 'Views'}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${activeView ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Saved views</TooltipContent>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50">
            <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Saved Views</h4>
            {views.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] mb-3">No saved views yet — expand nodes or apply a filter, then save it below.</p>
            ) : (
              <div className="mb-3 max-h-[220px] overflow-y-auto -mx-1 px-1">
                {/* Default view — deselects the applied saved view and resets the canvas */}
                <button
                  onClick={() => { setActiveId(null); reset?.(); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left hover:bg-[#F5F7FA] transition-colors"
                  title="Back to the default view"
                >
                  <RotateCcw size={13} className={!activeId ? 'text-[#3D8BD0] flex-shrink-0' : 'text-[#9CA3AF] flex-shrink-0'} />
                  <span className={`text-[13px] truncate ${!activeId ? 'text-[#3D8BD0] font-medium' : 'text-[#364658]'}`}>Default view</span>
                  {!activeId && <Check size={13} className="text-[#3D8BD0] flex-shrink-0 ml-auto" />}
                </button>
                {views.map((v) => (
                  <div key={v.id} className="group flex items-center gap-2 rounded-md hover:bg-[#F5F7FA] transition-colors">
                    <button
                      onClick={() => { if (activeId === v.id) { setActiveId(null); reset?.(); } else { apply(v); setActiveId(v.id); } setOpen(false); }}
                      className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2 text-left"
                      title={activeId === v.id ? `Deselect "${v.name}" (back to default)` : `Apply "${v.name}"`}
                    >
                      <Bookmark size={13} className={activeId === v.id ? 'text-[#3D8BD0] flex-shrink-0' : 'text-[#9CA3AF] flex-shrink-0'} />
                      <span className={`text-[13px] truncate ${activeId === v.id ? 'text-[#3D8BD0] font-medium' : 'text-[#364658]'}`}>{v.name}</span>
                      {activeId === v.id && <Check size={13} className="text-[#3D8BD0] flex-shrink-0 ml-auto" />}
                    </button>
                    <button
                      title="Delete view"
                      onClick={() => { setViews((prev) => prev.filter((x) => x.id !== v.id)); if (activeId === v.id) setActiveId(null); }}
                      className="mr-1 hidden group-hover:flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:text-[#DC2626] hover:bg-[#FDECEC] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-[#EEF1F4] pt-3">
              <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">Save current view</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCurrent(); }}
                  placeholder="View name..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] text-[#364658] border border-[#DFE5ED] rounded-md placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0]"
                />
                <button
                  onClick={saveCurrent}
                  disabled={!name.trim()}
                  className="px-3 py-1.5 rounded-md bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#2F7AB8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
