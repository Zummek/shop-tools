import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAppSelector } from '../../hooks';
import {
  filterNavSectionsByPermissions,
  getActiveNavItem,
  isNavItemActive,
} from '../../utils/navConfig';

import { AlertsBell } from './AlertsBell';
import { AppSwitcher } from './AppSwitcher';
import { UserMenu } from './UserMenu';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;
const SIDEBAR_COLLAPSED_KEY = 'sm-sidebar-collapsed';

interface Props {
  children: ReactNode;
}

const readCollapsedPreference = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const AppLayout = ({ children }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { pathname } = useLocation();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  const sections = useMemo(
    () => filterNavSectionsByPermissions(user?.permissions),
    [user?.permissions],
  );
  const activeItem = getActiveNavItem(pathname);
  const desktopDrawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const showLabels = isMobile || !collapsed;

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          px: showLabels ? 2 : 1,
          justifyContent: showLabels ? 'space-between' : 'center',
          minHeight: 64,
        }}
      >
        {showLabels && (
          <Typography variant="h6" noWrap>
            {'SM System'}
          </Typography>
        )}
        {!isMobile && (
          <Tooltip
            title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
            placement="right"
          >
            <IconButton
              onClick={toggleCollapsed}
              size="small"
              aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
            >
              {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ overflowX: 'hidden', overflowY: 'auto', flex: 1, py: 1 }}>
        {sections.map((section) => (
          <List
            key={section.title}
            dense
            subheader={
              showLabels ? (
                <ListSubheader
                  component="div"
                  sx={{ bgcolor: 'transparent', lineHeight: 2.5 }}
                >
                  {section.title}
                </ListSubheader>
              ) : (
                <Divider sx={{ my: 1, mx: 1.5 }} />
              )
            }
          >
            {section.items.map((item) => {
              const selected = isNavItemActive(item, pathname);
              if (showLabels) {
                return (
                  <ListItemButton
                    key={item.path}
                    component={Link}
                    to={item.path}
                    selected={selected}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      mx: 1,
                      px: 2,
                      borderRadius: 1,
                      minHeight: 40,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: selected ? 'primary.main' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: selected ? 600 : 400,
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                );
              }

              return (
                <Tooltip
                  key={item.path}
                  title={item.label}
                  placement="right"
                  enterDelay={300}
                >
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={selected}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      mx: 0.75,
                      px: 1.5,
                      borderRadius: 1,
                      justifyContent: 'center',
                      minHeight: 40,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        color: selected ? 'primary.main' : 'inherit',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          zIndex: (t) => t.zIndex.drawer + 1,
          width: {
            md: `calc(100% - ${desktopDrawerWidth}px)`,
          },
          ml: { md: `${desktopDrawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Otwórz menu"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <AppSwitcher />
          {activeItem && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ ml: 3, display: { xs: 'none', sm: 'block' } }}
              noWrap
            >
              {activeItem.label}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <AlertsBell />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: desktopDrawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              width: desktopDrawerWidth,
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: desktopDrawerWidth,
                overflowX: 'hidden',
                borderRight: 1,
                borderColor: 'divider',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
          minWidth: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
};
