"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Shape, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Lock } from "lucide-react";
import { useLab, componentsInRect } from "@/store/labStore";
import { getDefinition } from "@/lib/engine/registry";
import { localPoint, boundsOf } from "@/lib/engine/geometry";
import type { LabComponent, Reading, Vec2, Wire, WireEnd } from "@/lib/engine/types";
import { registerCanvasApi, registerStage } from "@/lib/canvasRegistry";
import { Background } from "./Background";
import { renderComponent } from "./renderers";
import { FONT } from "./renderers/common";
import { ContextMenu, type MenuState } from "./ContextMenu";
import { Rulers } from "./Rulers";
import { EffectsLayer } from "./EffectsLayer";

const WIRE_COLORS = ["#dc2626", "#1f2937", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

function terminalWorld(c: LabComponent, t: { x: number; y: number }): Vec2 {
  return localPoint(c, t.x, t.y);
}

export default function LabCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [space, setSpace] = useState(false);
  const [clock, setClock] = useState(0);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [wireDrag, setWireDrag] = useState<{ from: WireEnd; start: Vec2; pos: Vec2; target: WireEnd | null } | null>(null);
  const [hoverTerminal, setHoverTerminal] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pointer, setPointer] = useState<Vec2 | null>(null);
  const dragStart = useRef<Map<string, Vec2>>(new Map());

  const s = useLab();
  const {
    components: liveComponents,
    wires: liveWires,
    viewport,
    settings,
    selection,
    selectedWireId,
    tool,
    mode,
    liveReadings,
    circuit,
    optics,
    simStatus,
    replayIndex,
    recording,
    dropHighlight,
    effects,
  } = s;

  const frame = replayIndex != null ? recording[replayIndex] : null;
  const components = frame ? frame.components : liveComponents;
  const wires = frame ? frame.wires : liveWires;
  const readOnly = frame != null;

  /* ---------- sizing ---------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* ---------- canvas API for drag & drop / snapshots ---------- */
  const fit = useCallback(() => {
    const comps = useLab.getState().components;
    const el = containerRef.current;
    if (!el) return;
    if (!comps.length) {
      useLab.getState().setViewport({ x: 40, y: 20, scale: 1 });
      return;
    }
    const bs = comps.map(boundsOf);
    const x1 = Math.min(...bs.map((b) => b.x1)) - 80;
    const y1 = Math.min(...bs.map((b) => b.y1)) - 80;
    const x2 = Math.max(...bs.map((b) => b.x2)) + 80;
    const y2 = Math.max(...bs.map((b) => b.y2)) + 80;
    const scale = Math.max(0.2, Math.min(2, Math.min(el.clientWidth / (x2 - x1), el.clientHeight / (y2 - y1))));
    useLab.getState().setViewport({ scale, x: -x1 * scale + (el.clientWidth - (x2 - x1) * scale) / 2, y: -y1 * scale + (el.clientHeight - (y2 - y1) * scale) / 2 });
  }, []);

  useEffect(() => {
    registerStage(stageRef.current);
    registerCanvasApi({
      toWorld: (cx, cy) => {
        const el = containerRef.current;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const v = useLab.getState().viewport;
        return { x: (cx - r.left - v.x) / v.scale, y: (cy - r.top - v.y) / v.scale };
      },
      isInside: (cx, cy) => {
        const r = containerRef.current?.getBoundingClientRect();
        return !!r && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      },
      center: () => {
        const v = useLab.getState().viewport;
        const el = containerRef.current;
        return { x: ((el?.clientWidth ?? 800) / 2 - v.x) / v.scale, y: ((el?.clientHeight ?? 600) / 2 - v.y) / v.scale };
      },
      fit,
    });
    return () => {
      registerStage(null);
      registerCanvasApi(null);
    };
  }, [fit]);

  const fitRequest = useLab((st) => st.fitRequest);
  useEffect(() => {
    if (fitRequest > 0 && size.width > 100) fit();
  }, [fitRequest, fit, size.width > 100]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- space-to-pan ---------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpace(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ---------- cosmetic animation clock ---------- */
  const animated = useMemo(
    () =>
      simStatus === "running" ||
      components.some((c) => c.properties.lit === true || c.properties.stir === true || (c.type === "magnetic-stirrer" && c.properties.on === true) || c.state.gasRate || c.state.boiling || (c.type === "water-bath" && c.properties.on) || (c.type === "burette" && c.properties.open)) ||
      Object.values(circuit.elements).some((e) => Math.abs(e.current) > 1e-4) ||
      components.some((c) => c.type === "gas-chamber" || c.state.onFire || c.state.burning || (c.type === "splint" && c.properties.condition !== "out") || (c.state.mixture && c.state.mixture.temperature > 55)) ||
      effects.some((e) => Date.now() - e.at < 3500),
    [components, simStatus, circuit, effects],
  );
  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setClock(performance.now() / 1000), 70);
    return () => clearInterval(id);
  }, [animated]);

  /* ---------- transformer ---------- */
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = readOnly
      ? []
      : selection
          .map((id) => stage.findOne<Konva.Node>(`#${CSS.escape(id)}`))
          .filter((n): n is Konva.Node => !!n && !components.find((c) => c.id === n.id())?.locked);
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selection, components, readOnly]);

  const readingsById = useMemo(() => {
    const m = new Map<string, Reading[]>();
    for (const r of liveReadings) {
      if (!m.has(r.componentId)) m.set(r.componentId, []);
      m.get(r.componentId)!.push(r.reading);
    }
    return m;
  }, [liveReadings]);

  const stageDraggable = !readOnly && (space || tool === "pan");

  const toWorld = (p: Vec2): Vec2 => ({ x: (p.x - viewport.x) / viewport.scale, y: (p.y - viewport.y) / viewport.scale });
  const pointerWorld = () => {
    const p = stageRef.current?.getPointerPosition();
    return p ? toWorld(p) : null;
  };

  /* ---------- terminals ---------- */
  const terminals = useMemo(() => {
    const out: { key: string; end: WireEnd; pos: Vec2; label?: string; comp: LabComponent }[] = [];
    for (const c of components) {
      const def = getDefinition(c.type);
      for (const t of def?.terminals ?? []) out.push({ key: `${c.id}:${t.id}`, end: { componentId: c.id, terminal: t.id }, pos: terminalWorld(c, t), label: t.label, comp: c });
    }
    return out;
  }, [components]);

  const nearestTerminal = (p: Vec2, exclude?: string) => {
    let best: (typeof terminals)[number] | null = null;
    let bd = 22 / viewport.scale;
    for (const t of terminals) {
      if (t.key === exclude) continue;
      const d = Math.hypot(t.pos.x - p.x, t.pos.y - p.y);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  };

  /* ---------- stage events ---------- */
  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    if (e.evt.ctrlKey || e.evt.metaKey || !e.evt.shiftKey) {
      const old = viewport.scale;
      const factor = Math.exp(-e.evt.deltaY * 0.0015);
      const scale = Math.max(0.15, Math.min(4, old * factor));
      const wx = (p.x - viewport.x) / old;
      const wy = (p.y - viewport.y) / old;
      s.setViewport({ scale, x: p.x - wx * scale, y: p.y - wy * scale });
    } else {
      s.setViewport({ x: viewport.x - e.evt.deltaY, y: viewport.y - e.evt.deltaX });
    }
  };

  const isBackground = (e: KonvaEventObject<MouseEvent>) => e.target === e.target.getStage() || (e.target as Konva.Node).name() === "bg";

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    setMenu(null);
    if (readOnly || stageDraggable || e.evt.button !== 0) return;
    if (!isBackground(e)) return;
    const p = pointerWorld();
    if (!p) return;
    if (!e.evt.shiftKey) s.clearSelection();
    setMarquee({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onStageMouseMove = () => {
    const p = pointerWorld();
    setPointer(p);
    if (!p) return;
    if (marquee) setMarquee({ ...marquee, x2: p.x, y2: p.y });
    if (wireDrag) {
      const t = nearestTerminal(p, `${wireDrag.from.componentId}:${wireDrag.from.terminal}`);
      setWireDrag({ ...wireDrag, pos: t ? t.pos : p, target: t ? t.end : null });
    }
  };

  const onStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (marquee) {
      const r = { x1: Math.min(marquee.x1, marquee.x2), y1: Math.min(marquee.y1, marquee.y2), x2: Math.max(marquee.x1, marquee.x2), y2: Math.max(marquee.y1, marquee.y2) };
      if (r.x2 - r.x1 > 4 || r.y2 - r.y1 > 4) s.select(componentsInRect(components, r), e.evt.shiftKey);
      setMarquee(null);
    }
    if (wireDrag) {
      if (wireDrag.target) s.addWire(wireDrag.from, wireDrag.target);
      setWireDrag(null);
    }
  };

  /* ---------- component events ---------- */
  const selectComponent = (c: LabComponent, additive: boolean) => {
    const ids = c.groupId ? components.filter((x) => x.groupId === c.groupId).map((x) => x.id) : [c.id];
    if (additive) s.select(ids, true);
    else if (!selection.includes(c.id)) s.select(ids);
  };

  const snap = (v: number) => (settings.snapToGrid ? Math.round(v / settings.gridSize) * settings.gridSize : v);

  const onDragStart = (c: LabComponent, e: KonvaEventObject<DragEvent>) => {
    if (!selection.includes(c.id)) selectComponent(c, e.evt.shiftKey);
    const st = useLab.getState();
    const ids = new Set([...st.selection, c.id]);
    for (const x of components) if (x.groupId && c.groupId === x.groupId) ids.add(x.id);
    dragStart.current = new Map(components.filter((x) => ids.has(x.id) && !x.locked).map((x) => [x.id, { ...x.position }]));
    s.bringToFront(c.id);
  };

  const onDragMove = (c: LabComponent, e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const w = c.dimensions.width;
    const h = c.dimensions.height;
    let x = node.x() - w / 2;
    let y = node.y() - h / 2;
    x = snap(x);
    y = snap(y);
    // smart guides (centre / edge alignment with other components)
    const v: number[] = [];
    const hz: number[] = [];
    const cx = x + w / 2;
    const cy = y + h / 2;
    const bottom = y + h;
    for (const o of components) {
      if (dragStart.current.has(o.id)) continue;
      const ocx = o.position.x + o.dimensions.width / 2;
      const ocy = o.position.y + o.dimensions.height / 2;
      const ob = o.position.y + o.dimensions.height;
      if (Math.abs(ocx - cx) < 6) {
        x = ocx - w / 2;
        v.push(ocx);
      }
      if (Math.abs(ob - bottom) < 6) {
        y = ob - h;
        hz.push(ob);
      } else if (Math.abs(ocy - cy) < 6) {
        y = ocy - h / 2;
        hz.push(ocy);
      }
    }
    node.x(x + w / 2);
    node.y(y + h / 2);
    setGuides({ v, h: hz });
    const start = dragStart.current.get(c.id);
    if (!start) return;
    const dx = x - start.x;
    const dy = y - start.y;
    const stage = node.getStage();
    for (const [id, p] of dragStart.current) {
      if (id === c.id) continue;
      const other = components.find((o) => o.id === id);
      const n = stage?.findOne(`#${CSS.escape(id)}`);
      if (other && n) {
        n.x(p.x + dx + other.dimensions.width / 2);
        n.y(p.y + dy + other.dimensions.height / 2);
      }
    }
  };

  const onDragEnd = (c: LabComponent, e: KonvaEventObject<DragEvent>) => {
    setGuides({ v: [], h: [] });
    const start = dragStart.current.get(c.id);
    const node = e.target;
    const x = node.x() - c.dimensions.width / 2;
    const y = node.y() - c.dimensions.height / 2;
    if (!start) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    s.moveComponents([...dragStart.current].map(([id, p]) => ({ id, position: { x: Math.round(p.x + dx), y: Math.round(p.y + dy) } })));
    dragStart.current = new Map();
  };

  const onTransformEnd = () => {
    const tr = trRef.current;
    if (!tr) return;
    for (const node of tr.nodes()) {
      const c = components.find((x) => x.id === node.id());
      if (!c) continue;
      const w = Math.max(8, c.dimensions.width * node.scaleX());
      const h = Math.max(8, c.dimensions.height * node.scaleY());
      node.scaleX(1);
      node.scaleY(1);
      s.transformComponent(c.id, { position: { x: Math.round(node.x() - w / 2), y: Math.round(node.y() - h / 2) }, rotation: Math.round(node.rotation()), width: Math.round(w), height: Math.round(h) });
    }
  };

  const openMenu = (e: KonvaEventObject<PointerEvent | MouseEvent>, c?: LabComponent) => {
    e.evt.preventDefault();
    if (readOnly) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (c && !selection.includes(c.id)) selectComponent(c, false);
    setMenu({ x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top, componentId: c?.id ?? null, world: pointerWorld() ?? { x: 0, y: 0 } });
  };

  /* ---------- wires ---------- */
  const wirePath = (a: Vec2, b: Vec2) => {
    const sag = Math.min(90, 25 + Math.hypot(b.x - a.x, b.y - a.y) * 0.18);
    return { a, b, c1: { x: a.x, y: a.y + sag }, c2: { x: b.x, y: b.y + sag } };
  };

  const renderWire = (w: Wire, i: number) => {
    const a = components.find((c) => c.id === w.from.componentId);
    const b = components.find((c) => c.id === w.to.componentId);
    const ta = a && getDefinition(a.type)?.terminals?.find((t) => t.id === w.from.terminal);
    const tb = b && getDefinition(b.type)?.terminals?.find((t) => t.id === w.to.terminal);
    if (!a || !b || !ta || !tb) return null;
    const p = wirePath(terminalWorld(a, ta), terminalWorld(b, tb));
    const current = Math.max(Math.abs(circuit.elements[a.id]?.current ?? 0), Math.abs(circuit.elements[b.id]?.current ?? 0));
    const flowing = current > 1e-4;
    const selected = selectedWireId === w.id;
    const color = w.color ?? WIRE_COLORS[i % WIRE_COLORS.length];
    const draw = (ctx: Konva.Context, shape: Konva.Shape) => {
      ctx.beginPath();
      ctx.moveTo(p.a.x, p.a.y);
      ctx.bezierCurveTo(p.c1.x, p.c1.y, p.c2.x, p.c2.y, p.b.x, p.b.y);
      ctx.strokeShape(shape);
    };
    return (
      <Group key={w.id}>
        <Shape sceneFunc={draw} stroke={selected ? "#2563eb" : "rgba(15,23,42,0.18)"} strokeWidth={selected ? 7 : 5} lineCap="round" hitStrokeWidth={14} onClick={() => !readOnly && s.selectWire(w.id)} onDblClick={() => !readOnly && s.deleteWire(w.id)} onContextMenu={(e) => { e.evt.preventDefault(); s.selectWire(w.id); }} />
        <Shape sceneFunc={draw} stroke={color} strokeWidth={2.6} lineCap="round" listening={false} />
        {flowing && <Shape sceneFunc={draw} stroke="rgba(254,240,138,0.95)" strokeWidth={1.4} dash={[3, 11]} dashOffset={-(clock * 40 * Math.min(4, 0.5 + current * 3)) % 14} listening={false} />}
      </Group>
    );
  };

  /* ---------- render ---------- */
  const selectedSet = new Set(selection);
  const cursor = stageDraggable ? "grab" : wireDrag ? "crosshair" : tool === "wire" ? "crosshair" : "default";
  const showTerminals = !readOnly && (tool === "wire" || mode === "physics" || wireDrag != null || terminals.some((t) => selectedSet.has(t.comp.id)));

  return (
    <div className={`relative h-full w-full overflow-hidden ${dropHighlight ? "ring-2 ring-inset ring-primary/60" : ""}`}>
      {settings.showRulers && <Rulers viewport={viewport} width={size.width} height={size.height} pointer={pointer} />}
      <div
        ref={containerRef}
        className="absolute bg-white"
        style={{ left: settings.showRulers ? 22 : 0, top: settings.showRulers ? 22 : 0, right: 0, bottom: 0, cursor }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={Math.max(1, size.width - (settings.showRulers ? 22 : 0))}
          height={Math.max(1, size.height - (settings.showRulers ? 22 : 0))}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable={stageDraggable}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) s.setViewport({ x: e.target.x(), y: e.target.y() });
          }}
          onWheel={onWheel}
          onMouseDown={onStageMouseDown}
          onMouseMove={onStageMouseMove}
          onMouseUp={onStageMouseUp}
          onMouseLeave={() => setPointer(null)}
          onContextMenu={(e) => isBackground(e as KonvaEventObject<MouseEvent>) && openMenu(e)}
        >
          <Layer listening={false}>
            <Background mode={mode} viewport={viewport} width={size.width} height={size.height} grid={settings.showGrid} gridSize={settings.gridSize} />
          </Layer>
          <Layer id="content-layer">
            <Rect name="bg" x={-viewport.x / viewport.scale - 50} y={-viewport.y / viewport.scale - 50} width={size.width / viewport.scale + 100} height={size.height / viewport.scale + 100} fill="rgba(0,0,0,0)" />
            {optics.rays.map((r, i) => (
              <Line key={`ray${i}`} points={[r.from.x, r.from.y, r.to.x, r.to.y]} stroke={r.color === "#fffbe6" ? "#fbbf24" : r.color} strokeWidth={1.8} opacity={Math.max(0.25, r.intensity)} shadowColor={r.color} shadowBlur={6} listening={false} />
            ))}
            {components.map((c) => {
              const def = getDefinition(c.type);
              const w = c.dimensions.width;
              const h = c.dimensions.height;
              const selected = selectedSet.has(c.id);
              return (
                <Group
                  key={c.id}
                  id={c.id}
                  x={c.position.x + w / 2}
                  y={c.position.y + h / 2}
                  offsetX={w / 2}
                  offsetY={h / 2}
                  rotation={c.rotation}
                  draggable={!readOnly && !c.locked && !stageDraggable && tool !== "wire"}
                  onMouseDown={(e) => {
                    if (e.evt.button !== 0 || stageDraggable) return;
                    e.cancelBubble = true;
                    setMenu(null);
                    if (!readOnly) selectComponent(c, e.evt.shiftKey);
                  }}
                  onDblClick={() => {
                    if (readOnly) return;
                    if (c.type === "switch") s.runComponentAction(c.id, "toggle");
                  }}
                  onContextMenu={(e) => {
                    e.cancelBubble = true;
                    openMenu(e, c);
                  }}
                  onDragStart={(e) => onDragStart(c, e)}
                  onDragMove={(e) => onDragMove(c, e)}
                  onDragEnd={(e) => onDragEnd(c, e)}
                  onTransformEnd={onTransformEnd}
                >
                  <Rect width={w} height={h} fill="rgba(0,0,0,0)" />
                  {renderComponent(def?.visual.archetype ?? "unknown", {
                    c,
                    w,
                    h,
                    clock,
                    circuit: circuit.elements[c.id],
                    readings: [...(readingsById.get(c.id) ?? [])],
                    screenHits: optics.screenHits[c.id],
                    running: simStatus === "running",
                  })}
                  {selected && <Rect x={-4} y={-4} width={w + 8} height={h + 8} stroke="#2563eb" strokeWidth={1.5 / viewport.scale} dash={[5 / viewport.scale, 3 / viewport.scale]} cornerRadius={4} listening={false} />}
                  {s.dropTargetId === c.id && <Rect x={-6} y={-6} width={w + 12} height={h + 12} stroke="#14b8a6" strokeWidth={2.5 / viewport.scale} fill="rgba(20,184,166,0.08)" cornerRadius={6} listening={false} />}
                </Group>
              );
            })}
            <EffectsLayer components={components} effects={effects} clock={clock} />
            {wires.map(renderWire)}
            {settings.showLabels &&
              components.map((c) => {
                const b = boundsOf(c);
                return (
                  <Group key={`lbl${c.id}`} x={(b.x1 + b.x2) / 2} y={b.y2 + 6} listening={false}>
                    <Text text={c.name + (c.locked ? " 🔒" : "")} fontSize={10} fontFamily={FONT} fill={selectedSet.has(c.id) ? "#2563eb" : "#64748b"} offsetX={(c.name.length * 5.2 + (c.locked ? 14 : 0)) / 2} />
                  </Group>
                );
              })}
            {showTerminals &&
              terminals.map((t) => {
                const connected = wires.some((w) => (w.from.componentId === t.end.componentId && w.from.terminal === t.end.terminal) || (w.to.componentId === t.end.componentId && w.to.terminal === t.end.terminal));
                const hot = hoverTerminal === t.key || (wireDrag?.target && `${wireDrag.target.componentId}:${wireDrag.target.terminal}` === t.key);
                return (
                  <Group key={t.key} x={t.pos.x} y={t.pos.y}>
                    <Circle
                      radius={(hot ? 7 : 5) / Math.max(0.6, viewport.scale)}
                      fill={hot ? "#14b8a6" : connected ? "#2563eb" : "#ffffff"}
                      stroke="#2563eb"
                      strokeWidth={1.5 / viewport.scale}
                      hitStrokeWidth={16}
                      onMouseEnter={() => setHoverTerminal(t.key)}
                      onMouseLeave={() => setHoverTerminal(null)}
                      onMouseDown={(e) => {
                        e.cancelBubble = true;
                        setWireDrag({ from: t.end, start: t.pos, pos: t.pos, target: null });
                      }}
                    />
                    {hot && t.label && <Text text={t.label} y={-18 / viewport.scale} fontSize={10 / viewport.scale} fill="#0f766e" fontStyle="bold" listening={false} />}
                  </Group>
                );
              })}
            {wireDrag && (
              <Shape
                sceneFunc={(ctx, shape) => {
                  const p = wirePath(wireDrag.start, wireDrag.pos);
                  ctx.beginPath();
                  ctx.moveTo(p.a.x, p.a.y);
                  ctx.bezierCurveTo(p.c1.x, p.c1.y, p.c2.x, p.c2.y, p.b.x, p.b.y);
                  ctx.strokeShape(shape);
                }}
                stroke={wireDrag.target ? "#14b8a6" : "#2563eb"}
                strokeWidth={2.5}
                dash={[6, 4]}
                listening={false}
              />
            )}
          </Layer>
          <Layer>
            {guides.v.map((x, i) => (
              <Line key={`gv${i}`} points={[x, -5000, x, 5000]} stroke="#f43f5e" strokeWidth={1 / viewport.scale} dash={[4, 4]} listening={false} />
            ))}
            {guides.h.map((y, i) => (
              <Line key={`gh${i}`} points={[-5000, y, 5000, y]} stroke="#f43f5e" strokeWidth={1 / viewport.scale} dash={[4, 4]} listening={false} />
            ))}
            {marquee && (
              <Rect x={Math.min(marquee.x1, marquee.x2)} y={Math.min(marquee.y1, marquee.y2)} width={Math.abs(marquee.x2 - marquee.x1)} height={Math.abs(marquee.y2 - marquee.y1)} fill="rgba(37,99,235,0.08)" stroke="#2563eb" strokeWidth={1 / viewport.scale} dash={[4 / viewport.scale, 3 / viewport.scale]} listening={false} />
            )}
            <Transformer
              ref={trRef}
              rotateEnabled
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={6}
              keepRatio={false}
              anchorSize={8}
              anchorCornerRadius={2}
              borderStroke="#2563eb"
              anchorStroke="#2563eb"
              anchorFill="#ffffff"
              borderStrokeWidth={1}
              ignoreStroke
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
        {menu && <ContextMenu menu={menu} onClose={() => setMenu(null)} />}
        {readOnly && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-float">
            Replay · step {(replayIndex ?? 0) + 1} / {recording.length} · t = {frame?.t.toFixed(1)} s
          </div>
        )}
        {components.length === 0 && !readOnly && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-8 py-6 text-center">
              <div className="text-sm font-semibold text-slate-700">Your workbench is empty</div>
              <div className="mt-1 max-w-xs text-xs text-slate-500">Drag equipment or chemicals from the library, or start from a template. Scroll to zoom · Space + drag to pan.</div>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 font-mono text-[10px] text-slate-500 shadow-panel">
          {pointer ? `x ${pointer.x.toFixed(0)} mm · y ${pointer.y.toFixed(0)} mm` : "—"}
          {selection.length > 0 && <span className="text-primary">· {selection.length} selected</span>}
          {components.some((c) => selectedSet.has(c.id) && c.locked) && <Lock size={10} />}
        </div>
      </div>
    </div>
  );
}
