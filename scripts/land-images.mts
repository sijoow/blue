/**
 * 나라 그림 넣기 — 보이스동화(Desktop/Dong)의 나라 그림을 줄여서 영어교실에 복사한다. 새로 그리지 않아 크레딧이 들지 않는다(2026-11-05 사용자).
 *   node scripts/land-images.mts   → public/img/lands/<id>.webp(바탕) · <id>-friend.webp(친구) + src/content/image-manifest.json(?v=내용 해시)
 * 그다음 npm run image:upload 로 Cafe24 에 올린다.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { LANDS } from "../src/curriculum/lands.ts";

const root = resolve(import.meta.dirname, "..");
const dong = resolve(root, "../Dong/public");
const manifestPath = resolve(root, "src/content/image-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, string>;

/** 동화나라 바탕만 자리가 다르다(보이스동화 lib/themes) */
const backgroundOf = (id: string) => (id === "storybook" ? "scenes-bright/home.webp" : `themes/${id}/background.webp`);

const put = (key: string, file: string, data: Buffer) => {
  writeFileSync(resolve(root, "public", file), data);
  manifest[key] = `${file}?v=${createHash("sha1").update(data).digest("hex").slice(0, 8)}`;
};

mkdirSync(resolve(root, "public/img/lands"), { recursive: true });
for (const { id } of LANDS) {
  put(`land:${id}`, `img/lands/${id}.webp`, await sharp(resolve(dong, backgroundOf(id))).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer());
  put(`friend:${id}`, `img/lands/${id}-friend.webp`, await sharp(resolve(dong, `themes/${id}/mascot.webp`)).resize(360, 360, { fit: "cover" }).webp({ quality: 86 }).toBuffer());
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
console.log(`나라 ${LANDS.length}곳 · 그림 ${LANDS.length * 2}장 → public/img/lands · manifest ${Object.keys(sorted).length}개 키`);
