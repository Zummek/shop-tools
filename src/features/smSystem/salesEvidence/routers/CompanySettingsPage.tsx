import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ReactNode, useState } from 'react';

import { Pages } from '../../../../utils';
import {
  useAccountingSettings,
  useCompanyData,
  useSaveAccountingSettings,
  useSaveCompanyData,
} from '../api';
import {
  COD_OPTIONS,
  COMPANY_FIELD_LABELS,
  CONSUMER_INVOICE_OPTIONS,
  METHOD_FIELD_LABELS,
  OptionText,
  SHIPPING_OPTIONS,
  WSTO_OPTIONS,
  optionLabel,
} from '../components/settingsTexts';
import type { AccountingSettings, CompanyData } from '../types';
import { formatMoment } from '../utils/format';

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Stack>
  </Paper>
);

const companyFields: {
  name: keyof CompanyData & string;
  apiName: string;
  label: string;
  helper: string;
}[] = [
  {
    name: 'legalName',
    apiName: 'legal_name',
    label: 'Pełna nazwa firmy',
    helper: 'Tak jak w CEIDG lub KRS, np. „Jan Kowalski Sklep Zdrowie”.',
  },
  {
    name: 'nip',
    apiName: 'nip',
    label: 'NIP',
    helper: '10 cyfr, możesz wpisać z kreskami.',
  },
  {
    name: 'street',
    apiName: 'street',
    label: 'Ulica i numer',
    helper: 'Adres siedziby z rejestru.',
  },
  {
    name: 'postalCode',
    apiName: 'postal_code',
    label: 'Kod pocztowy',
    helper: 'np. 00-001',
  },
  { name: 'city', apiName: 'city', label: 'Miejscowość', helper: '' },
];

const CompanyForm = ({ company }: { company: CompanyData }) => {
  const { save, isPending } = useSaveCompanyData();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      companyFields.map((field) => [
        field.name,
        String(company[field.name] ?? ''),
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const readOnly = !company.canManage;

  const submit = async () => {
    const result = await save(values);
    setErrors(result.errors);
    if (result.data) {
      setValues(
        Object.fromEntries(
          companyFields.map((field) => [
            field.name,
            String(result.data?.[field.name] ?? ''),
          ]),
        ),
      );
    }
  };

  return (
    <Section
      title="Dane firmy"
      description="Te dane drukujemy w nagłówku każdego dowodu sprzedaży. Bez pełnej nazwy, NIP i adresu dowodu nie da się wystawić."
    >
      {company.missingFields.length > 0 ? (
        <Alert severity="warning">
          {`Uzupełnij: ${company.missingFields
            .map((field) => COMPANY_FIELD_LABELS[field] ?? field)
            .join(', ')}. Do tego czasu dowodu nie wystawisz.`}
        </Alert>
      ) : null}
      {company.ksefNipHint && !readOnly ? (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  nip: company.ksefNipHint ?? '',
                }))
              }
            >
              {'Wstaw ten NIP'}
            </Button>
          }
        >
          {`W połączeniu z KSeF zapisany jest NIP ${company.ksefNipHint}. Sprawdź, czy to NIP tej firmy.`}
        </Alert>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        {companyFields.map((field) => (
          <TextField
            key={field.name}
            size="small"
            label={field.label}
            value={values[field.name]}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                [field.name]: event.target.value,
              }))
            }
            error={!!errors[field.name]}
            helperText={errors[field.name] || field.helper}
            disabled={readOnly}
            required
          />
        ))}
      </Box>
      {readOnly ? null : (
        <Box>
          <LoadingButton
            variant="contained"
            loading={isPending}
            onClick={submit}
          >
            {'Zapisz dane firmy'}
          </LoadingButton>
        </Box>
      )}
    </Section>
  );
};

const ExemptionSection = ({ settings }: { settings: AccountingSettings }) => {
  const { save, isPending } = useSaveAccountingSettings();
  const confirmed = settings.registerExemptionConfirmed;

  return (
    <Section
      title="Oświadczenie o zwolnieniu z kasy fiskalnej"
      description="Dowód sprzedaży bezrachunkowej zastępuje paragony tylko wtedy, gdy ta sprzedaż jest zwolniona z kasy – zwykle sprzedaż wysyłkowa, w której cała zapłata wpływa na rachunek firmy (także przez Allegro, Przelewy24, PayU) i z ewidencji wynika, za co zapłacono. Czy Twoja firma spełnia warunki, ustal z księgową – SM tego nie oceni."
    >
      <FormControlLabel
        disabled={!settings.canManage || isPending}
        control={
          <Checkbox
            checked={confirmed}
            onChange={(event) =>
              save({ registerExemptionConfirmed: event.target.checked })
            }
          />
        }
        label="Sprzedaż ujmowana w tych dowodach korzysta ze zwolnienia z obowiązku ewidencji na kasie rejestrującej."
      />
      {confirmed ? (
        <Typography variant="body2" color="text.secondary">
          {`Potwierdził(a): ${settings.registerExemptionConfirmedByName ?? '—'}, ${formatMoment(settings.registerExemptionConfirmedAt)}. To potwierdzenie widać na każdym dowodzie.`}
        </Typography>
      ) : (
        <Alert severity="warning">
          {
            'Bez tego oświadczenia nie wystawisz żadnego dowodu. Zamówień, za które nabijasz paragon na kasie, nie ujmuj w dowodzie – oznacz je w szczegółach zamówienia jako „paragon wystawiony na kasie”.'
          }
        </Alert>
      )}
    </Section>
  );
};

