import { useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListPage } from './components/ProblemListPage';
import { ChangeListPage } from './components/ChangeListPage';
import { ReleaseListPage } from './components/ReleaseListPage';
import { Toaster } from 'sonner';

type Page = 'request' | 'problem' | 'change' | 'release';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('request');

  return (
    <>
      {activePage === 'request' && <TicketListPage onNavigate={setActivePage} />}
      {activePage === 'problem' && <ProblemListPage onNavigate={setActivePage} />}
      {activePage === 'change' && <ChangeListPage onNavigate={setActivePage} />}
      {activePage === 'release' && <ReleaseListPage onNavigate={setActivePage} />}
      <Toaster position="top-right" />
    </>
  );
}
