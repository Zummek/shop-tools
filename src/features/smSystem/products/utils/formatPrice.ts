export const formatPrice = (price: number) => {
  const firstPart = price.toString().slice(0, -2);
  const secondPart = price.toString().slice(-2).padStart(2, '0');

  if (secondPart === '00') {
    if (firstPart === '' || firstPart === '0') return '0';
    return firstPart;
  }

  if (firstPart === '') return '0,' + secondPart;
  if (firstPart === '0') return firstPart + ',' + secondPart;
  return firstPart + ',' + secondPart;
};

export const calcGrossPrice = (
  netPrice: number | null | undefined,
  vat: number | null | undefined
): number | null => {
  if (netPrice == null || vat == null) return null;
  if (netPrice < 0 || vat < 0) return null;

  const grossPrice = netPrice * (1 + vat / 100);
  return Math.round(grossPrice);
};
