// 오늘의 길 끝까지 해 보기 — 칸 누르기 → 놀이 → 길로 돌아와 다음 칸 → (따라 쓰기 칸은 진도를 심어 건너뛴다) → 다시 열어도 그 칸부터 → 끝 칸 → 미션 성공 → 다음 미션.
// 그다음 도장 퀴즈 · 다음 나라(도장 → 다음 나라로 → 친구 인사) · 지도(나라 칸 → 미션 칸 → 지난 미션 다시 하기) · 부모 문(꾹 → 덧셈)까지 본다.
// node path-through.mjs <포트> [크기 412x780] [단계들 mission,stamp,land,map,gate]   · /api/progress·/api/family 는 막는다(fe 서버 기록 보호)
import { mkdirSync, writeFileSync } from "node:fs";
const [PORT = "9344", SIZE = "412x780", ONLY = "mission,stamp,land,map,gate"] = process.argv.slice(2);
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
const center = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: "nearest", inline: "nearest" }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
async function drag(fromSel, toSel) {
  const a = await center(fromSel);
  const b = await center(toSel);
  if (!a || !b) return false;
  await mouse("mousePressed", a[0], a[1]);
  for (let k = 1; k <= 6; k++) await mouse("mouseMoved", a[0] + ((b[0] - a[0]) * k) / 6, a[1] + ((b[1] - a[1]) * k) / 6);
  await mouse("mouseReleased", b[0], b[1]);
  return true;
}
const shot = async (name) => {
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(new URL(`./path-${name}-${SIZE}.png`, OUT), Buffer.from(s.data, "base64"));
};
const go = async (path) => {
  await send("Page.navigate", { url: `http://localhost:6500${path}` });
  await sleep(3200);
};
const clickText = (t) => ev(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(${JSON.stringify(t)}) && !x.disabled); b?.click(); return !!b; })()`);
const text = () => ev(`document.body.innerText`);
// 칸 이름 앞의 아이콘이 그림이 아니라 이모지면 글자로 섞여 나온다 — 한글·영문 앞은 떼고 읽는다
const cellNow = () => ev(`(document.querySelector('[aria-label="지금 칸"]')?.innerText ?? "").replace(/\\s+/g, " ").replace(/^[^가-힣A-Za-z]+/, "")`);
let fails = 0;
const check = (ok, what) => {
  console.log(`${ok ? "OK " : "실패"} ${what}`);
  if (!ok) fails++;
};
/** 기기 진도를 고친다 — 서버는 막아 두었다 */
const seed = (js) => ev(`(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("haon-english:v1:")) ?? "haon-english:v1:fe"; const s = JSON.parse(localStorage.getItem(k) ?? '{"progress":{},"settings":{}}'); (${js})(s); localStorage.setItem(k, JSON.stringify(s)); return true; })()`);
const reset = () => ev(`(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("haon-english:v1:")) localStorage.removeItem(k); return true; })()`);


/** 따라 쓰기 판의 획을 차례대로 긋는다 — svg 의 data-strokes(판 좌표)를 화면 좌표로 바꿔 펜 머리부터 끝까지 */
async function traceBoard() {
  for (let t = 0; t < 8; t++) {
    const info = await ev(`(() => { const s = document.querySelector("svg[data-strokes]"); if (!s) return null; s.scrollIntoView({ block: "nearest" }); const r = s.getBoundingClientRect(); return { ...JSON.parse(s.dataset.strokes), now: Number(s.dataset.strokeNow), r: [r.left, r.top, r.width, r.height] }; })()`);
    if (!info || info.now >= info.strokes.length) return;
    const [L, T, W, H] = info.r;
    const pts = [];
    const st = info.strokes[info.now];
    for (let i = 1; i < st.length; i++) {
      const [a, b] = [st[i - 1], st[i]];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) pts.push([L + ((a[0] + ((b[0] - a[0]) * k) / n) / info.w) * W, T + ((a[1] + ((b[1] - a[1]) * k) / n) / info.h) * H]);
    }
    await mouse("mousePressed", pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) await mouse("mouseMoved", p[0], p[1]);
    await mouse("mouseReleased", pts[pts.length - 1][0], pts[pts.length - 1][1]);
    await sleep(250);
  }
}

/** 칸 하나를 아이처럼 끝까지 — 길로 돌아오면(지금 칸 표시가 사라지면) 끝 */
async function playCell() {
  const label = await cellNow();
  for (let t = 0; t < 90; t++) {
    if (!(await cellNow())) return label;
    const now = await cellNow();
    if (now.startsWith("알파벳 만나기")) {
      for (const sel of ["button[aria-label^='대문자']", "button[aria-label^='소문자']"]) {
        await ev(`document.querySelector(${JSON.stringify(sel)})?.click()`);
        await sleep(1200);
      }
      const words = await ev(`[...document.querySelectorAll("section button")].filter((b) => /^[a-z-]+$/.test(b.getAttribute("aria-label") ?? "")).map((b) => b.getAttribute("aria-label"))`);
      for (const wd of words ?? []) {
        await ev(`document.querySelector('section button[aria-label=${JSON.stringify(wd)}]')?.click()`);
        await sleep(1200);
      }
      await clickText("좋아");
    } else if (now.startsWith("짝꿍")) {
      const tops = await ev(`[...document.querySelectorAll('section span[role="button"]')].map((x) => x.getAttribute("aria-label"))`);
      for (const l of tops ?? []) {
        await drag(`section span[role="button"][aria-label="${l}"]`, `[data-drop="m:${l}"]`);
        await sleep(1300);
      }
      await sleep(2000);
    } else if (now.startsWith("빈칸")) {
      const tiles = await ev(`[...document.querySelectorAll('section span[role="button"]')].map((x) => x.getAttribute("aria-label"))`);
      for (const l of tiles ?? []) {
        if (!(await center(`section span[role="button"][aria-label="${l}"]`))) continue;
        await drag(`section span[role="button"][aria-label="${l}"]`, `[data-drop="slot"]`);
        await sleep(2400);
      }
    } else if (now.startsWith("따라 쓰기")) {
      await traceBoard();
      await sleep(4500);
    } else if (now.startsWith("노래")) {
      await clickText("좋아");
      await sleep(2000);
    } else if (now.startsWith("그림책")) {
      await ev(`document.querySelector("section button[aria-label='다음 쪽']")?.click()`);
      await sleep(1200);
      await clickText("좋아");
    } else if (now.startsWith("따라 말하기")) {
      await ev(`document.querySelector("section button[aria-label='녹음하기']:not([disabled])")?.click()`);
      await sleep(2300);
      await ev(`[...document.querySelectorAll("section button")].find((b) => /다음|좋아/.test(b.textContent))?.click()`);
      await sleep(1200);
    } else if (now.startsWith("도장 퀴즈")) {
      await clickText("시작!");
      await sleep(1200);
      const n = await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기").length`);
      for (let k = 0; k < (n ?? 0); k++) {
        await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기")[${k}]?.click()`);
        await sleep(1500);
      }
    } else if (now.startsWith("글자 방울")) {
      const target = await ev(`document.querySelector("section .glass")?.innerText.trim()[0]`);
      const n = await ev(`[...document.querySelectorAll("section button[aria-label]")].length`);
      for (let k = 0; k < n; k++) {
        const hit = await ev(`(() => { const b = [...document.querySelectorAll("section button[aria-label]")][${k}]; if (!b || b.getAttribute("aria-label").toUpperCase() !== ${JSON.stringify(target)}) return false; b.click(); return true; })()`);
        if (hit) await sleep(1000);
      }
      await sleep(2500);
    } else if (now.startsWith("말풍선")) {
      await ev(`document.querySelector("section button[aria-label='말풍선']")?.click()`);
      await sleep(4500);
    } else if (now.startsWith("글자 퍼즐") || now.startsWith("다리 잇기")) {
      const pre = (await ev(`document.querySelector('[data-drop^="p:"]') ? "p" : "b"`)) ?? "p";
      const pieces = await ev(`[...document.querySelectorAll('section span[role="button"]')].map((x) => x.getAttribute("aria-label"))`);
      for (const l of pieces ?? []) {
        if (!(await ev(`!!document.querySelector('[data-drop="${pre}:${l}"]')`))) continue;
        await drag(`section span[role="button"][aria-label="${l}"]`, `[data-drop="${pre}:${l}"]`);
        await sleep(1300);
      }
      await sleep(pre === "b" ? 4500 : 2500);
    } else if (now.startsWith("같은 글자")) {
      const t = await ev(`document.querySelector("[data-target]")?.getAttribute("data-target")`);
      if (t) await drag(`section span[role="button"][aria-label="${t}"]`, `[data-drop="same"]`);
      await sleep(3200);
    } else if (now.startsWith("그림 짝꿍")) {
      const cards = await ev(`[...document.querySelectorAll("section [data-card]")].filter((x) => x.getAttribute("data-drop")).map((x) => [x.getAttribute("data-card"), x.getAttribute("aria-label")])`);
      const seen = new Map();
      for (const [i, w] of cards ?? []) {
        if (!seen.has(w)) {
          seen.set(w, i);
          continue;
        }
        await drag(`section [data-card="${seen.get(w)}"]`, `section [data-card="${i}"]`);
        await sleep(1400);
      }
      await sleep(2500);
    } else {
      // 보기 고르기 — 차례로 눌러 본다(틀린 보기는 흐려지고, 맞으면 다음 판)
      const n = await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기").length`);
      for (let k = 0; k < (n ?? 0); k++) {
        await ev(`[...document.querySelectorAll("section button.squish[aria-label]")].filter((b) => b.getAttribute("aria-label") !== "다시 듣기")[${k}]?.click()`);
        await sleep(1500);
      }
      await sleep(1500);
    }
    await sleep(800);
  }
  return null;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/progress*" }, { urlPattern: "*/api/family*" }] });
