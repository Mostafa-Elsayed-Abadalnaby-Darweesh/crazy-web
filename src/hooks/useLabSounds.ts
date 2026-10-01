"use client";
import { useEffect, useRef } from "react";
import { useLab } from "@/store/labStore";
import { useSettings } from "@/store/settingsStore";
import { sound, type OneShot } from "@/lib/audio/sound";

/** Connects the simulation to the procedural sound engine. */
export function useLabSounds() {
  const enabled = useSettings((s) => s.preferences.sound !== false);
  const volume = useSettings((s) => s.preferences.soundVolume ?? 0.6);
  const played = useRef(new Set<string>());

  useEffect(() => {
    sound.setEnabled(enabled, volume);
    if (!enabled) sound.stopAll();
  }, [enabled, volume]);

  // Browsers only allow audio after a user gesture
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // One-shot effects
  useEffect(
    () =>
      useLab.subscribe((s, prev) => {
        if (s.effects === prev.effects) return;
        for (const e of s.effects) {
          if (played.current.has(e.id) || Date.now() - e.at > 1500) continue;
          played.current.add(e.id);
          sound.play(e.type as OneShot);
        }
      }),
    [],
  );

  // Continuous loops follow the state of the bench
  useEffect(() => {
    const id = setInterval(() => {
      const s = useLab.getState();
      const running = s.simStatus === "running" && s.replayIndex == null;
      let fizz = 0;
      let boil = 0;
      let fire = 0;
      let burner = 0;
      let hum = 0;
      for (const c of s.components) {
        if (c.type === "bunsen-burner" && c.properties.lit === true) burner += ({ low: 0.5, medium: 0.75, high: 1 } as Record<string, number>)[String(c.properties.flame)] ?? 0.75;
        if (c.state.onFire || c.state.burning) fire = 1;
        if (!running) continue;
        if (typeof c.state.gasRate === "number") fizz += c.state.gasRate as number;
        if (c.state.boiling) boil = 1;
        if (typeof c.state.rpm === "number") hum = Math.max(hum, Math.min(1, (c.state.rpm as number) / 2500));
        if ((c.type === "magnetic-stirrer" && c.properties.on === true) || (c.type === "hot-plate" && c.properties.stir === true)) hum = Math.max(hum, 0.35);
      }
      sound.setLoop("fizz", Math.min(1, Math.sqrt(fizz * 400)));
      sound.setLoop("boil", boil);
      sound.setLoop("fire", fire);
      sound.setLoop("burner", Math.min(1, burner));
      sound.setLoop("hum", hum);
    }, 250);
    return () => {
      clearInterval(id);
      sound.stopAll();
    };
  }, []);
}
