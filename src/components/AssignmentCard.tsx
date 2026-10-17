import { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, Chip } from '@mui/material';
import { PersonSearch, HourglassTop, CheckCircle, Campaign } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { cancelAssignment, getApiError } from '../api';
import { AssignmentStatusLabels, AssignmentCancelReasonLabels } from '../types';
import type { AgencyAssignment, InsuranceRequestDetail } from '../types';
import { driverFullName } from '../utils/drivers';
import { ASSIGNABLE_STATUSES } from '../utils/assignments';
import { useCountdown } from '../hooks/useCountdown';
import OpenMarketplaceDialog from './OpenMarketplaceDialog';
import BroadcastDialog from './BroadcastDialog';
import { colors } from '../tokens';

const statusColors: Record<AgencyAssignment['status'], { bg: string; color: string }> = {
  pending: { bg: colors.primary[100], color: colors.primary[700] },
  offered: { bg: colors.success[100], color: colors.success[600] },
  declined: { bg: colors.danger[100], color: colors.danger[600] },
  expired: { bg: colors.neutral[100], color: colors.neutral[500] },
  cancelled: { bg: colors.neutral[100], color: colors.neutral[500] },
};

const cardSx = { borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}`, mb: 3 };

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
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const active = request.agency_assignment ?? null;
  // "Tum suruculere gonder" davetleri (pending: teklif bekleniyor, offered: teklif verdi)
  const invites = request.broadcast_invites ?? [];
  const offeredInvites = invites.filter((invite) => invite.status === 'offered').length;
  const history = request.assignment_history ?? [];
  const assignable = ASSIGNABLE_STATUSES.includes(request.status);
  const countdown = useCountdown(active?.status === 'pending' ? active.expires_at : null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAssignment(request.request_id);
      enqueueSnackbar(invites.length > 0 ? 'Davetler iptal edildi' : 'Atama iptal edildi', { variant: 'info' });
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

  const broadcastButton = (
    <Button variant="outlined" startIcon={<Campaign />} onClick={() => setBroadcastOpen(true)} sx={{ borderRadius: 2, fontWeight: 600 }}>
      {invites.length > 0 ? 'Yeni sürücüleri davet et' : 'Tüm sürücülere gönder'}
    </Button>
  );

  let current: React.ReactNode = null;
  if (invites.length > 0 && assignable) {
    current = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Campaign sx={{ fontSize: 28, color: colors.primary[500] }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>
              {invites.length} sürücüye gönderildi · {offeredInvites} teklif
            </Typography>
            <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>
              Gelen teklifler aşağıda listelenir. Birini onaylayınca diğer davetler kapanır.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mb: 2, border: `1px solid ${colors.neutral[200]}`, borderRadius: 2 }}>
          {invites.map((invite, index) => {
            const offered = invite.status === 'offered';
            return (
              <Box
                key={invite.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, flexWrap: 'wrap',
                  borderTop: index === 0 ? 'none' : `1px solid ${colors.neutral[100]}`,
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.neutral[900] }}>{driverFullName(invite.driver)}</Typography>
                <Typography sx={{ fontSize: 12, color: colors.neutral[500] }}>{invite.driver.phone_number}</Typography>
                <Chip
                  label={offered ? 'Teklif verdi' : 'Teklif bekleniyor'}
                  size="small"
                  sx={{
                    ml: 'auto', height: 20, fontSize: 11, fontWeight: 600,
                    bgcolor: offered ? colors.success[100] : colors.primary[50],
                    color: offered ? colors.success[700] : colors.primary[700],
                  }}
                />
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="error" onClick={handleCancel} disabled={cancelling} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {cancelling ? 'İptal ediliyor...' : 'Davetleri iptal et'}
          </Button>
          {broadcastButton}
          <Button component={Link} to={`/panel/requests/${request.request_id}/assign`} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Tek sürücüye ata
          </Button>
          {marketplaceButton}
        </Box>
      </>
    );
  } else if (active?.status === 'pending') {
    current = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <HourglassTop sx={{ fontSize: 28, color: colors.primary[500] }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>
              {driverFullName(active.driver)} · yanıt bekleniyor
            </Typography>
            <Typography sx={{ fontSize: 13, color: countdown.isExpired ? colors.danger[500] : colors.neutral[500] }}>
              {countdown.isExpired ? 'Süre doldu, sonuç bekleniyor' : `Yanıt için ${countdown.label}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="error" onClick={handleCancel} disabled={cancelling} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {cancelling ? 'İptal ediliyor...' : 'Atamayı iptal et'}
          </Button>
          {assignable && broadcastButton}
          {assignable && marketplaceButton}
        </Box>
      </>
    );
  } else if (active?.status === 'offered') {
    if (assignable) {
      current = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle sx={{ fontSize: 28, color: colors.success[600] }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>
              {driverFullName(active.driver)} teklif verdi
            </Typography>
            <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>Teklifi aşağıdaki listeden onaylayabilirsiniz.</Typography>
          </Box>
        </Box>
      );
    }
  } else if (assignable) {
    current = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <PersonSearch sx={{ fontSize: 28, color: colors.neutral[400] }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>Sürücü atanmadı</Typography>
            <Typography sx={{ fontSize: 13, color: colors.neutral[500] }}>
              Talep yayınlanmadı. Haritadan kendi sürücünüzü seçin, tüm sürücülerinize gönderin ya da talebi pazaryerine açın.
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
          {broadcastButton}
          {marketplaceButton}
        </Box>
      </>
    );
  }

  if (!current && history.length === 0) return null;

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
          Doğrudan Atama
        </Typography>

        {current}

        {history.length > 0 && (
          <Box sx={{ mt: current ? 2.5 : 0, pt: current ? 2 : 0, borderTop: current ? `1px solid ${colors.neutral[200]}` : 'none' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[500], mb: 1 }}>Atama geçmişi</Typography>
            {history.map((item) => {
              const tone = statusColors[item.status] ?? statusColors.cancelled;
              return (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, flexWrap: 'wrap' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.neutral[900] }}>{driverFullName(item.driver)}</Typography>
                {item.mode === 'broadcast' && (
                  <Typography sx={{ fontSize: 11, color: colors.neutral[400] }}>toplu davet</Typography>
                )}
                <Chip
                  label={AssignmentStatusLabels[item.status] ?? item.status}
                  size="small"
                  sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: tone.bg, color: tone.color }}
                />
                {item.cancel_reason && (
                  <Typography sx={{ fontSize: 12, color: colors.neutral[500] }}>
                    {AssignmentCancelReasonLabels[item.cancel_reason] ?? item.cancel_reason}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 12, color: colors.neutral[400], ml: 'auto' }}>
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

      <BroadcastDialog
        open={broadcastOpen}
        requestId={request.request_id}
        hasPendingAssignment={active?.status === 'pending'}
        alreadyBroadcast={invites.length > 0}
        onClose={() => setBroadcastOpen(false)}
        onDone={() => {
          setBroadcastOpen(false);
          onChanged();
        }}
      />
    </Card>
  );
}
