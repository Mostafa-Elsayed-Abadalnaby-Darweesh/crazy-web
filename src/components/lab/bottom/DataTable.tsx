"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Plus, Search, Trash2, Columns3 } from "lucide-react";
import type { DataColumn, DataRow } from "@/lib/engine/types";
import { deriveColumns } from "@/lib/engine/columns";
import { download, slug, toCSV } from "@/lib/export";

export function useColumns(rows: DataRow[], meta: Record<string, { label: string; unit: string }>): DataColumn[] {
  return useMemo(() => deriveColumns(rows, meta), [rows, meta]);
}

interface Props {
  title: string;
  rows: DataRow[];
  columnMeta: Record<string, { label: string; unit: string }>;
  onAddRow?: () => void;
  onSetValue?: (rowId: string, col: string, v: number | null) => void;
  onSetObservation?: (rowId: string, text: string) => void;
  onDeleteRow?: (id: string) => void;
  onAddColumn?: (label: string, unit: string) => void;
  readOnly?: boolean;
}

function Cell({ value, onCommit, readOnly }: { value: number | null | undefined; onCommit: (v: number | null) => void; readOnly?: boolean }) {
  const [edit, setEdit] = useState<string | null>(null);
  if (readOnly || edit == null)
    return (
      <div className={`min-h-[20px] px-2 py-0.5 text-right font-mono ${readOnly ? "" : "cursor-text hover:bg-primary-50"}`} onDoubleClick={() => !readOnly && setEdit(value == null ? "" : String(value))}>
        {value == null ? <span className="text-slate-300">—</span> : Number(value.toPrecision(6))}
      </div>
    );
  return (
    <input
      autoFocus
      className="w-full rounded border border-primary px-1 py-0.5 text-right font-mono text-[12px] outline-none"
      value={edit}
      onChange={(e) => setEdit(e.target.value)}
      onBlur={() => {
        onCommit(edit.trim() === "" ? null : Number.isFinite(Number(edit)) ? Number(edit) : (value ?? null));
        setEdit(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") setEdit(null);
      }}
    />
  );
}

export function DataTable({ title, rows, columnMeta, onAddRow, onSetValue, onSetObservation, onDeleteRow, onAddColumn, readOnly }: Props) {
  const columns = useColumns(rows, columnMeta);
  const [sort, setSort] = useState<{ col: string; dir: 1 | -1 }>({ col: "t", dir: 1 });
  const [q, setQ] = useState("");
  const [newCol, setNewCol] = useState<{ label: string; unit: string } | null>(null);

  const view = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? rows.filter((r) => (r.observation ?? "").toLowerCase().includes(term) || String(r.t).includes(term) || Object.values(r.values).some((v) => v != null && String(v).includes(term)))
      : rows;
    const get = (r: DataRow) => (sort.col === "t" ? r.t : sort.col === "obs" ? (r.observation ?? "") : (r.values[sort.col] ?? -Infinity));
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [rows, q, sort]);

  const toggleSort = (col: string) => setSort((s) => (s.col === col ? { col, dir: (s.dir * -1) as 1 | -1 } : { col, dir: 1 }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
        <div className="relative w-56">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input h-7 pl-7 text-[12px]" placeholder="Filter rows…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-[11px] text-slate-500">
          {view.length} of {rows.length} rows · double-click a cell to edit
        </span>
        <div className="ml-auto flex gap-1.5">
          {!readOnly && onAddColumn && (
            <button className="btn btn-sm" onClick={() => setNewCol({ label: "", unit: "" })}>
              <Columns3 size={12} /> Column
            </button>
          )}
          {!readOnly && onAddRow && (
            <button className="btn btn-sm" onClick={onAddRow}>
              <Plus size={12} /> Row
            </button>
          )}
          <button className="btn btn-sm" disabled={!rows.length} onClick={() => download(`${slug(title)}-data.csv`, toCSV(view, columns), "text/csv")}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>
      {newCol && (
        <form
          className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCol.label.trim()) onAddColumn?.(newCol.label, newCol.unit);
            setNewCol(null);
          }}
        >
          <input autoFocus className="input h-7 w-48 text-[12px]" placeholder="Column name" value={newCol.label} onChange={(e) => setNewCol({ ...newCol, label: e.target.value })} />
          <input className="input h-7 w-24 text-[12px]" placeholder="Unit" value={newCol.unit} onChange={(e) => setNewCol({ ...newCol, unit: e.target.value })} />
          <button className="btn btn-primary btn-sm" type="submit">
            Add column
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setNewCol(null)}>
            Cancel
          </button>
        </form>
      )}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.id} onClick={() => toggleSort(c.id)} className="cursor-pointer select-none whitespace-nowrap border-b border-slate-200 px-2 py-1.5 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 hover:text-ink">
                  <span className="inline-flex items-center gap-0.5">
                    {c.label}
                    {c.unit && <span className="font-normal normal-case text-slate-400">({c.unit})</span>}
                    {sort.col === c.id && (sort.dir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                  </span>
                </th>
              ))}
              <th onClick={() => toggleSort("obs")} className="cursor-pointer border-b border-slate-200 px-2 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                Observation
              </th>
              {!readOnly && <th className="w-8 border-b border-slate-200" />}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="group hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.id} className="border-b border-slate-100">
                    <Cell readOnly={readOnly} value={c.id === "t" ? r.t : r.values[c.id]} onCommit={(v) => onSetValue?.(r.id, c.id, v)} />
                  </td>
                ))}
                <td className="border-b border-slate-100 px-2">
                  {readOnly ? (
                    <span className="text-slate-600">{r.observation}</span>
                  ) : (
                    <input className="w-full bg-transparent py-0.5 text-[12px] text-slate-600 outline-none focus:bg-white" value={r.observation ?? ""} placeholder="—" onChange={(e) => onSetObservation?.(r.id, e.target.value)} />
                  )}
                </td>
                {!readOnly && (
                  <td className="border-b border-slate-100 text-center">
                    <button className="opacity-0 group-hover:opacity-100" onClick={() => onDeleteRow?.(r.id)}>
                      <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-8 text-center text-xs text-slate-400">Data is logged automatically while the experiment runs. You can also add rows manually.</div>}
      </div>
    </div>
  );
}
