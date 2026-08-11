import AppsIcon from '@mui/icons-material/Apps';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { appSwitcherItems } from '../../utils/navConfig';
import { Pages } from '../../utils/pages';

const getActiveAppLabel = (pathname: string): string => {
  if (pathname.startsWith(Pages.smSystem)) return 'SM System';
  const match = appSwitcherItems.find((item) =>
    pathname.startsWith(item.path),
  );
  return match?.label ?? 'Aplikacje';
};

export const AppSwitcher = () => {
  const { pathname } = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        color="inherit"
        startIcon={<AppsIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        {getActiveAppLabel(pathname)}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {appSwitcherItems.map((item) => (
          <MenuItem
            key={item.path}
            component={Link}
            to={item.path}
            selected={pathname.startsWith(item.path)}
            onClick={() => setAnchorEl(null)}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
