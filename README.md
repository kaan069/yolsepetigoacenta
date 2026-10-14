# YolSepetiGO Acenta Paneli

Sigorta acentelerinin, sigortalıları için çekici, vinç, yol yardımı ve nakliyat talebi oluşturup takip ettiği web paneli. Acente talebi açar, sürücü tekliflerini canlı görür, teklifi onaylar, ödeme linki gönderir ve hakedişlerini izler.

React 19, Vite, TypeScript, MUI ve Google Maps ile yazıldı.

## Kurulum

```bash
npm install
cp .env.example .env   # değerleri doldurun
npm run dev
```

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `VITE_API_URL` | Backend adresi. Boş bırakılırsa `https://api.yolsepetigo.com` kullanılır. WebSocket adresi bundan türetilir (`https` → `wss`). |
| `VITE_GOOGLE_MAPS_API_KEY` | Harita, adres arama ve mesafe hesabı için Google Maps anahtarı. |

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü ve production build (`dist/`) |
| `npm run lint` | ESLint |

## Yayın

Vercel'de SPA olarak yayınlanır; `vercel.json` tüm yolları `index.html`'e yönlendirir. Ortam değişkenleri Vercel proje ayarlarından tanımlanır.
