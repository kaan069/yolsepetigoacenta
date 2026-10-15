import { Box, Typography } from '@mui/material';
import { colors, gradients } from '../tokens';

const LOGO_SRC = '/assets/goyazililogo.webp';

interface BrandLogoProps {
  size?: number;
  subtitle?: string;
  // Koyu zeminde (or. footer) marka yazisi beyaz olur
  inverted?: boolean;
}

// Web TopBar ile ayni marka gorunumu: yuvarlak logo + gradyan "YolSepetiGO"
export default function BrandLogo({ size = 40, subtitle, inverted = false }: BrandLogoProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        component="img"
        src={LOGO_SRC}
        alt="YolSepetiGO"
        sx={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          boxShadow: `0 4px 12px ${colors.primary[500]}33`,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: Math.round(size * 0.42),
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -0.3,
            ...(inverted
              ? { color: colors.white }
              : { background: gradients.brandText, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }),
          }}
        >
          YolSepetiGO
        </Typography>
        {subtitle && (
          <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 500, color: inverted ? colors.neutral[400] : colors.neutral[500] }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
