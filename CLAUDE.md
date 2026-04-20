# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

점심 메뉴 고민을 해결해주는 사내 웹 앱. **Next.js 14 (App Router) + PostgreSQL + Prisma** 기반.

## 실행 방법

```bash
# 의존성 설치
npm install

# DB 마이그레이션 + 시드
npx prisma migrate dev
npx prisma db seed

# 개발 서버
npm run dev   # http://localhost:3000
```

`.env.local` 필요:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/today_menu"
```

## 아키텍처

- **Next.js App Router**: 프론트엔드 + API Routes (백엔드 통합)
- **Prisma + PostgreSQL**: 식당/체크인 데이터 영구 저장 및 공유
- **SWR**: 30초 폴링으로 체크인 실시간 공유
- **Leaflet.js**: 지도 렌더링 (dynamic import로 SSR 회피)

## 핵심 데이터 모델 (Prisma)

```prisma
model Restaurant {
  id, name, category, menus[], price, priceLevel(1|2|3),
  rating, lat, lng, hours, phone, satiety(light|medium|heavy),
  speed(fast|normal|slow), naverUrl, naverPlaceId, isBase
}

model Checkin {
  id, restaurantId, username, date(YYYY-MM-DD)
  @@unique([restaurantId, username, date])  // 중복 방지
}
```

## API Routes

| Method | Path | 설명 |
|--------|------|------|
| GET/POST | /api/restaurants | 목록 조회 / 등록 |
| PUT/DELETE | /api/restaurants/[id] | 수정 / 삭제 |
| GET/POST | /api/checkins | 오늘 체크인 목록 / 체크인 |
| DELETE | /api/checkins/[id] | 체크아웃 |
| POST | /api/survey | 설문 기반 추천 (서버사이드 계산) |
| POST | /api/teams/webhook | Teams 알림 프록시 |

## 설문 점수 알고리즘 (`lib/scoring.ts`)

`scoreRestaurant(restaurant, answers)` → 0~100점

| 조건 | 점수 |
|------|------|
| mood ↔ satiety 일치 | +25 |
| budget ≥ priceLevel | +25 |
| category 일치 | +25 |
| time ↔ speed 일치 | +20 |
| 미충족 시 부분 점수 | +5~15 |

## 주요 컴포넌트

- `components/MapTab.tsx` — Leaflet 지도, 카테고리 핀, 체크인 뱃지
- `components/SurveyTab.tsx` — 5단계 설문 + 결과 카드
- `components/RegisterTab.tsx` — 식당 등록 폼
- `components/GoingTab.tsx` — 오늘 체크인 현황 (SWR 폴링)

## 카테고리 상수

```typescript
export const CAT_EMOJI = { '한식':'🍲', '일식':'🍱', '중식':'🥡', '양식':'🍝', '분식':'🥢', '베트남':'🍜', '기타':'🍽️' }
export const CAT_COLOR = { '한식':'#FF5722', '일식':'#9C27B0', '중식':'#F44336', '양식':'#2196F3', '분식':'#FF9800', '베트남':'#4CAF50', '기타':'#607D8B' }
```

## 기본 식당 데이터

`prisma/seed.ts`: 강남역 인근 8곳 (`isBase: true`). 기준 좌표 `[37.4985, 127.0280]`.
실제 사무실 주변 식당으로 교체 필요.
