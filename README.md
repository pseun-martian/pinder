# Waypoint Atlas

도시별로 여행 장소를 저장하고, 태그로 검색하고, 날짜만 고르면 Day 단위 일정을
자동으로 짜주는 개인 여행 아카이브. 투어는 링크 하나로 로그인 없이 공유할 수
있어요.

이 저장소는 실제 배포 가능한 서비스로 그린필드 구현된 결과물입니다. 설계
근거(아키텍처, 페이지/API 목록, DB 스키마, 인증 구조, 배포 구조)는
`/root/.claude/plans/tranquil-knitting-mochi.md`에 정리되어 있고, 아래 내용은
그 설계를 실제로 계정을 만들고 배포하는 절차로 옮긴 것입니다 — Supabase/
Vercel/GitHub 계정 생성 및 실제 키 발급은 사용자가 직접 해야 하는 단계라
이 문서로 안내합니다.

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, Storage) · Vercel · GitHub Actions

## 프로젝트 구조

```
src/
  app/
    (app)/app/            # 로그인 후 화면 (장소, 투어, 설정)
    actions/               # Server Actions — 도시/장소/이미지/투어 CRUD
    auth/callback/         # 인증 코드 → 세션 교환 Route Handler
    login/ signup/         # 인증 폼
    share/tours/[token]/   # 읽기 전용 공개 투어 페이지 (비로그인)
  components/              # UI, 장소, 투어, 앱 셸 컴포넌트
  lib/
    supabase/              # 서버/브라우저/관리자 클라이언트, 타입, 세션 갱신
    data/                  # 서버 전용 조회 함수 (RLS 적용된 쿼리)
    dal.ts                 # 인증 경계 — verifySession()
supabase/migrations/       # DB 스키마, RLS 정책, 공유용 RPC, Storage 정책
.github/workflows/         # main 브랜치 push 시 마이그레이션 자동 적용
```

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다 (리전은
   사용자와 가까운 곳 선택). 프로젝트가 이 서비스의 유일한 환경입니다 —
   스테이징/프로덕션을 분리하지 않는 구조로 설계했습니다.
2. **Project Settings → API**에서 다음 값을 확인해 둡니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 브라우저에 노출 금지)
3. 스키마 적용 — 둘 중 하나를 선택하세요.
   - **간단한 방법**: Supabase 대시보드의 **SQL Editor**에서
     `supabase/migrations/0001_init.sql` 내용을 그대로 붙여넣고 실행합니다.
   - **CLI로 관리하려면**: `supabase login` → `supabase link --project-ref <ref>`
     → `supabase db push` (아래 3장의 GitHub Actions가 이후 배포부터는
     자동으로 이 역할을 대신합니다).
4. **Authentication → Providers**에서 Email 로그인이 기본 활성화되어
   있는지 확인합니다 (OAuth는 사용하지 않는 구조입니다 — 확인된 결정 사항).
5. **Authentication → URL Configuration**에 아래 리다이렉트 URL을 등록합니다.
   - 로컬 개발: `http://localhost:3000/auth/callback`
   - 배포 도메인: `https://<your-domain>/auth/callback`
   - Vercel Preview를 쓸 경우: `https://*.vercel.app/auth/callback` 패턴도
     추가해 두면 PR 미리보기에서도 로그인이 동작합니다.
6. 마이그레이션이 `place-images` Storage 버킷(비공개)을 자동으로 만듭니다 —
   **Storage** 탭에서 버킷이 생성됐는지만 한번 확인하세요.

## 2. 로컬 환경변수

```bash
cp .env.local.example .env.local
```

| 변수 | 노출 범위 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | anon key — RLS가 실제 방어선이라 노출돼도 안전 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | 공유 페이지의 이미지 서명 URL 발급에만 사용 |
| `NEXT_PUBLIC_SITE_URL` | 클라이언트 | 공유 링크 생성, 인증 리다이렉트 URL 구성 |
| `SUPABASE_ACCESS_TOKEN` | CI 전용 (GitHub Actions secret) | 마이그레이션 자동 적용 |
| `SUPABASE_PROJECT_REF` | CI 전용 | `supabase link` 대상 프로젝트 지정 |

