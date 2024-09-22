import dayjs from 'dayjs';

import { Invoice } from '../types';

// output '###-###-##-##'
const formatNip = (nip: string): string => {
  return `${nip.slice(0, 3)}-${nip.slice(3, 6)}-${nip.slice(6, 8)}-${nip.slice(8, 10)}`;
};

export const convertDotPriceToPrice = (price: string) =>
  Number(price).toFixed(2).replace(/[.,]/, '');

const convertPriceToDotPrice = (price: string) => {
  const len = price.length;

  return price.substring(0, len - 2) + '.' + price.substring(len - 2);
};

export const convertInternalInvoiceToPcMarket = async (
  invoice: Invoice
): Promise<string> => {
  let fileContent = `TypPolskichLiter:LA
TypDok:FW
NrDok:${invoice.documentNumber !== null ? invoice.documentNumber : null}
Data:${invoice.date !== null ? dayjs(invoice.date).format('DD.MM.YYYY') : null}
SposobPlatn:${invoice.paymentWay !== null ? invoice.paymentWay : null}
TerminPlatn:${
    invoice.paymentDeadline !== null && invoice.date !== null
      ? dayjs(invoice.paymentDeadline).diff(invoice.date, 'days')
      : null
  }
NazwaWystawcy:${invoice.exhibitor !== null ? invoice.exhibitor.name : null}
NIPWystawcy:${invoice.exhibitor !== null ? formatNip(invoice.exhibitor.nip) : null}
NazwaOdbiorcy:${invoice.recipient !== null ? invoice.recipient.name : null}
NIPOdbiorcy:${invoice.recipient !== null ? formatNip(invoice.recipient.nip) : null}
IloscLini:${invoice.products.length}\n`;

  invoice.products.forEach((pg) => {
    const price = convertPriceToDotPrice(pg.product.netPrice);
    const value = (parseFloat(price) * pg.amount).toFixed(2);

    fileContent += `Linia:Nazwa{${pg.product.name}}Kod{${pg.product.barcode}}Vat{${
      pg.product.vat
    }}Jm{${pg.product.unit}}Asortyment{${
      pg.product.category || ''
    }}Sww{}PKWiU{}Ilosc{${pg.amount}}Cena{n${convertPriceToDotPrice(
      pg.product.netPrice
    )}}Wartosc{n${value}}CenaSp{}\n`;
  });

  return fileContent;
};
