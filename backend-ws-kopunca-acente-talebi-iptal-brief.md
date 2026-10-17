# Backend Brief: Takip WebSocket'i kapanınca acente talebi iptal oluyor

> **Kimin için:** Backend ekibi (`yolpaketi-backend`).
> **Öncelik:** Yüksek. Acentenin pazaryerine açtığı ve sürücü beklediği talepler kendiliğinden iptal oluyor.
> **İncelenen kod:** `main` @ `379cf04`.

> **Durum:** Çözüldü (`2406ec9`). Acente talepleri artık WebSocket kopmasıyla iptal edilmiyor. "Yan etki: yarım iptal" bölümündeki öneri (müşteri otomatik iptalinin `cancel_unpaid_request` üzerinden yapılması) uygulanmadı; acente talebini etkilemiyor.

## Sorun

Acente panelinde "Pazaryerine aç"a basılınca talep birkaç saniye içinde **iptal** durumuna düşüyor. Aynı şey, talep `pending` durumundayken panelde talebin ekranından ayrılınca da oluyor:
- sayfa değiştirmek,
- sekmeyi kapatmak,
- ağ kopması ya da bilgisayarın uykuya geçmesi.

## Kök neden

`apps/request/consumers/requests.py` → `RequestStatusConsumer.disconnect()`:

```python
async def disconnect(self, close_code):
    # Auto-cancel if request is still pending (searching for driver)
    if hasattr(self, 'request_id'):
        await self.auto_cancel_pending_request()
```

`auto_cancel_pending_request()` talebin durumu `pending` ise talebi doğrudan `cancelled` yapıyor. Bu kural `0468a3c` (2025-11-09) ile müşteri uygulaması için eklendi; amaç, müşteri "sürücü aranıyor" ekranından çıkarsa talebi iptal etmek.

Acente paneli de aynı kanalı (`ws/requests/{tracking_token}/`) dinliyor. Teklifler (`new_offer`) ve doğrudan atama olayları (`agency_assignment`) yalnızca bu kanaldan geliyor. Bu kanalı iki ekran kullanıyor:
- Sürücü Ata ekranı,
- talep detayı.

Pazaryerine açma akışı:

1. Sürücü Ata ekranında WebSocket açık; talep `pending`.
2. `POST /insurance/requests/{id}/open-to-marketplace/` → `open_to_marketplace()` bekleyen atamayı kapatıyor ve `dispatch_mode`'u değiştiriyor. **Talep durumuna dokunmuyor**, talep `pending` kalıyor.
3. Panel talep detayına geçiyor; Sürücü Ata ekranının WebSocket'i kapanıyor.
4. `disconnect()` → talep hâlâ `pending` → **`cancelled`**.

Aynı mekanizma şu durumlarda da talebi iptal ediyor:
- Pazaryeri talebinde, teklif gelmeden talep detayından ayrılmak.
- Doğrudan atamada, sürücü yanıt vermeden Sürücü Ata ekranından ayrılmak.

Takip linki müşteriye gönderilmiyor (`apps/insurance/views.py` içindeki SMS kodu yorum satırında). Bu yüzden acente taleplerinde bu kanala bağlanan tek istemci panel.

## Yan etki: yarım iptal

`auto_cancel_pending_request()` normal iptal yolunu (`cancel_unpaid_request`) kullanmıyor. Bu yüzden:
- `close_active_assignments()` çağrılmıyor. Doğrudan atamada sürücünün ataması `pending` kalıyor; sürücü süre dolana kadar "meşgul" görünüyor, sonra yanlış bir "atama süresi doldu" bildirimi alıyor.
- `cleanup_unfinished_payments()` çağrılmıyor.
- Teklif vermiş sürücülere FCM gitmiyor.

## İstenen düzeltme

Acente talepleri WebSocket kopmasıyla iptal edilmesin. Acente talebinde iptal yalnızca acentenin ya da admin'in açık aksiyonuyla olsun (`POST /insurance/requests/{id}/cancel/`, admin iptali).

Minimal yama (`auto_cancel_pending_request` içinde, kilitli satırı aldıktan sonra):

```python
from apps.insurance.models import InsuranceRequest

vehicle_request = VehicleRequest.objects.select_for_update().get(
    id=self.request_id, status='pending',
)
# Acente talebi: panelin sayfa degistirmesi / ag kopmasi talebi iptal etmemeli
if InsuranceRequest.objects.filter(vehicle_request=vehicle_request).exists():
    return False
```

**Öneri:** Müşteri uygulaması için kalan otomatik iptal de `cancel_unpaid_request(..., allowed_statuses=('pending',))` üzerinden yapılsın. Böylece atamalar ve yarım kalan ödemeler de kapanır.

## Etkilenen talepleri bulma

Bu yoldan iptal edilen talepler logda şu satırla görünüyor:

```
Request {id} auto-cancelled due to customer disconnect
```

Acente talebi olanlar (`insurance_request` kaydı var) yanlışlıkla iptal edilmiş sayılmalı. Acenteyle konuşulup gerekirse elle geri alınabilir.

## Test

1. Acente, doğrudan atamalı talep oluşturur → Sürücü Ata ekranı açılır → "Pazaryerine aç" → talep `pending` kalmalı ve sürücülere bildirim gitmeli.
2. Pazaryeri talebi, teklif gelmeden talep detayından çıkılır ya da sekme kapatılır → talep `pending` kalmalı.
3. Doğrudan atamada, sürücü yanıt vermeden Sürücü Ata ekranından çıkılır → talep ve atama `pending` kalmalı.
4. Müşteri uygulaması: "sürücü aranıyor" ekranından çıkılınca talep bugünkü gibi iptal olmalı.
