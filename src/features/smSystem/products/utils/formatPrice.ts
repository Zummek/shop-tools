export const formatPrice = (price: number | string, currency?: string) => {
  const priceNumber = Number(price);
  const firstPart = priceNumber.toString().slice(0, -2);
  const secondPart = priceNumber.toString().slice(-2).padStart(2, '0');

  if (firstPart === '')
    return '0,' + secondPart + (currency ? ' ' + currency : '');
  if (firstPart === '0')
    return firstPart + ',' + secondPart + (currency ? ' ' + currency : '');
  return firstPart + ',' + secondPart + (currency ? ' ' + currency : '');
};
