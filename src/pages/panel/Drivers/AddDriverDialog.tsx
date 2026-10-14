import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button, Alert, IconButton,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import LinkDriverTab from './LinkDriverTab';
import RegisterDriverTab from './RegisterDriverTab';

type TabValue = 'link' | 'register';

interface AddDriverDialogProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddDriverDialog({ onClose, onAdded }: AddDriverDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<TabValue>('link');
  // Telefon iki sekmede ortak; sekme degisince kaybolmaz
  const [phone, setPhone] = useState('');
  const [registered, setRegistered] = useState(false);

  const switchTab = (next: TabValue, phoneNumber: string) => {
    setPhone(phoneNumber);
    setTab(next);
  };

  const handleLinked = () => {
    enqueueSnackbar("Sürücü listenize eklendi. Sürücüye bilgi SMS'i gönderildi.", { variant: 'success' });
    onAdded();
    onClose();
  };

  const handleRegistered = () => {
    onAdded();
    setRegistered(true);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
        Sürücü Ekle
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      {registered ? (
        <>
          <DialogContent>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Sürücü kaydedildi. Giriş bilgileri SMS ile gönderildi. Sürücü uygulamadan ehliyet, araç belgeleri,
              şirket bilgisi ve IBAN'ını girip onaylandığında atanabilir.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" onClick={onClose} sx={{ borderRadius: 2 }}>Tamam</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={(_, value: TabValue) => setTab(value)}
            variant="fullWidth"
            sx={{ borderBottom: '1px solid #e2e8f0' }}
          >
            <Tab value="link" label="Numarayla ekle" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="register" label="Yeni sürücü kaydet" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
          <DialogContent>
            {tab === 'link' ? (
              <LinkDriverTab
                phone={phone}
                onPhoneChange={setPhone}
                onLinked={handleLinked}
                onRegisterInstead={(phoneNumber) => switchTab('register', phoneNumber)}
              />
            ) : (
              <RegisterDriverTab
                phone={phone}
                onPhoneChange={setPhone}
                onRegistered={handleRegistered}
                onLinkInstead={(phoneNumber) => switchTab('link', phoneNumber)}
              />
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
