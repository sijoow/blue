/**
 * 과정표 모양 — 장(章)마다 하루치 놀이(DayPlan)가 있고, 하루치는 놀이 설계도(ActivitySpec) 몇 개.
 * 설계도는 "어떤 글자로 몇 판" 까지만 — 실제 문제(어떤 글자·어떤 단어·보기 순서)는 lib/rounds 가 시작할 때 섞어서 만든다.
 * 글자는 늘 대문자("A")로 적는다 — 소문자로 보여 줄지는 놀이가 정한다.
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

/** 보기 글자를 대문자로·소문자로·섞어서 */
export type CaseShow = "upper" | "lower" | "mix";

export type ActivitySpec =
  /** 노래 — 글자 챈트("A, A, apple") 영상 자리(토도 하루 = 영상 → 책 → 활동). 점수 없음 */
  | { kind: "song"; letters: readonly string[] }
  /** 그림책 — 표지 → 글자마다 단어 그림 쪽 → 끝. 쪽마다 글자 이름 → 단어를 읽어 준다. 점수 없음 */
  | { kind: "book"; letters: readonly string[] }
  /** 알파벳 만나기 — 큰 글자·작은 글자 + 대표 단어 둘(누르면 영어 → 뜻) */
  | { kind: "meet"; letter: string }
  /** 따라 말하기 — 단어를 듣고 녹음, 내 목소리를 다시 듣고 한 번 더 들려준다(토도 마이크 활동 자리). 점수 없음 */
  | { kind: "say"; letters: readonly string[]; rounds: number }
  /** 도장 퀴즈(6일째, 토도 유닛 테스트 자리) — 단어 미리 보기 → 10문항(듣고 글자 찾기·그림 고르기, 앞 장 글자도 조금) */
  | { kind: "quiz"; letters: readonly string[]; review: readonly string[]; rounds: number }
  /** 듣고 글자 찾기 — "B! 어디 있을까?" 듣고 글자 카드 고르기 */
  | { kind: "find-letter"; letters: readonly string[]; show: CaseShow; rounds: number }
  /** 대·소문자 짝꿍 — 대문자를 끌어서 짝꿍 소문자 위에 놓기(판마다 둘~셋 쌍) */
  | { kind: "match-case"; letters: readonly string[]; rounds: number }
  /** 빈칸 글자 — 단어 그림 + 글자 하나가 빈 단어(_pple), 맞는 글자를 끌어다 빈칸에 */
  | { kind: "missing-letter"; letters: readonly string[]; rounds: number }
  /** 단어 듣고 그림 고르기 — "apple" 듣고 그림 셋 중에 */
  | { kind: "word-pick"; letters: readonly string[]; rounds: number }
  /** 글자 방울 — 대·소문자가 섞인 방울 중에 그 글자를 모두 톡톡 */
  | { kind: "pop"; letters: readonly string[]; rounds: number }
  /** 다음 글자 — A B C ? (letters 는 알파벳 차례로 이어진 글자들) */
  | { kind: "next-letter"; letters: readonly string[]; rounds: number }
  /** 따라 쓰기 — 쓸 글자 차례("A", "a") */
  | { kind: "trace"; chars: readonly string[] };

export type ActivityKind = ActivitySpec["kind"];

export interface DayPlan {
  chapter: number;
  /** 장 안에서 몇째 날 (1부터) */
  day: number;
  title: string;
  /** 장 끝 도장 놀이 날 — 점수 놀이만, 첫 시도만 채점 */
  stamp: boolean;
  activities: ActivitySpec[];
}

/** 업체(토도영어) 레벨 — A: A~P, B: Q~Z + 복습 */
export type Level = "A" | "B";

export interface Chapter {
  no: number;
  /** 업체 레벨과 유닛 — 장 하나 = 유닛 하나(예: "A1" = 레벨 A 유닛 1) */
  level: Level;
  code: string;
  title: string;
  /** 부모 페이지·스케줄에 보이는 이 장의 목표(업체 유닛 목표 그대로) */
  goal: string;
  /** 이 장에서 처음 만나는 글자 — 만나기 놀이 차례와 같다 */
  meets: readonly string[];
  days: readonly (readonly ActivitySpec[])[];
}
