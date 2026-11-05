"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

/*
 * 부모 문 — 두 자리 답을 직접 눌러야 지나간다(2026-11-03 사용자: 꾹 누르기는 아이도 할 수 있고 안에 전체 삭제가 있다).
 * 보기를 고르는 문제는 아이가 아무 데나 눌러도 네 번에 한 번은 열린다 — 그래서 숫자판. 틀리면 문제가 바뀐다.
 */

interface Question {
  a: number;
  b: number;
}

/** 답은 언제나 두 자리(14~28) — 네 살이 외워서 풀 수 없게 */
function question(): Question {
  return { a: 11 + Math.floor(Math.random() * 9), b: 3 + Math.floor(Math.random() * 7) };
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function MathGate({ note, onPass, onCancel }: { note: string; onPass: () => void; onCancel: () => void }) {
  const [q, setQ] = useState(question);
  const [typed, setTyped] = useState("");
  const [missed, setMissed] = useState(0);

  const press = (d: string) => {
    const next = typed + d;
    if (next.length < 2) {
      setTyped(next);
      return;
    }
    if (Number(next) === q.a + q.b) {
      onPass();
      return;
    }
    setMissed((m) => m + 1);
    setQ(question());
    setTyped("");
  };

  const key = "squish h-14 rounded-2xl font-display text-2xl short:h-11";

  return createPortal(
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-ink/55 p-4" role="dialog" aria-modal="true" aria-label="부모님 확인">
      <div className="flex w-full max-w-sm animate-pop-in flex-col items-center gap-3 rounded-[2rem] bg-white p-6 text-center font-body shadow-[0_24px_60px_-20px_rgb(62_58_82/0.6)] short:max-w-2xl short:flex-row short:gap-6 short:p-4">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <p className="break-keep text-lg text-ink-soft">{note}</p>
          <p key={missed} className={`font-display text-4xl ${missed ? "animate-shake" : ""}`}>
            {q.a} + {q.b} = <span className="inline-block min-w-[2ch] border-b-4 border-brand text-brand">{typed || " "}</span>
          </p>
          {missed > 0 && <p className="text-base text-peach-deep">틀렸어요. 새 문제예요</p>}
        </div>
        <div className="grid w-full flex-1 grid-cols-3 gap-2">
          {KEYS.map((d) => (
            <button key={d} type="button" className={key} onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" className={`${key} text-lg`} onClick={onCancel}>
            닫기
          </button>
          <button type="button" className={key} onClick={() => press("0")}>
            0
          </button>
          <button type="button" className={`${key} text-lg`} disabled={!typed} onClick={() => setTyped("")}>
            지우기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
