/**
 * /.well-known/assetlinks.json — 안드로이드 앱(TWA)이 이 사이트를 주소창 없이 띄우게 하는 확인 파일.
 * 영어교실은 한글나라와 다른 앱이라 패키지 이름·서명 키가 따로다(docs/tools/apk/build.cjs).
 * 지문 = `node build.cjs key` 로 만든 서명 키(키는 저장소 밖 haon-apk/yeongeo). 지문은 비밀이 아니다.
 * 키는 2026-10-28 에 만들었다 — 지문을 바꾸면 다시 배포해야 앱이 주소창 없이 뜬다.
 */
export const dynamic = "force-static";

const PACKAGE = "kr.haon.yeongeo";
const FINGERPRINT = "9A:11:FD:14:CE:43:E0:95:7D:6D:EE:74:64:37:C4:90:08:A6:05:18:02:B4:F3:1C:E2:AF:3E:F8:FD:F5:E3:84";

export function GET() {
  const body = FINGERPRINT
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: PACKAGE, sha256_cert_fingerprints: [FINGERPRINT] } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
