"use client";

import { useEffect, useState } from "react";
import { Glyph, Guide } from "@/components/Art";
import { HandHint } from "@/components/play/HandHint";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { BridgeRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import { DragGhost, useDragDrop } from "../drag";
import { LetterTile } from "../tiles";
import type { OnDone } from "../types";

/** 블루이가 다리를 건너는 시간 */
const CROSS_MS = 1800;

/**
 * 다리 잇기 — 알파벳 차례로 이어진 글자 다리에 빈칸이 있다. 아래 글자 조각을 끌어 빈칸에 넣어 다리를 잇는다(업체 Break n Build, 2026-11-06 사용자 폰에서 봄).
 * 1판은 첫째·셋째 칸, 2판은 둘째·넷째 칸, 마지막 판은 다 비어 있다(lib/rounds bridgeRounds). 다 이으면 블루이가 다리를 건너간다(눈에 보이는 변화).
 * 다른 칸에 놓거나 덤 조각을 놓으면 땡 — 보통 판은 그 조각이 들어갈 칸이 숨 쉰다. 점수는 판마다.
 */
export function Bridge({ rounds, assess, onDone }: { rounds: BridgeRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [crossed, setCrossed] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const round = rounds[idx];
  const left = round.pieces.filter((l) => !placed.includes(l));

  useEffect(() => {
    void say(LINES.bridge);
    return () => stopVoice();
  }, []);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setPlaced([]);
    setMissed(false);
    setHint(null);
    setCrossed(false);
  };

  const { drag, begin } = useDragDrop<string>((letter, zone) => {
    if (!zone) {
      void say(letter);
      return;
    }
    const at = zone.startsWith("b:") ? zone.slice(2) : null;
    if (!at || placed.includes(at)) return;
    const alive = turn();
    if (at === letter) {
      const next = [...placed, letter];
      setPlaced(next);
      if (hint === letter) setHint(null);
      if (next.length < round.gaps.length) {
        sfx.ding();
        void say(letter);
        return;
      }
      // 다리가 다 이어졌다 — 글자를 차례로 읽고 블루이가 건너간다
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      void answerFeedback({ name: round.run, right: true, then: [LINES.bridgeDone], alive }).then((ok) => {
        if (!ok) return;
        setCrossed(true);
        sfx.sparkle();
        later(() => {
          void say(pick(LINES.praise));
          later(() => advance(nextScore), 900);
        }, CROSS_MS);
      });
      return;
    }
    setMissed(true);
    setShake(at);
    if (!assess && round.gaps.includes(letter)) setHint(letter);
    void answerFeedback({ name: [letter], right: false, then: assess ? [] : [pick(LINES.retry)], alive });
    later(() => setShake((s) => (s === at ? null : s)), 600);
  });

  const guide = 96;
  // 칸 크기 — 조각과 같은 크기, 다리가 길면(어려운 판) 화면 폭에 맞춰 줄인다
  const block = `min(17vh, calc(13*var(--vw)), calc((100vw - 3.5rem) / ${round.run.length} - 0.3rem))`;
  const blockFont = { fontSize: `calc(${block} * 0.68)` };

  return (
    <ActivityFrame>
      <div key={`bridge-${idx}`} className="flex animate-pop-in flex-col items-stretch">
        {/* 블루이 — 다리 왼쪽 끝에 서 있다가 다 이으면 오른쪽 끝까지 */}
        <div className="relative h-[min(16vh,6.5rem)]">
          <span className="absolute bottom-0 transition-[left] ease-in-out" style={{ left: crossed ? `calc(100% - ${guide}px)` : 0, transitionDuration: `${CROSS_MS}ms` }}>
            <span className={`block ${crossed ? "animate-walk" : ""}`}>
              <Guide size={guide} mood={crossed ? "cheer" : "happy"} />
            </span>
          </span>
        </div>
        <div className="flex items-center rounded-[1.2rem] bg-[#a8d8f0] p-2 shadow-[inset_0_-8px_0_rgb(40_120_180/0.25)]">
          {round.run.map((l) => {
            const gap = round.gaps.includes(l) && !placed.includes(l);
            const over = drag?.over === `b:${l}`;
            return (
              <span
                key={l}
                data-drop={round.gaps.includes(l) ? `b:${l}` : undefined}
                aria-label={gap ? `${l} 빈칸` : l}
                className={`mx-[0.15rem] grid place-items-center rounded-[1rem] border-[3px] ${
                  gap ? `border-dashed ${over ? "border-brand bg-brand-soft" : "border-[#2f7fb3] bg-[#5aa8d6]/60"}` : "border-white bg-[#eaf7ff] shadow-[0_5px_0_#b9dcef]"
                } ${shake === l ? "animate-shake" : ""} ${hint === l && gap ? "hint animate-breathe" : ""} ${!gap && round.gaps.includes(l) ? "animate-pop-in" : ""}`}
                style={{ width: block, height: block }}
              >
                {!gap && <Glyph ch={l} className="text-[#1f4f7a]" style={blockFont} />}
              </span>
            );
          })}
        </div>
        <div aria-hidden className="mx-3 h-[min(5vh,1.6rem)] rounded-b-[1.2rem] bg-[#6cbbe8]/50" />
      </div>
      <div key={`pieces-${idx}`} className="flex min-h-[min(17vh,calc(13*var(--vw)))] animate-pop-in flex-wrap items-center justify-center gap-3">
        {!crossed && left.map((l) => <LetterTile key={l} ch={l} tone="sky" className={drag?.item === l ? "opacity-30" : ""} onGrab={begin(l)} />)}
      </div>
      <DragGhost drag={drag}>{(l) => <LetterTile ch={l} tone="sky" />}</DragGhost>
      <HandHint from={`section [role=button][aria-label="${round.gaps[0]}"]`} to={`[data-drop="b:${round.gaps[0]}"]`} on={idx === 0 && !assess && placed.length === 0} />
    </ActivityFrame>
  );
}
