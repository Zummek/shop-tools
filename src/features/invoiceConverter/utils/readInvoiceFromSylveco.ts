/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';

import { Contractor, Invoice, InvoiceProvider, ProductGroup } from '../types';

import { convertDotPriceToPrice } from './convertInternalInvoiceToPcMarket';
import { readXmlToJson } from './readXmlToJson';

export const readInvoiceFromSylveco = async (file: File): Promise<Invoice> => {
  const xmlJson = await readXmlToJson(file);
  const data = xmlJson['Document-Invoice'];

  const productsGroups: ProductGroup[] = [];

  const invoiceHeader = data['Invoice-Header'][0];
  const exhibitor: Contractor = {
    id: data['Invoice-Parties'][0]['Seller'][0]['ILN'][0] ?? '1',
    name: data['Invoice-Parties'][0]['Seller'][0]['CodeByBuyer'][0],
    nip: data['Invoice-Parties'][0]['Seller'][0]['TaxID'][0],
  };
  const recipient: Contractor = {
    id: data['Invoice-Parties'][0]['Buyer'][0]['ILN'][0] ?? '2',
    name: data['Invoice-Parties'][0]['Buyer'][0]['Name'][0],
    nip: data['Invoice-Parties'][0]['Buyer'][0]['TaxID'][0],
  };

  data['Invoice-Lines'][0]['Line'].forEach((pLine: any) => {
    const p = pLine['Line-Item'][0];
    productsGroups.push({
      amount: p['InvoiceQuantity'][0],
      product: {
        id: p['LineNumber'][0],
        barcode: p['EAN'][0],
        category: null,
        name: p['ItemDescription'][0],
        netPrice: convertDotPriceToPrice(p['InvoiceUnitNetPrice'][0]),
        unit: p['UnitOfMeasure'][0],
        vat: p['TaxRate'][0],
      },
    });
  });

  return {
    date: dayjs(invoiceHeader['InvoiceDate'][0]).toDate(),
    documentNumber: invoiceHeader['InvoiceNumber'][0],
    exhibitor,
    recipient,
    paymentDeadline: dayjs(invoiceHeader['InvoicePaymentDueDate'][0]).toDate(),
    paymentWay: null,
    products: productsGroups,
    provider: InvoiceProvider.sylveco,
  };
};
