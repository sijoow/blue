/**
 * 블루이 그림체 문구 — scripts/image-prompts.mts 가 그림마다 붙인다.
 * 근거: docs/bluey-style.md(refs 세 장 관찰, 2026-10-28). 레퍼런스는 refs/gen/(이름표·로고를 잘라 낸 사본).
 */

/** 모든 그림 — 렌더·선·색 */
export const STYLE =
  "Flat 2D children's TV cartoon in the exact drawing style of the reference images (the Australian show Bluey): clean simple rounded shapes, flat bright colours with one soft subtle shade, thin outlines in a slightly darker tone of each fill colour (never black outlines), no textures, no 3D, no gloss, warm sunny daylight.";

/** 캐릭터가 나오는 그림 */
export const CHAR =
  "Characters are cartoon heeler dogs exactly like the reference images: big white oval eyes with round black pupils and a tiny white highlight, dark eyebrow markings, short muzzle with a black nose, simple mouth, rounded box-like body, short arms and legs, big pointed ears, a tail, simple paws (no human fingers).";

export const BLUEY = "Bluey: light blue puppy with navy ear tips, navy eyebrow markings and navy spots on the back, a tan muzzle, pale blue belly — exactly like the Bluey reference image.";
export const BINGO = "Bingo: orange puppy with a cream muzzle and cream belly, darker orange ear markings — exactly like the Bingo reference image.";
export const BANDIT = "Dad (Bandit): tall navy-and-light-blue adult heeler with a tan muzzle and dark navy patches — exactly like the Bandit reference image.";
export const CHILLI = "Mum (Chilli): tall light-orange adult heeler with a cream muzzle and brown ear markings — exactly like the Chilli reference image.";
/** 주인공 = 블루이 가족 넷(2026-10-28 사용자: "애들이 주인공이야" — 엄마·아빠·블루이·빙고 포스터) */
export const FAMILY = `The Heeler family of four, the main characters: Bluey and Bingo (two puppy sisters) with their Dad and Mum. ${BLUEY} ${BINGO} ${BANDIT} ${CHILLI}`;

/** 레퍼런스는 그림체·생김새만 — 캐릭터를 더 그리지 않게(숫자놀이 때 레퍼런스의 다른 캐릭터가 섞여 나왔다) */
export const ONLY = (who: string) => `Only ${who}. No other characters anywhere.`;
export const NO_CHAR = "Use the reference images only for the drawing style. Draw only the object described — no characters, no people, no dogs unless described.";

export const NO_TEXT = "No letters, no words, no numbers, no logos, no watermarks anywhere in the image.";

export const CUTOUT = "Centred with a small margin, fully transparent background, no ground, no shadow.";

/** 바탕·장면 — 포스터 속 브리즈번 집 마당 */
export const SCENE =
  "Setting: a sunny Brisbane backyard like the reference poster — green lawn, a Queenslander house on stilts, palm trees and leafy tropical plants, colourful flowers, clear blue sky, simple shapes, minimal detail.";

