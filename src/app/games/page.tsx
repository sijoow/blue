"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 영어 놀이 — 우리가 같이 만든 오리지널 영어 게임
const GamesScreen = dynamic(() => import("@/components/games/GamesScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <GamesScreen />;
}
