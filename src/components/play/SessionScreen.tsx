"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Family, Glyph, Guide, StickerIcon } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { LandHello } from "@/components/map/LandHello";
import { FriendBadge, LandBackdrop } from "@/components/map/World";
import { ReadAlong } from "@/components/ReadAlong";
import { ActivityHost } from "@/components/play/ActivityHost";
import { DayPath } from "@/components/play/DayPath";
import { cellOf, KIND_ICON, KIND_LABEL } from "@/components/play/kindIcon";
import type { ActivityResult } from "@/components/play/types";
import { LevelStars, Splash, SquishButton, StickerCount, UiIcon, usePortrait } from "@/components/ui";
import { letterOf } from "@/curriculum/alphabet";
import { dayPlan, DAYS_PER_CHAPTER, medalOf, practicePlan, type Medal } from "@/curriculum/course";
import { landOf, LANDS } from "@/curriculum/lands";
import { LINES } from "@/curriculum/lines";
import { currentAuth, useIsMaster } from "@/lib/auth";
import { canPlayToday, canReview, completeSession, currentSession, finishReview, localDay, meetsOf, passedOf, runOf, STICKER_PER_ACTIVITY, stepRun, stickersFor, type SessionRef, type SessionResult } from "@/lib/progress";
import { buildActivity, seededRng, type BuiltActivity } from "@/lib/rounds";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved, useToday } from "@/lib/store";
import { say, stopVoice } from "@/lib/voice";

type Moved = "day" | "practice" | "stamp" | "chapter";

interface RunState {
  done: number;
  score: SessionResult;
  startedAt: number;
}

type Phase =
  | { name: "path"; ride?: number }
  | { name: "playing"; ref: SessionRef; built: BuiltActivity; idx: number; run: RunState }
  | { name: "reward"; ref: SessionRef; earned: number; passed: boolean | null; moved: Moved | null; letters: string[]; medal: Medal | null; correct: number; total: number };

const EMPTY: RunState = { done: 0, score: { correct: 0, total: 0, activities: 0 }, startedAt: 0 };

/** 메달 — 업체 트로피 세 단계(80 미만 · 80 이상 · 100). 그림이 생기면 "icon:medal:<색>" */
const MEDAL: Record<Medal, { emoji: string; name: string; line: string }> = {
  gold: { emoji: "🥇", name: "금메달", line: LINES.medalGold },
  silver: { emoji: "🥈", name: "은메달", line: LINES.medalSilver },
  bronze: { emoji: "🥉", name: "동메달", line: LINES.medalBronze },
};

/**
 * 오늘의 영어 — 들어오면 「오늘의 길」(components/play/DayPath): 그날 놀이가 길 위 칸이고, 반짝이는 칸을 눌러 하나씩 깬다(숫자놀이·한글나라와 같은 구성, 2026-11-05 사용자).
 * 칸을 깨면 길로 돌아와 다음 칸까지 걸어간다. 몇 칸까지 깼는지는 진도에 둔다(lib/progress run) — 중간에 나가도 다시 오면 그 칸부터.
 * ?preview=c1d3 (추가 학습은 c1p 또는 c1p3) — 부모 페이지 '미리 보기'. 진도에 남기지 않는다.
 * ?review=c1d3 — 지난 미션 다시 하기(지도에서). 진도는 그대로, 스티커·지난 퀴즈 메달은 남는다.
 *   &step=2  그 칸부터    &auto=1  그 칸을 바로 연다(화면 점검용, 판 순서 고정)
 */
function readMode(): { mode: "preview" | "review"; ref: SessionRef; step: number; auto: boolean } | null {
  const q = new URLSearchParams(window.location.search);
  const review = /^c(\d+)d(\d+)$/.exec(q.get("review") ?? "");
  const m = review ?? /^c(\d+)(?:d(\d+)|p(\d*))$/.exec(q.get("preview") ?? "");
  if (!m) return null;
  const practice = !review && m[3] !== undefined;
  const plan = practice ? practicePlan(Number(m[1]), Number(m[3]) || 1) : dayPlan(Number(m[1]), Number(m[2]));
  if (!plan) return null;
  const step = Math.max(0, Math.min(plan.activities.length - 1, Number(q.get("step")) || 0));
  return { mode: review ? "review" : "preview", ref: { key: review ? "review" : "preview", practice, plan }, step, auto: q.get("auto") === "1" };
}

