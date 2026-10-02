import { useState } from 'react';
import { TicketListPage } from './components/TicketListPage';
import { ProblemListingPage } from './components/ProblemListingPage';
import { ReleaseListingPage } from './components/ReleaseListingPage';
import { HardwareAssetsListingPage } from './components/HardwareAssetsListingPage';
import { SoftwareAssetsListingPage } from './components/SoftwareAssetsListingPage';
import { NonItAssetsListingPage } from './components/NonItAssetsListingPage';
import { ConsumableAssetsListingPage } from './components/ConsumableAssetsListingPage';
import { SoftwareLicensesListingPage } from './components/SoftwareLicensesListingPage';
import { SoftwareMeterListingPage } from './components/SoftwareMeterListingPage';
import { ContractsListingPage } from './components/ContractsListingPage';
import { PurchasesListingPage } from './components/PurchasesListingPage';
import { ProjectsListingPage } from './components/ProjectsListingPage';
import { MyApprovalsListPage } from './components/MyApprovalsListPage';
import { CmdbListingPage } from './components/CmdbListingPage';
import { PatchesListingPage } from './components/PatchesListingPage';
import { PatchDeploymentsListingPage } from './components/PatchDeploymentsListingPage';
import { AutomaticPatchTestsListingPage } from './components/AutomaticPatchTestsListingPage';
import { PackageDeploymentsListingPage } from './components/PackageDeploymentsListingPage';
import { RegistryDeploymentsListingPage } from './components/RegistryDeploymentsListingPage';
import { KnowledgeListingPage } from './components/KnowledgeListingPage';
import { TasksListingPage } from './components/TasksListingPage';
import { ReportsListingPage } from './components/ReportsListingPage';
import { MyTeamListingPage } from './components/MyTeamListingPage';
import { IconGalleryPage } from './components/IconGalleryPage';
import { ViewsLabListPage } from './components/ViewsLabListPage';
import { ChangeListingPage } from './components/ChangeListingPage';
import { EndpointsListingPage } from './components/EndpointsListingPage';
import { VulnerabilitiesListingPage } from './components/VulnerabilitiesListingPage';
import { DetectedCvesListingPage } from './components/DetectedCvesListingPage';
import { DrawerStackProvider } from './components/DrawerStack';
import { Toaster } from 'sonner';

type Page = 'request' | 'problem' | 'change' | 'release' | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets' | 'software-licenses' | 'software-meter' | 'contracts' | 'purchases' | 'cmdb' | 'patches' | 'patch-deployments' | 'automatic-patch-tests' | 'endpoints' | 'vulnerabilities' | 'detected-cves' | 'package-deployments' | 'registry-deployments' | 'knowledge' | 'tasks' | 'reports' | 'projects' | 'my-approvals' | 'my-team' | 'icons' | 'views-lab';

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
      {activePage === 'software-meter' && <SoftwareMeterListingPage onNavigate={navigate} />}
      {activePage === 'contracts' && <ContractsListingPage onNavigate={navigate} />}
      {activePage === 'purchases' && <PurchasesListingPage onNavigate={navigate} />}
      {activePage === 'projects' && <ProjectsListingPage onNavigate={navigate} />}
      {activePage === 'my-approvals' && <MyApprovalsListPage onNavigate={navigate} />}
      {activePage === 'cmdb' && <CmdbListingPage onNavigate={navigate} />}
      {activePage === 'patches' && <PatchesListingPage onNavigate={navigate} />}
      {activePage === 'patch-deployments' && <PatchDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'automatic-patch-tests' && <AutomaticPatchTestsListingPage onNavigate={navigate} />}
      {activePage === 'package-deployments' && <PackageDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'registry-deployments' && <RegistryDeploymentsListingPage onNavigate={navigate} />}
      {activePage === 'knowledge' && <KnowledgeListingPage onNavigate={navigate} />}
      {activePage === 'tasks' && <TasksListingPage onNavigate={navigate} />}
      {activePage === 'reports' && <ReportsListingPage onNavigate={navigate} />}
      {activePage === 'my-team' && <MyTeamListingPage onNavigate={navigate} />}
      {activePage === 'icons' && <IconGalleryPage onNavigate={navigate} />}
      {activePage === 'endpoints' && <EndpointsListingPage onNavigate={navigate} />}
      {activePage === 'vulnerabilities' && <VulnerabilitiesListingPage onNavigate={navigate} />}
      {activePage === 'detected-cves' && <DetectedCvesListingPage onNavigate={navigate} />}
      <Toaster position="top-right" />
    </DrawerStackProvider>
  );
}
