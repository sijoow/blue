"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 알파벳 쓰기 — 만난 글자의 대문자·소문자 따라 쓰기
const WriteScreen = dynamic(() => import("@/components/write/WriteScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <WriteScreen />;
}
