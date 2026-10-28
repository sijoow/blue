/**
 * 첫 화면 아래 메뉴 — 아이가 바로 알아듣는 말로. 메뉴 화면 제목(ModeShell)도 이 이름을 쓴다.
 * 구성은 업체 메뉴를 따른다(2026-10-28 사용자: 토도 구성 따라가기) — 프리초이스 = 놀이터, 비디오 도서관 = 노래, 그림책 도서관 = 그림책, 단어장.
 * 그림은 힉스필드 "icon:menu:<id>"(블루이 친구가 그 놀이를 하는 모습) — 없으면 이모지.
 * 「영어 놀이」 = 우리가 같이 만든 오리지널 게임(curriculum/originals, 2026-10-28 사용자) — 업체 메뉴에 없는 우리 것.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET } from "./alphabet.ts";
import { CHAPTERS } from "./course.ts";

export type MenuId = "free" | "games" | "songs" | "books" | "letters" | "write";

export interface Menu {
  id: MenuId;
  href: string;
  title: string;
  /** 그림이 없을 때 대신 보일 이모지 */
  icon: string;
  tone: "sky" | "butter" | "mint" | "lilac" | "rose" | "peach";
}

export const MENUS: Menu[] = [
  { id: "free", href: "/free", title: "놀이터", icon: "🎮", tone: "sky" },
  { id: "games", href: "/games", title: "영어 놀이", icon: "🎲", tone: "peach" },
  { id: "songs", href: "/songs", title: "노래", icon: "🎵", tone: "rose" },
  { id: "books", href: "/books", title: "그림책", icon: "📖", tone: "lilac" },
  { id: "letters", href: "/letters", title: "단어장", icon: "🔤", tone: "butter" },
  { id: "write", href: "/write", title: "글자 쓰기", icon: "✏️", tone: "mint" },
];

export function menuOf(id: MenuId): Menu {
  return MENUS.find((m) => m.id === id) ?? MENUS[0];
}

/** 노래·그림책 목록 — 장마다 하나(그 장 글자) + 알파벳 전체. 글자를 다 만났으면 열린다 */
export interface Shelf {
  id: string;
  title: string;
  letters: readonly string[];
}

export const SHELF: readonly Shelf[] = [
  ...CHAPTERS.filter((c) => c.meets.length).map((c) => ({ id: c.code, title: c.title, letters: c.meets })),
  { id: "ABC", title: "A ~ Z", letters: ALPHABET },
];
