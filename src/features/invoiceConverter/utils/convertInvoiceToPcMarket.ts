import { Invoice, InvoiceProvider } from '../types';

import { convertInternalInvoiceToPcMarket } from './convertInternalInvoiceToPcMarket';
import { readInvoiceFromBezGluten } from './readInvoiceFromBezGluten';
import { readInvoiceFromDary } from './readInvoiceFromDary';
import { readInvoiceFromMedicaline } from './readInvoiceFromMedicaline';
import { readInvoiceFromSzupex } from './readInvoiceFromSzupex';
import { readInvoiceFromWiesiolek } from './readInvoiceFromWiesiolek';

export const convertInvoiceToPcMarket = async (
  file: File,
  provider: InvoiceProvider
): Promise<string> => {
  let invoice: Invoice;

  if (provider === InvoiceProvider.medicaline)
    invoice = await readInvoiceFromMedicaline(file);
  else if (provider === InvoiceProvider.wiesiolek)
    invoice = await readInvoiceFromWiesiolek(file);
  else if (provider === InvoiceProvider.bezGluten)
    invoice = await readInvoiceFromBezGluten(file);
  else if (provider === InvoiceProvider.dary)
    invoice = await readInvoiceFromDary(file);
  else if (provider === InvoiceProvider.szupex)
    invoice = await readInvoiceFromSzupex(file);
  else return 'Error';

  const x = await convertInternalInvoiceToPcMarket(invoice);

  return x;
};
