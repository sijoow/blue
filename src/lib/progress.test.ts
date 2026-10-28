import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS, dayPlan, medalOf, TOTAL_DAYS } from "../curriculum/course.ts";
import { ALPHABET } from "../curriculum/alphabet.ts";
import { familyFromHangul, normalizeFamily } from "./hangul.ts";
import {
  canPlayToday,
  completeSession,
  currentSession,
  DEFAULT_SETTINGS,
  finishGame,
  finishReview,
  initialProgress,
  knownLetters,
  normalizeProgress,
  normalizeSettings,
  progressRate,
  restartAt,
  STICKER_FREE,
  type Progress,
} from "./progress.ts";
import { planAhead, streakOf } from "./schedule.ts";

const DAY = "2026-10-27";

/** 지금 판을 정답률 rate 로 끝낸다 */
function play(p: Progress, rate = 1, on = DAY) {
  const ref = currentSession(p);
  assert.ok(ref, "할 판이 있어야");
  const total = 10;
  return completeSession(p, ref, { correct: Math.round(total * rate), total, activities: ref.plan.activities.length }, on);
}

test("처음 — 1장 1일, 글자는 그날 끝내면 들어온다", () => {
  const p = initialProgress();
  const ref = currentSession(p);
  assert.equal(ref?.key, "c1d1");
  const { next, moved } = play(p);
  assert.equal(moved, "day");
  assert.equal(next.day, 2);
  assert.deepEqual(next.letters, ["A"]);
  assert.equal(next.lastPlayedOn, DAY);
  assert.ok(next.stickers > 0);
  assert.equal(next.firstOn, DAY);
});

test("도장 놀이 통과 → 도장 + 다음 장", () => {
  let p = initialProgress();
  for (let i = 0; i < 5; i++) p = play(p).next;
  assert.equal(currentSession(p)?.plan.stamp, true);
  const { next, moved, record } = play(p, 0.9);
  assert.equal(moved, "stamp");
  assert.equal(record.passed, true);
  assert.deepEqual(next.stamps, [1]);
  assert.equal(next.chapter, 2);
  assert.equal(next.day, 1);
});

test("도장 퀴즈 실패 → 업체처럼 6일치 더(추가 학습 1~5일 → 도장 퀴즈) → 또 실패면 다음 장(도장 없이)", () => {
  let p = initialProgress();
  for (let i = 0; i < 5; i++) p = play(p).next;
  let r = play(p, 0.5);
  assert.equal(r.moved, "practice");
  assert.equal(r.next.practice, true);
  assert.equal(r.next.day, 1);
  assert.equal(r.next.best["1"], 0.5);
  for (let d = 1; d <= 5; d++) {
    const ref = currentSession(r.next);
    assert.equal(ref?.practice, true, `추가 학습 ${d}일째`);
    assert.equal(ref?.plan.day, d);
    assert.equal(ref?.plan.stamp, false);
    assert.equal(ref?.plan.title, `추가 학습 ${d}일째`);
    r = play(r.next);
  }
  assert.equal(r.next.practice, false);
  assert.equal(currentSession(r.next)?.plan.stamp, true);
  // 추가 학습 중에도 진도율은 그 장 5일을 마친 것으로
  assert.equal(progressRate(r.next).done, 5);
  r = play(r.next, 0.7);
  assert.equal(r.moved, "chapter");
  assert.equal(r.next.chapter, 2);
  assert.deepEqual(r.next.stamps, []);
  assert.equal(r.next.tries, 0);
  assert.equal(r.next.best["1"], 0.7);
});

test("도장 퀴즈 메달 — 80 미만 동 · 80 이상 은 · 100 금", () => {
  assert.equal(medalOf(0.5), "bronze");
  assert.equal(medalOf(0.8), "silver");
  assert.equal(medalOf(0.9), "silver");
  assert.equal(medalOf(1), "gold");
});

test("지난 날 다시 하기 — 진도는 그대로, 지난 도장 퀴즈면 가장 좋은 결과와 도장만 바뀐다", () => {
  let p = initialProgress();
  for (let i = 0; i < 5; i++) p = play(p).next;
  p = play(p, 0.5).next; // 1장 도장 못 받음 → 추가 학습
  const stampPlan = dayPlan(1, 6);
  assert.ok(stampPlan);
  const r = finishReview(p, stampPlan, { correct: 10, total: 10, activities: 1 }, DAY);
  assert.equal(r.next.best["1"], 1);
  assert.deepEqual(r.next.stamps, [1]);
  assert.equal(r.next.chapter, p.chapter);
  assert.equal(r.next.practice, p.practice);
  assert.equal(r.next.day, p.day);
  // 더 낮은 점수로 다시 풀어도 가장 좋은 결과는 그대로
  assert.equal(finishReview(r.next, stampPlan, { correct: 3, total: 10, activities: 1 }, DAY).next.best["1"], 1);
});

test("추가 학습에서는 글자가 다시 들어오지 않는다 · 기록에 추가 학습이라고 남는다", () => {
  let p = initialProgress();
  for (let i = 0; i < 5; i++) p = play(p).next;
  p = play(p, 0).next;
  const r = play(p);
  assert.equal(r.record.practice, true);
  assert.deepEqual(r.next.letters, ["A", "B", "C", "D"]);
});

