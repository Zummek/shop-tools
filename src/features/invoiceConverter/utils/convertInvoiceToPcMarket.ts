import { Invoice, InvoideProvider } from '../types';

import { convertInternalInvoiceToPcMarket } from './convertInternalInvoiceToPcMarket';
import { readInvoiceFromBezGluten } from './readInvoiceFromBezGluten';
import { readInvoiceFromDary } from './readInvoiceFromDary';
import { readInvoiceFromMedicaline } from './readInvoiceFromMedicaline';
import { readInvoiceFromWiesiolek } from './readInvoiceFromWiesiolek';

export const convertInvoiceToPcMarket = async (
  file: File,
  provider: InvoideProvider
): Promise<string> => {
  let invoice: Invoice;

  if (provider === InvoideProvider.medicaline)
    invoice = await readInvoiceFromMedicaline(file);
  else if (provider === InvoideProvider.wiesiolek)
    invoice = await readInvoiceFromWiesiolek(file);
  else if (provider === InvoideProvider.bezGluten)
    invoice = await readInvoiceFromBezGluten(file);
  else if (provider === InvoideProvider.dary)
    invoice = await readInvoiceFromDary(file);
  else return 'Error';

  const x = await convertInternalInvoiceToPcMarket(invoice);

  return x;
};
