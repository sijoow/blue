/**
 * 힉스필드로 만들 그림 목록 — 지금 임시 그림(ABC 카드·이모지)으로 대신하고 있는 자리들.
 *   npm run image:list   → scripts/image-list.json
 * 그림체는 블루이(refs/ — 사용자가 넣어 준다, docs/HANDOFF.md 5절). 키는 src/content/image-manifest.json 에 그대로 쓰인다(lib/assets):
 *   안내 친구 "guide" · 대표 단어 "word:apple" · 메뉴 "icon:menu:free" · 스티커 "icon:sticker" · 놀이 "icon:play:pop" · 놀이터 카드 "scene:free:pop" · 바탕 "bg:home"
 * 하온이 얼굴(child:face)은 한글나라 그림을 그대로 빌려 써서 여기 없다.
 * 프롬프트(그림체 문구·레퍼런스)는 refs 를 보고 그림체 문서(docs/bluey-style.md)를 쓴 뒤에 붙인다 — 숫자놀이 순서: 문서 → 시험 3장 → 본 생성.
 */

import { writeFileSync } from "node:fs";
import { WORDS } from "../src/curriculum/alphabet.ts";
import { GAMES } from "../src/curriculum/games.ts";
import { MENUS } from "../src/curriculum/menus.ts";
import { ORIGINALS } from "../src/curriculum/originals.ts";
import { KIND_ICON, KIND_LABEL } from "../src/components/play/kindIcon.ts";

export type Kind = "guide" | "family" | "name" | "word" | "icon" | "scene" | "bg" | "app";
type Entry = { key: string; kind: Kind; now: string; what: string };

const guide: Entry[] = [
  { key: "guide", kind: "guide", now: "ABC 카드", what: "안내 친구 — 손 흔들며 인사" },
  { key: "guide:cheer", kind: "guide", now: "ABC 카드", what: "안내 친구 — 두 팔 들고 신난 모습" },
  { key: "guide:wow", kind: "guide", now: "ABC 카드", what: "안내 친구 — 깜짝 놀란 모습" },
];

// 주인공 가족 넷(2026-10-28 사용자) — 첫 화면 인사 · 하루 끝 축하
const family: Entry[] = [
  { key: "family:hello", kind: "family", now: "ABC 카드", what: "블루이 가족 넷 — 나란히 손 흔들며 인사" },
  { key: "family:cheer", kind: "family", now: "ABC 카드", what: "블루이 가족 넷 — 함께 신나게 축하" },
];

// 영어 놀이 「내 이름」 — 빙고·엄마·아빠 한 명씩(하온이 = 아이 얼굴, 블루이 = 안내 친구)
const names: Entry[] = (
  [
    ["bingo", "빙고"],
    ["mum", "엄마"],
    ["dad", "아빠"],
  ] as const
).map(([id, who]) => ({ key: `name:${id}`, kind: "name", now: "가족 그림", what: `이름 만들기 그림 — ${who} 한 명, 손 흔들며 인사` }));

const words: Entry[] = WORDS.map((w) => ({ key: `word:${w.id}`, kind: "word", now: w.emoji, what: `대표 단어 ${w.letter}: ${w.en} (${w.ko})` }));

const icons: Entry[] = [
  ...MENUS.map((m) => ({ key: `icon:menu:${m.id}`, kind: "icon" as const, now: m.icon, what: `메뉴 아이콘: ${m.title}` })),
  { key: "icon:sticker", kind: "icon", now: "별 스티커(SVG)", what: "모으는 스티커 하나 — 보상" },
  ...(
    [
      ["lock", "🔒", "잠금"],
      ["party", "🎉", "축하"],
      ["sparkle", "✨", "반짝"],
      ["star", "⭐", "별(도장)"],
      ["clap", "👏", "손뼉 치는 손"],
      ["home", "🏠", "집(돌아가기)"],
      ["moon", "🌙", "내일 또(달)"],
      ["crown", "👑", "왕관(마스터)"],
    ] as const
  ).map(([id, now, what]) => ({ key: `icon:ui:${id}`, kind: "icon" as const, now, what })),
  // 놀이 아이콘 — 오늘의 영어 순서 표시·놀이터 제목. 만나기(안내 친구)·따라 쓰기(쓰기 메뉴)·그림 고르기(apple)는 같은 뜻 그림을 쓴다(lib/assets UI_ART)
  ...(["find-letter", "match-case", "missing-letter", "pop", "next-letter", "song", "book", "say", "quiz"] as const).map((id) => ({ key: `icon:play:${id}`, kind: "icon" as const, now: KIND_ICON[id], what: `놀이 아이콘: ${KIND_LABEL[id]}` })),
  // 도장 퀴즈 메달 — 업체 트로피 세 단계(80 미만 · 80 이상 · 100)
  ...(
    [
      ["gold", "🥇", "금메달"],
      ["silver", "🥈", "은메달"],
      ["bronze", "🥉", "동메달"],
    ] as const
  ).map(([id, now, what]) => ({ key: `icon:medal:${id}`, kind: "icon" as const, now, what })),
];

const scenes: Entry[] = [
  ...GAMES.map((g) => ({ key: `scene:free:${g.id}`, kind: "scene" as const, now: g.icon, what: `놀이터 카드 장면: ${g.title}` })),
  ...ORIGINALS.map((g) => ({ key: `scene:games:${g.id}`, kind: "scene" as const, now: g.icon, what: `영어 놀이 카드 장면: ${g.title}` })),
];

const bgs: Entry[] = [
  { key: "bg:home", kind: "bg", now: "CSS 구름", what: "첫 화면 바탕(가운데는 비워 둠)" },
  { key: "bg:play", kind: "bg", now: "CSS 구름", what: "오늘의 영어 바탕" },
  { key: "bg:free", kind: "bg", now: "CSS 구름", what: "놀이터 바탕" },
  { key: "bg:letters", kind: "bg", now: "CSS 구름", what: "알파벳 카드 바탕" },
  { key: "bg:write", kind: "bg", now: "CSS 구름", what: "알파벳 쓰기 바탕" },
];

const app: Entry[] = [{ key: "app-icon", kind: "app", now: "ABC (임시 PNG)", what: "앱 아이콘 — 안내 친구 얼굴 (512×512)" }];

const sections = { guide, family, names, words, icons, scenes, bgs, app };
const total = Object.values(sections).reduce((n, s) => n + s.length, 0);
writeFileSync(new URL("./image-list.json", import.meta.url), JSON.stringify({ total, ...sections }, null, 2) + "\n");
console.log(`안내 친구 ${guide.length} · 가족 ${family.length} · 이름 ${names.length} · 단어 ${words.length} · 아이콘 ${icons.length} · 놀이터 장면 ${scenes.length} · 바탕 ${bgs.length} · 앱 아이콘 ${app.length} → 합계 ${total}장 → scripts/image-list.json`);
