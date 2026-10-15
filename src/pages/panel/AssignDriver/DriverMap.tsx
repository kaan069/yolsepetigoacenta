import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { LocalShipping, Person } from '@mui/icons-material';
import { Map, AdvancedMarker, AdvancedMarkerAnchorPoint, useMap } from '@vis.gl/react-google-maps';
import type { AvailableDriver } from '../../../types';
import { driverFullName } from '../../../utils/drivers';
import { MAP_ID } from './constants';
import { groupDrivers, fanOffsets } from './markerGroups';
import type { LocatedDriver, MarkerGroup } from './markerGroups';
import { colors, alpha } from '../../../tokens';

const TURKEY_CENTER = { lat: 39.0, lng: 35.0 };
const DEFAULT_ZOOM = 6;
const MAX_FIT_ZOOM = 15;
const BADGE_SIZE = 32;

const COLORS = {
  customer: colors.danger[500],
  live: colors.success[600],
  lastKnown: colors.secondary[500],
  business: colors.info[600],
  offline: colors.neutral[400],
};

type LatLng = { latitude: number; longitude: number };

// live: yesil, business: mavi + "İş adresi", last_known (ve tanimsiz degerler): turuncu + "Son konum".
// Cevrimdisi surucu gri; rank grup pininin rengini secmek icin (kucuk = daha iyi).
function markerStyle({ driver, location }: LocatedDriver) {
  const source =
    location.source === 'live' ? { color: COLORS.live, label: undefined, rank: 0 }
    : location.source === 'business' ? { color: COLORS.business, label: 'İş adresi', rank: 2 }
    : { color: COLORS.lastKnown, label: 'Son konum', rank: 1 };
  if (!driver.is_online) return { ...source, color: COLORS.offline, rank: 3, faded: true };
  return { ...source, faded: false };
}

