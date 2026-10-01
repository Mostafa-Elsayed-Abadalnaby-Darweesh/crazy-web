/** Acid–base indicator colour models: colour stops over the pH scale. */

interface Stop {
  ph: number;
  color: string;
  strength: number;
}

const MODELS: Record<string, { name: string; stops: Stop[] }> = {
  phenolphthalein: {
    name: "Phenolphthalein",
    stops: [
      { ph: 0, color: "#ffffff", strength: 0 },
      { ph: 8.1, color: "#ffffff", strength: 0 },
      { ph: 9, color: "#f472b6", strength: 0.7 },
      { ph: 10.5, color: "#db2777", strength: 0.95 },
      { ph: 14, color: "#be185d", strength: 0.95 },
    ],
  },
  "methyl-orange": {
    name: "Methyl orange",
    stops: [
      { ph: 0, color: "#dc2626", strength: 0.85 },
      { ph: 3.1, color: "#ef4444", strength: 0.85 },
      { ph: 3.8, color: "#f97316", strength: 0.85 },
      { ph: 4.4, color: "#facc15", strength: 0.8 },
      { ph: 14, color: "#facc15", strength: 0.8 },
    ],
  },
  universal: {
    name: "Universal indicator",
    stops: [
      { ph: 0, color: "#b91c1c", strength: 0.9 },
      { ph: 3, color: "#ef4444", strength: 0.9 },
      { ph: 4.5, color: "#f97316", strength: 0.9 },
      { ph: 6, color: "#facc15", strength: 0.85 },
      { ph: 7, color: "#22c55e", strength: 0.85 },
      { ph: 8.5, color: "#0ea5e9", strength: 0.85 },
      { ph: 10.5, color: "#4338ca", strength: 0.9 },
      { ph: 14, color: "#7e22ce", strength: 0.9 },
    ],
  },
  "bromothymol-blue": {
    name: "Bromothymol blue",
    stops: [
      { ph: 0, color: "#eab308", strength: 0.85 },
      { ph: 6, color: "#eab308", strength: 0.85 },
      { ph: 6.9, color: "#22c55e", strength: 0.85 },
      { ph: 7.6, color: "#2563eb", strength: 0.85 },
      { ph: 14, color: "#1d4ed8", strength: 0.85 },
    ],
  },
  litmus: {
    name: "Litmus",
    stops: [
      { ph: 0, color: "#dc2626", strength: 0.8 },
      { ph: 4.5, color: "#dc2626", strength: 0.8 },
      { ph: 6.5, color: "#9333ea", strength: 0.75 },
      { ph: 8.3, color: "#2563eb", strength: 0.8 },
      { ph: 14, color: "#2563eb", strength: 0.8 },
    ],
  },
};

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) + ((((pb >> shift) & 255) - ((pa >> shift) & 255)) * t));
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}

export function indicatorColor(id: string, ph: number): { color: string; strength: number } | null {
  const model = MODELS[id];
  if (!model) return null;
  const s = model.stops;
  if (ph <= s[0].ph) return { color: s[0].color, strength: s[0].strength };
  for (let i = 1; i < s.length; i++) {
    if (ph <= s[i].ph) {
      const t = (ph - s[i - 1].ph) / (s[i].ph - s[i - 1].ph);
      return { color: lerpHex(s[i - 1].color, s[i].color, t), strength: s[i - 1].strength + (s[i].strength - s[i - 1].strength) * t };
    }
  }
  const last = s[s.length - 1];
  return { color: last.color, strength: last.strength };
}

export function indicatorName(id: string) {
  return MODELS[id]?.name ?? id;
}
