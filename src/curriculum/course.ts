/**
 * 영어교실 과정표 — 업체(토도영어) 데일리 코스의 레벨·유닛 순서를 따른다(docs/HANDOFF.md 4절, 2026-10-27 사용자 결정).
 *   레벨 A(A~P) 유닛 1~4 → 레벨 B(Q~Z) 유닛 1~3 + 유닛 4 복습. 장 하나 = 유닛 하나.
 *   유닛 목표·순서는 업체 공개 교사용 페이지(todoclassroom.com/todoenglish/curri) 그대로, 놀이·화면·캐릭터는 우리 것(앱을 옮기지 않는다).
 * 장 안 구성은 형제 앱을 따른다(2026-11-05 사용자: 숫자놀이·한글나라 구성) — 미션 13개 = ★ 넷(아래 표) → ★★ 넷 → ★★★ 넷(같은 놀이를 한 단계씩 어렵게, curriculum/level) → 도장 퀴즈.
 *   8장 × 13 = 104 미션. 미션 하나 = 오늘의 길 10칸 — 노래·그림책(업체 하루의 영상·책 자리) → 놀이 → 영어 놀이 한 판 → 따라 쓰기. 15~20분쯤(업체 하루와 같다).
 *   새 글자는 ★ 에서 하루에 하나씩, 앞 글자를 되풀이한다(나선형). 표에 적지 않은 칸은 그날까지 만난 글자로 짧게 채운다(fillDay).
 * 도장 퀴즈(업체의 유닛 테스트 자리) — 단어 미리 보기 → 10문항. 통과는 첫 두 장 50%, 그 뒤 70%(한글나라와 같다 — 기준은 글을 모르는 네 살).
 *   결과는 업체처럼 세 단계(80 미만 동 · 80 이상 은 · 100 금)이고 지난 장 퀴즈는 언제든 다시 풀 수 있다(가장 좋은 결과가 남는다).
 *   못 받으면 추가 학습(★ 네 미션을 다시) → 도장 퀴즈 한 번 더. 두 번째도 못 받으면 다음 장으로(부모 페이지 '다시 볼 장').
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET, letterOf } from "./alphabet.ts";
import { hardenSpec } from "./level.ts";
import type { OriginalId } from "./originals.ts";
import type { ActivitySpec, CaseShow, Chapter, DayPlan, Level } from "./types.ts";

/** 단계 하나의 미션 수 · 장 하나의 단계 수 — 그 뒤에 도장 퀴즈 */
export const DAYS_PER_STAGE = 4;
export const STAGES = 3;
export const DAYS_PER_CHAPTER = DAYS_PER_STAGE * STAGES + 1;
/** 미션 하나의 칸 수(도장 퀴즈 날 빼고) */
export const DAY_MISSIONS = 10;
/** 추가 학습 — ★ 네 미션을 다시 */
export const PRACTICE_DAYS = DAYS_PER_STAGE;
/** 첫 두 장은 쉬운 판 — 판을 줄이고 통과 기준을 낮춘다(한글나라 1~2단원과 같다) */
export const EASY_CHAPTERS = 2;
/** 도장 퀴즈를 몇 번까지 하나 — 추가 학습 뒤 두 번째도 못 받으면 다음 장으로 */
export const STAMP_TRIES = 2;
/** 도장 퀴즈 문항 수 — 업체 유닛 테스트와 같다 */
export const QUIZ_ROUNDS = 10;

/** 도장 퀴즈 통과 기준 */
export function passRateOf(chapter: number): number {
  return chapter <= EASY_CHAPTERS ? 0.5 : 0.7;
}

/** 퀴즈 결과 세 단계 — 업체 트로피(80 미만 · 80 이상 · 100) */
export type Medal = "bronze" | "silver" | "gold";
export function medalOf(rate: number): Medal {
  return rate >= 1 ? "gold" : rate >= 0.8 ? "silver" : "bronze";
}

