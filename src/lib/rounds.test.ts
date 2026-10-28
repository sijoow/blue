import assert from "node:assert/strict";
import { test } from "node:test";
import { ALPHABET, letterOf, wordOf } from "../curriculum/alphabet.ts";
import { CHAPTERS, DAYS_PER_CHAPTER, dayPlan } from "../curriculum/course.ts";
import { GAMES } from "../curriculum/games.ts";
import { buildActivity, buildSession, cycle, letterChoices, otherLetters, seededRng, wordGap } from "./rounds.ts";

test("돌려 쓰기 — 고루 나오고 같은 것이 연달아 나오지 않는다", () => {
  const rng = seededRng(7);
  for (let k = 0; k < 50; k++) {
    const out = cycle(["A", "B", "C"], 9, rng);
    assert.equal(out.length, 9);
    for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1]);
    for (const l of ["A", "B", "C"]) assert.equal(out.filter((x) => x === l).length, 3);
  }
  assert.deepEqual(cycle(["A"], 3, rng), ["A", "A", "A"]);
});

test("글자 보기 — 정답이 꼭 있고 겹치지 않는다. 아는 글자가 모자라면 알파벳에서 가까운 글자로", () => {
  const rng = seededRng(3);
  for (let k = 0; k < 100; k++) {
    const target = ALPHABET[k % 26];
    const c = letterChoices(target, ["A", "B", "C", "D", target], 3, rng);
    assert.equal(c.length, 3);
    assert.ok(c.includes(target));
    assert.equal(new Set(c).size, 3);
  }
  // 아는 글자가 A 하나뿐 — 보기는 A 와 가까운 B·C
  assert.deepEqual(otherLetters("A", ["A"], 2, seededRng(1)).sort(), ["B", "C"]);
  // Z 는 앞쪽에서 채운다
  assert.deepEqual(otherLetters("Z", ["Z"], 2, seededRng(1)).sort(), ["X", "Y"]);
});

test("빈칸 단어 — 배우는 글자 자리를 비운다(X 는 끝)", () => {
  assert.deepEqual(wordGap("apple"), ["", "pple"]);
  assert.deepEqual(wordGap("box"), ["bo", ""]);
  assert.deepEqual(wordGap("yo-yo"), ["", "o-yo"]);
});

test("과정표의 모든 날을 판으로 만들 수 있다 — 정답이 보기 안에", () => {
  for (const c of CHAPTERS) {
    for (let d = 1; d <= DAYS_PER_CHAPTER; d++) {
      const plan = dayPlan(c.no, d);
      assert.ok(plan);
      for (const b of buildSession(plan, seededRng(c.no * 10 + d))) {
        switch (b.kind) {
          case "find-letter":
            for (const r of b.rounds) {
              assert.ok(r.choices.includes(r.target));
              assert.equal(new Set(r.choices).size, 3);
            }
            break;
          case "match-case":
            for (const r of b.rounds) {
              assert.ok(r.top.length >= 2 && r.top.length <= 3);
              assert.deepEqual([...r.top].sort(), [...r.bottom].sort());
              assert.ok(r.top.some((l, k) => r.bottom[k] !== l), "위아래 차례가 같으면 안 된다");
            }
            break;
          case "missing-letter":
            for (const r of b.rounds) {
              assert.equal(wordOf(r.word).letter, r.answer);
              assert.ok(r.choices.includes(r.answer));
            }
            break;
          case "word-pick":
            for (const r of b.rounds) {
              assert.ok(r.choices.includes(r.word));
              assert.equal(new Set(r.choices.map((id) => wordOf(id).letter)).size, 3, "그림 보기는 첫 글자가 서로 달라야");
            }
            break;
          case "pop":
            for (const r of b.rounds) {
              const hits = r.bubbles.filter((x) => x.letter === r.target);
              assert.equal(r.bubbles.length, 8);
              assert.equal(hits.length, 3);
              assert.ok(hits.some((x) => x.show === "upper") && hits.some((x) => x.show === "lower"), "정답 방울은 대·소문자가 섞여야");
              assert.ok(r.bubbles.every((x) => x.x > 0 && x.x < 100 && x.y > 0 && x.y < 100));
            }
            break;
          case "next-letter":
            for (const r of b.rounds) {
              const at = ALPHABET.indexOf(r.seq[r.seq.length - 1]);
              assert.equal(r.answer, ALPHABET[at + 1]);
              r.seq.forEach((l, k) => k > 0 && assert.equal(ALPHABET.indexOf(l), ALPHABET.indexOf(r.seq[k - 1]) + 1));
              assert.ok(r.choices.includes(r.answer));
            }
            break;
          case "trace":
            assert.ok(b.chars.length >= 1 && b.chars.every((ch) => letterOf(ch.toUpperCase())));
            break;
          case "meet":
            assert.ok(letterOf(b.letter));
            break;
          case "song":
          case "book":
            assert.ok(b.letters.length >= 1 && b.letters.every((l) => letterOf(l)));
            break;
          case "say":
            assert.ok(b.rounds.length >= 1 && b.rounds.every((r) => wordOf(r.word)));
            break;
          case "quiz":
            assert.equal(b.rounds.length, 10);
            b.rounds.forEach((r, k) => {
              assert.equal(r.type, k % 2 === 0 ? "letter" : "word");
              if (r.type === "letter") assert.ok(r.choices.includes(r.target) && new Set(r.choices).size === 3);
              else assert.ok(r.choices.includes(r.word) && new Set(r.choices.map((id) => wordOf(id).letter)).size === 3);
            });
            break;
        }
      }
    }
  }
});

test("도장 퀴즈 — 앞 장 글자는 두 문항까지만", () => {
  for (let seed = 1; seed < 30; seed++) {
    const q = buildActivity({ kind: "quiz", letters: ["E", "F", "G", "H"], review: ["A", "B", "C", "D"], rounds: 10 }, seededRng(seed));
    if (q.kind !== "quiz") return assert.fail();
    const target = (r: (typeof q.rounds)[number]) => (r.type === "letter" ? r.target : wordOf(r.word).letter);
    assert.equal(q.rounds.filter((r) => "ABCD".includes(target(r))).length, 2);
  }
});

test("놀이터 놀이 — 아는 글자로 판이 만들어진다", () => {
  for (const g of GAMES) {
    for (const known of [[], ["A"], ["A", "B", "C", "D"], [...ALPHABET]]) {
      const b = buildActivity(g.spec({ known }), seededRng(known.length + 1));
      assert.equal(b.kind, g.id);
    }
  }
});
