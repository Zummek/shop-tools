import { InvoiceProvider } from '../types';

export const detectInvoiceProvider = async (
  file: File
): Promise<InvoiceProvider | null> => {
  const fileText = await file.text();
  const fileType = file.type;

  if (fileType === 'text/csv') return InvoiceProvider.bezGluten;
  if (fileText.includes('544-112-43-37')) return InvoiceProvider.dary;
  if (fileText.includes('9482624487')) return InvoiceProvider.wiesiolek;
  if (fileText.includes('5322116337') || fileText.includes('5321690962'))
    return InvoiceProvider.medicaline;
  if (fileText.includes('553-10-10-123')) return InvoiceProvider.szupex;
  if (fileText.includes('754-302-22-22')) return InvoiceProvider.sfd;
  if (fileText.includes('5170422903')) return InvoiceProvider.sylveco;

  return null;
};
