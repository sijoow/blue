/**
 * 생성용 레퍼런스 만들기 — refs 원본에서 캐릭터만 잘라 낸 사본(이름표·로고·위키 화면 글자가 안 들어가게).
 *   node scripts/refs-clean.mts   → refs/gen/bluey.png · bingo.png · bandit.png · chilli.png · family.png
 * 생성기는 레퍼런스의 글자를 베낀다(숫자놀이 docs/numberblocks-style.md) — 그래서 덮는 대신 글자 없는 칸만 잘라 낸다. 원본은 건드리지 않는다.
 *   567.jpg(695×512) — 이름표가 붙은 캐릭터 줄 세우기: 이름 위까지만 한 명씩
 *   12.png(340×600)  — 위키 화면 속 가족 포스터: 위 BLUEY 로고·오른쪽 화면 버튼을 뺀 칸
 * 칸은 원본 크기에서 눈으로 잡은 자리(2026-10-28). 작은 원본이라 긴 변 512px 로 키워 둔다.
 */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "refs/gen");
mkdirSync(out, { recursive: true });

type Box = { left: number; top: number; width: number; height: number };
const CROPS: Record<string, [string, Box]> = {
  bandit: ["refs/567.jpg", { left: 2, top: 12, width: 98, height: 112 }],
  bingo: ["refs/567.jpg", { left: 98, top: 18, width: 82, height: 104 }],
  bluey: ["refs/567.jpg", { left: 180, top: 18, width: 84, height: 104 }],
  chilli: ["refs/567.jpg", { left: 236, top: 184, width: 84, height: 120 }],
  family: ["refs/12.png", { left: 25, top: 298, width: 244, height: 258 }],
};

for (const [name, [file, box]] of Object.entries(CROPS)) {
  await sharp(resolve(root, file))
    .extract(box)
    .resize(512, 512, { fit: "inside", kernel: "lanczos3" })
    .png()
    .toFile(resolve(out, `${name}.png`));
}
console.log(`→ refs/gen/${Object.keys(CROPS).join(".png · ")}.png`);
