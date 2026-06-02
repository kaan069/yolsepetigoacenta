import { useEffect } from 'react';
import { Dialog, Box, IconButton, Typography } from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { LocationShareImage } from '../types';

interface ImageLightboxProps {
  open: boolean;
  images: LocationShareImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function ImageLightbox({
  open, images, index, onClose, onIndexChange,
}: ImageLightboxProps) {
  const n = images.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (n === 0) return;
      if (e.key === 'ArrowLeft') {
        onIndexChange((index - 1 + n) % n);
      } else if (e.key === 'ArrowRight') {
        onIndexChange((index + 1) % n);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, index, n, onIndexChange, onClose]);

  const current = images[index];

  // Gorsel moderasyonla silinmis olabilir -> gosterilecek bir sey kalmadiysa kapat
  useEffect(() => {
    if (open && !current) onClose();
  }, [open, current, onClose]);

  return (
    <Dialog
      open={open && !!current}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.92)' } }}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <Close />
        </IconButton>

        {n > 1 && (
          <IconButton
            onClick={() => onIndexChange((index - 1 + n) % n)}
            sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {current && (
          <img
            src={current.url}
            alt="Araç görseli"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}

        {n > 1 && (
          <IconButton
            onClick={() => onIndexChange((index + 1) % n)}
            sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {n > 0 && (
          <Typography
            sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.5, borderRadius: 999, fontSize: 13, fontWeight: 600 }}
          >
            {index + 1} / {n}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}