const circleSx = (color: string, selected?: boolean) => ({
  width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: '50%', bgcolor: color, color: 'white',
  border: '2px solid white',
  boxShadow: selected
    ? `0 0 0 4px ${color}55, 0 2px 6px ${alpha(colors.neutral[900], 0.35)}`
    : `0 2px 6px ${alpha(colors.neutral[900], 0.35)}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const labelSx = (color: string) => ({
  bgcolor: 'white', color, fontSize: 10, fontWeight: 700, lineHeight: 1.4,
  px: 0.75, py: 0.25, borderRadius: 1, whiteSpace: 'nowrap',
  boxShadow: `0 1px 4px ${alpha(colors.neutral[900], 0.25)}`,
});

interface MarkerBadgeProps {
  color: string;
  icon: React.ReactNode;
  label?: string;
  selected?: boolean;
  faded?: boolean;
}

// <Pin> marker icerigini tamamen degistirdigi icin etiketli isaretciler HTML ile cizilir.
// Icerigin alt ortasi (ucgenin ucu) konuma denk gelir.
function MarkerBadge({ color, icon, label, selected, faded }: MarkerBadgeProps) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: faded ? 0.55 : 1,
        transform: selected ? 'scale(1.2)' : 'none',
        transformOrigin: 'bottom center',
        transition: 'transform 0.15s ease',
      }}
    >
      {label && <Box sx={{ ...labelSx(color), mb: 0.5 }}>{label}</Box>}
      <Box sx={circleSx(color, selected)}>{icon}</Box>
      <Box
        sx={{
          width: 0, height: 0, mt: '-2px',
          borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
          borderTop: `8px solid ${color}`,
        }}
      />
    </Box>
  );
}

// Acik gruptaki pin: daire merkeze gore kaydirilir (piksel; zoom'dan bagimsiz), cizgi gercek konumu gosterir.
// Etiket akis disinda (absolute) tutulur ki daire merkezi kaymasin.
function FanBadge({ color, label, selected, faded, offset }: {
  color: string;
  label?: string;
  selected: boolean;
  faded: boolean;
  offset: { x: number; y: number };
}) {
  return (
    <Box sx={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
      <Box
        sx={{
          position: 'relative', opacity: faded ? 0.75 : 1,
          transform: selected ? 'scale(1.2)' : 'none', transition: 'transform 0.15s ease',
        }}
      >
        {label && (
          <Box sx={{ ...labelSx(color), position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)' }}>
            {label}
          </Box>
        )}
        <Box sx={circleSx(color, selected)}>
          <LocalShipping sx={{ fontSize: 18 }} />
        </Box>
      </Box>
    </Box>
  );
}

function SpiderLines({ offsets }: { offsets: { x: number; y: number }[] }) {
  const extent = Math.max(...offsets.map((o) => Math.max(Math.abs(o.x), Math.abs(o.y)))) + 4;
  const size = extent * 2;
  return (
    <svg width={size} height={size} style={{ display: 'block', pointerEvents: 'none' }}>
      {offsets.map((o, i) => (
        <line key={i} x1={extent} y1={extent} x2={extent + o.x} y2={extent + o.y} stroke={colors.neutral[500]} strokeWidth={1.5} strokeOpacity={0.6} />
      ))}
      <circle cx={extent} cy={extent} r={5} fill={colors.neutral[700]} stroke="white" strokeWidth={2} />
    </svg>
  );
}

// fitKey degistiginde (ilk yukleme, filtre degisimi) tum pinleri sigdirir.
// Otomatik yenilemede fitKey ayni kaldigi icin acentenin kaydirdigi harita sifirlanmaz.
function FitBounds({ customer, drivers, fitKey }: { customer: LatLng | null; drivers: AvailableDriver[]; fitKey: number }) {
  const map = useMap();
  const fittedKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !customer || fittedKeyRef.current === fitKey) return;
    fittedKeyRef.current = fitKey;

    const center = { lat: customer.latitude, lng: customer.longitude };
    const points = drivers.flatMap(({ location }) => (location ? [{ lat: location.latitude, lng: location.longitude }] : []));
    if (points.length === 0) {
      map.setCenter(center);
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(center);
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 64);
    // Birbirine cok yakin pinlerde asiri yakinlasmayi engelle
    google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() ?? 0) > MAX_FIT_ZOOM) map.setZoom(MAX_FIT_ZOOM);
    });
  }, [map, customer, drivers, fitKey]);

  return null;
}

interface DriverMapProps {
  customer: LatLng | null;
  drivers: AvailableDriver[];
  selectedDriverId: number | null;
  onSelectDriver: (driverId: number) => void;
  fitKey: number;
}

export default function DriverMap({ customer, drivers, selectedDriverId, onSelectDriver, fitKey }: DriverMapProps) {
  // Ayni noktadaki (ayni is adresi / garaj) suruculer gruplanir; zoom degisince yeniden hesaplanir
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const groups = useMemo(() => groupDrivers(drivers, zoom), [drivers, zoom]);

  // Acik grup: secim degistiyse secilen surucunun grubu acilir, aksi halde kullanicinin son tercihi gecerli.
  // Zoom ile grubun anahtari degisirse eski anahtar hicbir grupla eslesmez ve grup kapali sayilir.
  const [manual, setManual] = useState<{ key: string | null; selectedId: number | null }>({ key: null, selectedId: null });
  const selectedGroupKey = groups.find(
    (g) => g.members.length > 1 && g.members.some((m) => m.driver.id === selectedDriverId),
  )?.key ?? null;
  const openKey = manual.selectedId === selectedDriverId ? manual.key : (selectedGroupKey ?? manual.key);

  const renderSingle = (item: LocatedDriver) => {
    const { driver, location } = item;
    const style = markerStyle(item);
    const selected = driver.id === selectedDriverId;
    return (
      <AdvancedMarker
        key={driver.id}
        position={{ lat: location.latitude, lng: location.longitude }}
        title={driverFullName(driver)}
        onClick={() => onSelectDriver(driver.id)}
        zIndex={selected ? 999 : undefined}
      >
        <MarkerBadge
          color={style.color}
          label={style.label}
          icon={<LocalShipping sx={{ fontSize: 18 }} />}
          selected={selected}
          faded={style.faded}
        />
      </AdvancedMarker>
    );
  };

  const renderClosedGroup = (group: MarkerGroup) => {
    const styles = group.members.map(markerStyle);
    const best = styles.reduce((a, b) => (b.rank < a.rank ? b : a));
    const containsSelected = group.members.some((m) => m.driver.id === selectedDriverId);
    const count = group.members.length;
    return (
      <AdvancedMarker
        key={group.key}
        position={group.center}
        title={group.members.map((m) => driverFullName(m.driver)).join(', ')}
        onClick={() => setManual({ key: group.key, selectedId: selectedDriverId })}
        zIndex={containsSelected ? 999 : undefined}
      >
        <MarkerBadge
          color={best.color}
          label={`${count} sürücü`}
          icon={<Box component="span" sx={{ fontSize: 14, fontWeight: 800 }}>{count}</Box>}
          selected={containsSelected}
          faded={styles.every((st) => st.faded)}
        />
      </AdvancedMarker>
    );
  };

  const renderOpenGroup = (group: MarkerGroup) => {
    const offsets = fanOffsets(group.members.length);
    return [
      <AdvancedMarker
        key={`${group.key}-lines`}
        position={group.center}
        anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
        zIndex={1050}
      >
        <SpiderLines offsets={offsets} />
      </AdvancedMarker>,
      ...group.members.map((item, i) => {
        const style = markerStyle(item);
        const selected = item.driver.id === selectedDriverId;
        return (
          <AdvancedMarker
            key={item.driver.id}
            position={group.center}
            anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
            title={driverFullName(item.driver)}
            onClick={() => onSelectDriver(item.driver.id)}
            zIndex={selected ? 1200 : 1100}
          >
            <FanBadge
              color={style.color}
              label={selected ? style.label : undefined}
              selected={selected}
              faded={style.faded}
              offset={offsets[i]}
            />
          </AdvancedMarker>
        );
      }),
    ];
  };

  return (
    <Map
      id={MAP_ID}
      mapId={MAP_ID}
      defaultCenter={TURKEY_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      clickableIcons={false}
      style={{ width: '100%', height: '100%' }}
      onZoomChanged={(e) => setZoom(Math.round(e.detail.zoom))}
      onClick={() => setManual({ key: null, selectedId: selectedDriverId })}
    >
      {customer && (
        <AdvancedMarker position={{ lat: customer.latitude, lng: customer.longitude }} title="Müşteri" zIndex={1000}>
          <MarkerBadge color={COLORS.customer} label="Müşteri" icon={<Person sx={{ fontSize: 18 }} />} />
        </AdvancedMarker>
      )}

      {groups.map((group) => {
        if (group.members.length === 1) return renderSingle(group.members[0]);
        return group.key === openKey ? renderOpenGroup(group) : renderClosedGroup(group);
      })}

      <FitBounds customer={customer} drivers={drivers} fitKey={fitKey} />
    </Map>
  );
}
