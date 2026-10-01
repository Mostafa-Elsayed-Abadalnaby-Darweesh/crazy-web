"use client";
/**
 * Procedural laboratory sound effects built with the Web Audio API — no audio files.
 * One-shot effects (pop, whoosh, click…) plus continuous loops (fizzing, burner roar,
 * boiling, fire crackle, motor hum) whose loudness follows the simulation.
 */

export type OneShot = "pop" | "flash" | "ignite" | "precipitate" | "splash" | "pour" | "spark" | "burnout" | "extinguish" | "relight" | "sizzle" | "smoke" | "click";
export type LoopName = "fizz" | "burner" | "boil" | "fire" | "hum";

interface Loop {
  gain: GainNode;
  level: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private loops = new Map<LoopName, Loop>();
  private volume = 0.6;
  enabled = true;

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume : 0;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  setEnabled(on: boolean, volume = this.volume) {
    this.enabled = on;
    this.volume = volume;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? volume : 0, this.ctx.currentTime, 0.05);
  }

  private noiseSource(loop = false) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    src.loopStart = Math.random();
    return src;
  }

  private env(g: GainNode, t: number, attack: number, peak: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private burst(t: number, opts: { type: BiquadFilterType; freq: number; q?: number; peak: number; attack?: number; decay: number; sweepTo?: number }) {
    const ctx = this.ctx!;
    const src = this.noiseSource();
    const f = ctx.createBiquadFilter();
    f.type = opts.type;
    f.frequency.setValueAtTime(opts.freq, t);
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + (opts.attack ?? 0.005) + opts.decay);
    f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    this.env(g, t, opts.attack ?? 0.005, opts.peak, opts.decay);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + (opts.attack ?? 0.005) + opts.decay + 0.05);
  }

  private tone(t: number, opts: { type?: OscillatorType; from: number; to?: number; peak: number; attack?: number; decay: number }) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = opts.type ?? "sine";
    o.frequency.setValueAtTime(opts.from, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.attack ?? 0.005) + opts.decay);
    const g = ctx.createGain();
    this.env(g, t, opts.attack ?? 0.005, opts.peak, opts.decay);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + (opts.attack ?? 0.005) + opts.decay + 0.05);
  }

  play(type: OneShot) {
    if (!this.enabled || !this.ready) return;
    const t = this.ctx!.currentTime + 0.01;
    switch (type) {
      case "pop": // the classic "squeaky pop" of hydrogen
        this.tone(t, { type: "triangle", from: 1900, to: 700, peak: 0.35, decay: 0.09 });
        this.burst(t, { type: "bandpass", freq: 900, q: 1.2, peak: 0.9, attack: 0.002, decay: 0.12 });
        this.burst(t, { type: "lowpass", freq: 300, peak: 0.6, attack: 0.002, decay: 0.18 });
        break;
      case "flash": // magnesium flare: bright whoosh + fizzing crackle
        this.burst(t, { type: "bandpass", freq: 400, sweepTo: 5000, q: 0.6, peak: 0.7, attack: 0.05, decay: 0.8 });
        for (let i = 0; i < 12; i++) this.burst(t + 0.1 + Math.random() * 1.2, { type: "highpass", freq: 3000, peak: 0.25, decay: 0.03 });
        break;
      case "ignite": // vapour catching fire
        this.burst(t, { type: "lowpass", freq: 250, sweepTo: 2500, peak: 0.8, attack: 0.08, decay: 0.6 });
        break;
      case "relight":
        this.burst(t, { type: "lowpass", freq: 400, sweepTo: 2000, peak: 0.45, attack: 0.05, decay: 0.35 });
        break;
      case "extinguish":
      case "smoke":
        this.burst(t, { type: "highpass", freq: 1500, peak: 0.35, attack: 0.01, decay: 0.35, sweepTo: 600 });
        break;
      case "sizzle":
        for (let i = 0; i < 40; i++) this.burst(t + Math.random() * 2.5, { type: "highpass", freq: 2500 + Math.random() * 3000, peak: 0.18 + Math.random() * 0.2, decay: 0.02 + Math.random() * 0.04 });
        this.burst(t, { type: "highpass", freq: 3500, peak: 0.25, attack: 0.1, decay: 2.4 });
        break;
      case "splash":
        this.burst(t, { type: "bandpass", freq: 700, q: 1.5, peak: 0.35, attack: 0.01, decay: 0.25, sweepTo: 350 });
        this.tone(t + 0.02, { from: 900, to: 1400, peak: 0.05, decay: 0.12 });
        break;
      case "pour":
        for (let i = 0; i < 10; i++) this.burst(t + i * 0.09, { type: "bandpass", freq: 500 + Math.random() * 500, q: 2, peak: 0.25, attack: 0.02, decay: 0.12 });
        break;
      case "precipitate":
        for (let i = 0; i < 6; i++) this.tone(t + i * 0.07, { from: 2400 + Math.random() * 1600, peak: 0.03, decay: 0.15 });
        break;
      case "spark":
        for (let i = 0; i < 9; i++) this.burst(t + Math.random() * 0.35, { type: "highpass", freq: 2500, peak: 0.5, attack: 0.001, decay: 0.025 });
        this.tone(t, { type: "square", from: 120, peak: 0.08, decay: 0.3 });
        break;
      case "burnout":
        this.burst(t, { type: "bandpass", freq: 1500, q: 2, peak: 0.5, attack: 0.001, decay: 0.05 });
        this.tone(t + 0.04, { from: 4200, to: 3800, peak: 0.08, decay: 0.4 });
        break;
      case "click":
        this.tone(t, { type: "square", from: 1800, to: 900, peak: 0.12, attack: 0.001, decay: 0.03 });
        break;
    }
  }

  private makeLoop(name: LoopName): Loop {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master!);
    if (name === "hum") {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 95;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 400;
      o.connect(f).connect(gain);
      o.start();
    } else {
      const src = this.noiseSource(true);
      const f = ctx.createBiquadFilter();
      const cfg: Record<Exclude<LoopName, "hum">, [BiquadFilterType, number, number]> = {
        fizz: ["highpass", 4000, 0.7],
        burner: ["bandpass", 700, 0.5],
        boil: ["lowpass", 500, 1],
        fire: ["bandpass", 1200, 0.4],
      };
      const [type, freq, q] = cfg[name as Exclude<LoopName, "hum">];
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      // slow random amplitude modulation makes fizz/boil/fire sound organic
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = name === "boil" ? 7 : name === "fire" ? 11 : name === "fizz" ? 17 : 0.4;
      lfoGain.gain.value = name === "burner" ? 0.1 : 0.45;
      const mod = ctx.createGain();
      mod.gain.value = 0.6;
      lfo.connect(lfoGain).connect(mod.gain);
      src.connect(f).connect(mod).connect(gain);
      src.start();
      lfo.start();
    }
    const loop = { gain, level: 0 };
    this.loops.set(name, loop);
    return loop;
  }

  /** Set a continuous loop's loudness (0…1). */
  setLoop(name: LoopName, level: number) {
    if (!this.ready) return;
    const target = this.enabled ? Math.max(0, Math.min(1, level)) : 0;
    let loop = this.loops.get(name);
    if (!loop) {
      if (target <= 0.001) return;
      loop = this.makeLoop(name);
    }
    if (Math.abs(loop.level - target) < 0.005) return;
    loop.level = target;
    const scale: Record<LoopName, number> = { fizz: 0.35, burner: 0.28, boil: 0.5, fire: 0.6, hum: 0.12 };
    loop.gain.gain.setTargetAtTime(target * scale[name], this.ctx!.currentTime, 0.15);
  }

  stopAll() {
    for (const name of this.loops.keys()) this.setLoop(name, 0);
  }
}

export const sound = new SoundEngine();
