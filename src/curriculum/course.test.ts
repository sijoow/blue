import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ALPHABET, inOrder, LETTERS, letterOf, letterSpot, WORDS } from "./alphabet.ts";
import { CHAPTERS, DAY_MISSIONS, DAYS_PER_CHAPTER, dayPlan, firstSeen, lettersBefore, meetsOn, passRateOf, PRACTICE_DAYS, practicePlan, QUIZ_ROUNDS, stageOf, TOTAL_DAYS } from "./course.ts";
import { LANDS, landOf } from "./lands.ts";
import { hardenSpec } from "./level.ts";
import { GAMES, playLetters } from "./games.ts";
import { allLineTexts, englishTexts, LINES } from "./lines.ts";
import type { ActivitySpec } from "./types.ts";
import { isScored } from "../lib/rounds.ts";
import { isEnglish } from "../lib/voices.ts";

test("알파벳 — 26자, 글자마다 대표 단어 둘(배우는 글자가 맨 앞, X 만 맨 끝)", () => {
  assert.equal(LETTERS.length, 26);
  assert.deepEqual(ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  for (const l of LETTERS) {
    assert.equal(l.lower, l.upper.toLowerCase());
    assert.equal(l.words.length, 2);
    for (const w of l.words) {
      assert.equal(w.en[letterSpot(w)].toUpperCase(), l.upper, `${w.en} 의 ${l.upper} 자리`);
      assert.ok(w.ko && w.emoji);
    }
  }
  assert.deepEqual(
    letterOf("X").words.map((w) => w.at),
    ["end", "end"],
  );
  assert.equal(new Set(WORDS.map((w) => w.id)).size, WORDS.length, "단어 id 는 겹치지 않는다");
  assert.deepEqual(inOrder(["C", "A", "C", "zz", "B"]), ["A", "B", "C"]);
});

test("과정표 — 토도영어 레벨 A 유닛 1~4 → 레벨 B 유닛 1~4, 장마다 미션 13개 · 미션마다 10칸", () => {
  assert.equal(CHAPTERS.length, 8);
  assert.equal(DAYS_PER_CHAPTER, 13);
  assert.equal(TOTAL_DAYS, 104);
  assert.deepEqual(
    CHAPTERS.map((c) => c.code),
    ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"],
  );
  CHAPTERS.forEach((c, i) => {
    assert.equal(c.no, i + 1);
    assert.equal(c.level, c.code[0]);
    assert.equal(c.days.length, DAYS_PER_CHAPTER, `${c.no}장 날 수`);
    c.days.forEach((acts, d) => {
      if (d + 1 === DAYS_PER_CHAPTER) return;
      assert.equal(acts.length, DAY_MISSIONS, `${c.no}장 미션 ${d + 1} 칸 수`);
      // 업체 하루처럼 영상 자리(노래)나 책이 맨 앞 — ★★★ 는 그림책으로 시작
      assert.ok(acts[0].kind === "song" || acts[0].kind === "book", `${c.no}장 미션 ${d + 1} 첫 칸 ${acts[0].kind}`);
      // 바로 앞 칸과 같은 놀이가 이어지지 않는다
      acts.forEach((a, i) => assert.ok(i === 0 || a.kind !== acts[i - 1].kind, `${c.no}장 미션 ${d + 1} ${i + 1}칸 ${a.kind} 연달아`));
    });
  });
});

test("글자는 업체 유닛 차례대로, 한 번씩, 하루에 하나씩 만난다", () => {
  const met: string[] = [];
  for (const c of CHAPTERS) {
    const inDays = c.days.flat().flatMap((a) => (a.kind === "meet" ? [a.letter] : []));
    assert.deepEqual(inDays, [...c.meets], `${c.no}장 meets 와 만나기 놀이가 같아야`);
    c.days.forEach((acts, d) => assert.ok(meetsOn(acts).length <= 1, `${c.no}장 ${d + 1}일에 새 글자가 둘 이상`));
    met.push(...inDays);
  }
  assert.deepEqual(met, [...ALPHABET]);
  assert.deepEqual(
    CHAPTERS.map((c) => c.meets.join("")),
    ["ABCD", "EFGH", "IJKL", "MNOP", "QRST", "UVW", "XYZ", ""],
  );
  assert.deepEqual(lettersBefore(3), [..."ABCDEFGH"]);
});

test("놀이마다 아직 안 만난 글자를 묻지 않는다 — 노래·그림책만 그날 만날 글자를 먼저 소개한다(업체 하루: 영상 → 책 → 활동)", () => {
  const known = new Set<string>();
  const asked = (a: ActivitySpec): string[] => {
    if (a.kind === "meet") return [a.letter];
    if (a.kind === "trace") return a.chars.map((ch) => ch.toUpperCase());
    if (a.kind === "quiz") return [...a.letters, ...a.review];
    return [...a.letters];
  };
  for (const c of CHAPTERS) {
    c.days.forEach((acts, d) => {
      const today = meetsOn(acts);
      for (const a of acts) {
        if (a.kind === "meet") known.add(a.letter);
        const intro = a.kind === "song" || a.kind === "book";
        for (const l of asked(a)) assert.ok(known.has(l) || (intro && today.includes(l)), `${c.no}장 ${d + 1}일 ${a.kind}: 아직 안 만난 ${l}`);
      }
    });
  }
});

test("마지막은 10문항 도장 퀴즈 하나 — 추가 학습은 그 장 ★ 네 미션을 다시", () => {
  for (const c of CHAPTERS) {
    const stamp = dayPlan(c.no, DAYS_PER_CHAPTER);
    assert.ok(stamp?.stamp);
    assert.equal(stamp.title, "도장 퀴즈");
    assert.equal(stamp.activities.length, 1);
    const quiz = stamp.activities[0];
    assert.ok(quiz.kind === "quiz" && quiz.rounds === QUIZ_ROUNDS && isScored(quiz.kind));
    for (let d = 1; d <= PRACTICE_DAYS; d++) {
      const practice = practicePlan(c.no, d);
      assert.equal(practice?.stamp, false);
      assert.equal(practice?.title, `추가 학습 ${d}일째`);
      assert.deepEqual(practice?.activities, dayPlan(c.no, d)?.activities);
    }
    assert.equal(practicePlan(c.no, PRACTICE_DAYS + 1), null);
  }
  assert.equal(dayPlan(1, 1)?.title, "오늘의 글자 A");
  assert.equal(dayPlan(1, 5)?.title, "A B C D ★★");
  assert.equal(dayPlan(6, 4)?.title, "U V W 모아 보기");
  assert.equal(dayPlan(1, 13)?.stage, 1);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map(stageOf), [1, 1, 2, 2, 3, 3]);
});

