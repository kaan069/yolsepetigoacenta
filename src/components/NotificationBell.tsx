import { useState } from 'react';
import { Badge, Box, Button, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import { NotificationsNone, VolumeUp, VolumeOff, DesktopWindows } from '@mui/icons-material';
import { useNotifications } from '../notifications/context';
import type { NotificationSeverity } from '../notifications/events';
import { colors } from '../tokens';

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  success: colors.success[500],
  info: colors.primary[500],
  warning: colors.secondary[500],
};

const timeAgo = (at: number, now: number) => {
  const minutes = Math.floor((now - at) / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return new Date(at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationBell() {
  const {
    notifications, unreadCount, soundEnabled, setSoundEnabled, desktopPermission, requestDesktopPermission,
    markRead, markAllRead, clearAll, openRequest,
  } = useNotifications();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // "5 dk önce" gibi sureler liste acildigi ana gore
  const [openedAt, setOpenedAt] = useState(0);

  return (
    <>
      <Tooltip title="Bildirimler">
        <IconButton
          onClick={(e) => {
            setOpenedAt(Date.now());
            setAnchor(e.currentTarget);
          }}
          sx={{ bgcolor: colors.white, border: `1px solid ${colors.neutral[200]}`, '&:hover': { bgcolor: colors.primary[50] } }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNone sx={{ color: colors.neutral[700] }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, width: 360, maxWidth: 'calc(100vw - 32px)', borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${colors.neutral[200]}` }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.neutral[900], flex: 1 }}>Bildirimler</Typography>
          <Tooltip title={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}>
            <IconButton size="small" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <VolumeUp fontSize="small" sx={{ color: colors.primary[600] }} /> : <VolumeOff fontSize="small" />}
            </IconButton>
          </Tooltip>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead} sx={{ fontSize: 12 }}>Tümünü okundu say</Button>
          )}
        </Box>

        {desktopPermission === 'default' && (
          <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: colors.primary[50], borderBottom: `1px solid ${colors.primary[100]}` }}>
            <DesktopWindows sx={{ fontSize: 18, color: colors.primary[600] }} />
            <Typography sx={{ fontSize: 12, color: colors.primary[800], flex: 1 }}>
              Panel arka plandayken de bildirim almak için masaüstü bildirimlerini açın.
            </Typography>
            <Button size="small" variant="contained" onClick={requestDesktopPermission} sx={{ fontSize: 12, px: 1.5 }}>Aç</Button>
          </Box>
        )}

        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <NotificationsNone sx={{ fontSize: 36, color: colors.neutral[300] }} />
              <Typography sx={{ fontSize: 13, color: colors.neutral[500], mt: 0.5 }}>Henüz bildirim yok</Typography>
              <Typography sx={{ fontSize: 12, color: colors.neutral[400] }}>Teklif ve onaylar burada görünür.</Typography>
            </Box>
          ) : notifications.map((item) => (
            <Box
              key={item.id}
              onClick={() => {
                markRead(item.id);
                setAnchor(null);
                openRequest(item.requestId);
              }}
              sx={{
                px: 2, py: 1.25, display: 'flex', gap: 1.5, cursor: 'pointer',
                bgcolor: item.read ? 'transparent' : colors.primary[50],
                borderBottom: `1px solid ${colors.neutral[100]}`,
                '&:hover': { bgcolor: colors.neutral[50] },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', mt: 0.75, flexShrink: 0, bgcolor: SEVERITY_DOT[item.severity] }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: item.read ? 500 : 700, color: colors.neutral[900] }}>{item.title}</Typography>
                <Typography sx={{ fontSize: 12, color: colors.neutral[600] }}>{item.message}</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: colors.neutral[400], whiteSpace: 'nowrap' }}>
                {timeAgo(item.createdAt, openedAt)}
              </Typography>
            </Box>
          ))}
        </Box>

        {notifications.length > 0 && (
          <Box sx={{ px: 2, py: 1, textAlign: 'right' }}>
            <Button size="small" onClick={clearAll} sx={{ fontSize: 12, color: colors.neutral[500] }}>Listeyi temizle</Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
