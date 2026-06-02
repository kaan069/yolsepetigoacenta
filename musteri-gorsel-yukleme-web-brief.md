# Web Ekibi Brief'i — Müşteri Konum-Paylaşım Sayfasına Araç Görseli Yükleme

**Hedef proje:** Müşteriye SMS ile giden link → `https://yolsepetigo.com/konum-paylas/{token}` (müşteri web sitesi — YolSepetiWeb).
**İlgili sayfa:** `konum-paylas/:token` (şu an yalnızca konum paylaşımı yapıyor).
**Tarih:** 2026-06-03

---

## 1. Bağlam / Neden

Bugün müşteri, SMS'teki linke tıklayıp **konumunu** paylaşıyor; acente paneli bu konumu canlı (WebSocket) alıp talebi oluşturuyor.

Yeni gereksinim: müşteri aynı sayfadan **aracının fotoğraflarını da** yükleyebilsin. Acente paneli tarafında bu fotoğrafları **canlı galeri** olarak gösteren geliştirme **tamamlandı** (acente paneli artık `image_uploaded / image_deleted / image_moderated / submission_completed` WS event'lerini dinliyor ve `GET /status/` snapshot'ını okuyor).

**Eksik olan tek parça:** müşteri-tarafı sayfada (sizin projenizde) fotoğraf **yükleme / silme / "Gönder"** akışının eklenmesi. Bu brief o işi tarif ediyor.

> **Not:** Görsel yükleme **HTTP** ile yapılır (multipart/form-data), WebSocket ile değil. WS yalnızca acente panelinin canlı güncelleme alması içindir ve backend tarafından otomatik tetiklenir — müşteri sayfasının WS ile işi yoktur.

---

## 2. Mevcut durum (bugünkü müşteri akışı)

`konum-paylas/{token}` sayfası:
1. URL'den `token` alır.
2. "Konumumu Paylaş" → tarayıcı geolocation izni → `POST /insurance/location-share/{token}/submit/` body `{ latitude, longitude }`.
3. Başarılıysa "Konumunuz iletildi" ekranı.

Bu akış **korunur**. Görsel akışı bunun üstüne eklenir.

---

## 3. Eklenecek müşteri akışı (önerilen UX)

```
1) Konum paylaş            (mevcut — değişmez)
2) Araç fotoğrafı yükle    (YENİ — 1..max adet)
      ┌──────────────────────────────┐
      │  📷 Araç Fotoğrafları (2/6)   │
      │  [thumb][thumb][+ Ekle]       │   ← her thumb'da "sil" (×)
      │  "Net ve farklı açılardan…"   │
      └──────────────────────────────┘
3) "Gönder" butonu         (YENİ — talebi finalize eder)
      → başarı ekranı: "Gönderildi, teşekkürler"
```

Davranış kuralları:
- Fotoğraf yükleme **konumdan sonra** açılsın (çekicinin gelebilmesi için konum zorunlu, fotoğraf opsiyonel-ama-teşvik edilen).
- Aynı anda birden fazla seçim desteklensin (`<input type="file" accept="image/*" multiple capture="environment">`); her dosya tek tek POST edilir.
- `image_count >= max_images` olduğunda "+ Ekle" pasifleşsin ve "En fazla {max} görsel" uyarısı.
- Her thumbnail'da silme (×) → ilgili DELETE çağrısı.
- "Gönder" → finalize endpoint'i → başarı ekranı; sonrasında sayfa **kilitlenir** (tekrar yükleme/silme kapalı).
- Mobil öncelikli tasarım (müşteriler telefondan açıyor). `capture="environment"` ile arka kameradan çekim kolaylığı.

---

## 4. API Sözleşmesi

> ⚠️ **Backend ile netleştirilecek alanlar aşağıda `[backend doğrula]` ile işaretli.** Path'ler tahmini; gerçek path'leri backend ekibi versin.

### 4.1 Snapshot (baseline / yeniden yükleme) — NET
`GET /insurance/location-share/{token}/status/` (auth yok, public)

Yanıt:
```jsonc
{
  "location": { "lat": 41.0082, "lng": 28.9784, "address": "..." } | null,
  "images": [
    { "id": 12, "url": "https://.../media/...jpg", "order": 0, "uploaded_at": "2026-06-03T12:34:00Z" }
  ],
  "image_count": 1,
  "max_images": 6,
  "is_used": false,     // true => talep finalize edilmiş (Gönder'e basılmış)
  "is_expired": false   // true => link süresi dolmuş
}
```
- `url` **tam (absolute) URL'dir** (`request.build_absolute_uri`) — `MEDIA_URL` ile prepend ETMEYİN, doğrudan `<img src={url}>` kullanın.
- Sayfa açılışında bu endpoint ile mevcut durumu çekin (müşteri sayfayı yenilerse yüklediği fotoğraflar geri gelsin).

### 4.2 Konum gönder — NET (mevcut)
`POST /insurance/location-share/{token}/submit/` · body `{ latitude, longitude }`

