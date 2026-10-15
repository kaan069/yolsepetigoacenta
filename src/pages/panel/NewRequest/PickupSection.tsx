import { useState } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
} from '@mui/material';
import { MyLocation, Sms, CheckCircle, PhotoLibrary, WarningAmber, SupportAgent, PhotoCamera } from '@mui/icons-material';
import MapPickerDialog, { type LocationResult } from '../../../components/MapPickerDialog';
import ImageLightbox from '../../../components/ImageLightbox';
import type { LocationShareImage } from '../../../types';
import { colors, alpha } from '../../../tokens';

interface PickupSectionProps {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dialogOpen: boolean;
  onDialogOpen: () => void;
  onDialogClose: () => void;
  onLocationSelect: (loc: LocationResult) => void;
  // Musteri konum paylasimi
  locationWaiting: boolean;
  locationReceived: boolean;
  locationSmsLoading: boolean;
  locationSmsError: string;
  insuredPhone: string;
  onSendLocationSms: () => void;
  // Arac gorselleri & durum
  images: LocationShareImage[];
  imageCount: number;
  maxImages: number;
  isSubmitted: boolean;
  isExpired: boolean;
  onResendLink: () => void;
}

export default function PickupSection({
  pickupAddress, pickupLatitude, pickupLongitude,
  dialogOpen, onDialogOpen, onDialogClose, onLocationSelect,
  locationWaiting, locationReceived, locationSmsLoading, locationSmsError,
  insuredPhone, onSendLocationSms,
  images, imageCount, maxImages, isSubmitted, isExpired, onResendLink,
}: PickupSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Acik lightbox index'i, gorsel silindiyse sinirla / bossa kapat (render sirasinda duzeltilir)
  if (lightboxIndex !== null) {
    const clamped = images.length === 0 ? null : Math.min(lightboxIndex, images.length - 1);
    if (clamped !== lightboxIndex) setLightboxIndex(clamped);
  }

  const sessionActive =
    locationWaiting || locationReceived || isSubmitted || isExpired ||
    images.length > 0 || maxImages > 0;

  // Musteriye telefonda okunacak adimlar (photo: gorsel adimlari vurgulanir)
  const guideSteps = [
    { title: 'SMS ile gelen linki açsın', detail: `${insuredPhone} numarasına gönderilen linke dokunması yeterli` },
    { title: '"Konumumu Paylaş" butonuna bassın', detail: 'Açılan sayfadaki konum paylaşma butonu' },
    { title: 'Konum izninde "İzin Ver" desin', detail: 'Tarayıcı konum izni istediğinde reddetmemesi önemli' },
    {
      title: 'Aracın fotoğraflarını yüklesin',
      detail: `Net ve farklı açılardan: ön, arka, yanlar ve hasarlı bölge${maxImages > 0 ? ` (en fazla ${maxImages} adet)` : ''}`,
      photo: true,
    },
    { title: '"Gönder" butonuna bassın', detail: 'Fotoğraflar yüklendikten sonra işlemi tamamlar', photo: true },
  ];

  return (
    <>
      <Box
        onClick={onDialogOpen}
        sx={{
          mb: 2, p: 2, border: '1px solid',
          borderColor: pickupAddress ? colors.primary[500] : colors.neutral[200],
          borderRadius: 2, cursor: 'pointer',
          bgcolor: pickupAddress ? colors.primary[50] : 'transparent',
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: colors.primary[500], bgcolor: colors.primary[50] },
        }}
      >
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
          bgcolor: pickupAddress ? colors.primary[500] : colors.neutral[100],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MyLocation sx={{ color: pickupAddress ? 'white' : colors.neutral[400], fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {pickupAddress ? (
            <>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.primary[500], textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                Alis Adresi
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: colors.neutral[900], lineHeight: 1.4 }}>
                {pickupAddress}
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.neutral[400], mt: 0.5, fontFamily: 'monospace' }}>
                {(pickupLatitude || 0).toFixed(4)}, {(pickupLongitude || 0).toFixed(4)}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, color: colors.neutral[400] }}>
                Alis konumunu secmek icin tiklayin
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.neutral[300], mt: 0.25 }}>
                Haritadan konum secin veya adres arayin
              </Typography>
            </>
          )}
        </Box>
      </Box>
      <MapPickerDialog
        open={dialogOpen}
        onClose={onDialogClose}
        onSelect={onLocationSelect}
        initialLocation={
          pickupLatitude !== 0
            ? { address: pickupAddress, latitude: pickupLatitude, longitude: pickupLongitude }
            : null
        }
        title="Alis Konumu Sec"
      />

      {/* Musteriden konum al */}
      {locationWaiting ? (
        <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.warning[500]}`, borderRadius: 2, bgcolor: colors.warning[50] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <CircularProgress size={18} sx={{ color: colors.warning[500] }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.warning[800] }}>
              Musteri konumu bekleniyor...
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: colors.warning[700], mb: 1.5 }}>
            {insuredPhone} numarasina SMS gonderildi
          </Typography>
          <Box sx={{
            mb: 1.5, bgcolor: 'white', border: `2px solid ${colors.warning[500]}`, borderRadius: 2,
            overflow: 'hidden', boxShadow: `0 4px 14px ${alpha(colors.warning[500], 0.18)}`,
          }}>
            <Box sx={{ bgcolor: colors.warning[500], px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SupportAgent sx={{ fontSize: 20, color: 'white' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: 0.3 }}>
                Müşteriyi telefonda adım adım yönlendirin
              </Typography>
            </Box>
            <Box component="ol" sx={{ m: 0, p: 1.5, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {guideSteps.map((step, i) => (
                <Box
                  component="li" key={step.title}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.25,
                    ...(step.photo && { bgcolor: colors.primary[50], border: `1px solid ${colors.primary[200]}`, borderRadius: 1.5, p: 1, mx: -0.5 }),
                  }}
                >
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    bgcolor: step.photo ? colors.primary[500] : colors.warning[500], color: 'white',
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[900], lineHeight: 1.4 }}>
                      {step.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: colors.neutral[500], lineHeight: 1.4, mt: 0.25 }}>
                      {step.detail}
                    </Typography>
                  </Box>
                  {step.photo && <PhotoCamera sx={{ fontSize: 18, color: colors.primary[500], mt: 0.25 }} />}
                </Box>
              ))}
            </Box>
            <Box sx={{ px: 1.5, py: 1, bgcolor: colors.warning[50], borderTop: `1px solid ${colors.warning[200]}` }}>
              <Typography sx={{ fontSize: 12, color: colors.warning[800] }}>
                Konum ve fotoğraflar geldikçe bu alan otomatik güncellenir.
              </Typography>
            </Box>
          </Box>
          <Button
            size="small" variant="text"
            onClick={onSendLocationSms}
            disabled={locationSmsLoading}
            sx={{ fontSize: 12, color: colors.warning[800], fontWeight: 600 }}
          >
            Tekrar Gonder
          </Button>
        </Box>
      ) : locationReceived ? (
        <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.success[500]}`, borderRadius: 2, bgcolor: colors.success[50] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 18, color: colors.success[500] }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.success[800] }}>
              Musteri konumu alindi
            </Typography>
          </Box>
          {!isSubmitted && (
            <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 1.5, bgcolor: 'white', border: `1px solid ${colors.success[200]}`, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <PhotoCamera sx={{ fontSize: 18, color: colors.primary[500], mt: 0.1 }} />
              <Typography sx={{ fontSize: 12.5, color: colors.neutral[900], lineHeight: 1.5 }}>
                <b>Sırada fotoğraflar var:</b> Müşteriden aynı sayfada aracın fotoğraflarını
                yükleyip <b>"Gönder"</b> butonuna basmasını isteyin.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          {locationSmsError && (
            <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>{locationSmsError}</Alert>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={onSendLocationSms}
            disabled={locationSmsLoading}
            startIcon={locationSmsLoading ? <CircularProgress size={16} /> : <Sms />}
            sx={{ borderColor: colors.neutral[200], color: colors.neutral[500], fontWeight: 600, borderRadius: 2 }}
          >
            {locationSmsLoading ? 'Gonderiliyor...' : 'Musteriden Konum Al'}
          </Button>
        </Box>
      )}

      {/* Arac gorselleri galerisi */}
      {sessionActive && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PhotoLibrary sx={{ fontSize: 18, color: colors.primary[500] }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.neutral[900] }}>
              Araç Görselleri {maxImages > 0 ? `(${imageCount}/${maxImages})` : `(${imageCount})`}
            </Typography>
          </Box>
          {images.length === 0 ? (
            <Box sx={{ p: 2, border: `1px dashed ${colors.neutral[300]}`, borderRadius: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>
                Müşteri henüz görsel yüklemedi
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
              {images.map((img, i) => (
                <Box
                  key={img.id}
                  onClick={() => setLightboxIndex(i)}
                  sx={{
                    aspectRatio: '1', borderRadius: 2, overflow: 'hidden',
                    border: `1px solid ${colors.neutral[200]}`, cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                    '&:hover': { borderColor: colors.primary[500] },
                  }}
                >
                  <img
                    src={img.url}
                    alt="Araç"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Durum gostergeleri */}
      {isSubmitted && (
        <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.success[500]}`, borderRadius: 2, bgcolor: colors.success[50], display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 18, color: colors.success[500] }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.success[800] }}>
            Müşteri gönderdi
          </Typography>
        </Box>
      )}

      {isExpired && !isSubmitted && (
        <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.danger[500]}`, borderRadius: 2, bgcolor: colors.danger[50] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningAmber sx={{ fontSize: 18, color: colors.danger[500] }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.danger[800] }}>
              Link süresi doldu
            </Typography>
          </Box>
          <Button
            size="small" variant="outlined" onClick={onResendLink}
            sx={{ borderColor: colors.danger[500], color: colors.danger[500], fontWeight: 600, borderRadius: 2, '&:hover': { borderColor: colors.danger[600], bgcolor: colors.danger[50] } }}
          >
            Yeni SMS Gönder
          </Button>
        </Box>
      )}

      <ImageLightbox
        open={lightboxIndex !== null}
        images={images}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
