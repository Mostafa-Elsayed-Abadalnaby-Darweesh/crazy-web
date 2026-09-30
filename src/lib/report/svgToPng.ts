/** Rasterise every Recharts SVG inside `root` so it can be embedded in the PDF. */
export async function chartsToPng(root: HTMLElement): Promise<{ title: string; src: string }[]> {
  const figures = [...root.querySelectorAll<HTMLElement>(".report-chart")];
  const out: { title: string; src: string }[] = [];
  for (const fig of figures) {
    const svg = fig.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) continue;
    const { width, height } = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.style.fontFamily = "Arial, sans-serif";
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("chart render failed"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    out.push({ title: fig.dataset.title ?? "Chart", src: canvas.toDataURL("image/png") });
  }
  return out;
}
