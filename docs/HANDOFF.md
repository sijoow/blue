# 하온이의 영어교실 — 시작 인계 (숫자놀이 세션에서, 2026-10-27)

이 폴더(`Desktop\blue`)에서 새로 만들 영어 앱의 출발점이에요. 형제 앱 **「하온이의 한글나라」(`Desktop\todo`)**, **「하온이의 숫자놀이」(`Desktop\nmber`)** 를 만든 대화에서 정한 것·만든 것·사용자 선호를 모았어요.
사용자와는 **중간 안내까지 전부 한국어**로 이야기해요. 아이 이름 **이하온**(4살) — 부를 땐 "하온아", 이름 뒤엔 "하온이".

> 시작하면 이 문서부터 끝까지 읽고, 아래 "6. 정해야 할 것"을 사용자와 짧게 확인한 뒤 코드를 옮기세요.

---

## 1. 사용자가 정한 것 (2026-10-27)

- **과목마다 따로 앱** — 한글나라·숫자놀이와 코드를 합치지 않고 이 폴더에 새 앱.
- 과목 = **영어**, 사용자 표현으로 **「영어교실」**(앱 이름은 「하온이의 영어교실」 / 짧은 이름 「영어교실」로 제안 — 확인할 것).
- **커리큘럼 = 토도영어**(에누마) 교사용 공개 자료를 따른다 — 숫자놀이가 토도수학을, 한글나라가 토도한글을 따른 것과 같은 방식. 레벨·유닛의 **학습 목표와 순서**만 따르고, 놀이·화면은 우리 것(토도 앱을 복제하지 않는다). 아래 4절에 조사 결과 전부.
- **그림 = 블루이(Bluey) 친구들** — 사용자가 `refs/` 에 블루이 관련 그림을 넣어 준다(숫자놀이 때 넘버블럭스 인물도를 넣어 준 것과 같은 방식). 집에서만 쓰는 앱이라는 사용자 판단 — 공개 출시(스토어)하려면 캐릭터를 바꿔야 한다는 점은 한 번만 말해 둘 것.
- **계정·아이 설정은 한글나라 DB 에서 읽기만** — 숫자놀이와 같은 방식(같은 MongoDB, 로그인·화면 방향·공부 요일·성우·아이 얼굴). **한글나라 DB 에 쓰는 코드는 만들지 않는다.**
- 깃·GitHub·Vercel 연결과 배포는 **사용자가 직접**. 커밋·푸시는 시킬 때만.

## 2. 출발점 — 숫자놀이를 복사해서 시작하기를 추천

숫자놀이(`Desktop\nmber`)가 가장 최근 엔진이에요(한글나라 DB 읽기 구조·끌어 놓기·숫자 친구 장면·APK 스크립트까지 들어 있음). 처음부터 새로 짜지 말고 숫자놀이를 복사해 **숫자 과정만 영어 과정으로** 바꾸는 쪽이 빠르고 안전해요. 사용자가 직접 폴더를 옮기기로 했으니 **시작할 때 방식을 한 번 확인**할 것.

복사할 때 뺄 것: `node_modules` `.next` `.git` `drafts` `release` `out` `refs`(넘버블럭스 그림) `tsconfig.tsbuildinfo`.
숫자 전용이라 비우거나 새로 만들 것: `public/voice/**` · `src/content/voice-manifest.json` · `voice-timing.json`(숫자 대사) · `public/img/**` · `src/content/image-manifest.json`(넘버블럭스 그림) · `src/curriculum/{course,numbers,friends,originals,things,lines}.ts` 의 숫자 내용 · `docs/numberblocks-style.md`.
`.env.local` 은 숫자놀이 것을 가져오되(값은 절대 화면·로그에 찍지 않는다) 아래만 바꾼다.

