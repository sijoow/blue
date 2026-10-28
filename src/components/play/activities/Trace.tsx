"use client";

import { useEffect, useState } from "react";
import { TraceBoard, useBoardKey } from "@/components/TraceBoard";
import { SquishButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
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

/** 알파벳 따라 쓰기 — 연한 글자 위를 손가락으로 따라 쓴다(판은 한글나라 TraceBoard 그대로 — 글꼴 모양 칸을 덮었는지로 재서 대·소문자 다 된다) */
export function Trace({ chars, onDone }: { chars: string[]; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [key, erase] = useBoardKey();
  const [done, setDone] = useState(false);
  const later = useTimers();
  const ch = chars[idx];

  useEffect(() => {
    void say([LINES.trace, ...traceLines(chars[0])]);
    return () => stopVoice();
  }, [chars]);

  const success = () => {
    setDone(true);
    sfx.cheer();
    void say(pick(LINES.praise));
    later(() => {
      if (idx + 1 >= chars.length) {
        onDone({ correct: 0, total: 0 });
        return;
      }
      setIdx(idx + 1);
      setDone(false);
      void say(traceLines(chars[idx + 1]));
    }, 1500);
  };

  return (
    <div className="flex min-h-full items-center justify-center-safe gap-8 px-6 py-4 portrait:flex-col portrait:gap-5 portrait:px-4">
      <TraceBoard key={`${idx}-${key}`} text={ch} width="min(66vh, calc(60*var(--vw)))" onSuccess={success} />
      <div className="flex flex-col items-center gap-5 portrait:flex-row portrait:flex-wrap portrait:justify-center portrait:gap-3">
        <span className="rounded-full bg-card px-6 py-2 text-3xl shadow-[0_5px_0_var(--paper-deep)]">{isUpper(ch) ? LINES.upper : LINES.lower}</span>
        <SquishButton
          tone="butter"
          className="whitespace-nowrap rounded-full px-7 py-4 text-3xl"
          disabled={done}
          onClick={() => {
            sfx.tick();
            erase();
          }}
        >
          지우기
        </SquishButton>
        <div className="flex gap-2">
          {chars.map((it, i) => (
            <span key={`${it}-${i}`} className={`h-4 rounded-full ${i === idx ? "w-10 bg-brand" : i < idx ? "w-4 bg-butter-deep" : "w-4 bg-paper-deep"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
