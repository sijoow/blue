"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Family } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { FriendBadge, LandBackdrop } from "@/components/map/World";
import { MathGate } from "@/components/parent/MathGate";
import { MiniPath } from "@/components/play/DayPath";
import { cellOf } from "@/components/play/kindIcon";
import { ReadAlong } from "@/components/ReadAlong";
import { LevelStars, PlayIcon, SpeechBubble, Splash, StickerCount, toneStyle, UiIcon, usePortrait } from "@/components/ui";
import { CHILD } from "@/curriculum/child";
import { chapterOf, DAYS_PER_CHAPTER } from "@/curriculum/course";
import { gameOpens, GAMES } from "@/curriculum/games";
import { landOf, LANDS } from "@/curriculum/lands";
import { LINES } from "@/curriculum/lines";
import { MENUS, type MenuId } from "@/curriculum/menus";
import { imageOf } from "@/lib/assets";
import { useIsMaster } from "@/lib/auth";
import { isOpen } from "@/lib/play";
import { canPlayToday, currentSession, runOf } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { useSaved, useToday } from "@/lib/store";
import { say } from "@/lib/voice";

/*
 * 첫 화면 — 숫자놀이·한글나라와 같은 틀(2026-11-05 사용자: 두 앱 구성을 따른다). 할 일은 하나, 오늘의 길을 한 칸씩 간다.
 *   위    하온이 이름표 · 스티커 · 지도 · 부모 문(꾹 + 덧셈)
 *   바탕   지금 장의 나라(curriculum/lands)
 *   가운데 안내 친구(누르면 이름을 불러 준다) + 「오늘의 영어」 카드 하나 — 나라와 그 친구, 오늘의 길 미리 보기, 시작 버튼
 *   아래  유리 메뉴 바 — 놀이터 · 영어 놀이 · 노래 · 그림책 · 단어장 · 글자 쓰기(curriculum/menus, 업체 메뉴 구성)
 * 가로 화면은 친구(왼쪽) · 카드(오른쪽), 세로 화면은 위아래. 지난 미션 다시 하기는 지도에서.
 */

/** 부모 페이지 문 — 아이가 실수로 열지 않게 1.5초 꾹 누른 뒤 덧셈을 풀어야 열린다(숫자놀이·한글나라와 같다) */
function ParentGate() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [asking, setAsking] = useState(false);
  const timer = useRef<number | null>(null);
  const end = () => {
    setHolding(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <>
      <button
        type="button"
        aria-label="부모 페이지 (꾹 누르기)"
        onPointerDown={() => {
          setHolding(true);
          timer.current = window.setTimeout(() => {
            setHolding(false);
            setAsking(true);
          }, 1500);
        }}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        onContextMenu={(e) => e.preventDefault()}
        className="glass relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-soft"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" strokeLinecap="round" />
        </svg>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="139"
            strokeDashoffset={holding ? 0 : 139}
            style={{ transition: holding ? "stroke-dashoffset 1.5s linear" : "none" }}
          />
        </svg>
      </button>
      {asking && <MathGate note="부모님만 들어가는 곳이에요" onPass={() => router.push("/parent")} onCancel={() => setAsking(false)} />}
    </>
  );
}

/** 하온이 이름표 — 얼굴 동그라미(한글나라와 같은 그림 "child:face") + 지금 어디쯤인지 */
function NameTag({ sub, master }: { sub: string; master: boolean }) {
  const face = imageOf("child:face");
  return (
    <div className="glass flex min-w-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 portrait:pr-4">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xl font-extrabold text-white ring-2 ring-brand short:h-9 short:w-9 short:text-lg">
        {face ? <Image src={face} alt={CHILD.nick} fill sizes="48px" className="object-cover" /> : [...CHILD.full][1]}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="flex items-center gap-1 text-xl font-extrabold short:text-lg">
          {CHILD.nick}
          {master && <Icon emoji="👑" />}
        </span>
        <span className="block truncate text-sm font-semibold text-ink-soft">{sub}</span>
      </span>
    </div>
  );
}

