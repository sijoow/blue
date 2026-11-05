"use client";

import type { BuiltOriginal } from "@/lib/originals";
import type { OnDone } from "../play/types";
import { BingoGame } from "./BingoGame";
import { BoardGame } from "./BoardGame";
import { FishGame } from "./FishGame";
import { HideGame } from "./HideGame";
import { MailGame } from "./MailGame";
import { NameGame } from "./NameGame";

/** 영어 놀이 한 판 — 영어 놀이 메뉴와 오늘의 길이 같이 쓴다 */
export function OriginalPlay({ built, onDone }: { built: BuiltOriginal; onDone: OnDone }) {
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
