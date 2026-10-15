import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import type { ApiErrorInfo } from '../../../api';

// DRIVER_NOT_FOUND: surucu artik bu acentenin listesinde degil; listeye donulur (liste orada yeniden yuklenir).
// Hata bu sekilde ele alindiysa true doner.
export function useDriverGoneRedirect() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  return useCallback((apiError: ApiErrorInfo) => {
    if (apiError.code !== 'DRIVER_NOT_FOUND') return false;
    enqueueSnackbar(apiError.message || 'Sürücü listenizde bulunamadı', { variant: 'warning' });
    navigate('/panel/drivers', { replace: true });
    return true;
  }, [navigate, enqueueSnackbar]);
}
