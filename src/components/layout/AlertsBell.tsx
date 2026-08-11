import NotificationsIcon from '@mui/icons-material/Notifications';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useGetAlertUnreadCount } from '../../features/smSystem/alerts/api';
import { useAppSelector } from '../../hooks';
import { Pages } from '../../utils';

export const AlertsBell = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewAlerts = !!user?.permissions?.canViewAlerts;
  const { unreadCount } = useGetAlertUnreadCount(canViewAlerts);

  if (!canViewAlerts) return null;

  return (
    <Tooltip title="Alerty">
      <IconButton
        color="inherit"
        aria-label="Alerty"
        onClick={() => navigate(Pages.smSystemAlerts)}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount?.total || 0} max={99} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
