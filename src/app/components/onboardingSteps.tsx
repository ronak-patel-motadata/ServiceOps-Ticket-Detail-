/* ── In-App User Guide — one tour per detail page ─────────────────────────────
   The request page's guide (`TICKET_ONBOARDING_STEPS` in TicketDetailsOnboarding) is the
   model: the same card and the same FOUR beats, in the same order, on every page —
     1  the left workspace   — header strip, content and tabs in ONE step (what the page shows)
     2  the right rail        — the groups this page's rail actually holds, as bullets
     3  the Properties panel  — the accordions it holds, plus the tools it offers (search,
                                filter, pin, customize, tags…) as bullets — only tools the
                                page really renders
     4  the AI box            — what to ask on this page
   written for what THIS page actually shows. The one exception is the CMDB Dependency Map
   view, which has no rail, no Properties panel and no AI box — it keeps a three-step map tour,
   and the CI Details view gets the four beats. The Report page has no tour at all.

   Each step spotlights a `data-onboarding` hook:
     main-workspace    the whole left column (header strip, tabs, content)   — every drawer
     ci-view-toggle · map-toolbar · dependency-map                            — CMDB map view
     right-sidebar · ticket-properties · ai-prompt-box                        — the shared right panel
   (`work-tabs` · `overview-kpis` · `deployment-group` · `planning` · `checklist` stay on the
   pages as hooks, no longer spotlighted — their content is folded into step 1.)

   A hook that is missing or hidden when a step runs falls back to a centred card, so a tour is
   never stranded — but every step here is written against a hook its page renders. */
import {
  Activity, BarChart3, Bell, CalendarClock, CircleCheck, FileText, Files, Filter, Info, Keyboard, Layers,
  Lightbulb, Link, MessageSquare, Paperclip, Pin, RotateCcw, Search, Settings, ShieldAlert, SquarePen,
  StickyNote, Tag, Users, type LucideIcon,
} from 'lucide-react';
import type { OnboardingBullet, OnboardingStep } from './TicketDetailsOnboarding';

const ic = (I: LucideIcon) => <I size={16} className="text-white/80 mt-0.5 flex-shrink-0" />;
const b = (I: LucideIcon, label: string, text: string): OnboardingBullet => ({ icon: ic(I), label, text });

type Pos = OnboardingStep['position'];
const step = (id: number, title: string, description: string, hook: string, position: Pos, bullets?: OnboardingBullet[], pad?: number): OnboardingStep => ({
  id, title, description, targetSelector: `[data-onboarding="${hook}"]`, position, highlightPadding: pad ?? (hook === 'right-sidebar' ? 12 : 16), ...(bullets ? { bullets } : {}),
});

/* The four beats, so every page reads in the request page's order. */
const WORKSPACE = (title: string, text: string) => step(1, title, text, 'main-workspace', 'right');
const RAIL = (noun: string, groups: string, bullets: OnboardingBullet[]) =>
  step(2, 'Quick access sidebar', `Use this sidebar to switch between supporting views like ${groups} without leaving the ${noun}.`, 'right-sidebar', 'left', bullets);
const PROPS = (title: string, text: string, bullets: OnboardingBullet[]) => step(3, title, text, 'ticket-properties', 'left', bullets);
const AI = (text: string): OnboardingStep => step(4, 'AI help, built in', text, 'ai-prompt-box', 'top');

/* ── Rail groups, as the rail shows them ──────────────────────────────────── */
const RAIL_PROPS = (what: string) => b(FileText, 'Properties', what);
const RAIL_ACTIVITY = b(Activity, 'Activity & Resources', 'Manage work updates and view attachments.');
const RAIL_SUGGEST = (noun: string) => b(Lightbulb, 'AI Suggestions', `Discover similar ${noun} and relevant KBs.`);
const RAIL_NOTIFY = (noun: string) => b(Bell, 'Notifications', `Emails sent from this ${noun}.`);
const RAIL_ASSET_PROPS = (what: string) => b(FileText, 'Asset Properties', what);
const RAIL_USERS = b(Users, 'Users', 'The local accounts on the device.');
const RAIL_NOTES = b(StickyNote, 'Notes', 'What the team has written about it.');
const RAIL_ATTACH = b(Paperclip, 'Attachments', 'Files kept with the record.');
/* On a thin rail (one or two groups) the bottom pair is worth a bullet — it is where you came from. */
const RAIL_SHORTCUTS = b(Keyboard, 'Shortcuts & guide', 'The keyboard cheat sheet and this tour sit at the bottom of the rail.');

