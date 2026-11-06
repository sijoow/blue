/**
 * GPT 로 그림 그리기 — 2026-11-05 사용자: 영어교실 새 그림은 힉스필드 대신 OpenAI API 로(유료라 장수·비용을 먼저 말하고 승인받은 뒤에만).
 *   node --env-file=.env.local scripts/gpt-image.mts drafts/2026-11-06 icon:play:puzzle scene:free:pair …
 * 그림마다 프롬프트·레퍼런스는 scripts/image-prompts.json(npm run image:prompts — 힉스필드 때와 같은 문구)에서 꺼낸다.
 *   정사각(1:1) = 1024x1024, 카드·바탕(4:3·16:9) = 1536x1024. 투명 바탕은 background transparent. 레퍼런스(refs/gen)는 같이 보낸다(images/edits).
 * 결과: <폴더>/png/<파일>.png + <폴더>/results.json { 키: "gpt:<모델>" } — npm run image:install -- <폴더> 가 이미 있는 PNG 를 그대로 줄여 넣는다(내려받기 건너뜀).
 * 이미 그린 키는 건너뛴다. 거절(안전 필터)이 나오면 바로 멈춘다 — 남은 그림에 돈을 쓰지 않게.
 * .env.local: OPENAI_API_KEY (값은 찍지 않는다)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [dirArg, ...keys] = process.argv.slice(2);
if (!dirArg || !keys.length) throw new Error("쓰는 법: node --env-file=.env.local scripts/gpt-image.mts <폴더> <그림 키>…");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error(".env.local 에 OPENAI_API_KEY 가 없어요");
const dir = resolve(root, dirArg);
mkdirSync(dir, { recursive: true });

type Item = { key: string; file: string; refs: string[]; params: { aspect_ratio: string; background: "transparent" | "opaque" }; prompt: string };
const { items } = JSON.parse(readFileSync(resolve(root, "scripts/image-prompts.json"), "utf8")) as { items: Item[] };
const resultsPath = resolve(dir, "results.json");
const results = (existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, "utf8")) : {}) as Record<string, string>;
const MODELS = ["gpt-image-1.5", "gpt-image-1"];
/** 참고 단가(gpt-image-1, 100만 토큰당): 글 입력 $5 · 그림 입력 $10 · 그림 출력 $40 */
const costOf = (u?: { input_tokens_details?: { text_tokens?: number; image_tokens?: number }; output_tokens?: number }) =>
  u ? ((u.input_tokens_details?.text_tokens ?? 0) * 5 + (u.input_tokens_details?.image_tokens ?? 0) * 10 + (u.output_tokens ?? 0) * 40) / 1e6 : 0;

let spent = 0;
for (const key of keys) {
  const it = items.find((x) => x.key === key);
  if (!it) throw new Error(`image-prompts.json 에 없는 키: ${key} (npm run image:list && npm run image:prompts 먼저)`);
  const png = resolve(dir, "png", it.file.replace(/\.\w+$/, ".png"));
  if (results[key] && existsSync(png)) {
    console.log(`건너뜀 ${key} (이미 그림)`);
    continue;
  }
  const size = it.params.aspect_ratio === "1:1" ? "1024x1024" : "1536x1024";
  let done = false;
  for (const model of MODELS) {
    const form = new FormData();
    for (const [k, v] of Object.entries({ model, prompt: it.prompt, size, quality: "medium", n: "1", output_format: "png", background: it.params.background })) form.append(k, v);
    for (const r of it.refs) form.append("image[]", new Blob([readFileSync(resolve(root, r))], { type: "image/png" }), r.split("/").pop());
    const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400);
      if (res.status === 401) throw new Error("API 키가 맞지 않아요 (401)");
      if (/moderation|safety|content_policy|rejected/i.test(detail)) {
        console.log(`거절 ${key} (${model}): ${detail}`);
        console.log(`멈춤 — 쓴 돈 약 $${spent.toFixed(3)}`);
        process.exit(2);
      }
      console.log(`✖ ${key} ${model} ${res.status} ${detail}`);
      continue;
    }
    const data = (await res.json()) as { data: { b64_json: string }[]; usage?: Parameters<typeof costOf>[0] };
    mkdirSync(dirname(png), { recursive: true });
    writeFileSync(png, Buffer.from(data.data[0].b64_json, "base64"));
    results[key] = `gpt:${model}`;
    writeFileSync(resultsPath, JSON.stringify(results, null, 2) + "\n");
    const cost = costOf(data.usage);
    spent += cost;
    console.log(`✓ ${key} (${model}, ${size}) 약 $${cost.toFixed(3)}`);
    done = true;
    break;
  }
  if (!done) {
    console.log(`멈춤 — ${key} 를 못 그렸어요. 쓴 돈 약 $${spent.toFixed(3)}`);
    process.exit(1);
  }
}
console.log(`끝 — 쓴 돈 약 $${spent.toFixed(3)} → ${dirArg}/results.json · 다음: npm run image:install -- ${dirArg}`);
