"use client";

import { useEffect, useState } from "react";
import { Glyph, Guide, WordArt } from "@/components/Art";
import { ReadAlong } from "@/components/ReadAlong";
import { SpeechBubble } from "@/components/ui";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

type Step = "upper" | "lower" | "words";

/*
 * 알파벳 만나기 — 안내 친구가 "새 알파벳을 만나 볼까?" → (영어) "A".
 * 아이가 큰 글자를 누르면 "이건 큰 글자, 대문자야." → "A", 작은 글자를 누르면 "이건 작은 글자, 소문자야." → "A".
 * 둘 다 누르면 대표 단어 둘이 나온다("이 글자로 시작하는 말이야. 눌러 봐!") — 누르면 (영어) "apple" → 뜻 "사과".
 * 단어 둘을 다 들으면 「좋아!」. 점수 없는 놀이. 다음에 누를 것이 숨 쉬듯 커졌다 작아진다.
 */
export function Meet({ letter, onDone }: { letter: string; onDone: OnDone }) {
  const l = letterOf(letter);
  const [seen, setSeen] = useState<Step[]>([]);
  const [heard, setHeard] = useState<string[]>([]);
  const [line, setLine] = useState<string>(LINES.meetHi);
  const wordsOpen = seen.includes("upper") && seen.includes("lower");
  const allHeard = l.words.every((w) => heard.includes(w.id));
  const wordsLine = l.words[0].at === "end" ? LINES.meetWordsEnd : LINES.meetWords;

  useEffect(() => {
    void say([LINES.meetHi, letter]);
    return () => stopVoice();
  }, [letter]);

  const tapCase = (step: "upper" | "lower") => {
    sfx.wake();
    sfx.pop();
    const text = step === "upper" ? LINES.meetUpper : LINES.meetLower;
    const next = seen.includes(step) ? seen : [...seen, step];
    setSeen(next);
    const opens = !wordsOpen && next.includes("upper") && next.includes("lower");
    setLine(opens ? wordsLine : text);
    void say(opens ? [text, letter, wordsLine] : [text, letter]);
  };

  const tapWord = (id: string) => {
    const w = l.words.find((x) => x.id === id);
    if (!w) return;
    sfx.wake();
    sfx.pop();
    setHeard((h) => (h.includes(id) ? h : [...h, id]));
    void say([w.en, w.ko]);
  };

  const nextUp: Step | string | null = !seen.includes("upper") ? "upper" : !seen.includes("lower") ? "lower" : (l.words.find((w) => !heard.includes(w.id))?.id ?? null);
  const glyph = { fontSize: "min(24vh, calc(17*var(--vw)))" };
  const art = "min(17vh, calc(13*var(--vw)))";

  return (
    <ActivityFrame className="gap-[3vh]">
      <div className="flex items-end gap-3">
        <Guide size={110} className="animate-float" />
        <SpeechBubble tail="down" className="mb-6 max-w-[min(70vw,30rem)] portrait:text-2xl short:mb-2 short:text-xl">
          <ReadAlong text={line} />
        </SpeechBubble>
      </div>
      <div className="flex items-end justify-center gap-[4vw] portrait:gap-[6vw]">
        {(["upper", "lower"] as const).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => tapCase(step)}
            aria-label={step === "upper" ? `대문자 ${l.upper}` : `소문자 ${l.lower}`}
            className={`squish flex flex-col items-center rounded-[2.2rem] px-[3vw] pb-2 pt-3 ${seen.includes(step) ? "" : "opacity-95"} ${nextUp === step ? "hint animate-breathe" : ""}`}
          >
            <Glyph ch={step === "upper" ? l.upper : l.lower} className={step === "upper" ? "text-brand" : "text-sky-deep"} style={glyph} />
            <span className="text-xl font-extrabold text-ink-soft short:text-base">{step === "upper" ? LINES.upper : LINES.lower}</span>
          </button>
        ))}
      </div>
      {wordsOpen && (
        <div className="flex animate-pop-in flex-wrap items-center justify-center gap-5">
          {l.words.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => tapWord(w.id)}
              className={`squish flex flex-col items-center gap-1 rounded-[2rem] px-4 pb-2 pt-3 ${nextUp === w.id ? "hint animate-breathe" : ""}`}
              aria-label={w.en}
            >
              <WordArt id={w.id} size={art} />
              <span className="font-letter text-3xl font-extrabold short:text-xl">{w.en}</span>
            </button>
          ))}
          {allHeard && (
            <button type="button" className="cta animate-pop-in rounded-full px-10 py-4 text-3xl font-extrabold" onClick={() => onDone({ correct: 0, total: 0 })}>
              좋아!
            </button>
          )}
        </div>
      )}
    </ActivityFrame>
  );
}
