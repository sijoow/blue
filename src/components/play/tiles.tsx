"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Glyph } from "@/components/Art";
import { toneStyle, type Tone } from "@/components/ui";

/** 끌어 가는 글자 조각 크기 */
export const TILE: CSSProperties = { width: "min(17vh, calc(13*var(--vw)))", height: "min(17vh, calc(13*var(--vw)))" };
export const TILE_FONT: CSSProperties = { fontSize: "min(11.5vh, calc(9*var(--vw)))" };

/**
 * 글자 조각 — 짝꿍·빈칸 글자에서 손가락으로 집어 끌어 간다(play/drag). 집는 쪽은 touchAction none(끄는 동안 화면이 밀리지 않게).
 * onGrab 이 없으면 그림만(손가락을 따라오는 그림·놓인 뒤 모습).
 */
export function LetterTile({
  ch,
  tone = "card",
  onGrab,
  dim = false,
  className = "",
  label,
}: {
  ch: string;
  tone?: Tone | "card";
  onGrab?: (e: ReactPointerEvent) => void;
  dim?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role={onGrab ? "button" : undefined}
      aria-label={label ?? ch}
      onPointerDown={onGrab}
      className={`squish grid shrink-0 cursor-grab select-none place-items-center rounded-[1.8rem] text-ink ${dim ? "opacity-45 grayscale" : ""} ${className}`}
      style={{ ...TILE, ...toneStyle(tone), touchAction: "none" }}
    >
      <Glyph ch={ch} style={TILE_FONT} />
    </span>
  );
}
