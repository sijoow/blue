"use client";

import { useEffect, useRef, useState } from "react";
import { WordArt } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

type Phase = "listen" | "ready" | "rec" | "play" | "done" | "nomic";

/** 한 번 말할 시간 — 단어 하나라 짧게 */
const REC_MS = 2600;

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.5" y="3" width="7" height="11.5" rx="3.5" fill="currentColor" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}

/**
 * 따라 말하기 — 업체 하루의 마이크 활동 자리(AI 채점은 업체도 레벨 C부터라 여기선 녹음만).
 * (영어) 단어를 듣고 → 마이크를 누르면 2.6초 녹음 → 내 목소리를 다시 들려주고 → 한 번 더 들려준 뒤 칭찬. 녹음은 기기에도 서버에도 남기지 않는다.
 * 마이크를 쓸 수 없으면(허락 안 함·보안 주소 아님) 듣기만 하고 넘어간다. 점수 없는 놀이.
 */
export function Say({ rounds, onDone }: { rounds: { word: string }[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const later = useTimers();
  const rec = useRef<MediaRecorder | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const w = wordOf(rounds[idx].word);

  useEffect(() => {
    let alive = true;
    const word = wordOf(rounds[idx].word);
    void say([...(idx === 0 ? [LINES.sayIntro] : []), word.en, LINES.sayTurn]).then(() => {
      if (alive) setPhase((p) => (p === "listen" ? "ready" : p));
    });
    return () => {
      alive = false;
      stopVoice();
    };
  }, [idx, rounds]);

  // 화면을 떠나면 녹음·재생을 멈추고 마이크를 끈다
  useEffect(
    () => () => {
      rec.current?.stream.getTracks().forEach((t) => t.stop());
      audio.current?.pause();
    },
    [],
  );

  const next = () => {
    if (idx + 1 >= rounds.length) {
      onDone({ correct: 0, total: 0 });
      return;
    }
    setIdx(idx + 1);
    setPhase("listen");
  };

  const playBack = async (blob: Blob) => {
    setPhase("play");
    await say(LINES.sayListen);
    const a = new Audio(URL.createObjectURL(blob));
    audio.current = a;
    await new Promise<void>((resolve) => {
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
    URL.revokeObjectURL(a.src);
    await say(w.en);
    sfx.cheer();
    await say(pick(LINES.praise));
    setPhase("done");
  };

  const record = async () => {
    sfx.wake();
    stopVoice();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void playBack(new Blob(chunks, { type: r.mimeType || "audio/webm" }));
      };
      rec.current = r;
      r.start();
      sfx.tick();
      setPhase("rec");
      later(() => {
        if (r.state === "recording") r.stop();
      }, REC_MS);
    } catch {
      setPhase("nomic");
    }
  };

  return (
    <ActivityFrame>
      <div key={idx} className="flex animate-pop-in flex-col items-center gap-2">
        <span className="grid place-items-center rounded-[2.4rem] bg-white p-4 shadow-[0_8px_0_var(--paper-deep)]">
          <WordArt id={w.id} size="min(30vh, calc(26*var(--vw)))" />
        </span>
        <span className="font-letter text-5xl font-extrabold short:text-3xl">{w.en}</span>
      </div>
      <div className="flex items-center gap-5">
        <SpeakerButton text={w.en} size={96} />
        {phase === "nomic" ? (
          <div className="flex flex-col items-center gap-2">
            <p className="glass rounded-[1.4rem] px-5 py-2 text-center text-base font-bold text-ink-soft">마이크를 쓸 수 없어요 — 듣고 따라 말해 봐요</p>
            <button type="button" className="cta rounded-full px-8 py-3 text-2xl font-extrabold" onClick={next}>
              다음
            </button>
          </div>
        ) : phase === "done" ? (
          <button type="button" className="cta animate-pop-in rounded-full px-10 py-4 text-3xl font-extrabold" onClick={next}>
            {idx + 1 >= rounds.length ? "좋아!" : "다음"}
          </button>
        ) : (
          <button
            type="button"
            aria-label="녹음하기"
            disabled={phase !== "ready"}
            onClick={() => void record()}
            className={`grid h-28 w-28 place-items-center rounded-full text-6xl text-white shadow-[0_8px_0_var(--brand-deep)] transition-transform short:h-20 short:w-20 short:text-4xl ${
              phase === "rec" ? "scale-110 animate-breathe bg-peach-deep" : phase === "ready" ? "hint animate-breathe bg-brand" : "bg-brand/50"
            }`}
          >
            <MicIcon />
          </button>
        )}
      </div>
      <p className="glass rounded-full px-6 py-2 text-xl font-bold text-ink-soft short:text-base">
        {phase === "rec" ? "말해 봐요!" : phase === "play" ? "내 목소리 듣는 중…" : phase === "ready" ? "마이크를 눌러요" : phase === "listen" ? "잘 들어 봐요" : `${idx + 1} / ${rounds.length}`}
      </p>
    </ActivityFrame>
  );
}
