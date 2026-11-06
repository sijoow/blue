/**
 * 이야기 그림책 — 업체 그림책(「Apples」: Apple. → Apple for Bear. → Happy Bear. → … → 반전)처럼 그 장 글자의 단어로 만든 짧은 반복 이야기.
 * 장마다 하나(복습 장은 알파벳 전체에서). 문장은 2~5낱말, 같은 틀을 되풀이하다 끝에 반전 하나. 2026-11-06 — 사용자가 고른 순서의 마지막(그림책 반복 이야기).
 * 그림은 새로 그리지 않고 이미 있는 것만: 블루이(안내 친구 기분 셋) · 빙고·엄마·아빠(이름 그림) · 하온이 얼굴 · 가족 · 단어 그림 52장.
 * 문장은 원어민 목소리(클로이)로 굽는다 — scripts/voice-lines 가 storyTexts() 를 영어 묶음에 넣는다. 단어 그림에 있는 낱말은 빨간 글씨(wordsIn).
 * 오늘의 길: ★★★ 둘째·넷째 미션의 첫 칸(그림책·노래 자리)이 이 이야기(curriculum/course). 그림책 메뉴에도 장마다 꽂힌다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { WORDS } from "./alphabet.ts";

/** 이야기에 나오는 사람 — 블루이 · 빙고 · 엄마 · 아빠 · 하온이 · 가족 넷 */
export type Who = "bluey" | "bingo" | "mum" | "dad" | "haon" | "family";

/** 쪽마다 움직임 — 깡총(hop) · 도리도리(shake) · 하트(hearts) · 달려감(run) · 살랑살랑(peek) · 커짐(big) */
export type StoryFx = "hop" | "shake" | "hearts" | "run" | "peek" | "big";

export interface StoryPage {
  /** 읽어 줄 문장(영어) — 화면에 그대로 쓰고 원어민 목소리로 읽는다 */
  text: string;
  /** 나오는 사람 — 그림 왼쪽 */
  who?: Who;
  /** 블루이 기분 — 안내 친구 그림 셋(happy·cheer·wow) */
  mood?: "happy" | "cheer" | "wow";
  /** 나오는 것 — 단어 그림 id(curriculum/alphabet WORDS) */
  things?: readonly string[];
  /** 움직임 — 사람이 있으면 사람이, 없으면 마지막 그림이(mover 를 주면 그 그림이) */
  fx?: StoryFx;
  /** 움직이는 그림(단어 id) — 기본은 사람, 사람이 없으면 마지막 그림 */
  mover?: string;
}

export interface Story {
  id: string;
  /** 몇째 장 이야기인지 */
  chapter: number;
  /** 제목(영어) — 표지에 쓰고 읽어 준다 */
  title: string;
  /** 한국어 제목 — 그림책 메뉴 카드 아래(부모가 알아보게) */
  ko: string;
  /** 표지 그림 */
  cover: { who?: Who; mood?: StoryPage["mood"]; things: readonly string[] };
  pages: readonly StoryPage[];
}

