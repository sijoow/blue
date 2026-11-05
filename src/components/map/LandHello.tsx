"use client";

import { FriendBadge } from "@/components/map/World";
import { ReadAlong } from "@/components/ReadAlong";
import type { Land } from "@/curriculum/lands";

/** 새 나라에 처음 왔을 때 — 그 나라 친구가 인사한다(읽는 곳까지 글자 색이 바뀐다). 낮은 화면(폰 가로)은 옆으로 */
export function LandHello({ land, onGo }: { land: Land; onGo: () => void }) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/25 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md animate-pop-in flex-col items-center gap-4 rounded-[2.4rem] bg-white px-7 pb-7 pt-6 text-center shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] short:max-w-2xl short:flex-row short:gap-6 short:py-4 short:text-left">
        <FriendBadge land={land} size="min(30vh, 11rem)" className="animate-float" />
        <div className="flex min-w-0 flex-col items-center gap-3 short:items-start short:gap-2">
          <p className="text-3xl font-extrabold short:text-2xl">{land.name}</p>
          <p className="break-keep text-xl font-bold leading-snug text-ink short:text-lg">
            <ReadAlong text={land.hello} />
          </p>
          <button type="button" className="cta rounded-full px-12 py-3 text-3xl font-extrabold short:py-2 short:text-2xl" onClick={onGo}>
            좋아!
          </button>
        </div>
      </div>
    </div>
  );
}
