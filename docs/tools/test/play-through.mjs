// 놀이 끝까지 해 보기 — 미리 보기(진도에 안 남음)로 놀이 하나를 열고, 아이처럼 눌러·끌어서 끝까지 한 뒤 다음 놀이로 넘어가는지 본다.
// node play-through.mjs <포트> [크기 412x780] [놀이들]   · /api/progress·/api/family 는 막는다(fe 서버 기록 보호)
//   놀이 = <이름>=<미리 보기 주소> — 기본 목록은 아래 CASES. 정답을 몰라도 되게: 보기는 차례로 눌러 보고, 끌어 놓기는 글자 열쇠(aria-label·data-drop)로 맞춘다.
// 따라 쓰기(캔버스)는 여기서 하지 않는다 — 한글나라·숫자놀이에서 쓰던 판 그대로.
import { mkdirSync, writeFileSync } from "node:fs";
const [PORT = "9344", SIZE = "412x780", ONLY = ""] = process.argv.slice(2);
const OUT = new URL("./through/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
const errors = [];
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, (m) => res(m.result ?? m));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === "Fetch.requestPaused") void send("Fetch.failRequest", { requestId: m.params.requestId, errorReason: "Failed" });
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1, pointerType: "mouse" });
const center = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
async function drag(fromSel, toSel) {
  const a = await center(fromSel);
  const b = await center(toSel);
  if (!a || !b) return false;
  await mouse("mousePressed", a[0], a[1]);
  for (let k = 1; k <= 6; k++) await mouse("mouseMoved", a[0] + ((b[0] - a[0]) * k) / 6, a[1] + ((b[1] - a[1]) * k) / 6);
  await mouse("mouseReleased", b[0], b[1]);
  return true;
}
/** 지금 놀이 순서 표시에서 몇 번째 놀이인지(✓ 수) — 그날 마지막 놀이를 끝내 보상 화면이면 99 */
const step = () =>
  ev(`/오늘의 영어 끝|도장 퀴즈 끝/.test(document.body.innerText) ? 99 : [...document.querySelectorAll('ol[aria-label="오늘의 영어 순서"] li')].filter((li) => li.textContent.includes("✓")).length`);
const kindNow = () => ev(`document.querySelector("section")?.innerText.slice(0, 40) ?? ""`);

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/progress*" }, { urlPattern: "*/api/family*" }] });
const [w, h] = SIZE.split("x").map(Number);
await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: "http://localhost:6500/" });
await sleep(2500);
await ev(`fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:"fe",password:"1234"})}).then(r=>r.json()).then(j=>(localStorage.setItem("haon-english:auth",JSON.stringify(j)),true))`);

