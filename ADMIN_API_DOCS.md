# Admin Panel API - Frontend Dokümantasyonu

**Base URL:** `https://api.yolsepetigo.com/my-admin`
**Auth:** Tüm endpointler `IsAuthenticated` + `is_staff` gerektirir. Header'da JWT token gönderilmeli.

```
Authorization: Bearer <access_token>
```

---

## 1. Request Detay

```
GET /my-admin/requests/{request_id}/
```

### Response

```json
{
  "id": 123,
  "requested_service_type": "towTruck",
  "customer": {
    "name": "Ahmet Yılmaz",
    "phone": "+905551234567"
  },
  "driver": {
    "id": 1,
    "name": "Mehmet Kaya",
    "phone": "+905559876543",
    "tc_no": "12345678901"
  },
  "status": "in_progress",
  "estimated_price": "1500.00",
  "driver_earnings": "1200.00",
  "platform_commission": "300.00",
  "pricing_breakdown": { ... },
  "accepted_vehicle_id": 45,
  "accepted_vehicle_type": "cekici",
  "accepted_at": "2026-02-15T10:30:00Z",
  "created_at": "2026-02-15T09:00:00Z",
  "updated_at": "2026-02-15T10:30:00Z",
  "tracking": {
    "token": "abc-123-def",
    "is_active": true,
    "expires_at": "2026-02-16T10:30:00Z",
    "url": "/location/abc-123-def"
  },
  "service_details": { ... },
  "offers": [
    {
      "id": 1,
      "driver_id": 1,
      "driver_name": "Mehmet Kaya",
      "driver_phone": "+905559876543",
      "vehicle_type": "cekici",
      "estimated_price": "1500.00",
      "driver_earnings": "1200.00",
      "platform_commission": "300.00",
      "status": "accepted",
      "created_at": "2026-02-15T09:15:00Z"
    }
  ],
  "location_logs": [
    {
      "latitude": 41.0082,
      "longitude": 28.9784,
      "recorded_at": "2026-02-15T11:04:00+03:00"
    },
    {
      "latitude": 41.0091,
      "longitude": 28.9799,
      "recorded_at": "2026-02-15T11:02:00+03:00"
    }
  ],
  "location_logs_count": 25,
  "customer_location": {
    "pickup_latitude": 41.0150,
    "pickup_longitude": 28.9500,
    "pickup_address": "Kadıköy, İstanbul",
    "dropoff_latitude": 41.0800,
    "dropoff_longitude": 29.0100,
    "dropoff_address": "Beşiktaş, İstanbul"
  },
  "location_warning": {
    "active": true,
    "last_notification_sent_at": "2026-02-15T11:10:00+03:00",
    "last_location_log_at": "2026-02-15T11:04:00+03:00"
  }
}
```

### `customer_location` Alanı - Servis Tipine Göre Değişir

**Çekici (`towTruck`), Ev-Ev Nakliye (`homeToHomeMoving`), Şehirlerarası (`cityToCity`):**
```json
{
  "pickup_latitude": 41.0150,
  "pickup_longitude": 28.9500,
  "pickup_address": "Kadıköy, İstanbul",
  "dropoff_latitude": 41.0800,
  "dropoff_longitude": 29.0100,
  "dropoff_address": "Beşiktaş, İstanbul"
}
```

**Vinç (`crane`), Yol Yardım (`roadAssistance`):**
```json
{
  "latitude": 41.0150,
  "longitude": 28.9500,
  "address": "Kadıköy, İstanbul"
}
```

> **Not:** `location_logs` en son 100 kayıt döner (en yeniden eskiye sıralı). `location_logs_count` toplam kayıt sayısıdır.

---

## 2. Konum Logları (Detaylı)

```
GET /my-admin/requests/{request_id}/location-logs/
```

### Response

```json
{
  "request_id": 123,
  "count": 25,
  "customer_location": {
    "pickup_latitude": 41.0150,
    "pickup_longitude": 28.9500,
    "pickup_address": "Kadıköy, İstanbul",
    "dropoff_latitude": 41.0800,
    "dropoff_longitude": 29.0100,
    "dropoff_address": "Beşiktaş, İstanbul"
  },
  "logs": [
    {
      "id": 1,
      "latitude": 41.0082,
      "longitude": 28.9784,
      "recorded_at": "2026-02-15T11:04:00+03:00"
    },
    {
      "id": 2,
      "latitude": 41.0091,
      "longitude": 28.9799,
      "recorded_at": "2026-02-15T11:02:00+03:00"
    }
  ]
}
```

> **Not:** Bu endpoint TÜM logları döner (limit yok). En yeniden eskiye sıralı.

---

## 3. Tamamlama Denetim Logları

```
GET /my-admin/requests/{request_id}/completion-log/
```

### Response

```json
{
  "request_id": 123,
  "logs": [
    {
      "id": 1,
      "completed_by": "driver",
      "completion_method": "tracking_token",
      "token_used": "abc123",
      "ip_address": "192.168.1.1",
      "timestamp": "2026-02-15T12:00:00+03:00"
    }
  ]
}
```

