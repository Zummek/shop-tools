/** Same base as backend margin %: revenue + buyer delivery. */
export const shareOfMarginBasePercent = (
  amountCents: number,
  revenueCents: number,
  buyerDeliveryCents: number,
): number | null => {
  const denom = revenueCents + buyerDeliveryCents;
  if (denom <= 0) return null;
  return (100 * amountCents) / denom;
};

export const formatSharePercent = (percent: number | null) =>
  percent == null ? '—' : `${percent.toFixed(1)}%`;

export const SHARE_PERCENT_DESCRIPTION =
  'Szary % pod kwotą = udział względem (przychód + dostawa od klienta), jak przy marży %.';
