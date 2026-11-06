"use client";

import { useEffect, useState } from "react";
import { Glyph, Guide, WordArt } from "@/components/Art";
import { HandHint } from "@/components/play/HandHint";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { useTurn } from "@/lib/answer";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/**
 * 말풍선 — 큰 말풍선에 오늘 글자(대문자·소문자). 누르면 글자 이름 → 대표 단어(그림이 나온다)를 들려주고 끝(업체 하루 화면의 글자 말풍선, 2026-11-06).
 * 듣기만 하는 칸이라 점수가 없다. 다 듣고 나서 저절로 길로 돌아간다.
 */
export function Bubble({ letter, onDone }: { letter: string; onDone: OnDone }) {
  const l = letterOf(letter);
  const word = l.words[0];
  const [heard, setHeard] = useState(false);
  const later = useTimers();
  const turn = useTurn();

  useEffect(() => {
    void say(LINES.bubble);
    return () => stopVoice();
  }, []);

  const tap = () => {
    sfx.wake();
    sfx.pop();
    setHeard(true);
    const alive = turn();
    void say([letter, word.en]).then(() => {
      if (alive()) later(() => onDone({ correct: 0, total: 0 }), 700);
    });
  };

  const glyph = { fontSize: "min(20vh, calc(14*var(--vw)))" };

  return (
    <ActivityFrame className="landscape:flex-row landscape:gap-[4vw]">
      <Guide size={150} mood={heard ? "cheer" : "happy"} className="animate-float" />
      <button
        type="button"
        aria-label="말풍선"
        onClick={tap}
        className={`relative flex items-center gap-[min(4vw,2rem)] rounded-[2.6rem] bg-white px-[min(7vw,3rem)] py-[min(4vh,1.6rem)] shadow-[0_18px_40px_-16px_rgb(62_58_82/0.45)] transition-transform active:scale-95 ${heard ? "" : "animate-breathe"}`}
      >
        <span aria-hidden className="absolute -bottom-3 left-[18%] h-8 w-8 rotate-45 rounded-[0.4rem] bg-white" />
        <span className="relative flex items-end gap-[0.1em]">
          <Glyph ch={l.upper} className="text-brand" style={glyph} />
          <Glyph ch={l.lower} className="text-sky-deep" style={glyph} />
        </span>
        {heard && (
          <span className="relative flex animate-pop-in flex-col items-center">
            <WordArt id={word.id} size="min(16vh, calc(12*var(--vw)))" />
            <span className="text-[min(5vh,1.8rem)] font-extrabold text-ink">{word.en}</span>
          </span>
        )}
      </button>
      <HandHint from="section button[aria-label='말풍선']" to="section button[aria-label='말풍선']" on={!heard} delay={2400} />
    </ActivityFrame>
  );
}
