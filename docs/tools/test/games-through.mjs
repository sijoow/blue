// 영어 놀이(오리지널) 끝까지 해 보기 — /games 에서 놀이를 하나씩 열고, 아이처럼 눌러·끌어서 「놀이 끝!」까지 가는지 본다.
// node games-through.mjs <포트> [크기 412x780] [놀이들 bingo,mail,…]   · /api/progress·/api/family 는 막는다(fe 서버 기록 보호)
// 정답은 화면에서 읽는다 — 부르는 단어(MarkedWord)·그림 이름(aria-label)·우편함/이름 칸(data-drop). 낚시는 들려주기만 해서 물고기를 차례로 대 본다.
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
const center = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: "nearest" }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
async function drag(fromSel, toSel) {
  const a = await center(fromSel);
  const b = await center(toSel);
  if (!a || !b) return false;
  await mouse("mousePressed", a[0], a[1]);
  for (let k = 1; k <= 6; k++) await mouse("mouseMoved", a[0] + ((b[0] - a[0]) * k) / 6, a[1] + ((b[1] - a[1]) * k) / 6);
  await mouse("mouseReleased", b[0], b[1]);
  return true;
}
const done = () => ev(`document.body.innerText.includes("놀이 끝!")`);
const shown = () => ev(`document.querySelector("section span.font-letter")?.innerText.trim() ?? ""`);
/** 단어의 글자 — box·fox 는 끝 글자 x */
const letterOfWord = (w) => (/^(box|fox)$/.test(w) ? "X" : w[0].toUpperCase());

const PLAY = {
  async bingo() {
    for (let t = 0; t < 30 && !(await done()); t++) {
      const w = await shown();
      await ev(`document.querySelector(${JSON.stringify(`section button[aria-label="${w}"]`)})?.click()`);
      await sleep(3800);
    }
  },
  async mail() {
    for (let t = 0; t < 30 && !(await done()); t++) {
      const label = await ev(`document.querySelector("section span[role=button][aria-label]")?.getAttribute("aria-label")`);
      if (label) await drag(`section span[role=button][aria-label="${label}"]`, `[data-drop="box:${label.length === 1 ? label : letterOfWord(label)}"]`);
      await sleep(4000);
    }
  },
  async name() {
    for (let t = 0; t < 60 && !(await done()); t++) {
      const ch = await ev(`document.querySelector("section span[role=button][aria-label]")?.getAttribute("aria-label")`);
      const slot = ch && (await ev(`[...document.querySelectorAll("section [data-drop^='s:']")].find((s) => s.getAttribute("aria-label") === ${JSON.stringify(ch)} && s.className.includes("border-dashed"))?.getAttribute("data-drop")`));
      if (slot) await drag(`section span[role=button][aria-label="${ch}"]`, `[data-drop="${slot}"]`);
      await sleep(slot ? 1300 : 2500);
    }
  },
  async hide() {
    for (let t = 0; t < 20 && !(await done()); t++) {
      const w = await shown();
      await ev(`[...document.querySelectorAll('section button[aria-label="덤불"]')].find((b) => b.querySelector(${JSON.stringify(`img[alt="${w}"]`)}))?.click()`);
      await sleep(4500);
    }
  },
  async fish() {
    for (let t = 0; t < 60 && !(await done()); t++) {
      const n = await ev(`document.querySelectorAll("section [data-drop^='f:']").length`);
      const zone = await ev(`document.querySelectorAll("section [data-drop^='f:']")[${t % Math.max(1, n)}]?.getAttribute("data-drop")`);
      if (zone) await drag(`section span[aria-label="낚싯바늘"]`, `[data-drop="${zone}"]`);
      await sleep(3600);
    }
  },
  async board() {
    for (let t = 0; t < 260 && !(await done()); t++) {
      const rolled = await ev(`(() => { const b = [...document.querySelectorAll("section button")].find((x) => x.textContent.includes("주사위 굴리기") && !x.disabled); b?.click(); return !!b; })()`);
      if (rolled) {
        await sleep(3500);
        continue;
      }
      await ev(`[...document.querySelectorAll("section .grid button")].find((x) => !x.disabled)?.click()`);
      await sleep(900);
    }
  },
};

const TITLES = { bingo: "빙고랑 빙고!", mail: "우편 배달", name: "내 이름 HAON", hide: "숨바꼭질", fish: "글자 낚시", board: "주사위 말판" };

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/progress*" }, { urlPattern: "*/api/family*" }] });
const [w, h] = SIZE.split("x").map(Number);
await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: "http://localhost:6500/" });
await sleep(2500);
await ev(`fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:"fe",password:"1234"})}).then(r=>r.json()).then(j=>(localStorage.setItem("haon-english:auth",JSON.stringify(j)),true))`);

for (const [key, title] of Object.entries(TITLES).filter(([k]) => !ONLY || ONLY.split(",").includes(k))) {
  await send("Page.navigate", { url: "http://localhost:6500/games" });
  await sleep(3500);
  await ev(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(title)}))?.click()`);
  await sleep(2500);
  const t0 = Date.now();
  await PLAY[key]();
  const ok = await done();
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(new URL(`./game-${key}-${SIZE}.png`, OUT), Buffer.from(s.data, "base64"));
  console.log(`${ok ? "끝까지 됨" : "안 끝남"} ${key} (${Math.round((Date.now() - t0) / 1000)}초)`);
}
console.log("오류", errors.length ? errors.slice(0, 5).join("\n") : "없음");
await ev(`localStorage.clear(), true`);
await send("Page.navigate", { url: "about:blank" });
await sleep(300);
await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
ws.close();
process.exit(0);