/** 레벨 이름 — 업체 레벨 소개 그대로 */
export const LEVEL_NAMES = { A: "알파벳 A~P", B: "알파벳 Q~Z" } as const;

const L = (s: string): string[] => [...s];
const song = (letters: string): ActivitySpec => ({ kind: "song", letters: L(letters) });
const book = (letters: string): ActivitySpec => ({ kind: "book", letters: L(letters) });
const sayIt = (letters: string, rounds = 3): ActivitySpec => ({ kind: "say", letters: L(letters), rounds });
const meet = (letter: string): ActivitySpec => ({ kind: "meet", letter });
const find = (letters: string, show: CaseShow, rounds = 4): ActivitySpec => ({ kind: "find-letter", letters: L(letters), show, rounds });
const match = (letters: string, rounds = 2): ActivitySpec => ({ kind: "match-case", letters: L(letters), rounds });
const missing = (letters: string, rounds = 3): ActivitySpec => ({ kind: "missing-letter", letters: L(letters), rounds });
const word = (letters: string, rounds = 4): ActivitySpec => ({ kind: "word-pick", letters: L(letters), rounds });
const pop = (letters: string, rounds = 2): ActivitySpec => ({ kind: "pop", letters: L(letters), rounds });
const next = (letters: string, rounds = 4): ActivitySpec => ({ kind: "next-letter", letters: L(letters), rounds });
/** 대문자·소문자 둘 다 따라 쓰기 — "B" → B b */
const trace = (letters: string): ActivitySpec => ({ kind: "trace", chars: L(letters).flatMap((u) => [u, letterOf(u).lower]) });
/** 적은 글자 그대로 따라 쓰기 — "bd" → b d (헷갈리는 소문자 복습) */
const traceOnly = (chars: string): ActivitySpec => ({ kind: "trace", chars: L(chars) });

/** 도장 퀴즈 — 이 장 글자 + 앞 장 글자 조금(업체 후기: 이전 레벨 단어도 나온다) */
const stamp = (letters: string, before: string): ActivitySpec[] => [{ kind: "quiz", letters: L(letters), review: L(before.slice(-4)), rounds: QUIZ_ROUNDS }];

/** 알파벳 차례로 이어진 마지막 여덟 글자 — 「다음 글자」 복습 범위 */
const recent = (letters: string): string => letters.slice(-8);

/** 장 하나의 표 — ★ 네 날(written) · 칸을 채울 때 더 꺼내 쓰는 놀이(pool) · 도장 퀴즈 */
interface UnitTable {
  written: ActivitySpec[][];
  pool: ActivitySpec[];
  stampDay: ActivitySpec[];
}

/** 새 글자 넷(레벨 A 유닛) — 하루 한 글자. 날마다 노래(그 장에서 만난 글자) → 그림책(오늘 글자) → 놀이 → 따라 쓰기 */
function unit4(cur: string, before: string): UnitTable {
  const [a, b, c, d] = L(cur);
  return {
    written: [
      [song(a), book(a), meet(a), find(a, "upper", 3), word(a, 3), trace(a)],
      [song(a + b), book(b), meet(b), find(a + b, "upper"), match(a + b), trace(b)],
      [song(a + b + c), book(c), meet(c), word(a + b + c), sayIt(a + b + c), trace(c)],
      [song(cur), book(d), meet(d), match(cur), missing(cur), trace(d)],
    ],
    pool: [find(cur, "mix"), pop(cur), sayIt(cur), ...(before ? [next(recent(before + cur))] : [])],
    stampDay: stamp(cur, before),
  };
}

