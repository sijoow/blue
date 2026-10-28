/**
 * 목소리 — 미리 구운 Typecast 음성 파일이 있으면 그 파일을, 없으면 기기 기본 음성(speechSynthesis)으로 읽는다.
 * 파일 목록은 content/voice-manifest.json: { "sua": { "잘했어!": "voice/sua/3f2a….mp3" }, "en": { "apple": "voice/en/….mp3" } } (scripts/typecast.mts 가 만든다).
 * 말마다 언어를 가른다(lib/voices isEnglish): 한글이 있으면 한국어 — 한글나라 설정의 성우(lib/family, 세 앱이 같은 목소리), 그 성우 파일이 없으면 다른 성우,
 *   영어(글자 이름·단어)면 원어민 묶음 "en". 파일이 없으면 기기 음성 — 한국어는 ko-KR, 영어는 미국식 en-US.
 * say() 를 새로 부르면 앞에 말하던 것은 끊는다 — 아이가 빨리 눌러도 소리가 겹치지 않게.
 */

import manifest from "@/content/voice-manifest.json";
import timing from "@/content/voice-timing.json";
import { readFamily } from "@/lib/family";
import { DEFAULT_VOICE, EN_LANG, EN_VOICE, isEnglish, VOICES, type VoiceId } from "@/lib/voices";

const FILES = manifest as Partial<Record<VoiceId | typeof EN_VOICE, Record<string, string>>>;
/** 파일마다 말소리 구간(초) — scripts/voice-timing.mts */
const TIMING = timing as Record<string, number[][]>;

/** 지금 읽는 말 — 노래방처럼 읽는 곳의 글자 색을 바꾸는 데 쓴다(components/ReadAlong) */
export interface Speaking {
  text: string;
  /** 이 말을 읽기 시작하고 지난 시간(초) */
  elapsed: () => number;
  /** 말소리 구간 — 성우 파일이면 있다 */
  segs: number[][] | null;
  /** 기기 음성일 때 어림한 길이(초) */
  estimate: number;
}

let speaking: Speaking | null = null;
const listeners = new Set<() => void>();

function setSpeaking(s: Speaking | null) {
  if (speaking === s) return;
  speaking = s;
  for (const l of listeners) l();
}

export function currentSpeaking(): Speaking | null {
  return speaking;
}

/** 읽는 말이 바뀔 때(시작·끝) 알려 준다 — 끄는 함수를 돌려준다 */
export function onSpeaking(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function currentVoice(): VoiceId {
  try {
    return readFamily().voice;
  } catch {
    return DEFAULT_VOICE;
  }
}

/** 이 말의 소리 파일 — 영어면 원어민 묶음, 한국어면 고른 성우 먼저·없으면 다른 성우 */
function fileFor(text: string, voice: VoiceId): string | undefined {
  if (isEnglish(text)) return FILES[EN_VOICE]?.[text];
  return FILES[voice]?.[text] ?? VOICES.map((v) => FILES[v.id]?.[text]).find(Boolean);
}

let token = 0;
let audio: HTMLAudioElement | null = null;
const deviceVoices: Partial<Record<"ko" | "en", SpeechSynthesisVoice | null>> = {};

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

/** 기기 음성 고르기 — 한국어(ko) 또는 영어(en, 미국식 en-US 먼저). 자연스러운 것(Google·Natural·Online) 먼저 */
function pickVoice(lang: "ko" | "en"): SpeechSynthesisVoice | null {
  const kept = deviceVoices[lang];
  if (kept) return kept;
  const s = synth();
  if (!s) return null;
  const mine = s.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  if (mine.length === 0) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (lang === "en" && v.lang.replace("_", "-").toLowerCase() === EN_LANG.toLowerCase() ? 4 : 0) + (/natural|online|google|neural/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  const best = [...mine].sort((a, b) => score(b) - score(a))[0] ?? null;
  deviceVoices[lang] = best;
  return best;
}

if (typeof window !== "undefined") {
  synth()?.addEventListener?.("voiceschanged", () => {
    delete deviceVoices.ko;
    delete deviceVoices.en;
  });
}

function playFile(file: string, text: string, alive: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (!alive()) return resolve();
    const a = new Audio(`/${file}`);
    audio = a;
    const now: Speaking = { text, elapsed: () => a.currentTime, segs: TIMING[file] ?? null, estimate: 0 };
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (speaking === now) setSpeaking(null);
      resolve();
    };
    const timer = window.setTimeout(finish, 15_000);
    a.onplaying = () => {
      if (alive()) setSpeaking(now);
    };
    a.onended = finish;
    a.onerror = finish;
    a.onpause = finish;
    a.play().catch(finish);
  });
}

function speakTts(text: string, alive: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const s = synth();
    if (!s || !alive()) return resolve();
    const en = isEnglish(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = en ? EN_LANG : "ko-KR";
    const v = pickVoice(en ? "en" : "ko");
    if (v) u.voice = v;
    // 영어는 4살이 따라 듣게 조금 더 천천히
    u.rate = en ? 0.78 : 0.88;
    u.pitch = en ? 1.05 : 1.12;
    let t0 = 0;
    // 기기 음성은 말소리 구간을 모른다 — 한글 한 글자 0.3초, 로마자 한 글자 0.12초쯤으로 어림(글자 이름 하나는 0.5초)
    const sounds = [...text.replace(/[^가-힣A-Za-z0-9]/g, "")];
    const now: Speaking = { text, elapsed: () => (performance.now() - t0) / 1000, segs: null, estimate: en ? Math.max(0.5, sounds.length * 0.12) : sounds.length * 0.3 };
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (speaking === now) setSpeaking(null);
      resolve();
    };
    // 안드로이드에서 onend 가 안 올 때가 있다 — 글 길이만큼 기다리고 넘어간다
    const timer = window.setTimeout(finish, 1500 + text.length * 380);
    u.onstart = () => {
      t0 = performance.now();
      if (alive()) setSpeaking(now);
    };
    u.onend = finish;
    u.onerror = finish;
    s.speak(u);
  });
}

export function stopVoice(): void {
  token++;
  if (audio) {
    audio.onpause = null;
    audio.pause();
    audio = null;
  }
  synth()?.cancel();
  setSpeaking(null);
}

/** 하나 또는 여러 말을 차례로 — 끝까지 말하면 resolve. voice 를 주면 그 성우로(설정 화면 '들어 보기') */
export async function say(texts: string | readonly string[], voice?: VoiceId): Promise<void> {
  const list = typeof texts === "string" ? [texts] : [...texts];
  const who = voice ?? currentVoice();
  stopVoice();
  const mine = ++token;
  const alive = () => mine === token;
  for (const t of list) {
    if (!alive()) return;
    const file = fileFor(t, who);
    if (file) await playFile(file, t, alive);
    else await speakTts(t, alive);
  }
}

/** 부모 페이지용 — 성우마다 구워 둔 파일 수(영어 원어민 포함)와 기기 한국어·영어 음성 */
export function voiceStatus(): { files: Record<VoiceId, number>; enFiles: number; deviceVoice: string | null; deviceEnVoice: string | null } {
  const files = Object.fromEntries(VOICES.map((v) => [v.id, Object.keys(FILES[v.id] ?? {}).length])) as Record<VoiceId, number>;
  return { files, enFiles: Object.keys(FILES[EN_VOICE] ?? {}).length, deviceVoice: pickVoice("ko")?.name ?? null, deviceEnVoice: pickVoice("en")?.name ?? null };
}

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
