/**
 * 아이에게 들려주는 말 — 한곳에 모아 둔다. 음성을 미리 구울 때 이 목록을 그대로 뽑아 간다(scripts/voice-lines.mts).
 * 말은 두 가지 목소리로 나뉜다(lib/voice 가 한글이 있는지로 가른다):
 *   한국어 안내  수아(Typecast) — 아래 LINES
 *   영어        원어민(미국식, 2026-10-27 사용자) — 글자 이름("A")·단어("apple")는 따로 한 줄씩 읽는다.
 *   한국어 문장 안에 글자 이름을 넣지 않는다 — 한국어 목소리가 "Z"를 "제트"로 읽어 버린다. 글자는 늘 영어 목소리로 따로.
 * 아이 이름(curriculum/child)이 든 말은 이름을 부르는 아이 맞춤 말 — 이름을 바꾸면 다시 굽는다.
 * 칭찬·다시 하기는 한글나라·숫자놀이와 같은 문장 — 이미 구운 음성을 그대로 빌려 쓴다(npm run voice:reuse).
 * 순수 파일 — node --test 가 그대로 읽는다.
 */

import { CHILD } from "./child.ts";
import { ALPHABET, WORDS } from "./alphabet.ts";
import { COUNT_EN, NAMES } from "./originals.ts";

const { call, nick } = CHILD;

