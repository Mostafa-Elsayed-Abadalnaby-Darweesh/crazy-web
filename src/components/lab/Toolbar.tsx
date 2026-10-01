"use client";
import {
  Cable,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Grid3x3,
  Group,
  Hand,
  Lock,
  Magnet,
  Maximize,
  MousePointer2,
  Redo2,
  RotateCw,
  Ruler,
  Tags,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  FlaskConical,
  Atom,
  Circle,
  Pause,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSettings } from "@/store/settingsStore";
import { useLab } from "@/store/labStore";
import { canvasApi } from "@/lib/canvasRegistry";

function TB({ icon: Icon, label, onClick, active, disabled, shortcut }: { icon: typeof Copy; label: string; onClick: () => void; active?: boolean; disabled?: boolean; shortcut?: string }) {
  return (
    <button className={`icon-btn h-8 w-8 ${active ? "icon-btn-active" : ""}`} onClick={onClick} disabled={disabled} title={shortcut ? `${label} (${shortcut})` : label} aria-label={label}>
      <Icon size={16} />
    </button>
  );
}

const Sep = () => <div className="mx-1 h-5 w-px bg-slate-200" />;

export function Toolbar() {
  const s = useLab();
  const hasSel = s.selection.length > 0 || !!s.selectedWireId;
  const soundOn = useSettings((st) => st.preferences.sound !== false);
  const setPreferences = useSettings((st) => st.setPreferences);
  const zoom = (f: number) => {
    const c = canvasApi()?.center();
    const scale = Math.max(0.15, Math.min(4, s.viewport.scale * f));
    if (!c) return s.setViewport({ scale });
    // keep the centre fixed
    const sx = c.x * s.viewport.scale + s.viewport.x;
    const sy = c.y * s.viewport.scale + s.viewport.y;
    s.setViewport({ scale, x: sx - c.x * scale, y: sy - c.y * scale });
  };
  return (
    <div className="no-print flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-slate-200 bg-white px-2">
      <div className="mr-1 flex rounded-md bg-slate-100 p-0.5">
        <button onClick={() => s.setMode("chemistry")} className={`flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium ${s.mode === "chemistry" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>
          <FlaskConical size={13} /> Chemistry Lab
        </button>
        <button onClick={() => s.setMode("physics")} className={`flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium ${s.mode === "physics" ? "bg-white text-secondary-600 shadow-sm" : "text-slate-500"}`}>
          <Atom size={13} /> Physics Lab
        </button>
      </div>
      <Sep />
      <TB icon={MousePointer2} label="Select" shortcut="V" active={s.tool === "select"} onClick={() => s.setTool("select")} />
      <TB icon={Cable} label="Wire tool — drag between terminals" shortcut="W" active={s.tool === "wire"} onClick={() => s.setTool(s.tool === "wire" ? "select" : "wire")} />
      <TB icon={Hand} label="Pan" shortcut="H / Space" active={s.tool === "pan"} onClick={() => s.setTool(s.tool === "pan" ? "select" : "pan")} />
      <Sep />
      <TB icon={Undo2} label="Undo" shortcut="Ctrl+Z" disabled={!s.past.length} onClick={s.undo} />
      <TB icon={Redo2} label="Redo" shortcut="Ctrl+Y" disabled={!s.future.length} onClick={s.redo} />
      <Sep />
      <TB icon={Copy} label="Copy" shortcut="Ctrl+C" disabled={!s.selection.length} onClick={s.copySelection} />
      <TB icon={ClipboardPaste} label="Paste" shortcut="Ctrl+V" disabled={!s.clipboard?.length} onClick={() => s.paste()} />
      <TB icon={CopyPlus} label="Duplicate" shortcut="Ctrl+D" disabled={!s.selection.length} onClick={s.duplicateSelection} />
      <TB icon={Trash2} label="Delete" shortcut="Del" disabled={!hasSel} onClick={s.deleteSelection} />
      <Sep />
      <TB icon={RotateCw} label="Rotate 90°" shortcut="R" disabled={!s.selection.length} onClick={() => s.rotateSelection(90)} />
      <TB icon={Group} label="Group" shortcut="Ctrl+G" disabled={s.selection.length < 2} onClick={s.groupSelection} />
      <TB icon={Lock} label="Lock / unlock" shortcut="Ctrl+L" disabled={!s.selection.length} onClick={s.toggleLockSelection} />
      <Sep />
      <TB icon={ZoomOut} label="Zoom out" shortcut="−" onClick={() => zoom(1 / 1.2)} />
      <button className="w-12 rounded px-1 py-1 text-center font-mono text-[11px] text-slate-600 hover:bg-slate-100" title="Reset zoom (0)" onClick={() => s.setViewport({ scale: 1 })}>
        {Math.round(s.viewport.scale * 100)}%
      </button>
      <TB icon={ZoomIn} label="Zoom in" shortcut="+" onClick={() => zoom(1.2)} />
      <TB icon={Maximize} label="Fit to screen" shortcut="F" onClick={() => canvasApi()?.fit()} />
      <Sep />
      <TB icon={Grid3x3} label="Grid" active={s.settings.showGrid} onClick={() => s.setSettings({ showGrid: !s.settings.showGrid })} />
      <TB icon={Magnet} label="Snap to grid" active={s.settings.snapToGrid} onClick={() => s.setSettings({ snapToGrid: !s.settings.snapToGrid })} />
      <TB icon={Ruler} label="Rulers" active={s.settings.showRulers} onClick={() => s.setSettings({ showRulers: !s.settings.showRulers })} />
      <TB icon={Tags} label="Labels" active={s.settings.showLabels} onClick={() => s.setSettings({ showLabels: !s.settings.showLabels })} />
      <TB icon={soundOn ? Volume2 : VolumeX} label={soundOn ? "Mute lab sounds" : "Unmute lab sounds"} active={soundOn} onClick={() => setPreferences({ sound: !soundOn })} />
      <div className="ml-auto flex items-center gap-2 pl-2">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5">
          {s.recStatus === "recording" ? (
            <button className="flex items-center gap-1 px-1 text-[11.5px] font-medium text-red-600" onClick={s.pauseRecording} title="Pause recording">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> REC <Pause size={12} />
            </button>
          ) : (
            <button className="flex items-center gap-1 px-1 text-[11.5px] font-medium text-slate-600 hover:text-red-600" onClick={s.startRecording} title="Start recording">
              <Circle size={11} className="fill-red-500 text-red-500" /> {s.recStatus === "paused" ? "Resume" : "Record"}
            </button>
          )}
          {s.recStatus !== "idle" && (
            <button className="icon-btn h-6 w-6" onClick={s.stopRecording} title="Stop recording">
              <Square size={11} />
            </button>
          )}
        </div>
        <label className="flex items-center gap-1 text-[11px] text-slate-500" title="Simulation speed">
          Speed
          <select className="rounded border border-slate-200 px-1 py-0.5 text-[11px]" value={s.speed} onChange={(e) => s.setSpeed(Number(e.target.value))}>
            {[0.25, 0.5, 1, 2, 5, 10].map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 font-mono text-[11.5px] text-teal-300" title="Simulation clock">
          <span className={`h-1.5 w-1.5 rounded-full ${s.simStatus === "running" ? "animate-pulse bg-emerald-400" : s.simStatus === "paused" ? "bg-amber-400" : "bg-slate-500"}`} />
          t = {s.simTime.toFixed(1)} s
        </div>
      </div>
    </div>
  );
}
