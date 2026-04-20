# Tech Explanation

Penjelasan pemilihan teknologi, arsitektur, dan optimisasi yang diterapkan di project ini. Sesuai permintaan deliverable di PDF soal.

---

## 1. Alasan memilih NestJS v10

- **DI container yang kuat.** Semua class (service, repository, guard) di-*inject* via constructor — memudahkan testing (tinggal mock dependency) dan loose coupling antar-layer.
- **Struktur opinionated.** Decorator `@Controller`, `@Injectable`, `@Module` memaksa *separation of concerns* sejak awal. Cocok untuk codebase yang akan di-*maintain* jangka panjang / tim.
- **First-party modules lengkap.** `@nestjs/config`, `@nestjs/typeorm`, `@nestjs/passport`, `@nestjs/jwt` — semua yang dibutuhkan test ini tersedia tanpa harus *wire* manual.
- **TypeScript-first.** Type safety dari DTO → entity → response, error ketangkap di compile time bukan runtime.
- **Ekosistem & dokumentasi.** NestJS punya komunitas besar + official docs yang jelas, jadi *debug* dan *onboarding* developer baru relatif cepat.
- **Versi 10** dipilih karena stabil di ekosistem Node 18+ dan kompatibel dengan TypeORM 0.3.

---

## 2. Arsitektur aplikasi

Pendekatan **modular monolith** dengan layering klasik `Controller → Service → Repository`.

```
src/
├── main.ts                 # bootstrap: pipe, filter, interceptor, prefix global
├── app.module.ts           # global guards (JWT + RBAC), imports modul domain
├── common/                 # cross-cutting concerns
│   ├── decorators/         # @Roles, @Public, @CurrentUser, @JsonApiType
│   ├── dto/                # PaginationQueryDto
│   ├── enums/              # Role enum
│   ├── filters/            # HttpExceptionFilter (JSON API error shape)
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── interceptors/       # JsonApiInterceptor
│   └── utils/              # roundToHalfStar
├── config/
│   ├── env.validation.ts   # Joi schema validation env
│   └── typeorm.config.ts   # runtime DB options
├── database/
│   ├── data-source.ts      # TypeORM CLI DataSource (migration/seed)
│   ├── migrations/         # SQL migrations
│   └── seeds/              # seed-admin.ts, seed-gifts.ts, run-seed.ts
└── modules/
    ├── auth/               # login, JWT strategy
    ├── users/              # CRUD user (admin only, bonus)
    └── gifts/              # CRUD, redeem, rating, list/detail
```

**Layering:**

- **Controller** — hanya handle HTTP concern (routing, DTO binding, status code). Tidak ada business logic di sini.
- **Service** — tempat business logic (validasi stock, agregasi rating, transaction).
- **Repository** — abstraksi DB (pakai TypeORM `Repository<T>` langsung, tidak di-*wrap* manual karena sudah cukup bersih).

**Design patterns:**

| Pattern | Implementasi |
| --- | --- |
| Dependency Injection | Nest DI container (bawaan) |
| Repository | TypeORM `Repository<T>` via `@InjectRepository` |
| DTO + Validation | `class-validator` + global `ValidationPipe` di `main.ts` |
| Guard + Decorator | `JwtAuthGuard` + `RolesGuard` global, di-*override* pakai `@Public()` / `@Roles(...)` |
| Interceptor | `JsonApiInterceptor` untuk shape response |
| Exception Filter | `HttpExceptionFilter` untuk konsistensi error shape (JSON API) |

**Cross-cutting concerns** (auth, RBAC, response formatting, error shape) disentralisasi di `common/` supaya setiap modul domain tinggal fokus ke business logic-nya.

---

## 3. Alasan memilih PostgreSQL

