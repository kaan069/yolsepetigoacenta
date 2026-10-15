import { Typography } from '@mui/material';
import { colors } from '../../../tokens';

export default function SectionLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>
      {children}
    </Typography>
  );
}