/* ── Properties-panel tools, only where the page renders them ─────────────── */
const SEARCH = (noun: string) => b(Search, 'Search', `Find any field quickly across all ${noun} details`);
const FILTER_PIN = b(Filter, 'Filter', 'Show only the fields you need, such as empty fields or pinned ones');
const FILTER = b(Filter, 'Filter', 'Show only the fields you need, such as the empty ones');
const PIN = b(Pin, 'Pin', 'Mark the fields you want easy access to, your view works the way you do.');
const CUSTOMIZE = b(Settings, 'Customize', 'Reorder the sections from Customize Layout, so the panel reads the way you work.');
const TAGS = (what: string) => b(Tag, 'Tags', what);

/* ── Problem ───────────────────────────────────────────────────────────────── */
export const PROBLEM_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the problem. Status, priority, assignee and SLA sit under the title, followed by the description, the affected requests, assets and CIs as clickable pills, and an AI summary. Analysis documents the root cause, symptoms, impact and workaround; Conversation, Tasks and Relations hold the discussion, the work and the linked records; Audit Trails and Resolution close it out.'),
  RAIL('problem', 'Properties, Activity & Resources, AI Suggestions and Notifications',
    [RAIL_PROPS('SLA status, key fields and problem information.'), RAIL_ACTIVITY, RAIL_SUGGEST('problems'), RAIL_NOTIFY('problem')]),
  PROPS('Problem details, your way',
    'View SLA status, key information, problem information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('problem'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the problem, suggest a likely root cause, draft a workaround or find similar records — straight from this box.'),
];

/* ── Change ────────────────────────────────────────────────────────────────── */
export const CHANGE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the change. Status, priority, type and the scheduled window sit under the title, and the lifecycle stepper shows the stage it has reached, with the description, the affected items and an AI summary below. Planning carries the schedule, the impact statement and the rollout and backout plans; Conversation and Tasks hold the discussion and the work; Approvals records the CAB decisions and Audit Trails every edit.'),
  RAIL('change', 'Properties, Activity & Resources, AI Suggestions and Notifications',
    [RAIL_PROPS('SLA status, the change calendar, key fields and change information.'), RAIL_ACTIVITY, RAIL_SUGGEST('changes'), RAIL_NOTIFY('change')]),
  PROPS('Change details, your way',
    'View SLA status, key information, the change calendar, change information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('change'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the change, assess its risk, draft the implementation notes or find similar changes.'),
];

/* ── Release ───────────────────────────────────────────────────────────────── */
export const RELEASE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the release. Status, priority, type and the release window sit under the title, and the stepper tracks it from Submitted through Build, Testing and Deployment to Closed, with the description, affected items and an AI summary below. Planning holds the schedule, impact and the rollout, backout and build plans; Conversation, Tasks, Approvals, Relations and Audit Trails carry the discussion, the work, the sign-offs, the linked records and the history.'),
  RAIL('release', 'Properties, Activity & Resources, AI Suggestions and Notifications',
    [RAIL_PROPS('SLA status, the release calendar, key fields and release information.'), RAIL_ACTIVITY, RAIL_SUGGEST('releases'), RAIL_NOTIFY('release')]),
  PROPS('Release details, your way',
    'View SLA status, key information, the release calendar, release information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('release'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the release, check readiness against its stages, draft release notes or find related changes.'),
];