const [w, h] = SIZE.split("x").map(Number);
await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await go("/");
await ev(`fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:"fe",password:"1234"})}).then(r=>r.json()).then(j=>(localStorage.setItem("haon-english:auth",JSON.stringify(j)),true))`);
await go("/");
await reset();

const steps = ONLY.split(",");

if (steps.includes("mission")) {
  await go("/");
  await shot("home");
  check((await text()).includes("시작하기"), "첫 화면에 시작하기");
  check((await text()).includes("과자나라"), "첫 화면에 지금 나라");
  await go("/play");
  await shot("hello");
  check((await text()).includes("쿠키"), "처음 온 나라 — 친구가 인사");
  await clickText("좋아!");
  await sleep(800);
  await shot("path");
  check(!!(await center("[data-path-now]")), "오늘의 길에 지금 칸");
  check((await text()).includes("오늘의 글자 A"), "1장 미션 1 제목");
  // 앞 칸을 누르면 안 열린다
  await ev(`document.querySelector('button[aria-label="3번째 칸"]')?.click()`);
  await sleep(500);
  check(!(await cellNow()), "앞 칸은 안 열린다");
  // 따라 쓰기 앞 일곱 칸을 아이처럼
  for (let i = 0; i < 7; i++) {
    await ev(`document.querySelector("[data-path-now]")?.click()`);
    await sleep(1800);
    const name = await playCell();
    check(name !== null && !(await cellNow()), `${i + 1}칸 끝: ${name}`);
    await sleep(2400);
    if (i === 1) await shot("path-walked");
  }
  // 다시 열어도 그 칸부터
  await go("/play");
  check((await ev(`[...document.querySelectorAll('button[aria-label^="7번째 칸"]')].length`)) === 1, "다시 열어도 깬 칸이 남아 있다");
  check((await ev(`document.querySelector("[data-path-now]")?.getAttribute("aria-label")`)) === "8번째 칸", "지금 칸은 8번째");
  await ev(`document.querySelector("[data-path-now]")?.click()`);
  await sleep(2000);
  check((await cellNow()).startsWith("따라 쓰기"), "마지막 칸은 따라 쓰기");
  await shot("trace");
  // 따라 쓰기도 획을 따라 끝까지(획 쓰기 판, 2026-11-06)
  const traced = await playCell();
  check(traced !== null && !(await cellNow()), `8칸 끝: ${traced}`);
  await sleep(2400);
  await shot("path-arrived");
  check((await ev(`!document.querySelector("[data-path-goal]")?.disabled`)) === true, "끝 칸이 열린다");
  await ev(`document.querySelector("[data-path-goal]")?.click()`);
  await sleep(2000);
  await shot("reward");
  check((await text()).includes("미션 성공!"), "미션 성공 화면");
  await clickText("다음 미션");
  await sleep(1500);
  check((await text()).includes("오늘의 글자 B"), "다음 미션 = 오늘의 글자 B");
  check((await ev(`document.querySelector("[data-path-now]")?.getAttribute("aria-label")`)) === "1번째 칸", "새 미션은 첫 칸부터");
  await go("/");
  await shot("home-after");
  check((await text()).includes("미션 2/13"), "첫 화면 미션 2/13");
}

