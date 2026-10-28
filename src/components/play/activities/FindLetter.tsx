"use client";

import { useMemo } from "react";
import { Glyph } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { caseOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import type { LetterRound } from "@/lib/rounds";
import { ActivityFrame, CARD, CARD_FONT, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";

/** 글자 찾기 — (영어) "B" + "어디 있을까?" 듣고 글자 카드 고르기. 판마다 대문자·소문자로 보인다. 스피커를 누르면 다시 들려준다 */
export function FindLetter({ rounds, assess, onDone }: { rounds: LetterRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [r.target, LINES.whereIs]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.target), [rounds]);
  const c = useChoice({ intro: LINES.findLetter, prompts, answers, assess, nameOf: (k) => [k], onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame>
      <div key={c.idx} className="animate-pop-in">
        <SpeakerButton text={prompts[c.idx]} size={168} pulse />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.choices.map((l) => (
          <ChoiceCard key={`${c.idx}-${l}`} c={c} k={l} label={caseOf(l, round.show)} style={CARD}>
            <Glyph ch={caseOf(l, round.show)} style={CARD_FONT} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
