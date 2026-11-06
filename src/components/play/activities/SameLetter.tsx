"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/Art";
import { HandHint } from "@/components/play/HandHint";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { SameRound } from "@/lib/rounds";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import { DragGhost, useDragDrop } from "../drag";
import { letterColor, LetterTile, TILE, TILE_FONT } from "../tiles";
import type { OnDone } from "../types";

/**
 * 같은 글자 찾기 — 그루터기 위 글자 카드와 똑같은 글자 조각을 골라 옆 빈칸에 끌어 놓는다(업체 Find The Pair, 2026-11-06 사용자 폰에서 봄).
 * 업체는 글꼴을 바꿔 "모양이 조금 달라도 같은 글자"를 보여 준다 — 우리는 글꼴이 프리텐다드 하나라(사용자 규칙) 굵기와 색을 바꾼다(카드는 얇은 갈색, 조각은 굵은 색).
 * 글자는 A → B → C → D 차례로(lib/rounds inTurn). 맞으면 글자 이름 → 딩동댕 → 칭찬, 틀린 조각은 제자리로 돌아가고 땡.
 */
export function SameLetter({ rounds, assess, onDone }: { rounds: SameRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const round = rounds[idx];

  useEffect(() => {
    void say([LINES.same, rounds[0].target]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setDone(false);
    setTried([]);
    void say(rounds[idx + 1].target);
  };

  const { drag, begin } = useDragDrop<string>((letter, zone) => {
    if (zone !== "same") {
      if (!zone) void say(letter);
      return;
    }
    if (done) return;
    const alive = turn();
    if (letter === round.target) {
      setDone(true);
      const nextScore = tried.length ? score : score + 1;
      setScore(nextScore);
      void answerFeedback({ name: [letter], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 500));
      return;
    }
    setTried((t) => [...t, letter]);
    setShake(true);
    later(() => setShake(false), 600);
    void answerFeedback({ name: [letter], right: false, then: assess ? [] : [pick(LINES.retry), round.target], alive });
  });

  const over = drag?.over === "same";
  const hintOn = !assess && tried.length > 0 && !done;

  return (
    <ActivityFrame>
      {/* 그루터기 — 글자 카드와 빈칸 */}
      <div key={`stump-${idx}`} className="flex animate-pop-in items-center gap-4 rounded-[2.4rem] bg-[#c99a62] px-6 py-4 shadow-[inset_0_-10px_0_rgb(110_70_30/0.35),0_10px_20px_-10px_rgb(90_60_30/0.5)]">
        <span data-target={round.target} className="grid place-items-center rounded-[1.6rem] bg-white shadow-[0_6px_0_rgb(110_70_30/0.25)]" style={TILE}>
          <Glyph ch={round.target} className="text-[#6b3f1f]" style={{ ...TILE_FONT, fontWeight: 500 }} />
        </span>
        <span
          data-drop="same"
          aria-label="빈칸"
          className={`grid place-items-center rounded-[1.6rem] border-[3px] ${done ? "border-transparent bg-white" : over ? "border-dashed border-brand bg-brand-soft" : "border-dashed border-[#8a5d2c] bg-[#b88850]/60"} ${shake ? "animate-shake" : ""}`}
          style={TILE}
        >
          {done && <Glyph ch={round.target} className="animate-pop-in" style={{ ...TILE_FONT, fontWeight: 900, color: letterColor(round.target) }} />}
        </span>
      </div>
      <div key={`pieces-${idx}`} className="flex animate-pop-in flex-wrap items-center justify-center gap-4">
        {round.choices.map((l) => {
          const used = done && l === round.target;
          return (
            <LetterTile
              key={l}
              ch={l}
              color={letterColor(l)}
              dim={tried.includes(l) || used}
              className={`${hintOn && l === round.target ? "hint animate-breathe" : ""} ${drag?.item === l ? "opacity-30" : ""}`}
              onGrab={done || tried.includes(l) ? undefined : begin(l)}
            />
          );
        })}
      </div>
      <DragGhost drag={drag}>{(l) => <LetterTile ch={l} color={letterColor(l)} />}</DragGhost>
      <HandHint from={`section [role=button][aria-label="${round.target}"]`} to={`[data-drop="same"]`} on={idx === 0 && !assess && !done && tried.length === 0} />
    </ActivityFrame>
  );
}