/** 새 글자 셋(레벨 B 유닛 2·3) — 사흘 동안 만나고 넷째 날은 모아 보기 */
function unit3(cur: string, before: string): UnitTable {
  const [a, b, c] = L(cur);
  return {
    written: [
      [song(a), book(a), meet(a), find(a, "upper", 3), word(a, 3), trace(a)],
      [song(a + b), book(b), meet(b), find(a + b, "upper"), match(a + b), trace(b)],
      [song(cur), book(c), meet(c), word(cur), sayIt(cur), trace(c)],
      [song(cur), book(cur), match(cur), missing(cur), pop(cur), traceOnly(cur.toLowerCase())],
    ],
    pool: [find(cur, "mix"), word(cur), sayIt(cur), next(recent(before + cur))],
    stampDay: stamp(cur, before),
  };
}

const ABC = ALPHABET.join("");
const upTo = (last: string): string => ABC.slice(0, ABC.indexOf(last) + 1);

/** 전체 복습(레벨 B 유닛 4) — 새 글자 없이 알파벳을 세 묶음으로, 넷째 날은 모양이 헷갈리는 소문자(b·d·p·q, m·n·u·w) */
const REVIEW_UNIT: UnitTable = {
  written: [
    [song("ABCDEFGHI"), book("ABCDEFGHI"), next("ABCDEFGHI"), find("ABCDEFGHI", "mix"), match("ABCDEFGHI"), traceOnly("bd")],
    [song("JKLMNOPQR"), book("JKLMNOPQR"), next("JKLMNOPQR"), find("JKLMNOPQR", "mix"), pop("JKLMNOPQR"), missing("JKLMNOPQR")],
    [song("STUVWXYZ"), book("STUVWXYZ"), next("STUVWXYZ"), find("STUVWXYZ", "mix"), match("STUVWXYZ"), word("STUVWXYZ")],
    [song("BDPQ"), find("BDPQ", "lower"), match("BDPQ"), pop("MNUW"), sayIt("BDPQ"), traceOnly("pq")],
  ],
  pool: [next(ABC), pop(ABC), missing(ABC), word(ABC)],
  stampDay: [{ kind: "quiz", letters: L(ABC), review: [], rounds: QUIZ_ROUNDS }],
};

/** 길에 끼는 영어 놀이 — 주사위 말판은 한 판이 길어서 뺀다 */
const GUESTS: readonly OriginalId[] = ["bingo", "mail", "hide", "fish", "name"];

/** 채움 칸 — 그날까지 만난 글자로만, 판은 짧게. 노래·그림책·만나기·따라 쓰기는 채우지 않는다. 못 맞추면 null */
function fitToKnown(a: ActivitySpec, known: ReadonlySet<string>, easy: boolean): ActivitySpec | null {
  switch (a.kind) {
    case "find-letter":
    case "match-case":
    case "missing-letter":
    case "word-pick":
    case "pop":
    case "next-letter":
    case "say": {
      const letters = a.letters.filter((l) => known.has(l));
      // 짝꿍·다음 글자는 글자가 둘은 있어야 한다
      if (letters.length < (a.kind === "match-case" || a.kind === "next-letter" ? 2 : 1)) return null;
      return { ...a, letters, rounds: Math.min(a.rounds, easy ? 1 : 2) };
    }
    default:
      return null;
  }
}

/**
 * 미션 하나 10칸 — 표에 적은 놀이 뒤에 채움 칸, 영어 놀이 한 판, 맨 끝은 따라 쓰기.
 * 채움 칸은 그날 없는 놀이 먼저, 모자라면 되풀이한다(업체 원칙: 같은 개념을 여러 놀이로 반복). 바로 앞 칸과 같은 놀이는 피한다.
 */
function fillDay(acts: readonly ActivitySpec[], pool: readonly ActivitySpec[], known: ReadonlySet<string>, easy: boolean, guest: ActivitySpec | null): ActivitySpec[] {
  const last = acts.filter((a) => a.kind === "trace");
  const out: ActivitySpec[] = acts.filter((a) => a.kind !== "trace");
  const room = DAY_MISSIONS - last.length - (guest ? 1 : 0);
  const fits = pool.map((a) => fitToKnown(a, known, easy)).filter((a): a is ActivitySpec => a !== null);
  for (const a of fits) {
    if (out.length >= room) break;
    if (!out.some((x) => x.kind === a.kind)) out.push(a);
  }
  const kinds = new Set(fits.map((a) => a.kind)).size;
  for (let i = 0; out.length < room && fits.length; i++) {
    const a = fits[i % fits.length];
    if (out[out.length - 1].kind !== a.kind || kinds === 1) out.push(a);
  }
  return [...out, ...(guest ? [guest] : []), ...last];
}