/* ── Project ───────────────────────────────────────────────────────────────── */
export const PROJECT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to run the project. Status, priority, owner, due date, completion and the task and milestone counts sit under the title, with the description and an AI summary below. Planning groups tasks and milestones by phase — tick a task to close it, drag to reorder, and switch to the Gantt to see the whole schedule against the project window; Conversation, Relations and Audit Trails sit beside it.'),
  RAIL('project', 'Properties, Members, Activity & Resources and Notifications',
    [RAIL_PROPS('SLA status, key fields and project information.'), b(Users, 'Members', 'Who is on the project.'), RAIL_ACTIVITY, RAIL_NOTIFY('project')]),
  PROPS('Project details, your way',
    'View SLA status, key information — status, owner, completion and milestones — project information and system information in one place. Search or filter the fields, and reorder the sections to suit how you work.',
    [SEARCH('project'), FILTER, CUSTOMIZE]),
  AI('Ask ServiceOps AI to assess schedule risk, draft a status update or forecast when the project will finish.'),
];

/* ── Hardware asset ────────────────────────────────────────────────────────── */
export const HARDWARE_ASSET_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the asset. The strip under the title shows the type, status, who uses it and who manages it. The Overview grades warranty, antivirus, missing patches, baseline variance, unauthorised software and compliance, with the related records and pending approvals beside them — hover a card for an AI-suggested action. The other tabs cover Properties, Hardware, Software, Baseline, Relationship, Approvals, Relations, Financials and History.'),
  RAIL('asset', 'Asset Properties, Users, Notes and Attachments',
    [RAIL_ASSET_PROPS('Agent status, key fields, asset and system information.'), RAIL_USERS, RAIL_NOTES, RAIL_ATTACH]),
  PROPS('Asset details, your way',
    'View the agent status, key information, asset information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('asset'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the asset, explain a compliance gap, check warranty exposure or suggest what to do next.'),
];

/* ── Software asset ────────────────────────────────────────────────────────── */
export const SOFTWARE_ASSET_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the software. The strip under the title shows the asset type, status, software type and who manages it. The Overview grades licence state and expiry, compliance, missing patches, seat utilisation and the consolidated software count, with the related incidents, problems and changes beside them — hover a card for an AI-suggested action. The other tabs cover Properties, Consolidated Software, Installation, Meter, Relationship, Relations and History.'),
  RAIL('software', 'Asset Properties, Notes and Attachments',
    [RAIL_ASSET_PROPS('Key fields, software type, asset and system information.'), RAIL_NOTES, RAIL_ATTACH]),
  PROPS('Asset details, your way',
    'View key information, the software type, asset information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('software'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the software, explain its licence position, check where it is installed or suggest what to do next.'),
];

/* ── Non-IT asset ──────────────────────────────────────────────────────────── */
export const NONIT_ASSET_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the asset. The strip under the title shows the asset type, status, impact, who manages it and any pending approvals. The Overview leads with warranty expiry, the related incidents, problems, changes and releases and the approvals, then the financial snapshot, the contracts and purchases and the property group; Approvals, Relationship, Relations, Financials and History follow in the tabs.'),
  RAIL('asset', 'Asset Properties, Notes and Attachments',
    [RAIL_ASSET_PROPS('Key fields, asset information and system information.'), RAIL_NOTES, RAIL_ATTACH]),
  PROPS('Asset details, your way',
    'View key information, asset information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('asset'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the asset, plan a warranty renewal, check what depends on it or suggest what to do next.'),
];

/* ── Consumable asset ──────────────────────────────────────────────────────── */
export const CONSUMABLE_ASSET_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to manage the stock. The strip under the title shows the status, stock level, impact and who manages it; Allocate at the top right issues units. The Overview leads with the stock status and pending approvals, then the total, available and allocated quantities — the same figures Quantity & Allocation breaks down by person and location; Approvals, Relationship, Relations, Financials and History follow in the tabs.'),
  RAIL('consumable', 'Asset Properties, Notes and Attachments',
    [RAIL_ASSET_PROPS('Key fields, asset information and system information.'), RAIL_NOTES, RAIL_ATTACH]),
  PROPS('Asset details, your way',
    'View key information, asset information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('consumable'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the stock position, forecast when to reorder, see who holds units or suggest what to do next.'),
];

