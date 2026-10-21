import { Box, Typography, Button, Chip, Tooltip } from '@mui/material';
import { AddTask, Phone } from '@mui/icons-material';
import type { PoolDriver } from '../../../types';
import { DriverServiceLabels } from '../../../types';
import {
  driverFullName, describeLocation, describeLastSeen, getPoolDriverStatus, openJobBlockReason, POOL_STATUS_CHIPS,
} from '../../../utils/drivers';
import { colors } from '../../../tokens';

interface FleetDriverListProps {
  drivers: PoolDriver[];
  loadedAt: number;
  selectedDriverId: number | null;
  onSelect: (driver: PoolDriver) => void;
  onOpenJob: (driver: PoolDriver) => void;
}

export default function FleetDriverList({ drivers, loadedAt, selectedDriverId, onSelect, onOpenJob }: FleetDriverListProps) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {drivers.map((item) => {
        const { driver, location } = item;
        const selected = driver.id === selectedDriverId;
        const status = POOL_STATUS_CHIPS[getPoolDriverStatus(item)];
        const lastSeen = describeLastSeen(location, item.app_location ?? null, loadedAt);
        const blocked = openJobBlockReason(item);
        return (
          <Box
            key={driver.id}
            id={`fleet-row-${driver.id}`}
            onClick={() => onSelect(item)}
            sx={{
              px: 2, py: 1.5, cursor: 'pointer',
              borderBottom: `1px solid ${colors.neutral[100]}`,
              borderLeft: selected ? `3px solid ${colors.primary[500]}` : '3px solid transparent',
              bgcolor: selected ? colors.primary[50] : 'transparent',
              '&:hover': { bgcolor: selected ? colors.primary[50] : colors.neutral[50] },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: colors.neutral[900] }}>
                    {driverFullName(driver)}
                  </Typography>
                  <Chip label={status.label} size="small" sx={{ height: 20, fontSize: 10, bgcolor: status.bg, color: status.color }} />
                </Box>
                <Typography sx={{ fontSize: 12, color: location ? colors.neutral[500] : colors.secondary[500], mt: 0.25 }}>
                  {describeLocation(location, loadedAt)}
                </Typography>
                {lastSeen && <Typography sx={{ fontSize: 11, color: colors.neutral[400] }}>{lastSeen}</Typography>}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 12, color: colors.neutral[400] }}>
                    {driver.user_type.map((type) => DriverServiceLabels[type] ?? type).join(', ')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.neutral[400] }}>
                    <Phone sx={{ fontSize: 12 }} />
                    <Typography sx={{ fontSize: 12 }}>{driver.phone_number}</Typography>
                  </Box>
                </Box>
              </Box>
              <Tooltip title={blocked ?? 'Bu sürücüye yeni iş aç'}>
                <span>
                  <Button
                    size="small"
                    variant={selected ? 'contained' : 'outlined'}
                    startIcon={<AddTask sx={{ fontSize: 16 }} />}
                    disabled={blocked !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenJob(item);
                    }}
                    sx={{ whiteSpace: 'nowrap', bgcolor: selected ? undefined : colors.white }}
                  >
                    İş aç
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
