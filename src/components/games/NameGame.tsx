"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/Art";
import { SpeakerButton } from "@/components/ui";
import { LINES } from "@/curriculum/lines";
import type { FamilyName } from "@/curriculum/originals";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { NameRound } from "@/lib/originals";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { pick, say, stopVoice } from "@/lib/voice";
import { DragGhost, useDragDrop } from "../play/drag";
import { LetterTile, TILE, TILE_FONT } from "../play/tiles";
import type { OnDone } from "../play/types";
import { NameArt } from "./art";

/** 다 맞춘 뒤 한국어로 — 누구 이름인지 */
const WHOSE: Record<FamilyName["id"], string> = {
  haon: LINES.nameHaon,
  bluey: LINES.nameBluey,
  bingo: LINES.nameBingo,
  mum: LINES.nameMum,
  dad: LINES.nameDad,
};

/**
 * 내 이름 HAON — 아래 글자 조각을 끌어서 이름 칸(흐린 글자가 보인다)에 맞춘다. 하온이 이름이 먼저, 그다음 블루이 가족 둘.
 * 다 맞추면 한 글자씩 짚으며 "H, A, O, N … Haon!" 하고 읽어 주고 그림이 통통 튄다. 틀린 칸이면 그 글자 → 땡, 맞는 칸이 숨 쉰다.
 */
export function NameGame({ rounds, onDone }: { rounds: NameRound[]; onDone: OnDone }) {
  const [r, setR] = useState(0);
  /** 칸마다 놓인 조각 번호 */
  const [slots, setSlots] = useState<(number | null)[]>(() => rounds[0].name.spell.split("").map(() => null));
  const [shake, setShake] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const later = useTimers();
  const turn = useTurn();
  const round = rounds[r];
  const spell = [...round.name.spell];

  useEffect(() => {
    void say([LINES.nameIntro, rounds[0].name.en]);
    return () => stopVoice();
  }, [rounds]);

  /** 다 맞췄다 — 한 글자씩 짚으며 읽고, 이름 → 누구 이름인지 */
  const finish = async (got: number, alive: () => boolean) => {
    setComplete(true);
    for (let k = 0; k < spell.length; k++) {
      setReading(k);
      await say(spell[k]);
      if (!alive()) return;
    }
    setReading(null);
    sfx.cheer();
    await say([round.name.en, WHOSE[round.name.id]]);
    if (!alive()) return;
    if (r + 1 >= rounds.length) {
      onDone({ correct: got, total: rounds.length });
      return;
    }
    later(() => {
      const next = rounds[r + 1];
      setR(r + 1);
      setSlots(next.name.spell.split("").map(() => null));
      setComplete(false);
      setMissed(false);
      setHint(null);
      void say(next.name.en);
    }, 400);
  };

  const { drag, begin } = useDragDrop<number>((tile, zone) => {
    const ch = round.tiles[tile];
    if (!zone?.startsWith("s:")) {
      void say(ch);
      return;
    }
    const at = Number(zone.slice(2));
    if (slots[at] !== null || complete) return;
    const alive = turn();
    if (spell[at] === ch) {
      const next = slots.map((v, k) => (k === at ? tile : v));
      setSlots(next);
      if (hint === ch) setHint(null);
      if (next.some((v) => v === null)) {
        sfx.ding();
        void say(ch);
        return;
      }
      const got = missed ? score : score + 1;
      setScore(got);
      void answerFeedback({ name: [ch], right: true, then: [pick(LINES.praise)], alive }).then((ok) => ok && void finish(got, alive));
      return;
    }
    setMissed(true);
    setShake(at);
    setHint(ch);
    later(() => setShake((s) => (s === at ? null : s)), 600);
    void answerFeedback({ name: [ch], right: false, then: [pick(LINES.retry)], alive });
  });

  const used = new Set(slots.filter((v): v is number => v !== null));
  const art = "min(26vh, calc(20*var(--vw)))";

  return (
    <div className="flex min-h-full flex-col items-center justify-center-safe gap-[3vh] px-4 py-3">
      <div key={r} className="flex animate-pop-in items-center gap-4">
        <span className={complete && reading === null ? "animate-wiggle" : ""}>
          <NameArt name={round.name} size={art} />
        </span>
        <SpeakerButton text={round.name.en} size={88} />
      </div>
      <div key={`s-${r}`} className="flex animate-pop-in flex-wrap items-center justify-center gap-3">
        {spell.map((ch, k) => {
          const placed = slots[k];
          const over = drag?.over === `s:${k}`;
          const glow = (hint === ch && placed === null) || reading === k;
          return (
            <span
              key={k}
              data-drop={`s:${k}`}
              aria-label={ch}
              className={`grid place-items-center rounded-[1.8rem] border-4 transition-colors ${
                placed !== null ? (reading === k ? "border-brand bg-butter" : "border-transparent bg-mint") : over ? "border-brand bg-brand-soft" : "border-dashed border-paper-deep bg-white"
              } ${shake === k ? "animate-shake" : ""} ${glow ? "animate-breathe" : ""} ${hint === ch && placed === null ? "hint" : ""}`}
              style={TILE}
            >
              <Glyph ch={ch} className={placed === null ? "text-ink/15" : "text-ink"} style={TILE_FONT} />
            </span>
          );
        })}
      </div>
      <p className="glass rounded-full px-5 py-1.5 text-lg font-bold text-ink-soft short:py-1 short:text-base">글자를 끌어서 이름 칸에!</p>
      <div key={`t-${r}`} className="flex min-h-[min(17vh,calc(13*var(--vw)))] animate-pop-in flex-wrap items-center justify-center gap-3">
        {round.tiles.map((ch, t) =>
          used.has(t) ? (
            <span key={t} aria-hidden className="invisible" style={TILE} />
          ) : (
            <LetterTile key={t} ch={ch} tone="lilac" className={drag?.item === t ? "opacity-30" : ""} onGrab={begin(t)} />
          ),
        )}
      </div>
      <DragGhost drag={drag}>{(t) => <LetterTile ch={round.tiles[t]} tone="lilac" />}</DragGhost>
    </div>
  );
}
