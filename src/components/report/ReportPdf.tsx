"use client";
/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt attribute */
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ReportModel } from "@/lib/report/model";

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  fontsReady = true;
  const base = typeof window !== "undefined" ? window.location.origin : "";
  Font.register({ family: "Serif", fonts: [{ src: `${base}/fonts/DejaVuSerif.ttf` }, { src: `${base}/fonts/DejaVuSerif-Bold.ttf`, fontWeight: "bold" }] });
  Font.register({ family: "Sans", fonts: [{ src: `${base}/fonts/DejaVuSans.ttf` }, { src: `${base}/fonts/DejaVuSans-Bold.ttf`, fontWeight: "bold" }] });
  Font.registerHyphenationCallback((w) => [w]);
}

const C = { ink: "#0f172a", muted: "#64748b", line: "#cbd5e1", primary: "#2563eb", soft: "#f1f5f9" };
const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 56, fontFamily: "Serif", fontSize: 10.5, color: C.ink, lineHeight: 1.45 },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 18 },
  logo: { width: 44, height: 44, marginRight: 12, objectFit: "contain" },
  inst: { fontFamily: "Serif", fontWeight: "bold", fontSize: 13, textTransform: "uppercase" },
  sub: { fontFamily: "Sans", fontSize: 8, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 14, marginBottom: 14 },
  metaRow: { flexDirection: "row", justifyContent: "center", marginBottom: 2 },
  metaK: { width: 130, textAlign: "right", paddingRight: 12, fontFamily: "Sans", fontSize: 9.5, color: C.muted, fontWeight: "bold" },
  metaV: { width: 200, fontSize: 10 },
  h: { fontSize: 13.5, fontWeight: "bold", marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.8, borderBottomColor: C.line },
  hn: { color: C.primary },
  p: { marginBottom: 3 },
  empty: { color: C.muted, fontStyle: "normal", fontSize: 9.5 },
  li: { marginBottom: 1.5 },
  table: { borderWidth: 0.6, borderColor: C.line, marginTop: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: C.line },
  th: { fontFamily: "Sans", fontWeight: "bold", fontSize: 7.5, backgroundColor: C.soft, padding: 3, borderRightWidth: 0.6, borderRightColor: C.line },
  td: { fontFamily: "Sans", fontSize: 7.5, padding: 3, borderRightWidth: 0.6, borderRightColor: C.line },
  fig: { marginTop: 8, marginBottom: 4, alignItems: "center" },
  cap: { fontSize: 8.5, color: C.muted, marginTop: 3, textAlign: "center" },
  hyp: { backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: C.primary, padding: 6, marginTop: 4, fontSize: 10 },
  safety: { backgroundColor: "#fffbeb", borderWidth: 0.6, borderColor: "#fcd34d", padding: 6, marginTop: 12, fontSize: 9 },
  footer: { position: "absolute", bottom: 24, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", fontFamily: "Sans", fontSize: 7.5, color: C.muted, borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 5 },
});

function Paragraphs({ text, empty = "Not recorded." }: { text?: string; empty?: string }) {
  if (!text?.trim()) return <Text style={s.empty}>{empty}</Text>;
  return (
    <View>
      {text
        .split("\n")
        .filter(Boolean)
        .map((l, i) => (
          <Text key={i} style={s.p}>
            {l}
          </Text>
        ))}
    </View>
  );
}

