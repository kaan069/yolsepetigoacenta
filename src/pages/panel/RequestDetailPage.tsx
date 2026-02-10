import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, CircularProgress, Alert,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, Tooltip, keyframes,
} from '@mui/material';
import {
  ArrowBack, ContentCopy, Person, Schedule, LocalShipping,
  Star, CheckCircle, Cancel, Phone, Sms,
} from '@mui/icons-material';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  getInsuranceRequest, getRequestOffers,
  cancelInsuranceRequest, acceptOffer as acceptOfferApi, extractTrackingToken,
  createPaymentLink,
} from '../../api';
import { ServiceTypeLabels, RequestStatusLabels, RequestStatusColors } from '../../types';
import type { InsuranceRequestDetail, DriverOfferInfo, OffersResponse } from '../../types';
import { useRequestWebSocket } from '../../hooks/useRequestWebSocket';

// --- Animasyonlar ---

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Yardimci ---

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR');
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const ACTIVE_STATUSES = ['pending', 'awaiting_approval', 'awaiting_payment'];
const TERMINAL_STATUSES = ['completed', 'cancelled'];

// --- ElapsedTimer ---

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
      if (diff < 0) { setElapsed('0 sn'); return; }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(m > 0 ? `${m} dk ${s} sn` : `${s} sn`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [since]);

  return (
    <Typography sx={{ fontSize: 14, color: '#64748b', fontFamily: 'monospace' }}>
      {elapsed}
    </Typography>
  );
}

// --- MatchingView (pending) ---

function MatchingView({ request }: { request: InsuranceRequestDetail }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 3 }}>
      <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Box sx={{ position: 'relative', width: 100, height: 100, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[0, 0.5, 1].map((delay, i) => (
            <Box key={i} sx={{
              position: 'absolute', width: 100, height: 100, borderRadius: '50%',
              bgcolor: '#0ea5e9', animation: `${pulse} 2s ease-out infinite ${delay}s`,
            }} />
          ))}
          <Box sx={{
            position: 'relative', width: 64, height: 64, borderRadius: '50%',
            bgcolor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          }}>
            <LocalShipping sx={{ color: 'white', fontSize: 32 }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Surucu Araniyor...
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3, maxWidth: 300 }}>
          Yakininizdaki suruculer bilgilendiriliyor. Teklifler geldiginde burada listelenecek.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2.5, py: 1, borderRadius: 2 }}>
          <Schedule sx={{ fontSize: 16, color: '#94a3b8' }} />
          <ElapsedTimer since={request.timeline.created_at} />
        </Box>
      </CardContent>
    </Card>
  );
}

// --- OffersView (awaiting_approval) ---

