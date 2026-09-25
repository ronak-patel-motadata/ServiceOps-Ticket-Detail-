import { useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Diamond, Search, Waypoints, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanItem } from './ProjectPlanningTab';

/* ── Plan dependencies ───────────────────────────────────────────────────────
   Two pieces for the Planning tab:
   1. DepPickerPanel — right-side popup: pick tasks this one depends on
      (predecessors) or that depend on it (successors).
   2. DepGraphModal — center popup: the dependency neighbourhood as a React
      Flow graph (Superseded-map recipe: card nodes, smoothstep arrows). */

/* ── 1. The picker ── */
export function DepPickerPanel({
  task,
  dir,
  candidates,
  existing,
  onClose,
  onApply,
}: {
  task: PlanItem;
  dir: 'pred' | 'succ';
  candidates: PlanItem[];
  existing: Set<string>;
  onClose: () => void;
  /** Apply the edit: newly ticked ids to link, unticked linked ids to remove. */
  onApply: (addIds: string[], removeIds: string[]) => void;
}) {
  const [q, setQ] = useState('');
  // Linked rows start CHECKED — unticking one removes that dependency on Apply.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(existing));
  const label = dir === 'pred' ? 'Predecessors' : 'Successors';
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return candidates.filter((c) => !s || c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s));
  }, [candidates, q]);

  const adds = [...checked].filter((id) => !existing.has(id));
  const removes = [...existing].filter((id) => !checked.has(id));
  const submit = () => {
    if (!adds.length && !removes.length) return;
    onApply(adds, removes);
    const word = dir === 'pred' ? 'predecessor' : 'successor';
    if (adds.length && removes.length) toast.success(`${task.id}: ${adds.length} ${word}${adds.length > 1 ? 's' : ''} added, ${removes.length} removed`);
    else if (adds.length) toast.success(`${adds.length} ${word}${adds.length > 1 ? 's' : ''} linked to ${task.id}`);
    else toast.success(`${removes.length} ${word}${removes.length > 1 ? 's' : ''} removed from ${task.id}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10001] flex h-full w-[620px] max-w-[94vw] flex-col bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[#111827]">Add Dependency — {label}</h2>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-[#7B8FA5]">
              <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{task.id}</span>
              <span className="truncate">{task.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-shrink-0 border-b border-[#F1F5F9] px-5 py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded border border-[#DFE5ED] bg-white py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 py-10">
              <div className="text-center">
                <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
                  <Search className="size-7 text-[#7B8FA5]" />
                </div>
                <p className="text-[13px] text-[#7B8FA5]">No matching tasks.</p>
              </div>
            </div>
          ) : (
            rows.map((c) => {
              const linked = existing.has(c.id);
              const isChecked = checked.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded px-3 py-2 transition-colors ${
                    isChecked ? 'bg-[#F5FAFF]' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setChecked((prev) => {
                        const n = new Set(prev);
                        n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                        return n;
                      })
                    }
                    className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                  />
                  {c.kind === 'milestone' ? (
                    <Diamond size={11} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
                  ) : (
                    <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: c.color ?? '#3D8BD0' }} />
                  )}
                  <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{c.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{c.name}</span>
                  {linked && (
                    <span className="flex-shrink-0 rounded-sm bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">Linked</span>
                  )}
                </label>
              );
            })
          )}
        </div>
        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5 py-3.5">
          <span className={`text-[12px] ${adds.length || removes.length ? 'font-medium text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>
            {adds.length || removes.length
              ? [adds.length ? `${adds.length} to add` : '', removes.length ? `${removes.length} to remove` : ''].filter(Boolean).join(' · ')
              : 'No changes yet'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!adds.length && !removes.length}
              className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removes.length ? 'Update' : `Add${adds.length ? ` (${adds.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 2. The graph ── */
type DepNodeData = { rid: string; name: string; center: boolean; kind: PlanItem['kind'] };

function DepNode({ data }: NodeProps) {
  const d = data as DepNodeData;
  return (
    <div
      className={`w-[220px] rounded-lg border bg-white px-3 py-2.5 shadow-sm ${
        d.center ? 'border-[#3D8BD0] shadow-[0_0_0_3px_rgba(61,139,208,0.14)]' : 'border-[#DFE5ED]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-transparent" />
      <div className="flex items-center gap-1.5">
        {d.kind === 'milestone' && <Diamond size={11} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />}
        <span className="whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">{d.rid}</span>
      </div>
      <div className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-snug text-[#364658]">{d.name}</div>
    </div>
  );
}
const depNodeTypes = { dep: DepNode };

export function DepGraphModal({
  task,
  preds,
  succs,
  onClose,
}: {
  task: PlanItem;
  preds: PlanItem[];
  succs: PlanItem[];
  onClose: () => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const ROW = 96;
    const colY = (n: number, i: number) => (i - (n - 1) / 2) * ROW;
    const mk = (it: PlanItem, x: number, y: number, center = false): Node => ({
      id: it.id,
      type: 'dep',
      position: { x, y },
      draggable: false,
      selectable: false,
      data: { rid: it.id, name: it.name, center, kind: it.kind } satisfies DepNodeData,
    });
    const nodes: Node[] = [
      ...preds.map((p, i) => mk(p, 0, colY(preds.length, i))),
      mk(task, 360, 0, true),
      ...succs.map((p, i) => mk(p, 720, colY(succs.length, i))),
    ];
    const edges: Edge[] = [
      ...preds.map((p) => ({
        id: `e-${p.id}-${task.id}`,
        source: p.id,
        target: task.id,
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 16, height: 16 },
      })),
      ...succs.map((p) => ({
        id: `e-${task.id}-${p.id}`,
        source: task.id,
        target: p.id,
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 16, height: 16 },
      })),
    ];
    return { nodes, edges };
  }, [task, preds, succs]);

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[10001] flex h-[540px] max-h-[90vh] w-[920px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#E5E7EB] px-5 py-3.5">
          <Waypoints size={16} className="flex-shrink-0 text-[#3D8BD0]" />
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Dependencies</h2>
          <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{task.id}</span>
          <span className="min-w-0 truncate text-[13px] text-[#64748B]">{task.name}</span>
          <button
            onClick={onClose}
            className="ml-auto flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={depNodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
              style={{ background: '#FAFBFC' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#E2E8F0" />
            </ReactFlow>
          </ReactFlowProvider>
          {/* Direction legend — arrows tell the story; one quiet line each side. */}
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-4 rounded border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] text-[#64748B] shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-[#94A3B8]">→</span>
              Predecessors flow in · Successors flow out
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
