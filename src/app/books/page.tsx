"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 그림책 — 업체 그림책 도서관 자리(장마다 단어 그림책)
const ShelfScreen = dynamic(() => import("@/components/shelf/ShelfScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <ShelfScreen kind="books" />;
}
