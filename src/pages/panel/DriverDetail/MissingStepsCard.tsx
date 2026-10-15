import { Box, Typography, ButtonBase } from '@mui/material';
import { CheckCircle, Schedule, WarningAmber } from '@mui/icons-material';
import type { MissingStep } from '../../../types';
import { SectionCard } from './parts';
import { STEP_CARD_IDS } from './constants';

export default function MissingStepsCard({ steps }: { steps: MissingStep[] }) {
  if (steps.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 2, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <CheckCircle sx={{ color: '#16a34a' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Sürücü iş almaya hazır</Typography>
      </Box>
    );
  }

  const scrollToCard = (step: MissingStep) => {
    document.getElementById(STEP_CARD_IDS[step.step])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <SectionCard title="Eksikler ve onay durumu">
      {steps.map((step, index) => {
        // pending: admin onayi bekleniyor, acentenin yapacagi bir sey yok
        const waitingAdmin = step.status === 'pending';
        const content = (
          <>
            {waitingAdmin ? (
              <Schedule sx={{ fontSize: 20, color: '#0ea5e9', mt: 0.1 }} />
            ) : (
              <WarningAmber sx={{ fontSize: 20, color: step.status === 'rejected' ? '#dc2626' : '#f97316', mt: 0.1 }} />
            )}
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{step.message}</Typography>
              {step.status === 'rejected' && step.rejection_reason && (
                <Typography sx={{ fontSize: 12, color: '#dc2626' }}>Red sebebi: {step.rejection_reason}</Typography>
              )}
              {waitingAdmin && (
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Admin onayı bekleniyor, sizin yapmanız gereken bir şey yok.</Typography>
              )}
            </Box>
          </>
        );
        const rowSx = { display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%', py: 1, px: 1, borderRadius: 2 };

        return waitingAdmin ? (
          <Box key={index} sx={rowSx}>{content}</Box>
        ) : (
          <ButtonBase key={index} onClick={() => scrollToCard(step)} sx={{ ...rowSx, '&:hover': { bgcolor: '#f8fafc' } }}>
            {content}
          </ButtonBase>
        );
      })}
    </SectionCard>
  );
}
