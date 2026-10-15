# Backend Brief: WebSocket ile Paylaşılan Müşteri Konumu Talebe İşlenmiyor

> **Kimin için:** Backend ekibi (`yolpaketi-backend`).
> **Öncelik:** Yüksek. Doğrudan atamayı tamamen, SMS ile konum alınan pazaryeri taleplerini de büyük ihtimalle etkiliyor.

> **Güncelleme (acente paneli):** Panel akışı değiştirildi; artık bu hatadan etkilenmiyor.
> - "Müşteriden konum al" talep oluşturmuyor; `POST /location-share/init/` ile talepsiz bir token alıyor ve SMS'i bu token'la gönderiyor.
> - Talep, form tamamlanınca müşterinin konumuyla birlikte `location_method: "manual"` olarak oluşturuluyor. Bu sayede detay kaydı oluşturma anında yazılıyor.
>
> Hata yine de düzeltilmeli. API üzerinden `location_method: "customer_share"` kullanan istemciler (entegrasyonlar) hâlâ etkileniyor. #202 ve #203 için onarım da gerekiyor.

## Sorun

Acente, müşteriden konumu SMS linkiyle istiyor (`location_method: "customer_share"`). Müşteri konumu paylaşıyor; panel konumu ve fotoğrafları WebSocket'ten canlı alıyor. Ama talep backend'de konumsuz kalıyor.

**Örnekler:** Talep #202 ve #203. Akış #203'te uçtan uca tekrarlandı: SMS gitti, müşteri konumu ve fotoğrafı gönderdi, panelde "Müşteri konumu alındı" göründü. Ardından `available-drivers` yine 409 `LOCATION_REQUIRED` döndü.

Talep #202 (çekici, doğrudan atama). Müşteri konumu paylaştı. "Sürücü Ata" ekranında `GET /insurance/requests/202/available-drivers/` sürekli **409 `LOCATION_REQUIRED`** dönüyor ve panel "Müşterinin konumu bekleniyor" ekranında takılı kalıyor.

## Kök neden

- Müşteri web sayfası (`YolSepetiWeb/src/features/pickup/PickupSharePage.tsx`) konumu **WebSocket** ile gönderiyor: önce `share_location`, sonra `submit`. HTTP `.../submit/` ucu yalnızca yedek.
- WebSocket tarafında `apps/insurance/consumers.py` → `save_location()` iki şey yapıyor:
  - Konumu yalnızca `LocationShareToken` kaydına yazıyor.
  - Talebi `pending_location` → `pending` yapıyor.
  - **Hizmet detay kaydını (`TowTruckRequestDetails` vb.) oluşturmuyor.**
- Detay kaydını yalnızca HTTP `SubmitLocationView` oluşturuyor (`apps/insurance/views.py`, `_create_service_details`). Bunu da sadece talep hâlâ `pending_location` iken yapıyor. WebSocket durumu zaten `pending` yaptığı için HTTP yedeği sonradan çağrılsa bile detay oluşmuyor.
- `customer_location()` (`apps/insurance/services/agency_dispatch.py`) müşteri konumunu bu detay kaydından okuyor. Kayıt olmadığı için `None` dönüyor.

## Etkisi

1. **Doğrudan atama çalışmıyor:** SMS ile konum alınan her doğrudan talepte uygun sürücü listesi ve atama `LOCATION_REQUIRED` dönüyor.
2. **Pazaryeri talepleri sürücülere gitmiyor olabilir:** Yeni iş bildirimi detay kaydının `post_save` sinyaline bağlı (`apps/request/signals.py`). Detay hiç oluşmadığı için SMS ile konum alınan pazaryeri talepleri sürücülere bildirilmiyor; talepte alış adresi de yok. Canlıda kontrol edilmeli.
3. **Eksik uç:** Web'in yedek olarak çağırdığı `POST /insurance/location-share/{token}/finalize/` ucu backend'de yok, 404 döner.

## Hızlı düzeltme (minimal yama)

Kalıcı çözüm aşağıdaki "İstenen düzeltme" bölümünde. Acil durum için en küçük değişiklik şu: WebSocket `save_location()` içinde, talep `pending_location` → `pending` yapılırken HTTP ucunun yaptığı gibi detay kaydı da oluşturulur.

`apps/insurance/consumers.py` → `save_location()`:

```python
# Mevcut kodda yalnızca status degisiyor; detay kaydi da olusturulmali (SubmitLocationView ile ayni mantik)
from django.db import transaction
from .views import SubmitLocationView

with transaction.atomic():
    t.latitude, t.longitude, t.address = lat, lon, address
    t.save(update_fields=['latitude', 'longitude', 'address'])

    vr = t.vehicle_request
    if vr and vr.status == 'pending_location':
        vr.status = 'pending'
        vr.save(update_fields=['status'])

        stored = t.service_details_data or {}
        if stored:
            data = dict(stored.get('data', {}))
            data.update(pickup_latitude=lat, pickup_longitude=lon, pickup_address=address)
            insurance_request = getattr(vr, 'insurance_request', None)
            company = getattr(insurance_request, 'insurance_company', None)
            SubmitLocationView()._create_service_details(
                vr, stored.get('service_type'), data, stored.get('details', {}), company=company,
            )
```

