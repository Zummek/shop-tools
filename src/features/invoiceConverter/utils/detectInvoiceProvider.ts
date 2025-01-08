import { InvoideProvider } from '../types';

export const detectInvoiceProvider = async (
  file: File
): Promise<InvoideProvider | null> => {
  const fileText = await file.text();
  const fileType = file.type;

  if (fileType === 'text/csv') return InvoideProvider.bezGluten;
  if (fileText.includes('544-112-43-37')) return InvoideProvider.dary;
  if (fileText.includes('9482624487')) return InvoideProvider.wiesiolek;
  if (fileText.includes('5322116337') || fileText.includes('5321690962'))
    return InvoideProvider.medicaline;

  return null;
};
