"use client";

import { useEffect, useState } from "react";
import { WordArt } from "@/components/Art";
import { StrokeBoard, strokeBoardWidth } from "@/components/StrokeBoard";
import { MarkedWord } from "@/components/play/activities/Book";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../types";

/** 대문자인지 — 소문자면 "소문자" 라고 먼저 말해 준다 */
const isUpper = (ch: string) => ch === ch.toUpperCase();

/** 읽어 줄 말 — "대문자" + (영어) "A" */
export function traceLines(ch: string): string[] {
  return [isUpper(ch) ? LINES.upper : LINES.lower, ch.toUpperCase()];
}

/**
 * 알파벳 따라 쓰기 — 업체 Letter Writing 처럼 노란 펜 머리에서 시작해 획 길을 차례대로 따라 긋는다(components/StrokeBoard — 길 밖으로는 칠해지지 않는다,
 * 2026-11-06 사용자 폰에서 본 것. 숫자놀이·한글나라와 같은 방식). 다 쓰면 업체처럼 그 글자 단어 카드(Apple)가 나오고 글자 → 단어 → 칭찬, 다 들으면 저절로 다음 글자.
 */
export function Trace({ chars, onDone }: { chars: string[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [card, setCard] = useState(false);
  const later = useTimers();
  const turn = useTurn();
  const ch = chars[idx];
  const word = letterOf(ch.toUpperCase()).words[0];

  useEffect(() => {
    void say([LINES.trace, ...traceLines(chars[0])]);
    return () => stopVoice();
  }, [chars]);

  const success = () => {
    sfx.cheer();
    setCard(true);
    const alive = turn();
    void say([ch.toUpperCase(), word.en, pick(LINES.praise)]).then(() => {
      if (!alive()) return;
      later(() => {
        setCard(false);
        if (idx + 1 >= chars.length) {
          onDone({ correct: 0, total: 0 });
          return;
        }
        setIdx(idx + 1);
        void say(traceLines(chars[idx + 1]));
      }, 500);
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
      <StrokeBoard key={idx} ch={ch} width={strokeBoardWidth(ch)} onSuccess={success} />
      <div className="flex flex-col items-center gap-5 portrait:gap-3">
        <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{isUpper(ch) ? LINES.upper : LINES.lower}</span>
        {/* 다 쓰면 그 글자 단어 카드(업체 Letter Writing 의 Apple 카드 자리) */}
        <span className={`flex flex-col items-center rounded-[1.8rem] bg-white px-5 py-3 shadow-[0_8px_0_var(--paper-deep)] transition-opacity ${card ? "animate-pop-in opacity-100" : "opacity-0"}`} aria-hidden={!card}>
          <WordArt id={word.id} size="min(18vh, calc(14*var(--vw)))" />
          <MarkedWord word={word} />
        </span>
        <div className="flex gap-2">
          {chars.map((it, i) => (
            <span key={`${it}-${i}`} className={`h-4 rounded-full ${i === idx ? "w-10 bg-brand" : i < idx ? "w-4 bg-butter-deep" : "w-4 bg-paper-deep"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