Bu yama yeni talepleri düzeltir. Bozuk kalmış talepler (#202, #203) için yine de 3. maddedeki onarım gerekiyor.

## İstenen düzeltme

1. **Ortak servis.** Konum işleme tek bir fonksiyonda toplansın, örneğin `apps/insurance/services/location_share.py` içinde `apply_shared_location(share_token, latitude, longitude, address)`. Fonksiyon `transaction.atomic` içinde ve talep kilitlenerek çalışsın:
   - Token'a enlem, boylam ve adres yazılır. `is_used` alanına dokunulmaz; müşterinin fotoğraf yüklemesi sürer.
   - Talep `pending_location` durumundaysa → `pending` yapılır ve `service_details_data` kullanılarak detay kaydı oluşturulur. Alış koordinatları paylaşılan konumla değiştirilir. Bugünkü `SubmitLocationView` mantığı aynen taşınır.
   - Detay kaydı zaten varsa, yani müşteri konumu yeniden paylaştıysa, alış koordinatları ve adres güncellenir. Bu yalnızca talep henüz bir sürücüye geçmemişken yapılmalı: durum `pending` / `awaiting_approval` olmalı ve teklif kabul edilmemiş olmalı.
   - `CreateInsuranceRequestView` ve `SubmitLocationView` içinde kopya halinde duran `_create_service_details` de bu servise taşınabilir.
2. **İki giriş noktası da bu servisi çağırsın:**
   - WebSocket `save_location()` (`share_location` aksiyonu)
   - HTTP `SubmitLocationView`
3. **Bozuk kayıtların onarımı (tek seferlik).**
   - Hedef: durumu `pending` olan, `LocationShareToken` kaydında konumu dolu, ama detay kaydı olmayan talepler (#202 dahil).
   - Bu talepler için detay kaydı bir yönetim komutuyla (management command) oluşturulsun.
   - **Dikkat:** Detay oluşturmak yeni iş bildirimini tetikler. Eski pazaryeri talepleri için bildirimin gidip gitmeyeceğine karar verin; örneğin yalnızca son 24 saatteki ve iptal edilmemiş talepler onarılabilir.
4. **`finalize` ucu:** Web'in yedek olarak kullandığı `POST /insurance/location-share/{token}/finalize/` ucu eklensin (WebSocket `submit` ile aynı mantık). Ya da web'den bu yedek kaldırılsın.

## Test

1. SMS ile doğrudan talep açılır, müşteri sayfasından konum paylaşılır (WebSocket):
   - Talep `pending` olmalı ve `TowTruckRequestDetails` kaydı paylaşılan koordinatlarla oluşmalı.
   - `available-drivers` 200 dönmeli; panel birkaç saniye içinde sürücüleri listelemeli.
2. Aynı akış pazaryeri modunda: konum paylaşılınca uygun sürücülere yeni iş bildirimi gitmeli.
3. Müşteri konumu yeniden paylaşır: detaydaki alış koordinatları güncellenmeli, ikinci bir detay kaydı oluşmamalı.
4. HTTP yedeği (`.../submit/`) tek başına kullanıldığında bugünkü gibi çalışmalı.
5. Onarım komutundan sonra #202'de "Sürücü Ata" ekranı sürücüleri listelemeli.

---

## Ek: Çekici talebinde traktör hiçbir sürücüyle eşleşmiyor

`CreateInsuranceRequestView._create_service_details` (`apps/insurance/views.py`) çekici araç tipini normalize ederken traktörü `'traktor'` olarak kaydediyor:
- `type_map` içinde `'traktor': 'traktor'` var.
- `valid_types` içinde `'traktor'` var, `'tractor'` yok.

Sürücü aracındaki izinli değer ise `'tractor'` (`core/validators.py` → `validate_vehicle_types`). Uygunluk kontrolü `availibility_vehicles_types__contains=details.vehicle_type` olduğu için traktör talebi hiçbir sürücüyle eşleşmiyor. Ayrıca istemci doğrudan `'tractor'` gönderirse `valid_types` dışında kaldığı için `'car'` olarak kaydediliyor.

**İstenen:** Talep tarafında da `'tractor'` kullanılsın. `type_map` içinde `'traktor'`, `'traktör'` ve `'tractor'` değerlerinin hepsi `'tractor'`a eşlensin; `valid_types` içinde `'traktor'` yerine `'tractor'` olsun. Mevcut kayıtlarda `vehicle_type='traktor'` olan çekici talepleri `'tractor'` yapılsın.

Acente paneli bu düzeltme gelene kadar traktör seçeneğini göstermiyor. Panel artık backend'in kodlarını doğrudan gönderiyor: `car`, `suv`, `commercial`, `minibus`, `motorcycle`, `truck`. Önceden gönderdiği `pickup`, `van` ve `bus` değerleri tanınmadığı için `car` olarak kaydediliyordu.
