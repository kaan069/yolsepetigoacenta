# Backend Brief — Acente Paneli Canlı Görsel Galerisi (Sözleşme + Riskler)

Acente paneli (frontend) tarafı bitti. Aşağısı frontend'in backend'den **birebir beklediği** sözleşme ve netleşmesi gereken noktalar. ⚠️ ile işaretliler **bloklayıcı / mutlaka teyit**.

---

## 1. WebSocket — `wss://api.yolsepetigo.com/ws/location-share/{token}/?auth={accessToken}`

- Auth, **query param** olarak geçiyor: `?auth={acente_access_token}`. (Mevcut `location_received` böyle çalışıyordu — aynısı korunuyor.) ✅ Teyit: query-param auth hâlâ geçerli mi?
- Aynı sokette gelen event'ler (her biri JSON, `type` alanı zorunlu):

| type | Payload (alan adları **birebir** önemli) |
|---|---|
| `location_received` | `{ latitude, longitude, address }` — `latitude`/`longitude` **string** (frontend `parseFloat` yapıyor) |
| `image_uploaded` | `{ image_id: number, url: string, order: number }` |
| `image_deleted` | `{ image_id: number }` |
| `image_moderated` | `{ image_id: number, reason: string }` |
| `submission_completed` | `{ }` (sadece `type`) |

**⚠️ Dikkat — alan adı tutarlılığı:** WS event'lerinde görsel kimliği **`image_id`**. Ama `/status/` snapshot'ında (bkz. §2) görsel kimliği **`id`**. Frontend ikisini de bu şekilde bekliyor; backend her iki ucu da bu adlandırmayla göndermeli. Karıştırılırsa galeri eşleşmez (silme/dedupe çalışmaz).

---

## 2. HTTP — `GET /insurance/location-share/{token}/status/`

- **⚠️ Public kalmalı** (Bearer **yok**, token URL'de). Acente paneli bu endpoint'i auth header'sız çağırıyor (mevcut davranışla aynı).
- Frontend bunu hem ilk açılışta hem **her (re)connect'te** çağırıyor (kaçan event'leri yakalamak için) → **otoriter snapshot** olmalı.

Beklenen yanıt şeması (birebir):
```jsonc
{
  "location": { "lat": 41.0082, "lng": 28.9784, "address": "..." } | null,
  "images": [
    { "id": 12, "url": "https://.../x.jpg", "order": 0, "uploaded_at": "2026-06-03T12:34:00Z" }
  ],
  "image_count": 1,
  "max_images": 6,
  "is_used": false,
  "is_expired": false
}
```

**⚠️ KRİTİK 1 — `location` formatı:** Burada konum **nested obje** ve anahtarlar **`lat` / `lng`** (number). Eski `/status/` düz `latitude`/`longitude` (string) dönüyordu. Frontend artık `location.lat` / `location.lng` okuyor. Backend bunu **`{lat,lng,address}` objesi** döndürmezse → **panel yenilenince konum geri gelmez** (canlı WS konumu yine çalışır, sadece refresh-restore kırılır).
> Özetle iki farklı konvansiyon var, ikisi de kasıtlı: **WS `location_received`** → `latitude/longitude` (string); **`/status/`.location** → `lat/lng` (number). Lütfen ikisini de bu şekilde verin.

**⚠️ KRİTİK 2 — `is_used` semantiği:** Frontend `is_used: true`'yu **"müşteri Gönder'e bastı = finalize"** olarak yorumluyor → "Müşteri gönderdi" yeşil bandı + kartı kilitler + WS reconnect'i durdurur.
- Eski kullanımda `is_used` muhtemelen **"konum gönderildi"** anlamına geliyordu (polling fallback bunu konum geldi mi diye kullanıyordu).
- Bu çakışma çözülmeli: `is_used` **yalnızca finalize'da** mı true oluyor? Eğer sadece konum paylaşınca true oluyorsa panel **erkenden** "gönderildi" deyip kilitlenir. Konum-geldi ile finalize-oldu için **ayrı sinyaller** gerekiyor (`location != null` zaten konum-geldi'yi veriyor; `is_used`/`submission_completed` finalize olmalı).

- `image_count` ile `images.length` tutarlı olmalı (frontend seed olarak `image_count` alıp sonra dizi uzunluğundan türetiyor; çok sapmasın).
- `max_images` dolu gelmeli (UI "(n/max)" başlığı ve müşteri-tarafı limit bunu baz alacak).
- `url` **absolute** (zaten `build_absolute_uri` ile) ✅ — panel direkt `<img src>` kullanıyor.

---

## 3. WS yolu / refresh sonrası reconnect

- İlk `init` yanıtındaki `ws_url` ile panelin **refresh sonrası** kendi kurduğu yol **aynı** olmalı. Panel, yenilemede yalnızca `token`'ı saklıyor ve yolu şöyle kuruyor:
  `wss://api.yolsepetigo.com/ws/location-share/{token}/?auth={accessToken}`
- **⚠️ Teyit:** `init.ws_url` tam olarak `ws/location-share/{token}/` mi? Farklı bir prefix/format ise refresh sonrası reconnect yanlış adrese gider.

---

## 4. Görsel medya erişimi

- `url`'ler panelden (farklı origin) `<img>` ile yüklenecek. **Teyit:** medya URL'leri public erişilebilir mi (signed/expiring değil)? Süreli/imzalı ise panelin yükleyebilmesi için sürenin yeterli olması veya token içermesi gerekir.

---

## 5. Bloklayıcı maddelerin özeti (ekip bunlara cevap verirse uçtan uca çalışır)

1. **⚠️ `/status/`.location = `{lat,lng,address}` objesi** (flat `latitude/longitude` değil) — teyit/uygula.
2. **⚠️ `is_used` yalnızca finalize'da true** (konum paylaşımı ≠ finalize) — konum-geldi ile finalize ayrı sinyaller.
3. **⚠️ WS event alan adları**: `image_id` (WS) / `id` (status), `url`, `order`, `reason`; `submission_completed` yalnız `type`.
4. **⚠️ `/status/` public** + yeni alanları (`images`, `image_count`, `max_images`, `is_expired`) dönüyor.
5. **⚠️ WS yolu** `ws/location-share/{token}/` + `?auth=` query param ile auth.
6. Medya `url` public erişilebilir.

> Not: Bunlar yalnızca **acente paneli** içindir. Müşteri-tarafı upload/silme/finalize endpoint'leri ayrı bir brief'te (web ekibi) — backend'in oradaki açık soruları da netleştirmesi gerekiyor.
