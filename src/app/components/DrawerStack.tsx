import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TicketDrawer } from './TicketDrawer';
import { ProblemDrawer } from './ProblemDrawer';
import { ChangeDrawer } from './ChangeDrawer';
import { ReleaseDrawer } from './ReleaseDrawer';
import { HardwareAssetDrawer } from './HardwareAssetDrawer';
import { SoftwareAssetDrawer } from './SoftwareAssetDrawer';
import { NonItAssetDrawer } from './NonItAssetDrawer';
import { ConsumableAssetDrawer } from './ConsumableAssetDrawer';
import { SoftwareLicenseDrawer } from './SoftwareLicenseDrawer';
import { ContractDrawer } from './ContractDrawer';
import { PurchaseDrawer } from './PurchaseDrawer';
import { CmdbDrawer } from './CmdbDrawer';
import { MOCK_TICKETS } from './TicketListPage';
import { mockProblems } from './ProblemListPage';
import { mockChanges } from './ChangeListPage';
import { mockReleases } from './ReleaseListPage';
import { mockAssets as mockHardware } from './HardwareAssetsListPage';
import { mockContracts } from './ContractsListPage';
import { mockPurchases } from './PurchasesListPage';
import { mockCis } from './CmdbListPage';

export type StackModule =
  | 'request' | 'problem' | 'change' | 'release'
  | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets'
  | 'software-licenses' | 'contracts' | 'purchases' | 'cmdb';

export interface StackItem { key: string; module: StackModule; id: string; subject: string; data: any }
export interface Relation { ticketId: string; subject: string; type: string; status: string; priority: string; assignedTo: { name: string } }

// Relation type -> which module drawer to open it in + which mock pool to source realistic data from.
// Pools are lazy getters to avoid circular-import initialization issues (list pages import this module too).
const REL_MAP: Record<string, { module: StackModule; pool: () => any[]; disp: string }> = {
  Request: { module: 'request', pool: () => MOCK_TICKETS, disp: 'subject' },
  Problem: { module: 'problem', pool: () => mockProblems, disp: 'subject' },
  Change: { module: 'change', pool: () => mockChanges, disp: 'subject' },
  Release: { module: 'release', pool: () => mockReleases, disp: 'subject' },
  Asset: { module: 'hardware-assets', pool: () => mockHardware, disp: 'name' },
  CI: { module: 'cmdb', pool: () => mockCis, disp: 'name' },
  Contract: { module: 'contracts', pool: () => mockContracts, disp: 'name' },
  Purchase: { module: 'purchases', pool: () => mockPurchases, disp: 'name' },
};

interface DrawerStackApi {
  open: (module: StackModule, id: string, subject: string, data: any) => void;
  openRelation: (rel: Relation) => void;
}
const Ctx = createContext<DrawerStackApi>({ open: () => {}, openRelation: () => {} });
export const useDrawerStack = () => useContext(Ctx);

export function DrawerStackProvider({ children, activePage }: { children: ReactNode; activePage?: string }) {
  const [stack, setStack] = useState<StackItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Shared full/small view width, persisted across tab switches & closes so the
  // view mode survives when the host swaps in a different module's drawer instance.
  const [stackWidth, setStackWidth] = useState<number | undefined>(undefined);
  // Shared minimized state so navigating to another module's list page collapses
  // the open drawer to its rail (revealing the list), and opening an item restores it.
  const [minimized, setMinimized] = useState(false);

  // When the user navigates to a different module's list page, minimize any open
  // drawer so the list underneath is visible (the rail stays for quick restore).
  useEffect(() => {
    setMinimized((m) => (stack.length ? true : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  const open: DrawerStackApi['open'] = (module, id, subject, data) => {
    const key = `${module}:${id}`;
    setStack((prev) => (prev.some((s) => s.key === key) ? prev : [...prev, { key, module, id, subject, data }]));
    setActiveKey(key);
    setMinimized(false); // opening/selecting an item always restores the drawer
  };
  const openRelation: DrawerStackApi['openRelation'] = (rel) => {
    const m = REL_MAP[rel.type];
    if (!m) return;
    const pool = m.pool();
    if (!pool.length) return;
    const idx = Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    open(m.module, rel.ticketId, rel.subject, { ...pool[idx], id: rel.ticketId, [m.disp]: rel.subject });
  };
  const closeByStackId = (id: string) => {
    setStack((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActiveKey((ak) => {
        const closed = prev.find((s) => s.id === id);
        return closed && ak === closed.key ? (next.length ? next[next.length - 1].key : null) : ak;
      });
      return next;
    });
  };
  const selectByStackId = (id: string) => {
    setStack((prev) => { const it = prev.find((s) => s.id === id); if (it) setActiveKey(it.key); return prev; });
  };
  const closeAll = () => { setStack([]); setActiveKey(null); };

  const active = stack.find((s) => s.key === activeKey) || null;
  // Enrich each tab with status/priority/technician (field names vary by module) for the tab hover card.
  const tabMeta = (data: any) => {
    if (!data) return {};
    const status = typeof data.status === 'string' ? data.status : undefined;
    const priority = typeof data.priority === 'string' ? data.priority : undefined;
    const tech = data.assignedTo?.name ?? data.assignee ?? data.managedBy ?? data.owner ?? data.technician ?? (typeof data.usedBy === 'string' ? data.usedBy : data.usedBy?.name);
    const technician = typeof tech === 'string' && tech.trim() ? tech : undefined;
    return { status, priority, technician };
  };
  const stackTabs = stack.map((s) => ({ id: s.id, subject: s.subject, ...tabMeta(s.data) }));

  let drawer: ReactNode = null;
  if (active) {
    const shared = {
      stackTabs,
      onCloseTab: closeByStackId,
      onTabChange: selectByStackId,
      onClose: closeAll,
      onOpenRelation: openRelation,
      stackWidth,
      onStackWidthChange: setStackWidth,
      stackMinimized: minimized,
      onStackMinimizedChange: setMinimized,
    } as any;
    switch (active.module) {
      case 'request': drawer = <TicketDrawer openTickets={[active.data]} activeTicketId={active.id} {...shared} />; break;
      case 'problem': drawer = <ProblemDrawer openProblems={[active.data]} activeProblemId={active.id} {...shared} />; break;
      case 'change': drawer = <ChangeDrawer openChanges={[active.data]} activeChangeId={active.id} {...shared} />; break;
      case 'release': drawer = <ReleaseDrawer openReleases={[active.data]} activeReleaseId={active.id} {...shared} />; break;
      case 'hardware-assets': drawer = <HardwareAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'software-assets': drawer = <SoftwareAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'non-it-assets': drawer = <NonItAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'consumable-assets': drawer = <ConsumableAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'software-licenses': drawer = <SoftwareLicenseDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'contracts': drawer = <ContractDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'purchases': drawer = <PurchaseDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'cmdb': drawer = <CmdbDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
    }
  }

  return (
    <Ctx.Provider value={{ open, openRelation }}>
      {children}
      {drawer}
    </Ctx.Provider>
  );
}
