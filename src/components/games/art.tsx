"use client";

import Image from "next/image";
import { Family, Glyph, Guide, WordArt } from "@/components/Art";
import { CHILD } from "@/curriculum/child";
import type { FamilyName, OriginalId } from "@/curriculum/originals";
import { imageOf } from "@/lib/assets";
import { Bush, Chip, Die, Fish, Mailbox } from "./props";

/** 영어 놀이 카드 그림 — 힉스필드 "scene:games:<놀이>"(블루이 가족이 그 놀이를 하는 장면), 없으면 그 놀이의 물건 */
export function OriginalArt({ id }: { id: OriginalId }) {
  const src = imageOf(`scene:games:${id}`);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- 카드 칸을 꽉 채우는 장면 그림(크기를 미리 모른다)
    return <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />;
  }
  const s = "min(14vh, calc(10*var(--vw)))";
  switch (id) {
    case "bingo":
      return (
        <span className="relative grid place-items-center">
          <WordArt id="apple" size={s} />
          <span className="absolute inset-0 grid place-items-center">
            <Chip size={s} />
          </span>
        </span>
      );
    case "mail":
      return <Mailbox letter="b" up height={s} />;
    case "name":
      return <Glyph ch="HAON" className="text-brand" style={{ fontSize: `calc(${s} * 0.5)` }} />;
    case "hide":
      return <Bush width={`calc(${s} * 1.3)`} />;
    case "fish":
      return <Fish ch="F" color={0} width={`calc(${s} * 1.3)`} />;
    case "board":
      return <Die face={5} size={s} />;
  }
}

/** 하온이 얼굴 동그라미 — 한글나라와 같은 그림("child:face"), 없으면 이름 글자 */
export function ChildFace({ size, className = "" }: { size: string; className?: string }) {
  const face = imageOf("child:face");
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand font-extrabold text-white ring-4 ring-white ${className}`} style={{ width: size, height: size, fontSize: `calc(${size} * 0.45)` }}>
      {face ? <Image src={face} alt={CHILD.nick} fill sizes="160px" className="object-cover" /> : [...CHILD.full][1]}
    </span>
  );
}

/** 블루이 말 — 안내 친구 그림을 동그라미 안에 */
export function BlueyToken({ size, className = "" }: { size: string; className?: string }) {
  const src = imageOf("guide");
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-sky ring-4 ring-white ${className}`} style={{ width: size, height: size }}>
      {src ? <Image src={src} alt="블루이" fill sizes="160px" className="object-contain p-[6%]" /> : <Guide size={48} />}
    </span>
  );
}

/** 이름 주인 그림 — 하온이 얼굴 · 블루이 · 빙고·엄마·아빠("name:<id>", 없으면 가족 그림) */
export function NameArt({ name, size }: { name: FamilyName; size: string }) {
  if (name.id === "haon") return <ChildFace size={size} />;
  const src = name.id === "bluey" ? imageOf("guide") : imageOf(`name:${name.id}`);
  if (!src) return <Family size={160} />;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <Image src={src} alt={name.en} fill sizes="30vw" draggable={false} className="pointer-events-none object-contain" />
    </span>
  );
}
