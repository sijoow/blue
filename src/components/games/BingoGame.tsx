"use client";

import { useEffect, useState } from "react";
import { Family, WordArt } from "@/components/Art";
import { MarkedWord } from "@/components/play/activities/Book";
import { SpeakerButton, usePortrait } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { BINGO_SHOUT, LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import { bingoLine, type BingoBoard } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { Chip } from "./props";

/**
 * 빙고랑 빙고! — 3×3 그림판. 블루이가 단어를 부르면(영어 + "어디 있을까?") 그 그림을 눌러 칩을 올린다.
 * 가로·세로·대각선 한 줄이 차면 "Bingo!" — 빙고(가족)가 판 위로 뛰어나오고 놀이 끝. 틀리면 누른 그림 이름 → 땡 → 다시 부르고, 정답 칸이 숨 쉰다.
 */
export function BingoGame({ board, onDone }: { board: BingoBoard; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  const [marked, setMarked] = useState<ReadonlySet<number>>(() => new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const [line, setLine] = useState<readonly number[] | null>(null);
  // 맞힌 뒤 칭찬을 듣는 동안은 다른 칸을 받지 않는다(다음 부르기가 끊기지 않게)
  const [busy, setBusy] = useState(false);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const call = board.calls[idx];
  const prompt = [wordOf(call).en, LINES.whereIs];

  useEffect(() => {
    void say([LINES.bingoIntro, wordOf(board.calls[0]).en, LINES.whereIs]);
    return () => stopVoice();
  }, [board]);

  const tap = (i: number) => {
    if (line || busy || marked.has(i)) return;
    sfx.wake();
    const alive = turn();
    const word = board.cells[i];
    if (word !== call) {
      setMissed(true);
      setWrong(i);
      later(() => setWrong((w) => (w === i ? null : w)), 600);
      void answerFeedback({ name: [wordOf(word).en], right: false, then: [pick(LINES.retry), ...prompt], alive });
      return;
    }
    setBusy(true);
    const next = new Set(marked).add(i);
    setMarked(next);
    const got = missed ? score : score + 1;
    setScore(got);
    const full = bingoLine(next);
    if (full) {
      setLine(full);
      void answerFeedback({ name: [wordOf(word).en], right: true, then: [], alive }).then(async (ok) => {
        if (!ok) return;
        sfx.cheer();
        await say([BINGO_SHOUT, LINES.bingoDone]);
        if (alive()) later(() => onDone({ correct: got, total: idx + 1 }), 700);
      });
      return;
    }
    void answerFeedback({ name: [wordOf(word).en], right: true, then: [pick(LINES.praise)], alive }).then((ok) => {
      if (!ok) return;
      setIdx(idx + 1);
      setMissed(false);
      setBusy(false);
      void say([wordOf(board.calls[idx + 1]).en, LINES.whereIs]);
    });
  };

  const cell = portrait ? "min(13vh, 27vw)" : "min(23vh, calc(15*var(--vw)))";
  const art = `calc(${cell} * 0.78)`;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-3 landscape:flex-row landscape:gap-[5vw]">
      <div key={idx} className="flex animate-pop-in flex-col items-center gap-3">
        <SpeakerButton text={prompt} size={120} pulse={!line} />
        <span className="rounded-[1.8rem] bg-white px-6 py-2 shadow-[0_6px_0_var(--paper-deep)]">
          <MarkedWord word={wordOf(call)} />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-[2rem] bg-butter p-3 shadow-[0_10px_0_var(--butter-deep)]">
        {board.cells.map((id, i) => {
          const on = marked.has(i);
          const win = line?.includes(i) ?? false;
          const hint = missed && !on && id === call && !line;
          return (
            <button
              key={id}
              type="button"
              aria-label={wordOf(id).en}
              onClick={() => tap(i)}
              className={`relative grid place-items-center rounded-[1.4rem] transition-colors ${win ? "bg-mint" : "bg-white"} ${wrong === i ? "animate-shake" : ""} ${win ? "animate-wiggle" : ""} ${hint ? "hint animate-breathe" : ""}`}
              style={{ width: cell, height: cell }}
            >
              <WordArt id={id} size={art} />
              {on && (
                <span className="absolute inset-0 grid animate-drop-in place-items-center">
                  <Chip size={`calc(${cell} * 0.82)`} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {line && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <div className="flex animate-pop-in flex-col items-center gap-2 rounded-[2.4rem] bg-white/95 px-10 pb-6 pt-4 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)]">
            <Family size={200} mood="cheer" className="animate-float" />
            <p className="title-pop text-6xl short:text-4xl">BINGO!</p>
          </div>
        </div>
      )}
    </div>
  );
}
