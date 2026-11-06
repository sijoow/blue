"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { HandHint } from "@/components/play/HandHint";
import { sfx } from "@/lib/sfx";
import { BASE, HEAD_REACH, LANE, LETTER_H, letterStrokes, lengthsOf, MID, pathOf, pointAt, strokeDone, TOP, traceStep, type Pt } from "@/lib/strokes";

/*
 * 알파벳 따라 쓰기 판 — 업체 Letter Writing 처럼(2026-11-06 사용자 폰에서 본 것: 글자 길 위 화살표를 따라 획 차례대로 긋는다).
 * 숫자놀이 StrokeBoard 를 글자로 옮겼다. 글자가 굵은 획 길로 그려져 있고, 노란 펜 머리(화살표)가 그을 곳과 방향을 알려 준다.
 * 펜 머리를 잡고 길을 따라 그으면 지나간 곳만 칠해진다 — 길을 벗어나거나 뒤로 가면 더 칠해지지 않는다(lib/strokes traceStep).
 * 한 획을 다 그으면 다음 획의 머리가 나오고, 글자를 다 쓰면 onSuccess. 지우기는 없다(길 밖으로는 칠해지지 않으니 지울 게 없다).
 * 시험 도구가 획을 따라 그을 수 있게 svg 에 획 점(data-strokes)을 둔다.
 */

const LANE_EDGE = "#c9e2f3";
const LANE_FILL = "#eef7fd";
const INK = "var(--brand)";

