import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, UserCheck, RefreshCw, ScanLine, Lock, RotateCcw, Power, Moon,
  Sunrise, Ban, Monitor, History, Repeat, Archive, Printer, Barcode, XCircle, PackageCheck,
} from 'lucide-react';

interface HardwareAssetActionsMenuProps {
  onOpenApprovalPopup?: () => void;
  onOpenAddBarcode?: () => void;
  // Reduced menu (software assets): only Add Barcode, Archive, Print
  minimal?: boolean;
  // Non-IT asset menu: Ask for Approval, Add Barcode, Used By/Location History, Archive, Print
  nonIt?: boolean;
  // Contract menu: only Cancel Contract, Archive, Print
  contract?: boolean;
  // Purchase menu: only Receive Items, Print
  purchase?: boolean;
}

export function HardwareAssetActionsMenu({ onOpenApprovalPopup, onOpenAddBarcode, minimal = false, nonIt = false, contract = false, purchase = false }: HardwareAssetActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  const close = () => setOpen(false);

  const Item = ({ onClick, icon, label }: { onClick?: () => void; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => { onClick?.(); close(); }}
      className="w-full px-4 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors flex items-center gap-2.5"
    >
      <span className="text-[#6B7280] flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
    </button>
  );

  const Divider = () => <div className="my-1 border-t border-[#F0F2F5]" />;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-[#f9fafb] rounded">
        <MoreVertical size={16} className="text-[#6b7280]" />
      </button>

      {open && minimal && (
        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && nonIt && (
        <div className="absolute right-0 top-full mt-1 w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Used By History" icon={<History size={15} />} />
          <Item label="Location History" icon={<History size={15} />} />
          <Divider />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && contract && (
        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Cancel Contract" icon={<XCircle size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && purchase && (
        <div className="absolute right-0 top-full mt-1 w-[190px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Receive Items" icon={<PackageCheck size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && !minimal && !nonIt && !contract && !purchase && (
        <div className="absolute right-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999] max-h-[70vh] overflow-y-auto">
          {/* Group 1 */}
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Sync Warranty" icon={<RefreshCw size={15} />} />
          <Item label="Scan Now" icon={<ScanLine size={15} />} />

          <Divider />

          {/* Group 2 — power actions */}
          <Item label="Lock" icon={<Lock size={15} />} />
          <Item label="Restart" icon={<RotateCcw size={15} />} />
          <Item label="ShutDown" icon={<Power size={15} />} />
          <Item label="Sleep" icon={<Moon size={15} />} />
          <Item label="Wake Up Now" icon={<Sunrise size={15} />} />

          <Divider />

          {/* Group 3 */}
          <Item label="Exclude From Scan" icon={<Ban size={15} />} />
          <Item label="Remote Desktop" icon={<Monitor size={15} />} />

          <Divider />

          {/* Group 4 — history & reconcile */}
          <Item label="RDP History" icon={<History size={15} />} />
          <Item label="Reconcile" icon={<Repeat size={15} />} />
          <Item label="Used By History" icon={<History size={15} />} />
          <Item label="Location History" icon={<History size={15} />} />
          <Item label="Action History" icon={<History size={15} />} />

          <Divider />

          {/* Group 5 */}
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}
    </div>
  );
}
