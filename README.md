# AI Memo App

AI 메모 애플리케이션 - Next.js 기반의 스마트 메모 관리 시스템

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 🛠️ 개발 도구

### 코드 품질

```bash
# 린팅
npm run lint

# 린팅 및 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format
```

### Git Hooks

- **pre-commit**: 자동 린팅 및 포맷팅
- **commit-msg**: 커밋 메시지 검증

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
├── components/          # React 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── lib/                # 유틸리티 함수
└── types/              # TypeScript 타입 정의
```

## 🛠️ 기술 스택

- **Framework**: Next.js 15.4.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Commit Convention**: Conventional Commits

## 📝 커밋 규칙

커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다:

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈를 확인하세요
2. 새로운 브랜치를 생성하세요 (`feature/issue-number`)
3. 변경사항을 커밋하세요
4. Pull Request를 생성하세요

## 📄 라이선스

MIT License
