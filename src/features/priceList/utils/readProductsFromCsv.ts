// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/browser/esm';

import {
  PriceType,
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

export const readProductsFromCsv = async (
  file: File,
  priceType: PriceType
): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const products: Product[] = [];
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;

      if (!content) {
        reject(new Error('Failed to read file content'));
        return;
      }

      const parser = parse({
        delimiter: '\t',
        fromLine: 2,
        skipEmptyLines: true,
        skip_records_with_empty_values: true,
        trim: true,
        relax_column_count: true,
        columns: true,
        relaxQuotes: true,
        quote: '"',
        escape: '"',
      });

      parser.on('readable', () => {
        let record;

        while ((record = parser.read())) {
          const id = record['Id'];
          const name = record['Nazwa'];
          const priceNocRaw = record['Cena noc.'];
          const priceEwidencyjnaRaw = record['Cena ew.'];
          const priceDetalicznaRaw = record['Cena det.'];
          const priceHurtowaRaw = record['Cena hurt.'];

          if (
            !name ||
            (!priceNocRaw &&
              !priceEwidencyjnaRaw &&
              !priceDetalicznaRaw &&
              !priceHurtowaRaw)
          )
            continue;

          const priceDetaliczna = convertPriceToNumber(priceDetalicznaRaw);
          const priceNoc = convertPriceToNumber(priceNocRaw);
          const priceEwidencyjna = convertPriceToNumber(priceEwidencyjnaRaw);
          const priceHurtowa = convertPriceToNumber(priceHurtowaRaw);

          const extractedValueAndUnit = extractValueAndUnit(name);
          const unit = extractedValueAndUnit?.unit || ProductUnit.kg;
          const unitScale =
            extractedValueAndUnit?.unitScale || ProductUnitWeightSize.kg;
          const productSizeInUnit = extractedValueAndUnit?.value || null;

          let priceInSelectedUnit;

          switch (priceType) {
            default:
            case PriceType.detaliczna:
              priceInSelectedUnit = priceDetaliczna;
              break;
            case PriceType.nocna:
              priceInSelectedUnit = priceNoc;
              break;
            case PriceType.ewidencyjna:
              priceInSelectedUnit = priceEwidencyjna;
              break;
            case PriceType.hurtowa:
              priceInSelectedUnit = priceHurtowa;
              break;
          }

          const pricePerFullUnit = calcPricePerFullUnit({
            price: priceInSelectedUnit,
            productSizeInUnit,
            unit,
            unitScale,
          });

          const product = {
            id,
            name,
            prices: {
              detaliczna: priceDetaliczna,
              nocna: priceNoc,
              ewidencyjna: priceEwidencyjna,
              hurtowa: priceHurtowa,
            },
            unit,
            productSizeInUnit,
            pricePerFullUnit,
            unitScale,
            includedInPriceList: true,
          };

          products.push(product);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(products);
      });

      parser.write(content);
      parser.end();
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file, 'windows-1250');
  });
};