const OptionGroup = <T extends string>({
  title,
  intro,
  options,
  value,
  onChange,
  disabled,
}: {
  title: string;
  intro: string;
  options: OptionText<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
}) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      {intro}
    </Typography>
    <RadioGroup
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          disabled={disabled}
          control={<Radio size="small" />}
          sx={{ alignItems: 'flex-start', mb: 1 }}
          label={
            <Box sx={{ pt: 0.75 }}>
              <Typography variant="body2" fontWeight={500}>
                {option.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.description}
              </Typography>
            </Box>
          }
        />
      ))}
    </RadioGroup>
  </Box>
);

const SettingsForm = ({
  settings,
  warnings,
  onWarnings,
}: {
  settings: AccountingSettings;
  warnings: string[];
  onWarnings: (warnings: string[]) => void;
}) => {
  const { save, isPending } = useSaveAccountingSettings();
  const [codTreatment, setCodTreatment] = useState(settings.codTreatment);
  const [shippingVat, setShippingVat] = useState(settings.shippingVat);
  const [wstoMode, setWstoMode] = useState(settings.wstoMode);
  const [consumerInvoices, setConsumerInvoices] = useState(
    settings.consumerInvoiceTreatment,
  );
  const [wooKeys, setWooKeys] = useState<string[]>(settings.wooNipMetaKeys);
  const readOnly = !settings.canManage;

  const methodChanged =
    codTreatment !== settings.codTreatment ||
    shippingVat !== settings.shippingVat ||
    wstoMode !== settings.wstoMode ||
    consumerInvoices !== settings.consumerInvoiceTreatment;
  const keysChanged = wooKeys.join('|') !== settings.wooNipMetaKeys.join('|');

  const submit = async () => {
    const result = await save({
      codTreatment,
      shippingVat,
      wstoMode,
      consumerInvoiceTreatment: consumerInvoices,
      wooNipMetaKeys: wooKeys,
    });
    onWarnings(result.data?.warnings ?? []);
  };

  return (
    <Section
      title="Ustawienia rozliczeń"
      description="Od tych ustawień zależy, które zamówienia wchodzą do dowodu i z jaką stawką VAT. Ustal je raz z księgową. Każdy dowód zapamiętuje ustawienia, z którymi powstał – późniejsza zmiana nie zmienia już wystawionych dowodów."
    >
      <OptionGroup
        title="Zamówienia za pobraniem"
        intro="Kupujący płaci przy odbiorze paczki."
        options={COD_OPTIONS}
        value={codTreatment}
        onChange={setCodTreatment}
        disabled={readOnly}
      />
      <OptionGroup
        title="Stawka VAT od dostawy"
        intro="Jaki VAT ma kwota, którą kupujący płaci za wysyłkę."
        options={SHIPPING_OPTIONS}
        value={shippingVat}
        onChange={setShippingVat}
        disabled={readOnly}
      />
      <OptionGroup
        title="Sprzedaż do konsumentów w innych krajach UE"
        intro="Kraj ustalamy z adresu dostawy, nie z waluty ani z wersji Allegro. Klient z allegro.cz z dostawą do Polski to zwykła sprzedaż krajowa."
        options={WSTO_OPTIONS}
        value={wstoMode}
        onChange={setWstoMode}
        disabled={readOnly}
      />
      <OptionGroup
        title="Faktury dla osób prywatnych (bez NIP)"
        intro="Faktura z NIP (na firmę) nigdy nie wchodzi do dowodu – księgowa rozlicza ją jako fakturę. Tu wybierasz, co z fakturą dla kupującego bez NIP. Zapytaj księgową, jak ją rozlicza."
        options={CONSUMER_INVOICE_OPTIONS}
        value={consumerInvoices}
        onChange={setConsumerInvoices}
        disabled={readOnly}
      />

      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {'Pola faktury w WooCommerce'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {
            'WooCommerce nie ma standardowych pól „chcę fakturę” i „NIP” – dodaje je motyw albo wtyczka sklepu, każda pod inną nazwą. Wpisz nazwy tych pól z danych zamówienia (meta_data). Pole z NIP-em, gdy jest wypełnione, oznacza fakturę na firmę. Pole „chcę fakturę” z wartością „1” albo „tak” przy pustym NIP-ie oznacza fakturę dla osoby prywatnej. Wartość „0”, pusta albo brak pola – zamówienie bez faktury.'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {
            'Pola kasy dodane przez motyw (WooCommerce 8.6+) mają nazwę z przedrostkiem _wc_other/, np. _wc_other/zdrowie/want_vat_invoice i _wc_other/zdrowie/nip. Wpisz oba: checkbox i NIP. Jeśli wpiszesz tylko checkbox, a kupujący poda nazwę firmy, SM nie zgadnie, czy faktura jest z NIP – potraktuje ją jak fakturę na firmę, a przy fakturach bez NIP w dowodzie pokaże ją w „Do wyjaśnienia”. Domyślne nazwy pasują do popularnych polskich wtyczek do faktur – jeśli Twój sklep ich nie używa, usuń je. Nazwy pól zna osoba, która konfigurowała sklep. Ustaw je przed pierwszym dowodem dla WooCommerce. Wpisz nazwę i naciśnij Enter.'
          }
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={wooKeys}
          disabled={readOnly}
          onChange={(_event, value) =>
            setWooKeys(
              Array.from(
                new Set(
                  value.map((item) => String(item).trim()).filter(Boolean),
                ),
              ),
            )
          }
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip key={key} size="small" label={option} {...tagProps} />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="np. _wc_other/zdrowie/want_vat_invoice"
            />
          )}
        />
      </Box>

      {methodChanged && settings.hasDocumentsThisYear ? (
        <Alert severity="warning">
          {
            'W tym roku są już wystawione dowody. Zmianę metody w trakcie roku uzgodnij z księgową. Wystawione dowody zostaną ze starymi ustawieniami, nowe powstaną z nowymi.'
          }
        </Alert>
      ) : null}
      {warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      {readOnly ? null : (
        <Box>
          <LoadingButton
            variant="contained"
            loading={isPending}
            disabled={!methodChanged && !keysChanged}
            onClick={submit}
          >
            {'Zapisz ustawienia'}
          </LoadingButton>
        </Box>
      )}

      {settings.methodChanges.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {'Historia zmian'}
          </Typography>
          <Stack spacing={0.25}>
            {[...settings.methodChanges].reverse().map((change) => (
              <Typography
                key={`${change.at}-${change.field}`}
                variant="body2"
                color="text.secondary"
              >
                {`${formatMoment(change.at)} · ${change.by}: ${METHOD_FIELD_LABELS[change.field] ?? change.field} – z „${optionLabel(change.from)}” na „${optionLabel(change.to)}”`}
              </Typography>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Section>
  );
};

export const CompanySettingsPage = () => {
  const company = useCompanyData();
  const settings = useAccountingSettings();
  const [settingWarnings, setSettingWarnings] = useState<string[]>([]);

  if (company.isLoading || settings.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!company.data || !settings.data) {
    return (
      <Alert severity="error">
        {
          'Nie udało się wczytać danych firmy. Odśwież stronę albo sprawdź, czy masz dostęp do raportów.'
        }
      </Alert>
    );
  }

  const canManage = settings.data.canManage;

  return (
    <Stack spacing={2} sx={{ maxWidth: 960 }}>
      <Box>
        <Typography variant="h5">{'Firma i rozliczenia'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {
            'Dane firmy i zasady, według których SM przygotowuje dowód sprzedaży bezrachunkowej – zbiorczy dokument dla księgowej ze sprzedaży wysyłkowej bez paragonów.'
          }
        </Typography>
      </Box>

      {canManage ? null : (
        <Alert severity="info">
          {
            'Możesz tylko przeglądać. Zmieniać dane i wystawiać dowody może osoba z uprawnieniem „Dowody sprzedaży” – nadaje je administrator konta.'
          }
        </Alert>
      )}

      <Alert
        severity="info"
        variant="outlined"
        action={
          <Button
            color="inherit"
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
            href={`#${Pages.smSystemSalesEvidence}`}
          >
            {'Przejdź do dowodu'}
          </Button>
        }
      >
        {
          'Kolejność: 1) uzupełnij dane firmy, 2) potwierdź oświadczenie o zwolnieniu z kasy, 3) sprawdź ustawienia rozliczeń z księgową. Potem w Raportach wystawisz dowód za wybrany okres.'
        }
      </Alert>

      <CompanyForm company={company.data} />
      <ExemptionSection settings={settings.data} />
      <SettingsForm
        settings={settings.data}
        warnings={settingWarnings}
        onWarnings={setSettingWarnings}
      />
    </Stack>
  );
};
