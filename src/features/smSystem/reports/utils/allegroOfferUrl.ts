export const allegroOfferUrl = (
  offerId: string,
  marketplace?: string | null,
) => {
  if (marketplace?.includes('cz'))
    return `https://allegro.cz/oferta/${offerId}`;
  if (marketplace?.includes('sk'))
    return `https://allegro.sk/oferta/${offerId}`;
  if (marketplace?.includes('hu'))
    return `https://allegro.hu/oferta/${offerId}`;
  return `https://allegro.pl/oferta/${offerId}`;
};

export const allegroOfferHref = (
  externalUrl: string | null | undefined,
  offerId: string,
  marketplace?: string | null,
) => externalUrl || (offerId ? allegroOfferUrl(offerId, marketplace) : null);
