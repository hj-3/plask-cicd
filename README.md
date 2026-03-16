# PLASK — 한정 수량 주문 플랫폼

선착순 방식의 한정 수량 상품 주문 시스템입니다.
관리자가 상품을 등록하고 오픈 시간을 설정하면, 사용자는 카운트다운 이후 선착순으로 주문할 수 있습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite + Nginx |
| Backend | Node.js + Express |
| Database | PostgreSQL 15 |
| Session / Cache | Redis 7 (포트 6379) |
| Order Queue | Redis 7 (포트 6380) — FIFO (RPUSH/BLPOP) |
| Worker | Node.js — 큐 소비 + 이메일 발송 |
| 인증 | JWT + Redis 세션 |
| 이메일 | Nodemailer (SMTP) |

---

## 프로젝트 구조

```
plask/
├── frontend/               # React (Vite) + Nginx
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # 로그인 / 회원가입
│   │   │   ├── ProductListPage.jsx   # 상품 목록
│   │   │   ├── ProductDetailPage.jsx # 상품 상세 + 카운트다운 + 주문
│   │   │   ├── MyOrdersPage.jsx      # 내 주문 내역
│   │   │   └── AdminPage.jsx         # 관리자 페이지 (/admin)
│   │   ├── components/
│   │   │   ├── common/index.jsx      # Header
│   │   │   └── CountdownBadge.jsx    # 카운트다운 컴포넌트
│   │   └── store/authStore.jsx
│   ├── nginx.conf
│   ├── docker-entrypoint.sh
│   └── Dockerfile
│
├── backend/                # Express API 서버 (포트 3002)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── redis.js          # sessionRedis + queueRedis
│   │   ├── routes/
│   │   │   ├── auth.js       # 로그인 / 회원가입 / 로그아웃
│   │   │   ├── products.js   # 상품 목록 조회
│   │   │   ├── orders.js     # 주문 요청 / 상태 조회
│   │   │   ├── admin.js      # 관리자 CRUD
│   │   │   ├── my.js         # 내 주문 내역
│   │   │   └── health.js
│   │   └── middlewares/
│   │       ├── auth.js       # JWT + Redis 세션 검증
│   │       └── admin.js      # 관리자 권한 검사
│   └── Dockerfile
│
├── worker/                 # Redis Queue 소비자
│   ├── src/index.js        # FIFO 처리 + 이메일 발송
│   └── Dockerfile
│
├── infra/
│   └── postgres/init.sql   # DB 스키마
├── docker-compose.yml
└── .env.example
```

---

## 아키텍처

```
Browser
  │
  ▼
Frontend (React / Nginx :3000)
  │  /api/* → proxy (prefix 유지)
  ▼
Backend (Express :3002)
  │  세션 조회         Redis 1 (Session :6379)
  │  RPUSH →           Redis 2 (Queue  :6380)
  ▼
Worker (Node.js)
  │  BLPOP ← FIFO      Redis 2 (Queue  :6380)
  │  SELECT / INSERT    PostgreSQL
  │  이메일 발송        SMTP
  ▼
PostgreSQL :5432
```

**Redis 2개 역할 분리**

| | Redis 1 (세션) | Redis 2 (큐) |
|-|----------------|--------------|
| 포트 | 6379 | 6380 |
| 용도 | JWT 세션 저장, 로그아웃 무효화 | 주문 FIFO 처리 |
| 키/구조 | `session:{userId}` → JSON | List `order-queue` |

---

## 주요 기능

- **회원가입 / 로그인** — 이메일 + 비밀번호, JWT 발급
- **주문 오픈 타이머** — 상품별 오픈 시간 설정, 카운트다운 표시
- **선착순 주문** — 오픈 시 버튼 활성화, FIFO 큐로 순서 보장
- **주문 완료 이메일** — 처리 성공 시 해당 이메일로 발송
- **관리자 페이지 `/admin`** — 상품 추가/수정/삭제/활성화, 주문 현황 조회
- **품절 처리** — 수량 소진 시 자동 품절 상태 전환

---

## 실행 방법

### Docker Compose (권장)

```bash
docker compose up --build
```

| 서비스 | URL / 포트 |
|--------|-----------|
| 웹사이트 | http://localhost:3000 |
| Backend API | http://localhost:3002 |
| PostgreSQL | localhost:5432 |
| Redis (세션) | localhost:6379 |
| Redis (큐) | localhost:6380 |

**관리자 계정** (첫 실행 시 자동 생성)

```
이메일: admin@plask.com
비밀번호: admin1234
```

> `docker-compose.yml`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD` 환경변수로 변경 가능

---

### 로컬 개발 (Docker 없이)

PostgreSQL과 Redis 2개가 로컬에서 실행 중이어야 합니다.

```bash
# Redis 실행 (2개)
redis-server --port 6379 &   # 세션용
redis-server --port 6380 &   # 큐용

# Backend
cd backend
cp ../.env.example .env      # .env 설정 후
npm install
npm run dev                  # http://localhost:3002

# Worker
cd worker
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

---

## 이메일 설정 (선택)

Gmail 기준:

1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성
3. `docker-compose.yml` 또는 `.env`에 입력:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@plask.com
```

> SMTP 미설정 시 이메일 발송을 건너뛰고 나머지 기능은 정상 작동합니다.

---

## API 요약

### 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 (세션 삭제) |

### 상품

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/products | 상품 목록 | — |
| GET | /api/products/:id | 상품 상세 | — |

### 주문

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/orders | 주문 요청 (큐 등록) | ✓ |
| GET | /api/orders/status/:requestId | 주문 상태 폴링 | ✓ |
| GET | /api/my/orders | 내 주문 목록 | ✓ |
| GET | /api/my/history | 주문 요청 이력 | ✓ |

### 관리자 (admin 권한 필요)

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/admin/products | 전체 상품 목록 |
| POST | /api/admin/products | 상품 추가 |
| PUT | /api/admin/products/:id | 상품 수정 |
| DELETE | /api/admin/products/:id | 상품 삭제 |
| GET | /api/admin/orders | 전체 주문 현황 |

---

## DB 스키마

```sql
users         (id, email, password_hash, name, is_admin, created_at)
products      (id, name, description, image_url, product_url,
               quantity, ordered_count, open_time, is_active, created_at)
orders        (id, user_id, product_id, status, created_at)
order_history (request_id, user_id, product_id, status, message,
               created_at, processed_at)
```

---

## 주문 처리 흐름

```
1. 사용자 → POST /api/orders
2. Backend: 오픈 시간·재고·중복 검증
3. order_history에 PENDING 저장
4. Redis2에 RPUSH (FIFO 등록)
5. 202 Accepted + request_id 반환

6. Frontend: GET /api/orders/status/:requestId 폴링 (1.5초 간격)

7. Worker: BLPOP (left pop) — FIFO 순서 보장
8. PostgreSQL 트랜잭션 (FOR UPDATE 행 잠금)
   - 재고 확인 → orders INSERT → ordered_count 증가
   - order_history 상태 → SUCCESS / FAILED
9. 성공 시 이메일 발송

10. Frontend: 결과 모달 표시
```