function OffersView({
  request, offers, onAccept,
}: {
  request: InsuranceRequestDetail;
  offers: DriverOfferInfo[];
  onAccept: (offer: DriverOfferInfo) => void;
}) {
  const pendingOffers = offers.filter(o => o.status === 'pending');
  const lowestPrice = pendingOffers.length > 0 ? Math.min(...pendingOffers.map(o => o.estimated_price)) : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
          {pendingOffers.length} surucu teklif gonderdi
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2, py: 0.75, borderRadius: 2 }}>
          <Schedule sx={{ fontSize: 14, color: '#94a3b8' }} />
          <ElapsedTimer since={request.timeline.created_at} />
        </Box>
      </Box>

      {pendingOffers.map((offer, index) => (
        <Card
          key={offer.id}
          sx={{
            borderRadius: 3, boxShadow: 'none', mb: 2,
            border: offer.estimated_price === lowestPrice ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
            animation: `${fadeIn} 0.4s ease-out`,
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
            position: 'relative', overflow: 'visible',
          }}
        >
          {offer.estimated_price === lowestPrice && (
            <Chip
              label="En Uygun"
              size="small"
              sx={{
                position: 'absolute', top: -10, right: 16,
                bgcolor: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, height: 22,
              }}
            />
          )}
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Person sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                    {offer.driver_info.name}
                  </Typography>
                  {offer.driver_info.average_rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
                      <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                      <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                        {offer.driver_info.average_rating.toFixed(1)} ({offer.driver_info.total_ratings})
                      </Typography>
                    </Box>
                  )}
                </Box>
                {offer.vehicle_info && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocalShipping sx={{ fontSize: 16, color: '#94a3b8' }} />
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>
                      {offer.vehicle_info.brand} {offer.vehicle_info.model} - {offer.vehicle_info.plate_number}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{offer.driver_info.phone}</Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                  {formatPrice(offer.estimated_price)} TRY
                </Typography>
                <Button
                  variant="contained" size="small"
                  onClick={() => onAccept(offer)}
                  sx={{ bgcolor: '#0ea5e9', fontWeight: 600, fontSize: 13, px: 2.5, '&:hover': { bgcolor: '#0284c7' } }}
                >
                  Onayla
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// --- ActiveJobView ---

function ActiveJobView({
  request, onSendPaymentSms, sendingSms, smsSuccess,
}: {
  request: InsuranceRequestDetail;
  onSendPaymentSms: () => void;
  sendingSms: boolean;
  smsSuccess: boolean;
}) {
  const isPayment = request.status === 'awaiting_payment';
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: isPayment ? '#f0f9ff' : '#ecfdf5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LocalShipping sx={{ fontSize: 22, color: isPayment ? '#0ea5e9' : '#10b981' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
              {isPayment ? 'Odeme Bekleniyor' : 'Hizmet Devam Ediyor'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
              {isPayment ? 'Surucu atandi, odeme bekleniyor' : 'Surucu yolda, hizmet devam ediyor'}
            </Typography>
          </Box>
        </Box>
        {request.driver?.name && (
          <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person sx={{ fontSize: 18, color: '#64748b' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{request.driver.name}</Typography>
            </Box>
            {request.driver.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>{request.driver.phone}</Typography>
              </Box>
            )}
          </Box>
        )}
        {request.pricing?.estimated_price && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: '#64748b' }}>Kabul Edilen Fiyat</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {request.pricing.estimated_price} {request.pricing.currency}
            </Typography>
          </Box>
        )}
        {isPayment && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
            {smsSuccess ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Odeme linki basariyla gonderildi
              </Alert>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={onSendPaymentSms}
                disabled={sendingSms}
                startIcon={sendingSms ? <CircularProgress size={18} color="inherit" /> : <Sms />}
                sx={{
                  bgcolor: '#0ea5e9',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1.2,
                  '&:hover': { bgcolor: '#0284c7' },
                }}
              >
                {sendingSms ? 'Gonderiliyor...' : 'Odeme Linki Gonder'}
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// --- CompletedView ---

function CompletedView({ request }: { request: InsuranceRequestDetail }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #d1fae5', bgcolor: '#f0fdf4', mb: 3 }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 56, color: '#10b981', mb: 1.5 }} />
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0f172a', mb: 0.5 }}>Hizmet Tamamlandi</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 2 }}>{formatDate(request.timeline.completed_at)}</Typography>
        {request.driver?.name && (
          <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 2, mb: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ fontSize: 18, color: '#64748b' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{request.driver.name}</Typography>
          </Box>
        )}
        {request.pricing?.estimated_price && (
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
            {request.pricing.estimated_price} {request.pricing.currency}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// --- CancelledView ---

function CancelledView() {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fecaca', bgcolor: '#fef2f2', mb: 3 }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Cancel sx={{ fontSize: 56, color: '#ef4444', mb: 1.5 }} />
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0f172a', mb: 0.5 }}>Talep Iptal Edildi</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b' }}>Bu talep iptal edilmistir</Typography>
      </CardContent>
    </Card>
  );
}

// --- InfoItem ---

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography sx={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value || '-'}</Typography>
    </Box>
  );
}

// --- RequestInfoCard ---

function RequestInfoCard({ request, copied, onCopy }: {
  request: InsuranceRequestDetail; copied: boolean; onCopy: () => void;
}) {
  return (
    <>
      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
            Sigortali Bilgileri
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <InfoItem label="Ad Soyad" value={request.insured_name} />
            <InfoItem label="Telefon" value={request.insured_phone} />
            <InfoItem label="Plaka" value={request.insured_plate} />
            <InfoItem label="Police No" value={request.policy_number} />
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
            Zaman Cizelgesi
          </Typography>
          <InfoItem label="Olusturulma" value={formatDate(request.timeline.created_at)} />
          <InfoItem label="Kabul Edilme" value={formatDate(request.timeline.accepted_at)} />
          <InfoItem label="Tamamlanma" value={formatDate(request.timeline.completed_at)} />
        </CardContent>
      </Card>
      {request.tracking_url && (
        <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, '&:last-child': { pb: 2 } }}>
            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, flexShrink: 0 }}>Takip:</Typography>
            <Box sx={{ flex: 1, bgcolor: '#f8fafc', borderRadius: 1.5, px: 2, py: 0.75, overflow: 'hidden' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {request.tracking_url}
              </Typography>
            </Box>
            <Tooltip title={copied ? 'Kopyalandi!' : 'Kopyala'}>
              <IconButton size="small" onClick={onCopy} sx={{ color: '#64748b' }}>
                <ContentCopy sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// === MAIN COMPONENT ===

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateToken = (location.state as { trackingToken?: string } | null)?.trackingToken;

  const [request, setRequest] = useState<InsuranceRequestDetail | null>(null);
  const [offers, setOffers] = useState<DriverOfferInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<DriverOfferInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);

  const requestId = id ? Number(id) : null;

  // tracking token: from navigation state or parse from tracking_url
  const trackingToken = stateToken
    || (request?.tracking_url ? extractTrackingToken(request.tracking_url) : null);

  // --- Data fetching ---

  const fetchRequest = useCallback(async () => {
    if (!requestId) return null;
    try {
      const reqData = await getInsuranceRequest(requestId);
      setRequest(reqData);
      setError('');
      return reqData;
    } catch {
      setError('Talep bilgileri yuklenirken hata olustu');
      return null;
    }
  }, [requestId]);

  const fetchOffers = useCallback(async (token: string) => {
    try {
      const offersData: OffersResponse = await getRequestOffers(token);
      setOffers(offersData.offers || []);
    } catch {
      // Teklifler yuklenemezse sessizce devam et
    }
  }, []);

  // Ilk yukleme
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const reqData = await fetchRequest();
      if (reqData) {
        const token = stateToken || (reqData.tracking_url ? extractTrackingToken(reqData.tracking_url) : null);
        if (token && ACTIVE_STATUSES.includes(reqData.status)) {
          await fetchOffers(token);
        }
      }
      setLoading(false);
    };
    init();
  }, [fetchRequest, fetchOffers, stateToken]);

  // --- WebSocket ---

  const wsEnabled = !loading && !!trackingToken && !!request && !TERMINAL_STATUSES.includes(request.status);

  const { isConnected } = useRequestWebSocket({
    trackingToken,
    enabled: wsEnabled,
    onNewOffer: useCallback((offer: DriverOfferInfo) => {
      setOffers(prev => {
        if (prev.some(o => o.id === offer.id)) return prev;
        return [...prev, offer];
      });
      fetchRequest();
    }, [fetchRequest]),
    onOfferWithdrawn: useCallback((offerId: number) => {
      setOffers(prev => prev.filter(o => o.id !== offerId));
    }, []),
    onStatusChange: useCallback(() => {
      fetchRequest();
    }, [fetchRequest]),
  });

  // --- Handlers ---

  const handleCancel = async () => {
    if (!requestId) return;
    setCancelling(true);
    try {
      await cancelInsuranceRequest(requestId);
      await fetchRequest();
      setCancelDialogOpen(false);
    } catch {
      setError('Talep iptal edilirken hata olustu');
    } finally {
      setCancelling(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!trackingToken || !selectedOffer) return;
    setAccepting(true);
    setAcceptError('');
    try {
      await acceptOfferApi(trackingToken, selectedOffer.id);
      await fetchRequest();
      setAcceptDialogOpen(false);
      setSelectedOffer(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
        setAcceptError(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Teklif kabul edilirken hata olustu');
      } else {
        setAcceptError('Bir hata olustu');
      }
    } finally {
      setAccepting(false);
    }
  };

  const openAcceptDialog = (offer: DriverOfferInfo) => {
    setSelectedOffer(offer);
    setAcceptError('');
    setAcceptDialogOpen(true);
  };

  const handleSendPaymentSms = async () => {
    if (!requestId || !request?.pricing?.estimated_price) return;
    setSendingSms(true);
    try {
      await createPaymentLink(requestId, {
        price: parseFloat(request.pricing.estimated_price),
      });
      setSmsSuccess(true);
      setTimeout(() => setSmsSuccess(false), 5000);
    } catch {
      setError('Odeme linki olusturulamadi');
    } finally {
      setSendingSms(false);
    }
  };

  const copyTrackingUrl = () => {
    if (request?.tracking_url) {
      navigator.clipboard.writeText(request.tracking_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canCancel = request?.status !== 'completed' && request?.status !== 'cancelled';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Talep bulunamadi'}</Alert>
        <Button component={Link} to="/panel/requests" sx={{ mt: 2 }} startIcon={<ArrowBack />}>Geri Don</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Button component={Link} to="/panel/requests" startIcon={<ArrowBack />} size="small" sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}>
        Geri
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          Talep #{request.request_id}
        </Typography>
        <Chip
          label={RequestStatusLabels[request.status] || request.status}
          color={RequestStatusColors[request.status] || 'default'}
          sx={{ fontSize: 12, fontWeight: 600 }}
        />
        <Chip
          label={ServiceTypeLabels[request.service_type] || request.service_type}
          variant="outlined" sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#64748b' }}
        />
        {wsEnabled && (
          <Chip
            label={isConnected ? 'Canli' : 'Baglaniyor...'}
            size="small"
            sx={{
              fontSize: 10, height: 20,
              bgcolor: isConnected ? '#dcfce7' : '#fef9c3',
              color: isConnected ? '#16a34a' : '#ca8a04',
            }}
          />
        )}
        {canCancel && (
          <Button
            variant="outlined" color="error" size="small"
            onClick={() => setCancelDialogOpen(true)}
            sx={{ ml: 'auto', borderRadius: 2, fontWeight: 600 }}
          >
            Iptal Et
          </Button>
        )}
      </Box>

      {request.status === 'pending' && offers.filter(o => o.status === 'pending').length === 0 && (
        <MatchingView request={request} />
      )}
      {(request.status === 'awaiting_approval' || (request.status === 'pending' && offers.filter(o => o.status === 'pending').length > 0)) && (
        <OffersView request={request} offers={offers} onAccept={openAcceptDialog} />
      )}
      {(request.status === 'awaiting_payment' || request.status === 'in_progress') && (
        <ActiveJobView
          request={request}
          onSendPaymentSms={handleSendPaymentSms}
          sendingSms={sendingSms}
          smsSuccess={smsSuccess}
        />
      )}
      {request.status === 'completed' && <CompletedView request={request} />}
      {request.status === 'cancelled' && <CancelledView />}

      <RequestInfoCard request={request} copied={copied} onCopy={copyTrackingUrl} />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Talebi Iptal Et</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            #{request.request_id} numarali talebi iptal etmek istediginize emin misiniz? Bu islem geri alinamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling} sx={{ color: '#64748b' }}>Vazgec</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={cancelling} sx={{ borderRadius: 2 }}>
            {cancelling ? 'Iptal ediliyor...' : 'Iptal Et'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept Offer Dialog */}
      <Dialog open={acceptDialogOpen} onClose={() => setAcceptDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Teklifi Onayla</DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <Box>
              <DialogContentText sx={{ fontSize: 14, mb: 2 }}>
                Bu teklifi kabul etmek istediginize emin misiniz?
              </DialogContentText>
              <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
                  {selectedOffer.driver_info.name}
                </Typography>
                {selectedOffer.vehicle_info && (
                  <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>
                    {selectedOffer.vehicle_info.brand} {selectedOffer.vehicle_info.model} - {selectedOffer.vehicle_info.plate_number}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0ea5e9' }}>
                  {formatPrice(selectedOffer.estimated_price)} TRY
                </Typography>
              </Box>
              {acceptError && <Alert severity="error" sx={{ mt: 2 }}>{acceptError}</Alert>}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAcceptDialogOpen(false)} disabled={accepting} sx={{ color: '#64748b' }}>Vazgec</Button>
          <Button
            onClick={handleAcceptOffer} variant="contained" disabled={accepting}
            sx={{ borderRadius: 2, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
          >
            {accepting ? 'Onaylaniyor...' : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
