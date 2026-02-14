import {
  Box, TextField, MenuItem, Checkbox, FormControlLabel, Chip, Typography,
} from '@mui/material';
import { ServiceType } from '../../../types';
import type { RequestFormState } from './types';
import { towTruckVehicleTypes, craneDurationOptions, problemTypeOptions, timeSlotOptions } from './constants';
import SectionLabel from './SectionLabel';

interface ServiceFieldsProps {
  form: RequestFormState;
  onChange: (field: keyof RequestFormState) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (field: keyof RequestFormState) => (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  onToggleProblemType: (type: string) => void;
}

function TowTruckFields({ form, onChange }: Pick<ServiceFieldsProps, 'form' | 'onChange'>) {
  return (
    <>
      <SectionLabel>Arac Bilgileri</SectionLabel>
      <TextField
        select fullWidth label="Arac Tipi *" value={form.tw_vehicle_type}
        onChange={onChange('tw_vehicle_type')} sx={{ mb: 2 }}
      >
        {towTruckVehicleTypes.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
    </>
  );
}

function CraneFields({ form, onChange, onCheckboxChange }: Pick<ServiceFieldsProps, 'form' | 'onChange' | 'onCheckboxChange'>) {
  return (
    <>
      <SectionLabel>Vinc Detaylari</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField fullWidth label="Yuk Tipi" value={form.cr_load_type} onChange={onChange('cr_load_type')} placeholder="Orn: Klima dis unitesi" />
        <TextField fullWidth label="Yuk Agirligi (kg)" value={form.cr_load_weight} onChange={onChange('cr_load_weight')} type="number" />
        <TextField fullWidth label="Kaldirma Yuksekligi (m)" value={form.cr_lift_height} onChange={onChange('cr_lift_height')} type="number" />
        <TextField fullWidth label="Kat" value={form.cr_floor} onChange={onChange('cr_floor')} type="number" />
      </Box>
      <TextField
        select fullWidth label="Islem Suresi" value={form.cr_duration}
        onChange={onChange('cr_duration')} sx={{ mb: 2 }}
      >
        <MenuItem value="">Seciniz</MenuItem>
        {craneDurationOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <FormControlLabel
        control={<Checkbox checked={form.cr_has_obstacles} onChange={onCheckboxChange('cr_has_obstacles')} />}
        label="Cevrede engel var"
        sx={{ mb: 1, '& .MuiTypography-root': { fontSize: 14 } }}
      />
      {form.cr_has_obstacles && (
        <TextField
          fullWidth label="Engel Aciklamasi" value={form.cr_obstacle_note}
          onChange={onChange('cr_obstacle_note')} sx={{ mb: 2 }}
          placeholder="Orn: Dar sokak, agac dallari"
        />
      )}
    </>
  );
}

function RoadAssistanceFields({ form, onChange, onToggleProblemType }: Pick<ServiceFieldsProps, 'form' | 'onChange' | 'onToggleProblemType'>) {
  return (
    <>
      <SectionLabel>Yol Yardimi Detaylari</SectionLabel>
      <TextField
        select fullWidth label="Arac Tipi" value={form.ra_vehicle_type}
        onChange={onChange('ra_vehicle_type')} sx={{ mb: 2 }}
      >
        {towTruckVehicleTypes.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>Sorun Tipi (birden fazla secilebilir)</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {problemTypeOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            onClick={() => onToggleProblemType(opt.value)}
            color={form.ra_problem_types.includes(opt.value) ? 'primary' : 'default'}
            variant={form.ra_problem_types.includes(opt.value) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      <TextField
        fullWidth label="Sorun Aciklamasi" value={form.ra_problem_description}
        onChange={onChange('ra_problem_description')} multiline rows={2} sx={{ mb: 2 }}
        placeholder="Sorunu detayli aciklayiniz"
      />
    </>
  );
}

function HomeToHomeMovingFields({ form, onChange, onCheckboxChange }: Pick<ServiceFieldsProps, 'form' | 'onChange' | 'onCheckboxChange'>) {
  return (
    <>
      <SectionLabel>Nakliyat Detaylari</SectionLabel>
      <TextField
        fullWidth label="Ev Tipi" value={form.hm_home_type}
        onChange={onChange('hm_home_type')} sx={{ mb: 2 }}
        placeholder="Orn: 3+1 daire, villa"
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 1 }}>
        <TextField fullWidth label="Cikis Kati" value={form.hm_floor_from} onChange={onChange('hm_floor_from')} type="number" />
        <TextField fullWidth label="Varis Kati" value={form.hm_floor_to} onChange={onChange('hm_floor_to')} type="number" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_elevator_from} onChange={onCheckboxChange('hm_has_elevator_from')} />}
          label="Cikis asansoru var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_elevator_to} onChange={onCheckboxChange('hm_has_elevator_to')} />}
          label="Varis asansoru var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_large_items} onChange={onCheckboxChange('hm_has_large_items')} />}
          label="Buyuk esya var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_fragile_items} onChange={onCheckboxChange('hm_has_fragile_items')} />}
          label="Kirilacak esya var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_needs_packing} onChange={onCheckboxChange('hm_needs_packing')} />}
          label="Paketleme gerekli"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_needs_disassembly} onChange={onCheckboxChange('hm_needs_disassembly')} />}
          label="Sokum/montaj gerekli"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          fullWidth label="Tercih Edilen Tarih" value={form.hm_preferred_date}
          onChange={onChange('hm_preferred_date')} type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select fullWidth label="Tercih Edilen Zaman" value={form.hm_preferred_time_slot}
          onChange={onChange('hm_preferred_time_slot')}
        >
          <MenuItem value="">Secilmedi</MenuItem>
          {timeSlotOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}

function CityToCityFields({ form, onChange }: Pick<ServiceFieldsProps, 'form' | 'onChange'>) {
  return (
    <>
      <SectionLabel>Sehirler Arasi Tasima Detaylari</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField fullWidth label="Yuk Tipi" value={form.cc_load_type} onChange={onChange('cc_load_type')} placeholder="Orn: Mobilya, palet" />
        <TextField fullWidth label="Yuk Agirligi (kg)" value={form.cc_load_weight} onChange={onChange('cc_load_weight')} type="number" />
      </Box>
      <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>Yuk Boyutlari (cm)</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
        <TextField fullWidth label="En" value={form.cc_width} onChange={onChange('cc_width')} type="number" />
        <TextField fullWidth label="Boy" value={form.cc_length} onChange={onChange('cc_length')} type="number" />
        <TextField fullWidth label="Yukseklik" value={form.cc_height} onChange={onChange('cc_height')} type="number" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          fullWidth label="Tercih Edilen Tarih" value={form.cc_preferred_date}
          onChange={onChange('cc_preferred_date')} type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select fullWidth label="Tercih Edilen Zaman" value={form.cc_preferred_time_slot}
          onChange={onChange('cc_preferred_time_slot')}
        >
          <MenuItem value="">Secilmedi</MenuItem>
          {timeSlotOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}

export default function ServiceFields(props: ServiceFieldsProps) {
  switch (props.form.service_type) {
    case ServiceType.TowTruck: return <TowTruckFields {...props} />;
    case ServiceType.Crane: return <CraneFields {...props} />;
    case ServiceType.RoadAssistance: return <RoadAssistanceFields {...props} />;
    case ServiceType.HomeToHomeMoving: return <HomeToHomeMovingFields {...props} />;
    case ServiceType.CityToCity: return <CityToCityFields {...props} />;
    default: return null;
  }
}
