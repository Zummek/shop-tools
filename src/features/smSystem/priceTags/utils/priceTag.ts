import {
  ProductUnit,
  ProductUnitScale,
  ProductUnitVolumeScale,
  ProductUnitWeightScale,
} from '../../products/types';

export const productUnitVolumeScale = {
  [ProductUnitVolumeScale.l]: 1,
  [ProductUnitVolumeScale.ml]: 0.001,
};

export const productUnitWeightScale = {
  [ProductUnitWeightScale.kg]: 1,
  [ProductUnitWeightScale.g]: 0.001,
  [ProductUnitWeightScale.mg]: 0.000001,
};

interface CalcPricePerFullUnitParams {
  price: number | null;
  productSizeInUnit: number | null;
  unit: ProductUnit;
  unitScale: ProductUnitScale;
}
export const calcPricePerFullUnit = ({
  price,
  productSizeInUnit,
  unit,
  unitScale,
}: CalcPricePerFullUnitParams) => {
  if (!price) return null;

  if (unit === ProductUnit.pc) {
    const significantNumbers = (+price * 100).toString().split('.')[0];
    return +significantNumbers.toString().slice(0, -2);
  }

  if (!productSizeInUnit) return null;

  const result =
    price /
    (productSizeInUnit *
      (unit === ProductUnit.kg
        ? productUnitWeightScale[unitScale as ProductUnitWeightScale]
        : productUnitVolumeScale[unitScale as ProductUnitVolumeScale]));
  const significantNumbers = (+result * 100).toString().split('.')[0];
  return +significantNumbers.toString().slice(0, -2);
};
