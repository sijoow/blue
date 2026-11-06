import { originalOf } from "../../curriculum/originals.ts";
import type { ActivityKind, ActivitySpec } from "@/curriculum/types";

/** 놀이 종류마다 아이 눈에 보이는 아이콘 — 오늘의 영어 순서 표시. 그림 "icon:play:<놀이>" 가 생기면 그 그림(components/Icon) */
export const KIND_ICON: Record<ActivityKind, string> = {
  song: "🎵",
  book: "📖",
  say: "🎤",
  quiz: "🏅",
  meet: "👋",
  "find-letter": "👂",
  "match-case": "🤝",
  "missing-letter": "🧩",
  "word-pick": "🍎",
  pop: "🎈",
  "next-letter": "➡️",
  trace: "✏️",
  game: "🎲",
  puzzle: "🔤",
  bridge: "🌉",
  "same-letter": "🔍",
  pair: "🃏",
  bubble: "💬",
};

/** 놀이 이름 — 부모 페이지 미리 보기·놀이터와 같은 말 */
export const KIND_LABEL: Record<ActivityKind, string> = {
  song: "노래",
  book: "그림책",
  say: "따라 말하기",
  quiz: "도장 퀴즈",
  meet: "알파벳 만나기",
  "find-letter": "글자 찾기",
  "match-case": "짝꿍 찾기",
  "missing-letter": "빈칸 글자",
  "word-pick": "그림 고르기",
  pop: "글자 방울",
  "next-letter": "다음 글자",
  trace: "따라 쓰기",
  game: "영어 놀이",
  puzzle: "글자 퍼즐",
  bridge: "다리 잇기",
  "same-letter": "같은 글자",
  pair: "그림 짝꿍",
  bubble: "말풍선",
};

/** 길 칸 하나의 이름·그림 — 영어 놀이는 그 놀이 이름으로 */
export interface PathCell {
  label: string;
  iconId: string;
  emoji: string;
}

export function cellOf(a: ActivitySpec): PathCell {
  if (a.kind === "game") {
    const o = originalOf(a.id);
    return { label: o?.title ?? KIND_LABEL.game, iconId: "menu:games", emoji: KIND_ICON.game };
  }
  return { label: KIND_LABEL[a.kind], iconId: `play:${a.kind}`, emoji: KIND_ICON[a.kind] };
}
