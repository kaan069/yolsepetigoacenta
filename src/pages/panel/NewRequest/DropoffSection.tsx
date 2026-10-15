import {
  Box, Typography, IconButton, CircularProgress,
} from '@mui/material';
import { LocationOn, Close } from '@mui/icons-material';
import MapPickerDialog, { type LocationResult } from '../../../components/MapPickerDialog';
import { colors } from '../../../tokens';

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
          borderColor: dropoffAddress ? colors.danger[500] : colors.neutral[200],
          borderRadius: 2, cursor: 'pointer',
          bgcolor: dropoffAddress ? colors.danger[50] : 'transparent',
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: dropoffAddress ? colors.danger[500] : colors.primary[500], bgcolor: dropoffAddress ? colors.danger[50] : colors.primary[50] },
        }}
      >
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
          bgcolor: dropoffAddress ? colors.danger[500] : colors.neutral[100],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LocationOn sx={{ color: dropoffAddress ? 'white' : colors.neutral[400], fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          {dropoffAddress ? (
            <>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.danger[500], textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                Teslim Adresi
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: colors.neutral[900], lineHeight: 1.4 }}>
                {dropoffAddress}
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.neutral[400], mt: 0.5, fontFamily: 'monospace' }}>
                {(dropoffLatitude || 0).toFixed(4)}, {(dropoffLongitude || 0).toFixed(4)}
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, color: colors.neutral[400] }}>
                Birakis konumunu secmek icin tiklayin (opsiyonel)
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.neutral[300], mt: 0.25 }}>
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
            sx={{ color: colors.neutral[400], '&:hover': { color: colors.danger[500] }, mt: 0.25 }}
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
        <Box sx={{ mb: 2, p: 1.5, bgcolor: colors.neutral[50], borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {distanceLoading ? (
            <>
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>Mesafe hesaplaniyor...</Typography>
            </>
          ) : estimatedKm ? (
            <Typography sx={{ fontSize: 13, color: colors.neutral[900] }}>
              <strong>
                {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(estimatedKm)} km
                {estimatedDuration && ` · ~${estimatedDuration}`}
              </strong>
              <Typography component="span" sx={{ fontSize: 12, color: colors.neutral[400], ml: 1 }}>
                {pickupAddress?.split(',')[0]} → {dropoffAddress?.split(',')[0]}
              </Typography>
            </Typography>
          ) : null}
        </Box>
      )}
    </>
  );
}
