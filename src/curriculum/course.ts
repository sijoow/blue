/**
 * 영어교실 과정표 — 업체(토도영어) 데일리 코스의 레벨·유닛 순서를 따른다(docs/HANDOFF.md 4절, 2026-10-27 사용자 결정).
 *   레벨 A(A~P) 유닛 1~4 → 레벨 B(Q~Z) 유닛 1~3 + 유닛 4 복습. 장 하나 = 유닛 하나 — 8장 × 6일 = 48일.
 *   업체처럼 5일 놀이 + 6일째 「도장 퀴즈」(업체의 유닛 테스트 자리) — 단어 미리 보기 → 10문항, 80% 넘으면 그 장 도장(2026-10-27 사용자: 토도처럼 6일).
 *   결과는 업체처럼 세 단계(80 미만 동 · 80 이상 은 · 100 금)이고 지난 장 퀴즈는 언제든 다시 풀 수 있다(가장 좋은 결과가 남는다).
 *   도장을 못 받으면 업체처럼 6일치를 더 한다(그 장 1~5일 다시 = 추가 학습 → 도장 퀴즈 한 번 더). 두 번째도 못 받으면 다음 장으로(부모 페이지 '다시 볼 장').
 *   유닛 목표·순서는 업체 공개 교사용 페이지(todoclassroom.com/todoenglish/curri) 그대로, 놀이·화면·캐릭터는 우리 것(앱을 옮기지 않는다).
 * 하루치 = 업체 하루처럼 노래(영상 자리) → 그림책 → 활동(2026-10-28 사용자: 토도 구성 따라가기). 활동은 새 글자 만나기 + 그 글자와 앞 글자를 되풀이(나선형), 15분쯤.
 * 글자는 장 안에서 하루에 하나씩 — 4일 동안 새 글자, 5일째 모아서 복습(앞 장 글자까지 '다음 글자'로), 6일째 도장 퀴즈.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { ALPHABET, letterOf } from "./alphabet.ts";
import type { ActivitySpec, CaseShow, Chapter, DayPlan } from "./types.ts";

export const DAYS_PER_CHAPTER = 6;
/** 도장 퀴즈 통과 기준 — 업체 트로피 기준(80 이상)과 같다 */
export const PASS_RATE = 0.8;
/** 도장 퀴즈를 몇 번까지 하나 — 추가 학습 뒤 두 번째도 못 받으면 다음 장으로 */
export const STAMP_TRIES = 2;
/** 도장 퀴즈 문항 수 — 업체 유닛 테스트와 같다 */
export const QUIZ_ROUNDS = 10;

