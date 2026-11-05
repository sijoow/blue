/**
 * 나라 여행 — 장마다 나라 하나(2026-11-05 사용자: 보이스동화의 나라별 콘셉트를 쓰자, 우주나라 말고). 블루이 가족이 친구네 나라로 놀러 간다.
 *   그 장의 단어와 이어지게 골랐다 — 1장 cake 과자나라, 2장 elephant·frog·goat·horse 동물나라, 3장 iguana·lion·leaf 공룡나라, 4장 octopus 바다나라,
 *   5장 queen·rainbow 공주나라, 6장 van 자동차나라, 7장 yogurt 아이스크림나라, 8장 복습은 친구들이 다 모이는 동화나라. 그림책나라는 수채화 그림체에 사람 아이가 주인공이라 뺐다.
 * 그림은 보이스동화(Desktop/Dong) 것을 복사했다(node scripts/land-images.mts) — "land:<id>" 바탕 · "friend:<id>" 친구. 친구 그림은 바탕이 투명하지 않아 동그라미 안에 넣는다.
 * 레벨 C~E 를 넣으면 나라가 모자란다 — 그때 새 나라를 더하거나 한 바퀴 더 돈다(landOf 가 돌려 쓴다).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHILD } from "./child.ts";

const { call } = CHILD;

export interface Land {
  /** 보이스동화 나라 id — 그림 이름 */
  id: "candy" | "animal" | "dino" | "ocean" | "princess" | "car" | "icecream" | "storybook";
  name: string;
  friend: string;
  /** 그 나라에 처음 왔을 때 친구가 하는 말 */
  hello: string;
}

export const LANDS: readonly Land[] = [
  { id: "candy", name: "과자나라", friend: "쿠키", hello: `${call}, 안녕! 나는 쿠키야. 과자나라에 온 걸 환영해!` },
  { id: "animal", name: "동물나라", friend: "깡총이", hello: `${call}, 안녕! 나는 깡총이야. 동물나라에 온 걸 환영해!` },
  { id: "dino", name: "공룡나라", friend: "티노", hello: `${call}, 안녕! 나는 티노야. 공룡나라에 온 걸 환영해!` },
  { id: "ocean", name: "바다나라", friend: "포포", hello: `${call}, 안녕! 나는 포포야. 바다나라에 온 걸 환영해!` },
  { id: "princess", name: "공주나라", friend: "루비", hello: `${call}, 안녕! 나는 루비야. 공주나라에 온 걸 환영해!` },
  { id: "car", name: "자동차나라", friend: "붕붕이", hello: `${call}, 안녕! 나는 붕붕이야. 자동차나라에 온 걸 환영해!` },
  { id: "icecream", name: "아이스크림나라", friend: "소프티", hello: `${call}, 안녕! 나는 소프티야. 아이스크림나라에 온 걸 환영해!` },
  { id: "storybook", name: "동화나라", friend: "모모", hello: `${call}, 안녕! 나는 모모야. 동화나라에서 친구들이 다 기다리고 있어!` },
];

/** 그 장의 나라 — 장이 나라보다 많아지면 처음부터 다시 돈다 */
export function landOf(chapter: number): Land {
  return LANDS[(Math.max(1, chapter) - 1) % LANDS.length];
}
