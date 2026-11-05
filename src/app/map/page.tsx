"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/ui";

// 지도 — 장이 길 위 칸, 그 장의 미션 13개
const MapScreen = dynamic(() => import("@/components/map/MapScreen"), { ssr: false, loading: () => <Splash /> });

export default function Page() {
  return <MapScreen />;
}
