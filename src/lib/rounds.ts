/**
 * 놀이 설계도(ActivitySpec) → 실제 판(어떤 글자·어떤 단어·보기 순서·방울 자리).
 * 무작위는 여기서만 쓴다 — 시작 버튼을 누를 때 한 번 섞고, 화면은 받은 판을 그대로 그린다.
 * 보기 글자가 모자라면(아직 아는 글자가 하나·둘) 알파벳에서 가까운 글자로 채운다 — 묻는 글자는 늘 배운 글자.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET, inOrder, letterIndex, letterOf, letterSpot, wordOf, WORDS, type WordOf } from "../curriculum/alphabet.ts";
import type { ActivitySpec, CaseShow, DayPlan } from "../curriculum/types.ts";

export type Rng = () => number;

/** 씨앗이 같으면 같은 순서 — 테스트와 미리 보기가 쓴다 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Case = "upper" | "lower";

export interface LetterRound {
  target: string;
  /** 보기 — 대문자 열쇠("A"), 보이는 모양은 show */
  choices: string[];
  show: Case;
}

export interface MatchRound {
  /** 위에서 끌어 갈 대문자 차례 */
  top: string[];
  /** 아래 놓을 곳(소문자) 차례 — 위와 같은 차례가 되지 않게 섞는다 */
  bottom: string[];
}

export interface MissingRound {
  /** 단어 id */
  word: string;
  /** 빈칸에 들어갈 글자(대문자 열쇠) */
  answer: string;
  choices: string[];
}

export interface WordRound {
  word: string;
  /** 그림 보기 — 단어 id, 첫 글자가 서로 다르다 */
  choices: string[];
}

export interface Bubble {
  key: string;
  letter: string;
  show: Case;
  /** 판 안의 자리(%) */
  x: number;
  y: number;
  /** 방울 크기 비율(0.85~1.1) */
  size: number;
}

export interface PopRound {
  target: string;
  bubbles: Bubble[];
}

export interface SeqRound {
  /** 보여 주는 글자 — 그 뒤 칸이 물음표 */
  seq: string[];
  answer: string;
  choices: string[];
}

/** 도장 퀴즈 한 문항 — 듣고 글자 찾기 또는 단어 듣고 그림 고르기 */
export type QuizRound = ({ type: "letter" } & LetterRound) | ({ type: "word" } & WordRound);

export type BuiltActivity =
  | { kind: "song"; letters: string[] }
  | { kind: "book"; letters: string[] }
  | { kind: "say"; rounds: { word: string }[] }
  | { kind: "quiz"; letters: string[]; rounds: QuizRound[] }
  | { kind: "meet"; letter: string }
  | { kind: "find-letter"; rounds: LetterRound[] }
  | { kind: "match-case"; rounds: MatchRound[] }
  | { kind: "missing-letter"; rounds: MissingRound[] }
  | { kind: "word-pick"; rounds: WordRound[] }
  | { kind: "pop"; rounds: PopRound[] }
  | { kind: "next-letter"; rounds: SeqRound[] }
  | { kind: "trace"; chars: string[] };

/** 점수를 세는 놀이인지 — 도장 퀴즈 날에는 이것만 나온다 */
export function isScored(kind: ActivitySpec["kind"]): boolean {
  return kind !== "meet" && kind !== "trace" && kind !== "song" && kind !== "book" && kind !== "say";
}

/** 목록을 한 바퀴씩 섞어 가며 count 개 — 판마다 고루 나오고, 같은 것이 연달아 나오지 않게 */
export function cycle<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const out: T[] = [];
  while (out.length < count && items.length > 0) {
    let lap = shuffle(items, rng);
    if (items.length > 1 && lap[0] === out[out.length - 1]) lap = [...lap.slice(1), lap[0]];
    out.push(...lap);
  }
  return out.slice(0, count);
}

/** 알파벳에서 가까운 차례로 — 보기를 채울 때 */
function nearest(target: string, skip: ReadonlySet<string>): string[] {
  const at = letterIndex(target);
  return ALPHABET.filter((l) => !skip.has(l)).sort((a, b) => Math.abs(letterIndex(a) - at) - Math.abs(letterIndex(b) - at) || letterIndex(a) - letterIndex(b));
}