function dayLabel(ref: SessionRef): string {
  const { chapter, day } = ref.plan;
  const land = landOf(chapter).name;
  if (ref.practice) return `${land} · ${ref.plan.title}`;
  return `${land} · 미션 ${day}/${DAYS_PER_CHAPTER}`;
}

/** 이 미션이 그 나라 첫 미션을 막 시작하는 참인가 — 친구가 인사한다 */
function isArrival(ref: SessionRef | null, done: number): boolean {
  return !!ref && ref.plan.day === 1 && !ref.practice && done === 0;
}

export default function SessionScreen() {
  const saved = useSaved();
  const master = useIsMaster();
  const today = useToday();
  const router = useRouter();
  const portrait = usePortrait();
  const [special] = useState(readMode);
  const preview = special?.mode === "preview" ? special : null;
  const review = special?.mode === "review" ? special : null;
  // 미리 보기·다시 하기는 길을 진도에 남기지 않는다
  const [localRun, setLocalRun] = useState<RunState>({ ...EMPTY, done: special?.step ?? 0 });
  const [phase, setPhase] = useState<Phase>(() =>
    preview?.auto
      ? { name: "playing", ref: preview.ref, built: buildActivity(preview.ref.plan.activities[preview.step], seededRng(1)), idx: preview.step, run: { ...EMPTY, done: preview.step } }
      : { name: "path" },
  );
  const [askExit, setAskExit] = useState(false);
  // 인사를 끝낸 나라 첫 미션 — 다시 들어오면 또 인사하고, 칸을 하나라도 깼으면 안 한다
  const [greetedKey, setGreetedKey] = useState<string | null>(null);

  useEffect(() => {
    const s = readSaved();
    const allowed = currentAuth()?.user.role === "master" || canPlayToday(s.progress, s.settings, localDay(new Date()));
    const ref = currentSession(s.progress);
    if (!special && allowed && ref && isArrival(ref, runOf(s.progress, ref).done)) void say(landOf(ref.plan.chapter).hello);
    else if (!special?.auto) void say(special?.mode === "review" ? LINES.review : allowed || special ? LINES.sessionStart : LINES.doneToday);
    return () => stopVoice();
  }, [special]);

  if (!saved) return <Splash />;

  // 지난 미션 다시 하기는 이미 마친 미션만(마스터는 어디든)
  const reviewOk = review ? master || canReview(saved.progress, review.ref.plan.chapter, review.ref.plan.day) : false;
  const live = review ? (reviewOk ? review.ref : null) : (preview?.ref ?? currentSession(saved.progress));
  const allowed = preview || review || master ? true : canPlayToday(saved.progress, saved.settings, today);
  const run: RunState = special ? localRun : runOf(saved.progress, live);
  const cells = live ? live.plan.activities.map(cellOf) : [];
  const arrived = !!live && run.done >= cells.length;
  const land = live ? landOf(live.plan.chapter) : LANDS[LANDS.length - 1];
  const greeting = !special && allowed && isArrival(live, run.done) && greetedKey !== live?.key;

  /** 길의 칸을 눌렀다 — 반짝이는 칸만 열린다 */
  const open = (i: number) => {
    if (!live) return;
    sfx.wake();
    if (!allowed) {
      sfx.boop();
      void say(LINES.doneToday);
      return;
    }
    if (i !== run.done) {
      sfx.boop();
      void say(LINES.path);
      return;
    }
    sfx.pop();
    stopVoice();
    const now = Date.now();
    setPhase({ name: "playing", ref: live, built: buildActivity(live.plan.activities[i], seededRng(now)), idx: i, run: { ...run, startedAt: run.startedAt || now } });
  };

  const finish = (ref: SessionRef, played: SessionResult, startedAt: number) => {
    // 걸린 시간 — 켜 두고 자리를 비운 날도 있으니 45분에서 자른다
    const score = { ...played, ms: startedAt ? Math.min(Date.now() - startedAt, 45 * 60_000) : 0 };
    const before = readSaved().progress.letters;
    let earned: number;
    let passed: boolean | null;
    let moved: Moved | null = null;
    if (preview) {
      earned = stickersFor(ref.plan, score);
      passed = passedOf(ref.plan, score);
    } else if (review) {
      const res = finishReview(readSaved().progress, ref.plan, score, today || localDay(new Date()));
      updateSaved((s) => ({ ...s, progress: res.next }));
      earned = res.earned;
      passed = passedOf(ref.plan, score);
    } else {
      const res = completeSession(readSaved().progress, ref, score, today || localDay(new Date()));
      updateSaved((s) => ({ ...s, progress: res.next }));
      earned = res.record.stickers;
      passed = res.record.passed;
      moved = res.moved;
    }
    const letters = ref.practice || review ? [] : meetsOf(ref.plan).filter((l) => preview || !before.includes(l));
    const medal = ref.plan.stamp ? medalOf(score.total ? score.correct / score.total : 0) : null;
    setPhase({ name: "reward", ref, earned, passed, moved, letters, medal, correct: score.correct, total: score.total });
    sfx.cheer();
    const stampLine = passed === true ? [LINES.stampPass] : moved === "practice" && ref.plan.stamp ? [LINES.stampPractice] : moved === "chapter" ? [LINES.stampMoveOn] : [];
    void say([LINES.sessionEnd, ...(medal ? [MEDAL[medal].line] : []), ...(letters.length ? [LINES.letterNew] : []), ...(earned ? [LINES.stickers] : []), ...stampLine]);
  };

  /** 한 칸 깼다 — 길로 돌아가 다음 칸까지 걸어간다 */
  const onActivityDone = (r: ActivityResult) => {
    if (phase.name !== "playing") return;
    const { ref, idx, run: cur } = phase;
    if (special) {
      const score = { correct: cur.score.correct + r.correct, total: cur.score.total + r.total, activities: cur.score.activities + 1 };
      setLocalRun({ done: idx + 1, score, startedAt: cur.startedAt });
    } else {
      updateSaved((s) => ({ ...s, progress: stepRun(s.progress, ref, r, cur.startedAt || Date.now()) }));
    }
    setPhase({ name: "path", ride: idx });
    void say(idx + 1 >= ref.plan.activities.length ? LINES.pathArrive : LINES.pathNext);
  };

  const goHome = () => {
    stopVoice();
    router.push("/");
  };

  const goMap = () => {
    stopVoice();
    router.push("/map");
  };

  if (phase.name === "playing") {
    const kind = phase.built.kind;
    return (
      <main className="relative flex h-dvh flex-col overflow-hidden">
        <LandBackdrop id={landOf(phase.ref.plan.chapter).id} calm />
        <header className="relative z-10 flex items-center justify-between gap-4 px-5 pt-4 portrait:gap-2 portrait:px-3 portrait:pt-safe">
          <button
            type="button"
            className="glass grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl font-extrabold text-ink-soft transition-transform active:scale-90 portrait:h-12 portrait:w-12 portrait:text-xl"
            onClick={() => setAskExit(true)}
            aria-label="그만하기"
          >
            <UiIcon name="close" />
          </button>
          <div className="glass flex min-w-0 items-center gap-2 rounded-full px-4 py-1.5 text-xl font-extrabold portrait:px-3 portrait:text-base" aria-label="지금 칸">
            <Icon id={`play:${kind}`} emoji={KIND_ICON[kind]} />
            <span className="truncate">{KIND_LABEL[kind]}</span>
            <span className="shrink-0 text-ink-soft">
              {phase.idx + 1}/{phase.ref.plan.activities.length}
            </span>
          </div>
          <StickerCount n={phase.run.score.activities * STICKER_PER_ACTIVITY} />
        </header>

        <section className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <ActivityHost key={phase.idx} built={phase.built} assess={phase.ref.plan.stamp} onDone={onActivityDone} />
        </section>

        {askExit && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm">
            <div className="flex w-full max-w-md animate-pop-in flex-col items-center gap-5 rounded-[2.4rem] bg-white px-10 pb-8 pt-6 shadow-[0_30px_60px_-20px_rgb(62_58_82/0.5)] short:flex-row short:gap-6 short:py-4 portrait:mx-4 portrait:px-6">
              <Guide size={130} mood="wow" />
              <div className="flex w-full flex-col items-center gap-4 short:gap-2">
                <p className="text-4xl font-extrabold short:text-3xl">그만할까?</p>
                <div className="flex w-full flex-col gap-3 short:gap-2">
                  <button type="button" className="cta w-full rounded-full py-4 text-3xl font-extrabold short:py-2 short:text-2xl" onClick={() => setAskExit(false)}>
                    계속할래
                  </button>
                  <SquishButton
                    tone="card"
                    className="w-full rounded-full py-3.5 text-2xl short:py-2 short:text-xl"
                    onClick={() => {
                      stopVoice();
                      setAskExit(false);
                      setPhase({ name: "path" });
                    }}
                  >
                    길로 돌아갈래
                  </SquishButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (phase.name === "reward") {
    const pieces = Math.min(phase.earned, 12);
    const chapterMoved = phase.moved === "stamp" || phase.moved === "chapter";
    const canNext = !special && !!currentSession(saved.progress) && (master || canPlayToday(saved.progress, saved.settings, today));
    const here = landOf(phase.ref.plan.chapter);
    return (
      <main className="relative grid h-dvh place-items-center overflow-y-auto">
        <LandBackdrop id={here.id} />
        {/* 높이가 낮은 화면(폰 가로)은 두 칸 — 왼쪽 축하, 오른쪽 새 글자·버튼. 한 줄로 쌓으면 버튼이 화면 밖으로 밀린다(숫자놀이 2026-10-27) */}
        <div className="relative flex flex-col items-center gap-5 py-6 short:flex-row short:gap-10 short:py-3">
          <div className="flex flex-col items-center gap-5 short:gap-2">
            <div className="relative">
              <Family size={230} mood="cheer" className="animate-float" />
              <FriendBadge land={here} size="min(14vh, 6rem)" className="absolute -right-6 bottom-0" />
              {Array.from({ length: pieces }, (_, i) => {
                const a = Math.PI * (0.08 + (0.84 * i) / Math.max(1, pieces - 1));
                return (
                  <span key={i} className="absolute animate-fly-up" style={{ left: `${50 - 70 * Math.cos(a)}%`, top: `${45 - 55 * Math.sin(a)}%`, animationDelay: `${0.3 + i * 0.12}s` }}>
                    <StickerIcon size={40} />
                  </span>
                );
              })}
            </div>
            <p className="title-pop text-6xl portrait:text-5xl short:text-5xl">{phase.ref.plan.stamp ? "도장 퀴즈 끝!" : "미션 성공!"}</p>
            <div className="glass flex items-center gap-3 rounded-full px-8 py-3 text-5xl font-extrabold short:py-2 short:text-4xl">
              <StickerIcon size={56} /> +{phase.earned}
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 short:max-w-[46vw] short:gap-3">
            {phase.medal && (
              <div className="glass flex animate-pop-in items-center gap-4 rounded-[2rem] px-7 py-3">
                <span className="text-7xl leading-none short:text-5xl">
                  <Icon id={`medal:${phase.medal}`} emoji={MEDAL[phase.medal].emoji} />
                </span>
                <span className="flex flex-col">
                  <span className="text-3xl font-extrabold short:text-2xl">{MEDAL[phase.medal].name}</span>
                  <span className="text-xl font-bold text-ink-soft">
                    {phase.total}문제 중 {phase.correct}개
                  </span>
                </span>
              </div>
            )}
            {phase.letters.length > 0 && (
              <div className="glass flex flex-col items-center gap-2 rounded-[2rem] px-6 py-3">
                <p className="text-2xl font-extrabold">새 알파벳!</p>
                <div className="flex items-end gap-4">
                  {phase.letters.map((l) => (
                    <span key={l} className="flex animate-pop-in items-end gap-1 rounded-[1.4rem] bg-white px-4 py-1">
                      <Glyph ch={l} className="text-brand" style={{ fontSize: "min(12vh, 5rem)" }} />
                      <Glyph ch={letterOf(l).lower} className="text-sky-deep" style={{ fontSize: "min(12vh, 5rem)" }} />
                    </span>
                  ))}
                </div>
              </div>
            )}
            {phase.passed === true && (
              <p className="rounded-full bg-mint px-7 py-2 text-3xl">
                {here.name} 도장 쾅! <Icon emoji="⭐" />
              </p>
            )}
            {phase.passed === false && (
              <p className="rounded-full bg-lilac px-7 py-2 text-2xl short:rounded-[1.6rem] short:text-center short:text-xl">{review ? "지난 퀴즈는 언제든 다시 풀 수 있어요" : phase.moved === "chapter" ? "다음 나라로 가요 — 부모 페이지에 '다시 볼 장'으로 남아요" : "조금 더 연습하고 다시 도전해요"}</p>
            )}
            {preview && <p className="font-body text-xl text-ink-soft">미리 보기라 진도에는 남지 않았어요</p>}
            {review && <p className="font-body text-xl text-ink-soft">지난 미션 다시 하기 — 진도는 그대로예요</p>}
            <div className="mt-2 flex items-center gap-3 short:mt-0">
              {canNext && (
                <button
                  type="button"
                  className="cta rounded-full px-10 py-5 text-4xl font-extrabold short:py-3 short:text-3xl portrait:px-7 portrait:text-3xl"
                  onClick={() => {
                    sfx.wake();
                    sfx.pop();
                    setPhase({ name: "path" });
                    const next = currentSession(readSaved().progress);
                    void say(chapterMoved && next ? landOf(next.plan.chapter).hello : LINES.path);
                  }}
                >
                  {chapterMoved ? "다음 나라로" : "다음 미션"}
                </button>
              )}
              <SquishButton tone={canNext ? "card" : "sky"} className="rounded-full px-8 py-4 text-3xl font-extrabold short:py-3 short:text-2xl portrait:px-6 portrait:text-2xl" onClick={review ? goMap : goHome}>
                {review ? "지도로" : "집으로"}
              </SquishButton>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 오늘의 길
  return (
    <main className="relative h-dvh overflow-hidden">
      {live ? (
        <DayPath
          land={land}
          cells={cells}
          done={run.done}
          stamp={live.plan.stamp}
          portrait={portrait}
          locked={!allowed || greeting}
          rideFrom={phase.ride}
          onPick={open}
          onGoal={() => {
            if (arrived) finish(live, run.score, run.startedAt);
          }}
        />
      ) : (
        <>
          <LandBackdrop id={land.id} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative flex flex-col items-center gap-6">
              <Family size={210} className="animate-float" />
              <p className="glass rounded-full px-8 py-3 text-3xl font-bold">
                {review ? "아직 하지 않은 미션이에요" : "모든 미션을 다 했어요!"} <Icon emoji={review ? "🔒" : "🎉"} />
              </p>
            </div>
          </div>
        </>
      )}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-5 pt-4 short:pt-2 portrait:px-3 portrait:pt-safe">
        <button type="button" className="glass pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl transition-transform active:scale-90 short:h-11 short:w-11 short:text-2xl portrait:h-12 portrait:w-12" onClick={review ? goMap : goHome} aria-label={review ? "지도로" : "집으로"}>
          <UiIcon name={review ? "prev" : "home"} />
        </button>
        {live && (
          <div className="glass flex min-w-0 flex-col items-center rounded-[1.4rem] px-5 py-1 text-center leading-tight short:px-4 portrait:px-3">
            <span className="truncate text-sm font-extrabold text-ink-soft">
              {dayLabel(live)} {!live.plan.stamp && !live.practice && <LevelStars n={live.plan.stage} />}
            </span>
            <span className="truncate text-xl font-extrabold short:text-lg portrait:text-lg">{live.plan.title}</span>
          </div>
        )}
        <StickerCount n={saved.progress.stickers} />
      </header>
      {live && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-1 px-3 short:bottom-1.5">
          {special && <span className="glass rounded-full px-4 py-1 font-body text-sm">{review ? "지난 미션 다시 하기 · 진도는 그대로" : "미리 보기 · 진도에 남지 않아요"}</span>}
          <p className="glass max-w-full rounded-full px-5 py-1.5 text-xl font-extrabold short:py-1 short:text-base portrait:text-lg">
            <ReadAlong text={!allowed ? LINES.doneToday : arrived ? LINES.pathArrive : run.done > 0 ? LINES.pathNext : LINES.path} />
          </p>
        </div>
      )}
      {greeting && live && (
        <LandHello
          land={land}
          onGo={() => {
            sfx.wake();
            sfx.pop();
            setGreetedKey(live.key);
            void say(LINES.path);
          }}
        />
      )}
    </main>
  );
}
