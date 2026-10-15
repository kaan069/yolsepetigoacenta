import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, CircularProgress, Alert, Button, Chip, Tooltip,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { PersonAdd, Groups } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { listPoolDrivers, removeDriver, getApiError } from '../../../api';
import { DriverServiceLabels } from '../../../types';
import type { PoolDriver } from '../../../types';
import { driverFullName, describeLocation, describeLastSeen, getPoolDriverStatus } from '../../../utils/drivers';
import type { PoolDriverStatus } from '../../../utils/drivers';
import AddDriverDialog from './AddDriverDialog';
import { colors, alpha } from '../../../tokens';

const statusChips: Record<PoolDriverStatus, { label: string; bg: string; color: string }> = {
  pending_approval: { label: 'Eksik / onay bekliyor', bg: colors.neutral[100], color: colors.neutral[500] },
  busy: { label: 'Meşgul', bg: colors.secondary[100], color: colors.secondary[700] },
  offline: { label: 'Çevrimdışı', bg: colors.neutral[100], color: colors.neutral[500] },
  available: { label: 'Müsait', bg: colors.success[100], color: colors.success[600] },
};

function StatusCell({ poolDriver }: { poolDriver: PoolDriver }) {
  const statusKey = getPoolDriverStatus(poolDriver);
  const status = statusChips[statusKey];
  const chip = (
    <Chip
      label={status.label}
      size="small"
      sx={{ fontSize: 11, fontWeight: 600, height: 24, bgcolor: status.bg, color: status.color }}
    />
  );
  if (statusKey !== 'pending_approval') return chip;

  // Eksik adimlar tooltip'te; kaydedilen surucude acente tamamlayabilir, eklenende surucu tamamlar
  const steps = poolDriver.missing_steps ?? [];
  return (
    <Box>
      {steps.length > 0 ? (
        <Tooltip
          arrow
          title={(
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {steps.map((step, index) => <li key={index}>{step.message}</li>)}
            </Box>
          )}
        >
          {chip}
        </Tooltip>
      ) : chip}
      {poolDriver.managed ? (
        <Button
          component={Link}
          to={`/panel/drivers/${poolDriver.driver.id}`}
          size="small"
          sx={{ display: 'block', mt: 0.5, p: 0, minWidth: 0, fontSize: 12, fontWeight: 600, textTransform: 'none' }}
        >
          Belgeleri tamamla
        </Button>
      ) : (
        <Typography sx={{ fontSize: 11, color: colors.neutral[400], mt: 0.5 }}>Sürücü kendi uygulamasından tamamlamalı.</Typography>
      )}
    </Box>
  );
}

export default function DriversPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [drivers, setDrivers] = useState<PoolDriver[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PoolDriver | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await listPoolDrivers();
      setDrivers(data.results);
      setLoadedAt(Date.now());
      setError('');
    } catch {
      setError('Sürücüler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeDriver(removeTarget.driver.id);
      enqueueSnackbar(`${driverFullName(removeTarget.driver)} listenizden çıkarıldı`, { variant: 'success' });
      setRemoveTarget(null);
      fetchDrivers();
    } catch (err) {
      const apiError = getApiError(err);
      enqueueSnackbar(apiError.message || 'Sürücü listeden çıkarılamadı', { variant: 'error' });
      // NOT_IN_POOL: sürücü zaten listede değil, listeyi tazele
      if (apiError.status === 404) {
        setRemoveTarget(null);
        fetchDrivers();
      }
    } finally {
      setRemoving(false);
    }
  };

  const handleAdded = () => {
    fetchDrivers();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: colors.neutral[900] }}>Sürücülerim</Typography>
          <Typography sx={{ fontSize: 14, color: colors.neutral[500] }}>
            {drivers.length > 0 ? `Listenizde ${drivers.length} sürücü var` : 'Taleplerinizi atayabileceğiniz sürücüler'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setAddOpen(true)}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
            boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.35)}`,
            '&:hover': { boxShadow: `0 6px 20px ${alpha(colors.primary[500], 0.4)}` },
          }}
        >
          Sürücü Ekle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}` }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : drivers.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center', px: 2 }}>
              <Groups sx={{ fontSize: 56, color: colors.neutral[200], mb: 1.5 }} />
              <Typography sx={{ color: colors.neutral[400], fontSize: 15, mb: 0.5 }}>Henüz sürücünüz yok</Typography>
              <Typography sx={{ color: colors.neutral[300], fontSize: 13, mb: 2 }}>
                Kayıtlı sürücüleri numarasıyla ekleyin ya da yeni sürücü kaydedin
              </Typography>
              <Button variant="contained" size="small" startIcon={<PersonAdd />} onClick={() => setAddOpen(true)}>
                Sürücü Ekle
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: colors.neutral[50], color: colors.neutral[500], fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: `1px solid ${colors.neutral[200]}` } }}>
                    <TableCell>Ad Soyad</TableCell>
                    <TableCell>Telefon</TableCell>
                    <TableCell>Hizmetler</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Konum</TableCell>
                    <TableCell>Eklenme</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drivers.map((item) => (
                    <TableRow key={item.membership_id} sx={{ '& td': { py: 1.5, borderBottom: `1px solid ${colors.neutral[100]}` } }}>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[900] }}>{driverFullName(item.driver)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700], fontFamily: 'monospace' }}>{item.driver.phone_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>
                          {item.driver.user_type.map((type) => DriverServiceLabels[type] ?? type).join(', ') || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusCell poolDriver={item} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{describeLocation(item.location, loadedAt)}</Typography>
                        {item.location?.source === 'business' && item.business_address && (
                          <Typography sx={{ fontSize: 11, color: colors.neutral[400] }}>{item.business_address}</Typography>
                        )}
                        {describeLastSeen(item.location, item.app_location, loadedAt) && (
                          <Typography sx={{ fontSize: 11, color: colors.neutral[400] }}>
                            {describeLastSeen(item.location, item.app_location, loadedAt)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>
                          {item.source === 'registered' ? 'Kaydedildi' : 'Eklendi'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: colors.neutral[400] }}>
                          {new Date(item.added_at).toLocaleDateString('tr-TR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {/* Belge ve bilgileri yalnizca panelden kaydedilen surucude duzenlenebilir */}
                          {item.managed && (
                            <Button component={Link} to={`/panel/drivers/${item.driver.id}`} size="small" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Düzenle
                            </Button>
                          )}
                          <Button size="small" color="error" onClick={() => setRemoveTarget(item)} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Listeden çıkar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {addOpen && <AddDriverDialog onClose={() => setAddOpen(false)} onAdded={handleAdded} />}

      {/* Listeden cikarma onayi */}
      <Dialog open={!!removeTarget} onClose={() => !removing && setRemoveTarget(null)} slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Listeden Çıkar</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {removeTarget && driverFullName(removeTarget.driver)} listenizden çıkarılsın mı? Bu sürücüye bekleyen bir atamanız varsa iptal edilir.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveTarget(null)} disabled={removing} sx={{ color: colors.neutral[500] }}>Vazgeç</Button>
          <Button onClick={handleRemove} color="error" variant="contained" disabled={removing} sx={{ borderRadius: 2 }}>
            {removing ? 'Çıkarılıyor...' : 'Listeden Çıkar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
