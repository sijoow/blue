"use client";

import type { BuiltActivity } from "@/lib/rounds";
import { FindLetter } from "./activities/FindLetter";
import { MatchCase } from "./activities/MatchCase";
import { Meet } from "./activities/Meet";
import { MissingLetter } from "./activities/MissingLetter";
import { NextLetter } from "./activities/NextLetter";
import { Book } from "./activities/Book";
import { Pop } from "./activities/Pop";
import { Quiz } from "./activities/Quiz";
import { Say } from "./activities/Say";
import { Song } from "./activities/Song";
import { Trace } from "./activities/Trace";
import { WordPick } from "./activities/WordPick";
import type { OnDone } from "./types";

/** 놀이 판 하나 — 오늘의 영어와 놀이터가 같이 쓴다. assess 는 도장 놀이(틀리면 정답을 보여 주고 다음) */
export function ActivityHost({ built, assess, onDone }: { built: BuiltActivity; assess: boolean; onDone: OnDone }) {
  switch (built.kind) {
    case "song":
      return <Song letters={built.letters} onDone={onDone} />;
    case "book":
      return <Book letters={built.letters} onDone={onDone} />;
    case "say":
      return <Say rounds={built.rounds} onDone={onDone} />;
    case "quiz":
      return <Quiz letters={built.letters} rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "meet":
      return <Meet letter={built.letter} onDone={onDone} />;
    case "find-letter":
      return <FindLetter rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "match-case":
      return <MatchCase rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "missing-letter":
      return <MissingLetter rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "word-pick":
      return <WordPick rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "pop":
      return <Pop rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "next-letter":
      return <NextLetter rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "trace":
      return <Trace chars={built.chars} onDone={onDone} />;
  }
}
