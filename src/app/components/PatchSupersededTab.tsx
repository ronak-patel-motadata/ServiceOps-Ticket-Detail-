import { useState } from 'react';
import { Search, X, Layers } from 'lucide-react';

type SupersededView = 'Superseded' | 'Superseded By';

interface ChainPatch {
  kb: string;
  title: string;
  build: string;
  releaseDate: string;
  severity: 'Critical' | 'Important' | 'Moderate' | 'Low';
}

/* Supersedence is a CHAIN, so instead of the old nested expand/collapse tree we render it as an
 * ordered timeline: this patch first, then each step of the lineage. Everything is visible at a
 * glance — no clicking through levels. */

// Older patches this one replaces (immediate predecessor first, then further back).
const SUPERSEDES: ChainPatch[] = [
  { kb: 'KB5068861', title: '2025-11 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.7171', releaseDate: 'Tue, Nov 11, 2025', severity: 'Critical' },
  { kb: 'KB5066835', title: '2025-10 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.6899', releaseDate: 'Tue, Oct 14, 2025', severity: 'Critical' },
  { kb: 'KB5065789', title: '2025-09 Cumulative Update Preview for Windows 11, version 25H2 for x64-based Systems', build: '26200.6725', releaseDate: 'Fri, Sep 26, 2025', severity: 'Moderate' },
  { kb: 'KB5065426', title: '2025-09 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.6584', releaseDate: 'Tue, Sep 09, 2025', severity: 'Important' },
  { kb: 'KB5064081', title: '2025-08 Cumulative Update Preview for Windows 11, version 25H2 for x64-based Systems', build: '26200.5074', releaseDate: 'Tue, Aug 26, 2025', severity: 'Moderate' },
  { kb: 'KB5063878', title: '2025-08 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.4946', releaseDate: 'Tue, Aug 12, 2025', severity: 'Important' },
];

// Newer patches that replace this one (immediate successor first).
const SUPERSEDED_BY: ChainPatch[] = [
  { kb: 'KB5077891', title: '2026-02 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8012', releaseDate: 'Tue, Feb 10, 2026', severity: 'Critical' },
  { kb: 'KB5081234', title: '2026-03 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8455', releaseDate: 'Tue, Mar 10, 2026', severity: 'Critical' },
  { kb: 'KB5085602', title: '2026-04 Cumulative Update for Windows 11, version 25H2 for x64-based Systems', build: '26200.8890', releaseDate: 'Tue, Apr 14, 2026', severity: 'Important' },
];

const VIEWS: SupersededView[] = ['Superseded', 'Superseded By'];
const DESCRIPTIONS: Record<SupersededView, string> = {
  'Superseded': 'This tab displays a list of superseded patches.',
  'Superseded By': 'This tab displays a list of new patches that replaces the older ones.',
};

const severityDot = (s: ChainPatch['severity']) =>
  s === 'Critical' ? '#EF4444' : s === 'Important' ? '#F59E0B' : s === 'Moderate' ? '#EAB308' : '#111827';

interface PatchSupersededTabProps {
  patchId?: string;
  patchName?: string;
}

export function PatchSupersededTab({ patchId, patchName }: PatchSupersededTabProps) {
  const [view, setView] = useState<SupersededView>('Superseded');
  const [search, setSearch] = useState('');

  const counts: Record<SupersededView, number> = { 'Superseded': SUPERSEDES.length, 'Superseded By': SUPERSEDED_BY.length };
  const chain = view === 'Superseded' ? SUPERSEDES : SUPERSEDED_BY;

  const q = search.trim().toLowerCase();
  const rows = chain.filter((p) =>
    !q || p.kb.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.build.includes(q)
  );

  return (
    <div className="px-6 py-4">
      {/* Sub-tab pills — same design as the Vulnerabilities / Endpoint tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[13px] font-medium transition-colors ${view === v ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            {v}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${view === v ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
              {counts[v]}
            </span>
          </button>
        ))}
      </div>

      {/* What this view shows */}
      <p className="text-[13px] text-[#7B8FA5] mb-3">{DESCRIPTIONS[view]}</p>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Select field to search..."
          className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        />
        {search ? (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
        )}
      </div>

      {chain.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#F5F7FA] mb-3">
            <Layers className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="text-[14px] font-medium text-[#364658]">
            {view === 'Superseded' ? 'No superseded patches' : 'Not superseded'}
          </p>
          <p className="text-[13px] text-[#7B8FA5] mt-1">
            {view === 'Superseded' ? 'This patch does not replace any earlier patch.' : 'This patch is the latest — nothing replaces it yet.'}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#9CA3AF]">No patches match your search.</div>
      ) : (
        /* Chain timeline — this patch first, then each step of the lineage (no nested expanding) */
        <div>
          {/* Anchor: the patch being viewed (only shown when not searching) */}
          {!q && (
            <div className="relative flex gap-3 pb-3">
              <div className="flex flex-col items-center pt-1.5">
                <span className="size-2.5 rounded-full bg-[#3D8BD0] ring-4 ring-[#EBF5FF] flex-shrink-0" />
                <span className="w-px flex-1 bg-[#E5E7EB] mt-1" />
              </div>
              <div className="flex-1 rounded-lg border border-[#3D8BD0] bg-[#F5FAFF] p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {patchId && <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{patchId}</span>}
                  <span className="inline-block rounded bg-[#3D8BD0] px-1.5 py-0.5 text-[11px] font-semibold text-white">This patch</span>
                </div>
                {patchName && <div className="mt-1 text-[13px] font-medium text-[#364658]">{patchName}</div>}
              </div>
            </div>
          )}

          {rows.map((p, i) => {
            const last = i === rows.length - 1;
            return (
              <div key={`${p.kb}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
                {/* Rail */}
                <div className="flex flex-col items-center pt-1.5">
                  <span className="size-2.5 rounded-full border-2 border-[#CBD5E1] bg-white flex-shrink-0" />
                  {!last && <span className="w-px flex-1 bg-[#E5E7EB] mt-1" />}
                </div>

                {/* Card */}
                <div className="flex-1 rounded-lg border border-[#E5E7EB] bg-white p-3 hover:border-[#3D8BD0] hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] hover:bg-[#d0e8f9] transition-colors">{p.kb}</button>
                    <span className="text-[12px] text-[#7B8FA5]">({p.build})</span>
                  </div>
                  <div className="mt-1 text-[13px] text-[#364658] break-words">{p.title}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#7B8FA5] flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[#364658]">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: severityDot(p.severity) }} />
                      {p.severity}
                    </span>
                    <span className="size-1 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                    <span>Released {p.releaseDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
