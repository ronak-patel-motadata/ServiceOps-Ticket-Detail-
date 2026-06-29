import { Sparkles } from 'lucide-react';

interface AssetAiSummaryProps {
  summary: string;
  points?: string[];
}

// Compact AI summary shown at the top of an asset's Overview tab — just the AI
// (Sparkles) icon, a one/two line summary and a few asset-related points. No
// "AI Summary" heading, unlike the larger conversation summary on tickets.
export function AssetAiSummary({ summary, points = [] }: AssetAiSummaryProps) {
  return (
    <div
      className="rounded-xl border border-[#E7E1F7] p-4"
      style={{ background: 'linear-gradient(118deg, #FCFBFF 0%, #F6F3FE 55%, #FCF3FA 100%)' }}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles size={18} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[13px] text-[#364658] leading-relaxed">{summary}</p>
          {points.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#364658] leading-relaxed">
                  <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
