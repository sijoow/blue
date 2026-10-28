import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** 홈 화면 앱 정보 — 주소창 없이 꽉 차게, 처음엔 세로(한글나라 설정을 따라 lib/orientation 이 고정). 아이콘은 public/img/app-icon*.png(지금은 임시 ABC) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "하온이의 영어교실",
    short_name: "영어교실",
    description: "알파벳부터 차근차근, 하온이의 영어 놀이",
    lang: "ko",
    start_url: "/",
    display: "fullscreen",
    orientation: "portrait",
    background_color: "#fff8ee",
    theme_color: "#fff8ee",
    icons: [
      { src: "/img/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/img/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