/** 표의 한 장 → 미션 13개. before 는 이 장 앞까지 만난 글자 */
function staged(c: { no: number; level: Level; code: string; title: string; goal: string; meets: readonly string[] }, unit: UnitTable, before: readonly string[]): Chapter {
  const easy = c.no <= EASY_CHAPTERS;
  const all = [...before, ...c.meets];
  const cap = (a: ActivitySpec): ActivitySpec => (easy && "rounds" in a ? ({ ...a, rounds: Math.min(a.rounds, 3) } as ActivitySpec) : a);
  const guestOf = (day: number, known: readonly string[]): ActivitySpec => ({ kind: "game", id: GUESTS[(c.no * 3 + day) % GUESTS.length], letters: [...known] });
  const metBy = (i: number) => [...before, ...unit.written.slice(0, i + 1).flatMap((acts) => acts.flatMap((a) => (a.kind === "meet" ? [a.letter] : [])))];
  const pool = [...unit.pool, ...unit.written.flat()];

  // ★ — 글자를 처음 만나는 날. 첫날은 글자가 하나뿐이라 영어 놀이를 끼우지 않는다
  const star = unit.written.map((acts, i) => {
    const known = metBy(i);
    return fillDay(acts.map(cap), pool, new Set(known), easy, known.length >= 2 ? guestOf(i + 1, known) : null);
  });
  // ★★·★★★ — 만나기를 빼고 어렵게. 그림책과 노래는 번갈아 하나씩(업체 하루: 영상 또는 책)
  // 복습 장은 이미 알파벳 전체라 앞 장 글자를 더 섞지 않는다
  const widen = c.meets.length ? before : [];
  // ★★ 부터는 이 장 글자를 다 아니까 장 글자 전체로 논다(그림책은 그날 글자, 다음 글자는 이어진 글자 그대로)
  const whole = (a: ActivitySpec): ActivitySpec => {
    if (!c.meets.length) return a;
    switch (a.kind) {
      case "song":
      case "find-letter":
      case "match-case":
      case "missing-letter":
      case "word-pick":
      case "pop":
      case "say":
        return { ...a, letters: [...c.meets] };
      default:
        return a;
    }
  };
  const up = (step: number) =>
    unit.written.map((acts, i) => {
      const h = (a: ActivitySpec) => cap(hardenSpec(whole(a), step, widen));
      // 그림책이 없는 날(복습 장 넷째 날)은 노래를 남긴다 — 어느 미션이든 노래나 그림책으로 시작
      const drop = step === 2 && acts.some((a) => a.kind === "book") ? "song" : "book";
      const base = acts.filter((a) => a.kind !== "meet" && a.kind !== drop);
      return fillDay(base.map(h), pool.map(h), new Set(all), easy, guestOf(step * DAYS_PER_STAGE + i + 1, all));
    });
  return { ...c, days: [...star, ...up(1), ...up(2), unit.stampDay] };
}