/* ── Software licence ──────────────────────────────────────────────────────── */
export const SOFTWARE_LICENSE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the licence. The strip under the title shows the product, licence type, utilisation and expiry; Allocate at the top right jumps to the allocation tab. The Overview sets the purchased, available, allocated, installed and pending-install counts beside the utilisation grade, lists the Managed Softwares the licence covers — click one to open it — and carries the dates, cost and key; User Allocation, Attachment and Audit Trail follow.'),
  RAIL('licence', 'License Properties, Notes and Attachments',
    [b(FileText, 'License Properties', 'Product, licence type and the full licence information.'), RAIL_NOTES, RAIL_ATTACH]),
  PROPS('Licence details, your way',
    'View the product and licence type under Key Information, with the form fields the licence carries under License Information. Search or filter the fields, and reorder the sections to suit how you work.',
    [SEARCH('licence'), FILTER, CUSTOMIZE]),
  AI('Ask ServiceOps AI to summarise the licence, check compliance, forecast the renewal or find where seats are over-used.'),
];

/* ── Contract ──────────────────────────────────────────────────────────────── */
export const CONTRACT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the contract. The strip under the title shows the status, vendor, cost, type and owner; Renew Contract at the top right starts a renewal. The Overview gives the contract type, cost, vendor, days to expiry, the related records and the child contracts a card each — hover one for an AI-suggested action, View more opens the detail behind it — and Renewals, Child Contracts and Audit Trail follow in the tabs.'),
  RAIL('contract', 'Contract Properties, Attachments and Notifications',
    [b(FileText, 'Contract Properties', 'Dates, cost, vendor and key fields.'), b(Paperclip, 'Attachments', 'The signed documents.'), RAIL_NOTIFY('contract')]),
  PROPS('Contract details, your way',
    'View key information, contract information and system information in one place — dates, cost, vendor, type and owner. Search or filter the fields, and reorder the sections to suit how you work.',
    [SEARCH('contract'), FILTER, CUSTOMIZE]),
  AI('Ask ServiceOps AI to summarise the contract, flag renewal risk, compare it with its children or draft the renewal note.'),
];

/* ── Purchase order ────────────────────────────────────────────────────────── */
export const PURCHASE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the order. The strip under the title shows the status, total cost, cost centre, vendor, owner and pending approvals. The Overview leads with the purchased items, total cost, invoiced, paid and outstanding amounts, with the vendor, related records and approvals beside them; Purchase Details itemises the order, Settlements tracks the invoices and payments, and Conversation, Approvals, Relations and Audit Trail complete the tabs.'),
  RAIL('order', 'Purchase Properties, Notes, Attachments and Notifications',
    [b(FileText, 'Purchase Properties', 'Status, order number, cost and dates.'), RAIL_NOTES, RAIL_ATTACH, RAIL_NOTIFY('order')]),
  PROPS('Order details, your way',
    'View key information — status, order number, cost, cost centre and dates — purchase information and system information in one place. Search or filter the fields, and reorder the sections to suit how you work.',
    [SEARCH('order'), FILTER, CUSTOMIZE]),
  AI('Ask ServiceOps AI to summarise the order, explain the outstanding balance, chase an approval or draft the vendor note.'),
];

