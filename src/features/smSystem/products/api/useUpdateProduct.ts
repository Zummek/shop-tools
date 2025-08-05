import { axiosInstance } from '../../../../services';
import {
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
}

interface Params {
  productId: number;
}

const getEndpoint = ({ productId }: Params) => `/api/v1/products/${productId}/`;

export const useUpdateProduct = () => {
  const request = async (productId: number, payload: Payload) => {
    const response = await axiosInstance.patch(
      getEndpoint({ productId }),
      payload
    );
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

  return {
    updatePriceTagName,
    updateUnit,
    updateUnitScale,
    updateUnitScaleValue,
  };
};
