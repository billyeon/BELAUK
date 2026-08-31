# BELAUK 배포 가이드 (Vercel + 무료 주소)

배포하면 **웹 주소 = 앱(PWA) 주소**가 같이 생깁니다.
예: `https://belauk.vercel.app` — 브라우저로 열면 웹, 그 페이지에서 "홈 화면에 추가"하면 앱.

---

## 1. GitHub에 코드 올리기

1. https://github.com/new 에서 빈 저장소 생성
   - Repository name: `belauk`
   - **Private** 권장
   - "Add a README" 등은 **체크하지 말 것** (빈 저장소로)
2. 생성 후 나오는 주소(`https://github.com/<내계정>/belauk.git`)를 복사
3. 이 폴더(`belauk/`)에서 터미널 실행:

```bash
git remote add origin https://github.com/<내계정>/belauk.git
git push -u origin master
```

> 이미 첫 커밋은 되어 있습니다 (`git log`로 확인 가능).
> push할 때 GitHub 로그인 창이 뜨면 계정으로 로그인 (또는 Personal Access Token).

---

## 2. Vercel에서 가져오기

1. https://vercel.com/new 접속 → GitHub 계정 연결
2. 방금 만든 `belauk` 저장소 **Import**
3. 설정 화면:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` 그대로 (이 저장소가 belauk 앱 루트임)
   - **Build Command / Output**: 건드리지 말 것 (기본값)
4. **Environment Variables** 에 아래 5개 추가 — 값은 이 폴더의 `.env.local`에서 그대로 복사:

   | Name | 값 출처 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (비밀 — 노출 금지) |
   | `ANTHROPIC_API_KEY` | `.env.local` (비밀) |
   | `ANTHROPIC_MODEL` | `claude-sonnet-5` |
   | `NEXT_PUBLIC_APP_ENV` | `production` |

5. **Deploy** 클릭 → 1~2분 후 `https://belauk-xxxx.vercel.app` 주소 생성

---

## 3. 주소 정리 (선택)

- Vercel 프로젝트 → **Settings → Domains** 에서 `belauk.vercel.app` 처럼 원하는 서브도메인으로 변경 가능 (선점 안 됐으면)
- 나중에 `belauk.com` 등 도메인을 사면 같은 화면에서 연결

---

## 4. 배포 후 확인

- `https://<주소>/` → `/my` 로 이동, 홈 렌더
- `https://<주소>/manifest.webmanifest` → JSON 표시
- 안드로이드 Chrome으로 접속 → 주소창 설치 아이콘 또는 메뉴 → **"앱 설치"**
- 아이폰 Safari → 공유 → **"홈 화면에 추가"**
- 설치된 아이콘 실행 → 주소창 없는 전체화면 앱

이후에는 `git push` 할 때마다 Vercel이 자동 재배포합니다.

---

## 참고: Play 스토어 정식 등록 (나중에)

PWA는 위 웹 주소만으로 "홈 화면 앱"이 됩니다. Play 스토어 검색에 뜨는 정식 앱을 원하면:
1. 위 배포 완료 (HTTPS 주소 필수)
2. `npx @bubblewrap/cli init --manifest https://<주소>/manifest.webmanifest` 로 TWA APK 생성
3. Google Play 개발자 계정($25 일회성) → AAB 업로드
→ 별도 작업, 지금 범위 밖.

## 참고: Vercel CLI 로 바로 배포 (GitHub 없이)

```bash
npx vercel login      # 이메일/GitHub 로그인
npx vercel            # 미리보기 배포
npx vercel --prod     # 운영 배포
```
환경변수는 `npx vercel env add <NAME> production` 로 하나씩 추가.
