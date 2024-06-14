export enum ProductUnit {
  kg = 'kg',
  l = 'l',
}

export enum ProductUnitWeightSize {
  kg = 'kg',
  g = 'g',
  mg = 'mg',
}
export enum ProductUnitVolumeSize {
  l = 'l',
  ml = 'ml',
}

export enum PriceType {
  ewidencyjna = 'ewidencyjna',
  detaliczna = 'detaliczna',
  hurtowa = 'hurtowa',
  nocna = 'nocna',
}

export const productUnitVolumeSizeScale = {
  [ProductUnitVolumeSize.l]: 1,
  [ProductUnitVolumeSize.ml]: 0.001,
};

export const productUnitWeightSizeScale = {
  [ProductUnitWeightSize.kg]: 1,
  [ProductUnitWeightSize.g]: 0.001,
  [ProductUnitWeightSize.mg]: 0.000001,
};

export const weightUnits: ProductUnitWeightSize[] = [
  ProductUnitWeightSize.kg,
  ProductUnitWeightSize.g,
  ProductUnitWeightSize.mg,
];
export const volumeUnits = [ProductUnitVolumeSize.l, ProductUnitVolumeSize.ml];

export interface Product {
  id: string;
  name: string;
  prices: {
    ewidencyjna: number | null;
    detaliczna: number | null;
    hurtowa: number | null;
    nocna: number | null;
  };
  unit: ProductUnit;
  unitScale: ProductUnitWeightSize | ProductUnitVolumeSize;
  productSizeInUnit: number | null;
  pricePerFullUnit: number | null;
  includedInPriceList: boolean;
}
