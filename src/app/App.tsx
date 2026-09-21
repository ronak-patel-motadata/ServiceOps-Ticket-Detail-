import { useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListingPage } from './components/ProblemListingPage';
import { ReleaseListingPage } from './components/ReleaseListingPage';
import { HardwareAssetsListingPage } from './components/HardwareAssetsListingPage';
import { SoftwareAssetsListPage } from './components/SoftwareAssetsListPage';
import { NonItAssetsListPage } from './components/NonItAssetsListPage';
import { ConsumableAssetsListPage } from './components/ConsumableAssetsListPage';
import { SoftwareLicensesListPage } from './components/SoftwareLicensesListPage';
import { ContractsListPage } from './components/ContractsListPage';
import { PurchasesListPage } from './components/PurchasesListPage';
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

type Page = 'request' | 'problem' | 'change' | 'release' | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets' | 'software-licenses' | 'contracts' | 'purchases' | 'cmdb' | 'patches' | 'patch-deployments' | 'endpoints' | 'vulnerabilities' | 'detected-cves' | 'package-deployments' | 'registry-deployments' | 'knowledge' | 'tasks' | 'reports' | 'icons' | 'views-lab';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('request');
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
      {activePage === 'software-assets' && <SoftwareAssetsListPage onNavigate={navigate} initialOpenId={pendingSoftwareAssetId} onInitialOpenConsumed={() => setPendingSoftwareAssetId(null)} />}
      {activePage === 'non-it-assets' && <NonItAssetsListPage onNavigate={navigate} />}
      {activePage === 'consumable-assets' && <ConsumableAssetsListPage onNavigate={navigate} />}
      {activePage === 'software-licenses' && <SoftwareLicensesListPage onNavigate={navigate} onOpenSoftwareAsset={openSoftwareAsset} />}
      {activePage === 'contracts' && <ContractsListPage onNavigate={navigate} />}
      {activePage === 'purchases' && <PurchasesListPage onNavigate={navigate} />}
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
