# ERD Explanation

File diagram: [`erd.png`](./erd.png)

Skema database terdiri dari **4 tabel utama** + 1 tabel internal TypeORM (`migrations`). Semua primary key pakai `UUID` (via `uuid-ossp`) untuk menghindari *enumeration attack* dan mempermudah merge data antar-environment.

---

## Tabel

### 1. `users`
Menyimpan data akun (admin & regular user).

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | UUID (PK) | primary key |
| `username` | varchar(50), **unique** | untuk login |
| `email` | varchar(150), **unique** | untuk login alternatif |
| `password` | varchar(255) | bcrypt hash |
| `points` | int | saldo poin user untuk redeem |
| `role` | enum (`admin`, `user`) | untuk RBAC |
| `created_at` / `updated_at` | timestamp | audit |

### 2. `gifts`
Katalog gift yang bisa di-*redeem*.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | UUID (PK) | primary key |
| `name` | varchar(200) | nama gift |
| `description` | text, nullable | deskripsi |
| `image` | varchar(500), nullable | URL gambar |
| `stock` | int | stok tersedia (dikurangi saat redeem) |
| `points_required` | int | poin yang dibutuhkan per 1 item |
| `is_hot` | boolean | flag label "Hot Item" |
| `is_new` | boolean | flag label "New" |
| `created_at` / `updated_at` | timestamp | audit + sorting by newest |

### 3. `redemptions`
Mencatat setiap transaksi redeem user terhadap gift. Tabel ini juga jadi *guard* — rating hanya boleh diberikan kalau ada baris redemption.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | UUID (PK) | primary key |
| `user_id` | UUID (FK → users) | siapa yang redeem |
| `gift_id` | UUID (FK → gifts) | gift yang di-redeem |
| `quantity` | int | jumlah item di-redeem |
| `points_spent` | int | total poin yang dipotong saat transaksi |
| `redeemed_at` | timestamp | waktu redeem |

### 4. `ratings`
Menyimpan rating + review user untuk gift. Wajib di-*link* ke `redemption_id` — 1 rating = 1 redemption.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | UUID (PK) | primary key |
| `user_id` | UUID (FK → users) | yang memberi rating |
| `gift_id` | UUID (FK → gifts) | gift yang di-rate |
| `redemption_id` | UUID (FK → redemptions) | bukti redeem |
| `rating` | numeric(3,2), CHECK `0 ≤ rating ≤ 5` | nilai bintang (desimal) |
| `review` | text, nullable | review teks opsional |
| `created_at` | timestamp | audit |

---

## Relasi

- **users → redemptions** *(one-to-many)* — 1 user bisa punya banyak redemption.
- **gifts → redemptions** *(one-to-many)* — 1 gift bisa di-*redeem* oleh banyak user.
- **users → ratings** *(one-to-many)* — 1 user bisa memberi rating ke banyak gift.
- **gifts → ratings** *(one-to-many)* — 1 gift bisa punya banyak rating.
- **redemptions → ratings** *(one-to-one logis)* — tiap rating wajib merujuk ke 1 redemption (memastikan user memang pernah redeem).

Semua foreign key pakai `ON DELETE CASCADE` — kalau user atau gift dihapus, redemption & rating yang terkait ikut terhapus (konsisten dengan *hard delete*).

---

## Design decisions

- **Kenapa `redemption_id` di `ratings`?**
  Supaya rating tidak bisa dibuat tanpa bukti redeem, enforce di level DB (FK NOT NULL), bukan hanya di service layer. Lebih robust kalau ada akses DB langsung.
- **Kenapa `points_spent` disimpan di `redemptions`?**
  *Snapshot* harga saat transaksi. Kalau admin ubah `points_required` di gifts, history transaksi tetap akurat.
- **Kenapa pakai `numeric(3,2)` untuk rating, bukan `float`?**
  Menghindari floating-point drift saat agregasi `AVG()`. Presisi cukup untuk skala 0–5 dengan 2 desimal.
- **Kenapa `is_hot` & `is_new` jadi kolom boolean terpisah?**
  Sesuai design UI (badge di card product), dan lebih mudah di-*filter* dibanding pakai enum tunggal.

---

## Index

| Tabel | Index | Tujuan |
| --- | --- | --- |
| `users` | unique `username`, unique `email` | lookup cepat saat login |
| `gifts` | `name`, `stock`, `created_at` | filter + sorting by newest |
| `redemptions` | composite `(user_id, gift_id)` | validasi "user sudah redeem gift ini" |
| `ratings` | composite `(user_id, gift_id)` + `gift_id` | agregasi `AVG(rating)` per gift |

Detail implementasi ada di migration [`1713600000000-InitialSchema.ts`](../src/database/migrations/1713600000000-InitialSchema.ts).