/** 놀이 하나를 끝까지 — 놀이 순서의 ✓ 가 하나 늘면 끝난 것 */
async function playOne(kind) {
  const before = await step();
  for (let t = 0; t < 120; t++) {
    if ((await step()) > before) return true;
    if (kind === "meet") {
      for (const sel of ["button[aria-label^='대문자']", "button[aria-label^='소문자']"]) {
        await ev(`document.querySelector(${JSON.stringify(sel)})?.click()`);
        await sleep(1500);
      }
      const words = await ev(`[...document.querySelectorAll("section button")].filter((b) => /^[a-z-]+$/.test(b.getAttribute("aria-label") ?? "")).map((b) => b.getAttribute("aria-label"))`);
      for (const wd of words ?? []) {
        await ev(`document.querySelector('section button[aria-label=${JSON.stringify(wd)}]')?.click()`);
        await sleep(1500);
      }
      await ev(`[...document.querySelectorAll("section button")].find((b) => b.textContent.includes("좋아"))?.click()`);
      await sleep(1200);
    } else if (kind === "match-case") {
      const tops = await ev(`[...document.querySelectorAll('section span[role="button"]')].map((x) => x.getAttribute("aria-label"))`);
      for (const l of tops ?? []) {
        await drag(`section span[role="button"][aria-label="${l}"]`, `[data-drop="m:${l}"]`);
        await sleep(1400);
      }
      await sleep(2500);
    } else if (kind === "missing-letter") {
      const tiles = await ev(`[...document.querySelectorAll('section span[role="button"]')].map((x) => x.getAttribute("aria-label"))`);
      for (const l of tiles ?? []) {
        if (!(await center(`section span[role="button"][aria-label="${l}"]`))) continue;
        await drag(`section span[role="button"][aria-label="${l}"]`, `[data-drop="slot"]`);
        await sleep(2600);
      }
    } else if (kind === "song") {
      // 다 부를 때까지 기다렸다가 「좋아!」
      await ev(`[...document.querySelectorAll("section button")].find((b) => b.textContent.includes("좋아"))?.click()`);
      await sleep(2500);
    } else if (kind === "book") {
      await ev(`document.querySelector("section button[aria-label='다음 쪽']")?.click()`);
      await sleep(1500);
      await ev(`[...document.querySelectorAll("section button")].find((b) => b.textContent.includes("좋아"))?.click()`);
    } else if (kind === "say") {
      // 헤드리스 크롬은 가짜 마이크(--use-fake-device-for-media-stream)로 녹음한다
      await ev(`document.querySelector("section button[aria-label='녹음하기']:not([disabled])")?.click()`);
      await sleep(2500);
      await ev(`[...document.querySelectorAll("section button")].find((b) => /다음|좋아/.test(b.textContent))?.click()`);
      await sleep(1500);
    } else if (kind === "quiz") {
      await ev(`[...document.querySelectorAll("section button")].find((b) => b.textContent.includes("시작!"))?.click()`);
      await sleep(1500);
      const n = await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기").length`);
      for (let k = 0; k < (n ?? 0); k++) {
        await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기")[${k}]?.click()`);
        await sleep(1800);
      }
    } else if (kind === "pop") {
      const target = await ev(`document.querySelector("section .glass")?.innerText.trim()[0]`);
      const n = await ev(`[...document.querySelectorAll("section button[aria-label]")].length`);
      for (let k = 0; k < n; k++) {
        const hit = await ev(`(() => { const b = [...document.querySelectorAll("section button[aria-label]")][${k}]; if (!b || b.getAttribute("aria-label").toUpperCase() !== ${JSON.stringify(target)}) return false; b.click(); return true; })()`);
        if (hit) await sleep(1200);
      }
      await sleep(3000);
    } else {
      // 보기 고르기 — 차례로 눌러 본다(틀린 보기는 흐려지고, 맞으면 다음 판)
      const n = await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기").length`);
      for (let k = 0; k < (n ?? 0); k++) {
        await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기")[${k}]?.click()`);
        await sleep(1800);
      }
      await sleep(2000);
    }
    // 정답 뒤 칭찬·다음 판을 기다린다 — 안 기다리면 다음 판이 뜨기 전에 시도 횟수가 바닥난다
    await sleep(1000);
  }
  return (await step()) > before;
}

const CASES = [
  ["song", "/play?preview=c1d1&auto=1"],
  ["book", "/play?preview=c1d1&step=1&auto=1"],
  ["meet", "/play?preview=c1d1&step=2&auto=1"],
  ["find-letter", "/play?preview=c1d1&step=3&auto=1"],
  ["word-pick", "/play?preview=c1d1&step=4&auto=1"],
  ["match-case", "/play?preview=c1d2&step=4&auto=1"],
  ["say", "/play?preview=c1d3&step=4&auto=1"],
  ["missing-letter", "/play?preview=c1d4&step=4&auto=1"],
  ["pop", "/play?preview=c1d5&step=3&auto=1"],
  ["next-letter", "/play?preview=c2d5&step=5&auto=1"],
  ["quiz", "/play?preview=c2d6&auto=1"],
];
for (const [kind, path] of CASES.filter(([k]) => !ONLY || ONLY.split(",").includes(k))) {
  await send("Page.navigate", { url: `http://localhost:6500${path}` });
  await sleep(3500);
  const t0 = Date.now();
  const ok = await playOne(kind);
  const s = await send("Page.captureScreenshot", { format: "png" });
  const name = `${kind}-${path.replace(/[^a-z0-9]+/gi, "_")}`;
  writeFileSync(new URL(`./${name}.png`, OUT), Buffer.from(s.data, "base64"));
  console.log(`${ok ? "끝까지 됨" : "안 끝남"} ${kind} ${path} (${Math.round((Date.now() - t0) / 1000)}초) → 다음 화면: ${(await kindNow()).replace(/\s+/g, " ")}`);
}
console.log("오류", errors.length ? errors.slice(0, 5).join("\n") : "없음");
await ev(`localStorage.clear(), true`);
await send("Page.navigate", { url: "about:blank" });
await sleep(300);
await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
ws.close();
process.exit(0);