/** 정답 말고 다른 글자 n 개 — 배운 글자 먼저, 모자라면 알파벳에서 가까운 글자 */
export function otherLetters(target: string, letters: readonly string[], n: number, rng: Rng): string[] {
  const known = shuffle(
    inOrder(letters).filter((l) => l !== target),
    rng,
  ).slice(0, n);
  if (known.length >= n) return known;
  const fill = nearest(target, new Set([target, ...known])).slice(0, n - known.length);
  return [...known, ...fill];
}

/** 글자 보기 — 정답 + 다른 글자, 섞어서 */
export function letterChoices(target: string, letters: readonly string[], count: number, rng: Rng): string[] {
  return shuffle([target, ...otherLetters(target, letters, count - 1, rng)], rng);
}

function caseFor(show: CaseShow, rng: Rng): Case {
  return show === "mix" ? (rng() < 0.5 ? "upper" : "lower") : show;
}

/** 그 글자들의 단어 — 판마다 고루 */
function wordsFor(letters: readonly string[], count: number, rng: Rng): WordOf[] {
  const set = new Set(inOrder(letters));
  return cycle(
    WORDS.filter((w) => set.has(w.letter)),
    count,
    rng,
  );
}

function findRounds(spec: Extract<ActivitySpec, { kind: "find-letter" }>, rng: Rng): LetterRound[] {
  return cycle(inOrder(spec.letters), spec.rounds, rng).map((target) => ({ target, choices: letterChoices(target, spec.letters, 3, rng), show: caseFor(spec.show, rng) }));
}

/** 짝꿍 — 판마다 셋(아는 글자가 둘이면 둘). 모든 글자가 고루 나오게 돌린다 */
function matchRounds(spec: Extract<ActivitySpec, { kind: "match-case" }>, rng: Rng): MatchRound[] {
  const letters = inOrder(spec.letters);
  const size = Math.min(3, Math.max(2, letters.length));
  const order = cycle(letters, spec.rounds * size, rng);
  return Array.from({ length: spec.rounds }, (_, i) => {
    let pairs = [...new Set(order.slice(i * size, i * size + size))];
    if (pairs.length < size) pairs = [...pairs, ...otherLetters(pairs[0], letters.filter((l) => !pairs.includes(l)), size - pairs.length, rng)];
    const top = shuffle(pairs, rng);
    let bottom = shuffle(pairs, rng);
    // 위아래 차례가 같으면 곧장 내리기만 하면 된다 — 한 칸 돌린다
    if (bottom.every((l, k) => l === top[k])) bottom = [...bottom.slice(1), bottom[0]];
    return { top, bottom };
  });
}

function missingRounds(spec: Extract<ActivitySpec, { kind: "missing-letter" }>, rng: Rng): MissingRound[] {
  return wordsFor(spec.letters, spec.rounds, rng).map((w) => ({ word: w.id, answer: w.letter, choices: letterChoices(w.letter, spec.letters, 3, rng) }));
}

/** 그림 보기 한 판 — 정답 단어 + 첫 글자가 다른 단어 둘(배운 글자의 단어 먼저) */
function wordRound(w: WordOf, letters: readonly string[], rng: Rng): WordRound {
  const others = otherLetters(w.letter, letters, 2, rng).map((l) => {
    const ws = letterOf(l).words;
    return ws[Math.floor(rng() * ws.length)].id;
  });
  return { word: w.id, choices: shuffle([w.id, ...others], rng) };
}

function wordRounds(spec: Extract<ActivitySpec, { kind: "word-pick" }>, rng: Rng): WordRound[] {
  return wordsFor(spec.letters, spec.rounds, rng).map((w) => wordRound(w, spec.letters, rng));
}

/** 도장 퀴즈 — 글자 찾기와 그림 고르기를 번갈아. 앞 장 글자(review)가 있으면 두 문항은 그 글자로 */
function quizRounds(spec: Extract<ActivitySpec, { kind: "quiz" }>, rng: Rng): QuizRound[] {
  const all = inOrder([...spec.letters, ...spec.review]);
  const fromReview = spec.review.length ? Math.min(2, spec.rounds) : 0;
  const targets = shuffle([...cycle(inOrder(spec.letters), spec.rounds - fromReview, rng), ...cycle(inOrder(spec.review), fromReview, rng)], rng);
  return targets.map((target, i): QuizRound => {
    if (i % 2 === 0) return { type: "letter", target, choices: letterChoices(target, all, 3, rng), show: rng() < 0.5 ? "upper" : "lower" };
    const ws = letterOf(target).words;
    const w = wordOf(ws[Math.floor(rng() * ws.length)].id);
    return { type: "word", ...wordRound(w, all, rng) };
  });
}