export default function HomeScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const router = useRouter();
  // 안내 친구를 눌렀을 때 한 말 — 말풍선에 그대로 보이고, 읽는 곳까지 색이 바뀐다. 누르기 전에는 평소 말
  const [line, setLine] = useState<string | null>(null);
  const helloAt = useRef(0);
  const portrait = usePortrait();

  if (!saved) return <Splash />;

  const { progress, settings } = saved;
  const session = currentSession(progress);
  const chapter = session ? chapterOf(session.plan.chapter) : undefined;
  // 과정을 다 마쳤으면 마지막 나라에 머문다
  const land = chapter ? landOf(chapter.no) : LANDS[LANDS.length - 1];
  const can = master || canPlayToday(progress, settings, today);
  const run = runOf(progress, session);
  const bubble = line ?? (!session ? "모든 미션을 다 했어! 놀이터에서 또 놀자!" : can ? "오늘의 영어를 시작해 볼까?" : "오늘 영어는 끝! 내일 또 만나!");

  /** 안내 친구를 누르면 하온이 이름을 부르며 말한다 — 인사말을 차례로(한글나라와 같이 이름은 누를 때만) */
  const greet = () => {
    sfx.wake();
    sfx.pop();
    const text = !session || !can ? LINES.doneToday : LINES.hello[helloAt.current++ % LINES.hello.length];
    setLine(text);
    void say(text);
  };

  const goto = (href: string) => {
    sfx.wake();
    sfx.pop();
    router.push(href);
  };

  const opened: Record<MenuId, boolean> = {
    free: GAMES.some((g) => isOpen(saved, gameOpens(g), master)),
    games: true,
    songs: true,
    books: true,
    letters: true,
    write: true,
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <LandBackdrop id={land.id} />
      {/* 위쪽 하늘을 살짝 밝게 — 이름표·숫자가 바탕에 묻히지 않게 */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/45 to-transparent" />

      <header className="relative z-10 flex items-center justify-between gap-2 px-5 pt-4 short:px-4 short:pt-2 portrait:px-3 portrait:pt-safe">
        <NameTag sub={chapter ? `${land.name} · ${chapter.title}` : "모든 나라를 다녀왔어요"} master={master} />
        <div className="flex items-center gap-2">
          <StickerCount n={progress.stickers} />
          <button type="button" aria-label="지도" onClick={() => goto("/map")} className="glass grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl text-brand-deep transition-transform active:scale-90">
            <UiIcon name="map" />
          </button>
          <ParentGate />
        </div>
      </header>

      <section className="relative z-10 flex min-h-0 flex-1 items-center-safe justify-center gap-[5vw] overflow-y-auto px-8 short:gap-6 short:px-5 portrait:flex-col portrait:justify-evenly portrait:gap-0 portrait:px-4">
        {/* 안내 친구 + 말풍선 */}
        <div className="flex shrink-0 flex-col items-center">
          <SpeechBubble tail="down" className="mb-3 max-w-[min(86vw,24rem)] short:mb-1 short:px-4 short:py-2 short:text-xl portrait:text-2xl">
            <ReadAlong text={bubble} />
          </SpeechBubble>
          <button type="button" onClick={greet} aria-label="안내 친구">
            <Family size={portrait ? 190 : 250} className="animate-float" />
          </button>
        </div>

        {/* 오늘의 영어 카드 */}
        <div className="glass w-full max-w-[31rem] rounded-[2.2rem] p-6 short:max-w-[24rem] short:rounded-[1.6rem] short:p-3.5 portrait:p-5">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${can && session ? "bg-brand-soft text-brand-deep" : "bg-mint/70 text-ink"}`}>{!session ? "다 했어요" : can ? "오늘의 영어" : "오늘 영어 끝!"}</span>
            {session?.practice && <span className="rounded-full bg-lilac px-3 py-1 text-sm font-extrabold">{session.plan.title}</span>}
            {session && !session.practice && (
              <span className="ml-auto flex items-center gap-1 text-sm font-bold text-ink-soft">
                {!session.plan.stamp && <LevelStars n={session.plan.stage} />}
                미션 {session.plan.day}/{DAYS_PER_CHAPTER}
              </span>
            )}
          </div>

          {chapter && session ? (
            <>
              <div className="mt-3 flex items-center gap-3 short:mt-1.5 short:gap-2">
                <FriendBadge land={land} size="min(11vh, 4.6rem)" className="shadow-md" />
                <div className="min-w-0">
                  <h2 className="text-[2rem] font-extrabold leading-tight break-keep short:text-2xl portrait:text-[1.7rem]">{land.name}</h2>
                  <p className="text-lg font-bold leading-snug text-ink-soft short:text-base">
                    {chapter.title} · {land.friend}
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-base font-semibold leading-snug text-ink-soft break-keep short:mt-0.5 short:text-sm">{session.practice || session.plan.stamp ? session.plan.title : chapter.goal}</p>
              <div className="mt-4 short:mt-2">
                <MiniPath cells={session.plan.activities.map(cellOf)} done={run.done} stamp={session.plan.stamp} />
              </div>
            </>
          ) : (
            <h2 className="mt-3 text-[1.8rem] font-extrabold leading-tight">모든 나라를 다녀왔어요!</h2>
          )}

          {session &&
            (can ? (
              <button type="button" onClick={() => goto("/play")} className="cta mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-[2rem] font-extrabold short:mt-3 short:py-2.5 short:text-2xl">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-2xl text-brand short:h-9 short:w-9 short:text-xl">
                  <PlayIcon />
                </span>
                {run.done > 0 ? "이어서 하기" : "시작하기"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goto("/free")}
                className="squish mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-2xl font-extrabold short:mt-3 short:py-2.5"
                style={toneStyle("sky")}
              >
                <Icon emoji="🌙" /> 내일 또 만나요 · 놀이터 가기
              </button>
            ))}
        </div>
      </section>

      {/* 메뉴 바 — 아이가 알아듣는 이름(curriculum/menus) */}
      <nav
        className="glass relative z-10 mx-auto mb-4 flex shrink-0 items-stretch gap-1 rounded-[2rem] p-2 short:mb-2 short:p-1.5 portrait:mb-3 portrait:w-[calc(100%-1.25rem)]"
        aria-label="메뉴"
      >
        {MENUS.map((m) => {
          const open = opened[m.id];
          return (
            <button
              key={m.id}
              type="button"
              className="flex w-[7.4rem] flex-col items-center gap-1 rounded-[1.5rem] px-1 pb-1.5 pt-2 transition-transform hover:bg-white/80 active:scale-95 short:w-auto short:flex-row short:gap-2 short:px-3 short:py-1 portrait:w-auto portrait:flex-1 portrait:px-0"
              onClick={() => {
                sfx.wake();
                if (!open) {
                  sfx.boop();
                  void say(LINES.locked);
                  return;
                }
                goto(m.href);
              }}
            >
              <span
                className="relative grid h-14 w-14 place-items-center rounded-[1.2rem] text-[2.6rem] short:h-10 short:w-10 short:rounded-[0.9rem] short:text-[1.9rem] portrait:h-12 portrait:w-12 portrait:text-[2.2rem]"
                style={{ background: `var(--${m.tone})` }}
              >
                <Icon id={`menu:${m.id}`} emoji={m.icon} className={open ? "" : "opacity-40 grayscale"} />
                {!open && (
                  <span className="absolute -right-1.5 -top-1.5 text-lg">
                    <Icon emoji="🔒" />
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-[0.95rem] font-extrabold text-ink portrait:text-[0.85rem]">{m.title}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