if (steps.includes("stamp")) {
  await seed(`(s) => { s.progress.day = 13; s.progress.run = null; s.progress.letters = ["A", "B", "C", "D"]; }`);
  await go("/play");
  check((await text()).includes("도장 퀴즈"), "도장 퀴즈 날");
  await ev(`document.querySelector("[data-path-now]")?.click()`);
  await sleep(2000);
  const name = await playCell();
  check(name !== null, `퀴즈 끝: ${name}`);
  await sleep(2400);
  await ev(`document.querySelector("[data-path-goal]")?.click()`);
  await sleep(2000);
  await shot("stamp-reward");
  const t = await text();
  check(t.includes("도장 퀴즈 끝!") && /금메달|은메달|동메달/.test(t), "메달이 나온다");
  console.log("   결과:", t.match(/\d+문제 중 \d+개/)?.[0], t.includes("도장 쾅") ? "도장 받음" : t.includes("연습") ? "추가 학습" : "");
}

if (steps.includes("land")) {
  await seed(`(s) => { s.progress.chapter = 1; s.progress.day = 13; s.progress.practice = false; s.progress.tries = 0; s.progress.run = { key: "c1d13", done: 1, score: { correct: 10, total: 10, activities: 1 }, startedAt: 1 }; }`);
  await go("/play");
  await ev(`document.querySelector("[data-path-goal]")?.click()`);
  await sleep(2000);
  await shot("land-reward");
  const t = await text();
  check(t.includes("과자나라 도장 쾅") && t.includes("금메달"), "나라 도장 + 금메달");
  await clickText("다음 나라로");
  await sleep(1500);
  await shot("land-hello");
  const t2 = await text();
  check(t2.includes("동물나라") && t2.includes("깡총이"), "다음 나라 친구가 인사");
  await clickText("좋아!");
  await sleep(800);
  check((await text()).includes("오늘의 글자 E"), "다음 나라 첫 미션 = 오늘의 글자 E");
}