/* ── CMDB — the Dependency Map landing view keeps its own three map steps ──── */
export const CMDB_MAP_STEPS: OnboardingStep[] = [
  step(1, 'Map first, details on demand',
    'Every CI opens on its Dependency Map. Switch to CI Details for the full record — Overview, Properties, Hardware, Software, Running Process, Approvals, Relations and History — and back again here.',
    'ci-view-toggle', 'bottom'),
  step(2, 'Explore the map',
    'Search for a node (Ctrl+F), filter by node type or connection, save the view you build, and switch between Full, Tree and Grid layouts. Refresh re-fits the map; Download exports it.',
    'map-toolbar', 'bottom'),
  step(3, 'Work the topology',
    'Click a node to expand its relationships and hover it for details and the records it links to. The + badge adds a relationship; red nodes carry active issues — hover one to see them.',
    'dependency-map', 'center'),
];
/* ── CMDB — the CI Details view ────────────────────────────────────────────── */
export const CMDB_DETAILS_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the CI. The strip under the title shows the CI type, status, impact and who manages it; Dependency Map at the top right returns to the topology. The Overview grades warranty, antivirus, missing patches, unauthorised software, compliance and pending approvals — hover a card for an AI-suggested action, View more opens the detail behind it — and Properties, Hardware, Software, Running Process, Approvals, Relations and History follow in the tabs.'),
  RAIL('CI', 'Asset Properties, Users, Notes and Attachments',
    [RAIL_ASSET_PROPS('Agent status, key fields, asset and system information.'), RAIL_USERS, RAIL_NOTES, RAIL_ATTACH]),
  PROPS('CI details, your way',
    'View the agent status, key information, asset information and system information in one place. Search, filter, or pin important fields to keep the details you need on top.',
    [SEARCH('CI'), FILTER_PIN, PIN]),
  AI('Ask ServiceOps AI to summarise the CI, explain what depends on it, check its compliance or suggest what to do next.'),
];

/* ── Patch ─────────────────────────────────────────────────────────────────── */
const PATCH_RAIL = [
  b(FileText, 'Patch Properties', 'The catalogue facts, read-only, plus tags.'),
  b(Layers, 'Affected Products', 'The OS editions or the application it targets.'),
  b(Files, 'File Details', 'The binaries, with copy link and download.'),
];
const PATCH_PROPS_TOOLS = [
  SEARCH('patch'),
  TAGS('Add or remove tags — the one row here you edit.'),
  b(Link, 'Reference URL', 'Open the vendor advisory behind the patch in one click.'),
];
export const PATCH_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the patch. The strip under the title shows the category, severity, approval status, release date and KB number; Approve or Decline at the top right records your decision. Three gauges show the CVEs it resolves, the endpoints missing, installed or ignoring it, and how its deployments went — each View more opens the matching tab — with Affected Products and Files previewed beside them; Superseded maps what it replaces.'),
  RAIL('patch', 'Patch Properties, Affected Products and File Details', PATCH_RAIL),
  PROPS('Patch details, your way',
    'Every catalogue fact about the patch — category, severity, approval status, release date, KB number, architecture, download state and the reference URL — sits read-only in one list, so what you see is what the scanner reported. Search jumps to a field; Tags is the one row you edit.',
    PATCH_PROPS_TOOLS),
  AI('Ask ServiceOps AI to summarise the patch, assess its vulnerability risk, check the impacted endpoints or trace what it supersedes.'),
];

/* ── Vulnerability (the patch that remediates a detected finding) ──────────── */
export const VULNERABILITY_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the finding and the patch that remediates it. The strip under the title shows the category, severity, approval status, release date and KB number; Approve or Decline at the top right records your decision. The gauges show the CVEs behind the finding, the endpoints still exposed versus patched, and how deployments of the fix have gone — each View more opens the matching tab — with Affected Products, Files and Superseded beside them.'),
  RAIL('finding', 'Patch Properties, Affected Products and File Details', PATCH_RAIL),
  PROPS('Patch details, your way',
    'Every catalogue fact about the remediating patch — category, severity, approval status, release date, KB number, architecture, download state and the reference URL — sits read-only in one list, so what you see is what the scanner reported. Search jumps to a field; Tags is the one row you edit.',
    PATCH_PROPS_TOOLS),
  AI('Ask ServiceOps AI to assess the risk, list the impacted endpoints, summarise the fix or check whether a newer patch supersedes it.'),
];

