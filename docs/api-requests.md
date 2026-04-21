# API Request Reference

Base URL: `http://localhost:3000/api`

Semua endpoint (kecuali yang ditandai **Public**) membutuhkan header:
```
Authorization: Bearer <accessToken>
```

Token didapat dari `POST /login`.

---

## Auth

### `POST /login` — Public

**Body**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Validasi**
| Field | Type | Rules |
| --- | --- | --- |
| `username` | string | required, non-empty |
| `password` | string | required, min 6 chars |

**Response 200**
```json
{
  "data": {
    "type": "resource",
    "id": "<user-uuid>",
    "attributes": {
      "accessToken": "eyJhbGciOi...",
      "user": {
        "username": "admin",
        "email": "admin@rgb.test",
        "role": "admin",
        "points": 1000000
      }
    }
  }
}
```

---

## Gifts

### `GET /gifts` — Public

**Query params** (semua optional)
| Param | Type | Default | Rules |
| --- | --- | --- | --- |
| `page` | int | `1` | min 1 |
| `limit` | int | `10` | min 1, max 100 |
| `sortBy` | enum | `newest` | `newest` \| `rating` |
| `order` | enum | `DESC` | `ASC` \| `DESC` |

**Contoh**
```
GET /gifts?page=1&limit=10&sortBy=rating&order=DESC
```

**Body**: — (tidak ada)

---

### `GET /gifts/:id` — Public

**Path param**: `id` = UUID gift.

**Body**: — (tidak ada)

---

### `POST /gifts` — Admin

**Body**
```json
{
  "name": "Samsung Galaxy S9 - Midnight Black 4/64 GB",
  "description": "Ukuran layar: 6.2 inci, RAM 6 GB, ROM 64 GB.",
  "image": "https://example.com/images/galaxy-s9.jpg",
  "stock": 25,
  "pointsRequired": 200000,
  "isHot": true,
  "isNew": true
}
```

**Validasi**
| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, non-empty |
| `description` | string | optional |
| `image` | string (URL) | optional |
| `stock` | int | required, min 0 |
| `pointsRequired` | int | required, min 0 |
| `isHot` | boolean | optional, default `false` |
| `isNew` | boolean | optional, default `false` |

---

### `PUT /gifts/:id` — Admin

Full replace — body sama persis dengan `POST /gifts`. Semua field required kecuali yang ditandai optional.

**Body**
```json
{
  "name": "Samsung Galaxy S9 - Coral Blue 4/64 GB",
  "description": "Varian warna Coral Blue.",
  "image": "https://example.com/images/galaxy-s9-blue.jpg",
  "stock": 10,
  "pointsRequired": 200000,
  "isHot": false,
  "isNew": false
}
```

---

### `PATCH /gifts/:id` — Admin

Partial update — semua field optional, kirim yang mau diubah saja.

**Body — contoh update stock saja**
```json
{
  "stock": 50
}
```

**Body — contoh update beberapa field**
```json
{
  "stock": 50,
  "pointsRequired": 180000,
  "isHot": true
}
```

---

### `DELETE /gifts/:id` — Admin

**Body**: — (tidak ada)

**Response 200**
```json
{
  "data": {
    "type": "gifts",
    "id": "<gift-uuid>",
    "attributes": {
      "message": "Gift \"Samsung Galaxy S9 - Midnight Black 4/64 GB\" has been deleted successfully"
    }
  }
}
```

---

### `POST /gifts/:id/redeem` — Authenticated

**Body**
```json
{
  "quantity": 1
}
```

**Validasi**
| Field | Type | Rules |
| --- | --- | --- |
| `quantity` | int | optional, min 1, default `1` |

**Rules bisnis**
- Stock gift harus >= `quantity`, kalau tidak → `400 Insufficient stock`.
- User points harus >= `pointsRequired * quantity`, kalau tidak → `400 Insufficient points`.
- Operasi atomic (transaction + pessimistic lock).

**Contoh redeem banyak sekaligus**
```json
{
  "quantity": 3
}
```

---

### `POST /gifts/:id/rating` — Authenticated

**Body**
```json
{
  "rating": 4.5,
  "review": "Kualitas bagus, pengiriman cepat."
}
```

**Validasi**
| Field | Type | Rules |
| --- | --- | --- |
| `rating` | number | required, min 0, max 5 |
| `review` | string | optional, max 1000 chars |

**Rules bisnis**
- User harus sudah pernah redeem gift ini, kalau belum → `403 You can only rate gifts you have redeemed`.

---

## Users (Bonus — Admin only)

### `POST /users` — Admin

**Body**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "user",
  "points": 100000
}
```

**Validasi**
| Field | Type | Rules |
| --- | --- | --- |
| `username` | string | required, non-empty |
| `email` | string | required, valid email |
| `password` | string | required, min 6 chars |
| `role` | enum | optional, `admin` \| `user`, default `user` |
| `points` | int | optional, min 0, default 0 |

---

### `GET /users` — Admin

**Body**: — (tidak ada)

---

### `GET /users/:id` — Admin

**Path param**: `id` = UUID user.

**Body**: — (tidak ada)

---

### `PATCH /users/:id` — Admin

Partial update — semua field optional.

**Body — contoh tambah points**
```json
{
  "points": 500000
}
```

**Body — contoh ganti password & role**
```json
{
  "password": "newsecret",
  "role": "admin"
}
```

---

### `DELETE /users/:id` — Admin

**Body**: — (tidak ada)

**Response 200**
```json
{
  "data": {
    "type": "users",
    "id": "<user-uuid>",
    "attributes": {
      "message": "User \"johndoe\" has been deleted successfully"
    }
  }
}
```

---

## Error Response Shape

Semua error mengikuti [JSON API](https://jsonapi.org) format:

```json
{
  "errors": [
    {
      "status": "400",
      "title": "BadRequestException",
      "detail": "Insufficient stock (available: 0)",
      "source": { "pointer": "/api/gifts/<uuid>/redeem" }
    }
  ]
}
```

Validation error (multiple detail):
```json
{
  "errors": [
    {
      "status": "400",
      "title": "BadRequestException",
      "detail": [
        "username should not be empty",
        "password must be longer than or equal to 6 characters"
      ],
      "source": { "pointer": "/api/login" }
    }
  ]
}
```

---

## Quick Test Flow (curl)

```bash
# 1. Login sebagai admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.attributes.accessToken')

# 2. List gifts (public)
curl http://localhost:3000/api/gifts?limit=5

# 3. Create gift (admin)
curl -X POST http://localhost:3000/api/gifts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Gift","stock":10,"pointsRequired":5000}'

# 4. Redeem gift (authenticated)
GIFT_ID=<uuid>
curl -X POST http://localhost:3000/api/gifts/$GIFT_ID/redeem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":1}'

# 5. Rate gift (harus sudah redeem)
curl -X POST http://localhost:3000/api/gifts/$GIFT_ID/rating \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":4.5,"review":"Great product"}'
```
