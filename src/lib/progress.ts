/**
 * 진도 — 「오늘의 영어」(장·날·도장) + 놀이터·만난 글자·하루 기록. 규칙은 우리가 정했다(course.ts 머리말):
 *   · 하루에 한 번(부모가 '하나 더 열기'로 더 열 수 있다, 설정에서 끌 수도 있다)
 *   · 6일째 도장 퀴즈 — 첫 시도 정답 80% 이상이면 도장. 결과는 동(80 미만)·은(80 이상)·금(100), 장마다 가장 좋은 결과(best)가 남는다
 *   · 못 받으면 업체처럼 추가 학습 — 그 장 1~5일을 한 번 더(practice, day 1~5) → 도장 퀴즈 한 번 더 → 그래도 못 받으면 다음 장
 *   · 지난 날은 언제든 다시 할 수 있다(review — 진도는 그대로, 지난 도장 퀴즈면 best 만 바뀐다)
 *   · 스티커(보상) — 놀이 하나 1장 + 하루 끝 3장 + 도장 5장, 놀이터는 놀이마다 하루 첫 판만 1장. 쓰지 않고 쌓인다
 *   · 글자는 그 글자를 만나는 날(meet 놀이)을 끝내면 단어장에 들어온다
 * 저장·불러오기는 lib/store.ts(기기) · lib/sync.ts(MongoDB), 여기는 계산만.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHAPTERS, chapterOf, DAYS_PER_CHAPTER, dayPlan, lettersBefore, meetsOn, PASS_RATE, practicePlan, STAMP_TRIES, TOTAL_DAYS } from "../curriculum/course.ts";
import { inOrder } from "../curriculum/alphabet.ts";
import type { DayPlan } from "../curriculum/types.ts";

export const STICKER_PER_ACTIVITY = 1;
export const STICKER_PER_DAY = 3;
export const STICKER_STAMP = 5;
export const STICKER_FREE = 1;
const HISTORY_MAX = 400;
const DAILY_KEEP = 120;

export interface DoneRecord {
  key: string;
  chapter: number;
  day: number;
  practice: boolean;
  stamp: boolean;
  /** 끝낸 날 (기기 시간 YYYY-MM-DD) */
  on: string;
  correct: number;
  total: number;
  /** 도장 놀이 날만 true/false */
  passed: boolean | null;
  stickers: number;
  /** 걸린 시간(ms) */
  ms?: number;
}

/** 하루 리포트 한 칸 — 학습 시간·활동 수·모은 스티커 (모든 메뉴 합) */
export interface DayStat {
  ms: number;
  acts: number;
  earned: number;
}

/** 놀이터 놀이 하나의 기록 */
export interface GameStat {
  plays: number;
  /** 스티커를 준 마지막 날 — 하루 첫 판만 준다 */
  paidOn: string | null;
}

export interface Progress {
  v: 1;
  chapter: number;
  /** 그 장에서 다음에 할 날 (1부터) */
  day: number;
  /** 도장을 못 받아서 다음 판이 연습 놀이다 */
  practice: boolean;
  /** 이 장 도장 놀이를 못 받은 횟수 */
  tries: number;
  stickers: number;
  history: DoneRecord[];
  /** 마지막으로 오늘의 놀이를 끝낸 날 */
  lastPlayedOn: string | null;
  /** 부모가 '하나 더 열기'를 누른 날 */
  extraOn: string | null;
  daily: Record<string, DayStat>;
  /** 만난 글자(대문자, 알파벳 차례) */
  letters: string[];
  /** 도장 받은 장 */
  stamps: number[];
  /** 장마다 도장 퀴즈 가장 좋은 정답률(0~1) — 메달(동·은·금) */
  best: Record<string, number>;
  games: Record<string, GameStat>;
  /** 처음으로 무엇이든 한 날 — 스케줄의 '온 지 며칠째' */
  firstOn: string | null;
}

/** 영어교실만의 설정 — 공부 요일·성우는 한글나라 설정을 따른다(lib/hangul). 화면 보기는 여기서 고르면 그걸, 아니면 한글나라 것 */
export interface Settings {
  v: 1;
  /** 화면 보기 — 부모 페이지에서 고른 것(2026-10-28 사용자). null 이면 한글나라 설정 그대로(한글나라 DB 에는 쓰지 않는다) */
  orientation: "portrait" | "landscape" | null;
  /** 하루 한 번만 (마스터 아이디는 제한 없음) */
  oneADay: boolean;
  /** 영어교실을 시작한 날을 부모가 고쳤으면 그 날 — null 이면 처음 한 날(progress.firstOn) */
  startOn: string | null;
}

