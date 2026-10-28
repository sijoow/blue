"use client";

import { useEffect, useState } from "react";
import { SpeakerButton, usePortrait } from "@/components/ui";
import { caseOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { FishRound } from "@/lib/originals";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { DragGhost, useDragDrop } from "../play/drag";
import type { OnDone } from "../play/types";
import { Fish, Hook } from "./props";

/** 물고기마다 헤엄 빠르기·시작을 다르게 — 같이 움직이면 어색하다 */
const SWIM = [
  { duration: "4.2s", delay: "0s" },
  { duration: "5.1s", delay: "-1.3s" },
  { duration: "4.7s", delay: "-2.6s" },
  { duration: "5.6s", delay: "-0.7s" },
];

/**
 * 글자 낚시 — 연못에 글자 물고기 넷. "M … 이 글자 물고기를 잡아 봐!" 를 듣고 낚싯바늘을 끌어다 그 물고기에 댄다.
 * 맞으면 물고기가 쑥 올라가 양동이로(잡았다!), 아니면 그 물고기 글자 → 땡 → 다시. 물고기를 누르면 글자 이름을 들려준다.
 * 다섯 마리 잡으면 끝. 한 번 틀리면 잡을 물고기가 숨 쉰다.
 */
export function FishGame({ rounds, onDone }: { rounds: FishRound[]; onDone: OnDone }) {
  const [r, setR] = useState(0);
  const [caught, setCaught] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const round = rounds[r];
  const prompt = [round.target, LINES.fishCatch];

  useEffect(() => {
    void say([LINES.fishIntro, rounds[0].target, LINES.fishCatch]);
    return () => stopVoice();
  }, [rounds]);

  const { drag, begin } = useDragDrop<"hook">((_, zone) => {
    if (caught || !zone?.startsWith("f:")) return;
    const l = zone.slice(2);
    const alive = turn();
    if (l === round.target) {
      setCaught(l);
      const got = missed ? score : score + 1;
      setScore(got);
      void answerFeedback({ name: [l], right: true, then: [LINES.fishGot, pick(LINES.praise)], alive }).then((ok) => {
        if (!ok) return;
        if (r + 1 >= rounds.length) {
          onDone({ correct: got, total: rounds.length });
          return;
        }
        setR(r + 1);
        setCaught(null);
        setMissed(false);
        void say([rounds[r + 1].target, LINES.fishCatch]);
      });
      return;
    }
    setMissed(true);
    setShake(l);
    later(() => setShake((s) => (s === l ? null : s)), 600);
    void answerFeedback({ name: [l], right: false, then: [pick(LINES.retry), ...prompt], alive });
  });

  const fishW = portrait ? "min(16vh, 36vw)" : "min(26vh, calc(17*var(--vw)))";
  const hookH = portrait ? "min(12vh, 22vw)" : "min(20vh, calc(10*var(--vw)))";

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[2.5vh] px-4 py-3">
      <div className="flex items-center gap-5">
        <SpeakerButton text={prompt} size={100} pulse={!caught} />
        <span
          role="button"
          aria-label="낚싯바늘"
          onPointerDown={caught ? undefined : begin("hook")}
          className={`squish grid cursor-grab select-none place-items-center rounded-full px-4 py-2 ${drag ? "opacity-30" : caught ? "" : "animate-breathe"}`}
          style={{ touchAction: "none" }}
        >
          <Hook height={hookH} />
        </span>
        {/* 양동이 — 잡은 물고기 수 */}
        <span className="glass flex items-center gap-1 rounded-full px-4 py-2 text-2xl font-extrabold" aria-label={`잡은 물고기 ${r + (caught ? 1 : 0)}마리`}>
          {rounds.map((x, k) => (
            <span key={k} className={k < r + (caught ? 1 : 0) ? "" : "opacity-30"}>
              <Fish ch="" color={k} width="min(6vh, 2.6rem)" />
            </span>
          ))}
        </span>
      </div>
      <div
        key={r}
        className="grid animate-pop-in grid-cols-2 gap-x-[6vw] gap-y-[3vh] rounded-[3rem] px-[5vw] py-[4vh] shadow-[inset_0_-10px_0_rgb(46_120_190/0.25)]"
        style={{ background: "linear-gradient(#9fd8f5, #6cbbe8)" }}
      >
        {round.fish.map((l, k) => {
          const hint = missed && l === round.target && !caught;
          const over = drag?.over === `f:${l}`;
          return (
            <span
              key={l}
              data-drop={`f:${l}`}
              aria-label={caseOf(l, round.show)}
              onClick={() => void say(l)}
              className={`grid place-items-center rounded-full ${k % 2 ? "translate-y-[30%]" : ""} ${over ? "bg-white/45" : ""} ${caught === l ? "animate-leave-up" : ""}`}
            >
              <span className={`inline-block ${shake === l ? "animate-shake" : hint ? "animate-breathe" : "animate-swim"}`} style={{ animationDuration: shake === l || hint ? undefined : SWIM[k % SWIM.length].duration, animationDelay: shake === l || hint ? undefined : SWIM[k % SWIM.length].delay }}>
                <Fish ch={caseOf(l, round.show)} color={k + r} width={fishW} />
              </span>
            </span>
          );
        })}
      </div>
      <DragGhost drag={drag}>{() => <Hook height={hookH} />}</DragGhost>
    </div>
  );
}
