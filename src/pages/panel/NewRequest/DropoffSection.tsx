import {
  Box, Typography, IconButton, CircularProgress,
} from '@mui/material';
import { LocationOn, Close } from '@mui/icons-material';
import MapPickerDialog, { type LocationResult } from '../../../components/MapPickerDialog';

interface DropoffSectionProps {
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupAddress: string;
  estimatedKm: number;
  // Google'in surus suresi metni ("18 dakika")
  estimatedDuration?: string;
  distanceLoading: boolean;
  dialogOpen: boolean;
  onDialogOpen: () => void;
  onDialogClose: () => void;
  onLocationSelect: (loc: LocationResult) => void;
  onClear: () => void;
}

export default function DropoffSection({
  dropoffAddress, dropoffLatitude, dropoffLongitude,
  pickupAddress, estimatedKm, estimatedDuration, distanceLoading,
  dialogOpen, onDialogOpen, onDialogClose, onLocationSelect, onClear,
}: DropoffSectionProps) {
  return (
    <>
      <Box
        onClick={onDialogOpen}
        sx={{
          mb: 2, p: 2, border: '1px solid',
          borderColor: dropoffAddress ? '#ef4444' : '#e2e8f0',
          borderRadius: 2, cursor: 'pointer',
          bgcolor: dropoffAddress ? '#fef2f2' : 'transparent',
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: dropoffAddress ? '#ef4444' : '#0ea5e9', bgcolor: dropoffAddress ? '#fef2f2' : '#f0f9ff' },
        }}
      >
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
          bgcolor: dropoffAddress ? '#ef4444' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LocationOn sx={{ color: dropoffAddress ? 'white' : '#94a3b8', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {dropoffAddress ? (
            <>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                Teslim Adresi
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                {dropoffAddress}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: 'monospace' }}>
                {(dropoffLatitude || 0).toFixed(4)}, {(dropoffLongitude || 0).toFixed(4)}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
                Birakis konumunu secmek icin tiklayin (opsiyonel)
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.25 }}>
                Haritadan konum secin veya adres arayin
              </Typography>
            </>
          )}
        </Box>
        {dropoffAddress && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' }, mt: 0.25 }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
      <MapPickerDialog
        open={dialogOpen}
        onClose={onDialogClose}
        onSelect={onLocationSelect}
        initialLocation={
          dropoffLatitude && dropoffLatitude !== 0
            ? { address: dropoffAddress || '', latitude: dropoffLatitude, longitude: dropoffLongitude || 0 }
            : null
        }
        title="Birakis Konumu Sec"
      />

      {/* Mesafe bilgisi */}
      {dropoffAddress && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {distanceLoading ? (
            <>
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: 13, color: '#64748b' }}>Mesafe hesaplaniyor...</Typography>
            </>
          ) : estimatedKm ? (
            <Typography sx={{ fontSize: 13, color: '#0f172a' }}>
              <strong>
                {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(estimatedKm)} km
                {estimatedDuration && ` · ~${estimatedDuration}`}
              </strong>
              <Typography component="span" sx={{ fontSize: 12, color: '#94a3b8', ml: 1 }}>
                {pickupAddress?.split(',')[0]} → {dropoffAddress?.split(',')[0]}
              </Typography>
            </Typography>
          ) : null}
        </Box>
      )}
    </>
  );
}