| 항목 | 숫자놀이 | 영어교실(제안) |
|---|---|---|
| 개발 주소 | `next dev -p 6300` | **6400**(비어 있음 — 6200 한글나라·6300 숫자놀이·6100 imgCreate 사용 중) |
| 진도 DB | 같은 클러스터, `MONGO_DB=haonnumber` | **`MONGO_DB=haonenglish`** |
| 한글나라 DB | `HANGUL_DB=todohangul`(읽기만) | 그대로. **`MONGO_DB==HANGUL_DB` 면 서버가 멈추는 안전장치**(lib/db)도 그대로 |
| 기기 저장 키 | `haon-number:…` | `haon-english:…` |
| 앱 정보 | 「하온이의 숫자놀이」/「숫자놀이」(manifest·layout·Splash·AuthGate) | 「하온이의 영어교실」/「영어교실」 |
| APK 패키지·키 | `kr.haon.sujanori`, 키 `C:\Users\Yogibo Design\haon-apk\sujanori` | 새 이름(예: `kr.haon.yeongeo`) + **새 서명 키**(`haon-apk\<새 이름>`) → `src/app/.well-known/assetlinks.json/route.ts` 지문도 새 키로 |
| 그림(Cafe24) | FTP `/app/img/lsh/num/` | 새 폴더(예: `/app/img/lsh/eng/`) — `CAFE24_UPLOAD_DIR` 만 바꾸면 업로드·주소가 따라간다 |
| 성우 | Typecast **수아**(한국어) | 한국어 안내 = 수아 그대로 + **영어 원어민 목소리 새로**(6절) |
| 배포 | https://number-eight-kappa.vercel.app (GitHub `sijoow/number`) | 새 Vercel 프로젝트 — 사용자가 직접 |

`.env.local` 변수 이름: `ACCOUNTS` `AUTH_SECRET` `MONGODB_URI` `MONGO_DB` `HANGUL_DB` `TYPECAST_API_KEY` `TYPECAST_VOICE_SUA` `TYPECAST_VOICE_MINJEONG` `CAFE24_FTP_HOST/PORT/USER/PASS` `CAFE24_UPLOAD_DIR` `CAFE24_PUBLIC_BASE_URL` (+ 영어 성우를 정하면 그 변수).
Vercel 에는 `MONGODB_URI` `MONGO_DB` `HANGUL_DB` `ACCOUNTS` `AUTH_SECRET` `CAFE24_PUBLIC_BASE_URL` `CAFE24_UPLOAD_DIR` 만(FTP·Typecast 는 로컬 전용). 그림 주소는 빌드 때 정해지므로 값을 넣은 뒤 **다시 배포**.

## 3. 숫자놀이에서 그대로 가져갈 것 (과목과 무관한 엔진)

스택: Next.js **16.4.3**(Turbopack — AGENTS.md: 바뀐 API 가 많으니 `node_modules/next/dist/docs/` 를 먼저 읽을 것) · React 19.2(React Compiler 린트 — 렌더 중 `Date.now()` 금지, effect 안 setState 금지 → 타이머·콜백에서) · Tailwind 4.3(`portrait:` `landscape:` `short:`(높이 520px 이하) 변형, `--vw` 변수) · mongodb 7 · 글꼴 **프리텐다드만**.

- **화면 틀**: `components/ModeShell.tsx`(ModeShell·DoneBurst — 내용 칸은 넘치면 스크롤), `components/ui.tsx`(MenuCard·SquishButton·UiIcon·Splash), `components/Icon.tsx`, `app/globals.css`(.glass·.squish·.title-pop, 애니메이션 pop-in·drop-in·breathe·shake·wiggle·float·die-tumble·merge-out·leave-up).
- **오늘의 놀이(하루 흐름)**: `components/play/SessionScreen.tsx`(미리 보기 `/play?preview=c3d2&step=0&auto=1` — 진도 안 남음), `ActivityHost.tsx`, `curriculum/types.ts·course.ts`(장·일), `lib/rounds.ts`(씨앗 고정 난수·판 만들기), `lib/progress.ts`(진도·도장·블록 보상·finishGame), `lib/schedule.ts`.
- **보기 고르기**: `components/play/choice.tsx`(useChoice·ChoiceCard·ActivityFrame) + `lib/answer.ts` — 누른 보기 이름을 먼저 읽고 딩동댕/땡, 정답은 칭찬을 끝까지 듣고 넘어감(사용자 요청).
- **끌어 놓기**: `components/games/drag.tsx`(useDragDrop·DragGhost, `[data-drop]`) — **사용자는 고르기보다 끌어다 놓기를 좋아한다**(그림자 친구·간식 나누기·블록 친구를 전부 끌어 놓기로 바꿔 달라고 함).
- **따라 쓰기**: `components/TraceBoard.tsx` + `PenCursor.tsx` — 글꼴 모양 칸을 덮었는지로 재서 **알파벳 대·소문자도 그대로 된다**(획순 자료는 없음).
- **목소리**: `lib/voice.ts`(성우 파일 → 없으면 기기 음성) · `lib/sfx.ts` · 노래방 읽기 `components/ReadAlong.tsx` + `lib/readAlong.ts` · `scripts/voice-lines.mts → typecast.mts make (견적) → --yes → voice-timing.mts → voice-prune.mts` · `voice-reuse.mts`(다른 앱에 구운 같은 문장은 빌려 와서 크레딧 0).
- **데이터·로그인**: `lib/db.ts` · `lib/hangul.ts`·`family.ts`(한글나라 설정 읽기, 기기 캐시) · `lib/auth*.ts` · `lib/store.ts`·`sync.ts` · `app/api/*`. 마스터 **fe / 1234**.
- **그림**: `src/content/image-manifest.json`(키 → 주소, 끝에 `?v=내용해시` — Cafe24 캐시 때문) · `lib/assets.ts`(imageOf, UI_ART 로 이모지 대신 그림) · `scripts/image-list → image-style → image-prompts → (힉스필드) → image-install → image-upload` · `refs-clean.mts`(레퍼런스의 로고·워터마크 덮기) · 설치 뒤 Cafe24 주소를 sha1 로 대조.
- **숫자놀이 메뉴 구성**: 오늘의 놀이 · 놀이터(놀이 골라 하기) · 숫자 놀이(우리가 같이 만든 오리지널 게임 — 윷놀이 등) · 숫자 친구(앨범) · 숫자 쓰기 · 부모 페이지. 영어도 비슷하게(예: 오늘의 영어 · 놀이터 · 영어 놀이 · 블루이 친구 · 알파벳 쓰기 · 부모).