/* ── Patch / Package / Registry deployment runs ────────────────────────────── */
const RUN_PROPS_TOOLS = (noun: string) => [
  SEARCH(noun),
  b(CalendarClock, 'Window', 'Install After and Expiry Date bound when endpoints may install.'),
  b(RotateCcw, 'Retry', 'Retry Failed Configuration and Retry Count govern the re-attempts.'),
];
export const PATCH_DEPLOYMENT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    "Work from the left panel to follow the run. The strip under the title shows the status, task type, deployment date and the install-after and expiry window; Refresh re-reads the rollout. The Overview counts the successes, failures, in-progress and other results and breaks them down by patch category and remote office; Endpoint and Patches list what was targeted, and Deployment opens the full patch-by-endpoint matrix with card, list and topology views."),
  RAIL('run', 'Patch Deployment Properties, the keyboard shortcuts and this guide',
    [b(FileText, 'Patch Deployment Properties', "The run's configuration, in one list."), RAIL_SHORTCUTS]),
  PROPS('Run details, your way',
    "The run's configuration sits in one list: status, task type, deployment policy, the install-after and expiry window, the remote offices targeted, who is notified and the retry settings. Search jumps to any field.",
    RUN_PROPS_TOOLS('run')),
  AI('Ask ServiceOps AI to summarise the run, explain the failures, list what is still pending or suggest a retry plan.'),
];
export const PACKAGE_DEPLOYMENT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    "Work from the left panel to follow the rollout. The strip under the title shows the status, task type, deployment date and the install-after and expiry window; Refresh re-reads it. The Packages and Endpoints cards say what went where; below them, the success, failed, in-progress and other counts with the breakdown by remote office. Deployment opens the package-by-endpoint matrix with card, list and topology views; Audit Trail keeps the history."),
  RAIL('rollout', 'Package Deployment Properties, the keyboard shortcuts and this guide',
    [b(FileText, 'Package Deployment Properties', "The rollout's configuration, in one list."), RAIL_SHORTCUTS]),
  PROPS('Rollout details, your way',
    "The rollout's configuration sits in one list: status, task type, deployment policy, the install-after and expiry window, who is notified and the retry settings. Search jumps to any field.",
    RUN_PROPS_TOOLS('rollout')),
  AI('Ask ServiceOps AI to summarise the rollout, explain the failures, list what is still pending or suggest a retry plan.'),
];
export const REGISTRY_DEPLOYMENT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    "Work from the left panel to follow the rollout. The strip under the title shows the status, task type, deployment date and the install-after and expiry window; Refresh re-reads it. The Registry and Endpoints cards say which configurations went where; below them, the success, failed, in-progress and other counts with the breakdown by remote office. Deployment opens the configuration-by-endpoint matrix with card, list and topology views; Audit Trail keeps the history."),
  RAIL('rollout', 'Registry Deployment Properties, the keyboard shortcuts and this guide',
    [b(FileText, 'Registry Deployment Properties', "The rollout's configuration, in one list."), RAIL_SHORTCUTS]),
  PROPS('Rollout details, your way',
    "The rollout's configuration sits in one list: status, task type, deployment policy, the install-after and expiry window, who is notified and the retry settings. Search jumps to any field.",
    RUN_PROPS_TOOLS('rollout')),
  AI('Ask ServiceOps AI to summarise the rollout, explain the failures, list what is still pending or suggest a retry plan.'),
];

/* ── Endpoint ──────────────────────────────────────────────────────────────── */
export const ENDPOINT_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to review the machine. The strip under the title shows system health, OS, IP, missing patches, reboot state and the last scan; Refresh re-reads the agent and Scan Now starts a fresh scan. Gauges show the vulnerabilities found, the patches missing, installed or ignored, and how deployments to it went; OS Lifecycle tracks the end of servicing, System Overview lists the inventory, and Vulnerabilities, Patches, Deployment and Audit Trail follow in the tabs.'),
  RAIL('endpoint', 'Endpoint Properties, Notes and the keyboard shortcuts',
    [b(FileText, 'Endpoint Properties', 'Identity, inventory and the scan dates.'), RAIL_NOTES, RAIL_SHORTCUTS]),
  PROPS('Endpoint details, your way',
    'Identity and inventory sit in one list — health, OS version, IP, tags, the asset and CI links — with Scan Info and its dates underneath. Search jumps to a field, Tags is the row you edit, and the two sections reorder to suit how you work.',
    [SEARCH('endpoint'), TAGS('Add or remove tags — the one row here you edit.'), CUSTOMIZE]),
  AI('Ask ServiceOps AI to summarise the endpoint, explain its health grade, list what to patch first or check whether a reboot is pending.'),
];

