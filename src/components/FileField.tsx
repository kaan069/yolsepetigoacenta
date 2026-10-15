import { useState } from 'react';
import { Box, Typography, Button, IconButton, Link as MuiLink } from '@mui/material';
import { AttachFile, Close, OpenInNew } from '@mui/icons-material';

// Backend kurali: jpg, jpeg, png, webp ya da pdf; en fazla 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface FileFieldProps {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  // Daha once yuklenmis dosya
  currentUrl?: string | null;
  error?: string;
}

export default function FileField({ label, required, file, onChange, currentUrl, error }: FileFieldProps) {
  const [localError, setLocalError] = useState('');

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    // Ayni dosya tekrar secilebilsin
    e.target.value = '';
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setLocalError('Sadece JPG, PNG, WEBP ya da PDF yüklenebilir');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setLocalError("Dosya 5 MB'tan büyük olamaz");
      return;
    }
    setLocalError('');
    onChange(selected);
  };

  const shownError = localError || error;

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1, minWidth: 160 }}>
          {label}{required ? ' *' : ''}
        </Typography>
        {currentUrl && !file && (
          <MuiLink href={currentUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            Mevcut dosya <OpenInNew sx={{ fontSize: 14 }} />
          </MuiLink>
        )}
        <Button component="label" size="small" variant="outlined" startIcon={<AttachFile />} sx={{ borderRadius: 2 }}>
          {file || currentUrl ? 'Değiştir' : 'Dosya seç'}
          <input hidden type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleSelect} />
        </Button>
      </Box>
      {file && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography noWrap sx={{ fontSize: 12, color: '#0369a1' }}>{file.name}</Typography>
          <IconButton size="small" onClick={() => onChange(null)} title="Kaldır">
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
      {shownError && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{shownError}</Typography>}
    </Box>
  );
}
