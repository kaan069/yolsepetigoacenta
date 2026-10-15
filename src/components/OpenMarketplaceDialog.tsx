import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { openToMarketplace, getApiError } from '../api';
import { colors } from '../tokens';

interface OpenMarketplaceDialogProps {
  open: boolean;
  requestId: number;
  onClose: () => void;
  // Talep pazaryerine acildi ya da durumu degisti; ekran tazelenmeli
  onDone: () => void;
}

export default function OpenMarketplaceDialog({ open, requestId, onClose, onDone }: OpenMarketplaceDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await openToMarketplace(requestId);
      enqueueSnackbar('Talep pazaryerine açıldı', { variant: 'success' });
      onDone();
    } catch (err) {
      const apiError = getApiError(err);
      enqueueSnackbar(apiError.message || 'Talep pazaryerine açılamadı', { variant: 'error' });
      // NOT_DIRECT / INVALID_STATUS: talep artik bu islemi kabul etmiyor
      if (apiError.code === 'NOT_DIRECT' || apiError.code === 'INVALID_STATUS') onDone();
      else onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>Pazaryerine Aç</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14 }}>
          Talep bölgedeki tüm uygun sürücülere açılacak. Emin misiniz?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: colors.neutral[500] }}>Vazgeç</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading} sx={{ borderRadius: 2 }}>
          {loading ? 'Açılıyor...' : 'Pazaryerine Aç'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
