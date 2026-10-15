import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button, Alert, IconButton,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import LinkDriverTab from './LinkDriverTab';
import RegisterDriverTab from './RegisterDriverTab';
import { colors } from '../../../tokens';

type TabValue = 'link' | 'register';

interface AddDriverDialogProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddDriverDialog({ onClose, onAdded }: AddDriverDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>('link');
  // Telefon iki sekmede ortak; sekme degisince kaybolmaz
  const [phone, setPhone] = useState('');
  // Kayit basariliysa yeni surucunun id'si; belgeleri girmek icin detay sayfasina gidilir
  const [registeredDriverId, setRegisteredDriverId] = useState<number | null>(null);

  const switchTab = (next: TabValue, phoneNumber: string) => {
    setPhone(phoneNumber);
    setTab(next);
  };

  const handleLinked = () => {
    enqueueSnackbar("Sürücü listenize eklendi. Sürücüye bilgi SMS'i gönderildi.", { variant: 'success' });
    onAdded();
    onClose();
  };

  const handleRegistered = (driverId: number) => {
    onAdded();
    setRegisteredDriverId(driverId);
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
        <IconButton onClick={onClose} size="small" sx={{ color: colors.neutral[500] }}>
          <Close />
        </IconButton>
      </DialogTitle>

      {registeredDriverId !== null ? (
        <>
          <DialogContent>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Sürücü kaydedildi. Giriş bilgileri SMS ile gönderildi. Belgeleri ve bilgileri şimdi siz girebilir
              ya da sürücünün uygulamadan girmesini bekleyebilirsiniz.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} sx={{ color: colors.neutral[500] }}>Kapat</Button>
            <Button
              variant="contained"
              onClick={() => {
                onClose();
                navigate(`/panel/drivers/${registeredDriverId}`);
              }}
              sx={{ borderRadius: 2 }}
            >
              Belgeleri şimdi gir
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={(_, value: TabValue) => setTab(value)}
            variant="fullWidth"
            sx={{ borderBottom: `1px solid ${colors.neutral[200]}` }}
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
