import { useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListPage } from './components/ProblemListPage';
import { ChangeListPage } from './components/ChangeListPage';
import { ReleaseListPage } from './components/ReleaseListPage';
import { HardwareAssetsListPage } from './components/HardwareAssetsListPage';
import { SoftwareAssetsListPage } from './components/SoftwareAssetsListPage';
import { NonItAssetsListPage } from './components/NonItAssetsListPage';
import { ConsumableAssetsListPage } from './components/ConsumableAssetsListPage';
import { Toaster } from 'sonner';

type Page = 'request' | 'problem' | 'change' | 'release' | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('request');
  const navigate = (page: string) => setActivePage(page as Page);

  return (
    <>
      {activePage === 'request' && <TicketListPage onNavigate={navigate} />}
      {activePage === 'problem' && <ProblemListPage onNavigate={navigate} />}
      {activePage === 'change' && <ChangeListPage onNavigate={navigate} />}
      {activePage === 'release' && <ReleaseListPage onNavigate={navigate} />}
      {activePage === 'hardware-assets' && <HardwareAssetsListPage onNavigate={navigate} />}
      {activePage === 'software-assets' && <SoftwareAssetsListPage onNavigate={navigate} />}
      {activePage === 'non-it-assets' && <NonItAssetsListPage onNavigate={navigate} />}
      {activePage === 'consumable-assets' && <ConsumableAssetsListPage onNavigate={navigate} />}
      <Toaster position="top-right" />
    </>
  );
}
