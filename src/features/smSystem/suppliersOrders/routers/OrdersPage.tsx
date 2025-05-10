import { Stack, Button, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

import { useGetOrders } from '../api/useGetOrders';
import { AddOrderModal } from '../components/AddOrderModal/Modal';
import { OrdersTable } from '../tables/OrdersTable';

export const OrdersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const [page, setPage] = useState(0);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    isError,
  } = useGetOrders();

  if (isError) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Błąd pobierania danych'}
      </Typography>
    );
  }
  if (isLoading) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack width="100%" alignItems="center">
      <Stack spacing={1} width={910} height={429}>
        <OrdersTable data={data} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} page={page} setPage={setPage} />

        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
          {isFetchingNextPage && (
            <Stack width="50px" height="50px" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Stack>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenModal}
            sx={{ width: '180px', height: '50px' }}
          >
            {'Nowe zamówienie'}
          </Button>
        </Stack>
      </Stack>

      <AddOrderModal open={isModalOpen} handleClose={handleCloseModal} />
    </Stack>
  );
};