export const LINES = {
  greet: `안녕, ${call}! 오늘도 같이 영어 놀이 하자!`,
  /** 첫 화면 안내 친구를 누르면 — 차례로 하나씩 */
  hello: [`${call}, 오늘은 어떤 알파벳을 만날까?`, `${call}, 같이 영어 놀이 할래?`, `${nick}랑 노는 게 제일 좋아!`, `${call}, 준비됐니? 출발!`],
  sessionStart: `${call}, 오늘의 영어를 시작해 볼까?`,
  sessionEnd: `오늘의 영어 끝! ${nick} 정말 잘했어!`,
  doneToday: `오늘 영어는 끝! ${call}, 내일 또 만나!`,
  stampPass: `도장 쾅! ${nick} 정말 대단해!`,
  stampPractice: "조금 더 공부하고 다시 도전하자!",
  stampMoveOn: "잘했어! 다음 장으로 가 보자!",
  stickers: "스티커를 모았어!",
  letterNew: "새 알파벳을 만났어!",
  locked: "조금 더 놀면 열려!",

  // 알파벳 만나기 — "새 알파벳을 만나 볼까?" → (영어) A → 대문자 → A → 소문자 → A → 단어
  meetHi: "새 알파벳을 만나 볼까?",
  meetUpper: "이건 큰 글자, 대문자야.",
  meetLower: "이건 작은 글자, 소문자야.",
  meetWords: "이 글자로 시작하는 말이야. 눌러 봐!",
  meetWordsEnd: "이 글자로 끝나는 말이야. 눌러 봐!",

  findLetter: "잘 듣고 글자를 찾아 봐!",
  whereIs: "어디 있을까?",
  matchCase: "대문자를 끌어서 짝꿍 소문자에 놓아 봐!",
  matchPair: "짝꿍이야!",
  missing: "빈칸에 들어갈 글자를 끌어다 놓아 봐!",
  wordPick: "잘 듣고 맞는 그림을 골라 봐!",
  pop: "이 글자 방울을 모두 터뜨려 봐!",
  popAll: "다 찾았어!",
  nextLetter: "다음에 올 글자는 뭘까?",
  trace: "손가락으로 글자를 따라 써 봐!",
  upper: "대문자",
  lower: "소문자",

  free: `${call}, 무슨 놀이를 해 볼까?`,
  letters: `${call}, 단어장을 볼까?`,
  songs: `${call}, 어떤 노래를 불러 볼까?`,
  books: `${call}, 어떤 그림책을 읽어 볼까?`,
  letterLocked: "아직 못 만난 글자야. 오늘의 영어에서 만나자!",
  write: `${call}, 어떤 글자를 써 볼까?`,
  next: "다음!",

  // 노래(영상 자리) · 그림책 · 따라 말하기 · 도장 퀴즈 — 2026-10-28 토도 하루 구성 따라가기
  songIntro: "노래를 불러 볼까?",
  bookIntro: "그림책을 읽어 볼까?",
  bookEnd: "다 읽었다! 재미있었지?",
  sayIntro: "잘 듣고 따라 말해 봐!",
  sayTurn: `${nick} 차례! 마이크를 누르고 말해 봐!`,
  sayListen: `${nick} 목소리야!`,
  quizPreview: "도장 퀴즈! 먼저 단어를 살펴볼까?",
  quizStart: "이제 문제를 풀어 볼까?",
  medalGold: "금메달! 하나도 안 틀렸어!",
  medalSilver: "은메달! 아주 잘했어!",
  medalBronze: "동메달! 다음엔 더 잘할 수 있어!",
  review: "지난 날을 다시 해 볼까?",

  // 영어 놀이(오리지널, 2026-10-28) — 영어 낱말(이름·수·Bingo!)은 따로 한 줄씩(englishTexts)
  games: `${call}, 어떤 영어 놀이를 해 볼까?`,
  bingoIntro: "빙고 놀이! 잘 듣고 맞는 그림에 칩을 올려 봐! 한 줄을 채우면 빙고야!",
  bingoDone: `${nick}가 한 줄을 다 채웠어!`,
  mailIntro: "우편 배달 놀이! 편지랑 소포를 맞는 우편함에 끌어다 넣어 줘!",
  mailLetter: "이 편지는 어느 우편함일까?",
  mailParcel: "이 소포는 어느 우편함일까?",
  mailDone: "배달 끝! 고마워!",
  nameIntro: "글자를 끌어서 이름을 만들어 볼까?",
  nameHaon: `${nick} 이름이야!`,
  nameBluey: "블루이 이름이야!",
  nameBingo: "빙고 이름이야!",
  nameMum: "엄마를 부르는 말이야!",
  nameDad: "아빠를 부르는 말이야!",
  hideIntro: "숨바꼭질! 덤불 뒤에 숨은 걸 톡 쳐서 찾아 봐!",
  hideWhere: "어디 숨었을까?",
  hideFound: "찾았다!",
  fishIntro: "글자 낚시! 낚싯바늘을 끌어서 물고기에 대 봐!",
  fishCatch: "이 글자 물고기를 잡아 봐!",
  fishGot: "잡았다!",
  boardIntro: "주사위 말판! 블루이랑 누가 먼저 도착할까?",
  boardMyTurn: `${nick} 차례! 주사위를 굴려 봐!`,
  boardStep: "반짝이는 칸을 눌러 봐!",
  boardBluey: "블루이 차례!",
  boardBlueyHome: `블루이가 먼저 도착했어! ${call}, 힘내!`,
  boardHome: `도착! ${nick} 정말 잘했어!`,

  revealHere: "여기 있었네!",
  praise: ["잘했어!", "맞았어!", "최고야!", "우와, 멋지다!", `${nick} 최고야!`, `잘했어, ${call}!`],
  retry: ["다시 해 볼까?", "한 번 더 해 보자!"],
} as const;

/** 빙고 놀이 — 줄이 다 차면 영어로 외친다 */
export const BINGO_SHOUT = "Bingo!";

/** 영어로 읽는 말 — 글자 이름(대문자 하나)과 단어, 영어 놀이의 이름·수·외침 */
export function englishTexts(): string[] {
  return [...ALPHABET, ...WORDS.map((w) => w.en), ...NAMES.map((n) => n.en), ...COUNT_EN, BINGO_SHOUT];
}

/** 모든 말을 한 줄씩 — 음성 파일 목록을 뽑을 때 쓴다(한국어·영어는 voice-lines 가 가른다) */
export function allLineTexts(): string[] {
  const fixed = Object.values(LINES).flatMap((v) => (typeof v === "string" ? [v] : [...v]));
  return [...fixed, ...WORDS.map((w) => w.ko), ...englishTexts()];
}
