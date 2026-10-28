"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/Art";
import { ModeShell } from "@/components/ModeShell";
import { traceLines } from "@/components/play/activities/Trace";
import { TraceBoard, useBoardKey } from "@/components/TraceBoard";
import { Splash, SquishButton, UiIcon } from "@/components/ui";
import { ALPHABET, letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { useIsMaster } from "@/lib/auth";
import { recordPlay } from "@/lib/play";
import { knownLetters } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";

/*
 * 알파벳 쓰기 — 글자를 골라 대문자 → 소문자 차례로 손가락으로 따라 쓴다(판은 한글나라 TraceBoard, 손끝 펜 그대로).
 * 만난 글자만 열린다(마스터는 다). 한 판 쓸 때마다 칭찬 + 하루 리포트에 활동 하나.
 */

export default function WriteScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [picked, setPicked] = useState<{ letter: string; lower: boolean } | null>(null);
  const [key, erase] = useBoardKey();
  const [done, setDone] = useState(false);
  const menu = menuOf("write");

  useEffect(() => {
    void say(LINES.write);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;
  const known = new Set(master ? ALPHABET : knownLetters(saved.progress));

  const choose = (letter: string, lower = false) => {
    sfx.wake();
    if (!known.has(letter)) {
      sfx.boop();
      void say(LINES.letterLocked);
      return;
    }
    sfx.pop();
    setPicked({ letter, lower });
    setDone(false);
    const ch = lower ? letterOf(letter).lower : letter;
    void say(lower ? traceLines(ch) : [LINES.trace, ...traceLines(ch)]);
  };

  if (picked) {
    const l = letterOf(picked.letter);
    const ch = picked.lower ? l.lower : l.upper;
    const nextLetter = ALPHABET.slice(ALPHABET.indexOf(picked.letter) + 1).find((u) => known.has(u));
    return (
      <ModeShell title={`${l.upper}${l.lower} 쓰기`} icon={menu.icon} iconId="menu:write" scene="write" onBack={() => setPicked(null)}>
        <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
          <TraceBoard
            key={`${ch}-${key}`}
            text={ch}
            width="min(66vh, calc(60*var(--vw)))"
            onSuccess={() => {
              setDone(true);
              sfx.cheer();
              recordPlay({ acts: 1 });
              void say(pick(LINES.praise));
            }}
          />
          <div className="flex flex-col items-center gap-4 portrait:flex-row portrait:flex-wrap portrait:justify-center">
            <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{picked.lower ? LINES.lower : LINES.upper}</span>
            <SquishButton
              tone="butter"
              className="whitespace-nowrap rounded-full px-7 py-4 text-3xl"
              onClick={() => {
                sfx.tick();
                setDone(false);
                erase();
              }}
            >
              {done ? "한 번 더" : "지우기"}
            </SquishButton>
            {done && !picked.lower && (
              <button type="button" className="cta flex items-center gap-2 rounded-full px-7 py-4 text-3xl font-extrabold" onClick={() => choose(picked.letter, true)}>
                <Glyph ch={l.lower} /> <UiIcon name="next" />
              </button>
            )}
            {done && picked.lower && nextLetter && (
              <button type="button" className="cta flex items-center gap-2 rounded-full px-7 py-4 text-3xl font-extrabold" onClick={() => choose(nextLetter)}>
                <Glyph ch={nextLetter} /> <UiIcon name="next" />
              </button>
            )}
          </div>
        </div>
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId="menu:write" scene="write">
      <div className="mx-auto grid max-w-4xl grid-cols-6 gap-3 p-5 pb-8 short:grid-cols-9 portrait:grid-cols-4 portrait:gap-3 portrait:p-4">
        {ALPHABET.map((u) => {
          const open = known.has(u);
          return (
            <SquishButton key={u} tone="card" onClick={() => choose(u)} className={`grid aspect-square place-items-center rounded-[1.6rem] ${open ? "" : "opacity-45"}`} aria-label={u}>
              <span className="flex items-end gap-[0.08em]" style={{ fontSize: "min(8vh, calc(6*var(--vw)))" }}>
                <Glyph ch={u} className={open ? "text-ink" : "text-ink-soft"} />
                <Glyph ch={letterOf(u).lower} className={`text-[0.8em] ${open ? "text-ink-soft" : "text-ink-soft/70"}`} />
              </span>
            </SquishButton>
          );
        })}
      </div>
    </ModeShell>
  );
}
