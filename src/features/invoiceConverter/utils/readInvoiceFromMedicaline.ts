/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';

import { Invoice, InvoideProvider, ProductGroup } from '../types';

import { convertDotPriceToPrice } from './convertInternalInvoiceToPcMarket';
import { readXmlToJson } from './readXmlToJson';

export const readInvoiceFromMedicaline = async (
  file: File
): Promise<Invoice> => {
  const xmlJson = await readXmlToJson(file);
  const productsGroups: ProductGroup[] = [];

  const data = xmlJson['Document-Invoice'];

  const exhibitorData = data['Invoice-Parties'][0].Seller[0];
  const recipientData = data['Invoice-Parties'][0].Buyer[0];
  const exhibitor = {
    id: exhibitorData.AccountNumber[0],
    name: exhibitorData.Name[0],
    nip: exhibitorData.AccountNumber[0],
  };
  const recipient = {
    id: recipientData.TaxID[0],
    name: recipientData.Name[0],
    nip: recipientData.TaxID[0],
  };

  data['Invoice-Lines'][0].Line[0]['Line-Item'].forEach((p: any) => {
    productsGroups.push({
      amount: p.InvoiceQuantity[0],
      product: {
        id: p.LineNumber[0],
        barcode: p.EAN[0],
        category: null,
        name: p.SupplierItemCode[0],
        netPrice: convertDotPriceToPrice(
          p.InvoiceUnitNetPrice[0].replace(',', '.')
        ),
        unit: p.UnitOfMeasure[0],
        vat: p.TaxRate[0],
      },
    });
  });

  const invoiceHeader = data['Invoice-Header'][0];

  return {
    date: dayjs(invoiceHeader.SalesDate[0]).toDate(),
    documentNumber: invoiceHeader.InvoiceNumber[0],
    exhibitor,
    recipient,
    paymentDeadline: null,
    paymentWay: null,
    products: productsGroups,
    provider: InvoideProvider.medicaline,
  };
};