export interface SessionRef {
  key: string;
  practice: boolean;
  plan: DayPlan;
}

export interface SessionResult {
  /** 점수 놀이에서 첫 시도에 맞힌 수 */
  correct: number;
  total: number;
  /** 끝낸 놀이 수 — 스티커 계산용 */
  activities: number;
  ms?: number;
}

export function initialProgress(chapter = 1): Progress {
  return {
    v: 1,
    chapter,
    day: 1,
    practice: false,
    tries: 0,
    stickers: 0,
    history: [],
    lastPlayedOn: null,
    extraOn: null,
    daily: {},
    letters: [],
    stamps: [],
    best: {},
    games: {},
    firstOn: null,
  };
}

export const DEFAULT_SETTINGS: Settings = { v: 1, orientation: null, oneADay: true, startOn: null };

/** 지금 할 하루 — 연습 놀이가 끼어 있으면 그것. 과정을 다 마쳤으면 null */
export function currentSession(p: Progress): SessionRef | null {
  if (p.practice) {
    const plan = practicePlan(p.chapter, p.day);
    return plan ? { key: `c${p.chapter}x${p.tries}d${p.day}`, practice: true, plan } : null;
  }
  const plan = dayPlan(p.chapter, p.day);
  return plan ? { key: `c${p.chapter}d${p.day}`, practice: false, plan } : null;
}

export function canPlayToday(p: Progress, s: Settings, today: string): boolean {
  if (!s.oneADay) return true;
  return p.lastPlayedOn !== today || p.extraOn === today;
}

/** 진도가 (chapter, day) 에 닿았는지 — 놀이터가 열리는 기준 */
export function reached(p: Progress, chapter: number, day = 1): boolean {
  return p.chapter > chapter || (p.chapter === chapter && p.day >= day);
}

export function passedOf(plan: DayPlan, r: SessionResult): boolean | null {
  if (!plan.stamp) return null;
  if (r.total === 0) return true;
  return r.correct / r.total >= PASS_RATE;
}

export function stickersFor(plan: DayPlan, r: SessionResult): number {
  return r.activities * STICKER_PER_ACTIVITY + STICKER_PER_DAY + (passedOf(plan, r) ? STICKER_STAMP : 0);
}

/** 그날 만나는 글자 */
export function meetsOf(plan: DayPlan): string[] {
  return meetsOn(plan.activities);
}

/** 하루 리포트에 더하고 스티커를 쌓는다 — 오래된 날은 DAILY_KEEP 일만 남긴다 */
export function logPlay(p: Progress, today: string, add: Partial<DayStat>): Progress {
  const cur = p.daily[today] ?? { ms: 0, acts: 0, earned: 0 };
  const day: DayStat = { ms: cur.ms + (add.ms ?? 0), acts: cur.acts + (add.acts ?? 0), earned: cur.earned + (add.earned ?? 0) };
  const keys = Object.keys({ ...p.daily, [today]: day }).sort().slice(-DAILY_KEEP);
  const daily: Record<string, DayStat> = {};
  for (const k of keys) daily[k] = k === today ? day : p.daily[k];
  return { ...p, daily, stickers: p.stickers + (add.earned ?? 0), firstOn: p.firstOn ?? today };
}

function nextChapter(p: Progress): Pick<Progress, "chapter" | "day" | "practice" | "tries"> {
  return { chapter: p.chapter + 1, day: 1, practice: false, tries: 0 };
}

