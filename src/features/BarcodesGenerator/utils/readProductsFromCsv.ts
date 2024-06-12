// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/browser/esm';

import { ProductBarcode } from '../types';

export const readProductsFromCsv = async (
  file: File
): Promise<ProductBarcode[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const products: ProductBarcode[] = [];
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
        },
        (err, records) => {
          if (err) reject(err);

          for (const record of records) {
            const [name, eanCode] = record as [string, string];

            if (!name || !eanCode) continue;

            products.push({ name, eanCode });
          }

          resolve(products);
        }
      );
    };

    reader.onerror = (error) => reject(error);

    reader.readAsText(file, 'windows-1250');
  });
};
