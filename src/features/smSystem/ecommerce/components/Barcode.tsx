import JsBarcode from 'jsbarcode';
import { useEffect } from 'react';

interface Props {
  barcode: string;
}

export const Barcode = ({ barcode }: Props) => {
  const barcodeId = `ean-${barcode}`;

  const format = barcode.length <= 8 ? 'CODE128' : 'EAN13';
  useEffect(() => {
    JsBarcode(`#${barcodeId}`, barcode, {
      format,
      height: 20,
      width: 1.5,
      margin: 0,
    });
  }, [barcode, barcodeId, format]);

  return <svg id={barcodeId}></svg>;
};
