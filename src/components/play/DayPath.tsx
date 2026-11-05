"use client";

import { useEffect, useMemo, useRef } from "react";
import { StickerIcon } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { FriendBadge, LandBackdrop, RoadLine, SpotGround, useBox, Walker } from "@/components/map/World";
import { HandHint } from "@/components/play/HandHint";
import type { PathCell } from "@/components/play/kindIcon";
import { UiIcon } from "@/components/ui";
import type { Land } from "@/curriculum/lands";
import { layoutRoad } from "@/lib/road";
import { sfx } from "@/lib/sfx";

/*
 * 오늘의 길 — 미션 하나의 놀이가 나라 안 길 위 칸이다(숫자놀이·한글나라와 같은 구성, 2026-11-05 사용자). 반짝이는 칸을 눌러 하나씩 깬다.
 * 앞 칸은 무슨 놀이인지 몰라야 재미있다 — 물음표(숫자놀이 사용자: ??처럼 모르다가 깨는 맛). 깬 칸만 놀이 그림과 이름이 나온다(✓).
 * 블루이와 하온이가 지금 칸 앞에 서 있다가, 칸을 깨면 다음 칸까지 걸어간다. 화면이 따라간다.
 * 가로 화면은 왼쪽→오른쪽 물결, 세로 화면은 위→아래 지그재그. 끝 칸에서 그 나라 친구가 기다린다(도장 날은 도장).
 * MiniPath 는 같은 길을 작게 — 첫 화면 카드에.
 */

type Spot = "done" | "now" | "locked";

const spotOf = (i: number, done: number): Spot => (i < done ? "done" : i === done ? "now" : "locked");

/** 다음 칸까지 걷는 시간 */
export const WALK_MS = 1600;

/** 끝 칸 — 그 나라 친구가 기다린다, 도장 날은 별 도장 */
function Goal({ stamp, land, size }: { stamp: boolean; land: Land; size: number }) {
  if (!stamp) return <FriendBadge land={land} size={`${size}px`} className="shadow-[0_6px_0_var(--butter-deep)]" />;
  return (
    <span className="grid place-items-center rounded-full bg-butter shadow-[0_6px_0_var(--butter-deep)] ring-4 ring-white" style={{ width: size, height: size }}>
      <span className="font-extrabold text-brand-deep" style={{ fontSize: size * 0.5 }}>
        ★
      </span>
    </span>
  );
}

