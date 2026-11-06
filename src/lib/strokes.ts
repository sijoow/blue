/**
 * 알파벳 획 — 따라 쓰기 판(components/StrokeBoard)이 쓰는 획 길과 판정. 숫자놀이 lib/strokes(0~9)를 알파벳 52자로 넓혔다(2026-11-06 —
 * 업체 Letter Writing 처럼 화살표가 가리키는 획을 차례대로 따라 긋고, 길을 벗어나면 칠해지지 않는다. 숫자놀이·한글나라도 같은 방식).
 *
 * 글자 하나 = 가로 w(보통 100, M·W·m·w 는 넓게) × 세로 LETTER_H 칸. 줄은 업체 공책처럼 위 줄 TOP · 가운데 점선 MID · 아래 줄 BASE,
 * 대문자는 TOP~BASE, 소문자는 MID~BASE(b·d·f·h·k·l·t 는 위로 TOP 까지, g·j·p·q·y 는 아래로 DESC 까지).
 * 획 = 쓰는 차례대로 놓은 중심선 점들(앞 점에서 뒤 점 방향으로 긋는다). 차례는 유치원 손글씨(위에서 아래, 왼쪽에서 오른쪽, 동그라미는 왼쪽으로 돌기).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type Pt = readonly [number, number];

export const LETTER_H = 168;
export const TOP = 14;
export const MID = 70;
export const BASE = 126;
/** 내림 획(g·j·p·q·y)의 끝 */
export const DESC = 160;
/** 획 길 굵기 — 이 안에서 긋는다 */
export const LANE = 16;
/** 손끝이 획 길 가운데서 이만큼 안이면 길 위로 본다(길 굵기 반 + 4살 손 여유) */
export const TOLERANCE = 15;
/** 펜 머리에서 이만큼 안을 눌러야 시작한다 */
export const HEAD_REACH = 22;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** 타원 호 — 각도는 수학 방향(0° 오른쪽, 90° 위), a0 에서 a1 쪽으로 */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 8));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / steps);
    return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)] as const;
  });
}

function line(a: Pt, b: Pt): Pt[] {
  const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
  return Array.from({ length: steps + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps] as const);
}

/** 이어 붙이기 — 겹치는 점은 하나만 */
function join(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.5) out.push(p);
    }
  }
  return out;
}

/** 꺾은선 — 점들을 차례로 곧게 */
const poly = (...pts: Pt[]): Pt[] => join(...pts.slice(1).map((p, i) => line(pts[i], p)));

/** 소문자 점(i·j) — 짧게 톡 */
const dot = (x: number): Pt[] => line([x, 44], [x, 52]);

export interface LetterStrokes {
  /** 칸 가로 */
  w: number;
  strokes: readonly (readonly Pt[])[];
}

const L = (strokes: Pt[][], w = 100): LetterStrokes => ({ w, strokes });

