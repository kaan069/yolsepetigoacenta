import {
  Box, Typography, Button, Chip, IconButton, ToggleButton, ToggleButtonGroup,
  CircularProgress, Tooltip,
} from '@mui/material';
import { Refresh, MyLocation, Groups, PersonOff } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { AvailableDriver } from '../../../types';
import { driverFullName, formatDistance, describeLocation, describeLastSeen } from '../../../utils/drivers';
import { RADIUS_OPTIONS } from './constants';

export type DriverListEmptyState = 'location_pending' | 'pool_empty' | 'no_available' | 'load_failed' | null;

interface DriverListProps {
  drivers: AvailableDriver[];
  // Verinin yuklendigi an; "5 dk önce" gibi gorece sureler buna gore hesaplanir
  loadedAt: number;
  loading: boolean;
  emptyState: DriverListEmptyState;
  radiusKm: number;
  selectedDriverId: number | null;
  assigningId: number | null;
  onRadiusChange: (radiusKm: number) => void;
  onRefresh: () => void;
  onSelect: (driver: AvailableDriver) => void;
  onAssign: (driver: AvailableDriver) => void;
  onOpenMarketplace: () => void;
}

function EmptyMessage({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
      <Box sx={{ color: '#cbd5e1', mb: 1.5, '& svg': { fontSize: 48 } }}>{icon}</Box>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#334155', mb: 0.5 }}>{title}</Typography>
      {description && <Typography sx={{ fontSize: 13, color: '#94a3b8', mb: 2 }}>{description}</Typography>}
      {children && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>{children}</Box>}
    </Box>
  );
}

export default function DriverList({
  drivers, loadedAt, loading, emptyState, radiusKm, selectedDriverId, assigningId,
  onRadiusChange, onRefresh, onSelect, onAssign, onOpenMarketplace,
}: DriverListProps) {
  const renderBody = () => {
    if (emptyState === 'location_pending') {
      return (
        <EmptyMessage
          icon={<MyLocation />}
          title="Müşterinin konumu bekleniyor"
          description="Konum gelince sürücüler burada otomatik listelenir."
        />
      );
    }
    if (emptyState === 'pool_empty') {
      return (
        <EmptyMessage icon={<Groups />} title="Henüz sürücünüz yok" description="Atama yapabilmek için önce sürücü ekleyin.">
          <Button component={Link} to="/panel/drivers" variant="contained" size="small">Sürücülerim</Button>
        </EmptyMessage>
      );
    }
    if (emptyState === 'load_failed') {
      return (
        <EmptyMessage icon={<Refresh />} title="Sürücüler yüklenemedi">
          <Button size="small" variant="outlined" onClick={onRefresh}>Tekrar dene</Button>
        </EmptyMessage>
      );
    }
    if (emptyState === 'no_available') {
      return (
        <EmptyMessage icon={<PersonOff />} title="Bu talep için müsait sürücü yok">
          {radiusKm !== 0 && (
            <Button size="small" variant="outlined" onClick={() => onRadiusChange(0)}>Yarıçapı kaldır</Button>
          )}
          <Button size="small" variant="contained" onClick={onOpenMarketplace}>Pazaryerine aç</Button>
        </EmptyMessage>
      );
    }
    if (drivers.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      );
    }

    // Backend mesafeye gore sirali gonderir; yeniden siralanmaz
    return drivers.map((item) => {
      const { driver, location, distance_km, vehicles } = item;
      const selected = driver.id === selectedDriverId;
      const lastSeen = describeLastSeen(location, item.app_location, loadedAt);
      return (
        <Box
          key={driver.id}
          id={`driver-row-${driver.id}`}
          onClick={() => onSelect(item)}
          sx={{
            px: 2, py: 1.5, cursor: 'pointer',
            borderBottom: '1px solid #f1f5f9',
            borderLeft: selected ? '3px solid #0ea5e9' : '3px solid transparent',
            bgcolor: selected ? '#f0f9ff' : 'transparent',
            '&:hover': { bgcolor: selected ? '#f0f9ff' : '#f8fafc' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {driverFullName(driver)}
                </Typography>
                {!driver.is_online && (
                  <Chip label="Çevrimdışı" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f1f5f9', color: '#64748b' }} />
                )}
              </Box>
              <Typography sx={{ fontSize: 12, color: location ? '#64748b' : '#f97316', mt: 0.25 }}>
                {distance_km != null && `${formatDistance(distance_km)} · `}
                {describeLocation(location, loadedAt)}
              </Typography>
              {lastSeen && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{lastSeen}</Typography>}
              {vehicles.map((vehicle) => (
                <Typography key={vehicle.id} sx={{ fontSize: 12, color: '#94a3b8' }}>
                  {vehicle.plate_number} · {vehicle.brand} {vehicle.model}
                </Typography>
              ))}
            </Box>
            <Button
              size="small"
              variant="contained"
              disabled={assigningId !== null}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(item);
              }}
              sx={{ minWidth: 56, borderRadius: 2, fontWeight: 600 }}
            >
              {assigningId === driver.id ? <CircularProgress size={16} color="inherit" /> : 'Ata'}
            </Button>
          </Box>
        </Box>
      );
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Filtreler */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
            Müsait sürücüler{drivers.length > 0 && !emptyState ? ` (${drivers.length})` : ''}
          </Typography>
          <Tooltip title="Yenile">
            <span>
              <IconButton size="small" onClick={onRefresh} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <Refresh fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={radiusKm}
          onChange={(_, value: number | null) => value !== null && onRadiusChange(value)}
        >
          {RADIUS_OPTIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value} sx={{ textTransform: 'none', fontSize: 12 }}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
          Çevrimdışı sürücüler iş adreslerinde, gri olarak gösterilir.
        </Typography>
      </Box>

      {/* Liste */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{renderBody()}</Box>
    </Box>
  );
}