export const CHAPTERS: readonly Chapter[] = [
  // ── 레벨 A — A부터 P까지 알파벳과 대표 단어 ──
  staged({ no: 1, level: "A", code: "A1", title: "A B C D", goal: "A부터 D까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("ABCD") }, unit4("ABCD", ""), []),
  staged({ no: 2, level: "A", code: "A2", title: "E F G H", goal: "E부터 H까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("EFGH") }, unit4("EFGH", upTo("D")), L(upTo("D"))),
  staged({ no: 3, level: "A", code: "A3", title: "I J K L", goal: "I부터 L까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("IJKL") }, unit4("IJKL", upTo("H")), L(upTo("H"))),
  staged({ no: 4, level: "A", code: "A4", title: "M N O P", goal: "M부터 P까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("MNOP") }, unit4("MNOP", upTo("L")), L(upTo("L"))),
  // ── 레벨 B — Q부터 Z까지 알파벳과 대표 단어, 마지막 유닛은 복습 ──
  staged({ no: 5, level: "B", code: "B1", title: "Q R S T", goal: "Q부터 T까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("QRST") }, unit4("QRST", upTo("P")), L(upTo("P"))),
  staged({ no: 6, level: "B", code: "B2", title: "U V W", goal: "U부터 W까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("UVW") }, unit3("UVW", upTo("T")), L(upTo("T"))),
  staged({ no: 7, level: "B", code: "B3", title: "X Y Z", goal: "X부터 Z까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("XYZ") }, unit3("XYZ", upTo("W")), L(upTo("W"))),
  staged({ no: 8, level: "B", code: "B4", title: "알파벳 복습", goal: "지금까지 배운 알파벳을 복습하며 구분하고 쓰는 연습을 해요", meets: [] }, REVIEW_UNIT, [...ALPHABET]),
];

export const TOTAL_DAYS = CHAPTERS.length * DAYS_PER_CHAPTER;

export function chapterOf(no: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.no === no);
}

export function isStampDay(day: number): boolean {
  return day === DAYS_PER_CHAPTER;
}

/** 그 미션의 단계(1~3) — 도장 퀴즈는 1 */
export function stageOf(day: number): number {
  return isStampDay(day) ? 1 : Math.min(STAGES, Math.ceil(day / DAYS_PER_STAGE));
}

/** 그날 만나는 글자 */
export function meetsOn(acts: readonly ActivitySpec[]): string[] {
  return acts.flatMap((a) => (a.kind === "meet" ? [a.letter] : []));
}

function dayTitle(c: Chapter, day: number): string {
  if (isStampDay(day)) return "도장 퀴즈";
  const stage = stageOf(day);
  if (stage > 1) return `${c.title} ${"★".repeat(stage)}`;
  const meets = meetsOn(c.days[day - 1] ?? []);
  if (meets.length) return `오늘의 글자 ${meets.join(" ")}`;
  return c.meets.length ? `${c.title} 모아 보기` : `${c.title} ${day}일째`;
}

/** 그날 하루치 — 없는 장·날이면 null */
export function dayPlan(chapter: number, day: number): DayPlan | null {
  const c = chapterOf(chapter);
  const acts = c?.days[day - 1];
  if (!c || !acts) return null;
  return { chapter, day, stage: stageOf(day), title: dayTitle(c, day), stamp: isStampDay(day), activities: [...acts] };
}

/** 추가 학습 — 도장을 못 받았을 때 그 장 ★ 네 미션을 한 번 더(day 1~4). 그다음 도장 퀴즈 한 번 더 */
export function practicePlan(chapter: number, day = 1): DayPlan | null {
  if (day > PRACTICE_DAYS) return null;
  const plan = dayPlan(chapter, day);
  if (!plan) return null;
  return { ...plan, title: `추가 학습 ${day}일째`, stamp: false };
}

/** 이 장 앞까지 만난 글자 */
export function lettersBefore(chapter: number): string[] {
  return CHAPTERS.filter((c) => c.no < chapter).flatMap((c) => [...c.meets]);
}

/** 놀이 종류가 처음 나오는 날 — 놀이터가 이 날부터 열린다 */
export function firstSeen(kind: ActivitySpec["kind"]): { chapter: number; day: number } | null {
  for (const c of CHAPTERS) {
    for (let i = 0; i < c.days.length; i++) if (c.days[i].some((a) => a.kind === kind)) return { chapter: c.no, day: i + 1 };
  }
  return null;
}
