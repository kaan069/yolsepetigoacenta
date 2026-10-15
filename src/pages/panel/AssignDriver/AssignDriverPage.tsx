import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Card, Chip, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { APIProvider, useMap } from '@vis.gl/react-google-maps';
import {
  getInsuranceRequest, getAssignment, getAvailableDrivers, listPoolDrivers, assignDriver, cancelAssignment,
  extractTrackingToken, getApiError,
} from '../../../api';
import { DriverServiceLabels } from '../../../types';
import type { AgencyAssignment, AvailableDriver, AvailableDriversResponse, InsuranceRequestDetail } from '../../../types';
import { useRequestWebSocket } from '../../../hooks/useRequestWebSocket';
import { GOOGLE_MAPS_API_KEY } from '../../../config';
import { ASSIGNABLE_STATUSES, assignmentOutcomeMessage, isOwnCancelReason, offeredMessage } from '../../../utils/assignments';
import PageLoader from '../../../components/PageLoader';
import OpenMarketplaceDialog from '../../../components/OpenMarketplaceDialog';
import DriverMap from './DriverMap';
import DriverList from './DriverList';
import type { DriverListEmptyState } from './DriverList';
import AssignmentStatusPanel from './AssignmentStatusPanel';
import { MAP_ID, DEFAULT_RADIUS_KM, REFRESH_INTERVAL_MS, LOCATION_WAIT_REFRESH_MS, EXPIRY_GRACE_MS } from './constants';
import { colors } from '../../../tokens';

const ASSIGN_ERROR_MESSAGES: Record<string, string> = {
  DRIVER_BUSY: 'Sürücü şu an başka bir işte ya da başka bir atamada',
  DRIVER_NOT_ELIGIBLE: 'Sürücünün belgeleri veya profili eksik',
  DRIVER_NOT_IN_POOL: 'Sürücü listenizde değil',
  INVALID_STATUS: 'Talep artık atanabilir durumda değil',
  NOT_DIRECT: 'Bu talep pazaryerinde',
  LOCATION_REQUIRED: 'Müşterinin konumu bekleniyor',
};

