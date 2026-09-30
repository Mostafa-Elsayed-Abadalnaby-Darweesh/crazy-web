"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Profile {
  name: string;
  studentId: string;
  email: string;
  institution: string;
  course: string;
  instructor: string;
  logo?: string;
}

export interface Preferences {
  autosave: boolean;
  logInterval: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  simSpeed: number;
  ambientTemperature: number;
  gravity: number;
  cloudSync: boolean;
  confirmDelete: boolean;
}

interface SettingsState {
  profile: Profile;
  preferences: Preferences;
  setProfile: (p: Partial<Profile>) => void;
  setPreferences: (p: Partial<Preferences>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      profile: { name: "Student", studentId: "", email: "", institution: "Virtual Lab University", course: "General Science", instructor: "", logo: undefined },
      preferences: { autosave: true, logInterval: 1, snapToGrid: true, showGrid: true, showRulers: true, simSpeed: 1, ambientTemperature: 25, gravity: 9.81, cloudSync: false, confirmDelete: true },
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setPreferences: (p) => set((s) => ({ preferences: { ...s.preferences, ...p } })),
    }),
    { name: "vlab.settings" },
  ),
);
