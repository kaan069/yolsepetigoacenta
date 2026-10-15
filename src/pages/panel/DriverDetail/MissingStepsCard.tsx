import { Box, Typography, ButtonBase } from '@mui/material';
import { CheckCircle, Schedule, WarningAmber } from '@mui/icons-material';
import type { MissingStep } from '../../../types';
import { SectionCard } from './parts';
import { STEP_CARD_IDS } from './constants';
import { colors } from '../../../tokens';

export default function MissingStepsCard({ steps }: { steps: MissingStep[] }) {
  if (steps.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 2, borderRadius: 3, bgcolor: colors.success[50], border: `1px solid ${colors.success[200]}` }}>
        <CheckCircle sx={{ color: colors.success[600] }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.success[800] }}>Sürücü iş almaya hazır</Typography>
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
              <Schedule sx={{ fontSize: 20, color: colors.primary[500], mt: 0.1 }} />
            ) : (
              <WarningAmber sx={{ fontSize: 20, color: step.status === 'rejected' ? colors.danger[600] : colors.secondary[500], mt: 0.1 }} />
            )}
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.neutral[900] }}>{step.message}</Typography>
              {step.status === 'rejected' && step.rejection_reason && (
                <Typography sx={{ fontSize: 12, color: colors.danger[600] }}>Red sebebi: {step.rejection_reason}</Typography>
              )}
              {waitingAdmin && (
                <Typography sx={{ fontSize: 12, color: colors.neutral[400] }}>Admin onayı bekleniyor, sizin yapmanız gereken bir şey yok.</Typography>
              )}
            </Box>
          </>
        );
        const rowSx = { display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%', py: 1, px: 1, borderRadius: 2 };

        return waitingAdmin ? (
          <Box key={index} sx={rowSx}>{content}</Box>
        ) : (
          <ButtonBase key={index} onClick={() => scrollToCard(step)} sx={{ ...rowSx, '&:hover': { bgcolor: colors.neutral[50] } }}>
            {content}
          </ButtonBase>
        );
      })}
    </SectionCard>
  );
}
