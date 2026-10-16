export type SalesEvidenceChannel = 'allegro' | 'erli' | 'woocommerce';

export type CodTreatment = 'on_register' | 'in_evidence';
export type ShippingVat = 'goods_rate' | 'always_23';
export type WstoMode = 'unset' | 'pl_vat' | 'oss';
export type ConsumerInvoiceTreatment = 'exclude' | 'include';

export interface RateBucket {
  rate: number;
  gross: number;
  net: number;
  vat: number;
  rows?: number;
}

export interface EvidenceTotals {
  gross: number;
  net: number;
  vat: number;
  negativeGross: number;
  negativeVat: number;
  paymentsCount: number;
  refundsCount: number;
  exclusionsCount: number;
  rowsCount: number;
}

export type ReviewKind =
  | 'similarity'
  | 'no_product'
  | 'missing_vat'
  | 'bundle_split'
  | 'amount_mismatch'
  | 'missing_date'
  | 'missing_fx'
  | 'missing_country'
  | 'wsto_unset'
  | 'export'
  | 'refund_without_order'
  | 'refund_original_not_issued'
  | 'refund_currency'
  | 'refund_exceeds'
  | 'returned_without_refund'
  | 'invoice_buyer_unknown';

export interface BundleComponent {
  productId: number;
  name: string;
  vat: number;
}

export interface ReviewItem {
  key: string;
  kind: ReviewKind;
  orderId: number | null;
  orderExternalId: string;
  title: string;
  detail: string;
  itemId?: number;
  productId?: number;
  productName?: string;
  externalName?: string;
  offerId?: string;
  offerName?: string;
  components?: BundleComponent[];
  suggestedShares?: Record<string, string>;
  itemsTotal?: number;
  paidTotal?: number;
  currency?: string;
  missing?: 'payment' | 'shipment';
  country?: string;
  refundId?: number;
  day?: string;
  amount?: number;
}

export type SideReason =
  | 'cod'
  | 'receipt'
  | 'before_evidence'
  | 'invoice'
  | 'oss'
  | 'export'
  | 'already_issued';

export interface SideEntry {
  kind: 'payment' | 'refund';
  orderId: number;
  orderExternalId: string;
  reason: SideReason;
  date: string | null;
  amount: number;
  currency: string;
  country: string;
  invoiceNumber: string;
  documentNumber?: string;
}

export interface EvidenceBlocker {
  code:
    | 'company_incomplete'
    | 'exemption_not_confirmed'
    | 'period_not_ended'
    | 'overlap'
    | 'review_not_empty'
    | 'invalid_period';
  message: string;
  missingFields?: string[];
  documentId?: number;
  documentNumber?: string;
}

export interface SettingsSnapshot {
  codTreatment: CodTreatment;
  shippingVat: ShippingVat;
  wstoMode: WstoMode;
  consumerInvoiceTreatment?: ConsumerInvoiceTreatment;
  labels: {
    codTreatment: string;
    shippingVat: string;
    wstoMode: string;
    consumerInvoiceTreatment: string;
  };
}

export interface WstoYearToDate {
  netPln: number;
  netEur: number | null;
  thresholdEur: number;
  warning: boolean;
  ordersMissingRate: number;
}

export interface MonthDocument {
  id: number;
  number: string;
  periodFrom: string;
  periodTo: string;
  status: DocumentStatus;
}

export interface DayWithoutDocument {
  channel: SalesEvidenceChannel;
  day: string;
  orders: number;
}

export interface SalesEvidencePreview {
  channel: SalesEvidenceChannel;
  channelLabel: string;
  periodFrom: string;
  periodTo: string;
  periodEnded: boolean;
  totalsByRate: RateBucket[];
  totals: EvidenceTotals;
  review: ReviewItem[];
  onRegister: SideEntry[];
  outside: SideEntry[];
  hasWstoRows: boolean;
  hasOssRows: boolean;
  wsto: WstoYearToDate | null;
  settings: SettingsSnapshot;
  blockers: EvidenceBlocker[];
  canIssue: boolean;
  canManage: boolean;
  dataAsOf: string | null;
  uncoveredDays: string[];
  monthDocuments: MonthDocument[];
  monthDaysWithoutDocument: DayWithoutDocument[];
}

