import { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  useInternalNode,
  useStore,
  getStraightPath,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Monitor, Keyboard, Maximize, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Map as MapIcon, ChevronDown,
  MemoryStick, Cpu, Globe, ShieldCheck, Network, Server, HardDrive, Smartphone, Printer, User, AppWindow, Mouse, Router, Database,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export type RelType = 'user' | 'software' | 'hardware' | 'asset';
export interface RelNodeInput { label: string; type: RelType }
export interface RelTypeMeta { color: string; icon: React.ReactNode; label: string }

interface RelationshipGraphProps {
  mode: 'graph' | 'tree';
  nodes: RelNodeInput[];
  typeMeta: Record<string, RelTypeMeta>;
  centerName: string;
  centerId?: string;
  /** Bumping this re-fits the view (wired to the toolbar Refresh button). */
  refreshSignal?: number;
  /** Highlights nodes whose label matches; everything else fades out. */
  searchTerm?: string;
}

/* Pick the most accurate icon from the node's NAME (falls back to its type). */
function iconForNode(label: string, type: RelType): React.ReactNode {
  const l = label.toLowerCase();
  if (/monitor|display|screen/.test(l)) return <Monitor />;
  if (/\bram\b|memory|ddr\d?/.test(l)) return <MemoryStick />;
  if (/cpu|processor|intel|\bamd\b|ryzen|xeon|\bi[3579]\b|core\s*i/.test(l)) return <Cpu />;
  if (/edge|chrome|firefox|safari|opera|browser/.test(l)) return <Globe />;
  if (/vpn|firewall|antivirus|defender|bitdefender|security|endpoint/.test(l)) return <ShieldCheck />;
  if (/router|gateway/.test(l)) return <Router />;
  if (/switch|\bsw[-\s]|core|network|lan/.test(l)) return <Network />;
  if (/server|\bsrv\b|host|esxi|hyper[-\s]?v|vmware/.test(l)) return <Server />;
  if (/database|\bsql\b|oracle|postgres|mysql|mongo/.test(l)) return <Database />;
  if (/disk|\bssd\b|\bhdd\b|storage|\bdrive\b|volume/.test(l)) return <HardDrive />;
  if (/phone|mobile|iphone|android|ipad|tablet/.test(l)) return <Smartphone />;
  if (/printer|print/.test(l)) return <Printer />;
  if (/keyboard/.test(l)) return <Keyboard />;
  if (/mouse/.test(l)) return <Mouse />;
  // Fall back to the relationship type.
  if (type === 'user') return <User />;
  if (type === 'software') return <AppWindow />;
  if (type === 'hardware') return <Cpu />;
  return <Network />;
}

/* ----------------------------- Custom nodes ----------------------------- */

const hiddenHandle = '!w-1 !h-1 !min-w-0 !min-h-0 !border-0 !bg-transparent';

// The label sits below the shape and is absolutely positioned + pointer-events-none so it
// does NOT contribute to the node's measured box — that keeps the floating edges attached
// to the icon's centre rather than the (taller) icon+label bounding box.
function CenterNode({ data }: NodeProps) {
  const d = data as { name: string; id?: string; size?: number };
  // Deliberately LARGER than every other node — and it GROWS with the graph (data.size is
  // set by the layout from the visible node count), so with 10-15 open groups the root
  // still dominates the zoomed-out view.
  const s = d.size ?? 64;
  return (
    <div className="relative">
      <div
        className="flex items-center justify-center bg-[#3D8BD0] text-white shadow-lg"
        style={{ width: s, height: s, borderRadius: s / 4, boxShadow: `0 0 0 ${Math.round(s / 12)}px rgba(61,139,208,0.15), 0 10px 15px -3px rgba(0,0,0,0.1)` }}
      >
        <Monitor size={Math.round(s * 0.42)} />
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[190px] text-center pointer-events-none">
        <div className="text-[13px] font-semibold text-[#364658] truncate">{d.name}</div>
        {d.id ? <div className="text-[11px] text-[#7B8FA5] truncate">{d.id}</div> : null}
      </div>
      <Handle type="source" position={Position.Top} className={hiddenHandle} isConnectable={false} />
      <Handle type="target" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

function ItemNode({ id, data }: NodeProps) {
  const d = data as { label: string; color: string; icon: React.ReactNode; childCount?: number; expanded?: boolean; onToggle?: (id: string) => void };
  const hasChildren = (d.childCount ?? 0) > 0;
  const toggle = (e: React.MouseEvent) => { e.stopPropagation(); d.onToggle?.(id); };
  // Only at the deepest zoom-out levels (the last ~2 steps before minZoom 0.3) are the
  // ring + icon truly indistinguishable — switch to a solid filled circle (white icon on
  // the type color) there; everywhere else keep the normal ring style.
  const compact = useStore((s) => s.transform[2] < 0.45);
  return (
    <div className="relative group cursor-pointer">
      <div
        className="flex items-center justify-center size-14 rounded-full border-2 shadow-sm [&_svg]:size-5 transition-colors duration-150"
        style={compact ? { backgroundColor: d.color, borderColor: d.color, color: '#FFFFFF' } : { backgroundColor: '#FFFFFF', borderColor: d.color, color: d.color }}
      >
        {d.icon}
      </div>
      {hasChildren && (
        d.expanded ? (
          // Expanded → minus badge; ONLY this collapses the node.
          <button onClick={toggle} className="nodrag absolute -top-1 -right-1 flex size-[18px] cursor-pointer items-center justify-center rounded-full bg-[#64748B] text-white shadow-sm ring-2 ring-white transition-colors hover:bg-[#475569]" title="Collapse">
            <Minus size={12} strokeWidth={2.75} />
          </button>
        ) : (
          // Collapsed → count badge; ONLY this expands the node.
          <button onClick={toggle} className="nodrag absolute -top-1 -right-1 flex min-w-[18px] h-[18px] cursor-pointer items-center justify-center rounded-full bg-[#334155] px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white transition-colors hover:bg-[#1E293B]" title="Expand">{d.childCount}</button>
        )
      )}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[150px] text-center text-[12px] font-medium text-[#364658] truncate pointer-events-none">{d.label}</div>
      <Handle type="target" position={Position.Top} className={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} isConnectable={false} />
    </div>
  );
}

/* Floating edge: a straight line between the two nodes' centers (topology look).
 * When its node is hovered/selected the edge turns into an animated dashed primary-blue
 * line whose dashes flow AWAY from that node, tracing the direction of the connection. */
function FloatingEdge({ id, source, target, style, data }: EdgeProps) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t) return null;
  const sx = s.internals.positionAbsolute.x + (s.measured.width ?? 0) / 2;
  const sy = s.internals.positionAbsolute.y + (s.measured.height ?? 0) / 2;
  const tx = t.internals.positionAbsolute.x + (t.measured.width ?? 0) / 2;
  const ty = t.internals.positionAbsolute.y + (t.measured.height ?? 0) / 2;
  const [path] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });
  const d = data as { hl?: boolean; outward?: boolean; dim?: boolean; rel?: string } | undefined;
  const st = d?.hl
    ? {
        stroke: '#3D8BD0',
        strokeWidth: 2,
        strokeDasharray: '7 5',
        animation: `${d.outward ? 'rel-dash-fwd' : 'rel-dash-rev'} 0.5s linear infinite`,
      }
    : { stroke: '#CBD5E1', strokeWidth: 1.5, opacity: d?.dim ? 0.12 : 1, transition: 'opacity 0.2s' };
  // Relation label (Depends On / Users / …) rides along the line, upright, ONLY while
  // the edge is highlighted by a hover/click on one of its nodes.
  let labelEl: React.ReactNode = null;
  if (d?.hl && d?.rel) {
    const mx = (sx + tx) / 2, my = (sy + ty) / 2;
    let angle = (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180; // keep the text readable left-to-right
    labelEl = (
      <EdgeLabelRenderer>
        <div
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${mx}px, ${my}px) rotate(${angle}deg) translateY(-10px)`, pointerEvents: 'none' }}
          className="text-[10px] font-medium text-[#3D8BD0] whitespace-nowrap"
        >
          {d.rel}
        </div>
      </EdgeLabelRenderer>
    );
  }
  return (
    <>
      <BaseEdge id={id} path={path} style={{ ...st, ...style }} />
      {labelEl}
    </>
  );
}

const nodeTypes = { center: CenterNode, item: ItemNode };
const edgeTypes = { floating: FloatingEdge };

/* -------------------- Expandable topology (deterministic mock children) --------------------
 * Each node can have further connected nodes. They aren't drawn until the user clicks the node;
 * the node shows a count badge for its (collapsed) children. Clicking expands/collapses them,
 * and expanded children can themselves be expanded — recursively. */
interface TreeNode { id: string; label: string; type: RelType; parentId: string; children: TreeNode[] }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const CHILD_TYPES: RelType[] = ['hardware', 'software', 'asset', 'user'];
function mockLabel(type: RelType, seed: number): string {
  if (type === 'user') return ['A. Kumar', 'R. Shah', 'M. Patel', 'S. Iyer', 'N. Rao'][seed % 5];
  if (type === 'software') return ['nginx', 'PostgreSQL', 'Redis', 'Docker', 'MS Office', 'Chrome'][seed % 6];
  const pfx = ['win-', 'linux-', 'srv-', 'vm', ''][seed % 5];
  return pfx ? `${pfx}${(seed % 900) + 100}` : `172.16.${seed % 30}.${(seed * 7) % 250}`;
}
function genChildren(parentId: string, depth: number): TreeNode[] {
  const h = hash(parentId + '|' + depth);
  // Realistic customer mix: most nodes have a handful of connections, but some (a core
  // switch, hypervisor, …) fan out to 20+ children — the layout wraps those into
  // multiple staggered rings.
  const count =
    depth === 1 ? (h % 4 === 0 ? 20 + (h % 9) : 2 + (h % 3)) // some 20-28, rest 2-4
    : depth === 2 ? (h % 7 === 0 ? 5 + (h % 3) : h % 3) // occasionally 5-7, rest 0-2
    : 0;
  const out: TreeNode[] = [];
  for (let k = 0; k < count; k++) {
    const id = `${parentId}.${k}`;
    const seed = hash(id);
    const type = CHILD_TYPES[seed % CHILD_TYPES.length];
    out.push({ id, label: mockLabel(type, seed), type, parentId, children: [] });
  }
  out.forEach((c) => { c.children = genChildren(c.id, depth + 1); });
  return out;
}

/* ------------------------------ Canvas controls ------------------------------ */

/* Small keycap chip used by the shortcuts popup. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] h-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[3px]">
      <span className="flex items-center gap-1">{keys}</span>
      <span className="text-[12px] text-[#7B8FA5] whitespace-nowrap">{label}</span>
    </div>
  );
}

function CanvasControls({ panBy, showMap, setShowMap }: { panBy: (dx: number, dy: number) => void; showMap: boolean; setShowMap: (v: boolean) => void }) {
  const rf = useReactFlow();
  const [showKeys, setShowKeys] = useState(false);
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  return (
    <>
      {/* Top-right: keyboard shortcuts · fit & center · zoom in/out */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowKeys((v) => !v)} className={`${btn} ${showKeys ? 'bg-[#EAF2FB] text-[#3D8BD0]' : ''}`}><Keyboard size={14} /></button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.fitView({ padding: 0.2, duration: 300 })} className={`${btn} border-t border-[#E5E7EB]`}><Maximize size={13} /></button></TooltipTrigger>
            <TooltipContent side="left">Fit &amp; center</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomIn({ duration: 150 })} className={btn}><Plus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => rf.zoomOut({ duration: 150 })} className={`${btn} border-t border-[#E5E7EB]`}><Minus size={14} /></button></TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
        </div>
        {/* Keyboard shortcuts popup */}
        {showKeys && (
          <>
            <div className="fixed inset-0" onClick={() => setShowKeys(false)} />
            <div className="absolute right-9 top-0 w-[290px] rounded-lg border border-[#E5E7EB] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0F1F3]">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#364658]">
                  <Keyboard size={14} className="text-[#6B7280]" /> Keyboard Shortcuts
                </span>
                <button onClick={() => setShowKeys(false)} className="text-[#9CA3AF] hover:text-[#364658] transition-colors" title="Close">
                  <Minus size={14} />
                </button>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Navigation</div>
                <ShortcutRow keys={<><Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd></>} label="Pan graph" />
                <ShortcutRow keys={<><Kbd>+</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>−</Kbd></>} label="Zoom in / out" />
                <ShortcutRow keys={<Kbd>F</Kbd>} label="Fit & center all nodes" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">View</div>
                <ShortcutRow keys={<><Kbd>1</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>2</Kbd><span className="text-[10px] text-[#9CA3AF]">/</span><Kbd>3</Kbd></>} label="Full / Tree / Grid view" />
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>Shift</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Toggle fullscreen" />
                <div className="mt-2.5 border-t border-[#F0F1F3] pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">UI</div>
                <ShortcutRow keys={<Kbd>M</Kbd>} label="Toggle minimap" />
                <ShortcutRow keys={<Kbd>R</Kbd>} label="Reset layout" />
                <ShortcutRow keys={<><Kbd>Ctrl</Kbd><span className="text-[10px] text-[#9CA3AF]">+</span><Kbd>F</Kbd></>} label="Focus search" />
                <ShortcutRow keys={<Kbd>Escape</Kbd>} label="Clear search / deselect" />
              </div>
            </div>
          </>
        )}
      </div>
      {/* Bottom-left: directional pan */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild><button onClick={() => panBy(0, -40)} className={padBtn}><ArrowUp size={14} /></button></TooltipTrigger>
          <TooltipContent side="top">Move up</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(-40, 0)} className={padBtn}><ArrowLeft size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(0, 40)} className={padBtn}><ArrowDown size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move down</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><button onClick={() => panBy(40, 0)} className={padBtn}><ArrowRight size={14} /></button></TooltipTrigger>
            <TooltipContent side="top">Move right</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Bottom-right: minimap (collapsible) */}
      <div className="absolute bottom-3 right-3 z-20">
        {showMap ? (
          <div className="w-[220px] rounded-lg border border-[#E5E7EB] bg-white shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#F0F1F3]">
              <span className="text-[12px] font-semibold text-[#364658]">Minimap</span>
              <button onClick={() => setShowMap(false)} className="text-[#9CA3AF] hover:text-[#364658] transition-colors" title="Collapse">
                <ChevronDown size={14} />
              </button>
            </div>
            <MiniMap
              className="!static !m-0"
              style={{ width: 218, height: 138 }}
              pannable
              zoomable
              maskColor="rgba(148,163,184,0.12)"
              nodeColor={(n) => (n.type === 'center' ? '#3D8BD0' : ((n.data as { color?: string })?.color ?? '#CBD5E1'))}
              nodeStrokeWidth={2}
              nodeBorderRadius={999}
            />
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowMap(true)} className="flex size-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white shadow-md text-[#6B7280] hover:bg-[#F5F7FA] transition-colors">
                <MapIcon size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Minimap</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}