/* ── Detected CVE ──────────────────────────────────────────────────────────── */
export const DETECTED_CVE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    "Work from the left panel to assess the CVE. The strip under the title shows the NVD status, severity, CVSS 3.1 score, exploit status, patch availability, impacted endpoints and the published date; Approve or Decline at the top right records your decision. The description composes the CVE's facts, the Patches donut shows the fixes by severity and the Endpoints card who is affected — each View more opens its tab — with References and the CVSS 3.1 metrics below; Patches, Endpoint, Remediation and Audit Trail follow."),
  RAIL('CVE', 'CVE Properties, the keyboard shortcuts and this guide',
    [b(FileText, 'CVE Properties', 'The classification, approval, tags and dates.'), RAIL_SHORTCUTS]),
  PROPS('CVE details, your way',
    'Everything the catalogue holds about the CVE sits in one list — the CWE, NVD status, severity, exploit status and patch availability, the approval decision, then tags and the published and last-updated dates — so the record and the header never disagree.',
    [
      b(ShieldAlert, 'Classification', 'CWE, severity, exploit status and patch availability, as NVD reports them.'),
      b(CircleCheck, 'Approval', 'The decision taken from Approve / Decline in the header.'),
      TAGS('Add or remove tags — the one row here you edit.'),
    ]),
  AI('Ask ServiceOps AI to summarise the CVE, assess its risk, list the impacted endpoints or pick the patch to deploy first.'),
];

/* ── Task ──────────────────────────────────────────────────────────────────── */
export const TASK_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to get the task done. The strip under the title shows the status, priority, assignee, type, due date and the record the task belongs to — click the reference, or the Linked pill under the description, to open the parent as a tab. Tick checklist items as you complete them and the progress bar follows; add, edit or remove items inline. Comments carries the discussion and Audit Trail the history.'),
  RAIL('task', 'Task Properties, Activity & Resources and the keyboard shortcuts',
    [b(FileText, 'Task Properties', 'Status, priority, assignee and dates, editable in place.'), b(Activity, 'Activity & Resources', 'The work tracker and attachments.'), RAIL_SHORTCUTS]),
  PROPS('Task details, your way',
    'Key Information holds the status, priority, assignee, type and the start–end dates, editable in place; Task Information carries the custom fields the task form added. Search jumps to any field.',
    [
      SEARCH('task'),
      b(SquarePen, 'Edit in place', 'Click any Key Information value to change it — no edit mode.'),
      b(Info, 'Task Information', 'The custom fields, seven upfront and the rest under View more.'),
    ]),
  AI('Ask ServiceOps AI to summarise the task, draft a status comment or suggest what to do next.'),
];

/* ── Knowledge ─────────────────────────────────────────────────────────────── */
export const KNOWLEDGE_STEPS: OnboardingStep[] = [
  WORKSPACE('Your main workspace',
    'Work from the left panel to read and maintain the article. It opens with its AI summary and key points, then the full text with a reading rail that jumps between sections and down to Comments; the Technician / Requester switch at the top previews what readers see. Relations, Approvals and Audit Trail sit beside Article in the tabs.'),
  RAIL('article', 'Knowledge Properties, the keyboard shortcuts and this guide',
    [b(FileText, 'Knowledge Properties', 'Review, analytics and the record itself.'), RAIL_SHORTCUTS]),
  PROPS('Article details, your way',
    'Everything about the article as a record sits in this panel: the pending review and who last reviewed it, how readers are using it, and its status, folder, author and tags.',
    [
      b(MessageSquare, 'Review', 'The pending review and who last reviewed it.'),
      b(BarChart3, 'Analytics', 'Reads, comments and how helpful readers found it.'),
      b(Info, 'Key Information', 'Status, folder, author and tags.'),
    ]),
  AI('Ask ServiceOps AI to summarise the article, check it against the records that link to it or draft an update.'),
];
