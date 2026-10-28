"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Glyph } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { caseOf, letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { Bubble, PopRound } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

const BASE = "min(16vh, calc(11.5*var(--vw)))";

/**
 * 글자 방울 — 대·소문자가 섞인 방울 여덟 개 중에 그 글자(셋)를 모두 톡톡 터뜨린다. 터질 때마다 글자 이름(영어).
 * 다른 글자를 누르면 그 글자 이름 + 땡 — 보통 판은 남은 정답 방울이 숨 쉬듯 커졌다 작아진다.
 * 점수는 판마다 — 한 번도 틀리지 않고 다 터뜨리면 1.
 */
export function Pop({ rounds, assess, onDone }: { rounds: PopRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [popped, setPopped] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const round = rounds[idx];
  const hits = round.bubbles.filter((b) => b.letter === round.target);
  const done = hits.every((b) => popped.includes(b.key));

  useEffect(() => {
    void say([rounds[0].target, LINES.pop]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (nextScore: number) => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: nextScore, total: rounds.length });
      return;
    }
    setIdx(idx + 1);
    setPopped([]);
    setWrong([]);
    void say([rounds[idx + 1].target, LINES.pop]);
  };

  const tap = (b: Bubble) => {
    if (done || popped.includes(b.key) || wrong.includes(b.key)) return;
    sfx.wake();
    const alive = turn();
    if (b.letter === round.target) {
      const next = [...popped, b.key];
      setPopped(next);
      sfx.pop();
      if (hits.every((h) => next.includes(h.key))) {
        const nextScore = wrong.length ? score : score + 1;
        setScore(nextScore);
        void answerFeedback({ name: [b.letter], right: true, then: [LINES.popAll, pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(nextScore), 500));
      } else void say(b.letter);
      return;
    }
    setWrong([...wrong, b.key]);
    setShake(b.key);
    void answerFeedback({ name: [b.letter], right: false, then: [], alive });
    later(() => setShake((s) => (s === b.key ? null : s)), 600);
  };

  const l = letterOf(round.target);

  return (
    <ActivityFrame className="gap-[2.5vh]">
      <div key={idx} className="flex animate-pop-in items-center gap-4">
        <span className="glass flex items-end gap-3 rounded-[1.8rem] px-6 py-2">
          <Glyph ch={l.upper} className="text-brand" style={{ fontSize: "min(10vh, calc(7*var(--vw)))" }} />
          <Glyph ch={l.lower} className="text-brand" style={{ fontSize: "min(10vh, calc(7*var(--vw)))" }} />
        </span>
        <SpeakerButton text={[round.target, LINES.pop]} size={96} />
      </div>
      <div className="relative w-[min(94vw,62rem)] portrait:w-[94vw]" style={{ height: "min(52vh, calc(48*var(--vw)))" }}>
        {round.bubbles.map((b, k) => {
          const isPopped = popped.includes(b.key);
          const isWrong = wrong.includes(b.key);
          const hint = !assess && wrong.length > 0 && b.letter === round.target && !isPopped;
          const size = `calc(${BASE} * ${b.size})`;
          const style: CSSProperties = { left: `${b.x}%`, top: `${b.y}%`, width: size, height: size, animationDelay: `${(k % 4) * 0.45}s` };
          return (
            <button
              key={b.key}
              type="button"
              aria-label={caseOf(b.letter, b.show)}
              onClick={() => tap(b)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${isPopped ? "pointer-events-none" : "animate-float"}`}
              style={style}
            >
              <span
                className={`grid h-full w-full place-items-center rounded-full transition-all duration-300 ${isPopped ? "scale-150 opacity-0" : ""} ${isWrong ? "opacity-40 grayscale" : ""} ${
                  shake === b.key ? "animate-shake" : ""
                } ${hint ? "hint animate-breathe" : ""}`}
                style={{
                  background: "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.95) 0 12%, rgb(214 238 255 / 0.85) 13% 55%, rgb(150 205 245 / 0.75) 100%)",
                  boxShadow: "inset 0 -6px 14px rgb(80 150 210 / 0.35), 0 10px 18px -10px rgb(62 58 82 / 0.4)",
                }}
              >
                <Glyph ch={caseOf(b.letter, b.show)} className="text-ink" style={{ fontSize: `calc(${size} * 0.52)` }} />
              </span>
            </button>
          );
        })}
      </div>
    </ActivityFrame>
  );
}
