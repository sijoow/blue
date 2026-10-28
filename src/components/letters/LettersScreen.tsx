"use client";

import { useEffect, useState } from "react";
import { Glyph, WordArt } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { Splash, UiIcon } from "@/components/ui";
import { ALPHABET, letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { useIsMaster } from "@/lib/auth";
import { knownLetters } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { useSaved } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

/*
 * 단어장(업체 단어장 자리) — 오늘의 영어에서 만난 글자(A~Z)와 대표 단어가 모이는 앨범. 만난 글자를 누르면 큰 카드가 열리고,
 * 대문자·소문자를 누르면 "대문자"·"소문자" + (영어) 글자 이름, 단어를 누르면 (영어) 단어 → 뜻.
 * 못 만난 글자는 물음표 — 누르면 "오늘의 영어에서 만나자!". 마스터는 다 보인다.
 */

function LetterModal({ letter, onClose }: { letter: string; onClose: () => void }) {
  const l = letterOf(letter);

  useEffect(() => {
    void say(letter);
    return () => stopVoice();
  }, [letter]);

  const tap = (texts: string[]) => {
    sfx.wake();
    sfx.pop();
    void say(texts);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/25 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-xl animate-pop-in flex-col items-center gap-5 rounded-[2.4rem] bg-white px-8 pb-7 pt-6 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] short:gap-3 short:pb-4 short:pt-4">
        <button type="button" aria-label="닫기" onClick={onClose} className="glass absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full text-xl text-ink-soft">
          <UiIcon name="close" />
        </button>
        <div className="flex items-end gap-6">
          <button type="button" className="squish rounded-[2rem] px-6 pb-1 pt-2" onClick={() => tap([LINES.upper, letter])} aria-label={`대문자 ${l.upper}`}>
            <Glyph ch={l.upper} className="text-brand" style={{ fontSize: "min(20vh, 9rem)" }} />
          </button>
          <button type="button" className="squish rounded-[2rem] px-6 pb-1 pt-2" onClick={() => tap([LINES.lower, letter])} aria-label={`소문자 ${l.lower}`}>
            <Glyph ch={l.lower} className="text-sky-deep" style={{ fontSize: "min(20vh, 9rem)" }} />
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {l.words.map((w) => (
            <button key={w.id} type="button" className="squish flex flex-col items-center gap-1 rounded-[1.8rem] px-4 pb-2 pt-3" onClick={() => tap([w.en, w.ko])} aria-label={w.en}>
              <WordArt id={w.id} size="min(16vh, 7rem)" />
              <span className="font-letter text-2xl font-extrabold">{w.en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LettersScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [open, setOpen] = useState<string | null>(null);
  const menu = menuOf("letters");

  useEffect(() => {
    void say(LINES.letters);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;
  const met = new Set(master ? ALPHABET : knownLetters(saved.progress));

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId="menu:letters" scene="letters">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-3 p-5 pb-8 sm:grid-cols-6 lg:grid-cols-7 short:grid-cols-7 portrait:grid-cols-3 portrait:p-3">
        {ALPHABET.map((u) => {
          const known = met.has(u);
          const l = letterOf(u);
          return (
            <button
              key={u}
              type="button"
              onClick={() => {
                sfx.wake();
                if (!known) {
                  sfx.boop();
                  void say(LINES.letterLocked);
                  return;
                }
                sfx.pop();
                setOpen(u);
              }}
              aria-label={known ? u : "아직 못 만난 글자"}
              className="flex flex-col items-center gap-1 rounded-[1.6rem] bg-white p-2 pb-3 shadow-[0_14px_30px_-16px_rgb(62_58_82/0.45)] transition-transform active:scale-95"
            >
              <span className={`grid aspect-square w-full place-items-center rounded-[1.2rem] ${known ? "bg-butter/60" : "bg-paper-deep"}`}>
                {known ? <WordArt id={l.words[0].id} size="min(12vh, 5rem)" /> : <span className="font-letter text-5xl font-extrabold text-ink-soft/60">?</span>}
              </span>
              <span className="flex items-end gap-1 font-letter text-3xl font-extrabold short:text-2xl">
                {known ? (
                  <>
                    <span className="text-brand">{l.upper}</span>
                    <span className="text-sky-deep">{l.lower}</span>
                  </>
                ) : (
                  <span className="text-ink-soft/50">{l.upper}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {open !== null && <LetterModal letter={open} onClose={() => setOpen(null)} />}
    </ModeShell>
  );
}
