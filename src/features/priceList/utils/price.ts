import {
  ProductUnit,
  ProductUnitVolumeSize,
  ProductUnitWeightSize,
  productUnitVolumeSizeScale,
  productUnitWeightSizeScale,
} from '../types/product';

// remove `,` from price string
export const convertPriceToNumber = (price: number | string | null) => {
  if (price === null) return null;

  return parseInt(price.toString().replace(',', '').replace('.', ''), 10);
};

// add `,` to price string after 2 decimal places
export const convertNumberToPrice = (price: number) => {
  const firstPart = price.toString().slice(0, -2);
  const secondPart = price.toString().slice(-2).padStart(2, '0');

  if (firstPart === '') return '0,' + secondPart;
  if (firstPart === '0') return firstPart + ',' + secondPart;
  return firstPart + ',' + secondPart;
};

interface CalcPricePerFullUnitParmas {
  price: number | null;
  productSizeInUnit: number | null;
  unit: ProductUnit;
  unitScale: ProductUnitWeightSize | ProductUnitVolumeSize;
}
export const calcPricePerFullUnit = ({
  price,
  productSizeInUnit,
  unit,
  unitScale,
}: CalcPricePerFullUnitParmas) => {
  if (!productSizeInUnit || !price) return null;

  const result =
    price /
    (productSizeInUnit *
      (unit === ProductUnit.kg
        ? productUnitWeightSizeScale[unitScale as ProductUnitWeightSize]
        : productUnitVolumeSizeScale[unitScale as ProductUnitVolumeSize]));
  const significantNumbers = (+result * 100).toString().split('.')[0];
  return +significantNumbers.toString().slice(0, -2);
};
