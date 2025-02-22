import { useEffect, useState } from 'react';

import { MappedOrderDetails, ProductInOrderWithTotal } from '../types/index';

import { useFetchOrders } from './useFetchOrders';

export const useMappedOrderDetails = (orderId: string | undefined) => {
  const { orders, isFetchingLoading } = useFetchOrders();

  const [mappedOrderDetails, setMappedOrderDetails] = useState<MappedOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minLp, setMinLp] = useState<number | null>(null);

  useEffect(() => {
    if (isFetchingLoading) return

    if (orders.length === 0) {
      setIsLoading(false);
      return
    }

    if (!orderId) return
     
    const orderIdNum = Number(orderId)
    if (!Number.isInteger(orderIdNum)) {
      setIsLoading(false);
      return
    }

    const order = orders.find((order) => order.id === orderIdNum);
    if (!order) {
      setIsLoading(false);
      return
    }

    const branchesNames = order.branches.map((branch) => branch.name).join(', ');
    
    const productsInOrderWithTotal: ProductInOrderWithTotal[] = order.productsInOrder.map(
      (productInOrder, index) => {
        const totalToOrder = productInOrder.ordersPerBranch.reduce(
          (total, orderPerBranch) => {
            const branchExists = order.branches.some(
              (branches) => branches.id === orderPerBranch.branch.id
            );
    
            if (!branchExists) {
              orderPerBranch.toOrder = null;
              orderPerBranch.originalToOrder = null;
            }
    
            return total + (orderPerBranch.toOrder || 0);
          },
          0
        );
    
        return {
          ...productInOrder,
          lp: index + 1,
          totalToOrder,
        };
      }
    );
    
    const mappedOrder: MappedOrderDetails = {
      id: order.id,
      supplier: order.supplier,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      updatedAt: order.updatedAt,
      updatedBy: order.updatedBy,
      branches: order.branches,
      branchesNames,
      productsInOrder: productsInOrderWithTotal,
    };

    const min = mappedOrder.productsInOrder.length > 0 
      ? Math.min(...mappedOrder.productsInOrder.map(product => product.lp)) 
      : null;
    
    setMinLp(min)
    setMappedOrderDetails(mappedOrder);
    setIsLoading(false);  
    
  }, [orders, isFetchingLoading, orderId]);

  return { mappedOrderDetails, isLoading, minLp };
};
