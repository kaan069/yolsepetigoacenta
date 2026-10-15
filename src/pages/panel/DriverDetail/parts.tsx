import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { colors } from '../../../tokens';

const VERIFICATION_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  no_document: { label: 'Belge yok', bg: colors.warning[100], color: colors.warning[700] },
  pending: { label: 'Onay bekliyor', bg: colors.primary[100], color: colors.primary[700] },
  approved: { label: 'Onaylandı', bg: colors.success[100], color: colors.success[600] },
  rejected: { label: 'Reddedildi', bg: colors.danger[100], color: colors.danger[600] },
};

export function VerificationChip({ status }: { status: string }) {
  const style = VERIFICATION_STYLES[status] ?? { label: status, bg: colors.neutral[100], color: colors.neutral[500] };
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: style.bg, color: style.color }}
    />
  );
}

// Kontrol listesinden kaydirilabilmesi icin her kartin bir id'si vardir
export function SectionCard({ id, title, action, children }: {
  id?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}`, mb: 2, scrollMarginTop: 80 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
