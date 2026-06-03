import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
} from '@mui/material';
import { MyLocation, Sms, CheckCircle, PhotoLibrary, WarningAmber } from '@mui/icons-material';
import MapPickerDialog, { type LocationResult } from '../../../components/MapPickerDialog';
import ImageLightbox from '../../../components/ImageLightbox';
import type { LocationShareImage } from '../../../types';

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

  // Acik lightbox index'i, gorsel silindiyse sinirla / bossa kapat
  useEffect(() => {
    if (lightboxIndex === null) return;
    if (images.length === 0) {
      setLightboxIndex(null);
    } else if (lightboxIndex > images.length - 1) {
      setLightboxIndex(images.length - 1);
    }
  }, [images.length, lightboxIndex]);

  const sessionActive =
    locationWaiting || locationReceived || isSubmitted || isExpired ||
    images.length > 0 || maxImages > 0;

  return (
    <>
      <Box
        onClick={onDialogOpen}
        sx={{
          mb: 2, p: 2, border: '1px solid',
          borderColor: pickupAddress ? '#0ea5e9' : '#e2e8f0',
          borderRadius: 2, cursor: 'pointer',
          bgcolor: pickupAddress ? '#f0f9ff' : 'transparent',
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' },
        }}
      >
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
          bgcolor: pickupAddress ? '#0ea5e9' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MyLocation sx={{ color: pickupAddress ? 'white' : '#94a3b8', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {pickupAddress ? (
            <>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                Alis Adresi
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                {pickupAddress}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: 'monospace' }}>
                {(pickupLatitude || 0).toFixed(4)}, {(pickupLongitude || 0).toFixed(4)}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
                Alis konumunu secmek icin tiklayin
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.25 }}>
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
        <Box sx={{ mb: 2, p: 2, border: '1px solid #f59e0b', borderRadius: 2, bgcolor: '#fffbeb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <CircularProgress size={18} sx={{ color: '#f59e0b' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
              Musteri konumu bekleniyor...
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: '#a16207', mb: 1.5 }}>
            {insuredPhone} numarasina SMS gonderildi
          </Typography>
          <Box sx={{ bgcolor: '#fef3c7', borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#92400e', mb: 0.5 }}>
              Musteriyi yonlendirin:
            </Typography>
            <Typography component="ul" sx={{ fontSize: 12, color: '#a16207', m: 0, pl: 2, lineHeight: 1.8 }}>
              <li>SMS ile gelen linki acmasini isteyin</li>
              <li>Acilan sayfada "Konumumu Paylas" butonuna basmasini soyleyIn</li>
              <li>Tarayicinin konum izni istediginde "Izin Ver" demesini belirtin</li>
              <li>Konum basariyla paylasildIginda bu alan otomatik guncellenecektir</li>
            </Typography>
          </Box>
          <Button
            size="small" variant="text"
            onClick={onSendLocationSms}
            disabled={locationSmsLoading}
            sx={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}
          >
            Tekrar Gonder
          </Button>
        </Box>
      ) : locationReceived ? (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #10b981', borderRadius: 2, bgcolor: '#ecfdf5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>
              Musteri konumu alindi
            </Typography>
          </Box>
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
            sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 600, borderRadius: 2 }}
          >
            {locationSmsLoading ? 'Gonderiliyor...' : 'Musteriden Konum Al'}
          </Button>
        </Box>
      )}

      {/* Arac gorselleri galerisi */}
      {sessionActive && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PhotoLibrary sx={{ fontSize: 18, color: '#0ea5e9' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Araç Görselleri {maxImages > 0 ? `(${imageCount}/${maxImages})` : `(${imageCount})`}
            </Typography>
          </Box>
          {images.length === 0 ? (
            <Box sx={{ p: 2, border: '1px dashed #cbd5e1', borderRadius: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>
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
                    border: '1px solid #e2e8f0', cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                    '&:hover': { borderColor: '#0ea5e9' },
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
        <Box sx={{ mb: 2, p: 2, border: '1px solid #10b981', borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>
            Müşteri gönderdi
          </Typography>
        </Box>
      )}

      {isExpired && !isSubmitted && (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #ef4444', borderRadius: 2, bgcolor: '#fef2f2' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningAmber sx={{ fontSize: 18, color: '#ef4444' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#991b1b' }}>
              Link süresi doldu
            </Typography>
          </Box>
          <Button
            size="small" variant="outlined" onClick={onResendLink}
            sx={{ borderColor: '#ef4444', color: '#ef4444', fontWeight: 600, borderRadius: 2, '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' } }}
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
