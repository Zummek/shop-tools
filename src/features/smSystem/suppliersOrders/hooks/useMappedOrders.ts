import { useEffect, useState } from 'react';

import { OrderList } from '../types/index';

import { useFetchOrders } from './useFetchOrders';

export const useMappedOrders = () => {
  const { orders, isFetchingLoading } = useFetchOrders();
  const [loading, setLoading] = useState(true);
  const [mappedOrders, setMappedOrders] = useState<OrderList[]>([]);

  useEffect(() => {
    if (isFetchingLoading) return
    
    if (orders.length === 0) {
      setLoading(false);
      return
    }
    
    const newMappedOrders = orders.map((order) => ({
      id: order.id,
      date: new Date(order.createdAt).toLocaleDateString('pl-PL'),
      supplierName: order.supplier.name,
      branchesNames: order.branches.map((branch) => branch.name).join(', '),
    }));

    setMappedOrders(newMappedOrders);
    setLoading(false);
    
  }, [orders, isFetchingLoading]);

  return { mappedOrders, loading };
};
