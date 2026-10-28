"use client";

import { useEffect, useState } from "react";
import { WordArt } from "@/components/Art";
import { MarkedWord } from "@/components/play/activities/Book";
import { SpeakerButton, usePortrait } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { HideGame as HideBoard } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { Bush } from "./props";

/** 덤불마다 살짝 다른 높이 — 정원에 흩어져 있는 것처럼 */
const LIFT = [0, -18, 6, -12, 2];

/**
 * 숨바꼭질 — 덤불 다섯 개 뒤에 그림이 숨어 있다. "fox … 어디 숨었을까?" 를 듣고 덤불을 톡 친다.
 * 맞으면 덤불이 비켜나며 그림이 튀어나와 그대로 남는다(찾았다!). 아니면 그 덤불 그림이 잠깐 고개를 내밀고 이름 → 땡 → 다시 숨는다.
 * 네 번 찾으면 끝. 한 번 틀리면 찾을 덤불이 숨 쉰다.
 */
export function HideGame({ game, onDone }: { game: HideBoard; onDone: OnDone }) {
  const [t, setT] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [peek, setPeek] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const target = game.targets[t];
  const prompt = [wordOf(target).en, LINES.hideWhere];

  useEffect(() => {
    void say([LINES.hideIntro, wordOf(game.targets[0]).en, LINES.hideWhere]);
    return () => stopVoice();
  }, [game]);

  const tap = (i: number) => {
    if (busy || found.includes(i) || peek !== null) return;
    sfx.wake();
    sfx.pop();
    const alive = turn();
    const word = game.spots[i];
    if (word === target) {
      setBusy(true);
      setFound((f) => [...f, i]);
      const got = missed ? score : score + 1;
      setScore(got);
      void answerFeedback({ name: [wordOf(word).en], right: true, then: [LINES.hideFound, pick(LINES.praise)], alive }).then((ok) => {
        if (!ok) return;
        if (t + 1 >= game.targets.length) {
          later(() => onDone({ correct: got, total: game.targets.length }), 400);
          return;
        }
        setT(t + 1);
        setMissed(false);
        setBusy(false);
        void say([wordOf(game.targets[t + 1]).en, LINES.hideWhere]);
      });
      return;
    }
    setMissed(true);
    setPeek(i);
    void answerFeedback({ name: [wordOf(word).en], right: false, then: [pick(LINES.retry), ...prompt], alive });
    later(() => setPeek((p) => (p === i ? null : p)), 1600);
  };

  const bush = portrait ? "min(19vh, 38vw)" : "min(30vh, calc(17*var(--vw)))";
  const art = `calc(${bush} * 0.62)`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-3">
      <div key={t} className="flex animate-pop-in items-center gap-4">
        <SpeakerButton text={prompt} size={110} pulse={!busy} />
        <span className="rounded-[1.8rem] bg-white px-6 py-2 shadow-[0_6px_0_var(--paper-deep)]">
          <MarkedWord word={wordOf(target)} />
        </span>
      </div>
      <div className="flex max-w-5xl flex-wrap items-end justify-center gap-x-[3vw] gap-y-2">
        {game.spots.map((id, i) => {
          const open = found.includes(i);
          const peeking = peek === i;
          const hint = missed && id === target && !open && !busy;
          return (
            <button
              key={id}
              type="button"
              aria-label={open ? wordOf(id).en : "덤불"}
              onClick={() => tap(i)}
              className="relative flex flex-col items-center"
              style={{ transform: `translateY(${portrait ? 0 : LIFT[i % LIFT.length]}px)`, width: bush }}
            >
              {/* 숨은 그림 — 찾으면 위로 튀어나와 그대로, 아니면 잠깐 고개만 */}
              <span
                className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-out ${open ? "z-10 bottom-[22%] opacity-100" : peeking ? "bottom-[46%] opacity-100" : "bottom-[10%] opacity-0"}`}
                aria-hidden
              >
                <span className={open ? "inline-block animate-pop-in" : ""}>
                  <WordArt id={id} size={art} />
                </span>
              </span>
              <span
                className={`relative transition-all duration-300 ${open ? "translate-y-[38%] scale-90 opacity-40" : ""} ${peeking ? "animate-shake" : ""} ${hint ? "animate-breathe" : ""}`}
              >
                <Bush width={bush} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
