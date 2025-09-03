export const formatPrice = (price: number) => {
  const firstPart = price.toString().slice(0, -2);
  const secondPart = price.toString().slice(-2).padStart(2, '0');

  if (firstPart === '') return '0,' + secondPart;
  if (firstPart === '0') return firstPart + ',' + secondPart;
  return firstPart + ',' + secondPart;
};
