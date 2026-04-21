# Gift Redemption REST API

Rolling Glory Backend Web Developer Test. Implementasi REST API untuk aplikasi website katalog & redemption gift menggunakan NestJS v10 + PostgreSQL + TypeORM.

## Tech Stack

| Layer      | Library / Tool                                    |
| ---------- | ------------------------------------------------- |
| Framework  | NestJS v10                                        |
| Language   | TypeScript 5                                      |
| Database   | PostgreSQL                                        |
| ORM        | TypeORM 0.3                                       |
| Validation | class-validator, class-transformer, Joi (env)     |
| Auth       | Passport JWT + bcryptjs (pure-JS, cross-platform) |
| Config     | @nestjs/config                                    |
| Testing    | Jest                                              |

## Arsitektur / Modularity

Modular monolith dengan layering **Controller → Service → Repository**. Setiap domain adalah module independen di bawah `src/modules/`.

```
src/
├── main.ts                 # bootstrap: global pipe/filter/interceptor/prefix
├── app.module.ts           # global guards (JWT + RBAC), imports modules
├── common/                 # cross-cutting concerns
│   ├── decorators/         # @Roles, @Public, @CurrentUser, @JsonApiType
│   ├── dto/                # PaginationQueryDto
│   ├── enums/              # Role enum
│   ├── filters/            # HttpExceptionFilter (JSON API error shape)
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── interceptors/       # JsonApiInterceptor
│   └── utils/              # roundToHalfStar
├── config/
│   ├── env.validation.ts   # Joi schema
│   └── typeorm.config.ts   # runtime DB options
├── database/
│   ├── data-source.ts      # TypeORM CLI DataSource (migration/seed)
│   ├── migrations/         # SQL migrations
│   └── seeds/              # seed-admin.ts, seed-gifts.ts, run-seed.ts
└── modules/
    ├── auth/               # login, JWT strategy
    ├── users/              # CRUD (admin only)
    └── gifts/              # CRUD, redeem, rating, list/detail with stars
```

**Design Patterns yang digunakan:**

- **Dependency Injection** (bawaan Nest) untuk loose coupling.
- **Repository Pattern** via TypeORM.
- **DTO + Validation Pipes** di boundary request.
- **Guard + Decorator** untuk authorization (RBAC).
- **Interceptor** untuk response shaping (JSON API convention).
- **Exception Filter** untuk error shape konsisten.

## API Endpoint

| Method | Path                     | Role          | Description                                       |
| ------ | ------------------------ | ------------- | ------------------------------------------------- |
| POST   | `/api/login`             | public        | Login, return JWT access token                    |
| GET    | `/api/gifts`             | public        | List gift + pagination + sorting + filter + stars |
| GET    | `/api/gifts/:id`         | public        | Detail gift + stars                               |
| GET    | `/api/gifts/:id/ratings` | public        | List review/rating per gift (paginated)           |
| POST   | `/api/gifts`             | admin         | Create gift                                       |
| PUT    | `/api/gifts/:id`         | admin         | Full replace gift                                 |
| PATCH  | `/api/gifts/:id`         | admin         | Partial update gift                               |
| DELETE | `/api/gifts/:id`         | admin         | Delete gift                                       |
| POST   | `/api/gifts/:id/redeem`  | authenticated | Redeem 1 gift (cek stock & points)                |
| POST   | `/api/gifts/redeem`      | authenticated | Bulk redeem — multiple gifts dalam 1 request      |
| POST   | `/api/gifts/:id/rating`  | authenticated | Rate gift yang sudah di-redeem                    |
| CRUD   | `/api/users[/:id]`       | admin         | CRUD user (bonus)                                 |

### Query params `GET /api/gifts`

- `page` (default 1), `limit` (default 10, max 100)
- `sortBy=newest|rating` (default `newest`)
- `order=ASC|DESC` (default `DESC`)
- `minRating=0..5` — filter rating minimum (contoh: `minRating=4` untuk "Rating 4 ke atas")
- `inStock=true|false` — filter stock tersedia (`gift.stock > 0`)

### Bulk redeem payload `POST /api/gifts/redeem`

```json
{
    "items": [
        { "giftId": "uuid-1", "quantity": 2 },
        { "giftId": "uuid-2", "quantity": 1 }
    ]
}
```

Satu transaction atomic — jika salah satu gagal (stock tidak cukup, poin kurang), semua di-rollback.

### Perhitungan bintang (stars)

Rating rata-rata dibulatkan ke kelipatan 0.5 terdekat.
`3.2 → 3`, `3.6 → 3.5`, `3.9 → 4`.

## Setup Local Environment

### Prasyarat

- Node.js 18+ (tested di v24)
- PostgreSQL 13+

### Langkah

1. Install deps:
    ```bash
    npm install
    ```
2. Copy env & isi nilai (DB credential, JWT secret, admin default):
    ```bash
    cp .env.example .env
    ```
3. Inisialisasi database sekali jalan — create DB (jika belum ada) → migration → seed:
    ```bash
    npm run db:init
    ```
