import { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, Chip } from '@mui/material';
import { PersonSearch, HourglassTop, CheckCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { cancelAssignment, getApiError } from '../api';
import { AssignmentStatusLabels, AssignmentCancelReasonLabels } from '../types';
import type { AgencyAssignment, InsuranceRequestDetail } from '../types';
import { driverFullName } from '../utils/drivers';
import { ASSIGNABLE_STATUSES } from '../utils/assignments';
import { useCountdown } from '../hooks/useCountdown';
import OpenMarketplaceDialog from './OpenMarketplaceDialog';

const statusColors: Record<AgencyAssignment['status'], { bg: string; color: string }> = {
  pending: { bg: '#e0f2fe', color: '#0369a1' },
  offered: { bg: '#dcfce7', color: '#16a34a' },
  declined: { bg: '#fee2e2', color: '#dc2626' },
  expired: { bg: '#f1f5f9', color: '#64748b' },
  cancelled: { bg: '#f1f5f9', color: '#64748b' },
};

const cardSx = { borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 3 };

interface AssignmentCardProps {
  request: InsuranceRequestDetail;
  // Atama ya da talep durumu degisti; detay yeniden yuklenmeli
  onChanged: () => void;
}

// Dogrudan atamali talebin atama durumu ve gecmisi
export default function AssignmentCard({ request, onChanged }: AssignmentCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [cancelling, setCancelling] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const active = request.agency_assignment ?? null;
  const history = request.assignment_history ?? [];
  const assignable = ASSIGNABLE_STATUSES.includes(request.status);
  const countdown = useCountdown(active?.status === 'pending' ? active.expires_at : null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAssignment(request.request_id);
      enqueueSnackbar('Atama iptal edildi', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(getApiError(err).message || 'Atama iptal edilemedi', { variant: 'error' });
    } finally {
      setCancelling(false);
      onChanged();
    }
  };

  const marketplaceButton = (
    <Button variant="outlined" onClick={() => setMarketplaceOpen(true)} sx={{ borderRadius: 2, fontWeight: 600 }}>
      Pazaryerine aç
    </Button>
  );

  let current: React.ReactNode = null;
  if (active?.status === 'pending') {
    current = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <HourglassTop sx={{ fontSize: 28, color: '#0ea5e9' }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
              {driverFullName(active.driver)} · yanıt bekleniyor
            </Typography>
            <Typography sx={{ fontSize: 13, color: countdown.isExpired ? '#ef4444' : '#64748b' }}>
              {countdown.isExpired ? 'Süre doldu, sonuç bekleniyor' : `Yanıt için ${countdown.label}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="error" onClick={handleCancel} disabled={cancelling} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {cancelling ? 'İptal ediliyor...' : 'Atamayı iptal et'}
          </Button>
          {assignable && marketplaceButton}
        </Box>
      </>
    );
  } else if (active?.status === 'offered') {
    if (assignable) {
      current = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle sx={{ fontSize: 28, color: '#16a34a' }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
              {driverFullName(active.driver)} teklif verdi
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#64748b' }}>Teklifi aşağıdaki listeden onaylayabilirsiniz.</Typography>
          </Box>
        </Box>
      );
    }
  } else if (assignable) {
    current = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <PersonSearch sx={{ fontSize: 28, color: '#94a3b8' }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Sürücü atanmadı</Typography>
            <Typography sx={{ fontSize: 13, color: '#64748b' }}>
              Talep yayınlanmadı. Haritadan kendi sürücünüzü seçin ya da talebi pazaryerine açın.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to={`/panel/requests/${request.request_id}/assign`}
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Sürücü Ata
          </Button>
          {marketplaceButton}
        </Box>
      </>
    );
  }

  if (!current && history.length === 0) return null;

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
          Doğrudan Atama
        </Typography>

        {current}

        {history.length > 0 && (
          <Box sx={{ mt: current ? 2.5 : 0, pt: current ? 2 : 0, borderTop: current ? '1px solid #e2e8f0' : 'none' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b', mb: 1 }}>Atama geçmişi</Typography>
            {history.map((item) => {
              const colors = statusColors[item.status] ?? statusColors.cancelled;
              return (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, flexWrap: 'wrap' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{driverFullName(item.driver)}</Typography>
                <Chip
                  label={AssignmentStatusLabels[item.status] ?? item.status}
                  size="small"
                  sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: colors.bg, color: colors.color }}
                />
                {item.cancel_reason && (
                  <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                    {AssignmentCancelReasonLabels[item.cancel_reason] ?? item.cancel_reason}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 12, color: '#94a3b8', ml: 'auto' }}>
                  {new Date(item.created_at).toLocaleString('tr-TR')}
                </Typography>
              </Box>
              );
            })}
          </Box>
        )}
      </CardContent>

      <OpenMarketplaceDialog
        open={marketplaceOpen}
        requestId={request.request_id}
        onClose={() => setMarketplaceOpen(false)}
        onDone={() => {
          setMarketplaceOpen(false);
          onChanged();
        }}
      />
    </Card>
  );
}