## 4. 토도영어 조사 결과 (todoclassroom.com 교사용 공개 페이지, 2026-10-27)

읽은 곳: `https://todoclassroom.com/todoenglish/curri`(커리큘럼 전체) · `/todoenglish/intro`(소개·구성) · `/todoenglish/help`(학교용 학급 관리) · `/todoenglish/faq`(질문 제목만).

### 구조 — 데일리 코스(Daily Course)
- **8단계 · 26레벨(A~Z) · 레벨마다 Unit 4개 = 104유닛.** Unit 1 = 1~6일, Unit 2 = 7~12일, Unit 3 = 13~18일, Unit 4 = 19~24일 → **레벨 하나 24일**.
- 하루치(비디오·책·액티비티) **15~20분**. **5일 학습 → 6일째 형성 평가**, 기준보다 낮으면 **6일치 학습이 추가**된다.
- 시작 레벨은 추천 레벨 또는 진단 평가(레벨 테스트). 기반: 초등 3~6학년 영어과 교육과정(2022 개정), 나선형(spiral) 구조.

| 단계 | 레벨 | 내용 |
|---|---|---|
| 1 | **A, B** | 알파벳 대소문자와 관련 단어 |
| 2 | **C, D, E** | 쉬운 단어 읽기(파닉스 — 대표 음가·CVC) |
| 3 | F, G, H | 영어 문장 구조(연속자음, be 동사, 3인칭 단수) |
| 4 | I, J, K, L | 긴 단어 읽기, 간단한 의견(부정문·의문문, 장모음, th·ch·sh) |
| 5 | M, N, O, P | 사람·사물 묘사(복수형, can, 소유·지시, 형용사·부사, What) |
| 6 | Q, R, S, T | 언제·어디서·어떻게(명령문, 시간, 위치 전치사, 빈도, 수량) |
| 7 | U, V, W, X | 과거(비교·최상급, be 과거, 일반동사 과거) |
| 8 | Y, Z | 미래·짧은 이야기(will, be going to, how·why, could) |

### 레벨 A — A부터 P까지 알파벳과 대표 단어 (4살 첫 범위로 추천)
목표: A~P 대소문자를 듣고, 따라 쓰고, 읽으며 익히기 / 각 글자로 시작하는 대표 단어
- Unit 1: A부터 D까지의 대/소문자를 구분하고 쓸 수 있어요.
- Unit 2: E부터 H까지의 대/소문자를 구분하고 쓸 수 있어요.
- Unit 3: I부터 L까지의 대/소문자를 구분하고 쓸 수 있어요.
- Unit 4: M부터 P까지의 대/소문자를 구분하고 쓸 수 있어요.