/** 단어 그림 — 영어 단어 → 그릴 것(그림만 보고 그 단어를 떠올리게, 4살 눈높이) */
export const WORD_DRAW: Record<string, string> = {
  apple: "a shiny red apple with a green leaf",
  ant: "a cute small red ant",
  ball: "a colourful striped beach ball",
  banana: "a yellow banana",
  // cat·tiger·fox 는 처음에 빙고(주황 힐러)처럼 나와서 다시 뽑음(2026-10-28) — 개가 아니라는 걸 분명히
  cat: "a cute grey striped kitten sitting, with a round cat face, small triangle ears, whiskers and a long thin tail (clearly a cat, not a dog, not orange)",
  cake: "a birthday cake with pink icing and candles",
  dog: "a cute small brown-and-white puppy sitting (not Bluey, not Bingo, not a heeler)",
  duck: "a yellow duck",
  egg: "a white egg",
  elephant: "a cute grey elephant",
  fish: "a little orange fish",
  frog: "a cute green frog",
  goat: "a cute white goat",
  grapes: "a bunch of purple grapes",
  hat: "a straw sun hat with a ribbon",
  horse: "a cute brown horse",
  igloo: "a small white igloo made of ice blocks",
  iguana: "a cute green iguana",
  juice: "a juice box with a bendy straw",
  jellyfish: "a cute pink jellyfish",
  kite: "a colourful diamond kite with a tail",
  key: "a golden key",
  lion: "a cute lion with a big fluffy mane",
  leaf: "a green leaf",
  moon: "a yellow crescent moon",
  monkey: "a cute brown monkey",
  nest: "a bird nest with three blue eggs",
  // 코만 그리면 검은 덩어리, 강아지 얼굴은 빙고처럼 나왔다(2026-10-28) — 곰 인형 얼굴, 코가 한가운데
  nose: "a friendly brown teddy bear face seen up close, with a big round shiny dark-brown nose right in the middle that is clearly the focus, small round ears (a teddy bear, not a dog)",
  octopus: "a cute purple octopus",
  orange: "an orange fruit with a leaf",
  pig: "a cute pink pig",
  pizza: "a slice of pizza",
  queen: "a friendly cartoon queen dog wearing a golden crown and a royal red robe (not Bluey, not Bingo)",
  quilt: "a folded colourful patchwork quilt",
  rabbit: "a cute white rabbit",
  rainbow: "a rainbow arching over two small clouds",
  sun: "a bright yellow sun",
  sock: "a striped sock",
  tiger: "a cute tiger cub with orange fur, bold black stripes, small round ears, a white muzzle and a striped tail (clearly a tiger, not a dog)",
  tree: "a leafy green tree",
  umbrella: "an open red umbrella",
  unicorn: "a cute white unicorn with a rainbow mane",
  van: "a small blue family van",
  violin: "a wooden violin with its bow",
  watermelon: "a slice of watermelon",
  worm: "a cute pink earthworm",
  box: "a closed cardboard box",
  fox: "a cute red fox with a narrow pointed snout, a white chest and a big bushy tail with a white tip, sitting (clearly a fox, not a dog, not Bingo)",
  "yo-yo": "a red yo-yo with its string",
  yogurt: "a cup of yogurt with a spoon",
  zebra: "a cute zebra",
  zipper: "a big shiny zipper, half open",
};

/** 메뉴 아이콘 — 블루이 친구가 그 놀이를 하는 모습 */
export const MENU_SCENE: Record<string, string> = {
  free: `Bluey happily sliding down a small red playground slide. ${BLUEY}`,
  letters: `Bingo hugging a small stack of colourful picture cards (the cards show only simple shapes, no letters). ${BINGO}`,
  write: `Bluey holding a big orange crayon, drawing a wavy line. ${BLUEY}`,
  // 노래·그림책 메뉴(2026-10-28 토도 메뉴 구성 따라가기)
  songs: `Bluey singing happily with her mouth open, a few colourful musical notes floating around her. ${BLUEY}`,
  books: `Bingo sitting and reading an open picture book, smiling. ${BINGO}`,
  // 영어 놀이(오리지널, 2026-10-28)
  games: `Bluey happily holding up a big white dice with red dots. ${BLUEY}`,
};

/** 놀이 아이콘 */
export const PLAY_ICON: Record<string, string> = {
  "find-letter": "a friendly cartoon ear with small curved sound waves",
  "match-case": "two jigsaw puzzle pieces, one blue and one orange, fitting together",
  "missing-letter": "a single bright yellow jigsaw puzzle piece",
  pop: "three shiny floating soap bubbles",
  "next-letter": "a chunky rounded green arrow pointing right",
  song: "two colourful musical notes",
  book: "an open colourful picture book",
  say: "a friendly toy microphone",
  quiz: "a small shiny gold trophy cup",
};

/** 도장 퀴즈 메달 — 업체 트로피 세 단계 자리. 숫자·글자 없이 */
export const MEDAL_ICON: Record<string, string> = {
  gold: "a shiny gold medal on a red ribbon, with a simple star in the middle",
  silver: "a shiny silver medal on a blue ribbon, with a simple star in the middle",
  bronze: "a shiny bronze medal on a green ribbon, with a simple star in the middle",
};