- **Relational integrity kuat.** FK constraint + `CHECK` constraint (contoh: `rating BETWEEN 0 AND 5`) enforce di DB level. Bukan hanya di service layer.
- **Numeric precision.** Kolom rating pakai `numeric(3,2)` — tidak ada floating-point drift saat agregasi `AVG()`.
- **Feature lanjutan yang dipakai:**
  - `uuid-ossp` extension untuk generate UUID di DB.
  - `SELECT ... FOR UPDATE` (pessimistic lock) untuk mencegah race condition saat redeem.
  - Native `enum` type untuk kolom `role` (lebih hemat storage + validated di DB).
- **ACID transaction** yang reliable — penting untuk proses redeem yang multi-step (decrement stock + decrement points + insert redemption = harus atomic).
- **Open source**, tidak ada biaya lisensi, dokumentasi lengkap, tooling matang.

---

## 4. DB optimization yang dilakukan

### Index

| Tabel | Index | Kenapa |
| --- | --- | --- |
| `users` | unique `username`, unique `email` | login lookup — O(log n) |
| `gifts` | `name`, `stock`, `created_at` | filter list + sorting by newest + filter `inStock` |
| `redemptions` | composite `(user_id, gift_id)` | cek "user sudah redeem gift ini" (dipakai di `rate()`) |
| `ratings` | composite `(user_id, gift_id)` + `gift_id` | agregasi `AVG(rating)` per gift + filter `minRating` |

### Concurrency & konsistensi

- **Pessimistic lock** (`SELECT ... FOR UPDATE`) di [`gifts.service.ts` — method `redeem`](../src/modules/gifts/gifts.service.ts). Tanpa ini, 2 user redeem bersamaan saat stock tersisa 1 bisa lolos keduanya → stock negatif.
- **Transaction** via `dataSource.transaction()` membungkus: update stock → update points → insert redemption. Kalau salah satu gagal, semua di-*rollback*.
- **Check constraint** `rating BETWEEN 0 AND 5` di DB — double-protection di luar DTO validation.

### Query efficiency

- **Agregasi rating** di `findAll()` pakai single query-builder dengan `LEFT JOIN ratings + AVG + GROUP BY gift.id`. Menghindari **N+1 problem** (kalau per-gift dikompute terpisah, 10 gift = 11 query).
- **`count()` terpisah** untuk total pagination — lebih cepat dibanding `getManyAndCount()` yang harus ikut join untuk counting.
- Query spesifik pakai `createQueryBuilder` hanya di tempat yang butuh (agregasi, locking). Operasi CRUD biasa pakai `repository.save/find` yang sudah optimal.

### Schema

- **UUID** sebagai PK — meskipun lebih besar dari `int`, benefit-nya (non-guessable, safe merge) sepadan untuk use case ini.
- **Kolom `points_spent` di `redemptions`** — snapshot harga saat transaksi, supaya history tetap akurat kalau admin mengubah `points_required` di gift.

---

## 5. Cloud deployment

*Belum dilakukan untuk submission ini.*

Kalau dilakukan, pilihan kemungkinan besar **Railway** atau **Render** untuk aplikasi (simpel, gratis tier, support auto-deploy dari git) + **Supabase/Neon** untuk PostgreSQL managed (gratis tier, auto-backup).

Alternatif enterprise-grade: **AWS** (ECS/Fargate + RDS) atau **GCP** (Cloud Run + Cloud SQL) — pilihan kalau ada concern production-grade seperti auto-scaling, VPC, dan compliance.

---

## 6. Library utama yang digunakan

| Library | Fungsi |
| --- | --- |
| `@nestjs/core`, `@nestjs/common` | Framework inti |
| `@nestjs/typeorm` + `typeorm` + `pg` | ORM + driver PostgreSQL |
| `@nestjs/config` + `joi` | Config + validasi env var |
| `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` | Auth JWT |
| `bcryptjs` | Hash password |
| `class-validator` + `class-transformer` | DTO validation + serialization |
| `jest` + `ts-jest` | Unit testing |

Daftar lengkap ada di [`package.json`](../package.json).