`.env.local`을 1장에서 받은 실제 값으로 채운 뒤:

```bash
npm install
npm run dev
```

`http://localhost:3000`에서 회원가입 후 바로 사용해 볼 수 있습니다.

## 3. GitHub → Vercel 배포

1. 이 저장소를 GitHub에 push합니다.
2. [vercel.com](https://vercel.com)에서 New Project → 이 저장소 선택 →
   프레임워크는 Next.js로 자동 인식됩니다.
3. **Project Settings → Environment Variables**에 위 표의 4개
   `NEXT_PUBLIC_*` / `SUPABASE_SERVICE_ROLE_KEY` 값을 Production/Preview/
   Development 세 스코프 모두에 등록합니다 (Supabase 프로젝트가 1개이므로
   세 스코프 모두 같은 값).
   - `NEXT_PUBLIC_SITE_URL`은 실제 배포 도메인으로 설정하세요
     (예: `https://waypoint-atlas.vercel.app` 또는 커스텀 도메인).
4. Deploy를 누르면 `main` push마다 Production 배포, 다른 브랜치/PR은
   Preview 배포가 자동으로 이뤄집니다 (Vercel Git 연동 기본 동작).
5. 커스텀 도메인을 쓰려면 **Project Settings → Domains**에서 연결하고,
   1장의 5번 리다이렉트 URL 등록에 그 도메인을 추가하는 것을 잊지 마세요.

### GitHub Actions로 마이그레이션 자동화 (선택)

`.github/workflows/deploy-migrations.yml`이 `supabase/migrations/**` 변경이
`main`에 push될 때마다 `supabase db push`를 실행하도록 이미 구성돼 있습니다.
GitHub 저장소의 **Settings → Secrets and variables → Actions**에 아래 두
secret만 등록하면 활성화됩니다.

- `SUPABASE_ACCESS_TOKEN` — Supabase 대시보드 우측 상단 프로필 →
  Access Tokens에서 발급
- `SUPABASE_PROJECT_REF` — 프로젝트 URL의 `https://<ref>.supabase.co`에서
  `<ref>` 부분

파괴적 변경(컬럼 삭제 등)이 포함된 마이그레이션은 반드시 로컬
(`supabase start`)에서 먼저 검증한 뒤 push하세요.

## 배포 후 확인 체크리스트

1. `npm run build`가 로컬에서 타입 에러 없이 성공하는지 (이미 확인됨).
2. 회원가입 → 로그인 → 도시/장소 추가 → 사진 업로드가 실제 Storage에
   저장되는지.
3. 두 번째 테스트 계정으로 로그인해 첫 번째 계정의 도시/장소가 전혀
   보이지 않는지 (RLS 격리 — 로컬 Postgres로 사전에 검증 완료).
4. 투어를 만들고 공유를 켠 뒤, 시크릿 창(비로그인)에서 링크로 열람은 되지만
   편집 버튼/폼이 전혀 렌더링되지 않는지 확인 → 공유를 끄면 같은 링크가
   더 이상 열리지 않는지.
5. Vercel Preview 배포 URL에서 로그인 후 콜백 리다이렉트가 정상 동작하는지
   (Auth Redirect URL 허용목록 누락이 흔한 실패 지점입니다).

## 알려진 제약 / 다음 단계 (v2 후보)

- 구글 지도 사진 자동 가져오기는 MVP에서 채택하지 않았습니다 — 사용자가
  사진을 직접 올리고, "지도에서 열기" 딥링크만 제공합니다. 필요해지면
  서버 프록시로 Places API를 추가할 수 있는 구조입니다.
- 로그인은 이메일/비밀번호만 지원합니다. OAuth는 Supabase Auth Provider만
  추가하면 되는 구조라 언제든 확장 가능합니다.
- 회원가입 확인 메일은 Supabase 기본 SMTP를 사용합니다 — 사용자가 늘면
  발신 속도 제한이 있으니, 필요 시 Resend 등 커스텀 SMTP로 교체하세요
  (Supabase 대시보드 **Authentication → Emails**에서 설정).
- 투어 내 장소 재배치는 드래그 앤 드롭(같은/다른 Day 간 이동) +
  ▲▼ 순서 변경 버튼으로 구현되어 있습니다.
