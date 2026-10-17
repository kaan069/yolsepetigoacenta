import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { broadcastToPool, getApiError } from '../api';
import type { BroadcastResponse } from '../types';
import { colors } from '../tokens';

const ERROR_MESSAGES: Record<string, string> = {
  NO_DRIVERS_IN_RANGE: 'Müşteriye 50 km içinde uygun ve boşta sürücünüz yok',
  NOT_DIRECT: 'Talep pazaryerinde, toplu gönderim yapılamaz',
  INVALID_STATUS: 'Talep artık gönderim için uygun değil',
  LOCATION_REQUIRED: 'Müşterinin konumu bekleniyor',
};

interface BroadcastDialogProps {
  open: boolean;
  requestId: number;
  // Bekleyen tekil atama varsa uyarı metni gösterilir
  hasPendingAssignment?: boolean;
  // Daha önce gönderildiyse "yeni sürücüleri de davet et" anlamına gelir
  alreadyBroadcast?: boolean;
  onClose: () => void;
  // Gönderim yapıldı ya da talep bu işlemi artık kabul etmiyor; ekran tazelenmeli
  onDone: (result: BroadcastResponse | null) => void;
}

// "Tüm sürücülere gönder": talep acentenin 50 km içindeki uygun ve boştaki bütün sürücülerine gider;
// her sürücü kendi fiyatıyla teklif verir, acente teklifler arasından seçer.
export default function BroadcastDialog({
  open, requestId, hasPendingAssignment, alreadyBroadcast, onClose, onDone,
}: BroadcastDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await broadcastToPool(requestId);
      // Tekrar gönderimde invited_count sadece yeni davet edilenleri sayar
      const message = result.invited_count > 0
        ? result.message
        : `Yeni uygun sürücü yok; ${result.invites.length} davet zaten aktif`;
      enqueueSnackbar(message, { variant: result.invited_count > 0 ? 'success' : 'info' });
      onDone(result);
    } catch (err) {
      const apiError = getApiError(err);
      enqueueSnackbar(ERROR_MESSAGES[apiError.code ?? ''] || apiError.message || 'Sürücülere gönderilemedi', { variant: 'error' });
      if (apiError.code === 'NOT_DIRECT' || apiError.code === 'INVALID_STATUS') onDone(null);
      else onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{alreadyBroadcast ? 'Yeni sürücüleri de davet et' : 'Tüm sürücülere gönder'}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14 }}>
          {alreadyBroadcast
            ? 'Davetten sonra uygun hale gelen sürücüleriniz de davet edilecek. Mevcut davetler ve teklifler korunur.'
            : 'Talep, müşteriye 50 km içindeki uygun ve boştaki bütün sürücülerinize gönderilecek. Her sürücü kendi fiyatıyla teklif verir; gelen teklifler arasından birini siz seçersiniz.'}
        </DialogContentText>
        {hasPendingAssignment && (
          <DialogContentText sx={{ fontSize: 13, mt: 1.5, color: colors.warning[700] }}>
            Bekleyen atama iptal edilir. Sürücü 50 km içindeyse o da davete dahil edilir.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: colors.neutral[500] }}>Vazgeç</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading}>
          {loading ? 'Gönderiliyor...' : 'Gönder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
