"use client";

import { useEffect, useState } from "react";
import { Family, Glyph, WordArt } from "@/components/Art";
import { UiIcon } from "@/components/ui";
import { letterOf, letterSpot, type Word } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

type Page = { type: "cover" } | { type: "word"; letter: string; word: Word } | { type: "end" };

/** 그림책 쪽 — 표지 → 글자마다 단어 쪽(글자가 넷 이하면 둘 다, 많으면 첫 단어만) → 끝 */
export function bookPages(letters: readonly string[]): Page[] {
  const short = letters.length <= 4;
  const words = letters.flatMap((u) => {
    const ws = letterOf(u).words;
    return (short ? ws : ws.slice(0, 1)).map((word): Page => ({ type: "word", letter: u, word }));
  });
  return [{ type: "cover" }, ...words, { type: "end" }];
}

/** 단어 — 배우는 글자 자리만 대표색으로("apple" 의 a, "box" 의 x). 그림책·그림 고르기·도장 퀴즈가 같이 쓴다 */
export function MarkedWord({ word }: { word: Word }) {
  const at = letterSpot(word);
  return (
    <span className="font-letter font-extrabold leading-none" style={{ fontSize: "min(11vh, calc(8.5*var(--vw)))" }}>
      {word.en.slice(0, at)}
      <span className="text-brand">{word.en[at]}</span>
      {word.en.slice(at + 1)}
    </span>
  );
}

/**
 * 그림책 — 업체 하루의 그림책 자리(Read Aloud·단어 듣기). 블루이 가족 표지 → 단어 쪽마다 (영어) 글자 이름 → 단어를 읽어 주고, 그림을 누르면 다시.
 * 쪽은 아이가 ▶ 로 넘긴다(읽어 준 뒤 ▶ 가 숨 쉰다). 점수 없는 놀이.
 */
export function Book({ letters, onDone }: { letters: string[]; onDone: OnDone }) {
  const key = letters.join("");
  const pages = bookPages([...key]);
  const [at, setAt] = useState(0);
  const [read, setRead] = useState(false);
  const page = pages[at];
  const title = letters.length > 6 ? `${letters[0]} ~ ${letters[letters.length - 1]}` : letters.join(" ");

  // 쪽이 바뀔 때마다 읽어 준다
  useEffect(() => {
    let alive = true;
    const p = bookPages([...key])[at];
    const texts = p.type === "cover" ? [LINES.bookIntro] : p.type === "end" ? [LINES.bookEnd] : [p.letter, p.word.en];
    void say(texts).then(() => {
      if (alive) setRead(true);
    });
    return () => {
      alive = false;
      stopVoice();
    };
  }, [at, key]);

  const go = (d: number) => {
    sfx.wake();
    sfx.pop();
    setRead(false);
    setAt((a) => Math.max(0, Math.min(pages.length - 1, a + d)));
  };

  const box = { width: "min(78vw, calc((100dvh - 12rem) * 1.25))" };

  return (
    <ActivityFrame className="gap-[2.5vh]">
      <div key={at} className="flex aspect-[5/4] animate-pop-in flex-col items-center justify-center gap-3 rounded-[2.4rem] bg-white p-5 shadow-[0_12px_0_var(--paper-deep)] portrait:aspect-[4/5]" style={box}>
        {page.type === "cover" && (
          <>
            <Family size={220} />
            <p className="title-pop text-center text-5xl short:text-3xl">{title}</p>
          </>
        )}
        {page.type === "word" && (
          <button type="button" className="flex flex-col items-center gap-3" onClick={() => void say([page.letter, page.word.en])} aria-label={page.word.en}>
            <span className="flex items-end gap-1">
              <Glyph ch={page.letter} className="text-brand" style={{ fontSize: "min(9vh, calc(6*var(--vw)))" }} />
              <Glyph ch={letterOf(page.letter).lower} className="text-sky-deep" style={{ fontSize: "min(9vh, calc(6*var(--vw)))" }} />
            </span>
            <WordArt id={page.word.id} size="min(30vh, calc(30*var(--vw)))" />
            <MarkedWord word={page.word} />
          </button>
        )}
        {page.type === "end" && (
          <>
            <Family size={220} mood="cheer" />
            <p className="title-pop text-center text-5xl short:text-3xl">The End</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-5">
        <button type="button" aria-label="앞쪽" disabled={at === 0} onClick={() => go(-1)} className="glass grid h-16 w-16 place-items-center rounded-full text-3xl disabled:opacity-30">
          <UiIcon name="prev" />
        </button>
        <span className="font-display text-xl text-ink-soft">
          {at + 1} / {pages.length}
        </span>
        {page.type === "end" ? (
          <button type="button" className="cta rounded-full px-10 py-4 text-3xl font-extrabold" onClick={() => onDone({ correct: 0, total: 0 })}>
            좋아!
          </button>
        ) : (
          <button type="button" aria-label="다음 쪽" onClick={() => go(1)} className={`cta grid h-16 w-16 place-items-center rounded-full text-3xl text-white ${read ? "animate-breathe" : ""}`}>
            <UiIcon name="next" />
          </button>
        )}
      </div>
    </ActivityFrame>
  );
}
