"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Circle, Pause, Play, Square, Trash2, X, SkipBack } from "lucide-react";
import { useLab } from "@/store/labStore";
import { KIND_STYLE, mmss } from "./Timeline";

export function RecordingPanel() {
  const s = useLab();
  const [playing, setPlaying] = useState(false);
  const idx = s.replayIndex;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const st = useLab.getState();
      const next = (st.replayIndex ?? -1) + 1;
      if (next >= st.recording.length) {
        setPlaying(false);
        return;
      }
      st.setReplayIndex(next);
    }, 900);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-64 shrink-0 flex-col gap-2 border-r border-slate-100 p-3">
        <div className="section-title">Session recording</div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className={`h-2.5 w-2.5 rounded-full ${s.recStatus === "recording" ? "animate-pulse bg-red-500" : s.recStatus === "paused" ? "bg-amber-500" : "bg-slate-300"}`} />
          <span className="font-medium capitalize">{s.recStatus === "idle" ? "Not recording" : s.recStatus}</span>
          <span className="ml-auto text-slate-400">{s.recording.length} steps</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button className="btn btn-sm" onClick={s.startRecording} disabled={s.recStatus === "recording"} title="Start / resume">
            <Circle size={11} className="fill-red-500 text-red-500" /> {s.recStatus === "paused" ? "Resume" : "Start"}
          </button>
          <button className="btn btn-sm" onClick={s.pauseRecording} disabled={s.recStatus !== "recording"}>
            <Pause size={11} /> Pause
          </button>
          <button className="btn btn-sm" onClick={s.stopRecording} disabled={s.recStatus === "idle"}>
            <Square size={11} /> Stop
          </button>
        </div>
        <p className="text-[11px] leading-snug text-slate-500">Captures every action, measurement, equipment change, chemical addition and observation with timestamps. Replay steps through the exact workspace state.</p>
        <div className="mt-auto space-y-1.5 border-t border-slate-100 pt-2">
          <div className="section-title">Replay</div>
          <div className="flex items-center gap-1">
            <button className="icon-btn" disabled={!s.recording.length} onClick={() => s.setReplayIndex(0)} title="First step">
              <SkipBack size={14} />
            </button>
            <button className="icon-btn" disabled={!s.recording.length || (idx ?? 0) <= 0} onClick={() => s.setReplayIndex(Math.max(0, (idx ?? 1) - 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="icon-btn" disabled={!s.recording.length} onClick={() => { if (idx == null) s.setReplayIndex(0); setPlaying(!playing); }}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button className="icon-btn" disabled={!s.recording.length || (idx ?? -1) >= s.recording.length - 1} onClick={() => s.setReplayIndex(Math.min(s.recording.length - 1, (idx ?? -1) + 1))}>
              <ChevronRight size={16} />
            </button>
            {idx != null && (
              <button className="btn btn-sm ml-auto" onClick={() => { setPlaying(false); s.setReplayIndex(null); }}>
                <X size={12} /> Exit
              </button>
            )}
          </div>
          {s.recording.length > 0 && <input type="range" className="w-full" min={0} max={s.recording.length - 1} value={idx ?? 0} onChange={(e) => s.setReplayIndex(Number(e.target.value))} />}
          <button className="btn btn-ghost btn-sm w-full text-red-600" disabled={!s.recording.length} onClick={() => { setPlaying(false); s.clearRecording(); }}>
            <Trash2 size={12} /> Discard recording
          </button>
        </div>
      </div>
      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-2">
        {s.recording.length === 0 && <div className="py-10 text-center text-xs text-slate-400">No recording yet. Press Start, run your experiment, then Stop to replay it step by step.</div>}
        {s.recording.map((f, i) => {
          const K = KIND_STYLE[f.kind];
          return (
            <button key={f.id} onClick={() => s.setReplayIndex(i)} className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[12px] ${idx === i ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-slate-50"}`}>
              <span className="w-6 shrink-0 text-right font-mono text-[10px] text-slate-400">{i + 1}</span>
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${K.cls}`}>
                <K.icon size={9} />
              </span>
              <span className="w-11 shrink-0 font-mono text-[11px] text-slate-400">{mmss(f.t)}</span>
              <span className="flex-1 text-slate-700">{f.label}</span>
              <span className="shrink-0 text-[10px] text-slate-400">{f.components.length} items · {f.readings.length} readings</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
