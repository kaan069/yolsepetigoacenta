import { Box, Radio, RadioGroup, FormControlLabel, Typography } from '@mui/material';
import type { DispatchMode } from '../../../types';
import { colors } from '../../../tokens';

interface DispatchModeSectionProps {
  value: DispatchMode;
  onChange: (mode: DispatchMode) => void;
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
    description: 'Talep yayınlanmaz. Talebi oluşturunca haritadan kendi sürücünüzü seçersiniz.',
  },
];

export default function DispatchModeSection({ value, onChange }: DispatchModeSectionProps) {
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
              control={<Radio size="small" />}
              label={(
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.neutral[900] }}>{option.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: colors.neutral[500], lineHeight: 1.5 }}>{option.description}</Typography>
                </Box>
              )}
              sx={{
                m: 0,
                p: 1.5,
                alignItems: 'flex-start',
                borderRadius: 2,
                border: selected ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[200]}`,
                bgcolor: selected ? colors.primary[50] : 'white',
                '& .MuiRadio-root': { p: 0.25, mr: 1 },
              }}
            />
          );
        })}
      </RadioGroup>
    </Box>
  );
}
