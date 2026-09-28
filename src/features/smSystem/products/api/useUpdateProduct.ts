import { axiosInstance, throwAxiosErrorFromResponse } from '../../../../services';
import {
  Product,
  ProductUnit,
  ProductUnitScale,
  ProductUnitVolumeScale,
  ProductUnitWeightScale,
} from '../types';

interface Payload {
  priceTagName?: string;
  unit?: ProductUnit;
  unitScale?: ProductUnitScale | null;
  unitScaleValue?: number | null;
  manualPurchaseNetPrice?: number | null;
}

interface Params {
  productId: number;
}

const getEndpoint = ({ productId }: Params) => `/api/v1/products/${productId}/`;

export const useUpdateProduct = () => {
  const request = async (
    productId: number,
    payload: Payload,
    { throwOn400 = false }: { throwOn400?: boolean } = {},
  ) => {
    const response = await axiosInstance.patch<Product>(
      getEndpoint({ productId }),
      payload
    );
    if (throwOn400 && response.status === 400)
      throwAxiosErrorFromResponse(response);
    return response.data;
  };

  const updatePriceTagName = async (
    productId: number,
    priceTagName: string
  ) => {
    const response = await request(productId, {
      priceTagName,
    });
    return response;
  };

  const updateUnit = async (productId: number, unit: ProductUnit) => {
    let defaultUnitScale: ProductUnitScale | null = null;
    switch (unit) {
      case ProductUnit.kg:
        defaultUnitScale = ProductUnitWeightScale.kg;
        break;
      case ProductUnit.l:
        defaultUnitScale = ProductUnitVolumeScale.l;
        break;
      case ProductUnit.pc:
        defaultUnitScale = null;
        break;
    }
    const response = await request(productId, {
      unit,
      unitScale: defaultUnitScale,
    });
    return response;
  };

  const updateUnitScale = async (
    productId: number,
    unitScale: ProductUnitScale
  ) => {
    const response = await request(productId, {
      unitScale,
    });
    return response;
  };

  const updateUnitScaleValue = async (
    productId: number,
    unitScaleValue: number | null
  ) => {
    const response = await request(productId, {
      unitScaleValue,
    });
    return response;
  };

  const updateManualPurchaseNetPrice = async (
    productId: number,
    manualPurchaseNetPrice: number | null
  ) => {
    return request(
      productId,
      { manualPurchaseNetPrice },
      { throwOn400: true },
    );
  };

  return {
    updatePriceTagName,
    updateUnit,
    updateUnitScale,
    updateUnitScaleValue,
    updateManualPurchaseNetPrice,
  };
};