export function StrokeBoard({ ch, width, onSuccess }: { ch: string; width: string; onSuccess: () => void }) {
  const { w, strokes } = letterStrokes(ch);
  const lens = useMemo(() => strokes.map(lengthsOf), [strokes]);
  const [idx, setIdx] = useState(0);
  const [s, setS] = useState(0);
  const [done, setDone] = useState(false);
  const [off, setOff] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  // 지금 긋는 중인가(펜 머리 근처를 눌렀나) — 움직일 때마다 렌더하지 않게 ref
  const active = useRef(false);
  const cur = useRef({ idx: 0, s: 0 });

  const stroke = strokes[idx];
  const len = lens[idx];
  const head = stroke && len ? pointAt(stroke, len, s) : null;
  const aim = pointAt(strokes[0], lens[0], lens[0][lens[0].length - 1] * 0.45).p;

  /** 화면 좌표 → 판 좌표 */
  const local = (e: PointerEvent): Pt | null => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * LETTER_H];
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (done || !stroke || !len) return;
    const p = local(e);
    if (!p) return;
    const h = pointAt(stroke, len, cur.current.s).p;
    // 펜 머리 근처를 눌러야 시작 — 엉뚱한 데를 누르면 머리가 톡 흔들려 여기라고 알려 준다
    if (Math.hypot(p[0] - h[0], p[1] - h[1]) > HEAD_REACH) {
      setOff(true);
      sfx.tick();
      return;
    }
    active.current = true;
    setOff(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!active.current || done) return;
    const p = local(e);
    const { idx: i, s: now } = cur.current;
    const st = strokes[i];
    const ln = lens[i];
    if (!p || !st || !ln) return;
    const r = traceStep(st, ln, now, p);
    if (r.off) {
      // 길을 벗어났다 — 칠해지지 않고 머리가 흔들린다(한 번만 소리)
      if (!off) sfx.boop();
      setOff(true);
      return;
    }
    if (off) setOff(false);
    if (r.s <= now) return;
    if (!strokeDone(ln, r.s)) {
      cur.current = { idx: i, s: r.s };
      setS(r.s);
      return;
    }
    // 한 획 끝
    active.current = false;
    if (i + 1 < strokes.length) {
      sfx.pop();
      cur.current = { idx: i + 1, s: 0 };
      setIdx(i + 1);
      setS(0);
      return;
    }
    cur.current = { idx: i, s: ln[ln.length - 1] };
    setS(ln[ln.length - 1]);
    setDone(true);
    onSuccess();
  };

  const up = () => {
    active.current = false;
  };

  return (
    <div className={`relative rounded-[2.4rem] bg-card p-3 shadow-[0_8px_0_var(--paper-deep)] ${done ? "animate-wiggle" : ""}`} style={{ width }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${w} ${LETTER_H}`}
        className="block w-full touch-none select-none"
        style={{ aspectRatio: `${w} / ${LETTER_H}` }}
        role="img"
        aria-label={`${ch} 따라 쓰기`}
        data-strokes={JSON.stringify({ w, h: LETTER_H, strokes: strokes.map((st) => st.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])) })}
        data-stroke-now={done ? strokes.length : idx}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {/* 공책 줄 — 위 줄 · 가운데 점선 · 아래 줄(업체 Letter Writing 과 같은 세 줄) */}
        <line x1="0" x2={w} y1={TOP} y2={TOP} stroke="#e3dccd" strokeWidth="1.4" />
        <line x1="0" x2={w} y1={MID} y2={MID} stroke="#e3dccd" strokeWidth="1.4" strokeDasharray="4 4" />
        <line x1="0" x2={w} y1={BASE} y2={BASE} stroke="#e3dccd" strokeWidth="1.4" />
        {/* 획 길 */}
        {strokes.map((st, k) => (
          <g key={`lane-${k}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={pathOf(st)} stroke={LANE_EDGE} strokeWidth={LANE + 3} />
            <path d={pathOf(st)} stroke={LANE_FILL} strokeWidth={LANE} />
          </g>
        ))}
        {/* 지금 그을 획의 길잡이 — 가운데 점선 */}
        {stroke && !done && <path d={pathOf(stroke)} fill="none" stroke="#f29b8f" strokeWidth="1.8" strokeDasharray="3 5" strokeLinecap="round" />}
        {/* 칠한 곳 — 다 그은 획은 끝까지, 지금 획은 그은 만큼 */}
        {strokes.map((st, k) => {
          const total = lens[k][lens[k].length - 1];
          const drawn = done || k < idx ? total : k === idx ? s : 0;
          if (drawn < 0.5) return null;
          return (
            <path
              key={`ink-${k}`}
              d={pathOf(st)}
              fill="none"
              stroke={INK}
              strokeWidth={LANE - 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={total}
              strokeDasharray={`${drawn} ${total}`}
            />
          );
        })}
        {/* 손가락 시범이 가리킬 곳 — 첫 획 가운데쯤 */}
        <circle data-trace-aim="" cx={aim[0]} cy={aim[1]} r="1" fill="transparent" />
        {/* 펜 머리 — 그을 곳과 방향 */}
        {head && !done && (
          <g transform={`translate(${head.p[0]} ${head.p[1]}) rotate(${(head.angle * 180) / Math.PI})`}>
            <g data-trace-head="" className={off ? "animate-shake" : "animate-breathe"} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="10.5" fill="#f5b52e" stroke="#fff" strokeWidth="2.5" />
              <path d="M-4.5 0 H4.5 M1 -3.6 L4.5 0 L1 3.6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        )}
      </svg>
      {done && <span className="pointer-events-none absolute -right-4 -top-4 grid h-16 w-16 animate-pop-in place-items-center rounded-full bg-mint-deep text-4xl text-white">✓</span>}
      <HandHint on={!done && idx === 0 && s === 0} from="[data-trace-head]" to="[data-trace-aim]" delay={2200} />
    </div>
  );
}

/** 따라 쓰기 판 가로 — 글자 칸(세로로 긴 칸)이 화면 높이·폭 안에 들어가게 */
export function strokeBoardWidth(ch: string): string {
  const aspect = letterStrokes(ch).w / LETTER_H;
  return `min(calc(64vh * ${aspect.toFixed(3)}), calc(${(aspect * 70).toFixed(1)}*var(--vw)), 76vw, ${(aspect * 44).toFixed(1)}rem)`;
}
