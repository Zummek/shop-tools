/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';

import { Contractor, Invoice, InvoideProvider, ProductGroup } from '../types';

import { convertDotPriceToPrice } from './convertInternalInvoiceToPcMarket';
import { readXmlToJson } from './readXmlToJson';

export const readInvoiceFromDary = async (file: File): Promise<Invoice> => {
  const xmlJson = await readXmlToJson(file);

  const contractors: Contractor[] = [];
  const productsGroups: ProductGroup[] = [];

  const data = xmlJson['xsl:stylesheet'].dokumenty[0];

  data.kontrahenci[0].kontrahent.forEach((c: any) => {
    contractors.push({
      id: c['id-knt'][0],
      name: c.nazwa[0],
      nip: c.nip[0].replaceAll('-', ''),
    });
  });
  const invoiceHeader = data.faktury[0].faktura[0].naglowek[0];
  const exhibitor =
    contractors.find((c) => c.id === invoiceHeader['id-knt-sprzedawcy'][0]) ||
    null;
  const recipient =
    contractors.find((c) => c.id === invoiceHeader['id-knt-nabywcy'][0]) ||
    null;

  data.faktury[0].faktura[0].pozycje[0].pozycja.forEach((p: any) => {
    productsGroups.push({
      amount: p.ilosc[0],
      product: {
        id: p['id-towaru'][0],
        barcode: p['kod-kreskowy'][0],
        category: null,
        name: data.towary[0].towar.find(
          (t: any) => t['id-towaru'][0] === p['id-towaru'][0]
        ).nazwa[0],
        netPrice: convertDotPriceToPrice(p['cena-netto'][0]),
        unit: p['jednostka-miary'][0],
        vat: p['stawka-vat'][0],
      },
    });
  });

  return {
    date: dayjs(invoiceHeader['data-sprzedazy'][0]).toDate(),
    documentNumber: invoiceHeader['nr-faktury'][0],
    exhibitor,
    recipient,
    paymentDeadline: dayjs(invoiceHeader['termin-platnosci'][0]).toDate(),
    paymentWay: null,
    products: productsGroups,
    provider: InvoideProvider.dary,
  };
};