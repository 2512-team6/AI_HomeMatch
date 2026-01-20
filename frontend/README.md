# HomeMatch

복잡한 주거 문제를 스마트하게 해결하는 부동산 임대차 관리 플랫폼

## 프로젝트 개요

HomeMatch는 계약부터 입주, 퇴실까지 모든 과정을 함께하는 주거 관리 서비스입니다. AI 기반 계약서 분석, 매물 검증, 거주 중 관리 기능을 제공합니다.

## 주요 기능

- **AI 계약서 분석**: 계약서의 주요 조항과 위험 요소를 AI가 분석하여 쉽게 이해할 수 있도록 제공
- **매물 검증**: 건물 위험 이력, 중개사 설명과 계약서 불일치 확인
- **거주 중 관리**: 하자 관리, 주거비 추적, 입주 시점 기록 관리
- **퇴실 분쟁 예방**: 원상복구 체크리스트, 보증금 관리, 분쟁 예방 가이드
- **챗봇 어시스턴트**: 계약서 조항 및 법률 정보에 대한 질의응답

## 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/       # 공통 컴포넌트
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Layout.tsx
├── pages/          # 페이지 컴포넌트
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   ├── PropertyListPage.tsx
│   ├── PropertyDetailPage.tsx
│   ├── ContractReviewPage.tsx
│   ├── ContractDiscrepancyPage.tsx
│   ├── ResidencyManagementPage.tsx
│   ├── MoveOutPage.tsx
│   ├── ChatbotPage.tsx
│   └── MyPage.tsx
├── App.tsx         # 라우팅 설정
├── main.tsx        # 앱 진입점
└── index.css       # 전역 스타일
```

## 주요 페이지

- `/` - 랜딩 페이지
- `/login` - 로그인/회원가입
- `/home` - 홈 (로그인 후 메인)
- `/properties` - 매물 리스트
- `/properties/:id` - 매물 상세
- `/contract/review` - 계약서 AI 점검
- `/contract/discrepancy` - 중개사 설명 vs 계약서 불일치 분석
- `/residency` - 거주 중 관리
- `/moveout` - 퇴실 & 분쟁 예방
- `/chatbot` - 챗봇 어시스턴트
- `/mypage` - 마이페이지/설정

## 면책 조항

본 서비스는 주거 관련 정보와 도구를 제공하며, 법률 자문을 대체하지 않습니다. 
특정 법률 문제에 대해서는 반드시 전문가와 상담하시기 바랍니다.

## 라이선스

이 프로젝트는 비상업적 목적으로 제작되었습니다.
