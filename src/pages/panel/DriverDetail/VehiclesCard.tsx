import { useState } from 'react';
import { Box, Typography, Button, Chip, Tooltip } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { DriverVehicleTypeLabels } from '../../../types';
import type { DriverServiceType, DriverVehicleEntry, MissingStep } from '../../../types';
import { allowedVehicleTypes } from './vehicleConfig';
import { SectionCard, VerificationChip } from './parts';
import { CARD_IDS } from './constants';
import VehicleFormDialog from './VehicleFormDialog';
import VehicleDocumentsDialog from './VehicleDocumentsDialog';

interface VehiclesCardProps {
  driverId: number;
  services: DriverServiceType[];
  vehicles: DriverVehicleEntry[];
  onSaved: (entry: DriverVehicleEntry, steps: MissingStep[]) => void;
}

export default function VehiclesCard({ driverId, services, vehicles, onSaved }: VehiclesCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  // create: yeni arac formu, edit: secili aracin formu
  const [formTarget, setFormTarget] = useState<{ entry?: DriverVehicleEntry } | null>(null);
  const [documentsEntry, setDocumentsEntry] = useState<DriverVehicleEntry | null>(null);
  const allowedTypes = allowedVehicleTypes(services);

  const handleVehicleSaved = (entry: DriverVehicleEntry, steps: MissingStep[], created: boolean) => {
    onSaved(entry, steps);
    setFormTarget(null);
    if (created) {
      // Yeni aracin belgeleri olmadan surucu is alamaz; belge yuklemeye gecilir
      enqueueSnackbar('Araç eklendi. Şimdi belgelerini yükleyin.', { variant: 'success' });
      setDocumentsEntry(entry);
    } else {
      enqueueSnackbar('Araç bilgileri kaydedildi', { variant: 'success' });
    }
  };

  const addButton = (
    <Button
      size="small"
      variant="outlined"
      startIcon={<Add />}
      onClick={() => setFormTarget({})}
      disabled={allowedTypes.length === 0}
      sx={{ borderRadius: 2, fontWeight: 600 }}
    >
      Araç ekle
    </Button>
  );

  return (
    <SectionCard
      id={CARD_IDS.vehicles}
      title="Araçlar"
      action={allowedTypes.length === 0 ? (
        <Tooltip title="Önce temel bilgilerden hizmet tipi ekleyin">
          <span>{addButton}</span>
        </Tooltip>
      ) : addButton}
    >
      {vehicles.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: '#94a3b8', py: 1 }}>
          Henüz araç yok. Sürücünün iş alabilmesi için hizmet verdiği tipte, belgeleri onaylı bir aracı olmalı.
        </Typography>
      ) : (
        vehicles.map((item) => {
          const { vehicle } = item;
          return (
            <Box
              key={`${item.vehicle_type}-${vehicle.id}`}
              sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9', '&:last-of-type': { borderBottom: 'none' } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={DriverVehicleTypeLabels[item.vehicle_type] ?? item.vehicle_type}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: 11, borderColor: '#e2e8f0', color: '#64748b' }}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#334155', fontFamily: 'monospace' }}>{vehicle.plate_number}</Typography>
                <Box sx={{ flex: 1 }} />
                <VerificationChip status={vehicle.verification_status} />
              </Box>
              {vehicle.verification_status === 'rejected' && vehicle.verification_rejection_reason && (
                <Typography sx={{ fontSize: 12, color: '#dc2626', mt: 0.5 }}>
                  Red sebebi: {vehicle.verification_rejection_reason}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => setFormTarget({ entry: item })} sx={{ fontWeight: 600 }}>Düzenle</Button>
                <Button size="small" onClick={() => setDocumentsEntry(item)} sx={{ fontWeight: 600 }}>Belgeler</Button>
              </Box>
            </Box>
          );
        })
      )}

      <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 1.5 }}>
        Yüklenen ya da değiştirilen her belge admin onayına düşer. Onaylı bir aracın plakası değiştirilirse
        belgeleri de yeniden onaya düşer; marka, model gibi diğer alanlar onayı bozmaz.
      </Typography>

      {formTarget && (
        <VehicleFormDialog
          driverId={driverId}
          allowedTypes={allowedTypes}
          entry={formTarget.entry}
          onClose={() => setFormTarget(null)}
          onSaved={handleVehicleSaved}
        />
      )}
      {documentsEntry && (
        <VehicleDocumentsDialog
          driverId={driverId}
          entry={documentsEntry}
          onClose={() => setDocumentsEntry(null)}
          onSaved={onSaved}
        />
      )}
    </SectionCard>
  );
}