### 레벨 B — Q부터 Z까지 알파벳과 대표 단어
- Unit 1: Q부터 T까지 · Unit 2: U부터 W까지 · Unit 3: X부터 Z까지의 대/소문자를 구분하고 쓸 수 있어요.
- Unit 4: 지금까지 배운 알파벳을 복습하며 구분하고 쓰는 연습을 해요.

### 레벨 C — 파닉스 입문(알파벳의 대표 음가)
목표: 대표 소리를 익히며 파닉스 원리 / 배운 음가를 연결해 단어 읽기 시작
- Unit 1: a / t / i / p 소리 · Unit 2: n / s / e / t / p 소리 · Unit 3: d / m / c / u / n 소리를 구분하고 읽을 수 있어요.
- Unit 4: 앞서 배운 자음+모음+자음 단어를 복습하며 파닉스의 기초를 다져요.

### 레벨 D — CVC 단어 읽기
목표: 배운 음가로 CVC(자음-모음-자음) 단어 읽기 / 첫소리·끝소리 구분
- Unit 1: k / h / o / d / t · Unit 2: b / z / x / g · Unit 3: qu / j / r 소리를 구분하고 읽을 수 있어요. · Unit 4: CVC 복습

### 레벨 E — CVC 단어 읽기 연습(헷갈리는 소리)
목표: y-w, v-f, l-r 소리 구분 / 주제별·필수 어휘 늘리기
- Unit 1: y / w로 시작하는 단어 · Unit 2: v / f · Unit 3: l / r — 소리를 구분하고 읽을 수 있어요. · Unit 4: CVC 복습

### 레벨 F~Z (나중 범위 — 원문은 curri 페이지)
- F 연속자음(st, sm, sn, sp, nt, mp)·복수형·a/an·he/she/it·we/they · G ng·ck·be 동사 am/is/are · H R 발음·3인칭 단수·have/has·likes
- I y·wh·ph·부정문(don't/doesn't) · J 장모음 a·i·e·Is this/Are you · K 장모음 o·u·Do you/Does · L th·ch·sh·want to/like to
- M 복수형·축약형·현재 의문문 · N can·Mr./Mrs.·소유·지시형용사 · O 형용사·양태부사 · P 합성어·What is this/are these
- Q 명령문·let's·방향 전치사 · R 시간(o'clock·at/in/on) · S 위치·빈도부사 · T 셀 수 있는/없는 명사·how many/much
- U 비교급·최상급 · V be 동사 과거 · W 일반동사 과거(규칙·불규칙) · X 과거 부정·의문·시간 연결어 · Y will·be going to · Z how·why·could·짧은 이야기

### 토도영어의 구성(메뉴) — 토도 이름 그대로
1. **데일리 코스** — 매일 정해진 분량(위 구조) · 2. 상황별 대화 연극(캐릭터 대화) · 3. **프리초이스** — 데일리 코스의 액티비티 3,500여 개를 종류별로 · 4. 비디오 도서관(Music·Animation·Grammar) · 5. 그림책 도서관(1~6레벨, Read Aloud·하이라이트·단어 듣기) · 6. 오늘의 미션(F 레벨부터, 다 하면 COMPLETE 도장) · 7. 단어장(레벨별 단어·예문·그림) · 8. AI 말하기 연습(40여 음가·2000여 단어, 로봇 부품 보상) · 9. 책 소리 내어 읽기(J 레벨부터) · 10. 펫 챌린지(파닉스~문법, 펫 아이템·도록) · 11. 위클리 매거진
- 프리초이스 영역별 액티비티: 알파벳 Jewel Miner·Missing Letter·Alphabet Puzzle / 파닉스 Sound Train·Bath Time·Dog Phonics / 듣기 Toy Factory·Silly Hat·Star Search / 어휘 Find the Pair·I Spy·Sorting Rockets·Space Repair Shop·Spelling·Labeling / 쓰기 Letter Writing·Word Tracing·Type Time / 말하기 Talking Raccoon·Pet Dictation·Alien Chat / 문법 Sentence Bricks·Break n Build·Fix the Ship
- 설계 원칙(소개 페이지): 알파벳·파닉스·어휘·문법·듣기·말하기·읽기·쓰기를 균형 있게 · 대표 음가를 반복해 듣고 소리에 맞는 글자 찾기·글자 이어 단어 만들기 · 유닛마다 주제 어휘 → 배운 단어로 새 문형 · 일상 대화에 자주 노출 · 진단 평가로 시작점, 형성 평가 결과로 맞춤 복습 · 그림책에 그날 배운 요소를 넣음.