/** 퀴즈 결과 세 단계 — 업체 트로피(80 미만 · 80 이상 · 100) */
export type Medal = "bronze" | "silver" | "gold";
export function medalOf(rate: number): Medal {
  return rate >= 1 ? "gold" : rate >= PASS_RATE ? "silver" : "bronze";
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

/** 새 글자 넷(레벨 A 유닛) — 하루 한 글자, 5일째 넷을 모아 복습, 6일째 도장 퀴즈. 날마다 노래(그 장에서 만난 글자) → 그림책(오늘 글자) → 활동 */
function unit4(cur: string, before: string): ActivitySpec[][] {
  const [a, b, c, d] = L(cur);
  return [
    [song(a), book(a), meet(a), find(a, "upper", 3), word(a, 3), trace(a)],
    [song(a + b), book(b), meet(b), find(a + b, "upper"), match(a + b), trace(b)],
    [song(a + b + c), book(c), meet(c), word(a + b + c), sayIt(a + b + c), trace(c)],
    [song(cur), book(d), meet(d), match(cur), missing(cur), trace(d)],
    [song(cur), book(cur), find(cur, "mix"), pop(cur), sayIt(cur), before ? next(recent(before + cur)) : match(cur)],
    stamp(cur, before),
  ];
}

/** 새 글자 셋(레벨 B 유닛 2·3) — 사흘 동안 만나고 4·5일째 복습, 6일째 도장 퀴즈 */
function unit3(cur: string, before: string): ActivitySpec[][] {
  const [a, b, c] = L(cur);
  return [
    [song(a), book(a), meet(a), find(a, "upper", 3), word(a, 3), trace(a)],
    [song(a + b), book(b), meet(b), find(a + b, "upper"), match(a + b), trace(b)],
    [song(cur), book(c), meet(c), word(cur), sayIt(cur), trace(c)],
    [song(cur), book(cur), match(cur), missing(cur), pop(cur), traceOnly(cur.toLowerCase())],
    [song(cur), find(cur, "mix"), word(cur), sayIt(cur), next(recent(before + cur))],
    stamp(cur, before),
  ];
}

const ABC = ALPHABET.join("");
const upTo = (last: string): string => ABC.slice(0, ABC.indexOf(last) + 1);

export const CHAPTERS: readonly Chapter[] = [
  // ── 레벨 A — A부터 P까지 알파벳과 대표 단어 ──
  { no: 1, level: "A", code: "A1", title: "A B C D", goal: "A부터 D까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("ABCD"), days: unit4("ABCD", "") },
  { no: 2, level: "A", code: "A2", title: "E F G H", goal: "E부터 H까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("EFGH"), days: unit4("EFGH", upTo("D")) },
  { no: 3, level: "A", code: "A3", title: "I J K L", goal: "I부터 L까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("IJKL"), days: unit4("IJKL", upTo("H")) },
  { no: 4, level: "A", code: "A4", title: "M N O P", goal: "M부터 P까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("MNOP"), days: unit4("MNOP", upTo("L")) },
  // ── 레벨 B — Q부터 Z까지 알파벳과 대표 단어, 마지막 유닛은 복습 ──
  { no: 5, level: "B", code: "B1", title: "Q R S T", goal: "Q부터 T까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("QRST"), days: unit4("QRST", upTo("P")) },
  { no: 6, level: "B", code: "B2", title: "U V W", goal: "U부터 W까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("UVW"), days: unit3("UVW", upTo("T")) },
  { no: 7, level: "B", code: "B3", title: "X Y Z", goal: "X부터 Z까지의 대/소문자를 구분하고 쓸 수 있어요", meets: L("XYZ"), days: unit3("XYZ", upTo("W")) },
  {
    no: 8,
    level: "B",
    code: "B4",
    title: "알파벳 복습",
    goal: "지금까지 배운 알파벳을 복습하며 구분하고 쓰는 연습을 해요",
    meets: [],
    days: [
      [song("ABCDEFGHI"), book("ABCDEFGHI"), next("ABCDEFGHI"), find("ABCDEFGHI", "mix"), match("ABCDEFGHI"), traceOnly("bd")],
      [song("JKLMNOPQR"), book("JKLMNOPQR"), next("JKLMNOPQR"), find("JKLMNOPQR", "mix"), pop("JKLMNOPQR"), missing("JKLMNOPQR")],
      [song("STUVWXYZ"), book("STUVWXYZ"), next("STUVWXYZ"), find("STUVWXYZ", "mix"), match("STUVWXYZ"), word("STUVWXYZ")],
      // 모양이 헷갈리는 소문자 — b·d·p·q, m·n·u·w
      [song("BDPQ"), find("BDPQ", "lower"), match("BDPQ"), pop("MNUW"), sayIt("BDPQ"), traceOnly("pq")],
      [song(ABC), next(ABC), pop(ABC), missing(ABC), word(ABC)],
      [{ kind: "quiz", letters: L(ABC), review: [], rounds: QUIZ_ROUNDS }],
    ],
  },
];

export const TOTAL_DAYS = CHAPTERS.length * DAYS_PER_CHAPTER;

export function chapterOf(no: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.no === no);
}

export function isStampDay(day: number): boolean {
  return day === DAYS_PER_CHAPTER;
}

/** 그날 만나는 글자 */
export function meetsOn(acts: readonly ActivitySpec[]): string[] {
  return acts.flatMap((a) => (a.kind === "meet" ? [a.letter] : []));
}

function dayTitle(c: Chapter, day: number): string {
  if (isStampDay(day)) return "도장 퀴즈";
  const meets = meetsOn(c.days[day - 1] ?? []);
  if (meets.length) return `오늘의 글자 ${meets.join(" ")}`;
  return c.meets.length ? `${c.title} 모아서 복습` : `${c.title} ${day}일째`;
}

/** 그날 하루치 — 없는 장·날이면 null */
export function dayPlan(chapter: number, day: number): DayPlan | null {
  const c = chapterOf(chapter);
  const acts = c?.days[day - 1];
  if (!c || !acts) return null;
  return { chapter, day, title: dayTitle(c, day), stamp: isStampDay(day), activities: [...acts] };
}

/** 추가 학습 — 도장을 못 받았을 때 업체처럼 그 장 1~5일을 한 번 더(day 1~5). 그다음 도장 퀴즈 한 번 더 */
export function practicePlan(chapter: number, day = 1): DayPlan | null {
  if (isStampDay(day)) return null;
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
