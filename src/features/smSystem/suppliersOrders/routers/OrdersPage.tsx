import { Stack, Button, CircularProgress } from "@mui/material";
import { useState } from "react";

import AddOrderModal from "../components/AddOrderModal";
import { useMappedOrders } from "../hooks/useMappedOrders";
import OrdersTable from "../tables/OrdersTable";

export const OrdersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const { mappedOrders, loading } = useMappedOrders();

  if (loading) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack width="100%" alignItems="center">
      <Stack spacing={1} width={652} height={429}>
        <OrdersTable orders={mappedOrders} />
        <Stack>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenModal}
            sx={{ width: "110px", height: "50px", ml: "auto" }}
          >
            {"Nowe zamówienie"}
          </Button>
        </Stack>
      </Stack>

      <AddOrderModal open={isModalOpen} handleClose={handleCloseModal} />
    </Stack>
  );
};
