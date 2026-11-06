"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Glyph } from "@/components/Art";
import { toneStyle, type Tone } from "@/components/ui";
import { letterIndex } from "@/curriculum/alphabet";

/** 끌어 가는 글자 조각 크기 */
export const TILE: CSSProperties = { width: "min(17vh, calc(13*var(--vw)))", height: "min(17vh, calc(13*var(--vw)))" };
export const TILE_FONT: CSSProperties = { fontSize: "min(11.5vh, calc(9*var(--vw)))" };

/** 글자마다 색 — 글자 퍼즐 판·같은 글자 조각(업체 나무 글자 판처럼 알록달록). 같은 글자는 늘 같은 색 */
const LETTER_COLORS = ["#4cb648", "#f28c28", "#3fb8a8", "#e8483b", "#3a9fd8", "#f5b820", "#9b5fc0", "#e8607f"];
export function letterColor(upper: string): string {
  return LETTER_COLORS[Math.max(0, letterIndex(upper)) % LETTER_COLORS.length];
}

/**
 * 글자 조각 — 짝꿍·빈칸 글자에서 손가락으로 집어 끌어 간다(play/drag). 집는 쪽은 touchAction none(끄는 동안 화면이 밀리지 않게).
 * onGrab 이 없으면 그림만(손가락을 따라오는 그림·놓인 뒤 모습). color 를 주면 글자를 그 색으로.
 */
export function LetterTile({
  ch,
  tone = "card",
  onGrab,
  dim = false,
  className = "",
  label,
  color,
}: {
  ch: string;
  tone?: Tone | "card";
  onGrab?: (e: ReactPointerEvent) => void;
  dim?: boolean;
  className?: string;
  label?: string;
  color?: string;
}) {
  return (
    <span
      role={onGrab ? "button" : undefined}
      aria-label={label ?? ch}
      onPointerDown={onGrab}
      className={`squish grid shrink-0 cursor-grab select-none place-items-center rounded-[1.8rem] text-ink ${dim ? "opacity-45 grayscale" : ""} ${className}`}
      style={{ ...TILE, ...toneStyle(tone), touchAction: "none" }}
    >
      <Glyph ch={ch} style={{ ...TILE_FONT, ...(color ? { color } : {}) }} />
    </span>
  );
}
