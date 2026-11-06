import assert from "node:assert/strict";
import { test } from "node:test";
import { ALPHABET } from "../curriculum/alphabet.ts";
import { BASE, DESC, LETTER_H, LETTER_STROKES, lengthsOf, MID, strokeDone, TOP, traceStep, type Pt } from "./strokes.ts";

const ALL = [...ALPHABET, ...ALPHABET.map((l) => l.toLowerCase())];

/** 획을 따라 촘촘히 — 아이 손끝이 지나가는 자리 */
function walk(stroke: readonly Pt[], step = 2): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i < stroke.length; i++) {
    const [a, b] = [stroke[i - 1], stroke[i]];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

test("알파벳 52자 — 글자마다 획이 있고 칸 안에 있다(대문자 TOP~BASE, 소문자 아래로 DESC 까지)", () => {
  assert.equal(ALL.length, 52);
  for (const ch of ALL) {
    const g = LETTER_STROKES[ch];
    assert.ok(g, `${ch} 획 없음`);
    assert.ok(g.strokes.length >= 1 && g.strokes.length <= 4, `${ch} 획 수 ${g.strokes.length}`);
    const upper = ch === ch.toUpperCase();
    for (const s of g.strokes) {
      assert.ok(lengthsOf(s).at(-1)! >= 6, `${ch} 너무 짧은 획`);
      for (const [x, y] of s) {
        assert.ok(x >= 4 && x <= g.w - 4, `${ch} 가로 밖 ${x}`);
        assert.ok(y >= TOP - 1 && y <= LETTER_H, `${ch} 세로 밖 ${y}`);
        // 대문자는 위 줄 ~ 아래 줄(Q 꼬리만 조금 아래), 소문자는 내림 획 끝까지
        assert.ok(y <= (upper ? (ch === "Q" ? BASE + 8 : BASE + 1) : DESC + 1), `${ch} 아래로 넘침 ${y}`);
      }
    }
    // 소문자의 몸통은 가운데 점선 아래(올림 획·점 말고)
    if (!upper && !"bdfhklt".includes(ch)) assert.ok(g.strokes.flat().filter(([, y]) => y < MID - 2).every(([, y]) => y >= 40 && y <= 56), `${ch} 몸통이 가운데 위로`);
  }
});

test("획을 처음부터 끝까지 따라가면 다 쓴 것이 된다 — 52자 모두(뒤로 돌아가는 B·되짚는 u 도)", () => {
  for (const ch of ALL) {
    for (const [k, stroke] of LETTER_STROKES[ch].strokes.entries()) {
      const lens = lengthsOf(stroke);
      let s = 0;
      for (const p of walk(stroke)) {
        const r = traceStep(stroke, lens, s, p);
        assert.equal(r.off, false, `${ch} ${k + 1}획에서 길을 벗어남 (${p.map((v) => v.toFixed(0))})`);
        s = r.s;
      }
      assert.ok(strokeDone(lens, s), `${ch} ${k + 1}획을 끝까지 못 감 (${s.toFixed(0)}/${lens.at(-1)!.toFixed(0)})`);
    }
  }
});

test("길 밖은 칠해지지 않는다 — 멀리 누르면 그대로, 뒤로는 안 간다", () => {
  const stroke = LETTER_STROKES.l.strokes[0];
  const lens = lengthsOf(stroke);
  assert.deepEqual(traceStep(stroke, lens, 0, [90, 90]), { s: 0, off: true });
  const mid = traceStep(stroke, lens, 0, [50, 30]);
  assert.ok(!mid.off && mid.s > 10);
  assert.equal(traceStep(stroke, lens, mid.s, [50, TOP]).s, mid.s);
});
