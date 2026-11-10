export const formatPrice = (price: number | string, currency?: string) => {
  const cents = Number(price);
  if (!Number.isFinite(cents)) return currency ? `0,00 ${currency}` : '0,00';

  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(cents));
  const whole = Math.floor(abs / 100);
  const part = String(abs % 100).padStart(2, '0');
  const amount = `${sign}${whole},${part}`;
  return currency ? `${amount} ${currency}` : amount;
};