4. Start app:
    ```bash
    npm run start:dev
    ```
    App listen di `http://localhost:3000/api`.

> `db:init` idempotent — aman dijalankan ulang. Kalau `rgb_db` sudah ada, langkah create di-skip. Kalau migration sudah jalan, TypeORM skip yang sudah applied. Kalau admin/gift sudah ada, seeder juga skip.

### Environment variables

Lihat `.env.example`. Admin default di-seed dari:

- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Automated Testing (Bonus)

```bash
npm test              # run jest
npm run test:cov      # with coverage
```

Unit tests cover:

- `roundToHalfStar` util — rounding rating ke 0.5.
- `UsersService` — create with bcryptjs hashing, conflict handling, not-found.
- `GiftsService` — stars calc, redeem stock/points validation, rate forbidden tanpa redemption.

## Migration & Seeder

| Script                                                         | Description                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run db:init`                                              | **First-time setup**: create DB (if missing) → migrate → seed                   |
| `npm run db:fresh`                                             | **Nuke & rebuild**: drop DB → create → migrate → seed (untuk kondisi DB desync) |
| `npm run db:setup`                                             | Create database `rgb_db` jika belum ada (idempotent)                            |
| `npm run db:drop`                                              | Drop database `rgb_db` (force disconnect session aktif)                         |
| `npm run db:reset`                                             | Revert last migration → rerun migration → reseed                                |
| `npm run migration:run`                                        | Apply pending migrations                                                        |
| `npm run migration:revert`                                     | Revert last migration                                                           |
| `npm run migration:generate -- src/database/migrations/<Name>` | Generate diff migration                                                         |
| `npm run seed:run`                                             | Seed admin + sample gifts                                                       |

## JSON API Response (Bonus)

Semua response dibungkus `JsonApiInterceptor`:

```json
// GET /api/gifts/:id
{
  "data": {
    "type": "gifts",
    "id": "uuid",
    "attributes": {
      "name": "Samsung Galaxy S9 - Midnight Black 4/64 GB",
      "stock": 25,
      "pointsRequired": 200000,
      "stars": 3.5,
      "averageRating": 3.6,
      "ratingCount": 4
    }
  }
}

// GET /api/gifts (paginated)
{
  "data": [ { "type": "gifts", "id": "...", "attributes": { ... } } ],
  "meta": { "page": 1, "limit": 10, "total": 6, "totalPages": 1, "sortBy": "newest", "order": "DESC" }
}
```

Error shape (mengikuti [jsonapi.org](https://jsonapi.org)):

```json
{
    "errors": [
        {
            "status": "400",
            "title": "BadRequestException",
            "detail": "...",
            "source": { "pointer": "/api/..." }
        }
    ]
}
```

## RBAC (Bonus)

Dua role: `admin` dan `user`. Global `JwtAuthGuard` + `RolesGuard` terdaftar via `APP_GUARD`. Endpoint public ditandai `@Public()`; endpoint khusus admin ditandai `@Roles(Role.ADMIN)`.

## Database Optimization (Bonus)

Index:

- `users.username`, `users.email` — unique, untuk lookup login.
- `gifts.name`, `gifts.stock`, `gifts.created_at` — untuk filter & sorting.
- `redemptions (user_id, gift_id)` composite — untuk validasi "sudah redeem".
- `ratings (user_id, gift_id)` + `ratings.gift_id` — untuk agregasi AVG per gift.

Lain-lain:

- **Pessimistic lock** (`SELECT ... FOR UPDATE`) saat redeem → mencegah race condition stok & points.
- **Transaction** untuk multi-step redeem (decrement stock + decrement points + insert redemption = atomic).
- **Check constraint** `rating BETWEEN 0 AND 5`.
- Rating diagregasi via `AVG(...) GROUP BY gift.id` langsung di query-builder (1 query untuk list, menghindari N+1).

## Alasan Pemilihan

### NestJS v10

- Framework Node.js TypeScript dengan **DI container** kuat — cocok untuk codebase modular & testable.
- Banyak **first-party module** (config, typeorm, passport, jwt) yang sesuai kebutuhan test.
- Arsitektur opinionated memaksa **separation of concerns** via decorator (controller/service/module).
- Dokumentasi lengkap + ekosistem besar.

### PostgreSQL

- **Relational integrity** kuat (FK + check constraint) cocok untuk relasi user↔redemption↔gift↔rating.
- **Numeric precision** untuk rating (tanpa float drift).
- Feature lanjutan (uuid-ossp, pessimistic locking, enum type) dipakai di migration.
- Konsistensi ACID untuk transaksi redeem.

## Deliverables Folder

Folder `docs/` berisi:

- `erd.png` — Physical ERD
- `schema.sql` / `db-export.zip` — export schema + data
- `postman_collection.json` — Postman collection
- `case-study.md` — Jawaban case study

## Project Scripts

```bash
npm run start:dev         # dev server dengan watch
npm run build             # production build
npm run start:prod        # run compiled dist
npm test                  # jest
npm run lint              # eslint --fix
npm run migration:run     # run migrations
npm run seed:run          # seed admin + gifts
```
