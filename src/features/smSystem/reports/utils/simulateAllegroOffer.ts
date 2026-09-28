import type { AllegroPriceSimRow } from '../api/useGetAllegroPriceSim';
import type {
  MarginCalculation,
  MarginComponent,
} from '../api/useGetChannelMarginReport';

export const toCents = (pln: number): number => {
  const scaled = pln * 100;
  if (scaled >= 0) return Math.floor(scaled + 0.5);
  return Math.ceil(scaled - 0.5);
};

export interface AllegroOfferSim {
  priceNetCents: number;
  costCommissionCents: number;
  costShippingCents: number;
  costPromoCents: number;
  marginCents: number;
  marginPercent: number | null;
  markupOnCost: number | null;
  status: AllegroPriceSimRow['status'];
}

const computeCommissionPln = (
  priceGross: number,
  buyerDelivery: number,
  rateNet: number,
  minNet: number,
  capNet: number | null,
): number => {
  let raw = rateNet * (priceGross + buyerDelivery);
  if (raw < minNet) raw = minNet;
  if (capNet != null && raw > capNet) raw = capNet;
  return raw;
};

export const simulateAllegroOffer = (
  row: AllegroPriceSimRow,
  priceGrossCents: number,
  options: {
    buyerDeliveryCents: number;
    shippingRate: number;
    targetMargin: number;
  },
): AllegroOfferSim | null => {
  if (
    priceGrossCents <= 0 ||
    row.purchaseNetCents == null ||
    row.vatRate == null
  ) {
    return {
      priceNetCents: 0,
      costCommissionCents: 0,
      costShippingCents: 0,
      costPromoCents: 0,
      marginCents: 0,
      marginPercent: null,
      markupOnCost: null,
      status: 'missing',
    };
  }

  const priceGross = priceGrossCents / 100;
  const purchaseNet = row.purchaseNetCents / 100;
  const buyerDelivery = options.buyerDeliveryCents / 100;
  const vatFrac = row.vatRate / 100;
  const priceNet = priceGross / (1 + vatFrac);
  const costCommission = computeCommissionPln(
    priceGross,
    buyerDelivery,
    row.commissionRateNet,
    row.commissionMinNet,
    row.commissionCapNet,
  );
  const shippingFixed =
    row.shippingFixedCents != null ? row.shippingFixedCents / 100 : null;
  const costShipping =
    shippingFixed != null ? shippingFixed : priceNet * options.shippingRate;
  const margin = priceNet - costCommission - costShipping - purchaseNet;
  const marginPercent = priceNet ? margin / priceNet : null;
  const markup = purchaseNet ? margin / purchaseNet : null;

  let status: AllegroPriceSimRow['status'] = 'ok';
  if (margin < 0) status = 'loss';
  else if (marginPercent == null || marginPercent < options.targetMargin)
    status = 'thin';

  return {
    priceNetCents: toCents(priceNet),
    costCommissionCents: toCents(costCommission),
    costShippingCents: toCents(costShipping),
    costPromoCents: 0,
    marginCents: toCents(margin),
    marginPercent: marginPercent == null ? null : marginPercent * 100,
    markupOnCost: markup == null ? null : markup * 100,
    status,
  };
};

export const buildOfferCalculation = (
  row: AllegroPriceSimRow,
  sim: AllegroOfferSim,
  priceGrossCents: number,
  buyerDeliveryCents: number,
): MarginCalculation => {
  const vatCents =
    priceGrossCents && sim.priceNetCents
      ? priceGrossCents - sim.priceNetCents
      : 0;
  const components: MarginComponent[] = [
    {
      key: 'price_gross',
      label: 'Cena brutto',
      amountCents: priceGrossCents,
      source: 'offer',
    },
    {
      key: 'buyer_delivery',
      label: 'Dostawa kupującego (baza prowizji)',
      amountCents: buyerDeliveryCents,
      source: row.buyerDeliverySource || 'fallback',
    },
    {
      key: 'vat',
      label: `VAT ${row.vatRate ?? '—'}%`,
      amountCents: -vatCents,
      source: 'product',
    },
    {
      key: 'price_net',
      label: 'Przychód netto',
      amountCents: sim.priceNetCents,
      source: 'derived',
    },
    {
      key: 'commission',
      label: `Prowizja Allegro ${(row.commissionRateNet * 100).toFixed(2)}% netto`,
      amountCents: -sim.costCommissionCents,
      source: row.commissionSource,
    },
    {
      key: 'seller_shipping',
      label: 'Wysyłka sprzedawcy',
      amountCents: -sim.costShippingCents,
      source: row.costShippingSource,
    },
    {
      key: 'purchase',
      label: 'Zakup netto',
      amountCents: -(row.purchaseNetCents ?? 0),
      source: row.cogsSource,
    },
  ];
  components.push({
    key: 'margin',
    label: 'Marża',
    amountCents: sim.marginCents,
    source: 'derived',
  });
  if (sim.marginPercent != null) {
    components.push({
      key: 'margin_percent',
      label: 'Marża %',
      amountCents: 0,
      source: 'derived',
      displayText: `${sim.marginPercent.toFixed(1)}%`,
    });
  }
  return {
    formula: 'przychód netto − prowizja − wysyłka sprzedawcy − zakup',
    components,
    notes: [
      'Prowizja: stawka netto z ID kategorii × (cena brutto + dostawa kupującego).',
      'Dostawa kupującego: średnia z zamówień Allegro oferty (180 dni); pole z paska tylko gdy brak zamówień.',
      'VAT produktu z karty. CIT nie jest odejmowany.',
      'Marża % = marża / przychód netto oferty.',
    ],
  };
};

export const parseGrossPlnInput = (value: string): number | null => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return toCents(parsed);
};