**페이지에 없는 것**: 레벨별 나이(유아·4세 표현 없음), 하루 활동 수, 형성 평가 기준 점수, 원어민 억양(미국식/영국식), 한국어 지시 여부, 별·트로피 쓰임 → 우리가 정한다(6절).

## 5. 블루이 그림

- 사용자가 `refs/` 에 블루이 관련 그림을 넣어 준다. 이름·모습은 **그 그림 그대로**. **직접 그리지 말 것** — 한글나라에서 페파를 SVG 로 그렸다가 "너무 달라, refs 그대로 써"라는 지적을 받았다. 잘라 쓰거나 힉스필드 생성의 레퍼런스로.
- 레퍼런스에 로고·워터마크가 있으면 `scripts/refs-clean.mts` 처럼 덮은 사본(`refs/gen/`)을 만들어 생성에 쓴다(생성기가 글자를 베낌). 원본은 건드리지 않는다. refs 는 커밋하지 않는다.
- 숫자놀이에서 배운 것: 그림 스타일 문서(`docs/<캐릭터>-style.md`)를 먼저 만들고 → 시험 3장 → 본 생성. 레퍼런스에 여러 캐릭터가 줄지어 있으면 결과에도 섞여 나온다("Only X. No other characters anywhere." 로 해결). 생성 뒤 어두운 바탕 모음 한 장으로 꼭 확인.
- 쓸 곳(제안): 안내 친구(인사·칭찬), 알파벳 대표 단어 그림(apple·ball… 을 블루이 그림체로), 메뉴 아이콘·놀이 장면. **OS 이모지는 그림체와 안 맞는다는 지적**(숫자놀이 10-27)이 있었으니 처음부터 그림으로.
- 캐릭터 이름 표기(블루이·빙고·아빠 밴딧·엄마 칠리 등, 한국어판 이름인지 원어 이름인지)는 그림을 보고 사용자에게 확인.

## 6. 정해야 할 것 / 제안 (시작할 때 사용자와 확인)

- **영어 목소리**: 영어 단어·문장은 원어민 목소리, 안내는 한국어(수아). Typecast 영어 성우 목록에서 고르기 — 블루이는 호주 영어라 억양(미국식/영국식/호주식)을 사용자에게 물을 것. 시험 몇 줄 → 사용자가 듣고 결정. `scripts/typecast.mts` 의 `VOICE_KEYS` 에 영어 성우를 더하고, `voice-lines` 를 한국어/영어 묶음으로 나눈다.
- **Typecast 크레딧**: 이번 달 사용량 ≈ **19.38만**(10-27 숫자놀이 기준), 스크립트 안전선 **19.8만**(`TYPECAST_SAFE_LIMIT=198000`, 보이스동화 앱 자체 잠금도 19.8만). 남은 4천여 자로는 알파벳·단어를 다 못 굽는다 → **다음 달 초기화를 기다릴지, 한도를 올릴지 사용자에게 물을 것**. 그전엔 기기 음성(`lib/voice` 기본값)으로 개발.
- **하루 분량**: 토도와 같게 **유닛 하나 = 장 하나(6일: 5일 놀이 + 6일째 도장 놀이)** 를 제안 — 숫자놀이는 5일(5일째 도장)이었다. 도장 못 받으면 연습 하루 → 재도전(숫자놀이 규칙). 레벨 A = 24일.
- **첫 범위**: 레벨 **A·B(알파벳 26자 + 대표 단어)**, 다음 C(파닉스 대표 음가). 숫자놀이처럼 업체 레벨 코드(A1·A2…)를 장에 붙이면 부모 페이지에서 비교하기 쉽다.
- **놀이 후보(재사용)**: 듣고 고르기("A! 어디 있을까?"), 대문자-소문자 짝 맞추기(끌어 놓기), 대표 단어 그림에 첫 글자 끌어 놓기, 따라 쓰기(TraceBoard 대·소문자), 글자 방울 터뜨리기, 손뼉으로 소리 세기. 영어 놀이 메뉴(오리지널)는 사용자와 같이 정한다 — 숫자놀이 때 사용자가 "너랑 나랑 만든 오리지널 게임"을 원했다.
- 노래: 알파벳 송 등 기존 노래 가사는 쓰지 말고 우리 문장으로.

