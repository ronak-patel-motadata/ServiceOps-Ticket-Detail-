import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface TabItem { id: string; subject?: string }

const TAB_W = 170;   // fixed tab width (matches the tab styling below)
const MORE_W = 96;   // approx width reserved for the "More (N)" button

/**
 * Open-item tab strip for the detail drawers. Measures its own width and shows as
 * many fixed-width tabs as fit; the rest collapse behind a "More (N) ▾" dropdown
 * (floating, absolutely positioned) that sits at the end of the strip. The active
 * item is always kept visible.
 */
export function DrawerTabStrip({
  items,
  activeId,
  onSelect,
  onClose,
}: {
  items: TabItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  maxVisible?: number;
}) {
  const [showMore, setShowMore] = useState(false);
  const [maxFit, setMaxFit] = useState(items.length);
  const rootRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Measure available width → how many tabs fit before we need a "More" dropdown.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      if (items.length * TAB_W <= w) setMaxFit(items.length);
      else setMaxFit(Math.max(1, Math.floor((w - MORE_W) / TAB_W)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false); };
    if (showMore) {
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }
  }, [showMore]);

  let visible = items.slice(0, maxFit);
  let overflow = items.slice(maxFit);
  // Keep the active item visible: if it's hidden, swap it into the last visible slot.
  if (activeId && overflow.some((i) => i.id === activeId) && visible.length > 0) {
    const act = overflow.find((i) => i.id === activeId)!;
    const bumped = visible[visible.length - 1];
    visible = [...visible.slice(0, -1), act];
    overflow = [bumped, ...overflow.filter((i) => i.id !== activeId)];
  }
  const activeInOverflow = overflow.some((i) => i.id === activeId);

  return (
    <div ref={rootRef} className="flex items-center flex-1 min-w-0">
      {visible.map((t) => {
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-2 border-r border-[#e5e7eb] cursor-pointer flex-shrink-0 w-[170px] ${active ? 'bg-white border-b-2 border-b-[#3D8BD0]' : 'hover:bg-white/50'}`}
            onClick={() => onSelect(t.id)}
          >
            <span className={`text-[12px] font-semibold whitespace-nowrap ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>{t.id}</span>
            <span className="text-[12px] text-[#364658] truncate flex-1">{t.subject}</span>
            <button onClick={(e) => { e.stopPropagation(); onClose(t.id); }} className="p-0.5 hover:bg-[#e5e7eb] rounded">
              <X size={14} className="text-[#6b7280]" />
            </button>
          </div>
        );
      })}

      {overflow.length > 0 && (
        <div className="relative flex-shrink-0 border-r border-[#e5e7eb]" ref={moreRef}>
          <button
            onClick={() => setShowMore((s) => !s)}
            className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${activeInOverflow ? 'text-[#3D8BD0]' : 'text-[#6b7280] hover:text-[#364658]'}`}
          >
            More ({overflow.length})
            <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 min-w-[260px] max-h-[340px] overflow-y-auto z-[9999]">
              {overflow.map((t) => {
                const active = t.id === activeId;
                return (
                  <div
                    key={t.id}
                    onClick={() => { onSelect(t.id); setShowMore(false); }}
                    className={`group/mt flex items-center gap-2 px-3 py-2 cursor-pointer ${active ? 'bg-[#EAF2FB]' : 'hover:bg-[#f9fafb]'}`}
                  >
                    <span className={`text-[12px] font-semibold whitespace-nowrap ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>{t.id}</span>
                    <span className="text-[12px] text-[#364658] truncate flex-1">{t.subject}</span>
                    <button onClick={(e) => { e.stopPropagation(); onClose(t.id); }} className="p-0.5 hover:bg-[#e5e7eb] rounded opacity-0 group-hover/mt:opacity-100 transition-opacity">
                      <X size={13} className="text-[#6b7280]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
