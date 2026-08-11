import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';

import {
  useLogoutUser,
  useUserSession,
} from '../../features/smSystem/user/hooks';
import { useAppSelector } from '../../hooks';

export const UserMenu = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { isSessionActive } = useUserSession();
  const { logoutUser } = useLogoutUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!isSessionActive) return null;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Konto';

  return (
    <>
      <Button
        color="inherit"
        startIcon={<PersonOutlineIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ textTransform: 'none' }}
      >
        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
          {displayName}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logoutUser(false);
          }}
        >
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          {'Wyloguj'}
        </MenuItem>
      </Menu>
    </>
  );
};
