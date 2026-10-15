# Mobil Brief: Sürücü Uygulama Konumu Gönderimi

> **Kimin için:** Sürücü uygulaması ekibi (`helpermobile`).
> **İlgili:** Backend ekibi için ayrı brief: `backend-surucu-uygulama-konumu-brief.md`.

## Amaç

Acente panelinde sürücü, canlı konumu yerine iş adresiyle görünüyor. Örnek: sürücü İstanbul'da uygulamaya girdi, panelde iş adresi olan Erzurum göründü.

**Sebep:**
- Uygulama konumu backend'e yalnızca aktif işte gönderiyor (`src/tasks/backgroundLocation.ts`). Gönderim WebSocket ile, bağlantı yoksa `/vehicles/location/{trackingToken}/http-update/` ile yapılıyor.
- `HomeScreen` girişte konumu alıyor (`getCurrentPositionAsync`), ama yalnızca haritayı ortalamak için kullanıyor, backend'e göndermiyor.

Backend bunun için ayrı bir uç açıyor: `POST /vehicles/location/app-ping/`. Uygulama bu uca yalnızca enlem ve boylam gönderecek.

**Not:** Acente rehberinin 3.6 bölümündeki 3–5 dakikalık heartbeat yerine bu yapı kullanılacak. Heartbeat'i ayrıca yapmanıza gerek yok.

## 1. API

```ts
type AppPingTrigger = 'app_open' | 'foreground' | 'online' | 'periodic';

export const locationAPI = {
  appPing: (latitude: number, longitude: number, trigger: AppPingTrigger, accuracy?: number) =>
    axiosInstance.post('/vehicles/location/app-ping/', { latitude, longitude, trigger, accuracy }),
};
```

Başarılı yanıt `200 { "status": "ok", "updated_at": "..." }`.

## 2. Ne zaman gönderilecek

| Durum | `trigger` | Şart |
|---|---|---|
| Giriş yapılmış haldeyken uygulama açıldığında | `app_open` | Her zaman (konum izni varsa) |
| Uygulama arka plandan ön plana geldiğinde (`AppState` → `active`) | `foreground` | Son gönderimin üzerinden 5 dakikadan fazla geçmişse |
| Sürücü çevrimiçi olduğunda (`/auth/status/online/` başarılı) | `online` | Her zaman |
| Uygulama açıkken | `periodic` | 30 dakikada bir, sürücü çevrimiçiyse |

- Konum `getCurrentPositionAsync` ile `Balanced` doğrulukta ve yaklaşık 10 saniye zaman aşımıyla alınır.
- Zaman aşımında `getLastKnownPositionAsync` kullanılır.
- Telefonun bildirdiği doğruluk `accuracy` alanında gönderilir.
- Konum izni yoksa hiçbir şey gönderilmez ve sürücüye ek bir izin ekranı gösterilmez.
- Çıkış yapılınca zamanlayıcı durur.

## 3. Uygulama yapısı (öneri)

- Tek bir modül olsun, örneğin `src/services/appLocationPing.ts`. Son gönderim zamanını tutsun ve `send(trigger)` fonksiyonu sunsun.
- Kök bileşende (giriş sonrası) bir hook (`useAppLocationPing`) olsun:
  - açılışta `app_open` gönderir
  - `AppState` dinleyicisiyle `foreground` gönderir
  - 30 dakikalık zamanlayıcıyla `periodic` gönderir
- Çevrimiçi yapma akışı başarılı olunca `send('online')` çağrılır.
- `HomeScreen`'in zaten aldığı konum doğrudan bu modüle verilebilir; aynı anda iki konum isteği yapılmaz.

## 4. Hatalar

- Bütün hatalar sessizce yok sayılır; bir sonraki tetiklemede tekrar denenir. Kuyruğa gerek yok.
- 429 (hız sınırı) ve 403 (sürücü olmayan hesap) durumunda da sessiz kalınır.

## 5. Arka plan (isteğe bağlı)

Uygulama arka plandayken de 30 dakikada bir gönderim istenirse:
- Mevcut arka plan konum görevi (`src/tasks/backgroundLocation.ts`) genişletilebilir.
- Şartlar: sürücü çevrimiçi olmalı, aktif iş olmamalı ve "her zaman" konum izni verilmiş olmalı.
- Bu yapılmazsa panel, uygulama kapandıktan 45 dakika sonra sürücüyü "Son konum · … önce" gösterir ve çevrimdışı sayar. Bu kabul edilebilir bir davranış.

## Yayın

Backend ucu sizin yayınınızdan önce hazır olacak. Backend, acente tarafındaki çevrimiçi kuralını (konum gelmeyen sürücüyü çevrimdışı sayma) sizin sürümünüz yayıldıktan sonra açacak. **Yayın tarihini backend ekibine bildirin.**

## Test

1. Uygulamayı açın: backend admin'de "uygulama konumu" kaydı birkaç saniye içinde `app_open` ile güncellenmeli.
2. Acente panelinde Sürücülerim → Konum "Canlı · az önce" göstermeli, atama haritasında pin doğru şehirde olmalı.
3. Uygulamayı arka plana alıp 5 dakikadan sonra geri açın: `foreground` gitmeli. 5 dakikadan önce açarsanız gitmemeli.
4. Çevrimiçi olun: `online` gitmeli.
5. Uygulamayı 30 dakika açık bırakın: `periodic` gitmeli.
6. Konum izni kapalıyken hiçbir istek gitmemeli ve uygulama hata göstermemeli.
7. Çıkış yapın: istekler durmalı.
