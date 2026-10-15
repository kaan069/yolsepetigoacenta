import { Card, CardContent, Box, Typography, Chip } from '@mui/material';

const VERIFICATION_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  no_document: { label: 'Belge yok', bg: '#fef3c7', color: '#b45309' },
  pending: { label: 'Onay bekliyor', bg: '#e0f2fe', color: '#0369a1' },
  approved: { label: 'Onaylandı', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'Reddedildi', bg: '#fee2e2', color: '#dc2626' },
};

export function VerificationChip({ status }: { status: string }) {
  const style = VERIFICATION_STYLES[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' };
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
    <Card id={id} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0', mb: 2, scrollMarginTop: 80 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
