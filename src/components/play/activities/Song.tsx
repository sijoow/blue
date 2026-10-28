"use client";

import { useEffect, useState } from "react";
import { Glyph, Guide, WordArt } from "@/components/Art";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

/** 노래 한 박자 — 글자 이름이나 단어 하나 */
interface Beat {
  letter: string;
  /** 단어 박자면 단어 id */
  word?: string;
  text: string;
}

/**
 * 챈트 박자 — 글자가 넷 이하면 "A, A, apple · A, A, ant", 더 많으면 "A, apple · B, ball"(길어지지 않게).
 * 소리는 이미 구운 글자 이름·단어(수아 영어)를 차례로 이어 읽는다 — 새로 구울 말이 없다.
 */
export function songBeats(letters: readonly string[]): Beat[] {
  const short = letters.length <= 4;
  return letters.flatMap((u) => {
    const l = letterOf(u);
    const [w1, w2] = l.words;
    const name: Beat = { letter: u, text: u };
    const word = (id: string, en: string): Beat => ({ letter: u, word: id, text: en });
    return short ? [name, name, word(w1.id, w1.en), name, name, word(w2.id, w2.en)] : [name, word(w1.id, w1.en)];
  });
}

/**
 * 노래 — 업체 하루의 첫 영상(알파벳 노래) 자리. 박자마다 큰 글자가 통통 튀고, 단어 박자에는 그림이 나온다.
 * 기존 노래 가사는 쓰지 않는다(인계 6절) — 우리 챈트. 다 부르면 「한 번 더」·「좋아!」. 점수 없는 놀이.
 */
export function Song({ letters, onDone }: { letters: string[]; onDone: OnDone }) {
  // 글자가 같으면 다시 부르지 않는다 — round 가 바뀔 때(한 번 더)만 처음부터
  const key = letters.join("");
  const beats = songBeats([...key]);
  const [at, setAt] = useState(-1);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    const alive = () => live;
    const list = songBeats([...key]);
    void (async () => {
      await say(LINES.songIntro);
      for (let i = 0; i < list.length; i++) {
        if (!alive()) return;
        setAt(i);
        sfx.tick();
        await say(list[i].text);
        await new Promise((r) => window.setTimeout(r, list[i].word ? 380 : 120));
      }
      if (!alive()) return;
      setAt(-1);
      setDone(true);
      sfx.cheer();
    })();
    return () => {
      live = false;
      stopVoice();
    };
  }, [key, round]);

  const beat = at >= 0 ? beats[at] : null;
  const l = beat ? letterOf(beat.letter) : letterOf(letters[0]);
  const big = { fontSize: "min(26vh, calc(19*var(--vw)))" };

  return (
    <ActivityFrame className="gap-[3vh]">
      <div className="flex items-center gap-[4vw] portrait:flex-col portrait:gap-3">
        <span key={`l-${at}`} className={`flex items-end gap-2 rounded-[2.4rem] bg-white px-8 py-3 shadow-[0_8px_0_var(--paper-deep)] ${beat && !beat.word ? "animate-pop-in" : ""}`}>
          <Glyph ch={l.upper} className="text-brand" style={big} />
          <Glyph ch={l.lower} className="text-sky-deep" style={big} />
        </span>
        <span key={`w-${at}`} className="grid place-items-center rounded-[2.4rem] bg-white/80 p-3" style={{ width: "min(30vh, calc(24*var(--vw)))", height: "min(30vh, calc(24*var(--vw)))" }}>
          {beat?.word ? (
            <span className="flex animate-pop-in flex-col items-center">
              <WordArt id={beat.word} size="min(22vh, calc(17*var(--vw)))" />
              <span className="font-letter text-3xl font-extrabold short:text-xl">{beat.text}</span>
            </span>
          ) : (
            <Guide size={150} mood={done ? "cheer" : "happy"} className={done ? "animate-wiggle" : "animate-float"} />
          )}
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((u) => (
          <span key={u} className={`grid h-12 w-12 place-items-center rounded-full font-letter text-2xl font-extrabold short:h-9 short:w-9 short:text-lg ${beat?.letter === u ? "scale-125 bg-brand text-white" : "bg-white/80 text-ink-soft"} transition-transform`}>
            {u}
          </span>
        ))}
      </div>
      {done && (
        <div className="flex animate-pop-in gap-4">
          <button
            type="button"
            className="squish rounded-full px-8 py-4 font-display text-2xl"
            onClick={() => {
              sfx.wake();
              setDone(false);
              setRound((r) => r + 1);
            }}
          >
            한 번 더
          </button>
          <button type="button" className="cta rounded-full px-10 py-4 text-3xl font-extrabold" onClick={() => onDone({ correct: 0, total: 0 })}>
            좋아!
          </button>
        </div>
      )}
    </ActivityFrame>
  );
}
