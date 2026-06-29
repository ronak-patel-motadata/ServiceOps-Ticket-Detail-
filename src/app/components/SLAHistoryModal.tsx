import { X } from 'lucide-react';

interface SLAHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  penaltyAmount?: number;
}

export function SLAHistoryModal({ isOpen, onClose, penaltyAmount = 0 }: SLAHistoryModalProps) {
  if (!isOpen) return null;

  const slaHistoryData = [
    {
      name: 'Urgent Priority SLA',
      type: 'SLA',
      target: 'First Response',
      status: 'Breached',
      updatedBy: 'Darsh',
      elapsedTime: '1 day 21 hours 15 minutes',
      dueIn: '---',
      slaPercentage: 100,
      overdue: 'Yes',
      startTime: 'February 11, 2026 07:30',
      lastPauseTime: '---',
      stopTime: '---',
      pauseDuration: '---'
    },
    {
      name: 'Urgent Priority SLA',
      type: 'SLA',
      target: 'Resolution',
      status: 'Running',
      updatedBy: 'Darsh',
      elapsedTime: '1 day 21 hours 15 minutes',
      dueIn: '2 hours 45 minutes left',
      slaPercentage: 75,
      overdue: 'No',
      startTime: 'February 11, 2026 07:30',
      lastPauseTime: '---',
      stopTime: '---',
      pauseDuration: '---'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[10000] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Side Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[50vw] bg-white shadow-2xl z-[10001] flex flex-col transition-transform duration-300"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111827]">SLA History</h2>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Total Penalty Amount: <span className="font-semibold text-[#111827]">${penaltyAmount.toFixed(2)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Name</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Type</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Target</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Status</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Updated By</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Elapsed Time</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Due In</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">SLA Percentage</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Overdue</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Start Time</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Last Pause Time</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Stop Time</th>
                <th className="pb-3 pr-4 text-[13px] font-semibold text-[#6B7280] whitespace-nowrap">Pause Duration</th>
              </tr>
            </thead>
            <tbody>
              {slaHistoryData.map((item, index) => (
                <tr key={index} className="border-b border-[#F3F4F6]">
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.name}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.type}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.target}</td>
                  <td className="py-4 pr-4 text-[13px] whitespace-nowrap">
                    <span className={`${
                      item.status === 'Breached' ? 'text-[#DC2626]' : 'text-[#F59E0B]'
                    } font-medium`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-[#3D8BD0] whitespace-nowrap">{item.updatedBy}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.elapsedTime}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.dueIn}</td>
                  <td className="py-4 pr-4 text-[13px] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.slaPercentage === 100 ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'
                          }`}
                          style={{ width: `${item.slaPercentage}%` }}
                        />
                      </div>
                      <span className="text-[#111827]">{item.slaPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.overdue}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.startTime}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.lastPauseTime}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.stopTime}</td>
                  <td className="py-4 pr-4 text-[13px] text-[#111827] whitespace-nowrap">{item.pauseDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