/** UI 아이콘 */
export const UI_ICON: Record<string, string> = {
  lock: "a small golden padlock",
  party: "a party popper bursting with confetti",
  sparkle: "three shiny yellow sparkles",
  star: "a shiny gold star",
  clap: "two cartoon dog paws clapping",
  home: "a small Queenslander house on stilts with a red roof",
  moon: "a yellow crescent moon with a small star",
  crown: "a small golden crown",
};

/** 놀이터 카드 장면 — 주인공 가족이 그 놀이를 하는 모습 */
export const GAME_SCENE: Record<string, string> = {
  "find-letter": "Dad whispering into Bluey's ear while she listens carefully with a paw cupped behind her ear; Mum and Bingo giggle nearby.",
  "match-case": "Bluey and Bingo giving each other a high five while Dad and Mum clap behind them.",
  "word-pick": "Mum holding up a red apple, Bingo pointing at it, Bluey holding a beach ball, Dad smiling.",
  "missing-letter": "Bluey and Bingo fitting big yellow jigsaw puzzle pieces into a puzzle on the grass while Mum and Dad kneel beside them.",
  pop: "Dad blowing big shiny soap bubbles while Bluey and Bingo jump to pop them and Mum laughs.",
  "next-letter": "The family walking in a line along garden stepping stones: Dad first, then Bluey, Bingo and Mum, Bluey pointing ahead.",
  say: "Bluey speaking happily into a toy microphone while Bingo, Mum and Dad listen and clap.",
};

/** 영어 놀이(오리지널) 카드 장면 — 주인공 가족이 그 놀이를 하는 모습. 카드·블록·편지에 글자를 그리지 않는다(생성기가 글자를 엉터리로 쓴다) */
export const ORIGINAL_SCENE: Record<string, string> = {
  bingo: "The family sitting around a garden table playing a picture bingo game with plain cards and round blue chips (the cards show only simple pictures); Bingo jumps up cheering with both arms raised.",
  mail: "Dad as a cheerful postman with a mail bag hands a plain envelope to Bluey, who is about to put it into a red letterbox with a yellow flag; Bingo and Mum wave from the verandah.",
  name: "Bluey and Bingo on the verandah floor lining up big plain colourful toy blocks in a row (the blocks are blank), while Mum and Dad watch and smile.",
  hide: "Hide and seek in the backyard: Dad covering his eyes by a tree, Bluey peeking out from behind a round green bush, Bingo hiding behind another bush, Mum giggling behind the house corner.",
  fish: "The family at a small backyard pond: Bluey holding a toy fishing rod, Bingo pointing at colourful toy fish in the water, Mum and Dad cheering.",
  board: "The family sitting on a picnic rug playing a big colourful board game with picture squares; Bluey rolls a big white dice with red dots while Bingo, Mum and Dad cheer.",
};

/** 이름 만들기 — 블루이 가족 한 명씩(하온이는 아이 얼굴, 블루이는 안내 친구 그림을 쓴다) */
export const NAME_PORTRAIT: Record<string, { ref: string; who: string; draw: string }> = {
  bingo: { ref: "bingo", who: "Bingo", draw: `${BINGO} She is waving hello with one paw, big friendly smile. Standing, full body, front three-quarter view.` },
  mum: { ref: "chilli", who: "Mum", draw: `${CHILLI} She is waving hello with one paw, warm smile. Standing, full body, front three-quarter view.` },
  dad: { ref: "bandit", who: "Dad", draw: `${BANDIT} He is waving hello with one paw, big grin. Standing, full body, front three-quarter view.` },
};

/** 가족 그림 — 첫 화면 인사·하루 끝 축하 */
export const FAMILY_MOOD: Record<string, string> = {
  "family:hello": "standing together side by side and waving hello, big friendly smiles, Bluey and Bingo in front of Mum and Dad",
  "family:cheer": "cheering together: Bluey and Bingo jumping with arms up, Dad and Mum clapping behind them, very happy",
};

/** 안내 친구 표정 */
export const GUIDE_MOOD: Record<string, string> = {
  guide: "waving hello with one paw, big friendly smile",
  "guide:cheer": "both arms up, cheering, very happy, jumping a little",
  "guide:wow": "surprised, mouth open in an O, arms out",
};
