/**
 * 길 모양 — 오늘의 길·지도가 같이 쓴다(숫자놀이 lib/railway 를 옮겨 왔다, 2026-11-05 사용자: 숫자놀이·한글나라 구성을 따른다).
 * 칸을 부드럽게 잇는 곡선을 만들고, 곡선 위 길이로 자리와 방향을 찾는다. 화면 크기(px)를 받아 그대로 px 로 돌려준다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Box {
  w: number;
  h: number;
}

export interface Track {
  /** SVG path */
  d: string;
  samples: readonly { x: number; y: number; len: number }[];
  total: number;
  /** 지나는 점마다 곡선 처음부터의 길이 */
  stops: readonly number[];
}

export interface RoadLayout {
  world: Box;
  /** 칸 하나의 크기 */
  spot: number;
  /** 칸 자리(앞뒤 길 끝은 빼고) */
  spots: readonly Pt[];
  track: Track;
  /** 칸마다 곡선 위 길이 */
  stops: readonly number[];
  /** 길을 걷는 친구 높이 */
  walker: number;
}

/** 구간 하나를 몇 조각으로 재나 */
const PIECES = 24;

/** 점들을 지나는 곡선(캣멀롬 → 3차 베지에) */
export function makeTrack(points: readonly Pt[]): Track {
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  const samples: { x: number; y: number; len: number }[] = [];
  const stops: number[] = [];
  let d = points.length ? `M${points[0].x} ${points[0].y}` : "";
  let len = 0;
  let last = points[0];
  if (last) {
    samples.push({ ...last, len: 0 });
    stops.push(0);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    for (let k = 1; k <= PIECES; k++) {
      const t = k / PIECES;
      const u = 1 - t;
      const x = u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x;
      const y = u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y;
      len += Math.hypot(x - last.x, y - last.y);
      last = { x, y };
      samples.push({ x, y, len });
    }
    stops.push(len);
  }
  return { d, samples, total: len, stops };
}

/** 곡선 위 len 자리. 끝을 넘으면 끝 자리 */
export function pointOn(t: Track, len: number): Pt {
  const s = t.samples;
  if (!s.length) return { x: 0, y: 0 };
  const l = Math.max(0, Math.min(t.total, len));
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].len <= l) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi] ?? a;
  const span = b.len - a.len;
  const f = span > 0 ? (l - a.len) / span : 0;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * 칸 n 개를 놓는다 — 가로 화면은 왼쪽→오른쪽 물결로 길게, 세로 화면은 위→아래 지그재그로 길게.
 * 화면이 더 넓으면 칸을 벌려 채우고, 모자라면 세계가 길어져 스크롤한다. 머리 쪽(위 틀)은 비워 둔다. big 은 지도(칸이 크다).
 */
export function layoutRoad(n: number, view: Box, portrait: boolean, big = false): RoadLayout {
  const count = Math.max(1, n);
  if (portrait) {
    const spot = clamp(view.w * (big ? 0.42 : 0.3), 88, big ? 230 : 170);
    const step = spot * (big ? 0.98 : 1.12);
    // 맨 위 칸 앞에 친구가 서도 위 틀에 가리지 않게
    const top = Math.max(view.h * 0.3, spot * 1.6);
    const tail = spot * 1.3;
    const roomy = (view.h - top - tail) / Math.max(1, count - 1);
    const gap = Math.max(step, roomy);
    const h = Math.max(view.h, top + (count - 1) * gap + tail);
    const spots = Array.from({ length: count }, (_, i) => ({ x: view.w * (i % 2 === 0 ? 0.31 : 0.69), y: top + i * gap }));
    const track = makeTrack([{ x: spots[0].x, y: 0 }, ...spots, { x: spots[count - 1].x, y: h }]);
    return { world: { w: view.w, h }, spot, spots, track, stops: track.stops.slice(1, count + 1), walker: spot * 0.6 };
  }
  const spot = clamp(view.h * (big ? 0.4 : 0.3), 90, big ? 260 : 190);
  const step = spot * (big ? 1.32 : 1.55);
  const pad = spot * 1.5;
  const roomy = (view.w - pad * 2) / Math.max(1, count - 1);
  const gap = Math.max(step, roomy);
  const w = Math.max(view.w, pad * 2 + (count - 1) * gap);
  const base = view.h * (big ? 0.62 : 0.66);
  const amp = view.h * (big ? 0.09 : 0.11);
  const spots = Array.from({ length: count }, (_, i) => ({ x: pad + i * gap, y: base + (i % 2 === 0 ? -amp : amp) }));
  const track = makeTrack([{ x: 0, y: base }, ...spots, { x: w, y: base }]);
  return { world: { w, h: view.h }, spot, spots, track, stops: track.stops.slice(1, count + 1), walker: spot * 0.6 };
}