test("★★·★★★ 는 만나기 없이 어렵게 — 소문자·섞기, 앞 장 글자, 판이 는다", () => {
  const find = { kind: "find-letter", letters: ["E", "F"], show: "upper", rounds: 3 } as const;
  const before = ["A", "B", "C", "D"];
  assert.deepEqual(hardenSpec(find, 0, before), find);
  assert.deepEqual(hardenSpec(find, 1, before), { ...find, letters: ["C", "D", "E", "F"], show: "lower", rounds: 4 });
  assert.deepEqual(hardenSpec(find, 2, before), { ...find, letters: ["A", "B", "C", "D", "E", "F"], show: "mix", rounds: 5 });
  assert.deepEqual(hardenSpec({ kind: "trace", chars: ["E", "e"] }, 1, before), { kind: "trace", chars: ["e"] });
  assert.deepEqual(hardenSpec({ kind: "song", letters: ["E"] }, 2, before), { kind: "song", letters: ["E"] });
  for (const c of CHAPTERS) {
    for (let d = 5; d < DAYS_PER_CHAPTER; d++) {
      const plan = dayPlan(c.no, d);
      assert.ok(plan);
      assert.equal(meetsOn(plan.activities).length, 0, `${c.no}장 미션 ${d} 에 만나기`);
    }
  }
});

