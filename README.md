# 하온이의 영어교실

4살 아이를 위한 집에서 쓰는 영어 놀이 앱. 형제 앱 「하온이의 한글나라」(`Desktop/todo`)·「하온이의 숫자놀이」(`Desktop/nmber`)와 같은 화면 틀·목소리·로그인을 쓰고(숫자놀이를 복사해 시작, 2026-10-27), 2026-11-05 두 앱의 구성(오늘의 길·지도·★ 단계·손가락 시범·부모 문)을 따랐다, **로그인 계정과 아이 정보·설정은 한글나라에서 받아온다**(같은 MongoDB, 한글나라 DB 는 읽기만).
과정은 토도영어 데일리 코스의 레벨·유닛 순서를 따른다 — 지금은 레벨 A(A~P)·B(Q~Z + 복습) 8장 × 미션 13개 = 104 미션. 사용자 범위는 4~6세 = 레벨 A~E(알파벳 → 파닉스 → CVC)라 C~E 를 이어서 넣는다. 그림은 블루이(집에서만 쓰는 앱, `refs/`), 콘셉트는 **나라 여행**(보이스동화의 나라 8곳).

## 실행

```bash
npm install
npm run dev          # http://localhost:6500 (6400 은 예산 대시보드가 쓴다)
npm test             # 과정표·판 만들기·진도·스케줄·한글나라 값·로그인 검사
npm run voice:lines  # 들려줄 말 목록 → scripts/voice-lines.json (한국어 안내·단어 뜻 / 영어 글자 이름·단어)
npm run voice:reuse  # 한글나라·숫자놀이에 이미 구운 같은 말 빌려 오기 (크레딧 안 씀)
npm run voice:make -- --voice sua          # 한국어 남은 말 견적만 (--yes 를 붙이면 굽는다) — 영어 줄은 빼고 굽는다
npm run image:list && npm run image:prompts # 그림 목록·프롬프트 → scripts/image-prompts.json (레퍼런스는 node scripts/refs-clean.mts → refs/gen/)
npm run image:install -- drafts/<날짜>     # 힉스필드 결과(results.json) 내려받기 → public/img WebP + image-manifest(?v=내용 해시)
npm run image:upload                      # public/img → 회사 Cafe24 /app/img/lsh/eng/
```

`.env.example` 을 `.env.local` 로 복사해 채운다 — 값은 숫자놀이와 같고 `MONGO_DB=haonenglish` · `CAFE24_UPLOAD_DIR=/app/img/lsh/eng/` 만 다르다.
Vercel 환경변수: `MONGODB_URI` · `MONGO_DB` · `HANGUL_DB` · `ACCOUNTS` · `AUTH_SECRET` · `CAFE24_PUBLIC_BASE_URL` · `CAFE24_UPLOAD_DIR` (그림 주소는 빌드 때 정해지니 값을 넣고 다시 배포).
배포: https://blue-vefu.vercel.app (2026-10-28, 사용자가 직접).

### 안드로이드 시험판(APK)
`docs/tools/apk/build.cjs` — 패키지 `kr.haon.yeongeo`, 앱 이름 「영어교실」, 서명 키는 저장소 밖 `C:\Users\Yogibo Design\haon-apk\yeongeo`(잃으면 다음 APK 가 기존 앱 위에 안 깔린다 — 백업). 키 지문은 `src/app/.well-known/assetlinks.json/route.ts` 에 넣었다(배포해야 주소창 없이 뜬다).
`node docs/tools/apk/build.cjs https://blue-vefu.vercel.app` → `release/haon-english-test.apk` + `.zip`(메신저가 apk 를 막을 때). 앱 화면·그림이 바뀌어도 배포만 하면 되고 APK 는 다시 안 만들어도 된다(앱 이름·아이콘·주소를 바꿀 때만).

## 과정 — 토도영어 레벨 A·B (`src/curriculum/course.ts`)

