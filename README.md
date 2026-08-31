# BELAUK — MVP-A

미얀마(Yangon first) 가치확인 중심 중고거래 플랫폼. **사진 → AI 인식 → 희망가격 → 시장범위 검토 → 등록**.

## 스택
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4
- next-intl (`my` 기본, `my/en/zh/ko`, `/[locale]` 라우팅)
- Supabase — Postgres · Auth · Storage (project `BELAUK`, ref `nunhadtrkklyumtojjxc`)
- Claude 멀티모달 (`@anthropic-ai/sdk`) — 인식 · 제목/설명 생성 · 영수증 민감정보 탐지

## 설정
```bash
npm install
cp .env.local.example .env.local   # 이미 있으면 생략
```
`.env.local`에서 채워야 하는 값:
| 키 | 위치 |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com (없으면 AI는 mock 결과로 동작) |

```bash
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run lint
npm run typecheck
```

## 데이터베이스
마이그레이션은 `supabase/migrations/` (MCP `apply_migration`으로 이미 적용됨). 시드는 `supabase/seed.sql`
(Yangon 8개 township, 12개 카테고리, 데모 상품 14개, 실거래가 이벤트 — iPhone 11/13은 `get_price_range` 표본이 충분).

핵심 원칙:
- **append-only**: `price_events`, `market_comparisons`, `ai_recognitions`, `ai_recognition_edits` 는
  DB 트리거로 UPDATE/DELETE 차단. 클라이언트 역할은 INSERT 권한도 REVOKE. 서버(service role)만 기록.
- **위치 비공개**: `public_products` 뷰는 township 단위 지명만 노출. 전화번호·정확한 주소 없음.

## 주요 플로우
| 경로 | 설명 |
|---|---|
| `/[locale]` | Value Scanner 홈 (카메라 CTA + 최근 가치확인 결과 + 내 주변 상품) |
| `/scan` → `/scan/[id]/review` → `/scan/[id]/result` | 사진 업로드 → AI 인식·수정 → 가치범위 |
| `/sell/[id]/details` → `/price` → `/preview` | 상태·증빙 → 희망가 시장검토 → Checked·미리보기 → 등록 |
| `/products`, `/products/[id]` | 둘러보기·검색·카테고리 / 상세 (가격 이력·Checked 근거 공개) |
| `/login` → `/verify` | 전화번호 mock OTP (dev: 코드가 화면·서버 로그에 표시) |

## 전화 인증 (mock)
SMS 게이트웨이 없이 `/api/auth/request-otp` + `/api/auth/verify-otp` 가 자체 OTP를 발급/검증하고,
Supabase 이메일+비밀번호 계정(`{phone}@phone.belauk.local`, 결정적 비밀번호)으로 세션을 만든다.
실제 SMS 연동 지점은 `supabase/functions/send-sms-hook/index.ts` 하나 — 자세한 전환 절차는 그 파일 상단 주석 참고.
