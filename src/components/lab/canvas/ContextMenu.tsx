"use client";
import { useState } from "react";
import { ArrowRightLeft, ChevronRight, ClipboardPaste, Copy, CopyPlus, FlaskConical, Group, Lock, Maximize, MousePointer2, NotebookPen, RotateCcw, RotateCw, Settings2, Trash2, Unlock, Ungroup, Zap, BringToFront, Droplets } from "lucide-react";
import { useLab } from "@/store/labStore";
import { getDefinition } from "@/lib/engine/registry";
import { canvasApi } from "@/lib/canvasRegistry";
import type { Vec2 } from "@/lib/engine/types";

export interface MenuState {
  x: number;
  y: number;
  componentId: string | null;
  world: Vec2;
}

function Item({ icon: Icon, label, onClick, danger, shortcut, disabled }: { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean; shortcut?: string; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick} className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] disabled:opacity-40 ${danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"}`}>
      <Icon size={14} className="shrink-0 opacity-70" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-slate-400">{shortcut}</span>}
    </button>
  );
}

export function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const s = useLab();
  const [pourOpen, setPourOpen] = useState(false);
  const c = menu.componentId ? s.components.find((x) => x.id === menu.componentId) : null;
  const def = c ? getDefinition(c.type) : null;
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const isContainer = def?.roles.includes("container");
  const targets = c ? s.components.filter((x) => x.id !== c.id && getDefinition(x.type)?.roles.includes("container")) : [];

  return (
    <div className="panel absolute z-40 w-56 p-1 shadow-float" style={{ left: Math.min(menu.x, 10000), top: menu.y }} onMouseDown={(e) => e.stopPropagation()}>
      {c ? (
        <>
          <div className="truncate px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.name}</div>
          <Item icon={Settings2} label="Properties" onClick={act(() => s.select([c.id]))} />
          <Item icon={CopyPlus} label="Duplicate" shortcut="Ctrl+D" onClick={act(s.duplicateSelection)} />
          <Item icon={Copy} label="Copy" shortcut="Ctrl+C" onClick={act(s.copySelection)} />
          <Item icon={RotateCw} label="Rotate 90°" shortcut="R" onClick={act(() => s.rotateSelection(90))} />
          <Item icon={RotateCcw} label="Rotate −90°" onClick={act(() => s.rotateSelection(-90))} />
          <Item icon={BringToFront} label="Bring to front" onClick={act(() => s.bringToFront(c.id))} />
          <Item icon={c.locked ? Unlock : Lock} label={c.locked ? "Unlock" : "Lock"} shortcut="Ctrl+L" onClick={act(s.toggleLockSelection)} />
          {s.selection.length > 1 && <Item icon={Group} label="Group" shortcut="Ctrl+G" onClick={act(s.groupSelection)} />}
          {c.groupId && <Item icon={Ungroup} label="Ungroup" onClick={act(s.ungroupSelection)} />}
          {isContainer && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <Item icon={FlaskConical} label="Add chemical…" onClick={act(() => s.openChemPicker(c.id))} />
              <div className="relative" onMouseEnter={() => setPourOpen(true)} onMouseLeave={() => setPourOpen(false)}>
                <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-100">
                  <ArrowRightLeft size={14} className="opacity-70" />
                  <span className="flex-1">Pour into</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
                {pourOpen && (
                  <div className="panel absolute left-full top-0 ml-1 max-h-64 w-52 overflow-auto p-1 shadow-float">
                    {targets.length === 0 && <div className="px-2.5 py-2 text-xs text-slate-400">No other containers</div>}
                    {targets.map((t) => (
                      <button key={t.id} className="w-full truncate rounded px-2.5 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-100" onClick={act(() => s.pour(c.id, t.id))}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Item icon={Droplets} label="Empty container" onClick={act(() => s.emptyContainer(c.id))} />
            </>
          )}
          {def?.actions?.filter((a) => a.id !== "empty").length ? <div className="my-1 border-t border-slate-100" /> : null}
          {def?.actions
            ?.filter((a) => a.id !== "empty")
            .map((a) => (
              <Item key={a.id} icon={Zap} label={a.label} onClick={act(() => s.runComponentAction(c.id, a.id))} />
            ))}
          <div className="my-1 border-t border-slate-100" />
          <Item icon={Trash2} label="Delete" shortcut="Del" danger disabled={c.locked} onClick={act(s.deleteSelection)} />
        </>
      ) : (
        <>
          <Item icon={ClipboardPaste} label="Paste here" shortcut="Ctrl+V" disabled={!s.clipboard?.length} onClick={act(() => s.paste(menu.world))} />
          <Item icon={MousePointer2} label="Select all" shortcut="Ctrl+A" onClick={act(s.selectAll)} />
          <Item icon={NotebookPen} label="Add observation" onClick={act(() => s.setBottomTab("timeline"))} />
          <Item icon={Maximize} label="Fit to screen" shortcut="F" onClick={act(() => canvasApi()?.fit())} />
          <Item icon={Settings2} label={s.settings.showGrid ? "Hide grid" : "Show grid"} onClick={act(() => s.setSettings({ showGrid: !s.settings.showGrid }))} />
        </>
      )}
    </div>
  );
}