/* ------------------------------ Inner (uses hooks) ------------------------------ */

function RelationshipGraphInner({ mode, nodes: data, typeMeta, centerName, centerId, refreshSignal, searchTerm }: RelationshipGraphProps) {
  const rf = useReactFlow();

  // Build the full (deterministic) topology tree for the current first-level data, and index it.
  const dataSig = data.map((d) => `${d.label}:${d.type}`).join('|');
  const tree: TreeNode[] = data.map((d, i) => ({ id: `n${i}`, label: d.label, type: d.type, parentId: 'center', children: genChildren(`n${i}`, 1) }));
  const treeMap = new Map<string, TreeNode>();
  const indexTree = (t: TreeNode) => { treeMap.set(t.id, t); t.children.forEach(indexTree); };
  tree.forEach(indexTree);
  const treeRef = useRef(treeMap);
  treeRef.current = treeMap;
  // Which nodes are currently expanded (their children visible).
  const expandedRef = useRef<Set<string>>(new Set());
  // Positions the user set by hand (dragging). Re-layouts respect these — a manually placed
  // node/group stays exactly where the user put it until Refresh / layout-mode change.
  const manualPos = useRef<Record<string, { x: number; y: number }>>({});

  // Hover / click highlight: the affected node's edges render as animated dashed blue lines.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // Minimap visibility (bottom-right; toggled by its collapse button or the M key).
  const [showMap, setShowMap] = useState(true);
  // Stable indirection so node data can call the latest toggleExpand without stale closures.
  const toggleRef = useRef<(id: string) => void>(() => {});

  const makeNode = (t: TreeNode, x: number, y: number, expanded = false): Node => {
    const m = typeMeta[t.type];
    return { id: t.id, type: 'item', position: { x, y }, data: { label: t.label, color: m.color, icon: iconForNode(t.label, t.type), childCount: t.children.length, expanded, onToggle: (nid: string) => toggleRef.current(nid) } };
  };

  // Lay out ALL visible nodes as a tidy radial tree: every subtree gets an angular sector sized by
  // its visible leaf count, so each expanded group has its own wedge of the canvas — groups stay
  // separated and never overlap each other.
  const layoutAll = (): { nodes: Node[]; edges: Edge[] } => {
    const expanded = expandedRef.current;
    const visChildren = (t: TreeNode): TreeNode[] => (expanded.has(t.id) ? t.children : []);
    const leaves = (t: TreeNode): number => {
      const ch = visChildren(t);
      return ch.length ? ch.reduce((s, c) => s + leaves(c), 0) : 1;
    };
    const nodesOut: Node[] = [{ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { name: centerName, id: centerId } }];
    const edgesOut: Edge[] = [];

    if (mode === 'tree') {
      // Tidy top-down tree: leaves get fixed-width slots; parents sit centred over their children.
      const slotW = 190;
      const total = tree.reduce((s, t) => s + leaves(t), 0);
      const offset = ((total - 1) * slotW) / 2;
      let cursor = 0;
      const place = (t: TreeNode, depth: number, parentId: string): number => {
        const ch = visChildren(t);
        let x: number;
        if (ch.length) {
          const xs = ch.map((c) => place(c, depth + 1, t.id));
          x = (Math.min(...xs) + Math.max(...xs)) / 2;
        } else {
          x = cursor * slotW - offset;
          cursor += 1;
        }
        nodesOut.push(makeNode(t, x, depth * 200, expanded.has(t.id)));
        edgesOut.push({ id: `e-${t.id}`, source: parentId, target: t.id, type: 'floating', data: { rel: t.type === 'user' ? 'Users' : 'Depends On' } });
        return x;
      };
      tree.forEach((t) => place(t, 1, 'center'));
    } else {
      // BALLOON layout: every expanded node's children sit on a circle around it, each group
      // a clean circular cluster. Every child is placed at a distance that clears its parent
      // by the child's WHOLE group footprint (so a big group can never reach back over the
      // centre or a sibling), and the angular room each child needs is solved geometrically
      // at its own radius — leftover circle space becomes even gaps BETWEEN the groups.
      const NODE_R = 50, GAP = 16, CLEAR = 95, CENTER_CLEAR = 115, PUSH = 40;
      const half = NODE_R + GAP / 2;
      // Compact ring radius for n children: big enough to clear the parent and to seat all
      // children side-by-side. Siblings ALWAYS sit on this ring — expanding one child never
      // moves the others, and expanding a grandchild never moves the group's hub.
      const ringFor = (n: number, clear: number) => Math.max(clear + 2 * NODE_R, n > 2 ? half / Math.sin(Math.PI / n) : 0);
      // Ring ordering: nodes that CAN expand are spread EVENLY around the ring so their
      // discs open far apart from each other; ordering key is static (potential children).
      const orderIdx = (list: TreeNode[]): number[] => {
        const n = list.length;
        const badges = list.map((_c, i) => i).filter((i) => list[i].children.length > 0).sort((a2, b2) => list[b2].children.length - list[a2].children.length);
        const leaves = list.map((_c, i) => i).filter((i) => !list[i].children.length);
        const seq: number[] = new Array(n).fill(-1);
        const stride = badges.length ? n / badges.length : n;
        badges.forEach((idx, k) => {
          let s = Math.round(k * stride + stride / 2) % n;
          while (seq[s] !== -1) s = (s + 1) % n;
          seq[s] = idx;
        });
        leaves.forEach((idx) => { const s = seq.indexOf(-1); seq[s] = idx; });
        return seq;
      };
      // ---- DYNAMIC cluster placement (force-directed, deterministic) ----
      // Every expanded group is a rigid DISC (hub + its child ring). A small physics pass —
      // springs pulling each disc toward its parent + collision pushing discs apart — lets
      // the clusters settle organically (like classic topology tools) with no overlaps and
      // no reserved space. It is fully deterministic: fixed seed layout + fixed iterations.
      interface Hub { id: string; t: TreeNode | null; parent: Hub | null; ringR: number; discR: number; x: number; y: number; fixed: boolean; kids: Hub[] }
      const centerHub: Hub = { id: 'center', t: null, parent: null, ringR: ringFor(tree.length, CENTER_CLEAR), discR: ringFor(tree.length, CENTER_CLEAR) + NODE_R, x: 0, y: 0, fixed: true, kids: [] };
      const hubs: Hub[] = [centerHub];
      const hubMap = new Map<string, Hub>();
      const collect = (t: TreeNode, parentHub: Hub) => {
        const ch = visChildren(t);
        if (!ch.length) return;
        const ringR = ringFor(ch.length, CLEAR);
        const pin = manualPos.current[t.id];
        const h: Hub = { id: t.id, t, parent: parentHub, ringR, discR: ringR + NODE_R, x: pin?.x ?? 0, y: pin?.y ?? 0, fixed: !!pin, kids: [] };
        parentHub.kids.push(h);
        hubs.push(h);
        hubMap.set(t.id, h);
        ch.forEach((c) => collect(c, h));
      };
      tree.forEach((t) => collect(t, centerHub));
      // Deterministic seed: equal-slot angles per parent.
      const seed = (h: Hub, inAng: number) => {
        const n = Math.max(h.kids.length, 1);
        h.kids.forEach((c, k) => {
          if (!c.fixed) {
            const ang = inAng - Math.PI + ((2 * Math.PI) / n) * (k + 0.5);
            const L = h.ringR + c.discR + PUSH;
            c.x = h.x + L * Math.cos(ang);
            c.y = h.y + L * Math.sin(ang);
          }
          seed(c, Math.atan2(c.y - h.y, c.x - h.x));
        });
      };
      seed(centerHub, -Math.PI / 2);
      // Relaxation: parent springs + disc-vs-disc collision.
      const GROUP_GAP = 70;
      for (let iter = 0; iter < 280; iter++) {
        hubs.forEach((h) => {
          if (!h.parent || h.fixed) return;
          const L = h.parent.ringR + h.discR + PUSH;
          const dx = h.x - h.parent.x, dy = h.y - h.parent.y;
          const d = Math.hypot(dx, dy) || 1;
          const f = ((L - d) / d) * 0.22;
          h.x += dx * f;
          h.y += dy * f;
        });
        for (let i = 0; i < hubs.length; i++) {
          for (let j = i + 1; j < hubs.length; j++) {
            const A = hubs[i], B = hubs[j];
            let dx = B.x - A.x, dy = B.y - A.y;
            let d = Math.hypot(dx, dy);
            const min = A.discR + B.discR + GROUP_GAP;
            if (d >= min) continue;
            if (d < 1) { dx = 1; dy = 0; d = 1; }
            const push = ((min - d) / d) * 0.5;
            if (A.fixed && B.fixed) continue;
            if (A.fixed) { B.x += dx * push; B.y += dy * push; }
            else if (B.fixed) { A.x -= dx * push; A.y -= dy * push; }
            else { A.x -= (dx * push) / 2; A.y -= (dy * push) / 2; B.x += (dx * push) / 2; B.y += (dy * push) / 2; }
          }
        }
      }
      // Emit: hubs at their settled positions, leaf children seated on each hub's ring.
      const emitRing = (h: Hub) => {
        const ch = h.t ? visChildren(h.t) : tree;
        const inAng = h.parent ? Math.atan2(h.y - h.parent.y, h.x - h.parent.x) : -Math.PI / 2;
        // Small groups fan in a tight ARC on the away side of the parent (instead of being
        // flung to opposite sides of a full circle); big groups still use the full circle.
        // The centre always uses the full circle.
        const full = (2 * Math.PI) / (ch.length || 1);
        const per = h.parent ? Math.min(full, 1.15) : full;
        const start = inAng - (per * ch.length) / 2;
        const seq = orderIdx(ch);
        seq.forEach((i, k) => {
          const c = ch[i];
          const sub = hubMap.get(c.id);
          const ang = start + per * (k + 0.5);
          const cx = sub ? sub.x : h.x + h.ringR * Math.cos(ang);
          const cy = sub ? sub.y : h.y + h.ringR * Math.sin(ang);
          nodesOut.push(makeNode(c, cx, cy, expanded.has(c.id)));
          edgesOut.push({ id: `e-${c.id}`, source: h.id, target: c.id, type: 'floating', data: { rel: c.type === 'user' ? 'Users' : 'Depends On' } });
          if (sub) emitRing(sub);
        });
      };
      emitRing(centerHub);
    }

    // The root scales with the graph: on a small graph (10-15 nodes) it stays modest —
    // just a touch bigger than regular nodes; only as the user expands more and more
    // groups does it grow, so it remains identifiable in a zoomed-out busy view.
    const vis = nodesOut.length;
    (nodesOut[0].data as Record<string, unknown>).size = vis <= 15 ? 64 : vis <= 30 ? 80 : vis <= 60 ? 96 : 112;

    const MIN_DIST = 110;

    // Nodes the user placed by hand keep their exact positions (pinned) — remembering the
    // computed layout spot so we can fall back to it.
    const layoutSpot = new Map(nodesOut.map((n) => [n.id, { ...n.position }]));
    nodesOut.forEach((n) => {
      const m = manualPos.current[n.id];
      if (m) n.position = { ...m };
    });

    // BUT if a manually placed node would now overlap another node (e.g. a newly expanded
    // group landed there), its pin is dropped and it resets to its tidy layout position.
    nodesOut.forEach((n) => {
      if (!manualPos.current[n.id]) return;
      const collides = nodesOut.some((o) => o.id !== n.id && Math.hypot(o.position.x - n.position.x, o.position.y - n.position.y) < MIN_DIST);
      if (collides) {
        delete manualPos.current[n.id];
        n.position = { ...(layoutSpot.get(n.id) ?? n.position) };
      }
    });

    // Minimal de-overlap pass: the sector layout above is the source of truth for grouping —
    // this only gently separates the few pairs that actually collide (icon + label footprint),
    // with damped nudges so nodes stay inside their group's wedge. The centre and any
    // manually-placed nodes stay pinned; others are nudged around them.
    const DAMP = 0.55;
    const isFixed = (n: Node) => n.id === 'center' || !!manualPos.current[n.id];
    for (let iter = 0; iter < 14; iter++) {
      let moved = false;
      for (let i = 0; i < nodesOut.length; i++) {
        for (let j = i + 1; j < nodesOut.length; j++) {
          const A = nodesOut[i], B = nodesOut[j];
          let dx = B.position.x - A.position.x, dy = B.position.y - A.position.y;
          let d = Math.hypot(dx, dy);
          if (d >= MIN_DIST) continue;
          if (d < 1) { dx = 1; dy = 0; d = 1; }
          const aFixed = isFixed(A), bFixed = isFixed(B);
          if (aFixed && bFixed) continue;
          const push = ((MIN_DIST - d) / d) * DAMP;
          if (aFixed) { B.position.x += dx * push; B.position.y += dy * push; }
          else if (bFixed) { A.position.x -= dx * push; A.position.y -= dy * push; }
          else {
            A.position.x -= (dx * push) / 2; A.position.y -= (dy * push) / 2;
            B.position.x += (dx * push) / 2; B.position.y += (dy * push) / 2;
          }
          moved = true;
        }
      }
      if (!moved) break;
    }

    return { nodes: nodesOut, edges: edgesOut };
  };

  // React Flow owns the node state so nodes can be freely dragged; onNodesChange persists positions.
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutAll().nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutAll().edges);

  // Re-layout only when the mode changes, Refresh is pressed, or the data set changes — NOT on every
  // render — so dragged positions and expansions are preserved between renders.
  useEffect(() => {
    expandedRef.current = new Set();
    manualPos.current = {};
    const init = layoutAll();
    setNodes(init.nodes);
    setEdges(init.edges);
    const t = setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, refreshSignal, dataSig]);

  // Dragging a parent node carries its whole visible subtree with it (group drag). The centre
  // (root) node is exempt — moving it repositions only itself, never its children.
  const dragState = useRef<{ id: string; start: { x: number; y: number }; last: { x: number; y: number }; descendants: Set<string> } | null>(null);
  const visibleDescendants = (id: string): Set<string> => {
    const out = new Set<string>();
    const walk = (tid: string) => {
      if (!expandedRef.current.has(tid)) return;
      treeRef.current.get(tid)?.children.forEach((c) => { out.add(c.id); walk(c.id); });
    };
    walk(id);
    return out;
  };
  const onNodeDragStart = (_: unknown, node: Node) => {
    if (node.id === 'center') { dragState.current = null; return; }
    dragState.current = { id: node.id, start: { ...node.position }, last: { ...node.position }, descendants: visibleDescendants(node.id) };
  };
  const onNodeDrag = (_: unknown, node: Node) => {
    const st = dragState.current;
    if (!st || st.id !== node.id) return;
    const dx = node.position.x - st.last.x;
    const dy = node.position.y - st.last.y;
    st.last = { ...node.position };
    if ((dx || dy) && st.descendants.size) {
      setNodes((nds) => nds.map((nd) => (st.descendants.has(nd.id) ? { ...nd, position: { x: nd.position.x + dx, y: nd.position.y + dy } } : nd)));
    }
  };
  const onNodeDragStop = (_: unknown, node: Node) => {
    // Remember where the user left things: the dragged node and (for a group drag) every
    // descendant that moved with it are pinned so later re-layouts don't reset them.
    // Ignore micro-movements (< 8px) — a slightly jittery CLICK must never create a pin.
    const st = dragState.current;
    const moved = st && st.id === node.id ? Math.hypot(node.position.x - st.start.x, node.position.y - st.start.y) : 0;
    if (st && st.id === node.id && moved >= 8) {
      manualPos.current[node.id] = { ...node.position };
      if (st.descendants.size) {
        const all = rf.getNodes();
        st.descendants.forEach((did) => {
          const dn = all.find((n) => n.id === did);
          if (dn) manualPos.current[did] = { ...dn.position };
        });
      }
    }
    dragState.current = null;
  };

  // Click a node with a count badge to reveal (or hide) its connected nodes.
  const toggleExpand = (id: string) => {
    const t = treeRef.current.get(id);
    if (!t || t.children.length === 0) return;
    const ex = expandedRef.current;
    if (ex.has(id)) {
      // Collapse this node and everything beneath it — and drop any manual pins on it or
      // its subtree, so the node returns to its place in the parent's circle.
      const rm = (tid: string) => { ex.delete(tid); delete manualPos.current[tid]; treeRef.current.get(tid)?.children.forEach((c) => rm(c.id)); };
      rm(id);
    } else {
      ex.add(id);
    }
    // Re-run the global tidy layout so every expanded group keeps its own sector.
    const l = layoutAll();
    setNodes(l.nodes);
    setEdges(l.edges);
    // Viewport follow-up. Small graphs: re-fit everything (nice overview). LARGE graphs
    // (hundreds of nodes): never zoom out globally — nodes would become unreadably tiny.
    // Instead, focus the clicked node + its children at a readable zoom.
    const didExpand = ex.has(id);
    setTimeout(() => {
      if (l.nodes.length <= 24) {
        rf.fitView({ padding: 0.2, duration: 400 });
      } else if (didExpand) {
        const vp = rf.getViewport();
        rf.fitView({
          nodes: [{ id }, ...t.children.map((c) => ({ id: c.id }))],
          padding: 0.3,
          duration: 400,
          minZoom: 0.6, // never smaller than comfortably readable
          maxZoom: Math.max(vp.zoom, 0.9), // don't zoom IN past where the user already is
        });
      }
      // Collapsing on a large graph: leave the viewport exactly where the user is.
    }, 90);
  };
  toggleRef.current = toggleExpand;

  // Spotlight for the hovered/selected node: its edges become animated dashed blue lines
  // (`outward` = dash flow travels away from the node), its directly connected nodes stay
  // full-strength, and EVERYTHING else — nodes and edges — fades out.
  const activeId = hoverId ?? pinnedId;
  const connectedIds = activeId
    ? new Set([activeId, ...edges.flatMap((e) => (e.source === activeId ? [e.target] : e.target === activeId ? [e.source] : []))])
    : null;
  // Search highlight: matching nodes stay lit, the rest fades (hover/click wins visually,
  // but matches are always computed so the search focus works regardless of the mouse).
  const q = (searchTerm ?? '').trim().toLowerCase();
  const matchIds = q
    ? new Set(nodes.filter((n) => {
        const d = n.data as { label?: string; name?: string; id?: string };
        return `${d.label ?? ''} ${d.name ?? ''} ${d.id ?? ''}`.toLowerCase().includes(q);
      }).map((n) => n.id))
    : null;
  const renderEdges = activeId
    ? edges.map((e) =>
        e.source === activeId || e.target === activeId
          ? { ...e, data: { ...e.data, hl: true, outward: e.source === activeId } }
          : { ...e, data: { ...e.data, dim: true } },
      )
    : matchIds
      ? edges.map((e) => (matchIds.has(e.source) || matchIds.has(e.target) ? e : { ...e, data: { ...e.data, dim: true } }))
      : edges;
  const focusIds = connectedIds ?? matchIds;
  const renderNodes = focusIds
    ? nodes.map((n) => (focusIds.has(n.id) ? n : { ...n, style: { ...n.style, opacity: 0.18, transition: 'opacity 0.2s' } }))
    : nodes;

  // When the search finds nodes, centre the canvas on them and zoom in to a readable level
  // (debounced so the view doesn't jump on every keystroke).
  const matchKey = matchIds && matchIds.size ? [...matchIds].sort().join('|') : '';
  useEffect(() => {
    if (!matchKey) return;
    const t = setTimeout(() => {
      rf.fitView({ nodes: matchKey.split('|').map((id) => ({ id })), padding: 0.4, duration: 400, minZoom: 0.5, maxZoom: 1.15 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey]);

  const panBy = (dx: number, dy: number, duration = 150) => {
    const vp = rf.getViewport();
    rf.setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration });
  };

  // Canvas keyboard shortcuts (active once the canvas has focus): arrows pan, +/- zoom,
  // F fits & centers, Escape deselects.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 48;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      panBy(m[0], m[1], 0);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      rf.zoomIn({ duration: 150 });
    } else if (e.key === '-') {
      e.preventDefault();
      rf.zoomOut({ duration: 150 });
    } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      rf.fitView({ padding: 0.2, duration: 300 });
    } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowMap(!showMap);
    } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      // Reset layout: collapse everything, drop manual pins, back to the tidy default.
      e.preventDefault();
      expandedRef.current = new Set();
      manualPos.current = {};
      setPinnedId(null);
      const l = layoutAll();
      setNodes(l.nodes);
      setEdges(l.edges);
      setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 60);
    } else if (e.key === 'Escape') {
      setPinnedId(null);
    }
  };

  return (
    <div className="relative w-full h-full outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      {/* Dash-flow animations for highlighted connection lines */}
      <style>{`
        @keyframes rel-dash-fwd { to { stroke-dashoffset: -24; } }
        @keyframes rel-dash-rev { to { stroke-dashoffset: 24; } }
      `}</style>
      <ReactFlow
        nodes={renderNodes}
        edges={renderEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setPinnedId((p) => (p === node.id ? null : node.id));
          // In a zoomed-out overview, clicking a node zooms in on it (and its open group)
          // and centres it so the user can actually read it.
          const vp = rf.getViewport();
          if (vp.zoom < 0.75) {
            const t = treeRef.current.get(node.id);
            const kids = t && expandedRef.current.has(node.id) ? t.children.map((c) => ({ id: c.id })) : [];
            rf.fitView({ nodes: [{ id: node.id }, ...kids], padding: 0.35, duration: 500, minZoom: 0.85, maxZoom: 1.15 });
          }
        }}
        onNodeMouseEnter={(_, node) => setHoverId(node.id)}
        onNodeMouseLeave={() => setHoverId(null)}
        onPaneClick={() => setPinnedId(null)}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2.5}
        nodesDraggable
        nodeDragThreshold={5}
        nodesConnectable={false}
        elementsSelectable
        disableKeyboardA11y
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#DCE3EC" />
        <CanvasControls panBy={panBy} showMap={showMap} setShowMap={setShowMap} />
      </ReactFlow>
    </div>
  );
}

export function RelationshipGraph(props: RelationshipGraphProps) {
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner {...props} />
    </ReactFlowProvider>
  );
}