export function DayPath({
  land,
  cells,
  done,
  stamp,
  portrait,
  locked,
  rideFrom,
  onPick,
  onGoal,
}: {
  land: Land;
  cells: readonly PathCell[];
  done: number;
  stamp: boolean;
  portrait: boolean;
  /** 오늘은 더 못 한다(하루 한 번을 켠 날) — 칸은 보이되 반짝이지 않는다 */
  locked: boolean;
  /** 방금 이 칸을 깨고 왔다 — 여기서 지금 칸까지 걸어간다 */
  rideFrom?: number;
  onPick: (i: number) => void;
  /** 다 깨고 끝 칸에 닿았을 때 끝 칸을 누르면 */
  onGoal?: () => void;
}) {
  const { ref, box } = useBox();
  const arrived = done >= cells.length;
  const n = cells.length + 1;
  const layout = useMemo(() => (box.w > 0 ? layoutRoad(n, box, portrait) : null), [n, box, portrait]);
  const park = (layout?.spot ?? 0) * 0.62;

  // 걸어가는 동안 반짝 소리 한 번
  const riding = rideFrom !== undefined;
  const heard = useRef(false);
  useEffect(() => {
    if (!riding || heard.current) return;
    heard.current = true;
    sfx.sparkle();
  }, [riding]);

  return (
    <div ref={ref} className="absolute inset-0">
      <LandBackdrop id={land.id} />
      <div data-world-scroller className={`h-full w-full ${portrait ? "overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden"}`} style={{ scrollbarWidth: "none", overscrollBehavior: "contain" }}>
        {layout && (
          <div className="relative overflow-hidden" style={{ width: layout.world.w, height: layout.world.h }}>
            <RoadLine d={layout.track.d} world={layout.world} width={Math.max(18, layout.spot * 0.26)} />
            {layout.spots.map((p, i) => (
              <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                <SpotGround size={layout.spot * 0.86} dim={i < n - 1 && spotOf(i, done) === "locked"} />
              </span>
            ))}
            <Walker
              track={layout.track}
              at={layout.stops[Math.min(done, n - 1)] - park}
              from={rideFrom !== undefined ? layout.stops[rideFrom] - park : undefined}
              ms={WALK_MS}
              height={layout.walker}
              view={box}
              portrait={portrait}
            />
            {/* 칸 — 안 깬 칸은 물음표, 깨면 놀이 그림 */}
            {cells.map((cell, i) => {
              const s = locked && i >= done ? "locked" : spotOf(i, done);
              const p = layout.spots[i];
              const size = layout.spot * 0.56;
              return (
                <div key={i} className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: p.x, top: p.y - size * 0.96 }}>
                  <button
                    type="button"
                    data-path-now={s === "now" ? "" : undefined}
                    aria-label={s === "done" ? `${i + 1}번째 칸 ${cell.label}` : `${i + 1}번째 칸`}
                    onClick={() => onPick(i)}
                    className={`relative grid place-items-center rounded-full transition-transform active:scale-95 ${
                      s === "now"
                        ? "animate-breathe bg-white shadow-[0_7px_0_var(--brand-deep)] ring-[5px] ring-brand"
                        : s === "done"
                          ? `bg-mint shadow-[0_5px_0_var(--mint-deep)] ring-[3px] ring-white ${riding && i === rideFrom ? "animate-pop-in" : ""}`
                          : "bg-white/90 shadow-[0_5px_0_rgb(62_58_82/0.22)] ring-[3px] ring-white"
                    }`}
                    style={{ width: size, height: size, fontSize: size * 0.56 }}
                  >
                    {s === "done" ? (
                      <span className="opacity-90">
                        <Icon id={cell.iconId} emoji={cell.emoji} />
                      </span>
                    ) : (
                      <span className={`font-letter font-black leading-none ${s === "now" ? "text-brand" : "text-ink-soft/60"}`} style={{ fontSize: size * 0.68 }}>
                        ?
                      </span>
                    )}
                    {s === "done" && (
                      <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-mint-deep text-xs text-white ring-2 ring-white">
                        <UiIcon name="check" />
                      </span>
                    )}
                    <span className="absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-extrabold text-ink shadow">{i + 1}</span>
                  </button>
                  {s === "done" && <span className="mt-1 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-xs font-extrabold text-ink">{cell.label}</span>}
                </div>
              );
            })}
            {/* 끝 칸 */}
            <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: layout.spots[n - 1].x, top: layout.spots[n - 1].y - layout.spot * 0.56 }}>
              <button type="button" data-path-goal disabled={!arrived} onClick={onGoal} aria-label={stamp ? "도장 받기" : "미션 끝"} className={`rounded-full ${arrived ? "animate-breathe ring-[5px] ring-brand" : ""}`}>
                <Goal stamp={stamp} land={land} size={Math.round(layout.spot * 0.56)} />
              </button>
              <span className={`mt-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-extrabold ${arrived ? "bg-brand text-white" : "bg-white/90"}`}>{stamp ? "도장 받기" : "미션 끝"}</span>
            </div>
          </div>
        )}
      </div>
      {!locked && done < cells.length && <HandHint from="[data-path-now]" to="[data-path-now]" delay={riding ? WALK_MS + 2000 : 2400} />}
      {!locked && arrived && <HandHint from="[data-path-goal]" to="[data-path-goal]" delay={riding ? WALK_MS + 2000 : 2400} />}
    </div>
  );
}

/** 첫 화면 카드의 작은 길 — 깬 칸만 놀이 그림, 나머지는 물음표. 칸이 많아도 한 줄에 들어가게 칸이 줄어든다 */
export function MiniPath({ cells, done, stamp }: { cells: readonly PathCell[]; done: number; stamp: boolean }) {
  const dot = "relative grid aspect-square min-w-0 max-w-12 flex-[1_1_0] place-items-center rounded-full";
  return (
    <span className="flex w-full items-center justify-between gap-0.5">
      {cells.map((cell, i) => {
        const s = spotOf(i, done);
        return (
          <span key={i} className="contents">
            <span className={`${dot} text-[clamp(0.8rem,2.6vw,1.7rem)] short:text-[clamp(0.7rem,2.2vw,1.4rem)] ${s === "now" ? "animate-breathe bg-white ring-[3px] ring-brand" : s === "done" ? "bg-mint" : "bg-paper-deep/80"}`}>
              {s === "done" ? <Icon id={cell.iconId} emoji={cell.emoji} /> : <span className={`font-letter font-black leading-none ${s === "now" ? "text-brand" : "text-ink-soft/50"}`}>?</span>}
              {s === "done" && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-mint-deep text-[0.5rem] text-white">
                  <UiIcon name="check" />
                </span>
              )}
            </span>
            <span aria-hidden className="h-1 w-[0.35rem] shrink rounded-full bg-paper-deep" />
          </span>
        );
      })}
      <span className={`${dot} bg-butter`}>{stamp ? <span className="text-[clamp(0.8rem,2.6vw,1.5rem)] font-extrabold text-brand-deep">★</span> : <StickerIcon size={22} />}</span>
    </span>
  );
}
