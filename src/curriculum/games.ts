/**
 * 놀이터 — 오늘의 영어에서 만난 놀이를 언제든 다시 한다. 놀이 종류가 처음 나온 날을 지나면 열린다(course.firstSeen).
 * 글자는 지금까지 만난 글자로만(아직 셋이 안 되면 A·B·C 까지) — 아는 글자로만 논다.
 * 그림은 힉스필드 "scene:free:<id>"(카드 장면) — 없으면 이모지.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET, inOrder } from "./alphabet.ts";
import { firstSeen } from "./course.ts";
import type { ActivityKind, ActivitySpec } from "./types.ts";

export interface PlayContext {
  /** 지금 아는 글자 — 알파벳 차례 */
  known: readonly string[];
}

export interface Game {
  id: ActivityKind;
  title: string;
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
  spec: (c: PlayContext) => ActivitySpec;
}

/** 놀이터에서 쓰는 글자 — 아는 글자, 셋이 안 되면 알파벳 앞에서부터 채운다 */
export function playLetters(known: readonly string[]): string[] {
  const k = inOrder(known);
  return k.length >= 3 ? k : inOrder([...k, ...ALPHABET.slice(0, 3)]);
}

export const GAMES: readonly Game[] = [
  { id: "find-letter", title: "글자 찾기", icon: "👂", tone: "sky", spec: ({ known }) => ({ kind: "find-letter", letters: playLetters(known), show: "mix", rounds: 5 }) },
  { id: "match-case", title: "짝꿍 찾기", icon: "🤝", tone: "butter", spec: ({ known }) => ({ kind: "match-case", letters: playLetters(known), rounds: 3 }) },
  { id: "word-pick", title: "그림 고르기", icon: "🍎", tone: "rose", spec: ({ known }) => ({ kind: "word-pick", letters: playLetters(known), rounds: 5 }) },
  { id: "missing-letter", title: "빈칸 글자", icon: "🧩", tone: "mint", spec: ({ known }) => ({ kind: "missing-letter", letters: playLetters(known), rounds: 4 }) },
  { id: "pop", title: "글자 방울", icon: "🎈", tone: "lilac", spec: ({ known }) => ({ kind: "pop", letters: playLetters(known), rounds: 3 }) },
  { id: "next-letter", title: "다음 글자", icon: "➡️", tone: "peach", spec: ({ known }) => ({ kind: "next-letter", letters: playLetters(known), rounds: 4 }) },
  { id: "say", title: "따라 말하기", icon: "🎤", tone: "sky", spec: ({ known }) => ({ kind: "say", letters: playLetters(known), rounds: 4 }) },
];

/** 놀이터 카드 아래 "A~H" — 이 놀이에 나오는 글자 범위 */
export function gameReach(known: readonly string[]): string {
  const k = playLetters(known);
  return `${k[0]}~${k[k.length - 1]}`;
}

export function gameOf(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

/** 이 놀이가 열리는 날 */
export function gameOpens(g: Game): { chapter: number; day: number } {
  return firstSeen(g.id) ?? { chapter: 1, day: 1 };
}
