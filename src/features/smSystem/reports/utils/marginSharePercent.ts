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

/** Row margin divided by sold units, rounded to a grosz. Null when there are no units. */
export const averageMarginPerUnitCents = (
  marginCents: number,
  units: number,
): number | null => {
  if (!Number.isFinite(marginCents) || !Number.isFinite(units) || units <= 0)
    return null;
  const perUnit = marginCents / units;
  const sign = perUnit < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(perUnit));
};

export const SHARE_PERCENT_DESCRIPTION =
  'Szary % pod kwotą = udział względem (przychód + dostawa od klienta), jak przy marży %.';
