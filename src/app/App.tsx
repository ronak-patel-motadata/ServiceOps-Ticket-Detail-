import { useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListingPage } from './components/ProblemListingPage';
import { ReleaseListingPage } from './components/ReleaseListingPage';
import { HardwareAssetsListingPage } from './components/HardwareAssetsListingPage';
import { SoftwareAssetsListingPage } from './components/SoftwareAssetsListingPage';
import { NonItAssetsListingPage } from './components/NonItAssetsListingPage';
import { ConsumableAssetsListingPage } from './components/ConsumableAssetsListingPage';
import { SoftwareLicensesListingPage } from './components/SoftwareLicensesListingPage';
import { ContractsListingPage } from './components/ContractsListingPage';
import { PurchasesListingPage } from './components/PurchasesListingPage';
import { ProjectsListPage } from './components/ProjectsListPage';
import { CmdbListPage } from './components/CmdbListPage';
import { PatchesListPage } from './components/PatchesListPage';
import { PatchDeploymentsListPage } from './components/PatchDeploymentsListPage';
import { PackageDeploymentsListPage } from './components/PackageDeploymentsListPage';
import { RegistryDeploymentsListPage } from './components/RegistryDeploymentsListPage';
import { KnowledgeListPage } from './components/KnowledgeListPage';
import { TasksListPage } from './components/TasksListPage';
import { ReportsListPage } from './components/ReportsListPage';
import { IconGalleryPage } from './components/IconGalleryPage';
import { ViewsLabListPage } from './components/ViewsLabListPage';
import { ChangeListingPage } from './components/ChangeListingPage';
import { EndpointsListPage } from './components/EndpointsListPage';
import { VulnerabilitiesListPage } from './components/VulnerabilitiesListPage';
import { DetectedCvesListPage } from './components/DetectedCvesListPage';
import { DrawerStackProvider } from './components/DrawerStack';
import { Toaster } from 'sonner';

type Page = 'request' | 'problem' | 'change' | 'release' | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets' | 'software-licenses' | 'contracts' | 'purchases' | 'cmdb' | 'patches' | 'patch-deployments' | 'endpoints' | 'vulnerabilities' | 'detected-cves' | 'package-deployments' | 'registry-deployments' | 'knowledge' | 'tasks' | 'reports' | 'projects' | 'icons' | 'views-lab';

/* A row's "Open in a new tab" link carries ?page=<slug>&open=<id>, so a fresh tab
   lands on the right module's listing with that record's detail page already open. */
const pageFromUrl = (): Page | null => {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search).get('page');
  return p ? (p as Page) : null;
};

export default function App() {
  const [activePage, setActivePage] = useState<Page>(() => pageFromUrl() ?? 'request');
  const navigate = (page: string) => setActivePage(page as Page);
  // A software asset id requested from elsewhere (e.g. the Software License "Managed Softwares" card),
  // consumed by the Software Assets list page to auto-open that asset's detail drawer.
  const [pendingSoftwareAssetId, setPendingSoftwareAssetId] = useState<string | null>(null);
  const openSoftwareAsset = (id: string) => { setPendingSoftwareAssetId(id); setActivePage('software-assets'); };

  return (
    <DrawerStackProvider activePage={activePage}>
      {activePage === 'request' && <TicketListPage onNavigate={navigate} />}
      {activePage === 'views-lab' && <ViewsLabListPage onNavigate={navigate} />}
      {activePage === 'problem' && <ProblemListingPage onNavigate={navigate} />}
      {activePage === 'change' && <ChangeListingPage onNavigate={navigate} />}
      {activePage === 'release' && <ReleaseListingPage onNavigate={navigate} />}
      {activePage === 'hardware-assets' && <HardwareAssetsListingPage onNavigate={navigate} />}
      {activePage === 'software-assets' && <SoftwareAssetsListingPage onNavigate={navigate} initialOpenId={pendingSoftwareAssetId} onInitialOpenConsumed={() => setPendingSoftwareAssetId(null)} />}
      {activePage === 'non-it-assets' && <NonItAssetsListingPage onNavigate={navigate} />}
      {activePage === 'consumable-assets' && <ConsumableAssetsListingPage onNavigate={navigate} />}
      {activePage === 'software-licenses' && <SoftwareLicensesListingPage onNavigate={navigate} />}
      {activePage === 'contracts' && <ContractsListingPage onNavigate={navigate} />}
      {activePage === 'purchases' && <PurchasesListingPage onNavigate={navigate} />}
      {activePage === 'projects' && <ProjectsListPage onNavigate={navigate} />}
      {activePage === 'cmdb' && <CmdbListPage onNavigate={navigate} />}
      {activePage === 'patches' && <PatchesListPage onNavigate={navigate} />}
      {activePage === 'patch-deployments' && <PatchDeploymentsListPage onNavigate={navigate} />}
      {activePage === 'package-deployments' && <PackageDeploymentsListPage onNavigate={navigate} />}
      {activePage === 'registry-deployments' && <RegistryDeploymentsListPage onNavigate={navigate} />}
      {activePage === 'knowledge' && <KnowledgeListPage onNavigate={navigate} />}
      {activePage === 'tasks' && <TasksListPage onNavigate={navigate} />}
      {activePage === 'reports' && <ReportsListPage onNavigate={navigate} />}
      {activePage === 'icons' && <IconGalleryPage onNavigate={navigate} />}
      {activePage === 'endpoints' && <EndpointsListPage onNavigate={navigate} />}
      {activePage === 'vulnerabilities' && <VulnerabilitiesListPage onNavigate={navigate} />}
      {activePage === 'detected-cves' && <DetectedCvesListPage onNavigate={navigate} />}
      <Toaster position="top-right" />
    </DrawerStackProvider>
  );
}
