"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Family, WordArt } from "@/components/Art";
import { ChildFace } from "@/components/games/art";
import { useReadAlong } from "@/components/ReadAlong";
import { UiIcon } from "@/components/ui";
import { wordOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { storyOf, THE_END, wordsIn, type Story as StoryData, type StoryFx, type StoryPage, type Who } from "@/curriculum/stories";
import { imageOf } from "@/lib/assets";
import { sfx } from "@/lib/sfx";
import { say, stopVoice } from "@/lib/voice";
import { ActivityFrame } from "../choice";
import type { OnDone } from "../types";

type Leaf = { type: "cover" } | { type: "page"; page: StoryPage } | { type: "end" };

function leavesOf(story: StoryData): Leaf[] {
  return [{ type: "cover" }, ...story.pages.map((page): Leaf => ({ type: "page", page })), { type: "end" }];
}

/** 쪽마다 읽어 줄 말 */
function linesOf(story: StoryData, leaf: Leaf): string[] {
  if (leaf.type === "cover") return [LINES.storyIntro, story.title];
  if (leaf.type === "end") return [THE_END, LINES.bookEnd];
  return [leaf.page.text];
}

/** 움직임 → 애니메이션(app/globals.css — hop·no·run-in·peek·grow 는 이야기 그림책용) */
const FX_CLASS: Record<StoryFx, string> = {
  hop: "animate-hop",
  shake: "animate-no",
  hearts: "animate-breathe",
  run: "animate-run-in",
  peek: "animate-peek",
  big: "animate-grow",
};

/** 이야기 사람 그림 — 블루이(기분 셋) · 빙고·엄마·아빠(이름 그림) · 하온이 얼굴 · 가족 */
function WhoArt({ who, mood, size }: { who: Who; mood?: StoryPage["mood"]; size: string }) {
  if (who === "haon") return <ChildFace size={`calc(${size} * 0.78)`} />;
  if (who === "family") {
    return (
      <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <Family size={260} className="h-full w-full" />
      </span>
    );
  }
  const key = who === "bluey" ? (mood && mood !== "happy" ? `guide:${mood}` : "guide") : `name:${who}`;
  const src = imageOf(key) ?? imageOf("guide");
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {src && <Image src={src} alt={who} fill sizes="30vw" draggable={false} className="pointer-events-none object-contain" />}
    </span>
  );
}

/** 하트 셋이 떠오른다 — "Happy Bingo!" 쪽 */
function Hearts() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {[
        ["12%", "18%", "0s"],
        ["78%", "8%", "0.35s"],
        ["60%", "-6%", "0.7s"],
      ].map(([left, top, delay]) => (
        <svg key={left} viewBox="0 0 32 30" className="absolute w-[22%] animate-fly-up" style={{ left, top, animationDelay: delay }}>
          <path d="M16 28C7 21 2 16 2 9.5 2 5 5.5 2 9.5 2c2.7 0 5 1.5 6.5 3.8C17.5 3.5 19.8 2 22.5 2 26.5 2 30 5 30 9.5 30 16 25 21 16 28z" fill="#ff7a8a" stroke="#e2505f" strokeWidth="1.5" />
        </svg>
      ))}
    </span>
  );
}

/** 쪽 그림 — 사람(왼쪽) + 단어 그림들. 움직임은 mover 그림, 없으면 사람, 사람도 없으면 마지막 그림 */
function Scene({ who, mood, things = [], fx, mover, big }: { who?: Who; mood?: StoryPage["mood"]; things?: readonly string[]; fx?: StoryFx; mover?: string; big?: boolean }) {
  const count = Math.max(1, (who ? 1 : 0) + things.length);
  const pair = count === 2;
  // 크기는 쪽 카드 너비(cqw) 기준, 그림 높이 한도 --pic-h(카드에서 정함) 안에서.
  // 둘이면 가로 카드에선 나란히, 세로 카드에선 대각선(왼쪽 아래 · 오른쪽 위)으로 크게 — 세로 카드의 남는 높이를 쓴다
  const size = big ? "var(--pic-h)" : count === 1 ? "calc(var(--pic-h) * 0.9)" : pair ? "var(--pair)" : `min(var(--pic-h), ${Math.floor(90 / count)}cqw)`;
  const moving = mover ? things.indexOf(mover) : who ? -1 : things.length - 1;
  const fxOn = (i: number) => Boolean(fx) && i === moving;
  // 그릴 것 차례 — 사람(-1) 먼저, 그다음 단어 그림
  const items = [...(who ? [-1] : []), ...things.map((_, i) => i)];
  const spot = (n: number) => (!pair ? "" : n === 0 ? "portrait:absolute portrait:bottom-0 portrait:left-0" : "portrait:absolute portrait:right-0 portrait:top-0");
  return (
    <span
      className={`flex items-end justify-center gap-[4cqw] [--pair:min(var(--pic-h),44cqw)] ${pair ? "portrait:relative portrait:block portrait:h-[96cqw] portrait:w-[100cqw] portrait:[--pair:58cqw]" : ""}`}
    >
      {items.map((i, n) => (
        <span key={i === -1 ? "who" : `${things[i]}-${i}`} className={`relative block ${spot(n)} ${fxOn(i) && fx ? FX_CLASS[fx] : ""}`}>
          {i === -1 && who ? <WhoArt who={who} mood={mood} size={size} /> : <WordArt id={things[i]} size={size} />}
          {fx === "hearts" && fxOn(i) && <Hearts />}
        </span>
      ))}
    </span>
  );
}