/** 대문자·소문자 52자 — 키는 화면 글자 그대로("A", "a") */
export const LETTER_STROKES: Readonly<Record<string, LetterStrokes>> = {
  // ── 대문자: TOP(14) ~ BASE(126) ──
  A: L([line([50, TOP], [16, BASE]), line([50, TOP], [84, BASE]), line([28, 88], [72, 88])]),
  B: L([line([22, TOP], [22, BASE]), join(line([22, TOP], [50, TOP]), arc(50, 42, 27, 28, 90, -90), line([50, MID], [22, MID]), line([22, MID], [54, MID]), arc(54, 98, 28, 28, 90, -90), line([54, BASE], [22, BASE]))]),
  C: L([arc(54, 70, 36, 56, 40, 320)]),
  D: L([line([22, TOP], [22, BASE]), join(line([22, TOP], [42, TOP]), arc(42, 70, 38, 56, 90, -90), line([42, BASE], [22, BASE]))]),
  E: L([line([24, TOP], [24, BASE]), line([24, TOP], [78, TOP]), line([24, MID], [70, MID]), line([24, BASE], [78, BASE])]),
  F: L([line([24, TOP], [24, BASE]), line([24, TOP], [78, TOP]), line([24, MID], [68, MID])]),
  G: L([join(arc(52, 70, 36, 56, 40, 360), line([88, MID], [60, MID]))]),
  H: L([line([22, TOP], [22, BASE]), line([78, TOP], [78, BASE]), line([22, MID], [78, MID])]),
  I: L([line([50, TOP], [50, BASE]), line([30, TOP], [70, TOP]), line([30, BASE], [70, BASE])]),
  J: L([join(line([66, TOP], [66, 100]), arc(44, 100, 22, 24, 0, -180))]),
  K: L([line([24, TOP], [24, BASE]), line([78, TOP], [24, 74]), line([40, 56], [80, BASE])]),
  L: L([poly([26, TOP], [26, BASE], [78, BASE])]),
  M: L([line([18, TOP], [18, BASE]), poly([18, TOP], [60, 96], [102, TOP], [102, BASE])], 120),
  N: L([line([22, TOP], [22, BASE]), poly([22, TOP], [78, BASE], [78, TOP])]),
  O: L([arc(50, 70, 36, 56, 90, 450)]),
  P: L([line([22, TOP], [22, BASE]), join(line([22, TOP], [50, TOP]), arc(50, 43, 29, 29, 90, -90), line([50, 72], [22, 72]))]),
  Q: L([arc(50, 70, 36, 56, 90, 450), line([58, 96], [86, 132])]),
  R: L([line([22, TOP], [22, BASE]), join(line([22, TOP], [50, TOP]), arc(50, 43, 29, 29, 90, -90), line([50, 72], [22, 72])), line([44, 72], [80, BASE])]),
  S: L([join(arc(50, 42, 30, 28, 25, 270), arc(50, 98, 30, 28, 90, -155))]),
  T: L([line([50, TOP], [50, BASE]), line([18, TOP], [82, TOP])]),
  U: L([join(line([20, TOP], [20, 94]), arc(50, 94, 30, 32, 180, 360), line([80, 94], [80, TOP]))]),
  V: L([poly([16, TOP], [50, BASE], [84, TOP])]),
  W: L([poly([12, TOP], [38, BASE], [64, TOP], [90, BASE], [116, TOP])], 128),
  X: L([line([18, TOP], [82, BASE]), line([82, TOP], [18, BASE])]),
  Y: L([line([18, TOP], [50, MID]), poly([82, TOP], [50, MID], [50, BASE])]),
  Z: L([poly([18, TOP], [82, TOP], [18, BASE], [82, BASE])]),

  // ── 소문자: MID(70) ~ BASE(126), 위로 TOP · 아래로 DESC ──
  a: L([arc(46, 98, 26, 28, 0, 360), line([72, MID], [72, BASE])]),
  b: L([line([24, TOP], [24, BASE]), arc(50, 98, 26, 28, 180, -180)]),
  c: L([arc(52, 98, 26, 28, 40, 320)]),
  d: L([arc(48, 98, 26, 28, 0, 360), line([74, TOP], [74, BASE])]),
  e: L([join(line([24, 98], [76, 98]), arc(50, 98, 26, 28, 0, 320))]),
  f: L([join(arc(64, 30, 16, 16, 20, 180), line([48, 30], [48, BASE])), line([30, 72], [70, 72])]),
  g: L([arc(48, 98, 26, 28, 0, 360), join(line([74, MID], [74, 140]), arc(52, 140, 22, 20, 0, -160))]),
  h: L([line([24, TOP], [24, BASE]), join(arc(50, 96, 26, 26, 180, 0), line([76, 96], [76, BASE]))]),
  i: L([line([50, MID], [50, BASE]), dot(50)]),
  j: L([join(line([58, MID], [58, 140]), arc(36, 140, 22, 20, 0, -160)), dot(58)]),
  k: L([line([26, TOP], [26, BASE]), line([72, MID], [26, 104]), line([40, 94], [74, BASE])]),
  l: L([line([50, TOP], [50, BASE])]),
  m: L([line([20, MID], [20, BASE]), join(arc(40, 92, 20, 22, 180, 0), line([60, 92], [60, BASE])), join(arc(80, 92, 20, 22, 180, 0), line([100, 92], [100, BASE]))], 120),
  n: L([line([24, MID], [24, BASE]), join(arc(50, 96, 26, 26, 180, 0), line([76, 96], [76, BASE]))]),
  o: L([arc(50, 98, 26, 28, 90, 450)]),
  p: L([line([24, MID], [24, DESC]), arc(50, 98, 26, 28, 180, -180)]),
  q: L([arc(48, 98, 26, 28, 0, 360), line([74, MID], [74, DESC])]),
  r: L([line([28, MID], [28, BASE]), arc(52, 94, 24, 24, 180, 30)]),
  s: L([join(arc(50, 84, 22, 14, 25, 270), arc(50, 112, 22, 14, 90, -155))]),
  t: L([line([48, 24], [48, BASE]), line([30, MID], [68, MID])]),
  u: L([join(line([24, MID], [24, 100]), arc(50, 100, 26, 26, 180, 360), line([76, 100], [76, MID])), line([76, MID], [76, BASE])]),
  v: L([poly([22, MID], [50, BASE], [78, MID])]),
  w: L([poly([14, MID], [36, BASE], [60, 80], [84, BASE], [106, MID])], 120),
  x: L([line([24, MID], [76, BASE]), line([76, MID], [24, BASE])]),
  y: L([line([22, MID], [53, 124]), line([78, MID], [36, DESC])]),
  z: L([poly([24, MID], [76, MID], [24, BASE], [76, BASE])]),
};

