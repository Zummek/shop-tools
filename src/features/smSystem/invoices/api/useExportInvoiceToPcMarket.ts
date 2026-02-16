import dayjs from 'dayjs';
import latinize from 'latinize';

import { axiosInstance } from '../../../../services';

const getEndpoint = (id: number) => `/api/v1/invoices/${id}/export/pcmarket/`;

interface ExportInvoicePayload {
  id: number;
  sellerName: string;
  invoiceDate: string;
}

export const useExportInvoiceToPcMarket = () => {
  const exportInvoiceToPcMarket = async ({
    id,
    sellerName,
    invoiceDate,
  }: ExportInvoicePayload) => {
    const response = await axiosInstance.get(getEndpoint(id), {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const datePart = dayjs(invoiceDate).format('YYYY-MM-DD');
    const filename = latinize(`${sellerName}_${datePart}.txt`);
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return { exportInvoiceToPcMarket };
};