if (steps.includes("map")) {
  await seed(`(s) => { s.progress.chapter = 2; s.progress.day = 6; s.progress.practice = false; s.progress.tries = 0; s.progress.stamps = [1]; s.progress.run = null; s.progress.best = { 1: 0.9 }; }`);
  await go("/map");
  await shot("map");
  check((await ev(`document.querySelectorAll('button[aria-label$="장 A B C D"], button[aria-label^="1장"]').length`)) >= 1, "지도에 1장");
  check((await text()).includes("동물나라"), "지도에 나라 이름");
  await ev(`document.querySelector('button[aria-label^="2장"]')?.click()`);
  await sleep(800);
  await shot("map-panel");
  const panel = await text();
  check(panel.includes("미션 6 / 13"), "지금 장 패널: 미션 6 / 13");
  check(panel.includes("출발"), "출발 버튼");
  // 끝낸 미션을 누르면 다시 하기
  await ev(`document.querySelector('button[aria-label="미션 2"]')?.click()`);
  await sleep(3000);
  check((await ev(`location.search`)) === "?review=c2d2", "끝낸 미션 = 다시 하기");
  await shot("map-review");
  check((await text()).includes("지난 미션 다시 하기"), "다시 하기 안내");
}

if (steps.includes("gate")) {
  await go("/");
  const g = await center('button[aria-label^="부모 페이지"]');
  await mouse("mousePressed", g[0], g[1]);
  await sleep(1800);
  await mouse("mouseReleased", g[0], g[1]);
  await sleep(600);
  await shot("gate");
  const q = await ev(`document.querySelector('[role="dialog"]')?.innerText`);
  const m = /(\d+) \+ (\d+)/.exec(q ?? "");
  check(!!m, `꾹 누르면 덧셈 문제: ${m?.[0]}`);
  // 틀리면 안 열린다
  for (const d of "00") await ev(`[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === ${JSON.stringify(d)})?.click()`);
  await sleep(500);
  check((await ev(`location.pathname`)) === "/", "틀리면 안 열린다");
  const q2 = /(\d+) \+ (\d+)/.exec((await ev(`document.querySelector('[role="dialog"]')?.innerText`)) ?? "");
  for (const d of String(Number(q2[1]) + Number(q2[2]))) await ev(`[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === ${JSON.stringify(d)})?.click()`);
  await sleep(3000);
  check((await ev(`location.pathname`)) === "/parent", "맞히면 부모 페이지");
}

console.log("오류", errors.length ? errors.slice(0, 5).join("\n") : "없음");
console.log(fails ? `실패 ${fails}개` : "모두 통과");
await reset();
await send("Page.navigate", { url: "about:blank" });
await sleep(300);
await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
ws.close();
process.exit(0);
