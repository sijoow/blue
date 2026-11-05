/**
 * 난이도 — 장 안 ★ → ★★ → ★★★(2026-11-05 사용자: 숫자놀이·한글나라 구성을 따른다). step 0 은 과정표 그대로, +1·+2 는 한 단계씩 어렵게.
 *   어려워지면 소문자로·섞어서 나오고, 앞 장 글자까지 섞이고, 판이 는다. 글자·단어 목소리는 전부 구워 두었으니 범위 걱정은 없다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { inOrder } from "./alphabet.ts";
import type { ActivitySpec } from "./types.ts";

/** 한 단계마다 앞 장 글자를 몇 개씩 섞나 */
const WIDEN = 2;

/** 놀이 하나를 step 단계 어렵게 — before 는 이 장 앞까지 만난 글자(알파벳 차례). 노래·그림책·만나기·퀴즈는 그대로 */
export function hardenSpec(a: ActivitySpec, step: number, before: readonly string[]): ActivitySpec {
  if (step <= 0) return a;
  const wider = (letters: readonly string[]) => inOrder([...letters, ...before.slice(-WIDEN * step)]);
  switch (a.kind) {
    case "find-letter":
      return { ...a, letters: wider(a.letters), show: step >= 2 ? "mix" : "lower", rounds: a.rounds + step };
    case "match-case":
    case "missing-letter":
    case "word-pick":
    case "pop":
    case "next-letter":
      return { ...a, letters: wider(a.letters), rounds: a.rounds + step };
    case "say":
      return { ...a, letters: wider(a.letters) };
    case "trace": {
      // ★★ 는 헷갈리는 소문자만, ★★★ 는 대·소문자 둘 다 다시
      if (step !== 1) return a;
      const lower = a.chars.filter((ch) => ch !== ch.toUpperCase());
      return lower.length ? { ...a, chars: lower } : a;
    }
    default:
      return a;
  }
}
