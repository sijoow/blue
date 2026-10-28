/**
 * 성우 — Typecast 목소리. 소리 파일은 목소리마다 따로 구워 둔다(scripts/typecast.mts).
 * 한국어 안내는 한글나라 설정(settings.voice)을 따른다(lib/hangul) — 세 앱이 같은 목소리로 들린다.
 * 영어(글자 이름·단어)는 "en" 묶음 — 같은 수아 목소리를 영어 모드로 구웠다(2026-10-28 사용자: "성우 그대로 수아로"). 파일이 없는 말은 기기 영어 음성(미국식).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

export const VOICES = [
  { id: "minjeong", name: "민정" },
  { id: "sua", name: "수아" },
] as const;

export type VoiceId = (typeof VOICES)[number]["id"];

// 한글나라와 같이 수아 한 목소리로 굽는다(2026-10-26 사용자 선택)
export const DEFAULT_VOICE: VoiceId = "sua";

/** 영어 원어민 목소리 파일 묶음 이름(content/voice-manifest.json 의 "en") */
export const EN_VOICE = "en";

/** 기기 음성으로 읽을 때 영어 억양 — 미국식(2026-10-27 사용자) */
export const EN_LANG = "en-US";

export function isVoiceId(v: unknown): v is VoiceId {
  return VOICES.some((x) => x.id === v);
}

/** 영어로 읽을 말인지 — 한글이 하나도 없고 로마자가 있으면 영어(글자 이름 "A", 단어 "apple") */
export function isEnglish(text: string): boolean {
  return !/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text) && /[A-Za-z]/.test(text);
}