/** 하루를 끝냈다 → 다음 진도 + 기록 한 줄 */
export function completeSession(p: Progress, ref: SessionRef, r: SessionResult, today: string): { next: Progress; record: DoneRecord; moved: "day" | "practice" | "stamp" | "chapter" } {
  const passed = passedOf(ref.plan, r);
  const earned = stickersFor(ref.plan, r);
  const record: DoneRecord = {
    key: ref.key,
    chapter: ref.plan.chapter,
    day: ref.plan.day,
    practice: ref.practice,
    stamp: ref.plan.stamp,
    on: today,
    correct: r.correct,
    total: r.total,
    passed,
    stickers: earned,
    ...(r.ms !== undefined ? { ms: r.ms } : {}),
  };

  let place: Pick<Progress, "chapter" | "day" | "practice" | "tries"> = { chapter: p.chapter, day: p.day, practice: p.practice, tries: p.tries };
  let stamps = p.stamps;
  let best = p.best;
  let moved: "day" | "practice" | "stamp" | "chapter";
  if (ref.practice) {
    // 추가 학습 하루를 마쳤다 — 5일째까지 마치면 다음 판은 도장 퀴즈 한 번 더
    const day = Math.min(p.day + 1, DAYS_PER_CHAPTER);
    place = { ...place, day, practice: day < DAYS_PER_CHAPTER };
    moved = "practice";
  } else if (ref.plan.stamp) {
    best = withBest(p.best, p.chapter, r);
    if (passed) {
      stamps = [...new Set([...p.stamps, p.chapter])].sort((a, b) => a - b);
      place = nextChapter(p);
      moved = "stamp";
    } else if (p.tries + 1 >= STAMP_TRIES) {
      place = nextChapter(p);
      moved = "chapter";
    } else {
      // 업체처럼 6일치를 더 — 그 장 1일째부터 추가 학습
      place = { ...place, day: 1, practice: true, tries: p.tries + 1 };
      moved = "practice";
    }
  } else {
    place = { ...place, day: Math.min(p.day + 1, DAYS_PER_CHAPTER) };
    moved = "day";
  }

  const letters = ref.practice ? p.letters : inOrder([...p.letters, ...meetsOf(ref.plan)]);
  const next: Progress = {
    ...p,
    ...place,
    stamps,
    best,
    letters,
    history: [...p.history, record].slice(-HISTORY_MAX),
    // 오늘 이미 한 번 했다면 이번 판은 '하나 더'를 쓴 것 — 다 썼으니 닫는다
    extraOn: p.lastPlayedOn === today ? null : p.extraOn,
    lastPlayedOn: today,
  };
  return { next: logPlay(next, today, { ms: r.ms ?? 0, acts: r.activities, earned }), record, moved };
}

/** 도장 퀴즈 결과를 장마다 가장 좋은 것으로 */
function withBest(best: Record<string, number>, chapter: number, r: SessionResult): Record<string, number> {
  const rate = r.total ? r.correct / r.total : 0;
  const key = String(chapter);
  return rate > (best[key] ?? -1) ? { ...best, [key]: rate } : best;
}

/**
 * 지난 날 다시 하기(업체: 레벨판에서 지난 날 복습, 퀴즈는 여러 번 다시 풀기) — 진도는 그대로.
 * 스티커는 놀이터처럼 하루 첫 판만 1장, 도장 퀴즈였으면 best 를 바꾸고 80% 넘으면 그 장 도장도.
 */
export function finishReview(p: Progress, plan: DayPlan, r: SessionResult, today: string): { next: Progress; earned: number } {
  const played = finishGame(p, "review", r.ms ?? 0, today);
  if (!plan.stamp) return played;
  const best = withBest(played.next.best, plan.chapter, r);
  const stamps = passedOf(plan, r) ? [...new Set([...played.next.stamps, plan.chapter])].sort((a, b) => a - b) : played.next.stamps;
  return { next: { ...played.next, best, stamps }, earned: played.earned };
}

/** 그날을 다시 할 수 있나 — 이미 마친 날만(추가 학습 중이면 그 장 1~5일은 마친 날) */
export function canReview(p: Progress, chapter: number, day: number): boolean {
  if (chapter < p.chapter) return true;
  if (chapter > p.chapter) return false;
  return p.practice ? day < DAYS_PER_CHAPTER : day < p.day;
}

/** 놀이터 한 판을 끝냈다 — 그 놀이의 오늘 첫 판이면 스티커 1장 */
export function finishGame(p: Progress, gameId: string, ms: number, today: string): { next: Progress; earned: number } {
  const cur = p.games[gameId] ?? { plays: 0, paidOn: null };
  const earned = cur.paidOn === today ? 0 : STICKER_FREE;
  const games = { ...p.games, [gameId]: { plays: cur.plays + 1, paidOn: today } };
  return { next: logPlay({ ...p, games }, today, { ms, acts: 1, earned }), earned };
}

/** 지금 아는 글자 — 알파벳 차례 */
export function knownLetters(p: Progress): string[] {
  return inOrder(p.letters);
}

/** 진도율 — 기본 날(장 수 × 6일) 중 마친 날. 연습 놀이는 세지 않는다 */
export function progressRate(p: Progress): { done: number; total: number; rate: number } {
  // 추가 학습 중에는 그 장 1~5일을 이미 마친 것으로 센다
  const inChapter = p.chapter > CHAPTERS.length ? 0 : p.practice ? DAYS_PER_CHAPTER - 1 : p.day - 1;
  const done = Math.min(TOTAL_DAYS, (Math.min(p.chapter, CHAPTERS.length + 1) - 1) * DAYS_PER_CHAPTER + inChapter);
  return { done, total: TOTAL_DAYS, rate: TOTAL_DAYS ? done / TOTAL_DAYS : 0 };
}