test("하루 한 번 — 하나 더 열기", () => {
  const p = play(initialProgress()).next;
  assert.equal(canPlayToday(p, DEFAULT_SETTINGS, DAY), false);
  assert.equal(canPlayToday({ ...p, extraOn: DAY }, DEFAULT_SETTINGS, DAY), true);
  assert.equal(canPlayToday(p, { ...DEFAULT_SETTINGS, oneADay: false }, DAY), true);
  assert.equal(canPlayToday(p, DEFAULT_SETTINGS, "2026-10-28"), true);
  // '하나 더'를 쓰고 나면 닫힌다
  const again = play({ ...p, extraOn: DAY }).next;
  assert.equal(again.extraOn, null);
});

test("과정을 끝까지 — 마지막 날 뒤엔 할 판이 없다", () => {
  let p = initialProgress();
  let n = 0;
  while (currentSession(p) && n < 200) {
    p = play(p).next;
    n++;
  }
  assert.equal(n, TOTAL_DAYS);
  assert.equal(p.chapter, CHAPTERS.length + 1);
  assert.equal(progressRate(p).rate, 1);
  assert.deepEqual(p.letters, ALPHABET);
  assert.equal(p.stamps.length, CHAPTERS.length);
  assert.deepEqual(knownLetters(p), ALPHABET);
});

test("놀이터 — 놀이마다 하루 첫 판만 스티커", () => {
  let p = initialProgress();
  let r = finishGame(p, "pop", 60_000, DAY);
  assert.equal(r.earned, STICKER_FREE);
  p = r.next;
  r = finishGame(p, "pop", 60_000, DAY);
  assert.equal(r.earned, 0);
  assert.equal(r.next.games.pop.plays, 2);
  assert.equal(finishGame(r.next, "missing-letter", 1000, DAY).earned, STICKER_FREE);
  assert.equal(finishGame(r.next, "pop", 1000, "2026-10-28").earned, STICKER_FREE);
});

test("시작 장 바꾸기 — 앞 장 글자는 만난 것으로", () => {
  const p = restartAt(initialProgress(), 3);
  assert.equal(p.chapter, 3);
  assert.deepEqual(p.letters, ["A", "B", "C", "D", "E", "F", "G", "H"]);
});

test("깨진 값은 처음부터 — 모양 검사", () => {
  assert.deepEqual(normalizeProgress(null), initialProgress());
  const n = normalizeProgress({ chapter: 99, day: -1, letters: ["C", "C", "zz", "A", 3], stamps: ["x", 2], stickers: 7, games: { pop: { plays: 2, paidOn: DAY }, "BAD KEY": {} } });
  assert.equal(n.chapter, 1);
  assert.equal(n.day, 1);
  assert.deepEqual(n.letters, ["A", "C"]);
  assert.deepEqual(n.stamps, [2]);
  assert.equal(n.stickers, 7);
  assert.deepEqual(Object.keys(n.games), ["pop"]);
});

test("한글나라 설정 받기 — 없는 값은 기본값", () => {
  const f = familyFromHangul({ name: " 하온 " }, { settings: { voice: "sua", orientation: "landscape", studyDays: [5, 1, 1, 9], startOn: "2026-10-20" }, progress: { firstOn: "2026-10-15" } }, 1);
  assert.equal(f.name, "하온");
  assert.equal(f.orientation, "landscape");
  assert.deepEqual(f.studyDays, [1, 5]);
  assert.equal(f.hangulStartOn, "2026-10-20");
  assert.equal(f.found, true);
  const empty = familyFromHangul(null, null, 1);
  assert.equal(empty.found, false);
  assert.equal(empty.orientation, "portrait");
  assert.equal(empty.studyDays.length, 7);
  assert.deepEqual(normalizeFamily(f), f);
});

test("스케줄 — 공부 요일마다 하루씩, 도장 날 표시", () => {
  const p = initialProgress();
  // 2026-10-27 은 화요일 — 월·수·금만 공부하면 수요일부터
  const plan = planAhead(p, [1, 3, 5], DAY, 7);
  assert.deepEqual(
    plan.map((d) => d.on),
    ["2026-10-28", "2026-10-30", "2026-11-02", "2026-11-04", "2026-11-06", "2026-11-09", "2026-11-11"],
  );
  assert.equal(plan[4].stamp, false);
  assert.equal(plan[5].stamp, true);
  assert.equal(plan[6].chapter, 2);
  assert.equal(streakOf(new Set(["2026-10-26", "2026-10-27"]), DAY, [0, 1, 2, 3, 4, 5, 6]), 2);
});

test("화면 보기 — 영어교실에서 고른 것만 남고, 모르는 값·옛 설정은 null(한글나라 설정을 따름)", () => {
  assert.equal(DEFAULT_SETTINGS.orientation, null);
  assert.equal(normalizeSettings({ v: 1, oneADay: true, startOn: null }).orientation, null);
  assert.equal(normalizeSettings({ orientation: "landscape" }).orientation, "landscape");
  assert.equal(normalizeSettings({ orientation: "portrait" }).orientation, "portrait");
  assert.equal(normalizeSettings({ orientation: "sideways" }).orientation, null);
});
