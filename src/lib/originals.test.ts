import assert from "node:assert/strict";
import { test } from "node:test";
import { ALPHABET, wordOf } from "../curriculum/alphabet.ts";
import { NAMES, ORIGINALS } from "../curriculum/originals.ts";
import { BINGO_SIZE, bingoLine, BOARD_CELLS, buildOriginal, fishRounds, hideGame, mailRounds, nameRounds, wordPool } from "./originals.ts";
import { seededRng } from "./rounds.ts";

test("단어 고르기 — 겹치지 않고, 아는 글자가 모자라면 다음 글자 단어로 채운다", () => {
  const rng = seededRng(5);
  const few = wordPool(["A"], 9, rng);
  assert.equal(few.length, 9);
  assert.equal(new Set(few).size, 9);
  // A·B·C(놀이터 최소) 다음은 D·E — 알파벳 차례로
  for (const id of few) assert.ok("ABCDE".includes(wordOf(id).letter), id);
  // 아는 글자만으로 넉넉하면 그 안에서만
  for (const id of wordPool(["A", "B", "C", "D", "E", "F"], 9, rng)) assert.ok("ABCDEF".includes(wordOf(id).letter));
  assert.equal(wordPool(ALPHABET, 99, rng).length, 52);
});

test("빙고 — 칸 9개를 모두 한 번씩 부르고, 줄이 다 차면 빙고", () => {
  for (let s = 0; s < 30; s++) {
    const b = buildOriginal("bingo", ["A", "B"], seededRng(s));
    assert.equal(b.id, "bingo");
    if (b.id !== "bingo") continue;
    assert.equal(b.board.cells.length, BINGO_SIZE * BINGO_SIZE);
    assert.deepEqual([...b.board.calls].sort(), [...b.board.cells].sort());
  }
  assert.equal(bingoLine(new Set([0, 1])), null);
  assert.deepEqual(bingoLine(new Set([0, 4, 8, 3])), [0, 4, 8]);
  assert.deepEqual(bingoLine(new Set([2, 5, 8])), [2, 5, 8]);
});

test("우편 배달 — 우편함마다 하나씩, 소포 그림은 그 우편함 글자의 단어", () => {
  for (let s = 0; s < 30; s++) {
    for (const r of mailRounds(["A", "B", "C", "D", "E", "F"], 2, seededRng(s))) {
      assert.equal(new Set(r.boxes).size, 3);
      assert.deepEqual(r.items.map((i) => i.letter).sort(), [...r.boxes].sort());
      for (const it of r.items) if (it.kind === "parcel") assert.equal(wordOf(it.word).letter, it.letter);
    }
  }
});

test("이름 — 하온이 이름이 먼저, 조각은 이름 글자 그대로(같은 글자 둘도), 원래 차례 그대로는 아니다", () => {
  for (let s = 0; s < 30; s++) {
    const rounds = nameRounds(3, seededRng(s));
    assert.equal(rounds.length, 3);
    assert.equal(rounds[0].name.id, "haon");
    assert.equal(new Set(rounds.map((r) => r.name.id)).size, 3);
    for (const r of rounds) {
      assert.deepEqual([...r.tiles].sort(), [...r.name.spell].sort());
      assert.notEqual(r.tiles.join(""), r.name.spell);
    }
  }
  assert.ok(NAMES.every((n) => [...n.spell].every((c) => ALPHABET.includes(c))));
});

test("숨바꼭질 — 찾을 것은 숨은 것 중에서, 겹치지 않게", () => {
  const g = hideGame(["A", "B", "C"], seededRng(2));
  assert.equal(new Set(g.spots).size, g.spots.length);
  assert.equal(new Set(g.targets).size, g.targets.length);
  for (const t of g.targets) assert.ok(g.spots.includes(t));
});

test("낚시 — 물고기에 답이 꼭 하나, 글자는 겹치지 않는다", () => {
  for (let s = 0; s < 30; s++) {
    for (const r of fishRounds(["A", "B", "C", "D"], 5, seededRng(s))) {
      assert.equal(r.fish.filter((f) => f === r.target).length, 1);
      assert.equal(new Set(r.fish).size, r.fish.length);
    }
  }
});

test("놀이마다 판이 만들어진다", () => {
  for (const o of ORIGINALS) assert.equal(buildOriginal(o.id, ["A", "B", "C"], seededRng(1)).id, o.id);
  const b = buildOriginal("board", ["A"], seededRng(1));
  if (b.id === "board") assert.equal(new Set(b.game.cells).size, BOARD_CELLS);
});