test("영어 놀이 칸 — 미션마다 하나, 글자가 둘 이상일 때부터, 도장 퀴즈 날엔 없다 · 다음 글자는 이어진 글자로만", () => {
  for (const c of CHAPTERS) {
    c.days.forEach((acts, d) => {
      const games = acts.filter((a) => a.kind === "game");
      if (d + 1 === DAYS_PER_CHAPTER) assert.equal(games.length, 0);
      else if (c.no === 1 && d === 0) assert.equal(games.length, 0, "첫날은 글자가 하나뿐");
      else {
        assert.equal(games.length, 1, `${c.no}장 미션 ${d + 1}`);
        assert.notEqual(games[0].kind === "game" && games[0].id, "board");
      }
      for (const a of acts) {
        if (a.kind !== "next-letter") continue;
        const at = a.letters.map((l) => ALPHABET.indexOf(l));
        at.forEach((n, i) => assert.ok(i === 0 || n === at[i - 1] + 1, `${c.no}장 미션 ${d + 1} 다음 글자가 끊김: ${a.letters.join("")}`));
      }
    });
  }
});

test("나라 — 장마다 다른 나라, 우주나라·그림책나라는 없다, 그림과 인사말이 있다", () => {
  assert.equal(LANDS.length, CHAPTERS.length);
  assert.equal(new Set(CHAPTERS.map((c) => landOf(c.no).id)).size, CHAPTERS.length);
  assert.deepEqual(LANDS.filter((l) => ["space", "picturebook"].includes(l.id)), []);
  const manifest = JSON.parse(readFileSync(new URL("../content/image-manifest.json", import.meta.url), "utf8")) as Record<string, string>;
  const lines = allLineTexts();
  for (const l of LANDS) {
    assert.ok(manifest[`land:${l.id}`], `${l.name} 바탕`);
    assert.ok(manifest[`friend:${l.id}`], `${l.name} 친구`);
    assert.ok(l.hello.includes(l.friend) && lines.includes(l.hello), `${l.name} 인사말`);
  }
  // 장이 나라보다 많아지면 처음부터 다시 돈다
  assert.equal(landOf(LANDS.length + 1).id, LANDS[0].id);
});

test("통과 기준 — 첫 두 장 50%, 그 뒤 70%", () => {
  assert.deepEqual([1, 2, 3, 8].map(passRateOf), [0.5, 0.5, 0.7, 0.7]);
});

test("놀이터 놀이는 모두 과정 안에서 처음 나온 날이 있다 · 아는 글자가 적으면 A·B·C 로 채운다", () => {
  for (const g of GAMES) assert.ok(firstSeen(g.id), `${g.id} 는 과정에 없다`);
  assert.deepEqual(playLetters([]), ["A", "B", "C"]);
  assert.deepEqual(playLetters(["A"]), ["A", "B", "C"]);
  assert.deepEqual(playLetters(["D", "A", "B", "C"]), ["A", "B", "C", "D"]);
});

test("들려주는 말 — 한국어 안내에 글자 이름을 넣지 않고(영어 목소리로 따로), 영어는 영어로 갈린다", () => {
  for (const v of Object.values(LINES).flatMap((x) => (typeof x === "string" ? [x] : [...x]))) {
    assert.ok(!isEnglish(v), `한국어 안내가 영어로 갈림: ${v}`);
    assert.ok(!/[A-Za-z]/.test(v), `한국어 안내 안에 로마자: ${v}`);
  }
  for (const t of englishTexts()) assert.ok(isEnglish(t), `영어가 아님: ${t}`);
  const all = allLineTexts();
  assert.ok(all.every((t) => t.trim().length > 0));
  assert.ok(all.includes("A") && all.includes("apple") && all.includes("사과"));
});

test("그림 목록 — 아이 얼굴은 한글나라 그림 주소를 빌려 쓴다", () => {
  const manifest = JSON.parse(readFileSync(new URL("../content/image-manifest.json", import.meta.url), "utf8")) as Record<string, string>;
  assert.match(manifest["child:face"] ?? "", /^https:\/\//);
});