export type DocumentStatus = 'issued' | 'handed_over' | 'cancelled';

export interface SalesEvidenceDocument {
  id: number;
  number: string;
  kind: 'evidence' | 'correction';
  channel: SalesEvidenceChannel;
  channelLabel: string;
  periodFrom: string;
  periodTo: string;
  status: DocumentStatus;
  statusLabel: string;
  totalsByRate: RateBucket[];
  totals: Partial<EvidenceTotals>;
  correctsId: number | null;
  correctsNumber: string | null;
  reason: string;
  sha256: string;
  engineVersion: string;
  settings: SettingsSnapshot;
  dataAsOf: string | null;
  issuedAt: string | null;
  issuedByName: string | null;
  handedOverAt: string | null;
  handedOverByName: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancelReason: string;
  onRegisterCount: number;
  outsideCount: number;
  pdfName: string;
  xlsxName: string;
}

export interface EvidenceRow {
  kind: string;
  orderExternalId: string;
  obligationDate: string;
  rate: number;
  gross: number;
  vat: number;
  goods: string;
}

export interface RecheckResult {
  hasChanges: boolean;
  changed: { before: EvidenceRow | null; after: EvidenceRow | null }[];
  beforeTotals: RateBucket[];
  afterTotals: RateBucket[];
  diffTotals: RateBucket[];
  review: ReviewItem[];
  nextStep: 'correction' | 'cancel_and_reissue' | null;
  hint: string;
}

export interface CompanyData {
  legalName: string;
  nip: string;
  street: string;
  postalCode: string;
  city: string;
  countryCode: string;
  name: string;
  isComplete: boolean;
  missingFields: string[];
  ksefNipHint: string | null;
  canManage: boolean;
}

export interface MethodChange {
  field:
    | 'cod_treatment'
    | 'shipping_vat'
    | 'wsto_mode'
    | 'consumer_invoice_treatment';
  from: string;
  to: string;
  at: string;
  by: string;
}

export interface AccountingSettings {
  codTreatment: CodTreatment;
  shippingVat: ShippingVat;
  wstoMode: WstoMode;
  consumerInvoiceTreatment: ConsumerInvoiceTreatment;
  wooNipMetaKeys: string[];
  registerExemptionConfirmed: boolean;
  registerExemptionConfirmedByName: string | null;
  registerExemptionConfirmedAt: string | null;
  methodChanges: MethodChange[];
  updatedAt: string;
  hasDocumentsThisYear: boolean;
  canManage: boolean;
  warnings: string[];
}

export interface SyncRun {
  id: number;
  status: 'queued' | 'running' | 'done' | 'failed';
  channel: SalesEvidenceChannel;
  channelLabel: string;
  periodFrom: string;
  periodTo: string;
  error: string;
  result: { orders?: number; refunds?: number; ok?: boolean };
  startedAt: string | null;
  finishedAt: string | null;
}

export interface OrderEvidenceStatus {
  orderId: number;
  channelSupported: boolean;
  marks: {
    fiscalReceiptIssued: boolean;
    fiscalReceiptMarkedBy: string | null;
    fiscalReceiptMarkedAt: string | null;
    invoiceRequired: boolean;
    invoiceIssuedManually: boolean;
    invoiceNumber: string;
    invoiceMarkedBy: string | null;
    invoiceMarkedAt: string | null;
    invoiceNotIssued: boolean;
    invoiceNotIssuedMarkedBy: string | null;
    invoiceNotIssuedMarkedAt: string | null;
    buyerTaxId: string | null;
  };
  consumerInvoicesInEvidence: boolean;
  documents: {
    id: number;
    number: string;
    status: DocumentStatus;
    kind: string;
  }[];
  channel: SalesEvidenceChannel | string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveryCountryCode: string | null;
  canViewEvidence: boolean;
  evaluation?: {
    status: 'register' | 'outside' | 'rows' | 'review' | 'undated';
    reason: string;
    day: string | null;
    review: ReviewItem[];
    text: string;
  };
}
