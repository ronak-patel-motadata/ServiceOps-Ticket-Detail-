import { Pin as PinIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface SystemFieldsRendererProps {
  fields: string[];
  showMore: boolean;
  onToggleShowMore: () => void;
  pinnedFields: string[];
  onTogglePin: (field: string) => void;
  assetMode?: boolean;
  purchaseMode?: boolean;
}

/** Field rows shown in the Hardware Asset "System Fields" tab. */
const ASSET_SYSTEM_FIELDS: { label: string; value: string; sub?: string; tone?: 'plain' | 'link' }[] = [
  { label: 'Last Barcode / QR Code Scan By', value: '---' },
  { label: 'Last Barcode / QR Code Scan Date', value: '---' },
  { label: 'Created Date', value: 'Mon, May 18, 2026 09:29 AM', sub: '(a month ago)' },
  { label: 'Last Updated Date', value: 'Sun, Jun 21, 2026 01:28 AM', sub: '(a few seconds ago)' },
  { label: 'Created By', value: 'System', tone: 'plain' },
  { label: 'Last Updated By', value: 'Rakesh Rathod', tone: 'link' },
];

/** Field rows shown in the Purchase Order "System Fields" tab. */
const PURCHASE_SYSTEM_FIELDS: { label: string; value: string; sub?: string; tone?: 'plain' | 'link' }[] = [
  { label: 'Last Updated Date', value: 'Tue, Apr 28, 2026 05:44 PM', sub: '(2 months ago)' },
  { label: 'Received Date', value: '---' },
  { label: 'Purchase Close Date', value: '---' },
  { label: 'Created By', value: 'Dharti', tone: 'link' },
  { label: 'Last Updated By', value: 'Dharti', tone: 'link' },
];

export function SystemFieldsRenderer({
  fields,
  showMore,
  onToggleShowMore,
  pinnedFields,
  onTogglePin,
  assetMode = false,
  purchaseMode = false
}: SystemFieldsRendererProps) {
  const PinButton = ({ field }: { field: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={(e) => { e.stopPropagation(); onTogglePin(field); }} className="flex items-center">
          <PinIcon size={14} className={`transition-opacity ${pinnedFields.includes(field) ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{pinnedFields.includes(field) ? 'Unpin this field' : 'Pin this field on top'}</TooltipContent>
    </Tooltip>
  );

  if (purchaseMode) {
    return (
      <div className="space-y-3">
        {PURCHASE_SYSTEM_FIELDS.filter((f) => !pinnedFields.includes(f.label)).map((f) => (
          <div key={f.label} className="flex items-start justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1 pt-2">
              <span>{f.label}</span>
              <PinButton field={f.label} />
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className={`text-[13px] font-medium ${f.tone === 'link' ? 'text-[#3D8BD0] cursor-pointer hover:underline' : 'text-[#364658]'}`}>{f.value}</div>
              {f.sub && <div className="text-[12px] text-[#7B8FA5] mt-0.5">{f.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assetMode) {
    return (
      <div className="space-y-3">
        {ASSET_SYSTEM_FIELDS.filter((f) => !pinnedFields.includes(f.label)).map((f) => (
          <div key={f.label} className="flex items-start justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1 pt-2">
              <span>{f.label}</span>
              <PinButton field={f.label} />
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className={`text-[13px] font-medium ${f.tone === 'link' ? 'text-[#3D8BD0] cursor-pointer hover:underline' : 'text-[#364658]'}`}>{f.value}</div>
              {f.sub && <div className="text-[12px] text-[#7B8FA5] mt-0.5">{f.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayedFields = showMore ? fields : fields.slice(0, 8);

  const getFieldValue = (field: string): string => {
    const fieldValues: { [key: string]: string } = {
      'Current SLA': 'Urgent Priority SLA',
      'Resolution Escalation Level': 'Not Violated',
      'Response Escalation Level': 'Not Violated',
      'First Response Due By': 'February 15, 2026 07:54',
      'First Response Date': '---',
      'Request Type': 'Incident',
      'Request Age': '17 hours 31 minutes 13 seconds',
      'Last Updated Date': 'February 16, 2026 00:34 (an hour ago)',
      'Last Approved Date': '---',
      'Created By': 'Sakshi',
      'Last Updated By': 'Sakshi',
      'Created Date': 'Apr 24, 2025 10:37 AM',
      'Modified By': 'Sarah Johnson',
      'Modified Date': 'Apr 28, 2025 2:15 PM'
    };
    return fieldValues[field] || '---';
  };

  const isUserField = (field: string): boolean => {
    return ['Created By', 'Last Updated By', 'Modified By'].includes(field);
  };

  const getUserInitials = (field: string): string => {
    if (field === 'Created By' || field === 'Last Updated By') return 'S';
    if (field === 'Modified By') return 'SJ';
    return 'U';
  };

  const isHighlightedField = (field: string): boolean => {
    return field === 'Current SLA';
  };

  return (
    <div className="space-y-3">
      {displayedFields.map((field) => (
        <div key={field} className="flex items-center justify-between gap-3">
          <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
            <span>{field}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin(field); }}
                  className="flex items-center"
                >
                  <PinIcon
                    size={14}
                    className={`transition-opacity ${pinnedFields.includes(field) ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {pinnedFields.includes(field) ? 'Unpin this field' : 'Pin this field on top'}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className={`flex-1 py-2 text-[13px] font-medium ${
            isUserField(field) 
              ? 'text-[#3D8BD0] flex items-center gap-2' 
              : isHighlightedField(field)
              ? 'text-[#3D8BD0]'
              : 'text-[#364658]'
          }`}>
            {isUserField(field) && (
              <div className="w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                {getUserInitials(field)}
              </div>
            )}
            <span className={field === 'Last Updated Date' ? 'flex items-center gap-1' : ''}>
              {field === 'Last Updated Date' ? (
                <>
                  February 16, 2026 00:34 <span className="text-[#7B8FA5]">(an hour ago)</span>
                </>
              ) : (
                getFieldValue(field)
              )}
            </span>
          </div>
        </div>
      ))}
      
      {fields.length > 8 && (
        <div className="mt-3 pt-3 border-t border-[#F0F1F3]">
          <button
            onClick={onToggleShowMore}
            className="text-[13px] text-[#3D8BD0] hover:text-[#2A6BA8] font-medium transition-colors"
          >
            {showMore ? 'Show less' : `Show more (${fields.length - 8} more fields)`}
          </button>
        </div>
      )}
    </div>
  );
}