유닛 순서·목표는 토도영어 그대로, 장 안 구성은 형제 앱을 따른다(2026-11-05 사용자). **장 하나 = 유닛 하나, 미션 13개** = ★ 넷(새 글자를 하루 하나씩) → ★★ 넷 → ★★★ 넷(`curriculum/level.ts` — 소문자·섞기, 앞 장 글자, 판 늘리기) → **도장 퀴즈**(단어 미리 보기 → 10문항, 앞 장 글자 2문항).
통과는 첫 두 장 50%, 그 뒤 70%(`passRateOf`, 한글나라와 같다), 결과는 업체 트로피처럼 동(80 미만)·은(80 이상)·금(100), 장마다 가장 좋은 결과가 남는다. 못 받으면 **추가 학습**(★ 네 미션 다시) → 퀴즈 한 번 더 → 그래도 못 받으면 다음 장. 첫 두 장은 쉬운 판(판 수를 줄인다, `EASY_CHAPTERS`).
**미션 하나 = 오늘의 길 8칸**(`components/play/DayPath.tsx`, 2026-11-06 업체 하루 5~9칸을 보고 10칸에서 줄임) — 노래·그림책(★★ 는 노래, ★★★ 는 그림책만) → 만나기 → 말풍선 → 놀이 → 영어 놀이 한 판(주사위 말판 빼고, 첫 미션 빼고) → 따라 쓰기. 표에 적지 않은 칸은 그날까지 만난 글자로 짧게 채운다(`fillDay`). 앞 칸은 물음표, 반짝이는 칸만 열리고, 깨면 길로 돌아와 블루이와 하온이가 다음 칸으로 걸어간다. 칸마다 저장되어(`progress.run`) 나갔다 와도 그 칸부터. 끝 칸을 누르면 「미션 성공!」 → 다음 미션/집으로. 하루 한 번 제한은 처음엔 꺼짐(부모 페이지에서 켠다).
**지도**(`/map`) — 장이 길 위 칸, 누르면 미션 13칸. 끝낸 미션을 누르면 다시 한다(`/play?review=c1d3` — 진도 그대로, 지난 퀴즈면 메달만).
노래는 이미 구운 글자·단어 소리를 이어 부르는 챈트("A, A, apple"), 그림책은 표지(가족) → 단어 쪽 → The End.
**이야기 그림책**(`curriculum/stories.ts` + `play/activities/Story.tsx`, 2026-11-06 업체 그림책 「Apples」처럼): 장마다 하나, 그 장 글자의 단어로 만든 짧은 반복 이야기 + 끝에 반전 — ① Snack Time(An apple for Bluey. → Happy Bluey! … → A cake for the dog? → No, no, dog!) ② I See!(I see an egg. … → Hop! A frog!) ③ Who Is It?(A lion? No! … → It is Dad!) ④ Hello, Pig!(… Hello, nose! → Yum!) ⑤ Run, Run!(Run, rabbit, run! … → A rainbow!) ⑥ Beep, Beep!(A unicorn in the van. … → A worm in the van? → Eek!) ⑦ What Is in the Box?(A yo-yo! … → A fox!) ⑧ Night Night(복습 장 — … → Night night, Haon!).
그림은 새로 그리지 않고 있는 것만(블루이 기분 셋 · 빙고·엄마·아빠 · 하온이 얼굴 · 가족 · 단어 그림), 쪽마다 움직임(깡총·도리도리·하트·달려 들어오기·살랑살랑·커지기). 문장은 클로이가 읽고 읽는 곳까지 글자 색이 바뀐다(노래방 읽기 — 단어는 빨강을 유지), 빨간 단어를 누르면 단어 → 뜻, 그림을 누르면 다시 읽기. 세로 화면에선 그림 둘을 대각선으로 크게. **★★★ 둘째·넷째 미션(10·12)의 첫 칸**이 그 장 이야기이고, 그림책 메뉴 맨 위 「이야기 그림책」 칸에도 꽂힌다(그 장 글자를 다 만나면 열림, 복습 장 이야기는 알파벳 전체). 테스트 `stories.test.ts`(장 글자 다 쓰기 · 아직 안 배운 글자 안 쓰기 · 5낱말까지 · 길 자리).
**콘셉트 = 나라 여행**(2026-11-05 사용자: 보이스동화의 나라별 콘셉트, 우주나라 말고) — 블루이 가족이 장마다 친구네 나라로 놀러 간다. `curriculum/lands.ts`, 그림 `components/map/World.tsx`(LandBackdrop·FriendBadge). 첫 화면·오늘의 길·놀이·보상 바탕이 그 장의 나라이고, 나라 첫 미션을 열면 그 나라 친구가 인사한다(`LandHello`), 끝 칸에서 친구가 기다린다. 도장을 받으면 「다음 나라로」. 지도 바탕은 동화나라, 나라 칸은 친구 얼굴(앞 나라는 흑백).
그림은 보이스동화(`Desktop/Dong/public/themes`) 것을 복사했다 — `node scripts/land-images.mts` → `public/img/lands/` 16장(바탕 8 · 친구 8) → `npm run image:upload`. 크레딧 안 씀. 친구 그림은 바탕이 투명하지 않아 동그라미 안에 넣는다. 레벨 C~E 를 넣으면 나라가 모자란다 — 새 나라를 더하거나 한 바퀴 더 돈다(`landOf`).

