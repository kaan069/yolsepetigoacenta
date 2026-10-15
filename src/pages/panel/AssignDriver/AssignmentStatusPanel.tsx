import { Box, Typography, Button, CircularProgress, keyframes } from '@mui/material';
import { Person, Phone, LocalShipping, HourglassTop, ErrorOutline } from '@mui/icons-material';
import type { AgencyAssignment, AvailableDriver } from '../../../types';
import { driverFullName } from '../../../utils/drivers';
import { useCountdown } from '../../../hooks/useCountdown';
import { colors } from '../../../tokens';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.2); opacity: 0; }
`;

interface AssignmentStatusPanelProps {
  assignment: AgencyAssignment;
  // Bossa yanit bekleniyor; doluysa sonuc ekrani (red, sure doldu, iptal)
  resultMessage: string;
  vehicles: AvailableDriver['vehicles'];
  cancelling: boolean;
  onCancel: () => void;
  onChooseAnother: () => void;
  onOpenMarketplace: () => void;
}

export default function AssignmentStatusPanel({
  assignment, resultMessage, vehicles, cancelling, onCancel, onChooseAnother, onOpenMarketplace,
}: AssignmentStatusPanelProps) {
  const waiting = !resultMessage;
  const countdown = useCountdown(waiting ? assignment.expires_at : null);
  const { driver } = assignment;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>
      {/* Secilen surucu */}
      <Box sx={{ bgcolor: colors.neutral[50], borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Person sx={{ fontSize: 18, color: colors.neutral[500] }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>{driverFullName(driver)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ fontSize: 15, color: colors.neutral[400] }} />
          <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>{driver.phone_number}</Typography>
        </Box>
        {vehicles.map((vehicle) => (
          <Box key={vehicle.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <LocalShipping sx={{ fontSize: 15, color: colors.neutral[400] }} />
            <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>
              {vehicle.plate_number} · {vehicle.brand} {vehicle.model}
            </Typography>
          </Box>
        ))}
      </Box>

      {waiting ? (
        <>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 72, height: 72, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!countdown.isExpired && [0, 0.6].map((delay) => (
                <Box
                  key={delay}
                  sx={{
                    position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: colors.primary[500],
                    animation: `${pulse} 1.8s ease-out infinite ${delay}s`,
                  }}
                />
              ))}
              <Box sx={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', bgcolor: colors.primary[500], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HourglassTop sx={{ color: 'white', fontSize: 28 }} />
              </Box>
            </Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
              Sürücünün yanıtı bekleniyor
            </Typography>
            <Typography sx={{ fontSize: 13, color: colors.neutral[500], mb: 2 }}>
              Sürücüye bildirim gönderildi. Teklif verirse işi kabul etmiş olur.
            </Typography>
            <Typography
              sx={{
                fontSize: 32, fontWeight: 700, fontFamily: 'monospace',
                color: countdown.isExpired || countdown.remainingSeconds <= 30 ? colors.danger[500] : colors.neutral[900],
              }}
            >
              {countdown.isExpired ? 'Süre doldu' : countdown.label}
            </Typography>
            {countdown.isExpired && (
              <Typography sx={{ fontSize: 12, color: colors.neutral[400], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={12} /> Sonuç bekleniyor
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" color="error" onClick={onCancel} disabled={cancelling} sx={{ borderRadius: 2, fontWeight: 600 }}>
              {cancelling ? 'İptal ediliyor...' : 'Atamayı iptal et'}
            </Button>
            <Button onClick={onChooseAnother} disabled={cancelling} sx={{ borderRadius: 2, color: colors.neutral[500] }}>
              Başka sürücü seç
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ textAlign: 'center' }}>
            <ErrorOutline sx={{ fontSize: 48, color: colors.secondary[500], mb: 1 }} />
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>{resultMessage}</Typography>
            <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>
              Başka bir sürücü seçebilir ya da talebi pazaryerine açabilirsiniz.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="contained" onClick={onChooseAnother} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Başka sürücü seç
            </Button>
            <Button variant="outlined" onClick={onOpenMarketplace} sx={{ borderRadius: 2, fontWeight: 600 }}>
              Pazaryerine aç
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
