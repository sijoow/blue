import assert from "node:assert/strict";
import { test } from "node:test";
import { letterOf, wordOf } from "./alphabet.ts";
import { CHAPTERS, dayPlan } from "./course.ts";
import { STORIES, storyOf, storyOfChapter, storyTexts, storyWords, wordsIn } from "./stories.ts";

test("장마다 이야기가 하나씩 — id 는 겹치지 않는다", () => {
  for (const c of CHAPTERS) assert.ok(storyOfChapter(c.no), `${c.no}장 이야기 없음`);
  assert.equal(new Set(STORIES.map((s) => s.id)).size, STORIES.length);
  assert.equal(STORIES.length, CHAPTERS.length);
});

test("그림은 있는 것만 — 단어 그림 id 와 사람", () => {
  for (const s of STORIES) {
    for (const id of [...s.cover.things, ...s.pages.flatMap((p) => p.things ?? [])]) assert.doesNotThrow(() => wordOf(id), `${s.id}: 모르는 그림 ${id}`);
    for (const p of s.pages) assert.ok(p.who || p.things?.length, `${s.id} "${p.text}" 그림 없음`);
    // 블루이 기분은 블루이만
    for (const p of s.pages) if (p.mood) assert.equal(p.who, "bluey", `${s.id} "${p.text}" 기분은 블루이만`);
  }
});

test("이야기는 짧게 — 6~8쪽, 문장은 5낱말까지, 영어만", () => {
  for (const s of STORIES) {
    assert.ok(s.pages.length >= 6 && s.pages.length <= 8, `${s.id} ${s.pages.length}쪽`);
    for (const p of s.pages) {
      assert.ok(p.text.split(/\s+/).length <= 5, `${s.id} "${p.text}" 너무 길다`);
      assert.doesNotMatch(p.text, /[가-힣]/, `${s.id} "${p.text}" 한글`);
    }
  }
});

test("장 이야기는 그 장 글자를 다 쓴다(복습 장 빼고)", () => {
  for (const c of CHAPTERS) {
    if (!c.meets.length) continue;
    const s = storyOfChapter(c.no)!;
    const used = new Set(storyWords(s).map((id) => wordOf(id).letter));
    for (const l of c.meets) assert.ok(used.has(l), `${c.no}장 「${s.title}」 에 ${l} 단어가 없다`);
    // 앞 장 글자 단어는 써도 되지만 뒤 장 글자 단어는 안 된다(아직 안 배움)
    const known = new Set(CHAPTERS.filter((x) => x.no <= c.no).flatMap((x) => [...x.meets]));
    for (const id of storyWords(s)) assert.ok(known.has(wordOf(id).letter), `${c.no}장 「${s.title}」 의 ${id} 는 아직 안 배운 글자`);
  }
});

test("빨간 글씨 — 단어 그림에 있는 낱말만, 문장 부호는 떼고", () => {
  assert.deepEqual(wordsIn("An apple for Bluey."), [{ part: "An" }, { part: " " }, { part: "apple", word: "apple" }, { part: " " }, { part: "for" }, { part: " " }, { part: "Bluey." }]);
  assert.deepEqual(wordsIn("Yogurt!"), [{ part: "Yogurt", word: "yogurt" }, { part: "!" }]);
  assert.deepEqual(wordsIn("A yo-yo!").filter((p) => p.word), [{ part: "yo-yo", word: "yo-yo" }]);
  assert.deepEqual(wordsIn("Who is it?").filter((p) => p.word), []);
  // 조각을 이으면 원래 문장
  for (const s of STORIES) for (const p of s.pages) assert.equal(wordsIn(p.text).map((x) => x.part).join(""), p.text);
});

test("쪽 그림의 단어는 문장에도 나온다(아이가 그림과 글자를 맞춰 본다) — 말장난 쪽 빼고", () => {
  for (const s of STORIES) {
    for (const p of s.pages) {
      const said = new Set(wordsIn(p.text).flatMap((x) => (x.word ? [x.word] : [])));
      const shown = p.things ?? [];
      // 장소 그림(the van·the box)·숨은 그림(hat 에서 frog)처럼 문장에 없는 그림은 하나까지
      assert.ok(shown.filter((id) => !said.has(id)).length <= 1, `${s.id} "${p.text}" 그림 ${shown.join(",")}`);
    }
  }
});

test("길: ★★★ 둘째·넷째 미션 첫 칸이 그 장 이야기", () => {
  for (const c of CHAPTERS) {
    const s = storyOfChapter(c.no)!;
    for (const day of [10, 12]) {
      const first = dayPlan(c.no, day)!.activities[0];
      assert.equal(first.kind, "book", `${c.no}장 ${day}`);
      assert.equal(first.kind === "book" ? first.story : undefined, s.id, `${c.no}장 ${day}`);
    }
    for (const day of [1, 5, 9, 11]) {
      const first = dayPlan(c.no, day)!.activities[0];
      assert.ok(!(first.kind === "book" && first.story), `${c.no}장 ${day} 에 이야기`);
    }
  }
});

test("음성 굽기 목록 — 제목과 문장", () => {
  const t = storyTexts();
  assert.ok(t.includes("Snack Time") && t.includes("An apple for Bluey."));
  assert.equal(storyOf("snack")?.chapter, 1);
  assert.equal(letterOf("A").words[0].id, "apple");
});
