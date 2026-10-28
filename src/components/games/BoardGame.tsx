"use client";

import { useEffect, useRef, useState } from "react";
import { WordArt } from "@/components/Art";
import { usePortrait } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { COUNT_EN } from "@/curriculum/originals";
import { imageOf } from "@/lib/assets";
import { BOARD_CELLS, type BoardGame as Board } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { BlueyToken, ChildFace } from "./art";
import { Die } from "./props";

/** 도착 칸 번호 — 0 = 출발, 1~14 = 단어 칸 */
const FINISH = BOARD_CELLS + 1;
const TONES = ["butter", "mint", "sky", "rose"] as const;

/** 가운데 큰 주사위 — key 가 바뀌면 다시 떨어진다, reveal 이면 나온 수를 크게 */
interface Drop {
  key: number;
  face: number;
  reveal: boolean;
}

function d6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** 칸 자리 — 뱀처럼 굽은 길(가로 화면 8칸 × 2줄, 세로 화면 4칸 × 4줄) */
function placeOf(p: number, cols: number): { row: number; col: number } {
  const row = Math.floor(p / cols);
  const i = p % cols;
  return { row, col: row % 2 === 0 ? i : cols - 1 - i };
}

/** 도착 칸 — 블루이 가족이 기다린다 */
function FinishArt() {
  const src = imageOf("family:cheer");
  if (!src) return <span className="text-lg font-extrabold text-brand">도착</span>;
  // eslint-disable-next-line @next/next/no-img-element -- 칸을 꽉 채우는 그림(크기를 미리 모른다)
  return <img src={src} alt="도착" className="h-full w-full object-contain p-[6%]" draggable={false} />;
}

/**
 * 주사위 말판 — 하온이랑 블루이가 번갈아 주사위를 굴려 출발 → 단어 칸 14개 → 도착(블루이 가족)까지.
 * 「주사위 굴리기」를 누르면 큰 주사위가 하늘에서 떨어져 구르다 멈추고 나온 수를 영어로 말한다(숫자놀이 윷놀이 연출).
 * 하온이 차례엔 반짝이는 칸을 하나씩 눌러 "one, two…" 세며 가고, 멈춘 칸의 그림을 영어로 들려준다. 블루이는 스스로 간다.
 * 블루이가 먼저 도착해도 하온이가 도착할 때까지 이어서 — 하온이가 도착하면 끝.
 */
