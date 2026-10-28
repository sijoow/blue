import type { ActivityKind } from "@/curriculum/types";

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
};
