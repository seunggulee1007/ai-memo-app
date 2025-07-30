# AI Memo App

AI 기반 메모 작성 및 분석 애플리케이션입니다.

## 기능

- 📝 메모 작성 및 편집
- 🏷️ 태그 기반 메모 관리
- 🤖 AI 기반 텍스트 분석 (문법 검토, 문체 개선, 구조 분석, 요약)
- 👥 팀 협업 기능
- 🔐 사용자 인증 및 권한 관리

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic Claude API (AI 분석 기능용)
ANTHROPIC_API_KEY=your_anthropic_api_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=your_database_url

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. AI 분석 기능 설정

AI 분석 기능을 사용하려면 Anthropic API 키가 필요합니다:

1. [Anthropic Console](https://console.anthropic.com/)에서 계정을 생성하세요
2. API 키를 발급받으세요
3. `.env.local` 파일의 `ANTHROPIC_API_KEY`에 발급받은 키를 설정하세요

**참고**: API 키가 설정되지 않은 경우 AI 분석 기능은 비활성화되며, 사용자에게 적절한 안내 메시지가 표시됩니다.

### 4. 데이터베이스 설정

```bash
# Supabase 로컬 개발 환경 시작
npx supabase start

# 데이터베이스 마이그레이션 실행
npx drizzle-kit push
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API
- **ORM**: Drizzle ORM

## 라이선스

MIT License