| 장 | 유닛 | 글자 | 나라 · 친구 | ★ 네 미션 |
|---|---|---|---|---|
| 1 | A1 | ABCD | 과자나라 쿠키 | 새 글자 하나씩 만나기 |
| 2 | A2 | EFGH | 동물나라 깡총이 | 위와 같음 |
| 3 | A3 | IJKL | 공룡나라 티노 | 위와 같음 |
| 4 | A4 | MNOP | 바다나라 포포 | 위와 같음 |
| 5 | B1 | QRST | 공주나라 루비 | 위와 같음 |
| 6 | B2 | UVW | 자동차나라 붕붕이 | 새 글자 셋 + 모아 보기 |
| 7 | B3 | XYZ | 아이스크림나라 소프티 | 위와 같음 |
| 8 | B4 | 복습 | 동화나라 모모 | A~I · J~R · S~Z · 헷갈리는 글자(b d p q, m n u w) · 도장 퀴즈(26자) |

글자마다 대표 단어 둘(`src/curriculum/alphabet.ts`, X 는 끝 글자 box·fox).

## 놀이 17가지 (`src/components/play/activities`)

노래(챈트) · 그림책 · 따라 말하기(듣고 녹음 → 내 목소리 → 다시 듣기, 녹음은 남기지 않음, 업체도 AI 채점은 C부터) · 도장 퀴즈 · 알파벳 만나기(대문자·소문자 누르기 → 단어 둘) · 글자 찾기(듣고 고르기) · 짝꿍 찾기(대문자를 소문자 위로 **끌어 놓기**) · 빈칸 글자(단어 그림 + `_pple` 빈칸에 **끌어 놓기**) · 그림 고르기(단어 듣고) · 글자 방울(대·소문자 섞인 방울 중 그 글자 모두 터뜨리기) · 다음 글자(A B C ?) · 따라 쓰기(대·소문자).
**따라 쓰기 = 획 쓰기**(`components/StrokeBoard.tsx` + `lib/strokes.ts`, 2026-11-06 업체 Letter Writing 처럼): 52글자마다 획 자료(선·호)를 두고 3선 칸에 획 길을 그린다. 노란 펜 머리(화살표)에서 시작해 길을 따라 그으면 빨갛게 칠해지고, 길 밖(15)·뒤로는 칠해지지 않아 지우기가 없다. 획을 다 쓰면 그 글자 단어 카드(apple, 첫 글자 빨강) → 글자 → 단어 → 칭찬, 다 들으면 다음 글자. 첫 획을 긋기 전엔 손가락 시범(펜 머리 → 길 쪽). 획 자료는 `strokes.test.ts`(52글자가 칸 안에 · 획대로 그으면 끝남 · 길 밖은 안 나감)로 지킨다.
**업체 레벨 A 놀이를 우리 그림으로**(2026-11-06 사용자 폰의 토도영어를 직접 해 보고 — [docs/todoenglish-levelA.md](docs/todoenglish-levelA.md)): 글자 퍼즐(A~Z 판 빈 자리에 조각 끌어 넣기, Alphabet Puzzle) · 다리 잇기(이어진 글자 다리 빈칸에 끌어 넣기 → 블루이가 건너감, Break n Build) · 같은 글자(그루터기 글자와 같은 조각을 옆 빈칸에, Find The Pair — 업체는 글꼴을 바꾸지만 우리는 프리텐다드 하나라 굵기·색을 바꿈) · 그림 짝꿍(같은 그림 카드끼리 겹치기, Literacy Matching) · 말풍선(누르면 글자 이름 → 단어, 듣기만 하는 칸).
**판 흐름도 업체처럼**(`lib/rounds` groupRounds·inTurn): 1·2판은 두 글자씩 → 마지막 판은 넷을 모아서(짝꿍 찾기·글자 퍼즐·다리 잇기·그림 짝꿍), 글자 찾기·글자 방울·같은 글자는 첫 바퀴를 A → B → C → D 차례로.
보기를 누르면 이름(영어)을 먼저 읽고 딩동댕/땡, 정답은 칭찬을 끝까지 듣고 넘어간다(`lib/answer`). 판은 시작할 때 섞는다(`lib/rounds.ts`, 순수 함수 + 테스트). 힌트(다음에 누를 것·정답 자리)는 `.hint` 노란 외곽선 — `.squish` 그림자가 Tailwind ring 을 덮어서 outline 으로. 손가락 시범(`play/HandHint.tsx`) — 끌어 놓기·길 칸은 곧바로, 듣고 고르는 놀이는 6초 가만히 있을 때만, 첫 판만, 화면을 만지면 사라진다(도장 퀴즈엔 없다).

