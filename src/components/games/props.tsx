"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Glyph } from "@/components/Art";
import { imageOf } from "@/lib/assets";

/*
 * 영어 놀이에서 쓰는 단순한 물건 — 주사위·우편함·편지·소포·덤불·물고기·낚싯바늘·빙고 칩.
 * 모양이 단순해서 SVG 로 그린다(숫자놀이 주사위·북과 같은 방식). 캐릭터는 그리지 않는다 — 블루이 가족은 늘 생성 그림.
 * 힉스필드 그림("prop:<이름>")이 생기면 그 그림으로 바뀐다(PropArt).
 */

/** 그림이 있으면 그 그림, 없으면 SVG */
function PropArt({ id, size, children }: { id: string; size: string; children: ReactNode }) {
  const src = imageOf(`prop:${id}`);
  if (!src) return <>{children}</>;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <Image src={src} alt="" fill sizes="30vw" draggable={false} className="pointer-events-none object-contain" />
    </span>
  );
}

/** 주사위 눈 자리(0~1) — 보통 주사위와 같은 배치 */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.26, 0.26],
    [0.5, 0.5],
    [0.74, 0.74],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.26, 0.26],
    [0.74, 0.26],
    [0.5, 0.5],
    [0.26, 0.74],
    [0.74, 0.74],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
};

/** 주사위 한 면 — 하얀 둥근 네모에 빨간 눈 */
export function Die({ face, size, className = "", style }: { face: number; size: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} style={{ width: size, height: size, ...style }} aria-label={`주사위 ${face}`} role="img">
      <rect x="4" y="4" width="92" height="92" rx="20" fill="#ffffff" stroke="rgb(62 58 82 / 0.18)" strokeWidth="3" />
      <rect x="4" y="80" width="92" height="16" rx="8" fill="rgb(62 58 82 / 0.06)" />
      {(PIPS[face] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x * 100} cy={y * 100} r="9.5" fill="#ef6a6a" />
      ))}
    </svg>
  );
}

/** 우편함 — 빨간 통 앞 하얀 판에 소문자, 배달을 받으면 노란 깃발이 올라간다(up) */
export function Mailbox({ letter, up, height }: { letter: string; up: boolean; height: string }) {
  return (
    <span className="relative inline-block shrink-0" style={{ height, width: `calc(${height} * 0.86)` }}>
      <svg viewBox="0 0 112 130" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="47" y="68" width="14" height="60" rx="4" fill="#c58b57" stroke="#a8713f" strokeWidth="2" />
        <path d="M14 74 V42 Q14 12 54 12 Q94 12 94 42 V74 Z" fill="#ef6a6a" stroke="#d14f50" strokeWidth="3" strokeLinejoin="round" />
        <rect x="32" y="20" width="44" height="6" rx="3" fill="#d14f50" />
        <g style={{ transform: `rotate(${up ? 0 : 90}deg)`, transformOrigin: "96px 66px", transformBox: "view-box", transition: "transform 0.45s cubic-bezier(0.3, 1.6, 0.5, 1)" }}>
          <rect x="94" y="30" width="5" height="38" rx="2" fill="#8a8aa0" />
          <path d="M99 30 H110 Q112 30 112 32 V42 Q112 44 110 44 H99 Z" fill="#f7c948" stroke="#dba62a" strokeWidth="2" />
        </g>
      </svg>
      <span className="absolute grid place-items-center rounded-[18%] bg-white" style={{ left: "24%", top: "25%", width: "48%", height: "30%" }}>
        <Glyph ch={letter} style={{ fontSize: `calc(${height} * 0.26)` }} />
      </span>
    </span>
  );
}

/** 편지 봉투 — 가운데 대문자 */
export function Envelope({ letter, width }: { letter: string; width: string }) {
  return (
    <PropArt id="envelope" size={width}>
      <span className="relative inline-block shrink-0" style={{ width, height: `calc(${width} * 0.7)` }}>
        <svg viewBox="0 0 120 84" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="3" y="3" width="114" height="78" rx="10" fill="#fffaf0" stroke="#e2cfae" strokeWidth="3" />
          <path d="M6 8 L60 46 L114 8" fill="none" stroke="#e2cfae" strokeWidth="3" strokeLinejoin="round" />
          <rect x="92" y="10" width="18" height="20" rx="3" fill="#7cc6ee" />
        </svg>
        <span className="absolute inset-x-0 bottom-[6%] grid place-items-center">
          <Glyph ch={letter} className="text-brand" style={{ fontSize: `calc(${width} * 0.36)` }} />
        </span>
      </span>
    </PropArt>
  );
}

