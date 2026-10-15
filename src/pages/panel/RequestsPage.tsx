import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, CircularProgress, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Button, IconButton,
} from '@mui/material';
import { Add, ArrowForward, ListAlt, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { listInsuranceRequests } from '../../api';
import { RequestStatus, RequestStatusLabels, RequestStatusColors, ServiceTypeLabels } from '../../types';
import type { InsuranceRequestSummary } from '../../types';
import { colors, alpha } from '../../tokens';

const statusFilters = [
  { label: 'Tumu', value: '' },
  { label: 'Konum Bekleniyor', value: RequestStatus.PendingLocation },
  { label: 'Beklemede', value: RequestStatus.Pending },
  { label: 'Onay Bekleniyor', value: RequestStatus.AwaitingApproval },
  { label: 'Odeme Bekleniyor', value: RequestStatus.AwaitingPayment },
  { label: 'Devam Ediyor', value: RequestStatus.InProgress },
  { label: 'Tamamlandi', value: RequestStatus.Completed },
  { label: 'Iptal', value: RequestStatus.Cancelled },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<InsuranceRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { page: number; page_size: number; status?: string } = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      const data = await listInsuranceRequests(params);
      setRequests(data.results);
      setTotalCount(data.count);
    } catch {
      setError('Talepler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: colors.neutral[900] }}>Talepler</Typography>
          <Typography sx={{ fontSize: 14, color: colors.neutral[500] }}>
            {totalCount > 0 ? `Toplam ${totalCount} talep` : 'Tum taleplerinizi buradan yonetin'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          component={Link}
          to="/panel/requests/new"
          sx={{
            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
            boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.35)}`,
            '&:hover': { boxShadow: `0 6px 20px ${alpha(colors.primary[500], 0.4)}` },
          }}
        >
          Yeni Talep
        </Button>
      </Box>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {statusFilters.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            sx={{
              fontWeight: statusFilter === f.value ? 600 : 400,
              fontSize: 13,
              bgcolor: statusFilter === f.value ? colors.primary[500] : 'white',
              color: statusFilter === f.value ? 'white' : colors.neutral[500],
              border: statusFilter === f.value ? 'none' : `1px solid ${colors.neutral[200]}`,
              boxShadow: statusFilter === f.value ? `0 2px 8px ${alpha(colors.primary[500], 0.3)}` : 'none',
              '&:hover': {
                bgcolor: statusFilter === f.value ? colors.primary[600] : colors.neutral[50],
              },
            }}
          />
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Tablo */}
      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}` }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <ListAlt sx={{ fontSize: 56, color: colors.neutral[200], mb: 1.5 }} />
              <Typography sx={{ color: colors.neutral[400], fontSize: 15, mb: 0.5 }}>Talep bulunmuyor</Typography>
              <Typography sx={{ color: colors.neutral[300], fontSize: 13 }}>
                {statusFilter ? 'Bu filtreye uygun talep yok' : 'Ilk talebi olusturmak icin "Yeni Talep" butonuna basin'}
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: colors.neutral[50], color: colors.neutral[500], fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: `1px solid ${colors.neutral[200]}` } }}>
                    <TableCell>Talep ID</TableCell>
                    <TableCell>Hizmet Tipi</TableCell>
                    <TableCell>Sigortali Adi</TableCell>
                    <TableCell>Police No</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow
                      key={req.request_id}
                      hover
                      sx={{ '& td': { py: 1.5, borderBottom: `1px solid ${colors.neutral[100]}` }, '&:hover': { bgcolor: colors.neutral[50] }, cursor: 'pointer', textDecoration: 'none' }}
                      component={Link}
                      to={`/panel/requests/${req.request_id}`}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[900] }}>#{req.request_id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{ServiceTypeLabels[req.service_type] || req.service_type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{req.insured_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[500], fontFamily: 'monospace' }}>{req.policy_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={RequestStatusLabels[req.status] || req.status}
                          color={RequestStatusColors[req.status] || 'default'}
                          size="small"
                          sx={{ fontSize: 11, fontWeight: 600, height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>{new Date(req.created_at).toLocaleDateString('tr-TR')}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" sx={{ color: colors.neutral[300] }}>
                          <ArrowForward sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, py: 2, borderTop: `1px solid ${colors.neutral[200]}` }}>
                  <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} sx={{ color: colors.neutral[500] }}>
                    <ChevronLeft />
                  </IconButton>
                  <Typography sx={{ fontSize: 13, color: colors.neutral[500], fontWeight: 500 }}>
                    Sayfa {page} / {totalPages}
                  </Typography>
                  <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} sx={{ color: colors.neutral[500] }}>
                    <ChevronRight />
                  </IconButton>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