### 4.3 Görsel yükle — `[backend doğrula]` path
`POST /insurance/location-share/{token}/images/`  ← **tahmini path**
- Content-Type: `multipart/form-data`
- Alan adı: **`image`** (tek dosya) — backend notu bu alan adını veriyor.
- Yanıt (beklenen): yüklenen görsel `{ id, url, order, uploaded_at }`.
- Backend bunu alınca acente paneline otomatik `image_uploaded` WS event'i yollar (sizin işiniz değil).

### 4.4 Görsel sil — `[backend doğrula]` path
`DELETE /insurance/location-share/{token}/images/{image_id}/`  ← **tahmini path**
- Başarılıysa görseli listeden çıkarın.
- Backend → acente paneline `image_deleted` WS event'i.

### 4.5 Finalize / "Gönder" — `[backend doğrula]` path
`POST /insurance/location-share/{token}/complete/`  ← **tahmini path** (veya mevcut `/submit/` finalize de ediyor olabilir)
- Bu çağrı `submission_completed`'i tetikler ve `is_used=true` yapar.
- **Backend'e sorulacak:** finalize ayrı bir endpoint mi, yoksa konum `/submit/` çağrısı mı finalize ediyor? Fotoğraflar konumdan ayrı, sonradan yükleneceği için **ayrı bir finalize** endpoint'i olması beklenir.

---

## 5. Doğrulama / kısıtlar (`[backend doğrula]` — limitleri teyit edin)

- **Maks. adet:** `status.max_images` (UI bunu baz alsın, hardcode etmeyin).
- **Dosya tipi:** sadece görsel (`image/jpeg`, `image/png`, `image/webp`?) — istemcide `accept="image/*"` + tip kontrolü.
- **Maks. boyut:** ör. 10 MB/dosya? Büyükse istemcide uyarı (ve ideal: yüklemeden önce client-side resize/compress — mobil fotoğraflar 5–12 MB olabilir).
- **Token durumları:** `is_expired` → yükleme kapalı, "Link süresi doldu" mesajı. `is_used` → akış bitmiş, "Gönderildi" ekranı.
- Yükleme sırasında her thumbnail için **yükleniyor** göstergesi; hata olursa o dosya için tekrar-dene.

---

## 6. UI Durumları (state machine)

| Durum | Tetik | Görünüm |
|---|---|---|
| `idle` | sayfa açıldı, `/status/` çekiliyor | spinner |
| `ready` | konum yok | "Konumumu Paylaş" (mevcut) |
| `locationDone` | konum gönderildi / snapshot'ta `location` var | fotoğraf yükleme bölümü açılır |
| `uploading` | dosya POST ediliyor | thumbnail iskelet + progress |
| `expired` | `is_expired` | kırmızı "Link süresi doldu", tüm aksiyonlar kapalı |
| `submitted` | "Gönder" başarılı / `is_used` | yeşil "Gönderildi, teşekkürler", sayfa kilitli |

---

## 7. Acente paneli tarafı (referans — sizin yapmanıza gerek yok)

Bilgi olsun diye: müşteri sayfasından yapılan her HTTP aksiyonu, backend tarafından acente paneline aynı WS kanalından (`location_share_{token}` grubu) canlı yansıtılıyor:

| Müşteri aksiyonu (HTTP) | Backend → Acente WS event | Acente panelinde |
|---|---|---|
| Konum gönder | `location_received` | Harita/adres dolar |
| Görsel yükle | `image_uploaded {image_id, url, order}` | Galeriye yeni thumbnail |
| Görsel sil | `image_deleted {image_id}` | Galeriden kalkar |
| (Admin moderasyon) | `image_moderated {image_id, reason}` | Galeriden kalkar + uyarı |
| "Gönder" | `submission_completed {}` | "Müşteri gönderdi" + kart kilitlenir |

---

## 8. Backend'e sorulacak açık sorular (handoff öncesi netleşmeli)

1. **Görsel yükleme** endpoint path'i ve tam yanıt şeması? (alan adı `image` teyitli)
2. **Görsel silme** endpoint path'i ve metodu (DELETE mi POST mu)?
3. **Finalize/"Gönder"** ayrı endpoint mi, yoksa `/submit/` mi finalize ediyor? `is_used` ne zaman `true` oluyor?
4. **max_images, izinli MIME tipleri, maks. dosya boyutu** kesin değerleri?
5. Yükleme **auth gerektiriyor mu**? (Konum `/submit/` gibi token-in-URL public mi?)
6. Süre dolmuş/finalize olmuş token'a yükleme denenirse dönen **HTTP hata kodu** (403/409?) — UI'da doğru mesaj için.

---

### Özet
Müşteri sayfasına: (a) `/status/` ile baseline, (b) `image` alanlı multipart POST ile yükleme, (c) DELETE ile silme, (d) finalize "Gönder" eklenecek. `url` alanları absolute — direkt kullanın. WS müşteri tarafında yok. Yukarıdaki 6 maddeyi backend ile netleştirip path'leri sabitleyin.