/** 그림책 메뉴 카드 그림 — 표지 사람 + 단어 그림(사람이 없으면 둘) */
export function StoryCoverArt({ story, size }: { story: StoryData; size: string }) {
  const { who, mood, things } = story.cover;
  return (
    <span className="flex items-end justify-center gap-1">
      {who && <WhoArt who={who} mood={mood} size={size} />}
      {things.slice(0, who ? 1 : 2).map((id) => (
        <WordArt key={id} id={id} size={size} />
      ))}
    </span>
  );
}

/** 읽어 주는 문장 — 읽는 곳까지 파랗게, 단어 그림에 있는 낱말은 늘 빨갛게(누르면 단어 → 뜻) */
function Sentence({ text }: { text: string }) {
  const lit = useReadAlong(text);
  const parts = wordsIn(text);
  // 조각마다 전체 글에서 시작하는 글자 자리(노래방 읽기 칸)
  const starts = parts.reduce<number[]>((acc, _p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + [...parts[i - 1].part].length], []);
  return (
    <p className="text-center font-extrabold leading-tight text-ink" style={{ fontSize: "min(7.5vh, 9cqw)" }}>
      {parts.map((p, k) => {
        const from = starts[k];
        const chars = [...p.part].map((ch, i) => (
          <span key={i} className={`read-char ${lit !== null && from + i < lit ? (p.word ? "text-brand-deep" : "text-sky-deep") : ""}`}>
            {ch}
          </span>
        ));
        if (!p.word) return <span key={k}>{chars}</span>;
        const w = wordOf(p.word);
        return (
          <button
            key={k}
            type="button"
            className="text-brand underline decoration-brand/30 decoration-[0.08em] underline-offset-[0.12em]"
            onClick={(e) => {
              e.stopPropagation();
              sfx.wake();
              sfx.tick();
              void say([w.en, w.ko]);
            }}
          >
            {chars}
          </button>
        );
      })}
    </p>
  );
}

/**
 * 이야기 그림책 — 업체 그림책(Read Aloud)처럼 쪽마다 문장을 원어민 목소리로 읽어 주고, 읽는 곳까지 글자 색이 바뀐다(노래방 읽기).
 * 단어 그림에 있는 낱말은 빨간 글씨(업체: 배운 단어는 빨강) — 누르면 단어와 뜻. 그림을 누르면 문장을 다시 읽는다.
 * 넘기기는 단어 그림책(Book)과 같다 — ▶ 는 다 읽은 뒤 숨 쉬고, 끝 쪽은 「좋아!」. 점수 없는 놀이.
 */
export function Story({ id, onDone }: { id: string; onDone: OnDone }) {
  const story = storyOf(id);
  const [at, setAt] = useState(0);
  const [read, setRead] = useState(false);
  const leaves = story ? leavesOf(story) : [];
  const leaf = leaves[at];

  useEffect(() => {
    const s = storyOf(id);
    if (!s) return;
    let alive = true;
    void say(linesOf(s, leavesOf(s)[at])).then(() => {
      if (alive) setRead(true);
    });
    return () => {
      alive = false;
      stopVoice();
    };
  }, [at, id]);

  if (!story || !leaf) return null;

  const go = (d: number) => {
    sfx.wake();
    sfx.pop();
    setRead(false);
    setAt((a) => Math.max(0, Math.min(leaves.length - 1, a + d)));
  };
  const again = () => {
    sfx.wake();
    void say(linesOf(story, leaf));
  };

  const box = { width: "min(80vw, calc((100dvh - 12rem) * 1.25))" };

  return (
    <ActivityFrame className="gap-[2.5vh]">
      <div
        key={at}
        data-story-page={at}
        className="@container flex aspect-[5/4] animate-pop-in flex-col items-center justify-evenly gap-2 overflow-hidden rounded-[2.4rem] bg-white p-5 shadow-[0_12px_0_var(--paper-deep)] [--pic-h:46cqw] portrait:aspect-[4/5] portrait:[--pic-h:80cqw]"
        style={box}
      >
        {leaf.type === "cover" && (
          <>
            <button type="button" onClick={again} aria-label={story.title}>
              <Scene who={story.cover.who} mood={story.cover.mood} things={story.cover.things.slice(0, story.cover.who ? 1 : 2)} />
            </button>
            <p className="title-pop text-center leading-tight" style={{ fontSize: "min(8vh, 11cqw)" }}>
              {story.title}
            </p>
          </>
        )}
        {leaf.type === "page" && (
          <>
            <button type="button" onClick={again} aria-label={leaf.page.text} className="grid flex-1 place-items-center">
              <Scene who={leaf.page.who} mood={leaf.page.mood} things={leaf.page.things} fx={leaf.page.fx} mover={leaf.page.mover} big={leaf.page.fx === "big"} />
            </button>
            <Sentence text={leaf.page.text} />
          </>
        )}
        {leaf.type === "end" && (
          <>
            <Family size={220} mood="cheer" />
            <p className="title-pop text-center text-5xl short:text-3xl">{THE_END}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-5">
        <button type="button" aria-label="앞쪽" disabled={at === 0} onClick={() => go(-1)} className="glass grid h-16 w-16 place-items-center rounded-full text-3xl disabled:opacity-30">
          <UiIcon name="prev" />
        </button>
        <span className="font-display text-xl text-ink-soft">
          {at + 1} / {leaves.length}
        </span>
        {leaf.type === "end" ? (
          <button type="button" className="cta rounded-full px-10 py-4 text-3xl font-extrabold" onClick={() => onDone({ correct: 0, total: 0 })}>
            좋아!
          </button>
        ) : (
          <button type="button" aria-label="다음 쪽" onClick={() => go(1)} className={`cta grid h-16 w-16 place-items-center rounded-full text-3xl text-white ${read ? "animate-breathe" : ""}`}>
            <UiIcon name="next" />
          </button>
        )}
      </div>
    </ActivityFrame>
  );
}