/** 소포 — 갈색 상자에 단어 그림을 붙였다(그림은 children) */
export function Parcel({ width, children }: { width: string; children: ReactNode }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width, height: `calc(${width} * 0.86)` }}>
      <svg viewBox="0 0 100 86" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="4" y="10" width="92" height="72" rx="8" fill="#e4b67c" stroke="#c4925a" strokeWidth="3" />
        <rect x="44" y="10" width="12" height="72" fill="#f3d9a8" />
        <rect x="4" y="4" width="92" height="14" rx="5" fill="#d9a466" stroke="#c4925a" strokeWidth="3" />
      </svg>
      <span className="absolute inset-x-[12%] bottom-[8%] top-[22%] grid place-items-center rounded-xl bg-white/90">{children}</span>
    </span>
  );
}

/** 덤불 — 동글동글 초록 잎 뭉치 */
export function Bush({ width }: { width: string }) {
  return (
    <PropArt id="bush" size={width}>
      <svg viewBox="0 0 120 90" style={{ width, height: `calc(${width} * 0.75)` }} className="shrink-0" aria-hidden>
        <g stroke="#3f8f45" strokeWidth="3">
          <circle cx="30" cy="56" r="26" fill="#5fb85f" />
          <circle cx="90" cy="56" r="26" fill="#5fb85f" />
          <circle cx="60" cy="38" r="32" fill="#6cc36a" />
        </g>
        <rect x="8" y="58" width="104" height="30" rx="14" fill="#5fb85f" />
        <circle cx="46" cy="30" r="5" fill="#ff8fa3" />
        <circle cx="80" cy="46" r="5" fill="#ffd34d" />
        <circle cx="26" cy="54" r="4" fill="#ff8fa3" />
      </svg>
    </PropArt>
  );
}

/** 물고기 색 — 판마다 다른 색으로 */
const FISH_COLORS = [
  ["#ffb35c", "#e08a2e"],
  ["#7cc6ee", "#4a9fcf"],
  ["#ff8fa3", "#e0607a"],
  ["#a8d86e", "#78b043"],
  ["#c4a3f0", "#9a74d4"],
] as const;

/** 물고기 — 몸에 글자. 왼쪽을 본다 */
export function Fish({ ch, color, width }: { ch: string; color: number; width: string }) {
  const [fill, edge] = FISH_COLORS[color % FISH_COLORS.length];
  return (
    <span className="relative inline-block shrink-0" style={{ width, height: `calc(${width} * 0.6)` }}>
      <svg viewBox="0 0 120 72" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M88 36 L116 12 Q120 10 119 16 L114 36 L119 56 Q120 62 116 60 Z" fill={fill} stroke={edge} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="52" cy="36" rx="46" ry="30" fill={fill} stroke={edge} strokeWidth="3" />
        <circle cx="22" cy="28" r="6" fill="#fff" />
        <circle cx="21" cy="28" r="3.2" fill="#3e3a52" />
      </svg>
      {ch && (
        <span className="absolute grid place-items-center rounded-full bg-white/90" style={{ left: "30%", top: "16%", width: "40%", height: "68%" }}>
          <Glyph ch={ch} style={{ fontSize: `calc(${width} * 0.3)` }} />
        </span>
      )}
    </span>
  );
}

/** 낚싯바늘 — 찌 + 줄 + 바늘 */
export function Hook({ height }: { height: string }) {
  return (
    <svg viewBox="0 0 60 90" style={{ height, width: `calc(${height} * 0.66)` }} className="shrink-0" aria-hidden>
      <line x1="30" y1="0" x2="30" y2="54" stroke="#8a8aa0" strokeWidth="3" />
      <circle cx="30" cy="20" r="11" fill="#ef6a6a" />
      <path d="M19 20 A11 11 0 0 1 41 20 Z" fill="#fff" />
      <path d="M30 54 V68 A11 11 0 1 1 14 60" fill="none" stroke="#6b6b80" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** 빙고 칩 — 칸 위에 올리는 동그란 칩(그림이 비쳐 보인다) */
export function Chip({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="shrink-0" aria-hidden>
      <circle cx="50" cy="50" r="44" fill="rgb(77 157 224 / 0.55)" stroke="#2f7cc0" strokeWidth="6" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="8 8" />
    </svg>
  );
}