const cardSx = { borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}` };

// Atanabilir degilse (pazaryerinde, kapanmis ya da teklif gelmis) bu ekran yerine talep detayi gosterilir
const isAssignable = (request: InsuranceRequestDetail) =>
  request.dispatch_mode === 'agency_direct'
  && ASSIGNABLE_STATUSES.includes(request.status)
  && request.agency_assignment?.status !== 'offered';

export default function AssignDriverPage() {
  // Sayfa ve harita ayni APIProvider altinda: liste satirina tiklaninca harita useMap ile kaydirilir
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <AssignDriverView />
    </APIProvider>
  );
}

function AssignDriverView() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const invalidId = !Number.isInteger(requestId) || requestId <= 0;
  const navigate = useNavigate();
  const location = useLocation();
  const stateToken = (location.state as { trackingToken?: string } | null)?.trackingToken;
  const { enqueueSnackbar } = useSnackbar();
  const map = useMap(MAP_ID);

  const [request, setRequest] = useState<InsuranceRequestDetail | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [fatalError, setFatalError] = useState('');

  // list: sürücü seçimi, waiting: yanıt bekleniyor, result: red / süre doldu / iptal
  const [phase, setPhase] = useState<'list' | 'waiting' | 'result'>('list');
  const [assignment, setAssignment] = useState<AgencyAssignment | null>(null);
  const [resultMessage, setResultMessage] = useState('');

  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [driversData, setDriversData] = useState<AvailableDriversResponse | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [locationPending, setLocationPending] = useState(false);
  const [poolEmpty, setPoolEmpty] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const loadSeqRef = useRef(0);

  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const ready = !initializing && request !== null && !fatalError;

  const goToDetail = useCallback(() => {
    navigate(`/panel/requests/${requestId}`, { replace: true });
  }, [navigate, requestId]);

  // --- Ilk yukleme: talep + aktif atama (sayfa yenilenince bekleme durumu geri gelir) ---

  useEffect(() => {
    if (invalidId) return;
    const init = async () => {
      try {
        const [req, state] = await Promise.all([getInsuranceRequest(requestId), getAssignment(requestId)]);
        if (!isAssignable(req) || state.active?.status === 'offered') {
          goToDetail();
          return;
        }
        setRequest(req);
        if (state.active?.status === 'pending') {
          setAssignment(state.active);
          setPhase('waiting');
        }
      } catch (err) {
        setFatalError(getApiError(err).status === 404 ? 'Talep bulunamadı' : 'Talep bilgileri yüklenemedi');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [invalidId, requestId, goToDetail]);

  // --- Surucu listesi ---

  const loadDrivers = useCallback(async ({ fit = false, silent = false }: { fit?: boolean; silent?: boolean } = {}) => {
    // Filtre hizla degisirse eski yanit yenisini ezmesin
    const seq = ++loadSeqRef.current;
    setDriversLoading(true);
    try {
      const data = await getAvailableDrivers(requestId, { radius_km: radiusKm });
      if (seq !== loadSeqRef.current) return;
      setDriversData(data);
      setLoadedAt(Date.now());
      setLocationPending(false);
      setLoadFailed(false);
      if (fit) setFitKey((key) => key + 1);
      if (data.drivers.length === 0) {
        // Bos liste: havuz mu bos, yoksa sadece musait surucu mu yok?
        const pool = await listPoolDrivers().catch(() => null);
        setPoolEmpty(pool?.count === 0);
      }
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      const apiError = getApiError(err);
      if (apiError.code === 'LOCATION_REQUIRED') {
        setLocationPending(true);
      } else if (apiError.status === 404) {
        setFatalError('Talep bulunamadı');
      } else if (!silent) {
        setLoadFailed(true);
        enqueueSnackbar(apiError.message || 'Sürücüler yüklenemedi', { variant: 'error' });
      }
    } finally {
      if (seq === loadSeqRef.current) setDriversLoading(false);
    }
  }, [requestId, radiusKm, enqueueSnackbar]);

  // Ilk acilista ve filtre degisince yukle, haritayi sigdir
  useEffect(() => {
    if (!ready) return;
    loadDrivers({ fit: true });
  }, [ready, loadDrivers]);

  // Liste acikken periyodik sessiz yenileme; musteri konumu beklenirken daha sik
  useEffect(() => {
    if (!ready || phase !== 'list') return;
    const interval = setInterval(
      () => loadDrivers({ silent: true }),
      locationPending ? LOCATION_WAIT_REFRESH_MS : REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [ready, phase, locationPending, loadDrivers]);

  // --- Atama sonucu ---

  // Kapanan atamayi (WS olayi ya da sunucu durumu) ekrana yansit
  const applyOutcome = (closed: AgencyAssignment, reason: string | null) => {
    const why = reason || closed.cancel_reason;
    // Baska surucu secildi / acente iptal etti: panelin kendi islemi, eski atamanin olayi yeni beklemeyi bozmasin
    if (isOwnCancelReason(why)) return;

    const message = assignmentOutcomeMessage(closed.status, why);
    if (why === 'request_cancelled' || why === 'opened_to_marketplace') {
      enqueueSnackbar(message, { variant: 'warning' });
      goToDetail();
      return;
    }
    if (phase === 'waiting' && assignment?.id === closed.id) {
      setResultMessage(message);
      setPhase('result');
    } else {
      enqueueSnackbar(message, { variant: 'info' });
      if (phase === 'list') loadDrivers({ silent: true });
    }
  };

  // Olay kacmis olabilir (WS kopuk): takip edilen atamanin son durumunu sunucudan al
  const syncAssignment = async () => {
    if (phase !== 'waiting' || !assignment) return;
    try {
      const state = await getAssignment(requestId);
      const latest = [state.active, ...state.history].find((item) => item?.id === assignment.id);
      if (state.active?.status === 'offered' || latest?.status === 'offered') {
        goToDetail();
      } else if (latest && latest.status !== 'pending') {
        applyOutcome(latest, null);
      }
    } catch {
      // Bir sonraki olayda ya da yenilemede tekrar denenir
    }
  };

  // Talep baska yerden iptal edildiyse, pazaryerine acildiysa ya da teklif geldiyse bu ekran gecersiz
  const verifyRequest = async () => {
    try {
      const req = await getInsuranceRequest(requestId);
      if (!isAssignable(req)) goToDetail();
    } catch {
      // Yok say; bir sonraki olayda tekrar kontrol edilir
    }
  };

  const syncRef = useRef(syncAssignment);
  useEffect(() => {
    syncRef.current = syncAssignment;
  });

  // Geri sayim bitti ama olay gelmediyse kisa bir sure sonra durumu sunucudan tazele
  useEffect(() => {
    if (phase !== 'waiting' || !assignment) return;
    const delay = Math.max(new Date(assignment.expires_at).getTime() - Date.now(), 0) + EXPIRY_GRACE_MS;
    const timeout = setTimeout(() => syncRef.current(), delay);
    return () => clearTimeout(timeout);
  }, [phase, assignment]);

  const trackingToken = stateToken || (request?.tracking_url ? extractTrackingToken(request.tracking_url) : null);

  const { isConnected } = useRequestWebSocket({
    trackingToken,
    enabled: ready,
    // Teklif olaylari assignment_offered ile birlikte gelir; ayrica islenmez
    onNewOffer: () => {},
    onOfferWithdrawn: () => {},
    // Baglanti (yeniden) kuruldu ya da talep durumu degisti
    onStatusChange: () => {
      syncAssignment();
      verifyRequest();
    },
    onAgencyAssignment: (event) => {
      if (event.event === 'assignment_offered') {
        enqueueSnackbar(offeredMessage(event.estimated_price), { variant: 'success' });
        goToDetail();
        return;
      }
      applyOutcome(event.assignment, event.reason);
    },
  });

  // --- Islemler ---

  const backToList = () => {
    setPhase('list');
    setResultMessage('');
    setAssignment(null);
    loadDrivers();
  };

  const handleSelectDriver = (driver: AvailableDriver) => {
    setSelectedDriverId(driver.driver.id);
    if (driver.location) map?.panTo({ lat: driver.location.latitude, lng: driver.location.longitude });
  };

  const handleMarkerClick = (driverId: number) => {
    setSelectedDriverId(driverId);
    document.getElementById(`driver-row-${driverId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleAssign = async (driver: AvailableDriver) => {
    setAssigningId(driver.driver.id);
    setSelectedDriverId(driver.driver.id);
    try {
      const res = await assignDriver(requestId, driver.driver.id);
      setAssignment(res.assignment);
      setResultMessage('');
      setPhase('waiting');
    } catch (err) {
      const apiError = getApiError(err);
      enqueueSnackbar(ASSIGN_ERROR_MESSAGES[apiError.code ?? ''] || apiError.message || 'Atama yapılamadı', { variant: 'error' });
      if (apiError.code === 'INVALID_STATUS' || apiError.code === 'NOT_DIRECT') goToDetail();
      else if (apiError.code === 'LOCATION_REQUIRED') setLocationPending(true);
      else loadDrivers({ silent: true });
    } finally {
      setAssigningId(null);
    }
  };

  const handleCancelAssignment = async () => {
    setCancelling(true);
    try {
      await cancelAssignment(requestId);
      enqueueSnackbar('Atama iptal edildi', { variant: 'info' });
      backToList();
    } catch (err) {
      const apiError = getApiError(err);
      // NO_ACTIVE_ASSIGNMENT: atama zaten kapanmis, listeye donmek yeterli
      if (apiError.code === 'NO_ACTIVE_ASSIGNMENT') backToList();
      else enqueueSnackbar(apiError.message || 'Atama iptal edilemedi', { variant: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  // --- Gorunum ---

  if (invalidId || fatalError) {
    return (
      <Box>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{fatalError || 'Talep bulunamadı'}</Alert>
        <Button component={Link} to="/panel/requests" sx={{ mt: 2 }} startIcon={<ArrowBack />}>Taleplere Dön</Button>
      </Box>
    );
  }

  if (!ready || !request) {
    return <PageLoader />;
  }

  const drivers = driversData?.drivers ?? [];
  const customer = locationPending ? null : driversData?.customer_location ?? null;
  const emptyState: DriverListEmptyState = locationPending
    ? 'location_pending'
    : loadFailed && !driversData
      ? 'load_failed'
      : driversData && drivers.length === 0
        ? (poolEmpty ? 'pool_empty' : 'no_available')
        : null;
  const assignedVehicles = assignment
    ? drivers.find((item) => item.driver.id === assignment.driver.id)?.vehicles ?? []
    : [];

  return (
    <Box>
      <Button
        component={Link}
        to={`/panel/requests/${requestId}`}
        startIcon={<ArrowBack />}
        size="small"
        sx={{ color: colors.neutral[500], fontWeight: 500, mb: 1 }}
      >
        Talep detayı
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: colors.neutral[900] }}>Sürücü Ata</Typography>
        <Chip label={`Talep #${request.request_id}`} size="small" variant="outlined" sx={{ borderColor: colors.neutral[200], color: colors.neutral[500] }} />
        <Chip
          label={DriverServiceLabels[request.service_type] ?? request.service_type}
          size="small"
          variant="outlined"
          sx={{ borderColor: colors.neutral[200], color: colors.neutral[500] }}
        />
        <Chip
          label={isConnected ? 'Canlı' : 'Bağlanıyor...'}
          size="small"
          sx={{
            fontSize: 10, height: 20,
            bgcolor: isConnected ? colors.success[100] : colors.warning[100],
            color: isConnected ? colors.success[600] : colors.warning[600],
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          height: { md: 'calc(100vh - 274px)' },
          minHeight: { md: 520 },
        }}
      >
        <Card sx={{ ...cardSx, flex: { md: '0 0 60%' }, height: { xs: 340, md: 'auto' }, overflow: 'hidden' }}>
          <DriverMap
            customer={customer}
            drivers={drivers}
            selectedDriverId={phase === 'list' ? selectedDriverId : assignment?.driver.id ?? null}
            onSelectDriver={handleMarkerClick}
            fitKey={fitKey}
          />
        </Card>

        <Card sx={{ ...cardSx, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {phase !== 'list' && assignment ? (
            <AssignmentStatusPanel
              assignment={assignment}
              resultMessage={phase === 'result' ? resultMessage : ''}
              vehicles={assignedVehicles}
              cancelling={cancelling}
              onCancel={handleCancelAssignment}
              onChooseAnother={backToList}
              onOpenMarketplace={() => setMarketplaceOpen(true)}
            />
          ) : (
            <DriverList
              drivers={drivers}
              loadedAt={loadedAt}
              loading={driversLoading}
              emptyState={emptyState}
              radiusKm={radiusKm}
              selectedDriverId={selectedDriverId}
              assigningId={assigningId}
              onRadiusChange={setRadiusKm}
              onRefresh={() => loadDrivers()}
              onSelect={handleSelectDriver}
              onAssign={handleAssign}
              onOpenMarketplace={() => setMarketplaceOpen(true)}
            />
          )}
        </Card>
      </Box>

      <OpenMarketplaceDialog
        open={marketplaceOpen}
        requestId={requestId}
        onClose={() => setMarketplaceOpen(false)}
        onDone={goToDetail}
      />
    </Box>
  );
}