export const STORIES: readonly Story[] = [
  {
    id: "snack",
    chapter: 1,
    title: "Snack Time",
    ko: "간식 시간",
    cover: { who: "bluey", things: ["apple", "banana", "cake"] },
    pages: [
      { text: "An apple for Bluey.", who: "bluey", things: ["apple"] },
      { text: "Happy Bluey!", who: "bluey", mood: "cheer", fx: "hearts" },
      { text: "A banana for Bingo.", who: "bingo", things: ["banana"] },
      { text: "Happy Bingo!", who: "bingo", fx: "hearts" },
      { text: "A cake for Mum.", who: "mum", things: ["cake"] },
      { text: "Happy Mum!", who: "mum", fx: "hearts" },
      { text: "A cake for the dog?", things: ["cake", "dog"], fx: "hop" },
      { text: "No, no, dog!", things: ["dog"], fx: "shake" },
    ],
  },
  {
    id: "see",
    chapter: 2,
    title: "I See!",
    ko: "뭐가 보일까",
    cover: { who: "bluey", mood: "wow", things: ["egg", "hat"] },
    pages: [
      { text: "I see an egg.", who: "bluey", mood: "wow", things: ["egg"] },
      { text: "I see a fish.", who: "bluey", mood: "wow", things: ["fish"] },
      { text: "I see a goat.", who: "bluey", mood: "wow", things: ["goat"] },
      { text: "I see a hat.", who: "bluey", mood: "wow", things: ["hat"] },
      { text: "Hop! A frog!", things: ["hat", "frog"], fx: "hop" },
      { text: "Hello, frog!", who: "bluey", mood: "cheer", things: ["frog"] },
    ],
  },
  {
    id: "who",
    chapter: 3,
    title: "Who Is It?",
    ko: "누구일까",
    cover: { who: "bluey", mood: "wow", things: ["leaf"] },
    pages: [
      { text: "Who is it?", things: ["leaf"], fx: "peek" },
      { text: "A lion? No!", things: ["lion"], fx: "shake" },
      { text: "An iguana? No!", things: ["iguana"], fx: "shake" },
      { text: "A jellyfish? No!", things: ["jellyfish"], fx: "shake" },
      { text: "It is Dad!", who: "dad", fx: "hop" },
      { text: "A kite for Dad!", who: "dad", things: ["kite"], fx: "hearts" },
    ],
  },
  {
    id: "hello",
    chapter: 4,
    title: "Hello, Pig!",
    ko: "안녕, 돼지야",
    cover: { who: "bluey", things: ["pig"] },
    pages: [
      { text: "Hello, pig!", who: "bluey", things: ["pig"] },
      { text: "Hello, monkey!", who: "bluey", things: ["monkey"] },
      { text: "Hello, octopus!", who: "bluey", things: ["octopus"] },
      { text: "Hello, nose!", who: "bluey", mood: "wow", things: ["nose"] },
      { text: "Hello, pizza!", who: "bluey", mood: "wow", things: ["pizza"] },
      { text: "Yum!", who: "bluey", mood: "cheer", fx: "hearts" },
    ],
  },
  {
    id: "run",
    chapter: 5,
    title: "Run, Run!",
    ko: "달려라 달려",
    cover: { things: ["rabbit", "tiger"] },
    pages: [
      { text: "Run, rabbit, run!", things: ["rabbit"], fx: "run" },
      { text: "Run, tiger, run!", things: ["tiger"], fx: "run" },
      { text: "Run, queen, run!", things: ["queen"], fx: "run" },
      { text: "Run, sock, run!", things: ["sock"], fx: "run" },
      { text: "Stop! Look!", who: "bluey", mood: "wow" },
      { text: "A rainbow!", things: ["rainbow"], fx: "big" },
    ],
  },
  {
    id: "van",
    chapter: 6,
    title: "Beep, Beep!",
    ko: "빵빵",
    cover: { things: ["van"] },
    pages: [
      { text: "Beep, beep! A van!", things: ["van"], fx: "run" },
      { text: "A unicorn in the van.", things: ["unicorn", "van"] },
      { text: "A violin in the van.", things: ["violin", "van"] },
      { text: "A watermelon in the van.", things: ["watermelon", "van"] },
      { text: "A worm in the van?", things: ["worm", "van"], fx: "hop", mover: "worm" },
      { text: "Eek!", who: "bingo", fx: "shake" },
    ],
  },
  {
    id: "box",
    chapter: 7,
    title: "What Is in the Box?",
    ko: "상자 안에 뭐가 있을까",
    cover: { things: ["box"] },
    pages: [
      { text: "What is in the box?", things: ["box"], fx: "peek" },
      { text: "A yo-yo!", things: ["yo-yo"], fx: "hop" },
      { text: "Yogurt!", things: ["yogurt"], fx: "hop" },
      { text: "A zipper!", things: ["zipper"], fx: "hop" },
      { text: "A zebra? No!", things: ["zebra"], fx: "shake" },
      { text: "A fox!", things: ["fox"], fx: "hop" },
    ],
  },
  {
    id: "night",
    chapter: 8,
    title: "Night Night",
    ko: "잘 자",
    cover: { who: "family", things: ["moon"] },
    pages: [
      { text: "Night night, cat.", things: ["cat"] },
      { text: "Night night, fish.", things: ["fish"] },
      { text: "Night night, rabbit.", things: ["rabbit"] },
      { text: "Night night, moon.", things: ["moon"] },
      { text: "Night night, Bluey.", who: "bluey" },
      { text: "Night night, Haon!", who: "haon", fx: "hearts" },
    ],
  },
];

const BY_ID = new Map(STORIES.map((s) => [s.id, s]));

export function storyOf(id: string): Story | undefined {
  return BY_ID.get(id);
}

/** 그 장의 이야기 */
export function storyOfChapter(chapter: number): Story | undefined {
  return STORIES.find((s) => s.chapter === chapter);
}

/** 단어 그림이 있는 낱말(소문자) → 단어 id */
const WORD_EN = new Map(WORDS.map((w) => [w.en.toLowerCase(), w.id]));

/** 문장을 낱말 조각으로 — 띄어쓰기는 그대로 두고, 단어 그림에 있는 낱말은 word 에 그 id(빨간 글씨) */
export function wordsIn(text: string): { part: string; word?: string }[] {
  return text.split(/(\s+)/).filter(Boolean).flatMap((tok) => {
    const m = /^([^A-Za-z]*)([A-Za-z][A-Za-z-]*[A-Za-z]|[A-Za-z])([^A-Za-z]*)$/.exec(tok);
    const id = m ? WORD_EN.get(m[2].toLowerCase()) : undefined;
    if (!m || !id) return [{ part: tok }];
    return [m[1] ? { part: m[1] } : null, { part: m[2], word: id }, m[3] ? { part: m[3] } : null].filter((p): p is { part: string; word?: string } => p !== null);
  });
}

/** 끝 쪽 글 — 원어민 목소리로 읽는다 */
export const THE_END = "The End";

/** 이야기에 나오는 영어 — 제목 + 쪽 문장 + 끝(음성 굽기용) */
export function storyTexts(): string[] {
  return [...STORIES.flatMap((s) => [s.title, ...s.pages.map((p) => p.text)]), THE_END];
}

/** 이야기에 쓴 단어 id */
export function storyWords(s: Story): string[] {
  return [...new Set(s.pages.flatMap((p) => [...(p.things ?? []), ...wordsIn(p.text).flatMap((x) => (x.word ? [x.word] : []))]))];
}
