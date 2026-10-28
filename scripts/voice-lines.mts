/**
 * 음성으로 만들 말 목록 — 앱이 소리 내 읽는 모든 말(curriculum/lines 의 allLineTexts).
 *   한국어   안내 말(수아) · 단어 뜻(사과·공…)
 *   영어     글자 이름(A~Z) · 대표 단어(apple…) — 원어민 묶음 "en"(성우를 고르기 전엔 기기 영어 음성)
 * 같은 말은 한 번만. 글자 수 합계는 크레딧 견적용(1글자 = 1크레딧).
 *   npm run voice:lines   → scripts/voice-lines.json
 * 그다음 npm run voice:reuse 로 한글나라·숫자놀이에 이미 구운 같은 말을 빌려 오고, 남은 것만 npm run voice:make 로 견적·굽기.
 */

import { writeFileSync } from "node:fs";
import { ALPHABET, WORDS } from "../src/curriculum/alphabet.ts";
import { allLineTexts, LINES } from "../src/curriculum/lines.ts";

const fixed = new Set<string>(Object.values(LINES).flatMap((v) => (typeof v === "string" ? [v] : [...v])));
const meanings = new Set(WORDS.map((w) => w.ko));
const letters = new Set(ALPHABET);

const groups: Record<string, string[]> = { "안내 말": [], "단어 뜻": [], "영어 — 글자 이름": [], "영어 — 단어": [] };
const seen = new Set<string>();
for (const t of allLineTexts()) {
  if (!t || seen.has(t)) continue;
  seen.add(t);
  const g = fixed.has(t) ? "안내 말" : meanings.has(t) ? "단어 뜻" : letters.has(t) ? "영어 — 글자 이름" : "영어 — 단어";
  groups[g].push(t);
}

const all = [...seen];
const chars = all.reduce((n, t) => n + [...t].length, 0);
writeFileSync(new URL("./voice-lines.json", import.meta.url), JSON.stringify({ total: all.length, chars, groups }, null, 2) + "\n");
for (const [name, list] of Object.entries(groups)) console.log(`${name}: ${list.length}줄, ${list.reduce((n, t) => n + [...t].length, 0)}자`);
console.log(`합계: ${all.length}줄, ${chars}자 → scripts/voice-lines.json`);
