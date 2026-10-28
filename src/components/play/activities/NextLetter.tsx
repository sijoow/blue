"use client";

import { useMemo } from "react";
import { Glyph } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import type { SeqRound } from "@/lib/rounds";
import { ActivityFrame, CARD, CARD_FONT, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";

const CELL = { width: "min(15vh, calc(11*var(--vw)))", height: "min(15vh, calc(11*var(--vw)))" };
const CELL_FONT = { fontSize: "min(10vh, calc(7.5*var(--vw)))" };

/** 다음 글자 — (영어) "A" "B" "C" 를 차례로 들려주고 "다음에 올 글자는 뭘까?" — 대문자 보기 셋 */
export function NextLetter({ rounds, assess, onDone }: { rounds: SeqRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [...r.seq, LINES.nextLetter]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.answer), [rounds]);
  const c = useChoice({ intro: "", prompts, answers, assess, nameOf: (k) => [k], onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex animate-pop-in flex-wrap items-center justify-center gap-3">
        {round.seq.map((l, i) => (
          <span key={i} className="grid place-items-center rounded-[1.6rem] bg-white shadow-[0_6px_0_var(--paper-deep)]" style={CELL}>
            <Glyph ch={l} style={CELL_FONT} />
          </span>
        ))}
        <span className="grid place-items-center rounded-[1.6rem] border-4 border-dashed border-brand bg-brand-soft/60 text-brand" style={CELL}>
          <Glyph ch={c.settled ? round.answer : "?"} style={CELL_FONT} />
        </span>
        <SpeakerButton text={prompts[c.idx]} size={96} className="ml-2" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.choices.map((l) => (
          <ChoiceCard key={`${c.idx}-${l}`} c={c} k={l} label={l} style={CARD}>
            <Glyph ch={l} style={CARD_FONT} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
