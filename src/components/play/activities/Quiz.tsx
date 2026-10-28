"use client";

import { useEffect, useMemo, useState } from "react";
import { Glyph, Guide, WordArt } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { caseOf, isLetter, letterOf, wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import type { QuizRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame, CARD, CARD_ART, CARD_FONT, ChoiceCard, useChoice } from "../choice";
import type { OnDone } from "../types";
import { MarkedWord } from "./Book";

/** 퀴즈 전에 — 나올 글자와 단어를 미리 본다(업체 후기: 풀기 전에 단어장을 보여 준다). 누르면 글자 이름 → 단어 */
function Preview({ letters, onStart }: { letters: string[]; onStart: () => void }) {
  useEffect(() => {
    void say(LINES.quizPreview);
    return () => stopVoice();
  }, []);

  return (
    <ActivityFrame className="gap-[2.5vh]">
      <div className="flex items-end gap-3">
        <Guide size={110} className="animate-float" />
        <p className="title-pop mb-4 text-5xl short:mb-1 short:text-3xl">도장 퀴즈</p>
      </div>
      <div className="flex max-w-4xl flex-wrap justify-center gap-3">
        {letters.map((u) => {
          const l = letterOf(u);
          return (
            <button
              key={u}
              type="button"
              className="squish flex items-center gap-2 rounded-[1.6rem] px-3 py-2"
              onClick={() => {
                sfx.pop();
                void say([u, ...l.words.map((w) => w.en)]);
              }}
              aria-label={u}
            >
              <span className="font-letter text-3xl font-extrabold short:text-2xl">
                {l.upper}
                {l.lower}
              </span>
              {l.words.map((w) => (
                <WordArt key={w.id} id={w.id} size="min(9vh, 3.4rem)" />
              ))}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="cta rounded-full px-14 py-4 text-3xl font-extrabold"
        onClick={() => {
          sfx.wake();
          onStart();
        }}
      >
        시작!
      </button>
    </ActivityFrame>
  );
}

/** 문제 풀기 — 글자 찾기와 그림 고르기를 번갈아, 첫 시도만 점수(도장 퀴즈는 틀리면 정답을 보여 주고 다음) */
function Questions({ rounds, assess, onDone }: { rounds: QuizRound[]; assess: boolean; onDone: OnDone }) {
  const prompts = useMemo(() => rounds.map((r) => (r.type === "letter" ? [r.target, LINES.whereIs] : [wordOf(r.word).en])), [rounds]);
  const answers = useMemo(() => rounds.map((r) => (r.type === "letter" ? r.target : r.word)), [rounds]);
  const c = useChoice({ intro: LINES.quizStart, prompts, answers, assess, nameOf: (k) => [isLetter(k) ? k : wordOf(k).en], onDone });
  const round = rounds[c.idx];

  return (
    <ActivityFrame>
      <div className="flex items-center gap-4">
        <span className="glass rounded-full px-5 py-2 font-display text-2xl">
          {c.idx + 1} / {rounds.length}
        </span>
        <div key={c.idx} className="flex animate-pop-in items-center gap-4">
          <SpeakerButton text={prompts[c.idx]} size={round.type === "word" ? 120 : 140} pulse />
          {round.type === "word" && (
            <span className="rounded-[1.8rem] bg-white px-6 py-2 shadow-[0_6px_0_var(--paper-deep)]">
              <MarkedWord word={wordOf(round.word)} />
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        {round.type === "letter"
          ? round.choices.map((l) => (
              <ChoiceCard key={`${c.idx}-${l}`} c={c} k={l} label={caseOf(l, round.show)} style={CARD}>
                <Glyph ch={caseOf(l, round.show)} style={CARD_FONT} />
              </ChoiceCard>
            ))
          : round.choices.map((id) => (
              <ChoiceCard key={`${c.idx}-${id}`} c={c} k={id} label={wordOf(id).en} style={CARD}>
                <WordArt id={id} size={CARD_ART} />
              </ChoiceCard>
            ))}
      </div>
    </ActivityFrame>
  );
}

/**
 * 도장 퀴즈 — 6일째(업체의 유닛 테스트 자리). 단어 미리 보기 → 10문항 → 결과는 하루 끝 화면이 메달(동·은·금)로 보여 준다.
 */
export function Quiz({ letters, rounds, assess, onDone }: { letters: string[]; rounds: QuizRound[]; assess: boolean; onDone: OnDone }) {
  const [started, setStarted] = useState(false);
  if (!started) return <Preview letters={letters} onStart={() => setStarted(true)} />;
  return <Questions rounds={rounds} assess={assess} onDone={onDone} />;
}
