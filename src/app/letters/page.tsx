"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 단어장 — 오늘의 영어에서 만난 글자와 대표 단어(업체 단어장 자리)
const LettersScreen = dynamic(() => import("@/components/letters/LettersScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <LettersScreen />;
}
