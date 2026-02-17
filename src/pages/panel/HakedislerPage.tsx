import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, CircularProgress, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import {
  AccountBalanceWallet, CheckCircle, TrendingUp, Percent,
  ChevronLeft, ChevronRight, Close, CalendarMonth,
} from '@mui/icons-material';
import { listHakedisler } from '../../api';
import { ServiceTypeLabels, RequestStatusLabels, RequestStatusColors } from '../../types';
import type { HakedisListItem, HakedisListResponse } from '../../types';

const formatPrice = (price: string) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(parseFloat(price));

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('tr-TR');

export default function HakedislerPage() {
  const [data, setData] = useState<HakedisListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<HakedisListItem | null>(null);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listHakedisler({ page, page_size: pageSize });
      setData(result);
    } catch {
      setError('Hakedisler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary;
  const items = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  const statCards = [
    { label: 'Toplam Kazanc', value: summary ? `${formatPrice(summary.total_earnings)} TL` : '-', icon: <AccountBalanceWallet sx={{ fontSize: 24 }} />, gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)', shadow: 'rgba(34, 197, 94, 0.3)' },
    { label: 'Bu Ay Kazanc', value: summary ? `${formatPrice(summary.this_month_earnings)} TL` : '-', icon: <CalendarMonth sx={{ fontSize: 24 }} />, gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', shadow: 'rgba(14, 165, 233, 0.3)' },
    { label: 'Tamamlanan Is', value: summary?.total_completed ?? '-', icon: <CheckCircle sx={{ fontSize: 24 }} />, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
    { label: 'Komisyon Orani', value: summary ? `%${summary.commission_rate}` : '-', icon: <Percent sx={{ fontSize: 24 }} />, gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', shadow: 'rgba(249, 115, 22, 0.3)' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Hakedisler</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b' }}>
          Tamamlanan taleplerinizden elde ettiginiz kazanclar
        </Typography>
      </Box>

      {/* Istatistik kartlari */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        {statCards.map((card) => (
          <Card key={card.label} sx={{ border: 'none', boxShadow: 'none', bgcolor: 'white', borderRadius: 3, overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2.5,
                  background: card.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${card.shadow}`,
                  color: 'white',
                }}>
                  {card.icon}
                </Box>
                <TrendingUp sx={{ color: '#cbd5e1', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                {card.value}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.5 }}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
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
          ) : items.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <AccountBalanceWallet sx={{ fontSize: 56, color: '#e2e8f0', mb: 1.5 }} />
              <Typography sx={{ color: '#94a3b8', fontSize: 15, mb: 0.5 }}>Henuz hakedis bulunmuyor</Typography>
              <Typography sx={{ color: '#cbd5e1', fontSize: 13 }}>
                Tamamlanan taleplerinizin hakedisleri burada listelenecek
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
                    <TableCell>Talep ID</TableCell>
                    <TableCell>Hizmet Tipi</TableCell>
                    <TableCell>Musteri</TableCell>
                    <TableCell>Tamamlanma</TableCell>
                    <TableCell align="right">Toplam Fiyat</TableCell>
                    <TableCell align="right">Hakedis</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.request_id}
                      hover
                      onClick={() => setSelectedItem(item)}
                      sx={{ '& td': { py: 1.5, borderBottom: '1px solid #f1f5f9' }, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>#{item.request_id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{ServiceTypeLabels[item.service_type] || item.service_type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{item.insured_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>{formatDate(item.completed_at)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{formatPrice(item.estimated_price)} {item.currency}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatPrice(item.insurance_commission)} {item.currency}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={RequestStatusLabels[item.status] || item.status}
                          color={RequestStatusColors[item.status] || 'default'}
                          size="small"
                          sx={{ fontSize: 11, fontWeight: 600, height: 24 }}
                        />
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

      {/* Detay Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedItem && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  Hakedis Detay #{selectedItem.request_id}
                </Typography>
                <Chip
                  label={ServiceTypeLabels[selectedItem.service_type] || selectedItem.service_type}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: 11, borderColor: '#e2e8f0', color: '#64748b' }}
                />
              </Box>
              <IconButton size="small" onClick={() => setSelectedItem(null)} sx={{ color: '#94a3b8' }}>
                <Close fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {/* Musteri bilgileri */}
              <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
                  Musteri Bilgileri
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Ad Soyad</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{selectedItem.insured_name}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Durum</Typography>
                    <Chip
                      label={RequestStatusLabels[selectedItem.status] || selectedItem.status}
                      color={RequestStatusColors[selectedItem.status] || 'default'}
                      size="small"
                      sx={{ fontSize: 11, fontWeight: 600, height: 22 }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Fiyatlandirma */}
              <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                  Fiyatlandirma
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748b' }}>Toplam Fiyat</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                    {formatPrice(selectedItem.estimated_price)} {selectedItem.currency}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748b' }}>Komisyon Orani</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                    %{summary?.commission_rate || '-'}
                  </Typography>
                </Box>
                <Box sx={{ borderTop: '1px solid #e2e8f0', mt: 1, pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Hakedis (Kazanc)</Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                    {formatPrice(selectedItem.insurance_commission)} {selectedItem.currency}
                  </Typography>
                </Box>
              </Box>

              {/* Zaman */}
              <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
                  Zaman Bilgisi
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748b' }}>Tamamlanma Tarihi</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                    {formatDateTime(selectedItem.completed_at)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedItem(null)} sx={{ color: '#64748b', fontWeight: 500 }}>Kapat</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