## 7. 사용자 선호·운영 규칙 (꼭 지킬 것)

- **유료 생성은 먼저 물어보기**: 힉스필드·이미지 API·Typecast 는 실행 전 **장수·글자 수와 크레딧을 말하고 확인**을 받는다(한 장도 예외 없음). **물어보고 답을 안 기다리면 안 물어본 것.**
- **힉스필드 = 회사 계정**: 생성이 끝나면 **바로 전부 내려받고** 사용자에게 "다운받았어요, 힉스필드에서 지워도 돼요"라고 알린다(업로드한 레퍼런스 포함, 사용자가 직접 지움). 요령: GPT Image 2.5 · medium · 1k 투명 0.5크레딧. 투명 둘레 번짐은 install 의 defringe, 블록·몸이 모자라게 그려지면 다시 뽑기보다 이어 붙이기(숫자놀이 image-seams).
- **화면 시험**: 헤드리스 크롬(CDP, 포트 9343)으로 찍되 **`/api/progress`·`/api/family` 는 Fetch 로 막는다**(안 막으면 fe 의 실제 기록이 바뀐다). 시험 스크립트는 **동시에 돌리지 말 것**(localStorage 공유). Git Bash 에선 `MSYS_NO_PATHCONV=1`(`/play` 가 경로로 바뀜). 폰 가로(900×412)·세로(412×780)·PC 세 크기로, 첫 화면만이 아니라 끝까지 해 보고 잘림을 센다(`docs/tools/test/clip-audit.mjs`).
- 비밀값(.env) 출력 금지 · 다른 프로젝트 .env 는 지시 없으면 열지 않기 · 커밋·푸시는 시킬 때만 · **한글나라 DB 에 쓰지 않기** · 운영 데이터를 바꾸는 시험은 미리 알리기 · 짧고 모호한 지시는 한 줄 확인(규칙을 바꾸는 지시는 특히).
- 디자인: 글꼴은 **프리텐다드만**, 이모지 대신 그림, 세로 폰에서 메뉴는 한 줄에 2개·**화면 가운데에**(사용자가 세로 화면 위치를 따로 지적함).
- 사용자는 **폰으로 직접 테스트하며 스크린숏으로 피드백**한다. 짧은 메시지로 연달아 보내니 여러 요청을 모아서 처리하고, 오래 걸리면 중간에 한 줄씩 진행을 알린다.
- 사용자가 좋아한 방향: 고르기보다 **끌어다 놓기**, 숫자 옆에 캐릭터를 둬서 **보고 기억하게**, **눈에 보이는 변화**(블록이 합쳐져 친구가 되는 장면), 무엇을 하는지 **음성으로 설명**, 큰 연출(주사위가 하늘에서 떨어져 구르기).

## 8. 가져갈 도구 (숫자놀이 `docs/tools/`)

- `apk/build.cjs` · `apk/patch-launcher.cjs` — TWA APK. 보이스동화 때 받아 둔 **JDK 17·안드로이드 SDK·@bubblewrap/core** 를 빌려 쓴다(경로는 build.cjs 의 `DONG`). 영어교실용으로 `PACKAGE_ID`·`ALIAS`·`KEYDIR`(저장소 밖, 오래 남는 곳)·`B`(임시 작업 폴더)·`APK_NAME`·`launcherName` 을 바꿀 것. **경로에 띄어쓰기가 있으면 zipalign·apksigner 가 깨진다** → 짧은 경로(`C:/Users/YOGIBO~1/...`). 순서: `node build.cjs key`(키 만들고 지문) → assetlinks 에 지문 → 배포 → `node build.cjs https://<주소>` → `release/` 에 apk + zip(메신저가 apk 를 막을 때).
- `test/clip-audit.mjs` · `shot-pages.mjs` — 포트·로그인(fe/1234)·막을 주소 포함. 크롬: `chrome.exe --headless=new --remote-debugging-port=9343 --user-data-dir=<임시 폴더> --autoplay-policy=no-user-gesture-required`.

---
배포 주소: 한글나라 https://peppa-ashy.vercel.app (GitHub `sijoow/peppa`) · 숫자놀이 https://number-eight-kappa.vercel.app (GitHub `sijoow/number`, 시험 APK `Desktop\nmber\release\haon-number-test.zip`).
