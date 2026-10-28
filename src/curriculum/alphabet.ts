/**
 * 알파벳 26자와 대표 단어 — 토도영어 레벨 A·B 목표("각 글자로 시작하는 대표 단어")를 따라 글자마다 둘.
 * 단어는 4살이 그림으로 알아보는 것만(사물·동물·먹을 것). 그림은 힉스필드 "word:<id>"(블루이 그림체) — 아직 없으면 이모지.
 * X 는 첫소리로 쓰는 쉬운 말이 없어서 끝 글자(box·fox) — at: "end".
 * 영어(글자 이름·단어)는 원어민 목소리로, 뜻(ko)은 한국어 안내 목소리로 읽는다(lib/voice 가 글자로 가른다).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export interface Word {
  id: string;
  /** 영어 — 화면에 쓰고 원어민 목소리로 읽는다 */
  en: string;
  /** 뜻 — 단어를 누르면 영어 다음에 한국어로 */
  ko: string;
  /** 그림이 없을 때 임시 */
  emoji: string;
  /** 배우는 글자가 단어 어디에 있나 — 기본 맨 앞, X 는 맨 끝 */
  at?: "end";
}

export interface Letter {
  upper: string;
  lower: string;
  words: readonly [Word, Word];
}

const w = (id: string, ko: string, emoji: string, at?: "end"): Word => ({ id, en: id, ko, emoji, ...(at ? { at } : {}) });

export const LETTERS: readonly Letter[] = [
  { upper: "A", lower: "a", words: [w("apple", "사과", "🍎"), w("ant", "개미", "🐜")] },
  { upper: "B", lower: "b", words: [w("ball", "공", "⚽"), w("banana", "바나나", "🍌")] },
  { upper: "C", lower: "c", words: [w("cat", "고양이", "🐱"), w("cake", "케이크", "🍰")] },
  { upper: "D", lower: "d", words: [w("dog", "강아지", "🐶"), w("duck", "오리", "🦆")] },
  { upper: "E", lower: "e", words: [w("egg", "달걀", "🥚"), w("elephant", "코끼리", "🐘")] },
  { upper: "F", lower: "f", words: [w("fish", "물고기", "🐟"), w("frog", "개구리", "🐸")] },
  { upper: "G", lower: "g", words: [w("goat", "염소", "🐐"), w("grapes", "포도", "🍇")] },
  { upper: "H", lower: "h", words: [w("hat", "모자", "👒"), w("horse", "말", "🐴")] },
  { upper: "I", lower: "i", words: [w("igloo", "이글루", "🛖"), w("iguana", "이구아나", "🦎")] },
  { upper: "J", lower: "j", words: [w("juice", "주스", "🧃"), w("jellyfish", "해파리", "🪼")] },
  { upper: "K", lower: "k", words: [w("kite", "연", "🪁"), w("key", "열쇠", "🔑")] },
  { upper: "L", lower: "l", words: [w("lion", "사자", "🦁"), w("leaf", "나뭇잎", "🍃")] },
  { upper: "M", lower: "m", words: [w("moon", "달", "🌙"), w("monkey", "원숭이", "🐵")] },
  { upper: "N", lower: "n", words: [w("nest", "둥지", "🪺"), w("nose", "코", "👃")] },
  { upper: "O", lower: "o", words: [w("octopus", "문어", "🐙"), w("orange", "오렌지", "🍊")] },
  { upper: "P", lower: "p", words: [w("pig", "돼지", "🐷"), w("pizza", "피자", "🍕")] },
  { upper: "Q", lower: "q", words: [w("queen", "여왕", "👸"), w("quilt", "누비이불", "🛏️")] },
  { upper: "R", lower: "r", words: [w("rabbit", "토끼", "🐰"), w("rainbow", "무지개", "🌈")] },
  { upper: "S", lower: "s", words: [w("sun", "해", "☀️"), w("sock", "양말", "🧦")] },
  { upper: "T", lower: "t", words: [w("tiger", "호랑이", "🐯"), w("tree", "나무", "🌳")] },
  { upper: "U", lower: "u", words: [w("umbrella", "우산", "☂️"), w("unicorn", "유니콘", "🦄")] },
  { upper: "V", lower: "v", words: [w("van", "승합차", "🚐"), w("violin", "바이올린", "🎻")] },
  { upper: "W", lower: "w", words: [w("watermelon", "수박", "🍉"), w("worm", "지렁이", "🪱")] },
  { upper: "X", lower: "x", words: [w("box", "상자", "📦", "end"), w("fox", "여우", "🦊", "end")] },
  { upper: "Y", lower: "y", words: [w("yo-yo", "요요", "🪀"), w("yogurt", "요거트", "🥛")] },
  { upper: "Z", lower: "z", words: [w("zebra", "얼룩말", "🦓"), w("zipper", "지퍼", "🤐")] },
];

/** "A" … "Z" */
export const ALPHABET: readonly string[] = LETTERS.map((l) => l.upper);

const BY_UPPER = new Map(LETTERS.map((l) => [l.upper, l]));

export function letterOf(upper: string): Letter {
  const l = BY_UPPER.get(upper);
  if (!l) throw new Error(`모르는 글자: ${upper}`);
  return l;
}

export function isLetter(v: unknown): v is string {
  return typeof v === "string" && BY_UPPER.has(v);
}

/** 알파벳 차례(0부터) */
export function letterIndex(upper: string): number {
  return ALPHABET.indexOf(letterOf(upper).upper);
}

/** 알파벳 차례대로 늘어놓기 — 겹치는 것은 하나만 */
export function inOrder(letters: Iterable<string>): string[] {
  return [...new Set(letters)].filter(isLetter).sort((a, b) => letterIndex(a) - letterIndex(b));
}

/** 그 글자의 대문자·소문자 */
export function caseOf(upper: string, c: "upper" | "lower"): string {
  const l = letterOf(upper);
  return c === "upper" ? l.upper : l.lower;
}

/** 단어와 그 단어의 글자 */
export interface WordOf extends Word {
  letter: string;
}

export const WORDS: readonly WordOf[] = LETTERS.flatMap((l) => l.words.map((wd) => ({ ...wd, letter: l.upper })));

const WORD_BY_ID = new Map(WORDS.map((wd) => [wd.id, wd]));

export function wordOf(id: string): WordOf {
  const wd = WORD_BY_ID.get(id);
  if (!wd) throw new Error(`모르는 단어: ${id}`);
  return wd;
}

/** 단어에서 배우는 글자 자리 — 보통 0, X 단어는 끝 */
export function letterSpot(wd: Word): number {
  return wd.at === "end" ? wd.en.length - 1 : 0;
}
