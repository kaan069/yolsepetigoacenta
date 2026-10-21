import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Card, Chip, Alert, IconButton, Tooltip, ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material';
import { Refresh, Groups } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { APIProvider, useMap } from '@vis.gl/react-google-maps';
import { listPoolDrivers, getApiError } from '../../../api';
import { DriverServiceLabels } from '../../../types';
import type { AgencyDriverLocationEvent, DriverServiceType, NewRequestPresetDriver, PoolDriver } from '../../../types';
import { GOOGLE_MAPS_API_KEY } from '../../../config';
import { useAgencyDriversWebSocket } from '../../../hooks/useAgencyDriversWebSocket';
import { driverFullName, getPoolDriverStatus } from '../../../utils/drivers';
import type { PoolDriverStatus } from '../../../utils/drivers';
import PageLoader from '../../../components/PageLoader';
import DriverMap from '../AssignDriver/DriverMap';
import { MAP_ID, REFRESH_INTERVAL_MS } from '../AssignDriver/constants';
import FleetDriverList from './FleetDriverList';
import { colors } from '../../../tokens';

const cardSx = { borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}` };

// Liste sirasi: atanabilenler once
const STATUS_ORDER: Record<PoolDriverStatus, number> = { available: 0, offline: 1, busy: 2, pending_approval: 3 };

export default function DriversMapPage() {
  // Harita ve liste ayni APIProvider altinda: satira tiklaninca harita useMap ile kaydirilir
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <DriversMapView />
    </APIProvider>
  );
}

function DriversMapView() {
  const navigate = useNavigate();
  const map = useMap(MAP_ID);

  const [drivers, setDrivers] = useState<PoolDriver[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState(0);
  const [fitKey, setFitKey] = useState(0);
  const [service, setService] = useState<DriverServiceType | 'all'>('all');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const load = useCallback(async ({ fit = false, silent = false }: { fit?: boolean; silent?: boolean } = {}) => {
    setLoading(true);
    try {
      const data = await listPoolDrivers();
      setDrivers(data.results);
      setLoadedAt(Date.now());
      setError('');
      if (fit) setFitKey((key) => key + 1);
    } catch (err) {
      if (!silent) setError(getApiError(err).message || 'Sürücüler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ fit: true });
  }, [load]);

  // Mesgul durumu ve belge onaylari degisebilir; konumlar ayrica WebSocket ile anlik gelir
  useEffect(() => {
    const interval = setInterval(() => load({ silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleDriverLocation = (event: AgencyDriverLocationEvent) => {
    setDrivers((prev) => prev?.map((item) => (
      item.driver.id === event.driver.id
        ? { ...item, driver: { ...item.driver, ...event.driver }, location: event.location, app_location: event.app_location }
        : item
    )) ?? prev);
    setLoadedAt(Date.now());
  };

  const { isConnected: liveLocations } = useAgencyDriversWebSocket({
    enabled: drivers !== null,
    onDriverLocation: handleDriverLocation,
    onReconnected: () => load({ silent: true }),
  });

  const all = useMemo(() => drivers ?? [], [drivers]);
  const services = useMemo(
    () => [...new Set(all.flatMap((item) => item.driver.user_type))],
    [all],
  );
  const visible = useMemo(
    () => all
      .filter((item) => service === 'all' || item.driver.user_type.includes(service))
      .sort((a, b) => STATUS_ORDER[getPoolDriverStatus(a)] - STATUS_ORDER[getPoolDriverStatus(b)]
        || driverFullName(a.driver).localeCompare(driverFullName(b.driver), 'tr')),
    [all, service],
  );
  const mapDrivers = useMemo(
    () => visible.map((item) => ({ driver: item.driver, location: item.location, busy: item.is_busy })),
    [visible],
  );

  const counts = visible.reduce<Record<PoolDriverStatus, number>>(
    (acc, item) => ({ ...acc, [getPoolDriverStatus(item)]: acc[getPoolDriverStatus(item)] + 1 }),
    { available: 0, offline: 0, busy: 0, pending_approval: 0 },
  );
  const withoutLocation = visible.filter((item) => !item.location).length;

  const handleServiceChange = (value: DriverServiceType | 'all' | null) => {
    if (!value) return;
    setService(value);
    setFitKey((key) => key + 1);
  };

  const handleSelect = (item: PoolDriver) => {
    setSelectedDriverId(item.driver.id);
    if (item.location) map?.panTo({ lat: item.location.latitude, lng: item.location.longitude });
  };

  const handleMarkerClick = (driverId: number) => {
    setSelectedDriverId(driverId);
    document.getElementById(`fleet-row-${driverId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleOpenJob = (item: PoolDriver) => {
    const presetDriver: NewRequestPresetDriver = {
      id: item.driver.id,
      name: driverFullName(item.driver),
      services: item.eligible_services,
    };
    navigate('/panel/requests/new', { state: { presetDriver } });
  };

  if (drivers === null && !error) return <PageLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: colors.neutral[900] }}>Sürücü Haritası</Typography>
          <Typography sx={{ fontSize: 14, color: colors.neutral[500] }}>
            Sürücülerinizin konumunu görün, birini seçip doğrudan iş açın.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {liveLocations && (
            <Chip
              label="Konumlar anlık"
              size="small"
              sx={{ fontSize: 11, height: 22, bgcolor: colors.success[100], color: colors.success[700] }}
            />
          )}
          <Tooltip title="Yenile">
            <span>
              <IconButton onClick={() => load()} disabled={loading} sx={{ bgcolor: colors.white, border: `1px solid ${colors.neutral[200]}` }}>
                {loading ? <CircularProgress size={18} /> : <Refresh fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {drivers !== null && drivers.length === 0 ? (
        <Card sx={{ ...cardSx, py: 8, px: 3, textAlign: 'center' }}>
          <Groups sx={{ fontSize: 48, color: colors.neutral[300], mb: 1.5 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[700], mb: 0.5 }}>Henüz sürücünüz yok</Typography>
          <Typography sx={{ fontSize: 13, color: colors.neutral[400], mb: 2 }}>Haritada görmek için önce sürücü ekleyin.</Typography>
          <Button component={Link} to="/panel/drivers" variant="contained" size="small">Sürücülerim</Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            height: { md: 'calc(100vh - 250px)' },
            minHeight: { md: 520 },
          }}
        >
          <Card sx={{ ...cardSx, flex: { md: '0 0 60%' }, height: { xs: 360, md: 'auto' }, overflow: 'hidden' }}>
            <DriverMap
              customer={null}
              drivers={mapDrivers}
              selectedDriverId={selectedDriverId}
              onSelectDriver={handleMarkerClick}
              fitKey={fitKey}
            />
          </Card>

          <Card sx={{ ...cardSx, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[200]}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900] }}>
                {visible.length} sürücü
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 400, color: colors.neutral[500], ml: 1 }}>
                  {counts.available} müsait · {counts.busy} meşgul · {counts.offline} çevrimdışı
                  {counts.pending_approval > 0 && ` · ${counts.pending_approval} onay bekliyor`}
                </Typography>
              </Typography>
              {services.length > 1 && (
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={service}
                  onChange={(_, value: DriverServiceType | 'all' | null) => handleServiceChange(value)}
                  sx={{ flexWrap: 'wrap' }}
                >
                  <ToggleButton value="all" sx={{ fontSize: 12 }}>Tümü</ToggleButton>
                  {services.map((type) => (
                    <ToggleButton key={type} value={type} sx={{ fontSize: 12 }}>
                      {DriverServiceLabels[type] ?? type}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
              {withoutLocation > 0 && (
                <Typography sx={{ fontSize: 12, color: colors.neutral[400] }}>
                  {withoutLocation} sürücünün konumu bilinmiyor; listede var, haritada yok.
                </Typography>
              )}
            </Box>
            <FleetDriverList
              drivers={visible}
              loadedAt={loadedAt}
              selectedDriverId={selectedDriverId}
              onSelect={handleSelect}
              onOpenJob={handleOpenJob}
            />
          </Card>
        </Box>
      )}
    </Box>
  );
}
