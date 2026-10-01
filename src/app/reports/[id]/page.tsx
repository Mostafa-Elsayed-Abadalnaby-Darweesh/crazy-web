"use client";
import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileJson, FileSpreadsheet, FlaskConical, Loader2, Printer, Upload } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MadeBy } from "@/components/layout/Footer";
import { ReportDocument } from "@/components/report/ReportDocument";
import { getExperiment, saveExperiment } from "@/lib/storage/experiments";
import { buildReportModel, type ExperimentDoc } from "@/lib/report/model";
import type { ReportMeta } from "@/lib/engine/types";
import { useSettings } from "@/store/settingsStore";
import { deriveColumns } from "@/lib/engine/columns";
import { download, slug, toCSV } from "@/lib/export";
import { chartsToPng } from "@/lib/report/svgToPng";
import { useLab } from "@/store/labStore";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exp, setExp] = useState<ExperimentDoc | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const profile = useSettings((s) => s.profile);

  useEffect(() => {
    const e = getExperiment(id) as ExperimentDoc | undefined;
    if (!e) return setExp(null);
    // Pre-fill blank report fields from the user profile
    const r = e.report;
    setExp({
      ...e,
      report: {
        ...r,
        institution: r.institution && r.institution !== "Virtual Lab University" ? r.institution : profile.institution || r.institution,
        studentName: r.studentName || (profile.name !== "Student" ? profile.name : ""),
        studentId: r.studentId || profile.studentId,
        course: r.course || profile.course,
        instructor: r.instructor || profile.instructor,
        logo: r.logo ?? profile.logo,
        reportTitle: r.reportTitle || e.title,
      },
    });
  }, [id, profile]);

  const model = useMemo(() => (exp ? buildReportModel(exp) : null), [exp]);

  const update = (p: Partial<ReportMeta>) => {
    if (!exp) return;
    const next = { ...exp, report: { ...exp.report, ...p }, updatedAt: Date.now() };
    setExp(next);
    saveExperiment(next);
    const lab = useLab.getState();
    if (lab.experimentId === exp.id) lab.updateReport(p);
  };

  const downloadPdf = async () => {
    if (!model || !docRef.current) return;
    setBusy(true);
    try {
      const charts = await chartsToPng(docRef.current);
      const { renderReportPdf } = await import("@/components/report/ReportPdf");
      const blob = await renderReportPdf(model, charts);
      download(`${slug(model.title)}-report.pdf`, blob);
    } catch (err) {
      console.error(err);
      alert("PDF generation failed — try Print → Save as PDF instead.");
    } finally {
      setBusy(false);
    }
  };

  if (exp === undefined) return null;
  if (exp === null || !model)
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="text-lg font-semibold">Report not found</div>
          <Link className="btn btn-primary" href="/reports">
            All reports
          </Link>
        </div>
      </div>
    );

  const field = (key: keyof ReportMeta, label: string, type = "text") => (
    <label className="block">
      <span className="label">{label}</span>
      <input type={type} className="input text-[13px]" value={String(exp.report[key] ?? "")} onChange={(e) => update({ [key]: e.target.value })} />
    </label>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppHeader />
      <div className="flex flex-1">
        <aside className="no-print sticky top-14 h-[calc(100vh-56px)] w-[300px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
          <Link href="/reports" className="mb-4 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
            <ArrowLeft size={12} /> All reports
          </Link>
          <h1 className="text-base font-semibold">Report settings</h1>
          <p className="mb-4 text-xs text-slate-500">Changes are saved automatically and applied to the PDF.</p>
          <div className="space-y-3">
            {field("reportTitle", "Report title")}
            {field("institution", "Institution name")}
            <div>
              <span className="label">Logo</span>
              <div className="flex items-center gap-2">
                <label className="btn btn-sm cursor-pointer">
                  <Upload size={12} /> Upload
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => update({ logo: String(r.result) });
                      r.readAsDataURL(f);
                    }}
                  />
                </label>
                {exp.report.logo && (
                  <button className="btn btn-ghost btn-sm" onClick={() => update({ logo: undefined })}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            {field("studentName", "Student name")}
            {field("studentId", "Student ID")}
            {field("course", "Course")}
            {field("instructor", "Instructor")}
            {field("date", "Date", "date")}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <button className="btn btn-primary w-full" onClick={downloadPdf} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download PDF
            </button>
            <button className="btn w-full" onClick={() => window.print()}>
              <Printer size={14} /> Print report
            </button>
            <button className="btn w-full" disabled={!exp.dataRows.length} onClick={() => download(`${slug(model.title)}-data.csv`, toCSV(exp.dataRows, deriveColumns(exp.dataRows, exp.columnMeta ?? {})), "text/csv")}>
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <button className="btn w-full" onClick={() => download(`${slug(model.title)}.json`, JSON.stringify(exp, null, 2), "application/json")}>
              <FileJson size={14} /> Export experiment data
            </button>
            <Link className="btn btn-ghost w-full" href={`/lab/${exp.id}`}>
              <FlaskConical size={14} /> Open in workspace
            </Link>
          </div>
          <div className="mt-6 text-center text-[11px] text-slate-400">
            <MadeBy />
          </div>
        </aside>
        <main className="flex-1 overflow-x-auto px-6 py-8" ref={docRef}>
          <ReportDocument m={model} allRows={exp.dataRows} />
        </main>
      </div>
    </div>
  );
}