export function letterStrokes(ch: string): LetterStrokes {
  const s = LETTER_STROKES[ch];
  if (!s) throw new Error(`획이 없는 글자: ${ch}`);
  return s;
}

/** 획의 누적 길이 — lens[i] = 첫 점에서 i 번째 점까지 */
export function lengthsOf(stroke: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < stroke.length; i++) out.push(out[i - 1] + Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]));
  return out;
}

/** 획 위 s 자리의 점과 긋는 방향(라디안, 화면 기준 — 오른쪽 0, 아래 +) */
export function pointAt(stroke: readonly Pt[], lens: readonly number[], s: number): { p: Pt; angle: number } {
  const total = lens[lens.length - 1];
  const d = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i++;
  const a = stroke[i - 1];
  const b = stroke[i];
  const seg = lens[i] - lens[i - 1] || 1;
  const t = (d - lens[i - 1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

/** 앞으로만 — 손끝을 지금 자리 조금 뒤 ~ 조금 앞 사이의 획에 비춰 본다(한 바퀴 도는 O·o 나 되돌아오는 B 에서 건너뛰지 않게) */
const BACK = 6;
const AHEAD = 28;

/**
 * 손끝 p 로 획을 얼마나 그었나 — 길 위(TOLERANCE 안)면 더 간 만큼(뒤로는 안 간다), 길을 벗어났으면 그대로 + off.
 * 반환 s 는 새 자리(누적 길이).
 */
export function traceStep(stroke: readonly Pt[], lens: readonly number[], s: number, p: Pt): { s: number; off: boolean } {
  const lo = s - BACK;
  const hi = s + AHEAD;
  let best = Infinity;
  let bestS = s;
  for (let i = 1; i < stroke.length; i++) {
    if (lens[i] < lo || lens[i - 1] > hi) continue;
    const a = stroke[i - 1];
    const b = stroke[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const q: Pt = [a[0] + dx * t, a[1] + dy * t];
    const dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const along = Math.max(lo, Math.min(hi, lens[i - 1] + (lens[i] - lens[i - 1]) * t));
    if (dist < best) {
      best = dist;
      bestS = along;
    }
  }
  if (best > TOLERANCE) return { s, off: true };
  return { s: Math.max(s, bestS), off: false };
}

/** 획을 다 그었나 — 끝 조금 앞이면 다 그은 것으로 */
export function strokeDone(lens: readonly number[], s: number): boolean {
  return s >= lens[lens.length - 1] - 4;
}

/** SVG 경로 */
export function pathOf(stroke: readonly Pt[]): string {
  return stroke.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}
