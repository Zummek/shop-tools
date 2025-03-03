/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/browser/esm';

import { Invoice, InvoiceProvider, ProductGroup } from '../types';

import { convertDotPriceToPrice } from './convertInternalInvoiceToPcMarket';

export const readInvoiceFromBezGluten = async (
  file: File
): Promise<Invoice> => {
  const csvRecords = await new Promise<any>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      parse(
        content,
        {
          skipEmptyLines: true,
          columns: true,
          trim: true,
          delimiter: ';',
          quote: '',
          relaxColumnCount: true,
          relaxQuotes: true,
          bom: true,
        },
        (err, records) => {
          if (err) reject(err);
          resolve(records);
        }
      );
    };

    reader.readAsText(file);
  });

  const productsGroups: ProductGroup[] = [];
  let docNumber = '';

  csvRecords.forEach((record: any) => {
    docNumber = record.NazwaDokumentu;

    productsGroups.push({
      amount: record.Ilosc,
      product: {
        id: record.ProduktID,
        barcode: record.EAN,
        category: record.Kategoria,
        name: record.ProduktNazwa,
        netPrice: convertDotPriceToPrice(record.Cena),
        unit: record.Jednostka,
        vat: record.VAT,
      },
    });
  });

  return {
    date: null,
    documentNumber: docNumber,
    exhibitor: null,
    recipient: null,
    paymentDeadline: null,
    paymentWay: null,
    products: productsGroups,
    provider: InvoiceProvider.bezGluten,
  };
};
