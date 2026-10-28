"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/Art";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { MatchRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { DragGhost, useDragDrop } from "../drag";
import { ActivityFrame } from "../choice";
import { LetterTile, TILE, TILE_FONT } from "../tiles";
import type { OnDone } from "../types";

/**
 * 짝꿍 찾기 — 위의 대문자를 끌어서 아래 짝꿍 소문자 위에 놓는다(판마다 둘~셋 쌍). 끌어 놓기는 사용자가 좋아한 방식(숫자놀이 2026-10-27).
 * 맞게 놓으면 그 글자 이름(영어), 마지막 짝이면 딩동댕 + 칭찬. 틀리게 놓으면 땡 — 보통 판은 그 대문자의 짝꿍 자리가 숨 쉬듯 커졌다 작아진다.
 * 점수는 판마다 — 한 번도 틀리지 않고 다 맞히면 1.
 */
export function MatchCase({ rounds, assess, onDone }: { rounds: MatchRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const round = rounds[idx];

  useEffect(() => {
    void say(LINES.matchCase);
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
    const at = zone.startsWith("m:") ? zone.slice(2) : null;
    if (!at || placed.includes(at) || placed.includes(letter)) return;
    const alive = turn();
    if (at === letter) {
      const next = [...placed, letter];
      setPlaced(next);
      if (hint === letter) setHint(null);
      if (next.length < round.top.length) {
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

  return (
    <ActivityFrame>
      <div key={`top-${idx}`} className="flex animate-pop-in flex-wrap items-center justify-center gap-5">
        {round.top.map((l) =>
          placed.includes(l) ? (
            <span key={l} aria-hidden className="invisible" style={TILE} />
          ) : (
            <LetterTile key={l} ch={l} tone="sky" className={drag?.item === l ? "opacity-30" : ""} onGrab={begin(l)} />
          ),
        )}
      </div>
      <p className="glass rounded-full px-5 py-1.5 text-lg font-bold text-ink-soft short:py-1 short:text-base">대문자를 끌어서 짝꿍에게!</p>
      <div key={`bottom-${idx}`} className="flex animate-pop-in flex-wrap items-center justify-center gap-5">
        {round.bottom.map((l) => {
          const done = placed.includes(l);
          const over = drag?.over === `m:${l}`;
          return (
            <span
              key={l}
              data-drop={`m:${l}`}
              aria-label={letterOf(l).lower}
              className={`grid place-items-center rounded-[1.8rem] border-4 transition-colors ${
                done ? "border-transparent bg-mint" : over ? "border-brand bg-brand-soft" : "border-dashed border-paper-deep bg-white"
              } ${shake === l ? "animate-shake" : ""} ${!done && hint === l ? "hint animate-breathe" : ""}`}
              style={TILE}
            >
              {done ? (
                <span className="flex items-end gap-[0.06em]" style={TILE_FONT}>
                  <Glyph ch={l} className="text-[0.8em]" />
                  <Glyph ch={letterOf(l).lower} className="text-[0.8em]" />
                </span>
              ) : (
                <Glyph ch={letterOf(l).lower} style={TILE_FONT} />
              )}
            </span>
          );
        })}
      </div>
      <DragGhost drag={drag}>{(l) => <LetterTile ch={l} tone="sky" />}</DragGhost>
    </ActivityFrame>
  );
}
