/* ── Knowledge listing ───────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockKnowledgeArticles:
   moduleCols="knowledge" columns (Name · Author · Status · Approval Status ·
   Feedback), with the module's FOLDER rail down the left where the CMDB puts its CI
   classes. Picking a folder narrows the grid; Trash is a folder like any other.

   Landing on the module shows KnowledgeHome — the top articles — rather than every
   row at once; the grid takes over as soon as a folder, a search or a filter asks
   for one.

   Clicks open the real KnowledgeDrawer via the DrawerStack, as before. */
import { useMemo, useState } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { KnowledgeFolderRail } from './KnowledgeFolderRail';
import { KnowledgeHome } from './KnowledgeHome';
import { KNOWLEDGE_QUICK_FILTERS } from './TicketFilterBar';
import { KNOWLEDGE_FILTER_ATTRS } from './knowledgeFilterAttrs';
import {
  KNOWLEDGE_FOLDERS,
  TRASHED_IDS,
  knowledgeToPatchShape,
  mockKnowledgeArticles,
  type KnowledgeArticle,
} from './KnowledgeListPage';
import type { Ticket } from './TicketListPage';

const initialsOf = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const folderLabel = (id: string) => KNOWLEDGE_FOLDERS.find((f) => f.id === id)?.label ?? id;

const KB: { rows: Ticket[]; byId: Map<string, KnowledgeArticle> } = (() => {
  const byId = new Map<string, KnowledgeArticle>();
  const rows = mockKnowledgeArticles.map((a) => {
    byId.set(a.id, a);
    /* "Sun, Jul 19, 2026 10:58 PM" — drop the weekday so Date can read it. */
    const created = new Date(a.created.replace(/^[A-Za-z]{3},\s*/, ''));
    return {
      id: a.id,
      subject: a.name,
      requester: a.author,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: a.author, initials: initialsOf(a.author) },
      status: a.status as Ticket['status'],
      priority: 'Medium',
      x_approvalStatus: a.approvalStatus,
      x_folder: folderLabel(a.folder),
      x_likes: a.likes,
      x_dislikes: a.dislikes,
      x_totalRead: a.totalRead,
      /* The folder id the rail filters on, and whether the article is in the bin. */
      folderId: a.folder,
      trashed: TRASHED_IDS.has(a.id),
    } as Ticket;
  });
  return { rows, byId };
})();

export function KnowledgeListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* The selected folder — 'all', a folder id, or 'trash'. */
  const [folder, setFolder] = useState('all');

  /* Counts come from the whole base, not the current slice, so the rail's numbers do not
     move when you click it. Trashed articles are only ever counted in Trash. */
  const counts = useMemo(() => {
    const live = KB.rows.filter((r) => !(r as any).trashed);
    return {
      total: live.length,
      trash: KB.rows.length - live.length,
      folders: KNOWLEDGE_FOLDERS.map((f) => ({
        id: f.id,
        label: f.label,
        count: live.filter((r) => (r as any).folderId === f.id).length,
      })),
    };
  }, []);

  const rows = useMemo(() => {
    if (folder === 'trash') return KB.rows.filter((r) => (r as any).trashed);
    const live = KB.rows.filter((r) => !(r as any).trashed);
    return folder === 'all' ? live : live.filter((r) => (r as any).folderId === folder);
  }, [folder]);

  const title =
    folder === 'all' ? 'All Folders' : folder === 'trash' ? 'Trash' : folderLabel(folder);

  return (
    <AssetRegisterPage
      activePage="knowledge"
      stackModule="knowledge"
      viewsStore="knowledge"
      noun="article"
      moduleCols="knowledge"
      defaultViewName={title}
      resetKey={folder}
      footerNoun="articles"
      rows={rows}
      /* The drawer takes the article adapted onto the Patch shape, as the old page did. */
      recordOf={(id) => { const a = KB.byId.get(id); return a ? knowledgeToPatchShape(a) : undefined; }}
      /* List only — no Dashboard layout here, so the gear menu shows no layout picker. */
      filterAttrs={KNOWLEDGE_FILTER_ATTRS}
      /* Author is who WROTE the article, and Status moves by drafting, reviewing and
         publishing it — neither is a field you set from a list in the grid. */
      lockedCells={['assignee', 'status']}
      quickFilters={KNOWLEDGE_QUICK_FILTERS}
      searchFields={['x_approvalStatus', 'x_folder']}
      primaryAction={{ label: 'Create' }}
      /* An article is read and written, not exported or polled — and nothing is left for a
         ⋮ menu to hold, so it goes with them. The gear stays: grouping and columns are
         still worth having. */
      hideTools={['export', 'refresh']}
      moreActions={[]}
      /* Landing on Knowledge shows the digest, not 20 undifferentiated rows. Picking a
         folder, searching or filtering swaps it for the grid. */
      overview={folder === 'all' ? <KnowledgeHome rows={rows} /> : undefined}
      rail={({ collapsed, expand }) => (
        <KnowledgeFolderRail
          folders={counts.folders}
          total={counts.total}
          trash={counts.trash}
          active={folder}
          onSelect={setFolder}
          forceCollapsed={collapsed}
          onExpand={expand}
        />
      )}
      railLabel="folders"
      onNavigate={onNavigate}
    />
  );
}