## 메뉴

업체 메뉴 구성을 따른다 — 오늘의 영어(데일리 코스, 첫 화면 카드 → 오늘의 길) · 놀이터(프리초이스 — 놀이 11가지, 처음 나온 날부터, 아는 글자로) · 노래(비디오 도서관) · 그림책(그림책 도서관) · 단어장(만난 글자와 단어) · 글자 쓰기(대문자 → 소문자) · 지도(첫 화면 위 지도 단추) · 부모·관리자 페이지(첫 화면 톱니 1.5초 꾹 → 덧셈 문제, `parent/MathGate.tsx`). 노래·그림책은 장마다 하나 + A~Z, 그 장 글자를 다 만나면 열린다. 레벨 테스트는 C~E 레벨이 생긴 뒤에.
보상 = 스티커(칸 1 + 미션 끝 3 + 도장 5, 놀이터는 놀이마다 하루 첫 판 1).
화면 보기(세로·가로) = 부모 페이지 「프로그램 관리」에서 영어교실만 따로 고른다(Settings.orientation, 영어교실 DB) — 안 고르면 한글나라 설정. 세로 화면 머리줄은 폰 카메라 자리만큼 내린다(`globals.css` `pt-safe`, 전체 화면 앱이라).

**영어 놀이**(`/games`, 우리가 같이 만든 오리지널 — 2026-10-28 사용자 "너가 생각한거 다 넣어보자", 업체 메뉴에 없는 우리 것) — 늘 열림, 아는 글자로(모자라면 알파벳 차례로 채움), 스티커는 놀이마다 하루 첫 판 1. 목록 `curriculum/originals.ts` · 판 만들기 `lib/originals.ts`(+테스트) · 화면 `components/games/`:
빙고랑 빙고!(3×3 그림판, 부르는 단어에 칩 → 한 줄이면 "Bingo!") · 우편 배달(편지 대문자·소포 그림을 소문자 우편함에 끌어 넣기, 깃발이 올라감) · 내 이름 HAON(글자를 끌어 HAON → 가족 이름 둘, 다 맞추면 한 글자씩 짚어 읽기) · 숨바꼭질(덤불을 톡 — 맞으면 그림이 튀어나옴, 아니면 잠깐 고개만) · 글자 낚시(낚싯바늘을 끌어 물고기에) · 주사위 말판(블루이랑 번갈아, 하늘에서 떨어지는 주사위, 칸을 눌러 "one, two…", 멈춘 칸 단어). 우편함·덤불·물고기·주사위는 SVG(`components/games/props.tsx`, "prop:<이름>" 그림이 생기면 그 그림).

## 목소리 (`lib/voice.ts`)

