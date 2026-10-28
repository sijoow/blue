"use client";

import { useMemo } from "react";
import { Glyph, WordArt } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { letterOf, wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { wordGap, type MissingRound } from "@/lib/rounds";
import { say } from "@/lib/voice";
import { DragGhost, useDragDrop } from "../drag";
import { ActivityFrame, useChoice } from "../choice";
import { LetterTile } from "../tiles";
import type { OnDone } from "../types";

const WORD_FONT = { fontSize: "min(11vh, calc(8.5*var(--vw)))" };

/**
 * 빈칸 글자 — 단어 그림 + 글자 하나가 빈 단어(_pple · bo_). (영어) "apple" 을 듣고, 아래 소문자 셋 중 맞는 글자를 끌어다 빈칸에 놓는다.
 * 사용자는 고르기보다 끌어 놓기를 좋아한다(숫자놀이 2026-10-27). 빈칸에 놓으면 고른 것 — 정답 반응은 보기 고르기와 같다(choice).
 * 맞으면 글자 이름 다음에 단어를 한 번 더("A" → "apple"). 조각을 그냥 톡 누르면 그 글자 이름만 들려준다.
 */
export function MissingLetter({ rounds, assess, onDone }: { rounds: MissingRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => [wordOf(r.word).en]), [rounds]);
  const answers = useMemo(() => rounds.map((r) => r.answer), [rounds]);
  const c = useChoice({
    intro: LINES.missing,
    prompts,
    answers,
    assess,
    // 맞힌 글자면 글자 이름 → 단어("A", "apple"), 틀린 글자는 이름만
    nameOf: (k, i) => (k === rounds[i].answer ? [k, wordOf(rounds[i].word).en] : [k]),
    onDone,
  });
  const round = rounds[c.idx];
  const [before, after] = wordGap(round.word);
  const { drag, begin } = useDragDrop<string>((l, zone) => {
    if (zone === "slot") c.choose(l);
    else if (!zone) void say(l);
  });
  const over = drag?.over === "slot";

  return (
    <ActivityFrame>
      <div key={c.idx} className="flex animate-pop-in items-center gap-[4vw] short:gap-6 portrait:flex-col portrait:gap-3">
        <span className="grid place-items-center rounded-[2rem] bg-white/80 p-2 ring-1 ring-white">
          <WordArt id={round.word} size="min(26vh, calc(20*var(--vw)))" />
        </span>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center rounded-[1.8rem] bg-white px-5 py-3 shadow-[0_8px_0_var(--paper-deep)]" style={WORD_FONT}>
            {before && <Glyph ch={before} />}
            <span
              data-drop="slot"
              className={`mx-1 inline-grid min-w-[1.1em] place-items-center rounded-[0.35em] border-[0.06em] border-dashed px-[0.08em] transition-colors ${
                c.settled ? "border-transparent bg-mint text-ink" : over ? "border-brand bg-brand-soft" : "border-brand/70 bg-paper"
              }`}
              style={{ height: "1.15em" }}
            >
              <Glyph ch={c.settled ? letterOf(round.answer).lower : " "} />
            </span>
            {after && <Glyph ch={after} />}
          </div>
          <SpeakerButton text={prompts[c.idx]} size={96} pulse />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.choices.map((l) => {
          const used = c.settled && l === round.answer;
          return (
            <LetterTile
              key={`${c.idx}-${l}`}
              ch={letterOf(l).lower}
              label={l}
              tone={c.hintOn(l) ? "butter" : "card"}
              dim={c.wasWrong(l) || used}
              className={`${c.hintOn(l) ? "hint animate-breathe" : ""} ${c.stateOf(l) === "wrong" ? "animate-shake" : ""} ${drag?.item === l ? "opacity-30" : ""}`}
              onGrab={c.settled || c.wasWrong(l) ? undefined : begin(l)}
            />
          );
        })}
      </div>
      <DragGhost drag={drag}>{(l) => <LetterTile ch={letterOf(l).lower} tone="butter" />}</DragGhost>
    </ActivityFrame>
  );
}
