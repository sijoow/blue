/**
 * 영어 놀이 — 우리가 같이 만든 오리지널 영어 게임(2026-10-28 사용자: "너가 생각한거 다 넣어보자").
 * 놀이터(오늘의 영어에서 만난 놀이 다시 하기)와 따로 — 진도와 상관없이 늘 열려 있고, 글자·단어는 만난 글자로(모자라면 알파벳 앞에서 채움).
 * 놀이 방식은 우리가 정했다 — 토도영어 프리초이스 액티비티를 옮기지 않는다. 주인공은 블루이 가족.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export type OriginalId = "bingo" | "mail" | "name" | "hide" | "fish" | "board";

export interface Original {
  id: OriginalId;
  title: string;
  /** 카드 아래 — 이 놀이로 익히는 것(부모가 보는 말) */
  learn: string;
  /** 그림("scene:games:<id>")이 없을 때 카드·제목 옆 이모지 */
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
}

export const ORIGINALS: readonly Original[] = [
  { id: "bingo", title: "빙고랑 빙고!", learn: "단어 듣기", icon: "🎯", tone: "butter" },
  { id: "mail", title: "우편 배달", learn: "대·소문자 · 그림의 글자", icon: "✉️", tone: "rose" },
  { id: "name", title: "내 이름 HAON", learn: "글자 순서 · 이름 철자", icon: "🔤", tone: "lilac" },
  { id: "hide", title: "숨바꼭질", learn: "단어 듣기", icon: "🌳", tone: "mint" },
  { id: "fish", title: "글자 낚시", learn: "글자 알아보기", icon: "🐟", tone: "sky" },
  { id: "board", title: "주사위 말판", learn: "단어 복습", icon: "🎲", tone: "peach" },
];

export function originalOf(id: string): Original | undefined {
  return ORIGINALS.find((o) => o.id === id);
}

/**
 * 이름 만들기 — 하온이 이름이 맨 앞, 그다음 블루이 가족. en 은 영어 목소리로 읽는 이름(엄마·아빠는 블루이에서 부르는 말 그대로).
 * 그림: 하온이 = 한글나라 아이 얼굴("child:face"), 블루이 = 안내 친구("guide"), 나머지 "name:<id>"(없으면 가족 그림).
 */
export interface FamilyName {
  id: "haon" | "bluey" | "bingo" | "mum" | "dad";
  /** 맞출 글자(대문자) */
  spell: string;
  /** 영어로 읽는 이름 */
  en: string;
}

export const NAMES: readonly FamilyName[] = [
  { id: "haon", spell: "HAON", en: "Haon" },
  { id: "bluey", spell: "BLUEY", en: "Bluey" },
  { id: "bingo", spell: "BINGO", en: "Bingo" },
  { id: "mum", spell: "MUM", en: "Mum" },
  { id: "dad", spell: "DAD", en: "Dad" },
];

/** 주사위 말판 — 칸을 세는 영어 수(1~6) */
export const COUNT_EN: readonly string[] = ["one", "two", "three", "four", "five", "six"];
