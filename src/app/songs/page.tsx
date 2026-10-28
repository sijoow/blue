"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 노래 — 업체 비디오 도서관 자리(장마다 글자 챈트)
const ShelfScreen = dynamic(() => import("@/components/shelf/ShelfScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <ShelfScreen kind="songs" />;
}
