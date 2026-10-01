"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartConfig, DataColumn, DataRow } from "@/lib/engine/types";

/** Categorical palette, assigned in fixed order (validated reference palette). */
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const colLabel = (cols: DataColumn[], id: string) => {
  const c = cols.find((x) => x.id === id);
  return c ? `${c.label}${c.unit ? ` (${c.unit})` : ""}` : id;
};

export function chartData(config: ChartConfig, rows: DataRow[]) {
  const val = (r: DataRow, id: string) => (id === "t" ? r.t : r.values[id]);
  const data = rows
    .map((r) => {
      const o: Record<string, number | null> = { x: (val(r, config.x) as number) ?? null };
      for (const y of config.y) o[y] = (val(r, y) as number | null | undefined) ?? null;
      return o;
    })
    .filter((o) => o.x != null && config.y.some((y) => o[y] != null));
  if (config.kind !== "bar") data.sort((a, b) => (a.x as number) - (b.x as number));
  return data;
}

export function ChartView({ config, rows, columns, height = 240, animate = true }: { config: ChartConfig; rows: DataRow[]; columns: DataColumn[]; height?: number; animate?: boolean }) {
  const data = chartData(config, rows);
  if (!config.y.length || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-slate-200 text-xs text-slate-400" style={{ height }}>
        {config.y.length ? "No data yet — run the experiment or capture measurements." : "Choose one or more Y-axis columns."}
      </div>
    );
  }
  const axis = { stroke: "#94a3b8", fontSize: 11, tickLine: false };
  const xAxis = <XAxis dataKey="x" type="number" domain={["auto", "auto"]} {...axis} label={{ value: colLabel(columns, config.x), position: "insideBottom", offset: -4, fontSize: 11, fill: "#52514e" }} tickFormatter={(v: number) => String(Number(v.toPrecision(4)))} />;
  const yAxis = <YAxis {...axis} width={52} tickFormatter={(v: number) => String(Number(v.toPrecision(4)))} />;
  const grid = <CartesianGrid stroke="#eef2f6" vertical={false} />;
  const tooltip = <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} labelFormatter={(v) => `${colLabel(columns, config.x)}: ${Number(v).toPrecision(5)}`} formatter={(v, n) => [typeof v === "number" ? Number(v.toPrecision(5)) : String(v), colLabel(columns, String(n))]} />;
  const legend = config.y.length > 1 ? <Legend verticalAlign="top" height={24} iconType="plainline" formatter={(v) => <span style={{ color: "#52514e", fontSize: 11 }}>{colLabel(columns, String(v))}</span>} /> : null;
  const margin = { top: 8, right: 16, bottom: 16, left: 0 };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {config.kind === "bar" ? (
          <BarChart data={data} margin={margin} barCategoryGap={2}>
            {grid}
            <XAxis dataKey="x" {...axis} tickFormatter={(v: number) => String(Number(Number(v).toPrecision(4)))} />
            {yAxis}
            {tooltip}
            {legend}
            {config.y.map((y, i) => (
              <Bar key={y} dataKey={y} fill={SERIES_COLORS[i % 8]} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
            ))}
          </BarChart>
        ) : config.kind === "scatter" ? (
          <ScatterChart margin={margin}>
            {grid}
            {xAxis}
            <YAxis {...axis} width={52} type="number" tickFormatter={(v: number) => String(Number(v.toPrecision(4)))} />
            {tooltip}
            {legend}
            {config.y.map((y, i) => (
              <Scatter key={y} name={y} data={data.filter((d) => d[y] != null).map((d) => ({ x: d.x, [y]: d[y], y: d[y] }))} dataKey="y" fill={SERIES_COLORS[i % 8]} isAnimationActive={animate} />
            ))}
          </ScatterChart>
        ) : config.kind === "area" ? (
          <AreaChart data={data} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {legend}
            {config.y.map((y, i) => (
              <Area key={y} type="monotone" dataKey={y} stroke={SERIES_COLORS[i % 8]} fill={SERIES_COLORS[i % 8]} fillOpacity={0.15} strokeWidth={2} connectNulls isAnimationActive={animate} />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {legend}
            {config.y.map((y, i) => (
              <Line key={y} type="monotone" dataKey={y} stroke={SERIES_COLORS[i % 8]} strokeWidth={2} dot={data.length < 40 ? { r: 3 } : false} connectNulls isAnimationActive={animate} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
