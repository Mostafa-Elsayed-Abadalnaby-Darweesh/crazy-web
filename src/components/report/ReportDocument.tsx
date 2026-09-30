"use client";
import type { ReportModel } from "@/lib/report/model";
import type { DataRow } from "@/lib/engine/types";
import { ChartView } from "@/components/charts/ChartView";
import { LogoMark } from "@/components/ui/Logo";

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 flex items-baseline gap-2 border-b border-slate-200 pb-1 font-serif text-[17px] font-bold text-ink">
      <span className="text-primary">{n}.</span> {children}
    </h2>
  );
}

function Para({ text, empty = "Not recorded." }: { text?: string; empty?: string }) {
  if (!text?.trim()) return <p className="text-[13px] italic text-slate-400">{empty}</p>;
  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed text-slate-800">
      {text.split("\n").filter(Boolean).map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

/** Academic-style HTML report (also the print layout). */
export function ReportDocument({ m, allRows }: { m: ReportModel; allRows: DataRow[] }) {
  let n = 0;
  const next = () => ++n;
  return (
    <article className="print-page mx-auto w-full max-w-[860px] bg-white px-14 py-12 shadow-float" id="report-document">
      <header className="flex items-center gap-4 border-b-2 border-ink pb-4">
        {m.meta.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.meta.logo} alt="Logo" className="h-16 w-16 object-contain" />
        ) : (
          <LogoMark size={56} />
        )}
        <div className="flex-1">
          <div className="font-serif text-lg font-bold uppercase tracking-wide text-ink">{m.meta.institution || "Institution"}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{m.category} Laboratory Report</div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Virtual Lab</div>
          <div>{m.meta.date}</div>
        </div>
      </header>

      <h1 className="mt-8 text-center font-serif text-[28px] font-bold leading-tight text-ink">{m.title}</h1>
      <table className="mx-auto mt-6 text-[13px]">
        <tbody>
          {[
            ["Student name", m.meta.studentName],
            ["Student ID", m.meta.studentId],
            ["Course", m.meta.course],
            ["Instructor", m.meta.instructor],
            ["Date", m.meta.date],
            ["Simulated duration", `${m.duration.toFixed(1)} s`],
          ].map(([k, v]) => (
            <tr key={k}>
              <td className="py-0.5 pr-6 text-right font-semibold text-slate-500">{k}</td>
              <td className="py-0.5 text-ink">{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {m.snapshot && (
        <figure className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.snapshot} alt="Experimental setup" className="mx-auto max-h-[360px] rounded border border-slate-200" />
          <figcaption className="mt-1 text-center text-[11px] italic text-slate-500">Figure 1. Snapshot of the virtual experimental setup.</figcaption>
        </figure>
      )}

      <H n={next()}>Objective</H>
      <Para text={m.objective} />
      <H n={next()}>Theory</H>
      <Para text={m.theory} />
      {m.hypothesis && (
        <div className="mt-2 rounded border-l-4 border-primary bg-primary-50 px-3 py-2 text-[13px]">
          <b>Hypothesis:</b> {m.hypothesis}
        </div>
      )}
      <H n={next()}>Equipment</H>
      <ul className="columns-2 text-[13.5px] text-slate-800">
        {m.equipment.map((x) => (
          <li key={x}>• {x}</li>
        ))}
      </ul>
      <H n={next()}>{m.category === "Chemistry" ? "Chemicals" : "Components"}</H>
      {m.chemicals.length ? (
        <ul className="columns-2 text-[13.5px] text-slate-800">
          {m.chemicals.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      ) : (
        <Para text="" />
      )}
      <H n={next()}>Procedure</H>
      <Para text={m.procedure} />
      <H n={next()}>Observations</H>
      {m.observations.length ? (
        <ul className="space-y-0.5 text-[13px] text-slate-800">
          {m.observations.map((o, i) => (
            <li key={i}>• {o}</li>
          ))}
        </ul>
      ) : (
        <Para text="" />
      )}
      {m.reactions.length > 0 && (
        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-2 py-1">Vessel</th>
              <th className="border border-slate-200 px-2 py-1">Reaction</th>
              <th className="border border-slate-200 px-2 py-1">Type</th>
              <th className="border border-slate-200 px-2 py-1 text-right">ΔT (°C)</th>
            </tr>
          </thead>
          <tbody>
            {m.reactions.map((r, i) => (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1">{r.vessel}</td>
                <td className="border border-slate-200 px-2 py-1 font-mono">{r.equation}</td>
                <td className="border border-slate-200 px-2 py-1">{r.type}</td>
                <td className="border border-slate-200 px-2 py-1 text-right">{r.deltaT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <H n={next()}>Measurements</H>
      {m.stats.length ? (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              {["Quantity", "Unit", "Readings", "Minimum", "Maximum", "Mean", "Final"].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.stats.map((s) => (
              <tr key={s.column.id}>
                <td className="border border-slate-200 px-2 py-1">{s.column.label}</td>
                <td className="border border-slate-200 px-2 py-1">{s.column.unit}</td>
                <td className="border border-slate-200 px-2 py-1 text-right">{s.n}</td>
                {[s.min, s.max, s.mean, s.last].map((v, i) => (
                  <td key={i} className="border border-slate-200 px-2 py-1 text-right font-mono">{v.toPrecision(4)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Para text="" empty="No measurements were logged." />
      )}
      {m.measurements.length > 0 && <p className="mt-2 text-[12px] text-slate-500">{m.measurements.length} manual captures recorded (see data table).</p>}
      <H n={next()}>Data Tables</H>
      {m.rows.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100">
                  {m.columns.map((c) => (
                    <th key={c.id} className="border border-slate-200 px-1.5 py-1 text-right">
                      {c.label}
                      {c.unit ? ` (${c.unit})` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.rows.map((r) => (
                  <tr key={r.id}>
                    {m.columns.map((c) => {
                      const v = c.id === "t" ? r.t : r.values[c.id];
                      return (
                        <td key={c.id} className="border border-slate-200 px-1.5 py-0.5 text-right font-mono">
                          {v == null ? "—" : Number(v.toPrecision(5))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[11px] italic text-slate-500">Table 1. {m.rows.length === m.totalRows ? "All" : `${m.rows.length} evenly sampled of ${m.totalRows}`} logged data points.</p>
        </>
      ) : (
        <Para text="" empty="No data rows." />
      )}
      <H n={next()}>Charts</H>
      {m.charts.length ? (
        <div className="space-y-5">
          {m.charts.map((c, i) => (
            <figure key={c.id} className="report-chart" data-title={c.title}>
              <ChartView config={c} rows={allRows} columns={m.columns} height={260} animate={false} />
              <figcaption className="mt-1 text-center text-[11px] italic text-slate-500">
                Figure {i + 2}. {c.title}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <Para text="" empty="No charts configured." />
      )}
      <H n={next()}>Calculations</H>
      <Para text={m.calculations} empty={m.fits.length ? "" : "No calculations recorded."} />
      {m.fits.length > 0 && (
        <table className="mt-2 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              {["Relationship", "Gradient", "Intercept", "R²", "n"].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.fits.map((f, i) => (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1">
                  {f.y} vs {f.x}
                </td>
                <td className="border border-slate-200 px-2 py-1 font-mono">{f.slope.toPrecision(4)}</td>
                <td className="border border-slate-200 px-2 py-1 font-mono">{f.intercept.toPrecision(4)}</td>
                <td className="border border-slate-200 px-2 py-1 font-mono">{f.r2.toFixed(4)}</td>
                <td className="border border-slate-200 px-2 py-1">{f.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <H n={next()}>Results</H>
      <Para text={m.results} />
      <H n={next()}>Discussion</H>
      <Para text={m.discussion} empty="Add your discussion in the lab notebook." />
      <H n={next()}>Conclusion</H>
      <Para text={m.conclusion} empty="Add your conclusion in the lab notebook." />
      {m.safety && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <b>Safety notes.</b> {m.safety.split("\n").join(" ")}
        </div>
      )}
      <footer className="mt-10 flex justify-between border-t border-slate-200 pt-3 text-[10.5px] text-slate-400">
        <span>Generated with Virtual Lab — educational simulation. Results are modelled, not measured.</span>
        <span>Made by Mostafa Elsayed</span>
      </footer>
    </article>
  );
}

