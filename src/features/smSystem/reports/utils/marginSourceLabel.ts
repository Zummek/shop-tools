export const marginSourceLabel = (source: string) => {
  const map: Record<string, string> = {
    order_line: 'cena z zamówienia',
    pcmarket_line: 'cena z paragonu PC-Market (PozDok.Cena)',
    ksef_last_purchase: 'ostatnia przyjęta FV KSeF',
    invoice_as_of: 'FV przyjęta na dzień sprzedaży',
    invoice_line: 'FV (data faktury, pozycja nieprzyjęta)',
    allegro_billing_suc: 'billing Allegro (prowizja SUC)',
    allegro_billing_smart: 'billing Allegro (Smart HB*)',
    allegro_billing_other: 'billing Allegro (inne opłaty)',
    delivery_group_estimate: 'szacunek z grupy dostawy',
    erli_fee_config: 'konfiguracja % Erli',
    woo_fee_config: 'konfiguracja % Woo / dostawa',
    buyer_delivery: 'dostawa zapłacona przez kupującego',
    nbp_table_a: 'kurs średni NBP tabela A (szacunek ± vs wypłata Allegro)',
    missing: 'brak danych',
    derived: 'wyliczone',
  };
  return map[source] ?? source;
};
