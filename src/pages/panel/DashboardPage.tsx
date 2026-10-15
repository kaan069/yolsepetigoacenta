import { useState, useEffect } from 'react';
import {
  Typography, Card, CardContent, Box, CircularProgress, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Button, IconButton,
} from '@mui/material';
import { Assignment, HourglassEmpty, LocalShipping, CheckCircle, Cancel, TrendingUp, ArrowForward } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getProfile, listInsuranceRequests } from '../../api';
import { ServiceTypeLabels, RequestStatusLabels, RequestStatusColors } from '../../types';
import type { CompanyProfile, InsuranceRequestSummary } from '../../types';
import { useAuth } from '../../contexts/auth';
import { colors, alpha } from '../../tokens';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [recentRequests, setRecentRequests] = useState<InsuranceRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, requestsData] = await Promise.all([
          getProfile(),
          listInsuranceRequests({ page_size: 5 }),
        ]);
        setProfile(profileData);
        setRecentRequests(requestsData.results);
      } catch {
        setError('Veriler yuklenirken hata olustu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  const stats = profile?.statistics;

  const statCards = [
    { label: 'Toplam Talep', value: stats?.total_requests ?? 0, icon: <Assignment sx={{ fontSize: 24 }} />, gradient: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[400]} 100%)`, shadow: `${alpha(colors.primary[500], 0.3)}` },
    { label: 'Beklemede', value: stats?.pending_requests ?? 0, icon: <HourglassEmpty sx={{ fontSize: 24 }} />, gradient: `linear-gradient(135deg, ${colors.secondary[500]} 0%, ${colors.secondary[400]} 100%)`, shadow: `${alpha(colors.secondary[500], 0.3)}` },
    { label: 'Devam Ediyor', value: stats?.in_progress_requests ?? 0, icon: <LocalShipping sx={{ fontSize: 24 }} />, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
    { label: 'Tamamlanan', value: stats?.completed_requests ?? 0, icon: <CheckCircle sx={{ fontSize: 24 }} />, gradient: `linear-gradient(135deg, ${colors.success[500]} 0%, ${colors.success[400]} 100%)`, shadow: `${alpha(colors.success[500], 0.3)}` },
    { label: 'Iptal Edilen', value: stats?.cancelled_requests ?? 0, icon: <Cancel sx={{ fontSize: 24 }} />, gradient: `linear-gradient(135deg, ${colors.danger[500]} 0%, ${colors.danger[400]} 100%)`, shadow: `${alpha(colors.danger[500], 0.3)}` },
  ];

  return (
    <Box>
      {/* Baslik */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
          Hosgeldiniz, {user?.contact_person || user?.name}
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.neutral[500] }}>
          Islemlerinizin ozeti asagida yer almaktadir
        </Typography>
      </Box>

      {/* Istatistik kartlari */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 2.5, mb: 4 }}>
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
                <TrendingUp sx={{ color: colors.neutral[300], fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.neutral[900], lineHeight: 1 }}>
                {card.value}
              </Typography>
              <Typography sx={{ fontSize: 13, color: colors.neutral[400], mt: 0.5 }}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Son talepler */}
      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}` }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: colors.neutral[900] }}>Son Talepler</Typography>
              <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>Son 5 talep listelenmektedir</Typography>
            </Box>
            <Button
              component={Link}
              to="/panel/requests"
              size="small"
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{ color: colors.primary[500], fontWeight: 600, fontSize: 13 }}
            >
              Tumu
            </Button>
          </Box>

          {recentRequests.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 48, color: colors.neutral[200], mb: 1 }} />
              <Typography sx={{ color: colors.neutral[400], fontSize: 14 }}>Henuz talep bulunmuyor</Typography>
              <Button component={Link} to="/panel/requests/new" variant="contained" size="small" sx={{ mt: 2 }}>
                Ilk Talebi Olustur
              </Button>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: colors.neutral[50], color: colors.neutral[500], fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, borderBottom: `1px solid ${colors.neutral[200]}` } }}>
                  <TableCell>Talep ID</TableCell>
                  <TableCell>Hizmet Tipi</TableCell>
                  <TableCell>Sigortali</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {recentRequests.map((req) => (
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
                      <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>
                        {ServiceTypeLabels[req.service_type] || req.service_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: colors.neutral[700] }}>{req.insured_name}</Typography>
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
                      <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>
                        {new Date(req.created_at).toLocaleDateString('tr-TR')}
                      </Typography>
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
