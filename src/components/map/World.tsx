"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ChildFace } from "@/components/games/art";
import type { Land } from "@/curriculum/lands";
import { imageOf } from "@/lib/assets";
import { pointOn, type Box, type Track } from "@/lib/road";

/*
 * 나라 여행의 그림 — 첫 화면·오늘의 길·지도가 같이 쓴다(2026-11-05 사용자: 보이스동화의 나라별 콘셉트, curriculum/lands).
 *   LandBackdrop 나라 바탕 — 길은 그 위에서 스크롤하고 바탕은 그대로 있다. calm 은 놀이 화면(글자·카드가 잘 보이게 흐리게)
 *   FriendBadge  나라 친구 — 그림 바탕이 투명하지 않아 동그라미 안에
 *   RoadLine     길
 *   SpotGround   칸 아래 받침 — 나라마다 바탕이 달라 땅 대신 반투명 흰색
 *   Walker       블루이와 하온이 — from 을 주면 from → at 으로 걸어가고 화면이 따라간다
 */

/** 스크롤 칸의 크기를 재서 돌려준다 — 첫 그림 전엔 0 */
export function useBox(): { ref: RefObject<HTMLDivElement | null>; box: Box } {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box>({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBox((b) => (b.w === el.clientWidth && b.h === el.clientHeight ? b : { w: el.clientWidth, h: el.clientHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, box };
}

export function LandBackdrop({ id, calm = false }: { id: Land["id"]; calm?: boolean }) {
  const src = imageOf(`land:${id}`);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(#bfe8fb, #dff3c8)" }}>
      {src && <Image src={src} alt="" fill priority sizes="100vw" draggable={false} className="object-cover object-bottom" />}
      {calm && <div className="absolute inset-0 bg-white/45" />}
    </div>
  );
}

export function FriendBadge({ land, size, dim = false, className = "" }: { land: Land; size: string; dim?: boolean; className?: string }) {
  const src = imageOf(`friend:${land.id}`);
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white font-extrabold ring-4 ring-white ${dim ? "opacity-80 grayscale" : ""} ${className}`} style={{ width: size, height: size }}>
      {src ? <Image src={src} alt={land.friend} fill sizes="240px" draggable={false} className="pointer-events-none object-cover" /> : land.friend[0]}
    </span>
  );
}

export function RoadLine({ d, world, width }: { d: string; world: Box; width: number }) {
  const line = { d, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={world.w} height={world.h} viewBox={`0 0 ${world.w} ${world.h}`}>
      <path {...line} stroke="rgb(60 60 90 / 0.16)" strokeWidth={width * 1.2} transform={`translate(0 ${width * 0.14})`} />
      <path {...line} stroke="#fff6dc" strokeWidth={width} />
      <path {...line} stroke="#f5c86a" strokeWidth={width * 0.12} strokeDasharray={`${width * 0.5} ${width * 0.6}`} />
    </svg>
  );
}

export function SpotGround({ size, dim = false }: { size: number; dim?: boolean }) {
  return <span aria-hidden className={`block rounded-[50%] ${dim ? "bg-white/40" : "bg-white/70"} shadow-[0_6px_10px_rgb(60_60_90/0.18)]`} style={{ width: size, height: size * 0.46 }} />;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 곡선 위 친구 — at 이 멈출 자리(곡선 길이). from 을 주면 from 에서 at 까지 ms 동안 걷는다. 화면(data-world-scroller 칸)은 친구를 따라간다 */
export function Walker({ track, at, from, ms = 1600, height, view, portrait }: { track: Track; at: number; from?: number; ms?: number; height: number; view: Box; portrait: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [walking, setWalking] = useState(from !== undefined);
  const bluey = imageOf("guide");

  useEffect(() => {
    const draw = (len: number) => {
      const el = ref.current;
      if (!el) return;
      const p = pointOn(track, len);
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -88%)`;
      const s = el.closest<HTMLElement>("[data-world-scroller]");
      if (s) {
        if (portrait) s.scrollTop = p.y - view.h * 0.5;
        else s.scrollLeft = p.x - view.w * 0.5;
      }
    };
    if (from === undefined) {
      draw(at);
      return;
    }
    draw(from);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      draw(from + (at - from) * ease(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setWalking(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track, at, from, ms, view, portrait]);

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-[5] will-change-transform">
      <span className={`flex items-end ${walking ? "animate-walk" : ""}`}>
        {bluey && (
          <span className="relative block" style={{ width: height, height }}>
            <Image src={bluey} alt="" fill sizes="200px" draggable={false} className="object-contain" />
          </span>
        )}
        <ChildFace size={`${height * 0.62}px`} className="-ml-[12%] mb-[4%]" />
      </span>
    </div>
  );
}
