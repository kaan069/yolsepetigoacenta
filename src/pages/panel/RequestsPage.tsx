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
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Talepler</Typography>
          <Typography sx={{ fontSize: 14, color: '#64748b' }}>
            {totalCount > 0 ? `Toplam ${totalCount} talep` : 'Tum taleplerinizi buradan yonetin'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          component={Link}
          to="/panel/requests/new"
          sx={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            '&:hover': { boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)' },
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
              bgcolor: statusFilter === f.value ? '#0ea5e9' : 'white',
              color: statusFilter === f.value ? 'white' : '#64748b',
              border: statusFilter === f.value ? 'none' : '1px solid #e2e8f0',
              boxShadow: statusFilter === f.value ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none',
              '&:hover': {
                bgcolor: statusFilter === f.value ? '#0284c7' : '#f8fafc',
              },
            }}
          />
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Tablo */}
      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <ListAlt sx={{ fontSize: 56, color: '#e2e8f0', mb: 1.5 }} />
              <Typography sx={{ color: '#94a3b8', fontSize: 15, mb: 0.5 }}>Talep bulunmuyor</Typography>
              <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>
                {statusFilter ? 'Bu filtreye uygun talep yok' : 'Ilk talebi olusturmak icin "Yeni Talep" butonuna basin'}
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
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
                      sx={{ '& td': { py: 1.5, borderBottom: '1px solid #f1f5f9' }, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer', textDecoration: 'none' }}
                      component={Link}
                      to={`/panel/requests/${req.request_id}`}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>#{req.request_id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{ServiceTypeLabels[req.service_type] || req.service_type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{req.insured_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>{req.policy_number}</Typography>
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
                        <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>{new Date(req.created_at).toLocaleDateString('tr-TR')}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" sx={{ color: '#cbd5e1' }}>
                          <ArrowForward sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, py: 2, borderTop: '1px solid #e2e8f0' }}>
                  <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} sx={{ color: '#64748b' }}>
                    <ChevronLeft />
                  </IconButton>
                  <Typography sx={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                    Sayfa {page} / {totalPages}
                  </Typography>
                  <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} sx={{ color: '#64748b' }}>
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
