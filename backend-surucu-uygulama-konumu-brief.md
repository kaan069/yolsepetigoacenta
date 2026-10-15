# Backend Brief: Sürücü Uygulama Konumu (Yeni Yapı)

> **Kimin için:** Backend ekibi (`yolpaketi-backend`).
> **İlgili:** Mobil ekip için ayrı brief: `mobil-surucu-uygulama-konumu-brief.md`.

## Amaç

Acente panelinde sürücü, canlı konumu yerine iş adresiyle görünüyor. Örnek: sürücü İstanbul'da uygulamaya girdi, panelde iş adresi olan Erzurum göründü. Sebep, boştaki sürücünün konumunun backend'e hiç gelmemesi.

Çözüm olarak sürücü uygulaması iki durumda yalnızca enlem ve boylam gönderecek:
- uygulamaya girildiğinde
- uygulama açıkken 30 dakikada bir

Bu konum ayrı bir yerde tutulacak ve acente haritası onu kullanacak. Yeni yapının tek işi bu: konumu almak ve saklamak. Aktif iş takibine (`VehicleLocation`, `DriverLocationLog`, `DriverLastLocation`) dokunmayacak.

**Bugünkü durum:**
- `driver_position()` (`apps/insurance/services/agency_dispatch.py`) yalnızca `DriverLastLocation` kaydını okuyor. Bu kayıt 30 dakikadan eskiyse iş adresine düşüyor.
- `DriverLastLocation` kaydını yalnızca iki yer yazıyor:
  - aktif iş (`maybe_log_location`)
  - `POST /vehicles/location/heartbeat/` ucu. Sürücü uygulaması bu ucu hiç çağırmıyor.
- `user_is_online` alanının varsayılanı `True` ve bu alan hiç kendiliğinden kapanmıyor.

## 1. Model: `DriverAppLocation` (`apps/vehicles/models.py`)

Her sürücü için tek kayıt tutulur (OneToOne). Yeni konum gelince kayıt güncellenir.

| Alan | Tip | Not |
|---|---|---|
| `user` | OneToOne → `UserBase`, `related_name='app_location'` | |
| `latitude`, `longitude` | `Decimal(9, 6)` | |
| `accuracy_m` | `Float`, boş olabilir | Telefonun bildirdiği doğruluk (metre) |
| `trigger` | `Char`: `app_open` / `foreground` / `online` / `periodic` | Konumun hangi durumda gönderildiği; hata ayıklamak için |
| `updated_at` | `DateTime`, indeksli | |

Migration gerekiyor. Model admin paneline de eklensin; sürücü, konum, tetikleyici ve zaman listelensin. Bugünkü gibi sorunlar oradan kolayca görülebilir.

## 2. Uç: `POST /vehicles/location/app-ping/`

- **Yetki:** Sürücü JWT'si. Sürücü olmayan hesaplara 403.
- **Gövde:**
  ```json
  { "latitude": 41.0123, "longitude": 29.0456, "trigger": "app_open", "accuracy": 18.5 }
  ```
  `trigger` ve `accuracy` isteğe bağlı. `trigger` gelmezse `periodic` sayılır.
- **Yanıt:** `200 { "status": "ok", "updated_at": "..." }`
- **Hatalar:**
  - 400: geçersiz koordinat. Mevcut `valid_coord` yardımcısı kullanılabilir.
  - 429: hız sınırı aşıldı. Sınır dakikada 6 istek; uygulama zaten seyrek gönderecek.
- Uç **yalnızca** `DriverAppLocation` kaydını günceller. Başka hiçbir şeyi tetiklemez.

## 3. Acente haritasında konum seçimi (`driver_position()`)

Yeni kural:

1. `DriverLastLocation` (aktif iş) ile `DriverAppLocation` kayıtlarından **daha yeni olanı** alınır.
2. Konumun yaşına göre:

| Yaş | `source` |
|---|---|
| ≤ `AGENCY_LIVE_LOCATION_MAX_AGE_MINUTES` | `live` |
| ≤ `AGENCY_LAST_KNOWN_MAX_AGE_HOURS` (yeni ayar, varsayılan 24) | **`last_known`** (yeni değer), `updated_at` dolu |
| Daha eski ya da hiç konum yok | `business` (iş adresi), o da yoksa `null` |

- `AGENCY_LIVE_LOCATION_MAX_AGE_MINUTES` varsayılanı **30'dan 45'e** çıksın. Uygulama 30 dakikada bir gönderecek; 45, bir gecikmeyi tolere eder.
- Kural hem `GET /insurance/drivers/` hem `GET /insurance/requests/{id}/available-drivers/` için geçerli olsun.
- Mesafe ve sıralama seçilen konumla yapılsın.

Örnek:

```json
"location": { "latitude": 41.01, "longitude": 28.97, "source": "last_known", "updated_at": "2026-10-15T08:10:00Z" }
```

## 4. Çevrimiçi durumu (yalnızca acente tarafında)

- Acente uçlarında sürücü şu durumda çevrimiçi sayılsın: `user_is_online` açık **ve** 3. maddedeki en yeni konum `AGENCY_ONLINE_MAX_SILENCE_MINUTES` içinde gelmiş.
- Bu ayar yeni. Varsayılanı 45 olsun; `0` kuralı kapatsın.
- Kural `serialize_driver().is_online` alanına ve atama listesindeki çevrimiçi filtresine (`include_offline=0`) uygulansın.
- `user_is_online` alanının kendisine dokunulmasın; pazaryeri akışı bu alanı kullanıyor.

## 5. Yanıtlara ham konum (isteğe bağlı)

Havuz ve atama listesi yanıtlarına şu alan eklensin:

```json
"app_location": { "latitude": 41.0, "longitude": 29.0, "updated_at": "...", "trigger": "app_open" }
```

Yoksa `null` döner. Panel, sürücü iş adresine düşmüş olsa bile "son görülme" bilgisini gösterebilir.

## Yayın sırası

1. Backend: 1, 2, 3 ve 5. maddeler yayına alınır. `AGENCY_ONLINE_MAX_SILENCE_MINUTES=0` ile başlanır, yani çevrimiçi kuralı kapalı. Eski uygulamalar bu değişiklikten etkilenmez.
2. Mobil yeni sürümü yayınlar.
3. Uygulama yayıldıktan sonra ayar 45'e çekilir.

**Erken açılırsa** bütün sürücüler çevrimdışı görünür ve atama haritası boş kalır.

Mevcut `POST /vehicles/location/heartbeat/` ucu kalabilir; mobil artık bu ucu kullanmayacak.

**Acente paneli:** `last_known` değeri için yeni bir etiket ("Son konum · 3 sa önce") ve haritada ayrı renkte pin gösterecek. **3. maddenin yayın tarihini panel ekibine bildirin.**

## Test

1. `app-ping` çağrılsın: admin'de kayıt oluşmalı. Havuzda `source: "live"` ve kural açıksa `is_online: true` dönmeli.
2. `updated_at` 2 saat geriye çekilsin: `last_known` dönmeli. Kural açıksa `is_online: false` dönmeli.
3. 25 saat geriye çekilsin: `business` dönmeli.
4. Aktif işteki sürücüde iş konumu daha yeni ise o kullanılmalı.
5. Geçersiz koordinat 400, sürücü olmayan hesap 403, dakikada 6'dan fazla istek 429 dönmeli.
6. `AGENCY_ONLINE_MAX_SILENCE_MINUTES=0` iken çevrimiçi davranışı bugünküyle aynı olmalı.
