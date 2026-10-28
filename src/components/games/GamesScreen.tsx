"use client";

import { useEffect, useState } from "react";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { MenuCard, Splash } from "@/components/ui";
import { ALPHABET } from "@/curriculum/alphabet";
import { gameReach } from "@/curriculum/games";
import { LINES } from "@/curriculum/lines";
import { menuOf } from "@/curriculum/menus";
import { ORIGINALS, type Original, type OriginalId } from "@/curriculum/originals";
import { useIsMaster } from "@/lib/auth";
import { buildOriginal, type BuiltOriginal } from "@/lib/originals";
import { finishGame, knownLetters, localDay } from "@/lib/progress";
import { seededRng } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";
import type { OnDone } from "../play/types";
import { OriginalArt } from "./art";
import { BingoGame } from "./BingoGame";
import { BoardGame } from "./BoardGame";
import { FishGame } from "./FishGame";
import { HideGame } from "./HideGame";
import { MailGame } from "./MailGame";
import { NameGame } from "./NameGame";

/*
 * 영어 놀이 — 우리가 같이 만든 오리지널 영어 게임 여섯(curriculum/originals). 진도와 상관없이 늘 열려 있고, 글자·단어는 만난 글자로.
 * 스티커는 놀이터처럼 놀이마다 하루 첫 판만 1장(lib/progress finishGame).
 */

type Phase = { name: "list" } | { name: "playing"; game: Original; built: BuiltOriginal; startedAt: number } | { name: "done"; game: Original; earned: number };

/** 새 판 — 섞을 씨앗과 시작 시각을 지금 시각으로. 카드를 누를 때만 부른다(렌더 중에 부르지 않는다) */
function freshOriginal(id: OriginalId, known: readonly string[]): { built: BuiltOriginal; startedAt: number } {
  const now = Date.now();
  return { built: buildOriginal(id, known, seededRng(now)), startedAt: now };
}

function Play({ built, onDone }: { built: BuiltOriginal; onDone: OnDone }) {
  switch (built.id) {
    case "bingo":
      return <BingoGame board={built.board} onDone={onDone} />;
    case "mail":
      return <MailGame rounds={built.rounds} onDone={onDone} />;
    case "name":
      return <NameGame rounds={built.rounds} onDone={onDone} />;
    case "hide":
      return <HideGame game={built.game} onDone={onDone} />;
    case "fish":
      return <FishGame rounds={built.rounds} onDone={onDone} />;
    case "board":
      return <BoardGame game={built.game} onDone={onDone} />;
  }
}

export default function GamesScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>({ name: "list" });
  const menu = menuOf("games");

  useEffect(() => {
    void say(LINES.games);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;

  const known = master ? ALPHABET : knownLetters(saved.progress);

  const start = (g: Original) => {
    sfx.wake();
    sfx.pop();
    setPhase({ name: "playing", game: g, ...freshOriginal(g.id, known) });
  };

  if (phase.name === "playing") {
    return (
      <ModeShell title={phase.game.title} icon={phase.game.icon} iconId="menu:games" scene="free" onBack={() => setPhase({ name: "list" })}>
        <Play
          built={phase.built}
          onDone={() => {
            const ms = Math.min(Date.now() - phase.startedAt, 30 * 60_000);
            const res = finishGame(readSaved().progress, phase.game.id, ms, localDay(new Date()));
            updateSaved((s) => ({ ...s, progress: res.next }));
            sfx.cheer();
            void say([pick(LINES.praise), ...(res.earned ? [LINES.stickers] : [])]);
            setPhase({ name: "done", game: phase.game, earned: res.earned });
          }}
        />
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${menu.id}`} scene="free">
      {/* 세로 화면은 카드가 화면보다 낮으면 위아래 가운데로(숫자놀이 사용자 10-27, 넘치면 그대로 스크롤) */}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 portrait:min-h-full portrait:content-center portrait:gap-3 portrait:p-3">
        {ORIGINALS.map((g) => (
          <MenuCard
            key={g.id}
            tone={g.tone}
            art={<OriginalArt id={g.id} />}
            artClassName="aspect-[4/3]"
            title={g.title}
            sub={g.id === "name" ? g.learn : `${g.learn} · ${gameReach(known)}`}
            onClick={() => start(g)}
          />
        ))}
      </div>
      {phase.name === "done" && (
        <DoneBurst earned={phase.earned} text="놀이 끝!" nextLabel="또 할래" onNext={() => start(phase.game)} secondLabel="다른 놀이" onSecond={() => setPhase({ name: "list" })} />
      )}
    </ModeShell>
  );
}