const POP_TOTAL = 8;
const POP_HITS = 3;

/** 글자 방울 — 여덟 개 중 셋이 그 글자(대문자·소문자 둘 다 섞어서), 나머지는 다른 글자. 자리는 4×2 칸 안에서 조금씩 흔든다 */
function popRounds(spec: Extract<ActivitySpec, { kind: "pop" }>, rng: Rng): PopRound[] {
  return cycle(inOrder(spec.letters), spec.rounds, rng).map((target, i) => {
    const pool = otherLetters(target, spec.letters, 4, rng);
    const hitCases: Case[] = shuffle(["upper", "lower", rng() < 0.5 ? "upper" : "lower"], rng);
    const marks = [...hitCases.map((show) => ({ letter: target, show })), ...Array.from({ length: POP_TOTAL - POP_HITS }, (_, k) => ({ letter: pool[k % pool.length], show: (rng() < 0.5 ? "upper" : "lower") as Case }))];
    const cells = shuffle(
      Array.from({ length: POP_TOTAL }, (_, k) => k),
      rng,
    );
    const bubbles = shuffle(marks, rng).map((m, k) => {
      const c = cells[k] % 4;
      const r = Math.floor(cells[k] / 4);
      return {
        key: `${i}-${k}`,
        ...m,
        x: Math.round(((c + 0.5 + (rng() - 0.5) * 0.3) / 4) * 100),
        y: Math.round(((r + 0.5 + (rng() - 0.5) * 0.3) / 2) * 100),
        size: Math.round((0.85 + rng() * 0.25) * 100) / 100,
      };
    });
    return { target, bubbles };
  });
}

/** 다음 글자 — 알파벳 차례로 이어진 글자에서 세 글자 + 물음표(글자가 적으면 짧게) */
function seqRounds(spec: Extract<ActivitySpec, { kind: "next-letter" }>, rng: Rng): SeqRound[] {
  const letters = inOrder(spec.letters);
  const len = Math.max(1, Math.min(3, letters.length - 1));
  const starts = Array.from({ length: Math.max(1, letters.length - len) }, (_, k) => k);
  return cycle(starts, spec.rounds, rng).map((s) => {
    const seq = letters.slice(s, s + len);
    const answer = letters[s + len] ?? nearest(seq[seq.length - 1], new Set(seq))[0];
    return { seq, answer, choices: letterChoices(answer, letters.filter((l) => !seq.includes(l)), 3, rng) };
  });
}

export function buildActivity(spec: ActivitySpec, rng: Rng): BuiltActivity {
  switch (spec.kind) {
    case "song":
      return { kind: "song", letters: inOrder(spec.letters) };
    case "book":
      return { kind: "book", letters: inOrder(spec.letters) };
    case "say":
      return { kind: "say", rounds: wordsFor(spec.letters, spec.rounds, rng).map((w) => ({ word: w.id })) };
    case "quiz":
      return { kind: "quiz", letters: inOrder([...spec.letters, ...spec.review]), rounds: quizRounds(spec, rng) };
    case "meet":
      return { kind: "meet", letter: spec.letter };
    case "find-letter":
      return { kind: "find-letter", rounds: findRounds(spec, rng) };
    case "match-case":
      return { kind: "match-case", rounds: matchRounds(spec, rng) };
    case "missing-letter":
      return { kind: "missing-letter", rounds: missingRounds(spec, rng) };
    case "word-pick":
      return { kind: "word-pick", rounds: wordRounds(spec, rng) };
    case "pop":
      return { kind: "pop", rounds: popRounds(spec, rng) };
    case "next-letter":
      return { kind: "next-letter", rounds: seqRounds(spec, rng) };
    case "trace":
      return { kind: "trace", chars: [...spec.chars] };
  }
}

export function buildSession(plan: DayPlan, rng: Rng): BuiltActivity[] {
  return plan.activities.map((a) => buildActivity(a, rng));
}

/** 빈칸 단어 — 배우는 글자 자리를 비운 소문자 단어 조각 [앞, 뒤] ("apple" → ["", "pple"], "box" → ["bo", ""]) */
export function wordGap(id: string): [string, string] {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error(`모르는 단어: ${id}`);
  const at = letterSpot(w);
  return [w.en.slice(0, at), w.en.slice(at + 1)];
}
