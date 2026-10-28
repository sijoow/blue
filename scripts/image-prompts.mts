/**
 * 힉스필드 프롬프트 — scripts/image-list.json 의 그림마다 모델 설정·레퍼런스·프롬프트·저장 파일을 정한다.
 *   npm run image:list && npm run image:prompts   → scripts/image-prompts.json
 * 모델은 한글나라·숫자놀이와 같이 GPT Image 2.5 medium:
 *   안내 친구·단어·아이콘 = 1:1 1k 바탕 투명(장당 0.5크레딧) · 놀이터 장면 = 4:3 1k · 바탕 = 16:9 1k(숫자놀이 때 2k 바탕이 견적보다 비쌌다)
 * 레퍼런스는 refs/gen/(node scripts/refs-clean.mts — 이름표·로고를 잘라 낸 사본, 생성할 때 업로드해서 넣는다). 그림체 기준은 docs/bluey-style.md.
 * 파일 이름은 모두 영문·숫자 — Cafe24 는 한글 파일 이름을 못 찾는다.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { wordOf } from "../src/curriculum/alphabet.ts";
import { BLUEY, CHAR, CUTOUT, FAMILY, FAMILY_MOOD, GAME_SCENE, GUIDE_MOOD, MEDAL_ICON, MENU_SCENE, NAME_PORTRAIT, NO_CHAR, NO_TEXT, ONLY, ORIGINAL_SCENE, PLAY_ICON, SCENE, STYLE, UI_ICON, WORD_DRAW } from "./image-style.mts";

type Params = { model: "gpt_image_2_5"; quality: "medium"; resolution: "1k" | "2k"; aspect_ratio: "1:1" | "4:3" | "16:9"; background: "transparent" | "opaque" };
type Entry = { key: string; kind: "guide" | "family" | "name" | "word" | "icon" | "scene" | "bg" | "app"; what: string };
type Item = { key: string; file: string; what: string; refs: string[]; params: Params; prompt: string };

const R = (name: string) => `refs/gen/${name}.png`;
/** 가족 넷 레퍼런스 — 한 명씩 자른 사본 + 포스터 */
const FAMILY_REFS = ["bluey", "bingo", "bandit", "chilli", "family"].map(R);
const ONLY_FAMILY = ONLY("the four Heeler family members (Bluey, Bingo, Dad and Mum)");
const cutout: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "1k", aspect_ratio: "1:1", background: "transparent" };
const card: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "1k", aspect_ratio: "4:3", background: "opaque" };
const wide: Params = { model: "gpt_image_2_5", quality: "medium", resolution: "1k", aspect_ratio: "16:9", background: "opaque" };
/** 어림 — 1k 0.5크레딧(숫자놀이 실측), 16:9 는 넉넉히 1 */
const creditsOf = (p: Params) => (p.aspect_ratio === "16:9" || p.resolution === "2k" ? 1 : 0.5);

const BG_DRAW: Record<string, string> = {
  home: "the backyard lawn with the Queenslander house far at the left and leafy trees at the right",
  play: "a sunny garden with soft green grass and a few flowers along the bottom edge",
  free: "a backyard playground with a swing at the far left and a slide at the far right",
  letters: "the shady verandah of the Queenslander house with toy boxes at the far sides",
  write: "a sunny verandah with a small table and crayons at the far right",
};

const list = JSON.parse(readFileSync(new URL("./image-list.json", import.meta.url), "utf8")) as Record<string, Entry[] | number>;
const entries = Object.values(list).filter(Array.isArray).flat() as Entry[];
const join = (...parts: string[]) => parts.filter(Boolean).join(" ");

