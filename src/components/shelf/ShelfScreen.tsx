"use client";

import { useEffect, useState } from "react";
import { Glyph, WordArt } from "@/components/Art";
import { DoneBurst, ModeShell } from "@/components/ModeShell";
import { Book } from "@/components/play/activities/Book";
import { Song } from "@/components/play/activities/Song";
import { MenuCard, Splash } from "@/components/ui";
import { letterOf } from "@/curriculum/alphabet";
import { LINES } from "@/curriculum/lines";
import { menuOf, SHELF, type Shelf } from "@/curriculum/menus";
import { useIsMaster } from "@/lib/auth";
import { finishGame, knownLetters, localDay } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { readSaved, updateSaved, useSaved } from "@/lib/store";
import { pick, say, stopVoice } from "@/lib/voice";

type Kind = "songs" | "books";
type Phase = { name: "list" } | { name: "open"; shelf: Shelf; startedAt: number } | { name: "done"; shelf: Shelf; earned: number };

/** 펼치기 — 시작 시각을 지금으로. 누를 때만 부른다(렌더 중에 부르지 않는다) */
function opened(shelf: Shelf): Phase {
  return { name: "open", shelf, startedAt: Date.now() };
}

/** 본 시간 — 켜 두고 자리를 비운 날도 있으니 30분에서 자른다 */
function spent(startedAt: number): number {
  return Math.min(Date.now() - startedAt, 30 * 60_000);
}

/**
 * 노래(업체 비디오 도서관 자리) · 그림책(업체 그림책 도서관 자리) — 장마다 하나 + 알파벳 전체.
 * 그 장 글자를 다 만났으면 열린다(마스터는 다). 스티커는 놀이터처럼 하루 첫 판만 1장.
 */
export default function ShelfScreen({ kind }: { kind: Kind }) {
  const saved = useSaved();
  const master = useIsMaster();
  const [phase, setPhase] = useState<Phase>({ name: "list" });
  const menu = menuOf(kind);

  useEffect(() => {
    void say(kind === "songs" ? LINES.songs : LINES.books);
    return () => stopVoice();
  }, [kind]);

  if (!saved) return <Splash />;
  const known = new Set(knownLetters(saved.progress));
  const isOpen = (s: Shelf) => master || s.letters.every((l) => known.has(l));

  const open = (s: Shelf) => {
    sfx.wake();
    if (!isOpen(s)) {
      sfx.boop();
      void say(LINES.locked);
      return;
    }
    sfx.pop();
    setPhase(opened(s));
  };

  if (phase.name === "open") {
    const finish = () => {
      const res = finishGame(readSaved().progress, kind === "songs" ? "song" : "book", spent(phase.startedAt), localDay(new Date()));
      updateSaved((s) => ({ ...s, progress: res.next }));
      sfx.cheer();
      void say([pick(LINES.praise), ...(res.earned ? [LINES.stickers] : [])]);
      setPhase({ name: "done", shelf: phase.shelf, earned: res.earned });
    };
    return (
      <ModeShell title={`${phase.shelf.title} ${menu.title}`} icon={menu.icon} iconId={`menu:${kind}`} scene="free" onBack={() => setPhase({ name: "list" })}>
        {kind === "songs" ? <Song letters={[...phase.shelf.letters]} onDone={finish} /> : <Book letters={[...phase.shelf.letters]} onDone={finish} />}
      </ModeShell>
    );
  }

  return (
    <ModeShell title={menu.title} icon={menu.icon} iconId={`menu:${kind}`} scene="free">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-5 pb-8 sm:grid-cols-3 lg:grid-cols-4 portrait:gap-3 portrait:p-3">
        {SHELF.map((s) => {
          const ok = isOpen(s);
          const first = letterOf(s.letters[0]);
          return (
            <MenuCard
              key={s.id}
              tone={kind === "songs" ? "rose" : "lilac"}
              artClassName="aspect-[4/3]"
              art={
                kind === "songs" ? (
                  <span className="flex flex-wrap items-end justify-center gap-x-2 px-2 font-letter font-black text-brand" style={{ fontSize: s.letters.length > 4 ? "min(7vh, 2.6rem)" : "min(9vh, 3.6rem)" }}>
                    {s.letters.length > 4 ? (
                      <>
                        <Glyph ch="A" />
                        <span className="text-ink-soft">~</span>
                        <Glyph ch="Z" />
                      </>
                    ) : (
                      s.letters.map((l) => <Glyph key={l} ch={l} />)
                    )}
                  </span>
                ) : (
                  <WordArt id={first.words[0].id} size="min(16vh, 6.5rem)" />
                )
              }
              title={kind === "songs" ? `${s.title} 노래` : `${s.title} 그림책`}
              locked={!ok}
              lockText="글자를 다 만나면 열려요"
              onClick={() => open(s)}
            />
          );
        })}
      </div>
      {phase.name === "done" && (
        <DoneBurst
          earned={phase.earned}
          text={kind === "songs" ? "노래 끝!" : "다 읽었다!"}
          nextLabel="또 할래"
          onNext={() => setPhase(opened(phase.shelf))}
          secondLabel="다른 것"
          onSecond={() => setPhase({ name: "list" })}
        />
      )}
    </ModeShell>
  );
}