**법칙(2026-11-05 사용자): 한글은 수아, 영어는 클로이.** 말마다 언어를 가른다 — 한글이 있으면 한국어(한글나라 설정 성우, 수아 `sua`), 아니면 영어(클로이 `en`, Typecast 영어 성우, `ssfm-v31`, 빠르기 0.9). 파일이 없으면 기기 음성(ko-KR / en-US).
한국어 안내 문장 안에 글자 이름을 넣지 않는다(한국어 목소리가 Z 를 "제트"로 읽는다) — 글자·단어는 늘 영어로 따로 한 줄. 글자 이름은 화면 글자 그대로 보낸다("A") — 예전 철자 `ay` 는 "아이"로 읽혔다. U·Z 만 예외 — U 는 `You.`(그대로 보내면 "아우"), Z 는 `zeee`(미국식 "지", 사용자가 듣고 고름).
후보 비교: 수아 영어 모드는 A·L·S("에스")가 이상했고, 헤스티아는 A 를 "아이"처럼 읽었다. 영어 성우 6명(Harper·Ella·Annie·Lindsay·Olivia·Chloe)을 들어 보고 사용자가 클로이로 정했다. 글자·단어 듣기 `public/voice/test.html`(깃 제외).
구운 말: 수아 154줄 · 클로이 149줄(글자 26 + 단어 64 + 이야기 59 — 2026-11-06 이야기 제목·문장·The End 793자). 굽기 `npm run voice:make -- --voice sua --yes` · `--voice en --yes` → `npm run voice:timing` → `npm run voice:prune`. 계정 20만 자는 형제 앱·동화 앱과 나눠 쓴다(11월 약 3.7만 자).

## 그림 — 블루이 (`refs/`, 저장소에 올리지 않음)

**주인공 = 블루이 가족 넷**(블루이·빙고·아빠·엄마, 안내는 블루이). 기준 [docs/bluey-style.md](docs/bluey-style.md) · 문구 `scripts/image-style.mts` · 나라 16장은 보이스동화 그림 복사(위 과정 절). 블루이 그림 106장(안내 친구 3 · 가족 2 · 이름 3 · 단어 52 · 아이콘 27 · 카드 장면 13 · 바탕 5 · 앱 아이콘 1) 2026-10-28 생성 → Cafe24 `/app/img/lsh/eng/`(원본 `drafts/2026-10-28/`, 노래·그림책 메뉴·놀이 아이콘 4·메달 3·따라 말하기 장면은 `drafts/2026-10-28b/`, 영어 놀이 메뉴·카드 6·빙고·엄마·아빠는 `drafts/2026-10-28c/`). 직접 그리지 않는다 — refs 를 레퍼런스로. 여기까지는 힉스필드(GPT Image 2.5 medium)에서 만들었고, **새 그림은 OpenAI API 직접**(2026-11-05 사용자, `.env.local` `OPENAI_API_KEY`): `npm run image:list && npm run image:prompts` → `node --env-file=.env.local scripts/gpt-image.mts drafts/<날짜> <키>…`(gpt-image-1.5 medium, 레퍼런스 refs/gen 같이 보냄, 정사각 약 $0.06·카드 약 $0.09) → `npm run image:install -- drafts/<날짜>` → `npm run image:upload`. 유료라 장수·비용을 먼저 말하고 승인받는다. 2026-11-06 첫 9장(새 놀이 아이콘 5 · 놀이터 카드 4, 약 $0.66) — 블루이 가족도 거절 없이 그려졌다.

## 화면 시험 (`docs/tools/test/`, 헤드리스 크롬 9344 — 9343 은 다른 세션이 쓰기도 한다)

`/api/progress`·`/api/family` 는 Fetch 로 막는다(fe 실제 기록 보호). Git Bash 에서는 `MSYS_NO_PATHCONV=1`.
- `node clip-audit.mjs 9344 clip 412x780,900x412` — 홈·놀이터·알파벳 카드·쓰기·부모·놀이·길·지도 화면 잘림 점검
- `node path-through.mjs 9344 412x780` — 오늘의 길 한 미션 끝까지(칸 → 놀이 → 다음 칸 → 다시 열어도 그 칸부터 → 미션 성공 → 다음 미션), 도장 퀴즈, 지도, 부모 문
- `node games-through.mjs 9344 412x780` — 영어 놀이 여섯을 끝까지(「놀이 끝!」) 해 보기
- `node play-through.mjs 9344 412x780` — 놀이를 아이처럼 끝까지 해 보고 길로 돌아오는지(보기는 차례로 눌러 보고, 끌어 놓기는 data-drop 으로, 새 놀이 넷·말풍선 포함)
- 놀이 하나만: `/play?preview=c1d4&step=2&auto=1`(진도에 안 남고 판 고정)
