import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetDeliveryGroups } from '../api';
import { DeliveryGroupMethod } from '../types';
import { orderChannelLabel } from '../utils';

const MethodsTable = ({ methods }: { methods: DeliveryGroupMethod[] }) => {
  if (methods.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {'Brak metod w tej grupie'}
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{'Źródło'}</TableCell>
          <TableCell>{'Nazwa metody'}</TableCell>
          <TableCell>{'ID metody'}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {methods.map((method) => (
          <TableRow key={`${method.source}:${method.deliveryId}`}>
            <TableCell>{orderChannelLabel(method.source)}</TableCell>
            <TableCell>{method.deliveryName || '—'}</TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {method.deliveryId}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const DeliveryGroupsPage = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { catalog, isLoading, isError } = useGetDeliveryGroups();

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{'Mapowanie dostaw'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {
            'Skrócone nazwy grup używane na liście zamówień. Edycja tylko przez administrację.'
          }
        </Typography>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {'Nie udało się pobrać mapowania dostaw'}
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          {catalog.groups.length === 0 && catalog.unmapped.length === 0 && (
            <Alert severity="info">
              {
                'Brak metod dostawy. Pojawią się po imporcie zamówień z Allegro, Erli lub WooCommerce.'
              }
            </Alert>
          )}

          {catalog.groups.map((group) => (
            <Paper key={group.id} variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Typography variant="h6">{group.name}</Typography>
                <Chip
                  size="small"
                  label={`${group.methods.length}`}
                  variant="outlined"
                />
              </Stack>
              <MethodsTable methods={group.methods} />
            </Paper>
          ))}

          {catalog.unmapped.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Typography variant="h6">{'Bez grupy'}</Typography>
                <Chip
                  size="small"
                  label={`${catalog.unmapped.length}`}
                  variant="outlined"
                />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {
                  'Te metody są wyświetlane na liście pod własną nazwą, obok grup.'
                }
              </Typography>
              <MethodsTable methods={catalog.unmapped} />
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
};
