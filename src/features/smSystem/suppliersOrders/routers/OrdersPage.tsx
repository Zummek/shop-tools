import { Stack, Button, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

import { useGetOrders } from '../api/useGetOrders';
import AddOrderModal from '../components/AddOrderModal';
import OrdersTable from '../tables/OrdersTable';

export const OrdersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const {
    orders,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
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

  const handleLoadMore = (event: React.MouseEvent) => {
    event.preventDefault();
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  return (
    <Stack width="100%" alignItems="center">
      <Stack spacing={1} width={910} height={376}>
        <OrdersTable orders={orders} />

        <Stack direction="row">
          {hasNextPage && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLoadMore}
              sx={{ width: '180px', height: '50px' }}
            >
              {'Załaduj więcej'}
            </Button>
          )}
          {isFetchingNextPage && (
            <Stack paddingLeft={1} width="50px" height="50px">
              <CircularProgress />
            </Stack>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenModal}
            sx={{ width: '180px', height: '50px', ml: 'auto' }}
          >
            {'Nowe zamówienie'}
          </Button>
        </Stack>
      </Stack>

      <AddOrderModal open={isModalOpen} handleClose={handleCloseModal} />
    </Stack>
  );
};
