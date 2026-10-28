"use client";

import Image from "next/image";
import { useSyncExternalStore, type CSSProperties } from "react";
import { wordOf } from "@/curriculum/alphabet";
import { imageOf } from "@/lib/assets";

/*
 * 그림 조각 — 힉스필드 그림(블루이 그림체, refs/ 레퍼런스)이 있으면 그 그림, 없으면 임시 그림.
 * 임시 그림은 일부러 밋밋하게(글자 카드·이모지) — 캐릭터를 흉내 내 그리지 않는다(refs 로 생성할 때까지 자리만 잡는다).
 */

function Img({ src, alt, width, height, className = "" }: { src: string; alt: string; width: number | string; height: number | string; className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width, height }}>
      <Image src={src} alt={alt} fill sizes="40vw" draggable={false} className="pointer-events-none object-contain" />
    </span>
  );
}

/** 배우는 글자 — 프리텐다드 굵게(따라 쓰기 판과 같은 모양) */
export function Glyph({ ch, className = "", style }: { ch: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`font-letter font-extrabold leading-none ${className}`} style={style}>
      {ch}
    </span>
  );
}

/** 대표 단어 그림 — "word:<id>"(블루이 그림체, 바탕 투명), 없으면 이모지 */
export function WordArt({ id, size, className = "" }: { id: string; size: string; className?: string }) {
  const w = wordOf(id);
  const src = imageOf(`word:${id}`);
  if (src) return <Img src={src} alt={w.en} width={size} height={size} className={className} />;
  return (
    <span role="img" aria-label={w.en} className={`inline-grid shrink-0 place-items-center leading-none ${className}`} style={{ width: size, height: size, fontSize: `calc(${size} * 0.72)` }}>
      {w.emoji}
    </span>
  );
}

/** 높이가 낮은 화면(폰 가로)이면 안내 친구를 줄인다 — components/ui 의 useCompact 와 같은 기준 */
function useSmall(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-height: 520px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-height: 520px)").matches,
    () => false,
  );
}

/**
 * 안내 친구 — 인사하고 놀이를 알려 준다(한글나라의 페파 자리, 블루이 친구). 그림 "guide"(·"guide:cheer"·"guide:wow"),
 * 없으면 ABC 글자 카드(임시 — refs/ 블루이 그림으로 생성할 때까지).
 */
export function Guide({ size = 140, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "cheer" | "wow"; className?: string }) {
  const px = useSmall() ? Math.round(size * 0.5) : size;
  const src = imageOf(mood === "happy" ? "guide" : `guide:${mood}`) ?? imageOf("guide");
  if (src) return <Image src={src} alt="" width={px} height={px} draggable={false} className={`pointer-events-none object-contain ${className}`} />;
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-[28%] bg-white shadow-[0_10px_24px_-10px_rgb(62_58_82/0.45)] ${className}`}
      style={{ width: px, height: px }}
    >
      <span className="flex items-end gap-[0.04em] font-letter font-black leading-none" style={{ fontSize: px * 0.32 }}>
        <span style={{ color: "var(--brand)" }}>A</span>
        <span style={{ color: "var(--butter-deep)" }}>B</span>
        <span style={{ color: "var(--sky-deep)" }}>C</span>
      </span>
    </span>
  );
}

/**
 * 주인공 가족 넷(블루이·빙고·아빠·엄마, 2026-10-28 사용자: "애들이 주인공이야") — 첫 화면 인사("family:hello")·하루 끝 축하("family:cheer").
 * 그림이 없으면 안내 친구(블루이)로.
 */
export function Family({ size = 200, mood = "hello", className = "" }: { size?: number; mood?: "hello" | "cheer"; className?: string }) {
  const px = useSmall() ? Math.round(size * 0.55) : size;
  const src = imageOf(`family:${mood}`);
  if (!src) return <Guide size={size} mood={mood === "cheer" ? "cheer" : "happy"} className={className} />;
  return <Image src={src} alt="" width={px} height={px} draggable={false} className={`pointer-events-none object-contain ${className}`} />;
}

/** 모은 스티커 하나 — 숫자 옆·보상 화면. 그림 "icon:sticker" 가 있으면 그 그림, 없으면 별 스티커 */
export function StickerIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const src = imageOf("icon:sticker");
  if (src) return <Image src={src} alt="" width={size} height={size} draggable={false} className={`pointer-events-none object-contain ${className}`} />;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#f0d9a8" strokeWidth="1.6" />
      <path d="M20 7.5l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L20 26.6l-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2z" fill="#ffd34d" stroke="#e6a41f" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
