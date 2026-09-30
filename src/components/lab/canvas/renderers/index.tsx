"use client";
import { Group, Rect, Text } from "react-konva";
import { GLASSWARE } from "./glassware";
import { EQUIPMENT } from "./equipment";
import { PHYSICS } from "./physics";
import { FONT, type RenderCtx, type Renderer } from "./common";

const REGISTRY: Record<string, Renderer> = { ...GLASSWARE, ...EQUIPMENT, ...PHYSICS };

/** Fallback for components whose archetype has no dedicated renderer yet. */
const fallback: Renderer = ({ w, h, c }) => (
  <Group>
    <Rect width={w} height={h} cornerRadius={6} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.2} />
    <Text width={w} height={h} align="center" verticalAlign="middle" text={c.type} fontSize={10} fill="#334155" fontFamily={FONT} />
  </Group>
);

export function renderComponent(archetype: string, ctx: RenderCtx) {
  return (REGISTRY[archetype] ?? fallback)(ctx);
}

export function registerRenderer(archetype: string, r: Renderer) {
  REGISTRY[archetype] = r;
}

export type { RenderCtx };
