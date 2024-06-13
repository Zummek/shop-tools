// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/browser/esm';

import {
  Product,
  ProductUnit,
  ProductUnitVolumeSize,
  ProductUnitWeightSize,
} from '../types/product';

import { calcPricePerFullUnit, convertPriceToNumber } from './price';

const extractValueAndUnit = (
  input: string
): {
  value: number;
  unit: ProductUnit;
  unitScale: Product['unitScale'];
} | null => {
  // Regular expression to capture the numeric value and the unit
  const regex = /(\d+)\s*(kg|g|mg|l|ml)/;
  const match = input.match(regex);

  if (match) {
    const value = parseInt(match[1], 10);
    const unitSize = match[2].trim() as
      | ProductUnitWeightSize
      | ProductUnitVolumeSize;

    // Check if the unit is valid
    if (
      Object.values(ProductUnitWeightSize).includes(
        unitSize as ProductUnitWeightSize
      ) ||
      Object.values(ProductUnitVolumeSize).includes(
        unitSize as ProductUnitVolumeSize
      )
    ) {
      const isWeightUnit: boolean = Object.values(
        ProductUnitWeightSize
      ).includes(unitSize as ProductUnitWeightSize);
      const unit = isWeightUnit ? ProductUnit.kg : ProductUnit.l;
      const unitScale = unitSize;
      return { value, unit, unitScale };
    }
  }

  return null;
};

export const readProductsFromCsv = async (file: File): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const products: Product[] = [];
      const content = reader.result as string;

      parse(
        content,
        {
          delimiter: '\t',
          fromLine: 2,
          skipEmptyLines: true,
          skip_records_with_empty_values: true,
          trim: true,
          relax_column_count: true,
          columns: true,
        },
        (err, records) => {
          if (err) reject(err);

          for (const record of records) {
            console.log({ record });
            const id = record['Id'];
            const name = record['Nazwa'];
            const priceRaw = record['Cena noc.'];

            if (!name || !priceRaw) continue;

            const price = convertPriceToNumber(priceRaw);

            const extractedValueAndUnit = extractValueAndUnit(name);
            const unit = extractedValueAndUnit?.unit || ProductUnit.kg;
            const unitScale =
              extractedValueAndUnit?.unitScale || ProductUnitWeightSize.kg;
            const productSizeInUnit = extractedValueAndUnit?.value || null;

            const pricePerFullUnit = calcPricePerFullUnit({
              price,
              productSizeInUnit,
              unit,
              unitScale,
            });

            console.log({
              id,
              name,
              price,
              unit,
              productSizeInUnit,
              pricePerFullUnit,
              unitScale,
            });

            products.push({
              id,
              name,
              price,
              unit,
              productSizeInUnit,
              pricePerFullUnit,
              unitScale,
              includedInPriceList: true,
            });
          }

          resolve(products);
        }
      );
    };

    reader.onerror = (error) => reject(error);

    reader.readAsText(file, 'windows-1250');
  });
};
