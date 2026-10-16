import type {
  CodTreatment,
  ConsumerInvoiceTreatment,
  ShippingVat,
  WstoMode,
} from '../types';

export interface OptionText<T extends string> {
  value: T;
  label: string;
  description: string;
}

export const COMPANY_FIELD_LABELS: Record<string, string> = {
  legal_name: 'pełna nazwa',
  nip: 'NIP',
  street: 'ulica i numer',
  postal_code: 'kod pocztowy',
  city: 'miejscowość',
};

export const COD_OPTIONS: OptionText<CodTreatment>[] = [
  {
    value: 'on_register',
    label: 'Na kasie (domyślnie)',
    description:
      'Przy pobraniu kupujący płaci kurierowi, a Ty nabijasz paragon na kasie fiskalnej. Takie zamówienia SM pokazuje tylko do wglądu w arkuszu „Na kasie” – nie liczą się do dowodu, żeby VAT nie wyszedł dwa razy.',
  },
  {
    value: 'in_evidence',
    label: 'W dowodzie',
    description:
      'Tylko gdy księgowa potwierdzi, że pobrania są zwolnione z kasy (pieniądze trafiają na Twój rachunek przez operatora pocztowego, a z ewidencji wynika, za co). Pobrania wejdą wtedy do dowodu z datą nadania paczki.',
  },
];

export const SHIPPING_OPTIONS: OptionText<ShippingVat>[] = [
  {
    value: 'goods_rate',
    label: 'Stawka wysyłanego towaru (domyślnie)',
    description:
      'Dostawa dostaje stawkę towaru z paczki – przy samych książkach 5%, przy kosmetykach 23%. Gdy w paczce są różne stawki, koszt dostawy dzielimy proporcjonalnie do wartości towarów.',
  },
  {
    value: 'always_23',
    label: 'Zawsze 23%',
    description:
      'Dostawa zawsze z VAT 23%, bez względu na towar. Wybierz, jeśli tak zaleca księgowa.',
  },
];

export const WSTO_OPTIONS: OptionText<WstoMode>[] = [
  {
    value: 'unset',
    label: 'Nie wybrano (domyślnie)',
    description:
      'Zamówienia z dostawą do innego kraju UE zatrzymają wystawienie dowodu, dopóki nie wybierzesz jednej z opcji poniżej. Jeśli nie wiesz, którą – zapytaj księgową.',
  },
  {
    value: 'pl_vat',
    label: 'Polski VAT (poniżej progu 10 000 EUR)',
    description:
      'Gdy łączna sprzedaż do konsumentów z innych krajów UE nie przekracza 10 000 EUR netto w roku, rozliczasz ją polskim VAT. Takie zamówienia wejdą do dowodu z polskimi stawkami, a w wykazie widać kraj dostawy.',
  },
  {
    value: 'oss',
    label: 'Procedura OSS',
    description:
      'Firma jest zarejestrowana w VAT OSS i płaci VAT kraju kupującego w osobnej deklaracji. Takie zamówienia SM pokaże w arkuszu „Poza dowodem”, żeby księgowa ujęła je w OSS.',
  },
];

export const CONSUMER_INVOICE_OPTIONS: OptionText<ConsumerInvoiceTreatment>[] =
  [
    {
      value: 'exclude',
      label: 'Poza dowodem, jak każda faktura (domyślnie)',
      description:
        'Każde zamówienie z fakturą – z NIP i bez – trafia do arkusza „Poza dowodem”. Księgowa wykazuje te faktury w JPK osobno. To bezpieczny wybór, gdy nie wiesz, jak księgowa rozlicza faktury dla osób prywatnych.',
    },
    {
      value: 'include',
      label: 'W dowodzie – poza dowodem tylko faktury z NIP',
      description:
        'Faktura dla osoby prywatnej (bez NIP) zostaje w dowodzie, z uwagą „faktura bez NIP” i numerem faktury. Wybierz tylko wtedy, gdy księgowa potwierdzi, że nie wykazuje tych faktur w JPK osobno – inaczej VAT policzy się dwa razy. NIP SM bierze z danych kanału. Gdy go nie zna, zamówienie trafi do „Do wyjaśnienia”. Po zmianie kliknij „Dociągnij dane za okres”, żeby SM pobrał NIP-y do starszych zamówień.',
    },
  ];

export const METHOD_FIELD_LABELS: Record<string, string> = {
  cod_treatment: 'Pobrania',
  shipping_vat: 'Stawka dostawy',
  wsto_mode: 'Sprzedaż do innych krajów UE',
  consumer_invoice_treatment: 'Faktury bez NIP',
};

const allOptions = [
  ...COD_OPTIONS,
  ...SHIPPING_OPTIONS,
  ...WSTO_OPTIONS,
  ...CONSUMER_INVOICE_OPTIONS,
];

export const optionLabel = (value: string): string =>
  allOptions.find((option) => option.value === value)?.label ?? value;