| Alan | Tip | Açıklama |
|------|-----|----------|
| `completed_by` | string | Kim tamamladı (`driver`, `customer`, `admin`) |
| `completion_method` | string | Nasıl tamamlandı (`tracking_token`, `completion_code`, `admin_override`) |
| `token_used` | string/null | Kullanılan token |
| `ip_address` | string/null | IP adresi |
| `timestamp` | ISO 8601 | Tamamlanma zamanı |

---

## 4. Request Durumu Güncelle

```
PATCH /my-admin/requests/{request_id}/status/
```

### Request Body

```json
{
  "status": "in_progress",
  "reason": "Manuel onay"
}
```

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `status` | Evet | Yeni durum |
| `reason` | Hayır | Değişiklik sebebi |

**Geçerli status değerleri:**
`pending`, `awaiting_approval`, `awaiting_payment`, `in_progress`, `completed`, `cancelled`

### Response

```json
{
  "success": true,
  "message": "Request durumu güncellendi: pending -> in_progress",
  "request_id": 123,
  "old_status": "pending",
  "new_status": "in_progress"
}
```

---

## 5. Request İptal Et

```
POST /my-admin/requests/{request_id}/cancel/
```

---

## 6. Request Listesi

```
GET /my-admin/requests/
```

### Query Params

| Param | Tip | Açıklama |
|-------|-----|----------|
| `status` | string | Filtre: `pending`, `awaiting_approval`, `in_progress`, `completed`, `cancelled` |
| `service_type` | string | Filtre: `towTruck`, `crane`, `roadAssistance`, `homeToHomeMoving`, `cityToCity` |
| `search` | string | Telefon veya isim ile arama |
| `date_from` | YYYY-MM-DD | Tarih filtresi (başlangıç) |
| `location_warning` | string | `true`: sadece konum uyarısı olan işler, `false`: olmayan işler |

### Response (her item'da)

```json
{
  "id": 123,
  "requested_service_type": "towTruck",
  "status": "in_progress",
  "location_warning_active": true,
  ...
}
```

---

## 7. İstatistikler

```
GET /my-admin/requests/stats/
```

### Response (requests objesi içinde)

```json
{
  "requests": {
    "total": 150,
    "pending": 10,
    "awaiting_approval": 5,
    "in_progress": 8,
    "completed": 120,
    "cancelled": 7,
    "location_warnings": 2,
    ...
  }
}
```

`location_warnings`: Şu anda konum uyarısı aktif olan `in_progress` iş sayısı.

---

## Konum Takip Akışı (WebSocket)

Gerçek zamanlı araç konumu WebSocket üzerinden gelir:

```
ws://api.yolsepetigo.com/ws/location/{tracking_token}/
```

- **Müşteri (auth yok):** Sadece `tracking_token` ile bağlanır, konum dinler
- **Sürücü (JWT auth):** `ws://…/ws/location/{tracking_token}/?auth={jwt_token}` ile bağlanır, konum gönderir

### WebSocket Mesajları

**Bağlantı kuruldu:**
```json
{
  "type": "connection_established",
  "request_id": 123,
  "current_status": {
    "status": "in_progress",
    "latitude": 41.0082,
    "longitude": 28.9784,
    "timestamp": "2026-02-15T11:04:00+03:00"
  },
  "is_driver": false,
  "message": "WebSocket bağlantısı kuruldu"
}
```

**Konum güncellemesi (dinleme):**
```json
{
  "type": "location_update",
  "request_id": 123,
  "latitude": 41.0091,
  "longitude": 28.9799,
  "message": "Araç konumu güncellendi"
}
```

---

## Konum Uyarı Sistemi (Location Warning)

Sürücü `in_progress` bir işte 6 dakika (3 x 2dk interval) konum göndermezse:

1. **Sürücüye FCM push**: "Lütfen konum bilginizi aktif hale getirin" (15 dk cooldown)
2. **Admin API'de görünür**: `location_warning.active: true` + `location_warning_active: true`

### `location_warning` Objesi (Detail endpoint)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `active` | boolean | Uyarı aktif mi? |
| `last_notification_sent_at` | ISO 8601 / null | Son FCM bildirim zamanı |
| `last_location_log_at` | ISO 8601 / null | Son konum log zamanı |

### Frontend Kullanımı

- **Liste sayfası**: `location_warning_active: true` olan satırları kırmızı/turuncu ile vurgula
- **Filtre**: `?location_warning=true` ile sadece uyarılı işleri getir
- **Detay sayfası**: `location_warning.active` ise uyarı banner'ı göster
- **Dashboard**: `stats.requests.location_warnings` sayısını göster
- Konum tekrar geldiğinde uyarı otomatik sıfırlanır (polling ile güncel kalır)

---

## Notlar

- Konum logları sadece request durumu `in_progress` iken kaydedilir (2 dk aralıkla)
- `customer_location` alanı servis tipine göre farklı yapıda gelir (pickup/dropoff vs tek konum)
- `location_logs` request detail'de son 100 kayıt döner; tamamı için `/location-logs/` endpoint kullanılmalı
- Tüm tarih alanları ISO 8601 formatında, **Türkiye saatinde** (+03:00) gelir
