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
  const {
    documentNumber = '',
    date = null,
    paymentWay = '',
    paymentDeadline = null,
    exhibitor = null,
    recipient = null,
    products,
  } = invoice;

  const formattedDate = date ? dayjs(date).format('DD.MM.YYYY') : '';
  const paymentDays =
    paymentDeadline && date ? dayjs(paymentDeadline).diff(date, 'days') : '';
  const exhibitorName = exhibitor?.name || '';
  const exhibitorNip = exhibitor ? formatNip(exhibitor.nip) : '';
  const recipientName = recipient?.name || '';
  const recipientNip = recipient ? formatNip(recipient.nip) : '';

  let fileContent = `TypPolskichLiter:LA
TypDok:FW
NrDok:${documentNumber}
Data:${formattedDate}
SposobPlatn:${paymentWay}
TerminPlatn:${paymentDays}
NazwaWystawcy:${exhibitorName}
NIPWystawcy:${exhibitorNip}
NazwaOdbiorcy:${recipientName}
NIPOdbiorcy:${recipientNip}
IloscLini:${products.length}\n`;

  invoice.products.forEach((pg) => {
    const price = convertPriceToDotPrice(pg.product.netPrice);
    const value = (parseFloat(price) * pg.amount).toFixed(2);

    fileContent += `Linia:Nazwa{${pg.product.name}}Kod{${
      pg.product.barcode ?? ''
    }}Vat{${pg.product.vat ?? ''}}Jm{${pg.product.unit ?? ''}}Asortyment{${
      pg.product.category ?? ''
    }}Sww{}PKWiU{}Ilosc{${pg.amount}}Cena{n${convertPriceToDotPrice(
      pg.product.netPrice ?? ''
    )}}Wartosc{n${value}}CenaSp{}\n`;
  });

  return fileContent;
};
