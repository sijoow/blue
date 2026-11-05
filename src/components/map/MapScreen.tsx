"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { FriendBadge, RoadLine, SpotGround, useBox, Walker } from "@/components/map/World";
import { ModeShell } from "@/components/ModeShell";
import { LevelStars, PlayIcon, Splash, UiIcon, usePortrait } from "@/components/ui";
import { CHAPTERS, DAYS_PER_CHAPTER, DAYS_PER_STAGE, isStampDay, LEVEL_NAMES, medalOf, STAGES, type Medal } from "@/curriculum/course";
import { landOf } from "@/curriculum/lands";
import { LINES } from "@/curriculum/lines";
import type { Chapter } from "@/curriculum/types";
import { useIsMaster } from "@/lib/auth";
import { canPlayToday, canReview, type Progress } from "@/lib/progress";
import { layoutRoad } from "@/lib/road";
import { sfx } from "@/lib/sfx";
import { useSaved, useToday } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

/*
 * 지도 — 장 하나가 나라 하나(curriculum/lands), 길 위에 친구 얼굴로 이어진다. 누르면 그 나라의 미션 13개(★ 넷 · ★★ 넷 · ★★★ 넷 · 도장 퀴즈)가 나온다(숫자놀이·한글나라와 같은 구성, 2026-11-05 사용자).
 * 다녀온 나라는 ✓ 와 도장, 지금 나라 앞에는 블루이와 하온이, 앞 나라는 흑백으로 잠김. 처음엔 지금 나라를 가운데로 보여 준다. 바탕은 동화나라 — 친구들이 다 모이는 곳.
 * 끝낸 미션을 누르면 다시 한다(진도는 그대로). 마스터는 안 한 미션도 눌러서 미리 본다.
 */

type Spot = "done" | "here" | "locked";

const MEDAL_EMOJI: Record<Medal, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function spotOf(p: Progress, c: Chapter): Spot {
  return c.no < p.chapter ? "done" : c.no === p.chapter ? "here" : "locked";
}

/** 그 장의 d번째 미션 — 끝낸 미션·지금·앞 */
function daySpot(p: Progress, c: Chapter, d: number): Spot {
  if (canReview(p, c.no, d)) return "done";
  return c.no === p.chapter && (p.practice ? isStampDay(d) : d === p.day) ? "here" : "locked";
}

/** 나라 칸 하나 — 받침 위에 친구 얼굴, 아래에 나라 이름과 글자 */
function Stop({ c, spot, stamp, picked, size, onPick }: { c: Chapter; spot: Spot; stamp: boolean; picked: boolean; size: number; onPick: () => void }) {
  const land = landOf(c.no);
  return (
    <button type="button" onClick={onPick} aria-label={`${c.no}장 ${land.name} ${c.title}`} className="relative flex flex-col items-center active:scale-95" style={{ width: size }}>
      {spot === "here" && <span aria-hidden className="absolute animate-breathe rounded-full bg-butter/70 blur-md" style={{ inset: `${size * 0.02}px`, height: size * 0.7 }} />}
      <span className={`relative z-[1] transition-transform ${picked ? "scale-110" : ""} ${spot === "here" ? "animate-float" : ""}`}>
        <FriendBadge land={land} size={`${size * 0.58}px`} dim={spot === "locked"} className={spot === "here" ? "ring-brand shadow-[0_8px_0_var(--brand-deep)]" : spot === "done" ? "shadow-[0_7px_0_var(--mint-deep)]" : "shadow-[0_6px_0_rgb(62_58_82/0.2)]"} />
        {spot === "done" && (
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-mint-deep text-xs text-white ring-2 ring-white">
            <UiIcon name="check" />
          </span>
        )}
        {stamp && <span className="absolute -bottom-2 -right-3 rounded-full bg-white px-1.5 text-xs font-extrabold text-brand-deep shadow">도장</span>}
      </span>
      <span className="-mt-1">
        <SpotGround size={size * 0.8} dim={spot === "locked"} />
      </span>
      <span className={`-mt-3 flex flex-col items-center rounded-[1rem] px-2.5 py-0.5 text-center font-extrabold leading-tight shadow-sm ${spot === "locked" ? "bg-white/75 text-ink-soft" : "bg-white/95 text-ink"}`} style={{ fontSize: Math.max(13, size * 0.1) }}>
        <span className="whitespace-nowrap">{land.name}</span>
        <span className="whitespace-nowrap font-bold text-ink-soft" style={{ fontSize: "0.8em" }}>
          {c.title}
        </span>
      </span>
    </button>
  );
}

