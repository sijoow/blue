/**
 * 영어 놀이(오리지널) 판 만들기 — 무작위는 여기서만. 글자·단어는 지금 아는 글자로, 모자라면 알파벳 차례로 이어서 채운다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET, letterIndex, letterOf, WORDS } from "../curriculum/alphabet.ts";
import { playLetters } from "../curriculum/games.ts";
import { NAMES, type FamilyName, type OriginalId } from "../curriculum/originals.ts";
import { shuffle, type Case, type Rng } from "./rounds.ts";

export interface BingoBoard {
  /** 3×3 칸 — 단어 id, 왼쪽 위부터 */
  cells: string[];
  /** 부를 차례 — 칸 단어를 모두 섞어서 */
  calls: string[];
}

export type MailItem = { kind: "letter"; letter: string } | { kind: "parcel"; letter: string; word: string };

export interface MailRound {
  /** 우편함 — 소문자로 보이는 글자(대문자 열쇠) */
  boxes: string[];
  /** 배달할 것 — 우편함마다 하나, 섞은 차례 */
  items: MailItem[];
}

export interface NameRound {
  name: FamilyName;
  /** 아래 글자 조각 차례 — 이름 글자를 섞은 것(같은 글자 둘이면 둘 다) */
  tiles: string[];
}

export interface HideGame {
  /** 덤불 자리마다 숨은 단어 */
  spots: string[];
  /** 찾을 차례 */
  targets: string[];
}

export interface FishRound {
  target: string;
  show: Case;
  /** 헤엄치는 물고기 글자(대문자 열쇠) — 답이 하나 들어 있다 */
  fish: string[];
}

export interface BoardGame {
  /** 출발과 도착 사이 칸 — 단어 id */
  cells: string[];
}

/** 한 판 — 카드를 누를 때 한 번 섞어서 만든다(화면은 받은 판을 그대로) */
export type BuiltOriginal =
  | { id: "bingo"; board: BingoBoard }
  | { id: "mail"; rounds: MailRound[] }
  | { id: "name"; rounds: NameRound[] }
  | { id: "hide"; game: HideGame }
  | { id: "fish"; rounds: FishRound[] }
  | { id: "board"; game: BoardGame };

export const BINGO_SIZE = 3;
export const BOARD_CELLS = 14;
const HIDE_SPOTS = 5;
const HIDE_FINDS = 4;

export function buildOriginal(id: OriginalId, known: readonly string[], rng: Rng): BuiltOriginal {
  switch (id) {
    case "bingo":
      return { id, board: bingoBoard(known, rng) };
    case "mail":
      return { id, rounds: mailRounds(known, 2, rng) };
    case "name":
      return { id, rounds: nameRounds(3, rng) };
    case "hide":
      return { id, game: hideGame(known, rng) };
    case "fish":
      return { id, rounds: fishRounds(known, 5, rng) };
    case "board":
      return { id, game: { cells: wordPool(known, BOARD_CELLS, rng) } };
  }
}

/**
 * 단어 n 개 — 아는 글자의 단어에서 섞어 고른다. 모자라면 아는 글자 다음 글자부터 차례로 더한다(그림·소리로 처음 만나는 단어는 괜찮다).
 * 52개를 넘게 달라고 하면 52개까지만.
 */
export function wordPool(known: readonly string[], n: number, rng: Rng): string[] {
  const letters = playLetters(known);
  const have = new Set(letters);
  let next = letterIndex(letters[letters.length - 1]) + 1;
  const count = () => WORDS.filter((w) => have.has(w.letter)).length;
  while (count() < n && have.size < ALPHABET.length) {
    have.add(ALPHABET[next % ALPHABET.length]);
    next++;
  }
  return shuffle(
    WORDS.filter((w) => have.has(w.letter)).map((w) => w.id),
    rng,
  ).slice(0, n);
}

export function bingoBoard(known: readonly string[], rng: Rng): BingoBoard {
  const cells = wordPool(known, BINGO_SIZE * BINGO_SIZE, rng);
  return { cells, calls: shuffle(cells, rng) };
}

/** 빙고 줄 — 가로·세로·대각선(칸 번호) */
export const BINGO_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** 다 찬 줄 — 없으면 null */
export function bingoLine(marked: ReadonlySet<number>): readonly number[] | null {
  return BINGO_LINES.find((line) => line.every((i) => marked.has(i))) ?? null;
}

export function mailRounds(known: readonly string[], count: number, rng: Rng): MailRound[] {
  const letters = playLetters(known);
  const out: MailRound[] = [];
  for (let r = 0; r < count; r++) {
    // 앞 판과 같은 우편함 셋이 되지 않게 — 글자가 넉넉하면
    const prev = out[r - 1]?.boxes ?? [];
    const fresh = letters.filter((l) => !prev.includes(l));
    const boxes = shuffle(fresh.length >= 3 ? fresh : letters, rng).slice(0, 3);
    const items = shuffle(
      boxes.map((letter): MailItem => {
        if (rng() < 0.5) return { kind: "letter", letter };
        const ws = letterOf(letter).words;
        return { kind: "parcel", letter, word: ws[Math.floor(rng() * ws.length)].id };
      }),
      rng,
    );
    out.push({ boxes, items });
  }
  return out;
}

/** 이름 — 하온이 이름은 늘 첫 판, 나머지는 가족 이름에서 섞어서 */
export function nameRounds(count: number, rng: Rng): NameRound[] {
  const [mine, ...family] = NAMES;
  const names = [mine, ...shuffle(family, rng).slice(0, Math.max(0, count - 1))];
  return names.map((name) => ({ name, tiles: scrambled([...name.spell], rng) }));
}

/** 섞되 원래 차례 그대로는 피한다(글자가 모두 같은 경우만 빼고) */
function scrambled(letters: string[], rng: Rng): string[] {
  if (new Set(letters).size < 2) return letters;
  for (let i = 0; i < 8; i++) {
    const s = shuffle(letters, rng);
    if (s.join("") !== letters.join("")) return s;
  }
  return [...letters].reverse();
}

export function hideGame(known: readonly string[], rng: Rng): HideGame {
  const spots = wordPool(known, HIDE_SPOTS, rng);
  return { spots, targets: shuffle(spots, rng).slice(0, HIDE_FINDS) };
}

export function fishRounds(known: readonly string[], count: number, rng: Rng): FishRound[] {
  const letters = playLetters(known);
  const targets = shuffle(letters, rng);
  const out: FishRound[] = [];
  for (let r = 0; r < count; r++) {
    const target = targets[r % targets.length];
    const others = shuffle(
      letters.filter((l) => l !== target),
      rng,
    ).slice(0, 3);
    // 앞 두 판은 대문자, 그다음은 소문자도 섞어서
    const show: Case = r < 2 || rng() < 0.5 ? "upper" : "lower";
    out.push({ target, show, fish: shuffle([target, ...others], rng) });
  }
  return out;
}
