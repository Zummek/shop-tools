import { Navigate, useParams } from 'react-router-dom';

export const LegacySupplierOrderDetailsRedirect = () => {
  const { orderId } = useParams();
  return (
    <Navigate to={`/sm-system/suppliers-orders-v2/orders/${orderId}`} replace />
  );
};

export const LegacySupplierDetailsRedirect = () => {
  const { supplierId } = useParams();
  return (
    <Navigate
      to={`/sm-system/suppliers-orders-v2/suppliers/${supplierId}`}
      replace
    />
  );
};