/** 고른 장의 미션 칸 — 단계마다 한 줄, 마지막 줄 끝에 도장 퀴즈(★). 끝낸 미션은 눌러서 다시 한다 */
function Missions({ p, c, master, canPlay, onDay, onStart, onClose }: { p: Progress; c: Chapter; master: boolean; canPlay: boolean; onDay: (d: number, s: Spot) => void; onStart: () => void; onClose: () => void }) {
  const best = p.best[String(c.no)];
  const days = (stage: number) => {
    const list = Array.from({ length: DAYS_PER_STAGE }, (_, i) => (stage - 1) * DAYS_PER_STAGE + i + 1);
    return stage === STAGES ? [...list, DAYS_PER_CHAPTER] : list;
  };
  return (
    <div className="glass absolute z-20 flex animate-pop-in flex-col items-center gap-2 rounded-[1.8rem] px-4 pb-4 pt-3 short:gap-1 short:pb-2 short:pt-1.5 portrait:inset-x-3 portrait:bottom-3 landscape:bottom-3 landscape:right-3 landscape:w-[21rem]">
      <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg text-ink-soft active:scale-90">
        <UiIcon name="close" />
      </button>
      <p className="pr-8 text-center text-lg font-extrabold short:text-base">
        {landOf(c.no).name} · {c.title} <span className="text-base text-ink-soft short:text-sm">({c.code})</span>
      </p>
      <div className="flex w-full flex-col gap-2 short:gap-1">
        {[1, 2, 3].map((stage) => (
          <div key={stage} className="flex items-center gap-1.5">
            <span className="w-[3.2rem] shrink-0 text-right text-base leading-none">
              <LevelStars n={stage} />
            </span>
            {days(stage).map((d) => {
              const s = daySpot(p, c, d);
              const stamp = isStampDay(d);
              const medal = stamp && best !== undefined ? medalOf(best) : null;
              return (
                <button
                  key={d}
                  type="button"
                  aria-label={stamp ? "도장 퀴즈" : `미션 ${d}`}
                  onClick={() => onDay(d, s)}
                  className={`grid h-[2.6rem] w-[2.6rem] place-items-center rounded-full text-base font-extrabold active:scale-90 short:h-8 short:w-8 ${s === "here" ? "bg-brand text-white ring-4 ring-brand-soft" : s === "done" ? "bg-mint" : master ? "bg-white/80 text-ink-soft" : "bg-paper-deep/70 text-ink-soft"}`}
                >
                  {medal ? <Icon id={`medal:${medal}`} emoji={MEDAL_EMOJI[medal]} /> : s === "done" ? <UiIcon name="check" /> : stamp ? "★" : d}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {spotOf(p, c) === "here" && <p className="text-base font-extrabold text-ink-soft short:text-sm">{p.practice ? "조금 더 연습하고 도장에 다시 도전해요" : `미션 ${p.day} / ${DAYS_PER_CHAPTER}`}</p>}
      {spotOf(p, c) === "here" &&
        (canPlay ? (
          <button type="button" onClick={onStart} className="cta mt-1 flex items-center gap-2 rounded-full px-10 py-2.5 text-2xl font-extrabold short:mt-0 short:py-1.5 short:text-xl">
            <PlayIcon /> 출발
          </button>
        ) : (
          <p className="text-base font-bold text-ink-soft">오늘 놀이는 끝 — 내일 또 만나요</p>
        ))}
      {spotOf(p, c) === "locked" && !master && <p className="text-base font-bold text-ink-soft">앞 나라를 다 다녀오면 열려요</p>}
    </div>
  );
}

export default function MapScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const portrait = usePortrait();
  const router = useRouter();
  const { ref, box } = useBox();
  const [picked, setPicked] = useState<number | null>(null);
  const layout = useMemo(() => (box.w > 0 ? layoutRoad(CHAPTERS.length, box, portrait, true) : null), [box, portrait]);

  useEffect(() => {
    void say(LINES.map);
    return () => stopVoice();
  }, []);

  if (!saved) return <Splash />;
  const p = saved.progress;
  const chosen = CHAPTERS.find((c) => c.no === picked);
  const canPlay = master || canPlayToday(p, saved.settings, today);
  // 다 마쳤으면 마지막 장 뒤에 선다
  const hereAt = Math.min(p.chapter, CHAPTERS.length) - 1;

  const go = (href: string) => {
    sfx.wake();
    sfx.pop();
    stopVoice();
    router.push(href);
  };

  const onDay = (c: Chapter, d: number, s: Spot) => {
    if (s === "done") go(`/play?review=c${c.no}d${d}`);
    else if (s === "here" && canPlay) go("/play");
    else if (master) go(`/play?preview=c${c.no}d${d}`);
    else {
      sfx.wake();
      sfx.boop();
      void say(LINES.locked);
    }
  };

  return (
    <ModeShell title="지도" icon="🗺️" land="storybook" bleed>
      <div ref={ref} className="absolute inset-0">
        <div data-world-scroller className={`h-full w-full ${portrait ? "overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden"}`} style={{ scrollbarWidth: "none", overscrollBehavior: "contain" }}>
          {layout && (
            <div className="relative overflow-hidden" style={{ width: layout.world.w, height: layout.world.h }}>
              <RoadLine d={layout.track.d} world={layout.world} width={Math.max(18, layout.spot * 0.16)} />
              {/* 레벨 표지판 — 그 레벨 첫 칸 위에. 지금 나라에는 블루이와 하온이가 서 있어서 안 둔다 */}
              {CHAPTERS.map((c, i) =>
                (i === 0 || CHAPTERS[i - 1].level !== c.level) && spotOf(p, c) !== "here" ? (
                  <span key={c.level} className="absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white shadow-[0_4px_0_var(--brand-deep)]" style={{ left: layout.spots[i].x, top: layout.spots[i].y - layout.spot * 0.5 }}>
                    레벨 {c.level} · {LEVEL_NAMES[c.level]}
                  </span>
                ) : null,
              )}
              {CHAPTERS.map((c, i) => (
                <div key={c.no} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: layout.spots[i].x, top: layout.spots[i].y }}>
                  <Stop
                    c={c}
                    spot={spotOf(p, c)}
                    stamp={p.stamps.includes(c.no)}
                    picked={picked === c.no}
                    size={layout.spot}
                    onPick={() => {
                      sfx.wake();
                      sfx.pop();
                      setPicked(c.no);
                    }}
                  />
                </div>
              ))}
              <Walker track={layout.track} at={layout.stops[hereAt] - layout.spot * 0.5} height={layout.walker * 0.72} view={box} portrait={portrait} />
            </div>
          )}
        </div>
        {chosen && <Missions p={p} c={chosen} master={master} canPlay={canPlay} onDay={(d, s) => onDay(chosen, d, s)} onStart={() => go("/play")} onClose={() => setPicked(null)} />}
      </div>
    </ModeShell>
  );
}
