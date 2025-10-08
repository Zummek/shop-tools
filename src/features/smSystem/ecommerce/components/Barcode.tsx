import JsBarcode from 'jsbarcode';
import { useEffect } from 'react';

interface Props {
  barcode: string;
}

export const Barcode = ({ barcode }: Props) => {
  const barcodeId = `ean-${barcode}`;

  useEffect(() => {
    JsBarcode(`#${barcodeId}`, barcode, {
      format: 'EAN13',
      height: 20,
      width: 1.5,
    });
  }, [barcode, barcodeId]);

  return <svg id={barcodeId}></svg>;
};
