import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { LocalShipping, Person } from '@mui/icons-material';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import type { AvailableDriver } from '../../../types';
import { driverFullName } from '../../../utils/drivers';
import { MAP_ID } from './constants';
import { colors, alpha } from '../../../tokens';

const TURKEY_CENTER = { lat: 39.0, lng: 35.0 };
const MAX_FIT_ZOOM = 15;

const COLORS = {
  customer: colors.danger[500],
  live: colors.success[600],
  lastKnown: colors.secondary[500],
  business: colors.info[600],
  offline: colors.neutral[400],
};

type LatLng = { latitude: number; longitude: number };

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
      {label && (
        <Box
          sx={{
            bgcolor: 'white', color, fontSize: 10, fontWeight: 700, lineHeight: 1.4,
            px: 0.75, py: 0.25, mb: 0.5, borderRadius: 1, whiteSpace: 'nowrap',
            boxShadow: `0 1px 4px ${alpha(colors.neutral[900], 0.25)}`,
          }}
        >
          {label}
        </Box>
      )}
      <Box
        sx={{
          width: 32, height: 32, borderRadius: '50%', bgcolor: color, color: 'white',
          border: '2px solid white',
          boxShadow: selected
            ? `0 0 0 4px ${color}55, 0 2px 6px ${alpha(colors.neutral[900], 0.35)}`
            : `0 2px 6px ${alpha(colors.neutral[900], 0.35)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
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
  return (
    <Map
      id={MAP_ID}
      mapId={MAP_ID}
      defaultCenter={TURKEY_CENTER}
      defaultZoom={6}
      gestureHandling="greedy"
      clickableIcons={false}
      style={{ width: '100%', height: '100%' }}
    >
      {customer && (
        <AdvancedMarker position={{ lat: customer.latitude, lng: customer.longitude }} title="Müşteri" zIndex={1000}>
          <MarkerBadge color={COLORS.customer} label="Müşteri" icon={<Person sx={{ fontSize: 18 }} />} />
        </AdvancedMarker>
      )}

      {drivers.map(({ driver, location }) => {
        if (!location) return null;
        const offline = !driver.is_online;
        const selected = driver.id === selectedDriverId;
        // live: yesil, business: mavi + "İş adresi", last_known (ve tanimsiz degerler): turuncu + "Son konum"
        const { color: sourceColor, label } =
          location.source === 'live' ? { color: COLORS.live, label: undefined }
          : location.source === 'business' ? { color: COLORS.business, label: 'İş adresi' }
          : { color: COLORS.lastKnown, label: 'Son konum' };
        const color = offline ? COLORS.offline : sourceColor;
        return (
          <AdvancedMarker
            key={driver.id}
            position={{ lat: location.latitude, lng: location.longitude }}
            title={driverFullName(driver)}
            onClick={() => onSelectDriver(driver.id)}
            zIndex={selected ? 999 : undefined}
          >
            <MarkerBadge
              color={color}
              label={label}
              icon={<LocalShipping sx={{ fontSize: 18 }} />}
              selected={selected}
              faded={offline}
            />
          </AdvancedMarker>
        );
      })}

      <FitBounds customer={customer} drivers={drivers} fitKey={fitKey} />
    </Map>
  );
}
