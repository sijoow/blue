"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Glyph } from "@/components/Art";
import { HandHint } from "@/components/play/HandHint";
import { usePortrait } from "@/components/ui";
import { ALPHABET } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { PuzzleRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import { DragGhost, useDragDrop } from "../drag";
import { letterColor, LetterTile } from "../tiles";
import type { OnDone } from "../types";

/**
 * 글자 퍼즐 — A~Z 나무 판에서 빈 자리에 글자 조각을 끌어 넣는다(업체 Alphabet Puzzle, 2026-11-06 사용자 폰에서 봄).
 * 판은 두 글자씩 → 마지막 판은 모아서(lib/rounds groupRounds). 맞는 자리에 놓으면 글자 이름, 마지막 조각이면 딩동댕 + 칭찬.
 * 다른 자리에 놓으면 땡 — 보통 판은 그 조각이 들어갈 자리가 숨 쉬듯 커졌다 작아진다. 점수는 판마다(한 번도 안 틀리면 1).
 */
export function Puzzle({ rounds, assess, onDone }: { rounds: PuzzleRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const round = rounds[idx];
  // 조각은 판마다 차례를 돌려서 — 자리 차례 그대로 늘어서지 않게
  const pieces = round.slots.map((_, k) => round.slots[(k + idx + 1) % round.slots.length]).filter((l) => !placed.includes(l));

  useEffect(() => {
    void say(LINES.puzzle);
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
  };

  const { drag, begin } = useDragDrop<string>((letter, zone) => {
    if (!zone) {
      void say(letter);
      return;
    }
    const at = zone.startsWith("p:") ? zone.slice(2) : null;
    if (!at || placed.includes(at)) return;
    const alive = turn();
    if (at === letter) {
      const next = [...placed, letter];
      setPlaced(next);
      if (hint === letter) setHint(null);
      if (next.length < round.slots.length) {
        sfx.ding();
        void say(letter);
        return;
      }
      const nextScore = missed ? score : score + 1;
      setScore(nextScore);
      void answerFeedback({ name: [letter], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 500));
      return;
    }
    setMissed(true);
    setShake(at);
    if (!assess) setHint(letter);
    void answerFeedback({ name: [letter], right: false, then: assess ? [] : [pick(LINES.retry)], alive });
    later(() => setShake((s) => (s === at ? null : s)), 600);
  });

  const cell = portrait ? "min(14.5vw, 7.4vh)" : "min(12.5vh, calc(6.4*var(--vw)))";
  const board: CSSProperties = { gridTemplateColumns: `repeat(${portrait ? 5 : 7}, ${cell})`, gridAutoRows: cell };

  return (
    <ActivityFrame className="gap-[3vh] landscape:flex-row landscape:gap-[3vw]">
      <div key={`board-${idx}`} className="grid animate-pop-in gap-[0.35rem] rounded-[1.8rem] bg-[#e7c38d] p-3 shadow-[inset_0_-6px_0_rgb(150_100_50/0.25),0_10px_24px_-12px_rgb(90_60_30/0.5)]" style={board}>
        {ALPHABET.map((l) => {
          const slot = round.slots.includes(l);
          const filled = !slot || placed.includes(l);
          const over = drag?.over === `p:${l}`;
          return (
            <span
              key={l}
              data-drop={slot ? `p:${l}` : undefined}
              aria-label={slot && !filled ? `${l} 자리` : l}
              className={`grid place-items-center rounded-[0.9rem] ${slot && !filled ? `border-[3px] border-dashed ${over ? "border-brand bg-brand-soft" : "border-[#a87a45] bg-[#d6ac70]"}` : ""} ${shake === l ? "animate-shake" : ""} ${hint === l && !filled ? "hint animate-breathe" : ""} ${slot && placed.includes(l) ? "animate-pop-in" : ""}`}
            >
              <Glyph ch={l} style={{ fontSize: `calc(${cell} * 0.72)`, color: filled ? letterColor(l) : "rgb(120 80 40 / 0.28)" }} />
            </span>
          );
        })}
      </div>
      <div key={`pieces-${idx}`} className="flex min-h-[min(17vh,calc(13*var(--vw)))] animate-pop-in flex-wrap items-center justify-center gap-3 landscape:max-w-[calc(30*var(--vw))]">
        {pieces.map((l) => (
          <LetterTile key={l} ch={l} color={letterColor(l)} className={drag?.item === l ? "opacity-30" : ""} onGrab={begin(l)} />
        ))}
      </div>
      <DragGhost drag={drag}>{(l) => <LetterTile ch={l} color={letterColor(l)} />}</DragGhost>
      <HandHint from={`section [role=button][aria-label="${pieces[0]}"]`} to={`[data-drop="p:${pieces[0]}"]`} on={idx === 0 && !assess && placed.length === 0 && pieces.length > 0} />
    </ActivityFrame>
  );
}
