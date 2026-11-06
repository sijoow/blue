"use client";

import { useEffect, useState } from "react";
import { WordArt } from "@/components/Art";
import { HandHint } from "@/components/play/HandHint";
import { usePortrait } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { PairRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import { DragGhost, useDragDrop } from "../drag";
import type { OnDone } from "../types";

/** 카드마다 살짝 기울여 — 책상 위에 흩어 놓은 것처럼(판마다 같은 자리에 같은 기울기) */
const TILT = [-5, 4, -2, 6, 3, -6, 5, -3];

/**
 * 그림 짝꿍 — 같은 그림 카드끼리 끌어 겹친다(업체 Literacy Matching, 2026-11-06 사용자 폰에서 봄). 겹치면 그 단어를 영어로.
 * 판은 두 쌍씩 → 마지막 판은 모아서(넷까지). 다른 그림에 놓으면 땡 — 보통 판은 짝이 숨 쉰다. 점수는 판마다.
 */
export function Pair({ rounds, assess, onDone }: { rounds: PairRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [matched, setMatched] = useState<number[]>([]);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const round = rounds[idx];

  useEffect(() => {
    void say(LINES.pair);
    return () => stopVoice();
  }, []);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setMatched([]);
    setMissed(false);
    setHint(null);
  };

  const twinOf = (i: number) => round.cards.findIndex((w, j) => j !== i && w === round.cards[i]);

  const { drag, begin } = useDragDrop<number>((i, zone) => {
    const word = round.cards[i];
    if (!zone?.startsWith("c:")) {
      if (!zone) void say(wordOf(word).en);
      return;
    }
    const j = Number(zone.slice(2));
    if (j === i || matched.includes(j)) return;
    const alive = turn();
    if (round.cards[j] === word) {
      const next = [...matched, i, j];
      setMatched(next);
      setHint(null);
      if (next.length < round.cards.length) {
        sfx.ding();
        void say(wordOf(word).en);
        return;
      }
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      void answerFeedback({ name: [wordOf(word).en], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 500));
      return;
    }
    setMissed(true);
    setShake(j);
    if (!assess) setHint(twinOf(i));
    void answerFeedback({ name: [wordOf(round.cards[j]).en], right: false, then: assess ? [] : [pick(LINES.retry)], alive });
    later(() => setShake((s) => (s === j ? null : s)), 600);
  });

  const n = round.cards.length;
  const cols = portrait ? (n <= 4 ? 2 : 3) : Math.min(4, n);
  const size = portrait ? "min(17vh, 26vw)" : "min(25vh, calc(12.5*var(--vw)))";
  const firstTwin = twinOf(0);

  return (
    <ActivityFrame>
      <div key={idx} className="grid animate-pop-in gap-[min(3vh,1.4rem)] rounded-[2rem] bg-[#d9b384]/45 p-5" style={{ gridTemplateColumns: `repeat(${cols}, ${size})` }}>
        {round.cards.map((w, i) => {
          const gone = matched.includes(i);
          const over = drag?.over === `c:${i}` && drag.item !== i;
          return (
            <span
              key={i}
              role="button"
              data-card={i}
              data-drop={gone ? undefined : `c:${i}`}
              aria-label={wordOf(w).en}
              onPointerDown={gone ? undefined : begin(i)}
              className={`grid cursor-grab select-none place-items-center rounded-[1.6rem] border-4 bg-white shadow-[0_8px_0_rgb(120_80_40/0.22)] transition-[opacity,transform] duration-300 ${over ? "border-brand bg-brand-soft" : "border-white"} ${
                gone ? "scale-90 opacity-0" : ""
              } ${drag?.item === i ? "opacity-30" : ""} ${shake === i ? "animate-shake" : ""} ${hint === i ? "hint animate-breathe" : ""}`}
              style={{ width: size, height: size, rotate: `${TILT[(i + idx) % TILT.length]}deg`, touchAction: "none" }}
            >
              <WordArt id={w} size={`calc(${size} * 0.78)`} />
            </span>
          );
        })}
      </div>
      <DragGhost drag={drag}>
        {(i) => (
          <span className="grid place-items-center rounded-[1.6rem] border-4 border-white bg-white" style={{ width: size, height: size }}>
            <WordArt id={round.cards[i]} size={`calc(${size} * 0.78)`} />
          </span>
        )}
      </DragGhost>
      <HandHint from={`section [data-card="0"]`} to={`section [data-card="${firstTwin}"]`} on={idx === 0 && !assess && matched.length === 0 && firstTwin > 0} />
    </ActivityFrame>
  );
}
