/**
 * 한글나라·숫자놀이에 이미 구운 음성 빌려 오기 — 크레딧을 안 쓴다(칭찬·다시 하기·"다음!" 같은 같은 문장).
 *   npm run voice:reuse                 (기본 ../todo 와 ../nmber 둘 다, 하나만이면 --from <폴더>)
 * scripts/voice-lines.json 의 말 가운데 그 앱 voice-manifest 에 똑같은 글이 있으면
 *   그 mp3 를 public/voice/<성우>/ 로 복사하고, src/content/voice-manifest.json · voice-timing.json(노래방 구간)에 넣는다.
 * 남은 말(새로 구워야 할 것)의 줄 수·글자 수를 알려 준다 → npm run voice:make -- --voice sua (견적) → 확인 받고 --yes
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isEnglish } from "../src/lib/voices.ts";

const root = resolve(import.meta.dirname, "..");
const i = process.argv.indexOf("--from");
const froms = (i >= 0 ? [process.argv[i + 1]] : ["../todo", "../nmber"]).map((f) => resolve(root, f));

type Manifest = Record<string, Record<string, string>>;
const readJson = <T,>(f: string, fallback: T): T => (existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : fallback);

const linesFile = resolve(root, "scripts/voice-lines.json");
if (!existsSync(linesFile)) throw new Error("scripts/voice-lines.json 이 없어요 — npm run voice:lines 먼저");
const lines = Object.values((JSON.parse(readFileSync(linesFile, "utf8")) as { groups: Record<string, string[]> }).groups).flat();

const manifestPath = resolve(root, "src/content/voice-manifest.json");
const timingPath = resolve(root, "src/content/voice-timing.json");
const ours = readJson<Manifest>(manifestPath, {});
const timing = readJson<Record<string, number[][]>>(timingPath, {});

let copied = 0;
for (const from of froms) {
  const theirs = readJson<Manifest>(resolve(from, "src/content/voice-manifest.json"), {});
  const theirTiming = readJson<Record<string, number[][]>>(resolve(from, "src/content/voice-timing.json"), {});
  if (!Object.keys(theirs).length) {
    console.log(`음성 목록을 못 찾았어요(건너뜀): ${from}`);
    continue;
  }
  for (const [voice, files] of Object.entries(theirs)) {
    for (const text of lines) {
      const file = files[text];
      if (!file || ours[voice]?.[text]) continue;
      const src = resolve(from, "public", file);
      if (!existsSync(src)) continue;
      const dst = resolve(root, "public", file);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      ours[voice] ??= {};
      ours[voice][text] = file;
      if (theirTiming[file]) timing[file] = theirTiming[file];
      copied++;
    }
  }
}

writeFileSync(manifestPath, JSON.stringify(ours, null, 2) + "\n");
writeFileSync(timingPath, JSON.stringify(timing) + "\n");
// 영어(글자 이름·단어)는 한국어 성우로 굽지 않는다 — 원어민 묶음 "en" 으로 따로
const left = lines.filter((t) => !ours.sua?.[t] && !isEnglish(t));
console.log(`빌려 옴 ${copied}개 (${froms.join(" · ")})`);
console.log(`수아로 아직 없는 말 ${left.length}줄 · ${left.reduce((n, t) => n + [...t].length, 0)}자 — npm run voice:make -- --voice sua 로 견적`);