/** 부모가 시작 장을 바꾸면 오늘의 영어 진도만 새로 — 스티커·기록·글자·도장은 남긴다. 앞 장 글자는 만난 것으로 */
export function restartAt(p: Progress, chapter: number): Progress {
  return { ...p, chapter, day: 1, practice: false, tries: 0, lastPlayedOn: null, extraOn: null, letters: inOrder([...p.letters, ...lettersBefore(chapter)]) };
}

/** 장이 다 끝났나 */
export function courseDone(p: Progress): boolean {
  return !chapterOf(p.chapter);
}

/** 기기 날짜(YYYY-MM-DD) — 하루 한 번 규칙의 '하루' */
export function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' 의 n일 전 (기기 날짜 기준) */
export function daysBefore(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d - n));
}

const isInt = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const nums = (v: unknown, min: number, max: number): number[] =>
  Array.isArray(v) ? [...new Set(v.filter((n): n is number => isInt(n, min, max)))].sort((a, b) => a - b) : [];

/** 저장소에서 꺼낸 값 검사 — 모양이 틀리면 처음부터 (아이 앱이 깨진 값으로 멈추면 안 된다) */
export function normalizeProgress(raw: unknown): Progress {
  const base = initialProgress();
  const o = obj(raw);
  if (!o) return base;
  // 마지막 장을 다 마치면 chapter 가 장 수 + 1 에 머문다 — 그것도 맞는 값
  const chapter = isInt(o.chapter, 1, CHAPTERS.length + 1) ? o.chapter : base.chapter;
  const day = isInt(o.day, 1, DAYS_PER_CHAPTER) ? o.day : 1;

  const daily: Record<string, DayStat> = {};
  for (const [k, v] of Object.entries(obj(o.daily) ?? {})) {
    const d = obj(v);
    if (!isDay(k) || !d) continue;
    daily[k] = { ms: isInt(d.ms, 0, 86_400_000) ? d.ms : 0, acts: isInt(d.acts, 0, 100_000) ? d.acts : 0, earned: isInt(d.earned, 0, 100_000) ? d.earned : 0 };
  }

  const games: Record<string, GameStat> = {};
  for (const [k, v] of Object.entries(obj(o.games) ?? {})) {
    const g = obj(v);
    if (!g || !/^[a-z-]{2,20}$/.test(k)) continue;
    games[k] = { plays: isInt(g.plays, 0, 1_000_000) ? g.plays : 0, paidOn: isDay(g.paidOn) ? g.paidOn : null };
  }

  const history = Array.isArray(o.history) ? (o.history.filter((h) => h && typeof h === "object") as DoneRecord[]).slice(-HISTORY_MAX) : [];
  const seen = [...history.map((h) => h.on), ...Object.keys(daily)].filter(isDay).sort();

  return {
    v: 1,
    chapter,
    day,
    practice: o.practice === true && chapter <= CHAPTERS.length && day < DAYS_PER_CHAPTER,
    tries: isInt(o.tries, 0, STAMP_TRIES) ? o.tries : 0,
    stickers: isInt(o.stickers, 0, 10_000_000) ? o.stickers : 0,
    history,
    lastPlayedOn: isDay(o.lastPlayedOn) ? o.lastPlayedOn : null,
    extraOn: isDay(o.extraOn) ? o.extraOn : null,
    daily,
    letters: Array.isArray(o.letters) ? inOrder(o.letters.filter((l): l is string => typeof l === "string")) : [],
    stamps: nums(o.stamps, 1, CHAPTERS.length),
    best: Object.fromEntries(
      Object.entries(obj(o.best) ?? {}).filter(([k, v]) => isInt(Number(k), 1, CHAPTERS.length) && typeof v === "number" && v >= 0 && v <= 1),
    ) as Record<string, number>,
    games,
    firstOn: isDay(o.firstOn) ? o.firstOn : (seen[0] ?? null),
  };
}

export function normalizeSettings(raw: unknown): Settings {
  const o = obj(raw);
  if (!o) return DEFAULT_SETTINGS;
  return {
    v: 1,
    orientation: o.orientation === "portrait" || o.orientation === "landscape" ? o.orientation : null,
    oneADay: typeof o.oneADay === "boolean" ? o.oneADay : DEFAULT_SETTINGS.oneADay,
    startOn: isDay(o.startOn) ? o.startOn : null,
  };
}
