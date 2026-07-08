import { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  useInternalNode,
  getStraightPath,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Monitor, Keyboard, Maximize, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
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
  const d = data as { name: string; id?: string };
  return (
    <div className="relative">
      <div className="flex items-center justify-center size-14 rounded-2xl bg-[#3D8BD0] text-white shadow-md ring-4 ring-[#3D8BD0]/15">
        <Monitor size={22} />
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[150px] text-center pointer-events-none">
        <div className="text-[12px] font-semibold text-[#364658] truncate">{d.name}</div>
        {d.id ? <div className="text-[10px] text-[#7B8FA5] truncate">{d.id}</div> : null}
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
  return (
    <div className="relative group cursor-pointer">
      <div className="flex items-center justify-center size-14 rounded-full bg-white border-2 shadow-sm [&_svg]:size-5" style={{ borderColor: d.color, color: d.color }}>
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
  const d = data as { hl?: boolean; outward?: boolean } | undefined;
  const st = d?.hl
    ? {
        stroke: '#3D8BD0',
        strokeWidth: 2,
        strokeDasharray: '7 5',
        animation: `${d.outward ? 'rel-dash-fwd' : 'rel-dash-rev'} 0.5s linear infinite`,
      }
    : { stroke: '#CBD5E1', strokeWidth: 1.5 };
  return <BaseEdge id={id} path={path} style={{ ...st, ...style }} />;
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
  const count = depth === 1 ? 2 + (h % 3) : depth === 2 ? h % 3 : 0; // 2-4, then 0-2, then leaf
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

function CanvasControls({ panBy }: { panBy: (dx: number, dy: number) => void }) {
  const rf = useReactFlow();
  const btn = 'inline-flex items-center justify-center size-7 text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  const padBtn = 'inline-flex items-center justify-center size-7 rounded-md border border-[#E5E7EB] bg-white shadow-sm text-[#6B7280] hover:bg-[#F5F7FA] transition-colors';
  return (
    <>
      {/* Top-right: keyboard shortcuts · fit & center · zoom in/out */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild><button className={btn}><Keyboard size={14} /></button></TooltipTrigger>
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
    </>
  );
}

/* ------------------------------ Inner (uses hooks) ------------------------------ */

function RelationshipGraphInner({ mode, nodes: data, typeMeta, centerName, centerId, refreshSignal }: RelationshipGraphProps) {
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
        edgesOut.push({ id: `e-${t.id}`, source: parentId, target: t.id, type: 'floating' });
        return x;
      };
      tree.forEach((t) => place(t, 1, 'center'));
    } else {
      // Radial: each subtree owns an angular wedge proportional to its visible size.
      // Expanded subtrees get EXTRA angular weight at every nesting level, and expanded
      // sub-groups get larger sector padding — so a group expanded inside another group
      // still reads as its own separate cluster instead of merging into the parent's.
      const R1 = 215, RSTEP = 175;
      const weight = (t: TreeNode): number => {
        const ch = visChildren(t);
        return ch.length ? ch.reduce((s, c) => s + weight(c), 0) + 0.8 : 1;
      };
      const place = (t: TreeNode, depth: number, a0: number, a1: number, parentId: string) => {
        const mid = (a0 + a1) / 2;
        const r = R1 + (depth - 1) * RSTEP;
        nodesOut.push(makeNode(t, r * Math.cos(mid), r * Math.sin(mid), expanded.has(t.id)));
        edgesOut.push({ id: `e-${t.id}`, source: parentId, target: t.id, type: 'floating' });
        const ch = visChildren(t);
        if (ch.length) {
          const tot = ch.reduce((s, c) => s + weight(c), 0);
          let a = a0;
          ch.forEach((c) => {
            const span = (a1 - a0) * (weight(c) / tot);
            // A child that is itself expanded gets more padding → clear gap around its group.
            const pad = span * (visChildren(c).length ? 0.16 : 0.07);
            place(c, depth + 1, a + pad, a + span - pad, t.id);
            a += span;
          });
        }
      };
      const totalW = tree.reduce((s, t) => s + weight(t), 0) || 1;
      let a = -Math.PI / 2;
      tree.forEach((t) => {
        const span = (2 * Math.PI * weight(t)) / totalW;
        // Generous padding at the first level = breathing room between expanded groups.
        const pad = span * 0.14;
        place(t, 1, a + pad, a + span - pad, 'center');
        a += span;
      });
    }

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
  const dragState = useRef<{ id: string; last: { x: number; y: number }; descendants: Set<string> } | null>(null);
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
    dragState.current = { id: node.id, last: { ...node.position }, descendants: visibleDescendants(node.id) };
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
    manualPos.current[node.id] = { ...node.position };
    const st = dragState.current;
    if (st && st.id === node.id && st.descendants.size) {
      const all = rf.getNodes();
      st.descendants.forEach((did) => {
        const dn = all.find((n) => n.id === did);
        if (dn) manualPos.current[did] = { ...dn.position };
      });
    }
    dragState.current = null;
  };

  // Click a node with a count badge to reveal (or hide) its connected nodes.
  const toggleExpand = (id: string) => {
    const t = treeRef.current.get(id);
    if (!t || t.children.length === 0) return;
    const ex = expandedRef.current;
    if (ex.has(id)) {
      // Collapse this node and everything beneath it.
      const rm = (tid: string) => { ex.delete(tid); treeRef.current.get(tid)?.children.forEach((c) => rm(c.id)); };
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

  // Edges connected to the hovered/selected node become animated dashed blue lines;
  // `outward` makes the dash flow travel away from that node along the connection.
  const activeId = hoverId ?? pinnedId;
  const renderEdges = activeId
    ? edges.map((e) =>
        e.source === activeId || e.target === activeId
          ? { ...e, data: { ...e.data, hl: true, outward: e.source === activeId } }
          : e,
      )
    : edges;

  const panBy = (dx: number, dy: number, duration = 150) => {
    const vp = rf.getViewport();
    rf.setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration });
  };

  // Keyboard arrows pan the canvas (nodes shift in that direction). Works once the
  // canvas has focus (click it, or it auto-focuses on mount).
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
        nodes={nodes}
        edges={renderEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setPinnedId((p) => (p === node.id ? null : node.id))}
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
        nodesConnectable={false}
        elementsSelectable
        disableKeyboardA11y
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#DCE3EC" />
        <CanvasControls panBy={panBy} />
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
