import { useState, useEffect } from "react";

import { suppliers as suppliersMock, branches as branchesMock, orderDetailsMock } from "../mocks/mock";
import { IdName, OrderDetails } from "../types";

export const useFetchOrders = () => {
  const [ordersDetails, setOrdersDetails] = useState<OrderDetails[]>([]);
  const [suppliers, setSuppliers] = useState<IdName[]>([]);
  const [branches, setBranches] = useState<IdName[]>([]);
  const [isFetchingLoading, setIsFetchingLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOrdersDetails(orderDetailsMock);
      setSuppliers(suppliersMock);
      setBranches(branchesMock);
      setIsFetchingLoading(false);
    };
    fetchData();
  }, []);

  return { orders: ordersDetails, suppliers, branches, isFetchingLoading };
};