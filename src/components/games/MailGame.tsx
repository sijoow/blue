"use client";

import { useEffect, useState } from "react";
import { WordArt } from "@/components/Art";
import { SpeakerButton, usePortrait } from "@/components/ui";
import { letterOf, wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { MailItem, MailRound } from "@/lib/originals";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { DragGhost, useDragDrop } from "../play/drag";
import type { OnDone } from "../play/types";
import { Envelope, Mailbox, Parcel } from "./props";

/** 배달할 것을 들려주는 말 — 편지는 글자 이름, 소포는 단어 */
function promptOf(it: MailItem): string[] {
  return it.kind === "letter" ? [it.letter, LINES.mailLetter] : [wordOf(it.word).en, LINES.mailParcel];
}

function ItemArt({ it, width }: { it: MailItem; width: string }) {
  if (it.kind === "letter") return <Envelope letter={letterOf(it.letter).upper} width={width} />;
  return (
    <Parcel width={width}>
      <WordArt id={it.word} size={`calc(${width} * 0.48)`} />
    </Parcel>
  );
}

/**
 * 우편 배달 — 위의 편지(대문자)·소포(단어 그림)를 끌어서 아래 우편함(소문자)에 넣는다. 맞게 넣으면 그 우편함 깃발이 올라간다.
 * 판마다 우편함 셋 · 배달 셋, 두 판. 틀리면 그 우편함 글자 → 땡 → 다시 들려주고, 맞는 우편함이 숨 쉰다.
 */
export function MailGame({ rounds, onDone }: { rounds: MailRound[]; onDone: OnDone }) {
  const [r, setR] = useState(0);
  const [i, setI] = useState(0);
  const [delivered, setDelivered] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const portrait = usePortrait();
  const round = rounds[r];
  const item = round.items[i];
  const total = rounds.reduce((n, x) => n + x.items.length, 0);

  useEffect(() => {
    void say([LINES.mailIntro, ...promptOf(rounds[0].items[0])]);
    return () => stopVoice();
  }, [rounds]);

  const advance = (got: number) => {
    const nextI = i + 1;
    if (nextI < round.items.length) {
      setI(nextI);
      setMissed(false);
      setBusy(false);
      void say(promptOf(round.items[nextI]));
      return;
    }
    // 한 판 배달 끝 — 깃발이 다 올라간 걸 잠깐 보고
    void say(LINES.mailDone).then(() => {
      if (r + 1 >= rounds.length) {
        onDone({ correct: got, total });
        return;
      }
      later(() => {
        setR(r + 1);
        setI(0);
        setDelivered([]);
        setMissed(false);
        setBusy(false);
        void say(promptOf(rounds[r + 1].items[0]));
      }, 300);
    });
  };

  const { drag, begin } = useDragDrop<MailItem>((it, zone) => {
    if (busy) return;
    if (!zone?.startsWith("box:")) {
      void say(promptOf(it));
      return;
    }
    const box = zone.slice(4);
    const alive = turn();
    if (box === it.letter) {
      setBusy(true);
      setDelivered((d) => [...d, box]);
      const got = missed ? score : score + 1;
      setScore(got);
      void answerFeedback({ name: [box], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && later(() => advance(got), 300));
      return;
    }
    setMissed(true);
    setShake(box);
    later(() => setShake((s) => (s === box ? null : s)), 600);
    void answerFeedback({ name: [box], right: false, then: [pick(LINES.retry), ...promptOf(it)], alive });
  });

  const itemW = portrait ? "min(22vh, 40vw)" : "min(30vh, calc(20*var(--vw)))";
  const boxH = portrait ? "min(26vh, 31vw)" : "min(40vh, calc(22*var(--vw)))";
  const waiting = !busy && !delivered.includes(item.letter);

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-3">
      <div className="flex items-center gap-4">
        <SpeakerButton text={promptOf(item)} size={96} />
        <span
          key={`${r}-${i}`}
          role="button"
          aria-label={item.kind === "letter" ? item.letter : wordOf(item.word).en}
          onPointerDown={waiting ? begin(item) : undefined}
          className={`animate-drop-in cursor-grab select-none ${drag ? "opacity-30" : ""} ${waiting && !drag ? "animate-breathe" : ""} ${busy ? "invisible" : ""}`}
          style={{ touchAction: "none" }}
        >
          <ItemArt it={item} width={itemW} />
        </span>
      </div>
      <div key={r} className="flex animate-pop-in items-end justify-center gap-[4vw]">
        {round.boxes.map((l) => {
          const over = drag?.over === `box:${l}`;
          const hint = missed && l === item.letter && !busy;
          return (
            <span
              key={l}
              data-drop={`box:${l}`}
              aria-label={letterOf(l).lower}
              className={`rounded-[1.6rem] p-1 transition-colors ${over ? "bg-brand-soft" : ""} ${shake === l ? "animate-shake" : ""} ${hint ? "hint animate-breathe" : ""} ${delivered.includes(l) ? "animate-wiggle" : ""}`}
            >
              <Mailbox letter={letterOf(l).lower} up={delivered.includes(l)} height={boxH} />
            </span>
          );
        })}
      </div>
      <DragGhost drag={drag}>{(it) => <ItemArt it={it} width={itemW} />}</DragGhost>
    </div>
  );
}
