import { Box, Radio, RadioGroup, FormControlLabel, Typography } from '@mui/material';
import type { DispatchMode } from '../../../types';

interface DispatchModeSectionProps {
  value: DispatchMode;
  onChange: (mode: DispatchMode) => void;
  // Talep olusturulduktan sonra (SMS akisi talebi erken olusturur) secim degistirilemez
  locked: boolean;
}

const options: { value: DispatchMode; title: string; description: string }[] = [
  {
    value: 'marketplace',
    title: 'Uygun sürücülere yayınla',
    description: 'Talep bölgedeki uygun sürücülere gider, gelen teklifler talep sayfasında listelenir.',
  },
  {
    value: 'agency_direct',
    title: 'Kendi sürücümü ata',
    description: 'Talep yayınlanmaz. Müşteri konumu alınınca haritadan kendi sürücünüzü seçersiniz.',
  },
];

export default function DispatchModeSection({ value, onChange, locked }: DispatchModeSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <RadioGroup
        value={value}
        onChange={(e) => onChange(e.target.value as DispatchMode)}
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <FormControlLabel
              key={option.value}
              value={option.value}
              disabled={locked}
              control={<Radio size="small" />}
              label={(
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{option.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{option.description}</Typography>
                </Box>
              )}
              sx={{
                m: 0,
                p: 1.5,
                alignItems: 'flex-start',
                borderRadius: 2,
                border: selected ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                bgcolor: selected ? '#f0f9ff' : 'white',
                opacity: locked && !selected ? 0.5 : 1,
                '& .MuiRadio-root': { p: 0.25, mr: 1 },
              }}
            />
          );
        })}
      </RadioGroup>
      {locked && (
        <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 1 }}>
          Talep oluşturulduğu için dağıtım yöntemi değiştirilemez.
        </Typography>
      )}
    </Box>
  );
}
