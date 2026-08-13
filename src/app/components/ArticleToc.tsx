import { useEffect, useRef, useState } from 'react';

/* Section rail — the tick marks down the right edge of a long article.
 *
 * At rest it is almost nothing: one short line per section, the current one longer and blue. That
 * is enough to answer "how long is this and where am I" without spending any width on a table of
 * contents. Hovering opens the full list, and either the ticks or the list navigate. Modelled on
 * the reading rail Medium puts on long posts. */

export interface TocSection {
  id: string;
  text: string;
}

/** Nearest scrollable ancestor — the article scrolls inside the drawer, not the window. */
function scrollParentOf(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

export function ArticleToc({ sections }: { sections: TocSection[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  // A click sets the active tick immediately; the spy is parked so the smooth scroll on the way
  // there does not flicker through every section it passes.
  const spyPausedUntil = useRef(0);

  useEffect(() => {
    const root = scrollParentOf(railRef.current);
    if (!root || !sections.length) return;

    const onScroll = () => {
      if (Date.now() < spyPausedUntil.current) return;
      const rootTop = root.getBoundingClientRect().top;
      let current = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - rootTop <= 120) current = i;
      });
      // Hitting the bottom always means the last section, however short it is.
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 8) current = sections.length - 1;
      setActive(current);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener('scroll', onScroll);
  }, [sections]);

  const goTo = (i: number) => {
    const el = document.getElementById(sections[i].id);
    if (!el) return;
    setActive(i);
    spyPausedUntil.current = Date.now() + 900;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Under three sections the rail says less than the article's own headings already do.
  if (sections.length < 3) return null;

  return (
    <div
      ref={railRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative flex flex-col items-end gap-2 py-2"
    >
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => goTo(i)}
          aria-label={s.text}
          className="group/tick flex h-3 items-center justify-end"
        >
          <span
            className={`block h-[2px] rounded-full transition-all duration-200 ${
              i === active
                ? 'w-6 bg-[#3D8BD0]'
                : 'w-4 bg-[#CBD5E1] group-hover/tick:w-6 group-hover/tick:bg-[#94A3B8]'
            }`}
          />
        </button>
      ))}

      {/* The full list, opened by hovering anywhere on the rail. */}
      <div
        className={`absolute right-full top-1/2 mr-3 w-[268px] -translate-y-1/2 rounded-lg border border-[#E5E7EB] bg-white py-1.5 shadow-lg transition-all duration-150 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-x-1 opacity-0'
        }`}
      >
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] leading-snug transition-colors hover:bg-[#F5F9FD] ${
              i === active ? 'font-medium text-[#3D8BD0]' : 'text-[#64748B]'
            }`}
          >
            <span className={`size-1.5 flex-shrink-0 rounded-full ${i === active ? 'bg-[#3D8BD0]' : 'bg-transparent'}`} />
            <span className="truncate">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