export function BoardGame({ game, onDone }: { game: Board; onDone: OnDone }) {
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const posRef = useRef<[number, number]>([0, 0]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<"roll" | "step" | "busy">("roll");
  const [left, setLeft] = useState(0);
  const [count, setCount] = useState(0);
  const [face, setFace] = useState(1);
  const [drop, setDrop] = useState<Drop | null>(null);
  const drops = useRef(0);
  const [caption, setCaption] = useState<string>(LINES.boardMyTurn);
  const [landed, setLanded] = useState<number | null>(null);
  const blueyHome = useRef(false);
  const alive = useRef(true);
  const later = useTimers();
  const portrait = usePortrait();

  useEffect(() => {
    alive.current = true;
    void say([LINES.boardIntro, LINES.boardMyTurn]);
    return () => {
      alive.current = false;
      stopVoice();
    };
  }, []);

  const sleep = (ms: number) => new Promise<void>((res) => later(res, ms));
  /** 말하고 기다리기 — 화면을 떠났으면 false(그 뒤 차례를 이어 가지 않는다) */
  const speak = async (texts: string | string[]) => {
    await say(texts);
    return alive.current;
  };
  const moveTo = (who: 0 | 1, p: number) => {
    const next: [number, number] = [...posRef.current];
    next[who] = p;
    posRef.current = next;
    setPos(next);
  };

  /** 주사위 — 하늘에서 쿵 떨어져 도로로로 구르다 멈추고(globals.css die-tumble), 나온 수를 크게 보여 주며 영어로 */
  const roll = async (): Promise<number> => {
    const k = d6();
    drops.current += 1;
    setDrop({ key: drops.current, face: d6(), reveal: false });
    for (let i = 0; i < 13; i++) later(() => setDrop((d) => d && { ...d, face: d6() }), i * 110);
    later(() => sfx.drum(), 510);
    for (const t of [830, 1060, 1280, 1400, 1480, 1540]) later(() => sfx.tick(), t);
    later(() => setDrop((d) => d && { ...d, face: k }), 1420);
    await sleep(1650);
    sfx.ding();
    setFace(k);
    setDrop((d) => d && { ...d, face: k, reveal: true });
    await speak(COUNT_EN[k - 1]);
    await sleep(400);
    setDrop(null);
    return k;
  };

  const myTurn = async (): Promise<void> => {
    if (!alive.current) return;
    setTurn(0);
    setCaption(LINES.boardMyTurn);
    setPhase("roll");
    await speak(LINES.boardMyTurn);
  };

  /** 멈춘 칸 — 그림을 영어로, 그다음 차례 */
  const land = async (who: 0 | 1): Promise<void> => {
    const p = posRef.current[who];
    setLanded(p);
    sfx.ding();
    if (!(await speak(wordOf(game.cells[p - 1]).en))) return;
    await sleep(300);
    setLanded(null);
    if (who === 0 && !blueyHome.current) return blueyTurn();
    return myTurn();
  };

  const arrive = async (who: 0 | 1): Promise<void> => {
    sfx.cheer();
    if (who === 0) {
      setCaption(LINES.boardHome);
      if (!(await speak(LINES.boardHome))) return;
      onDone({ correct: blueyHome.current ? 0 : 1, total: 1 });
      return;
    }
    blueyHome.current = true;
    setCaption(LINES.boardBlueyHome);
    if (!(await speak(LINES.boardBlueyHome))) return;
    return myTurn();
  };

  /** 블루이 차례 — 스스로 굴리고 한 칸씩 세며 간다 */
  const blueyTurn = async (): Promise<void> => {
    if (!alive.current) return;
    setTurn(1);
    setPhase("busy");
    setCaption(LINES.boardBluey);
    if (!(await speak(LINES.boardBluey))) return;
    const k = await roll();
    if (!alive.current) return;
    for (let n = 1; n <= k; n++) {
      await sleep(250);
      const p = Math.min(FINISH, posRef.current[1] + 1);
      moveTo(1, p);
      sfx.pop();
      if (!(await speak(COUNT_EN[n - 1]))) return;
      if (p === FINISH) return arrive(1);
    }
    return land(1);
  };

  const onRoll = async () => {
    if (phase !== "roll") return;
    sfx.wake();
    stopVoice();
    setPhase("busy");
    const k = await roll();
    if (!alive.current) return;
    setLeft(k);
    setCount(0);
    setPhase("step");
    setCaption(LINES.boardStep);
    await speak(LINES.boardStep);
  };

  /** 하온이가 반짝이는 칸을 눌렀다 — 한 칸 가며 수를 센다 */
  const onStep = async (p: number) => {
    if (phase !== "step" || p !== posRef.current[0] + 1) return;
    const n = count + 1;
    moveTo(0, p);
    setCount(n);
    sfx.pop();
    if (p === FINISH) {
      setPhase("busy");
      if (!(await speak(COUNT_EN[n - 1]))) return;
      return arrive(0);
    }
    if (n < left) {
      void say(COUNT_EN[n - 1]);
      return;
    }
    setPhase("busy");
    if (!(await speak(COUNT_EN[n - 1]))) return;
    return land(0);
  };

  const cols = portrait ? 4 : 8;
  const cell = portrait ? "min(12vh, 21vw)" : "min(22vh, calc(10.6*var(--vw)))";
  const token = `calc(${cell} * 0.42)`;
  const nextCell = phase === "step" && turn === 0 ? pos[0] + 1 : null;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center-safe gap-[2.5vh] px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${turn === 0 ? "bg-white ring-4 ring-brand" : "bg-white/60"}`}>
          <ChildFace size="min(7vh, 2.8rem)" />
          <span className="text-lg font-extrabold">하온이</span>
        </span>
        <button
          type="button"
          onClick={() => void onRoll()}
          disabled={phase !== "roll"}
          className={`cta flex items-center gap-3 rounded-full px-6 py-3 text-2xl font-extrabold disabled:opacity-40 short:py-2 short:text-xl ${phase === "roll" ? "animate-breathe" : ""}`}
        >
          <Die face={face} size="min(7vh, 2.6rem)" />
          주사위 굴리기
        </button>
        <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${turn === 1 ? "bg-white ring-4 ring-sky-deep" : "bg-white/60"}`}>
          <BlueyToken size="min(7vh, 2.8rem)" />
          <span className="text-lg font-extrabold">블루이</span>
        </span>
      </div>
      <p className="glass min-h-[2.4rem] rounded-full px-5 py-1.5 text-center text-xl font-extrabold short:text-lg">{caption}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, ${cell})`, gridAutoRows: cell }}>
        {Array.from({ length: FINISH + 1 }, (_, p) => {
          const { row, col } = placeOf(p, cols);
          const next = nextCell === p;
          const here = [pos[0] === p, pos[1] === p];
          return (
            <button
              key={p}
              type="button"
              aria-label={p === 0 ? "출발" : p === FINISH ? "도착" : wordOf(game.cells[p - 1]).en}
              disabled={!next}
              onClick={() => void onStep(p)}
              className={`relative grid place-items-center overflow-visible rounded-[1.2rem] ${next ? "z-20 animate-breathe ring-8 ring-brand" : ""} ${landed === p ? "z-10 animate-wiggle ring-4 ring-butter-deep" : ""}`}
              style={{ gridRow: row + 1, gridColumn: col + 1, background: p === 0 || p === FINISH ? "#fff" : `var(--${TONES[p % TONES.length]})` }}
            >
              {p === 0 ? (
                <span className="text-lg font-extrabold text-brand">출발</span>
              ) : p === FINISH ? (
                <FinishArt />
              ) : (
                <WordArt id={game.cells[p - 1]} size={`calc(${cell} * ${landed === p ? 0.86 : 0.7})`} />
              )}
              {here[0] && (
                <span className={`pointer-events-none absolute -top-[18%] ${here[1] ? "-left-[10%]" : "left-1/2 -translate-x-1/2"}`}>
                  <ChildFace key={p} size={token} className="animate-pop-in shadow-md" />
                </span>
              )}
              {here[1] && (
                <span className={`pointer-events-none absolute -top-[18%] ${here[0] ? "-right-[10%]" : "left-1/2 -translate-x-1/2"}`}>
                  <BlueyToken key={p} size={token} className="animate-pop-in shadow-md" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {drop && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <div className="relative grid place-items-center">
            <span key={drop.key} className="inline-block animate-die-tumble" style={{ filter: "drop-shadow(0 14px 10px rgb(62 58 82 / 0.3))" }}>
              <Die face={drop.face} size="min(30vh, calc(24*var(--vw)))" />
            </span>
            {drop.reveal && (
              <span className="absolute -top-[22%] grid animate-pop-in place-items-center rounded-full bg-white px-8 py-1 shadow-[0_10px_0_var(--paper-deep)]">
                <span className="font-letter font-extrabold leading-none text-brand" style={{ fontSize: "min(16vh, calc(12*var(--vw)))" }}>
                  {drop.face}
                </span>
                <span className="font-letter text-3xl font-extrabold">{COUNT_EN[drop.face - 1]}!</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
