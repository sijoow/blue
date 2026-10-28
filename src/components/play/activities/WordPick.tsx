"use client";

import { useMemo } from "react";
import { WordArt } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import type { WordRound } from "@/lib/rounds";
import { ActivityFrame, CARD, CARD_ART, ChoiceCard, useChoice } from "../choice";
import { MarkedWord } from "./Book";
import type { OnDone } from "../types";

/** 그림 고르기 — (영어) "apple" 듣고 그림 셋 중에. 들려주는 단어를 글자로도 보여 준다(2026-10-28 사용자). 누른 그림의 영어 이름을 먼저 들려줘서 틀려도 단어를 하나 더 듣는다 */
export function WordPick({ rounds, assess, onDone }: { rounds: WordRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [wordOf(r.word).en]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.word), [rounds]);
  const c = useChoice({ intro: LINES.wordPick, prompts, answers, assess, nameOf: (k) => [wordOf(k).en], onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex animate-pop-in items-center gap-4">
        <SpeakerButton text={prompts[c.idx]} size={140} pulse />
        <span className="rounded-[1.8rem] bg-white px-6 py-2 shadow-[0_6px_0_var(--paper-deep)]">
          <MarkedWord word={wordOf(round.word)} />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.choices.map((id) => (
          <ChoiceCard key={`${c.idx}-${id}`} c={c} k={id} label={wordOf(id).en} style={CARD}>
            <WordArt id={id} size={CARD_ART} />
          </ChoiceCard>
        ))}
      </div>
    </ActivityFrame>
  );
}