function build(e: Entry): Item | null {
  const id = e.key.replace(/^[a-z]+:/, "").replace(/:/g, "-");
  const base = { key: e.key, what: e.what };
  switch (e.kind) {
    case "guide":
      return {
        ...base,
        file: `img/guide/${e.key === "guide" ? "happy" : id}.webp`,
        refs: [R("bluey"), R("family")],
        params: cutout,
        prompt: join(STYLE, CHAR, `${BLUEY} She is ${GUIDE_MOOD[e.key]}. Standing, full body, front three-quarter view.`, ONLY("Bluey"), NO_TEXT, CUTOUT),
      };
    case "family":
      return {
        ...base,
        file: `img/family/${e.key.slice("family:".length)}.webp`,
        refs: FAMILY_REFS,
        params: cutout,
        prompt: join(STYLE, CHAR, `${FAMILY} They are ${FAMILY_MOOD[e.key]}. Full bodies, front view.`, ONLY_FAMILY, NO_TEXT, CUTOUT),
      };
    case "name": {
      const p = NAME_PORTRAIT[id];
      return { ...base, file: `img/names/${id}.webp`, refs: [R(p.ref), R("family")], params: cutout, prompt: join(STYLE, CHAR, p.draw, ONLY(p.who), NO_TEXT, CUTOUT) };
    }
    case "word": {
      const w = wordOf(id);
      return { ...base, file: `img/words/${w.id}.webp`, refs: [R("family")], params: cutout, prompt: join(STYLE, `One picture of ${WORD_DRAW[w.id] ?? `a ${w.en}`}, cute and simple, easy for a 4-year-old to recognise.`, NO_CHAR, NO_TEXT, CUTOUT) };
    }
    case "icon": {
      const [, group, name] = e.key.split(":");
      if (group === "menu") {
        const who = name === "letters" || name === "books" ? "bingo" : "bluey";
        return { ...base, file: `img/icons/${id}.webp`, refs: [R(who), R("family")], params: cutout, prompt: join(STYLE, CHAR, `A small app icon: ${MENU_SCENE[name]}`, ONLY(who === "bingo" ? "Bingo" : "Bluey"), NO_TEXT, CUTOUT) };
      }
      const draw = group === "sticker" ? "a shiny round gold star sticker with a white border" : group === "play" ? PLAY_ICON[name] : group === "medal" ? MEDAL_ICON[name] : UI_ICON[name];
      return { ...base, file: `img/icons/${id}.webp`, refs: [R("family")], params: cutout, prompt: join(STYLE, `A small app icon: ${draw ?? e.what}, simple and bold.`, NO_CHAR, NO_TEXT, CUTOUT) };
    }
    case "scene": {
      // "scene:free:<놀이>" 놀이터 · "scene:games:<놀이>" 영어 놀이
      const [, where, game] = e.key.split(":");
      return {
        ...base,
        file: `img/scenes/${where}-${game}.webp`,
        refs: FAMILY_REFS,
        params: card,
        prompt: join(STYLE, CHAR, (where === "games" ? ORIGINAL_SCENE : GAME_SCENE)[game] ?? e.what, FAMILY, ONLY_FAMILY, SCENE, NO_TEXT),
      };
    }
    case "bg": {
      const scene = e.key.slice("bg:".length);
      return {
        ...base,
        file: `img/bg/${scene}.webp`,
        refs: [R("family")],
        params: wide,
        prompt: join(STYLE, `A wide background: ${BG_DRAW[scene] ?? e.what}. No characters, no people, no dogs.`, "Keep the middle area calm and mostly empty so cards can sit on top.", SCENE, NO_TEXT),
      };
    }
    case "app":
      return {
        ...base,
        file: "img/app-icon.png",
        refs: [R("bluey")],
        params: { ...cutout, background: "opaque" },
        prompt: join(STYLE, CHAR, `App icon: the smiling face of Bluey filling a rounded square, plain soft sky-blue background. ${BLUEY}`, ONLY("Bluey"), NO_TEXT),
      };
  }
}

const items = entries.map(build).filter((x): x is Item => x !== null);
const credits = items.reduce((n, it) => n + creditsOf(it.params), 0);
const refs = [...new Set(items.flatMap((it) => it.refs))];
writeFileSync(new URL("./image-prompts.json", import.meta.url), JSON.stringify({ total: items.length, credits, refs, items }, null, 2) + "\n");
console.log(`프롬프트 ${items.length}장 · 약 ${credits} 크레딧 · 레퍼런스 ${refs.length}장 → scripts/image-prompts.json`);