function Table({ head, rows, widths }: { head: string[]; rows: string[][]; widths?: number[] }) {
  const w = widths ?? head.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  return (
    <View style={s.table}>
      <View style={s.tr} fixed>
        {head.map((h, i) => (
          <Text key={i} style={[s.th, { width: `${(w[i] / total) * 100}%` }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.tr} wrap={false}>
          {r.map((c, i) => (
            <Text key={i} style={[s.td, { width: `${(w[i] / total) * 100}%` }]}>
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function ReportPdfDoc({ m, chartImages }: { m: ReportModel; chartImages: { title: string; src: string }[] }) {
  let n = 0;
  const H = ({ children }: { children: string }) => (
    <Text style={s.h} minPresenceAhead={40}>
      <Text style={s.hn}>{++n}. </Text>
      {children}
    </Text>
  );
  return (
    <Document title={m.title} author={m.meta.studentName || "Virtual Lab"} subject={`${m.category} laboratory report`} creator="Virtual Lab — Made by Mostafa Elsayed">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {m.meta.logo ? <Image src={m.meta.logo} style={s.logo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.inst}>{m.meta.institution || "Institution"}</Text>
            <Text style={s.sub}>{m.category} Laboratory Report</Text>
          </View>
          <Text style={{ fontFamily: "Sans", fontSize: 8, color: C.muted }}>{m.meta.date}</Text>
        </View>
        <Text style={s.title}>{m.title}</Text>
        {[
          ["Student name", m.meta.studentName],
          ["Student ID", m.meta.studentId],
          ["Course", m.meta.course],
          ["Instructor", m.meta.instructor],
          ["Date", m.meta.date],
          ["Simulated duration", `${m.duration.toFixed(1)} s`],
        ].map(([k, v]) => (
          <View key={k} style={s.metaRow}>
            <Text style={s.metaK}>{k}</Text>
            <Text style={s.metaV}>{v || "—"}</Text>
          </View>
        ))}
        {m.snapshot ? (
          <View style={s.fig}>
            <Image src={m.snapshot} style={{ maxHeight: 250, maxWidth: 480, objectFit: "contain" }} />
            <Text style={s.cap}>Figure 1. Snapshot of the virtual experimental setup.</Text>
          </View>
        ) : null}

        <H>Objective</H>
        <Paragraphs text={m.objective} />
        <H>Theory</H>
        <Paragraphs text={m.theory} />
        {m.hypothesis ? <Text style={s.hyp}>Hypothesis: {m.hypothesis}</Text> : null}
        <H>Equipment</H>
        {m.equipment.map((e) => (
          <Text key={e} style={s.li}>
            • {e}
          </Text>
        ))}
        <H>{m.category === "Chemistry" ? "Chemicals" : "Components"}</H>
        {m.chemicals.length ? m.chemicals.map((e) => <Text key={e} style={s.li}>• {e}</Text>) : <Text style={s.empty}>None recorded.</Text>}
        <H>Procedure</H>
        <Paragraphs text={m.procedure} />
        <H>Observations</H>
        {m.observations.length ? m.observations.map((o, i) => <Text key={i} style={s.li}>• {o}</Text>) : <Text style={s.empty}>Not recorded.</Text>}
        {m.reactions.length ? <Table head={["Vessel", "Reaction", "Type", "ΔT (°C)"]} widths={[1.2, 3, 2, 0.8]} rows={m.reactions.map((r) => [r.vessel, r.equation, r.type, r.deltaT.toFixed(2)])} /> : null}
        <H>Measurements</H>
        {m.stats.length ? (
          <Table head={["Quantity", "Unit", "n", "Min", "Max", "Mean", "Final"]} widths={[2.4, 0.8, 0.6, 1, 1, 1, 1]} rows={m.stats.map((st) => [st.column.label, st.column.unit, String(st.n), st.min.toPrecision(4), st.max.toPrecision(4), st.mean.toPrecision(4), st.last.toPrecision(4)])} />
        ) : (
          <Text style={s.empty}>No measurements were logged.</Text>
        )}
        <H>Data Tables</H>
        {m.rows.length ? (
          <>
            <Table
              head={m.columns.slice(0, 9).map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label))}
              rows={m.rows.map((r) => m.columns.slice(0, 9).map((c) => {
                const v = c.id === "t" ? r.t : r.values[c.id];
                return v == null ? "—" : String(Number(v.toPrecision(5)));
              }))}
            />
            <Text style={s.cap}>
              Table 1. {m.rows.length === m.totalRows ? "All" : `${m.rows.length} evenly sampled of ${m.totalRows}`} logged data points{m.columns.length > 9 ? " (first 9 columns)" : ""}.
            </Text>
          </>
        ) : (
          <Text style={s.empty}>No data rows.</Text>
        )}
        <H>Charts</H>
        {chartImages.length ? (
          chartImages.map((c, i) => (
            <View key={i} style={s.fig} wrap={false}>
              <Image src={c.src} style={{ width: 460 }} />
              <Text style={s.cap}>
                Figure {i + 2}. {c.title}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.empty}>No charts configured.</Text>
        )}
        <H>Calculations</H>
        <Paragraphs text={m.calculations} empty={m.fits.length ? "" : "No calculations recorded."} />
        {m.fits.length ? <Table head={["Relationship", "Gradient", "Intercept", "R²", "n"]} widths={[3, 1, 1, 1, 0.5]} rows={m.fits.map((f) => [`${f.y} vs ${f.x}`, f.slope.toPrecision(4), f.intercept.toPrecision(4), f.r2.toFixed(4), String(f.n)])} /> : null}
        <H>Results</H>
        <Paragraphs text={m.results} />
        <H>Discussion</H>
        <Paragraphs text={m.discussion} empty="Not provided." />
        <H>Conclusion</H>
        <Paragraphs text={m.conclusion} empty="Not provided." />
        {m.safety ? <Text style={s.safety}>Safety notes. {m.safety.split("\n").join(" ")}</Text> : null}
        <View style={s.footer} fixed>
          <Text>Virtual Lab · educational simulation · Made by Mostafa Elsayed</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(m: ReportModel, chartImages: { title: string; src: string }[]): Promise<Blob> {
  registerFonts();
  return pdf(<ReportPdfDoc m={m} chartImages={chartImages} />).toBlob();
}
