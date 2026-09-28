import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { modalStyle } from '../../../../components';
import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetBranches } from '../../branches/api';
import { formatPrice } from '../../products/utils';
import {
  AllegroPriceSimApplyResult,
  useApplyAllegroPriceSim,
} from '../api/useApplyAllegroPriceSim';
import {
  AllegroPriceSimRow,
  useGetAllegroPriceSim,
} from '../api/useGetAllegroPriceSim';
import { useSaveAllegroPriceSimOverride } from '../api/useSaveAllegroPriceSimOverride';
import {
  AllegroPriceSimApplyConfirmDialog,
  AllegroPriceSimApplyStaleDialog,
} from '../components/AllegroPriceSimApplyDialogs';
import { AllegroPriceSimOfferModal } from '../components/AllegroPriceSimOfferModal';
import { MarginCalculationBreakdown } from '../components/MarginCalculationBreakdown';
import { allegroOfferHref } from '../utils/allegroOfferUrl';
import { marginSourceLabel } from '../utils/marginSourceLabel';
import { simulateAllegroOffer } from '../utils/simulateAllegroOffer';

const statusLabel: Record<AllegroPriceSimRow['status'], string> = {
  ok: 'Plus',
  thin: 'Granica',
  loss: 'Strata',
  missing: 'Brak danych',
  unreachable: 'Cel nieosiągalny',
};

const offerStatusLabel: Record<string, string> = {
  ACTIVE: 'Aktywna',
  INACTIVE: 'Nieopublikowana',
  ENDED: 'Zakończona',
  ACTIVATING: 'Włączana',
};

const offerStatusColor = (
  status: string | null,
): 'success' | 'warning' | 'default' => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'ENDED') return 'warning';
  return 'default';
};

const statusColor: Record<
  AllegroPriceSimRow['status'],
  'success' | 'warning' | 'error' | 'default'
> = {
  ok: 'success',
  thin: 'warning',
  loss: 'error',
  missing: 'default',
  unreachable: 'error',
};

const KpiCard = ({
  title,
  value,
  tooltip,
}: {
  title: string;
  value: string;
  tooltip: string;
}) => (
  <Paper variant="outlined" sx={{ p: 1.5, minWidth: 120, flex: '1 1 140px' }}>
    <Stack spacing={0.5}>
      <Tooltip title={tooltip}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
      </Tooltip>
      <Typography variant="h6">{value}</Typography>
    </Stack>
  </Paper>
);

type DisplayRow = AllegroPriceSimRow & {
  id: string;
  /** Marża przy aktualnej cenie oferty Allegro (gdy tabela liczy z symulacji). */
  offerMarginCents: number | null;
  offerMarginPercent: number | null;
};

const MarginDeltaCell = ({
  value,
  previous,
}: {
  value: string;
  previous: string | null;
}) => (
  <Stack
    spacing={0}
    alignItems="flex-end"
    justifyContent="center"
    sx={{ width: '100%', lineHeight: 1.2 }}
  >
    <Typography variant="body2" component="span">
      {value}
    </Typography>
    {previous != null ? (
      <Typography variant="caption" color="text.secondary" component="span">
        {previous}
      </Typography>
    ) : null}
  </Stack>
);

type GapFilter = 'all' | 'buyer' | 'shipping';

const usesShippingPercent = (source: string) =>
  source === 'rate_fallback' || source === 'group_no_cost';

const usesBuyerGap = (source: string) => source === 'fallback';

const showGapOffersLabel = (active: boolean) => (active ? 'Cofnij' : 'Pokaż');

const GapFallbackField = ({
  label,
  tooltip,
  value,
  onChange,
  onBlur,
  count,
  total,
  countsReady,
  active,
  onToggle,
  detail,
}: {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  count: number;
  total: number;
  countsReady: boolean;
  active: boolean;
  onToggle: () => void;
  detail?: string;
}) => (
  <Stack
    direction="row"
    spacing={0.75}
    alignItems="center"
    flexWrap="wrap"
    useFlexGap
    sx={{ flex: '0 1 auto', maxWidth: '100%' }}
  >
    <Tooltip title={tooltip}>
      <TextField
        size="small"
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        sx={{ width: { xs: '100%', sm: 340 } }}
      />
    </Tooltip>
    {countsReady ? (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ whiteSpace: 'nowrap' }}
      >
        {`${count} z ${total}`}
      </Typography>
    ) : null}
    {countsReady && detail ? (
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    ) : null}
    {countsReady && count > 0 ? (
      <Tooltip
        title={
          active
            ? 'Cofnij filtr'
            : `Pokaż ${count === 1 ? 'ofertę, której' : 'oferty, których'} dotyczy to pole`
        }
      >
        <Button
          size="small"
          color={active ? 'primary' : 'inherit'}
          onClick={onToggle}
          sx={{ py: 0, minHeight: 32, whiteSpace: 'nowrap' }}
        >
          {showGapOffersLabel(active)}
        </Button>
      </Tooltip>
    ) : null}
  </Stack>
);

export const AllegroPriceSimPage = () => {
  const user = useAppSelector((state) => state.smSystemUser.user);
  const canView = user?.permissions?.canViewPurchasePrices;
  const { notify } = useNotify();
  const { saveOverride, deleteOverride } = useSaveAllegroPriceSimOverride();
  const { applyPrice, isApplying } = useApplyAllegroPriceSim();
  const { branches } = useGetBranches({ defaultPageSize: 100 });

  const {
    data,
    isLoading,
    isError,
    errorMessage,
    targetMarginPercent,
    setTargetMarginPercent,
    buyerDeliveryGross,
    setBuyerDeliveryGross,
    shippingRatePercent,
    setShippingRatePercent,
    branchId,
    setBranchId,
    refetch,
  } = useGetAllegroPriceSim({
    enabled: canView === true,
    defaultBranchId: user?.defaultBranch?.id ?? null,
  });

  const [selectedRow, setSelectedRow] = useState<AllegroPriceSimRow | null>(
    null,
  );
  const [priceOverrides, setPriceOverrides] = useState<
    Record<string, number | null>
  >({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gapFilter, setGapFilter] = useState<GapFilter>('all');
  const [vatFilter, setVatFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [howWeCalculateOpen, setHowWeCalculateOpen] = useState(false);
  const [applyRow, setApplyRow] = useState<AllegroPriceSimRow | null>(null);
  const [staleResult, setStaleResult] =
    useState<AllegroPriceSimApplyResult | null>(null);
  const [buyerDraft, setBuyerDraft] = useState(String(buyerDeliveryGross));
  const [shippingDraft, setShippingDraft] = useState(
    String(shippingRatePercent),
  );
  const [targetDraft, setTargetDraft] = useState(String(targetMarginPercent));

  useEffect(() => {
    setBuyerDraft(String(buyerDeliveryGross));
  }, [buyerDeliveryGross]);
  useEffect(() => {
    setShippingDraft(String(shippingRatePercent));
  }, [shippingRatePercent]);
  useEffect(() => {
    setTargetDraft(String(targetMarginPercent));
  }, [targetMarginPercent]);
  useEffect(() => {
    if (branchId != null) return;
    const first = branches?.results?.[0]?.id;
    if (first != null) setBranchId(first);
  }, [branchId, branches, setBranchId]);

  const currency = data?.currency ?? 'PLN';
  const assumptions = data?.assumptions;
  const buyerDeliveryCents = assumptions?.buyerDeliveryCents ?? 0;
  const shippingRate = assumptions?.shippingRate ?? shippingRatePercent / 100;
  const targetMargin = assumptions?.targetMargin ?? targetMarginPercent / 100;

  useEffect(() => {
    if (!data?.rows) return;
    setPriceOverrides((current) => {
      const next = { ...current };
      let changed = false;
      data.rows?.forEach((row) => {
        if (!Object.prototype.hasOwnProperty.call(next, row.offerId)) return;
        if (next[row.offerId] === row.simulatedGrossCents) {
          delete next[row.offerId];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [data?.rows]);

  const displayRows = useMemo<DisplayRow[]>(() => {
    return (data?.rows ?? []).map((row) => {
      const hasLocal = Object.prototype.hasOwnProperty.call(
        priceOverrides,
        row.offerId,
      );
      const simulatedGrossCents = hasLocal
        ? priceOverrides[row.offerId]
        : row.simulatedGrossCents;
      const offerGrossCents = row.offerGrossCents;
      const effective =
        simulatedGrossCents ?? offerGrossCents ?? row.priceGrossCents;
      const simOptions = {
        buyerDeliveryCents: row.buyerDeliveryCents ?? buyerDeliveryCents,
        shippingRate,
        targetMargin,
      };
      const showOfferBaseline =
        simulatedGrossCents != null &&
        offerGrossCents != null &&
        simulatedGrossCents !== offerGrossCents;
      const offerSim = showOfferBaseline
        ? simulateAllegroOffer(row, offerGrossCents, simOptions)
        : null;
      const offerMarginCents =
        offerSim && offerSim.status !== 'missing' ? offerSim.marginCents : null;
      const offerMarginPercent =
        offerSim && offerSim.status !== 'missing'
          ? offerSim.marginPercent
          : null;

      const base: DisplayRow = {
        ...row,
        id: row.offerId,
        offerGrossCents,
        simulatedGrossCents,
        priceGrossCents: effective,
        offerMarginCents,
        offerMarginPercent,
      };
      if (effective == null || effective === row.priceGrossCents) return base;

      const sim = simulateAllegroOffer(row, effective, simOptions);
      if (!sim) return base;
      return {
        ...base,
        priceNetCents: sim.priceNetCents,
        costCommissionCents: sim.costCommissionCents,
        costShippingCents: sim.costShippingCents,
        costPromoCents: sim.costPromoCents,
        marginCents: sim.marginCents,
        marginPercent: sim.marginPercent,
        markupOnCost: sim.markupOnCost,
        status: row.status === 'unreachable' ? 'unreachable' : sim.status,
      };
    });
  }, [
    data?.rows,
    priceOverrides,
    buyerDeliveryCents,
    shippingRate,
    targetMargin,
  ]);

  useEffect(() => {
    if (selectedRow == null) return;
    const next = displayRows.find((row) => row.offerId === selectedRow.offerId);
    if (next == null) {
      setSelectedRow(null);
      return;
    }
    if (next !== selectedRow) setSelectedRow(next);
  }, [displayRows, selectedRow]);

  const vatOptions = useMemo(() => {
    const values = new Set<number>();
    displayRows.forEach((row) => {
      if (row.vatRate != null) values.add(row.vatRate);
    });
    return Array.from(values).sort((a, b) => a - b);
  }, [displayRows]);

  const gapCounts = useMemo(() => {
    let buyer = 0;
    let shipping = 0;
    displayRows.forEach((row) => {
      if (usesBuyerGap(row.buyerDeliverySource)) buyer += 1;
      if (usesShippingPercent(row.costShippingSource)) shipping += 1;
    });
    return {
      buyer,
      shipping,
      total: displayRows.length,
    };
  }, [displayRows]);

  const gapCountsReady = !isLoading && data != null;
  const showBuyerGap = gapCountsReady && gapCounts.buyer > 0;
  const showShippingGap = gapCountsReady && gapCounts.shipping > 0;
  const showGapSection = showBuyerGap || showShippingGap;

  useEffect(() => {
    if (gapFilter === 'buyer' && !showBuyerGap) setGapFilter('all');
    if (gapFilter === 'shipping' && !showShippingGap) setGapFilter('all');
  }, [gapFilter, showBuyerGap, showShippingGap]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return displayRows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (gapFilter === 'buyer' && !usesBuyerGap(row.buyerDeliverySource))
        return false;
      if (
        gapFilter === 'shipping' &&
        !usesShippingPercent(row.costShippingSource)
      )
        return false;
      if (vatFilter !== 'all' && String(row.vatRate) !== vatFilter)
        return false;
      if (query && !row.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [displayRows, statusFilter, gapFilter, vatFilter, search]);

  const displayKpis = useMemo(() => {
    const counts = {
      ok: 0,
      thin: 0,
      loss: 0,
      missing: 0,
      unreachable: 0,
    };
    const percents: number[] = [];
    displayRows.forEach((row) => {
      counts[row.status] += 1;
      if (row.marginPercent != null && row.status !== 'missing')
        percents.push(row.marginPercent);
    });
    return {
      ...counts,
      avgMarginPercent:
        percents.length > 0
          ? percents.reduce((sum, value) => sum + value, 0) / percents.length
          : null,
    };
  }, [displayRows]);

  const commitDecimal = (raw: string, fallback: number) => {
    const parsed = Number(raw.replace(',', '.').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toggleGapFilter = (next: GapFilter) => {
    setGapFilter((current) => (current === next ? 'all' : next));
  };

  const columns: GridColDef<DisplayRow>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Oferta',
        flex: 1,
        minWidth: 240,
        renderCell: (params) => (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ height: '100%', width: '100%', minWidth: 0 }}
          >
            <Stack
              justifyContent="center"
              sx={{ flex: 1, minWidth: 0, height: '100%' }}
            >
              <Typography variant="body2" noWrap>
                {params.row.name}
              </Typography>
            </Stack>
            {params.row.externalUrl || params.row.offerId ? (
              <Tooltip title="Otwórz ofertę na Allegro">
                <IconButton
                  size="small"
                  component="a"
                  href={
                    allegroOfferHref(
                      params.row.externalUrl,
                      params.row.offerId,
                      params.row.marketplace,
                    ) ?? undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Otwórz ofertę na Allegro"
                  onClick={(event) => event.stopPropagation()}
                >
                  <OpenInNewOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {params.row.productId != null ? (
              <Tooltip title="Otwórz produkt">
                <IconButton
                  size="small"
                  component="a"
                  href={`#${Pages.smSystemProductDetails.replace(
                    ':productId',
                    String(params.row.productId),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Otwórz produkt w nowej karcie"
                  onClick={(event) => event.stopPropagation()}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
      {
        field: 'stock',
        headerName: 'Stan',
        type: 'number',
        width: 90,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'offerStatus',
        headerName: 'Publikacja',
        description:
          'Status publikacji na Allegro. Nieopublikowana (INACTIVE) nadal da się wycenić i wgrać. Zakończonych (ENDED) tu nie ma.',
        width: 150,
        renderCell: (params) => {
          const raw = params.row.offerStatus;
          if (!raw) return '—';
          return (
            <Chip
              size="small"
              color={offerStatusColor(raw)}
              label={offerStatusLabel[raw] ?? raw}
            />
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        description:
          'Status marży przy cenie z tabeli: Plus, Granica, Strata, brak danych albo cel nieosiągalny.',
        width: 150,
        renderCell: (params) => (
          <Chip
            size="small"
            color={statusColor[params.row.status]}
            label={statusLabel[params.row.status]}
          />
        ),
      },
      {
        field: 'purchaseNetCents',
        headerName: 'Zakup netto (PLN)',
        description:
          'Ostatnia faktura zakupu na dziś — nie średnia z kilku faktur. Jeśli na jednej FV jest kilka pozycji tego SKU, średnia ważona ilością tylko z tej faktury. Gdy brak FV, ostatni zakup z karty produktu.',
        type: 'number',
        width: 155,
        renderCell: (params) => {
          const value = params.row.purchaseNetCents;
          return (
            <Tooltip title={marginSourceLabel(params.row.cogsSource)}>
              <span>{value == null ? '—' : formatPrice(Number(value))}</span>
            </Tooltip>
          );
        },
      },
      {
        field: 'offerGrossCents',
        headerName: 'Cena oferty (PLN)',
        type: 'number',
        width: 155,
        valueFormatter: (value) =>
          value == null ? '—' : formatPrice(Number(value)),
      },
      {
        field: 'simulatedGrossCents',
        headerName: 'Symulowana cena (PLN)',
        type: 'number',
        width: 180,
        editable: true,
        valueGetter: (_value, row) =>
          row.simulatedGrossCents == null
            ? null
            : row.simulatedGrossCents / 100,
        valueSetter: (value, row) => {
          if (value == null || value === '')
            return { ...row, simulatedGrossCents: null };
          const parsed = Number(value);
          return {
            ...row,
            simulatedGrossCents: Number.isFinite(parsed)
              ? Math.round(parsed * 100)
              : row.simulatedGrossCents,
          };
        },
        renderCell: (params) =>
          params.row.simulatedGrossCents == null
            ? '—'
            : formatPrice(params.row.simulatedGrossCents),
      },
      {
        field: 'simulatedAt',
        headerName: 'Data symulacji',
        width: 150,
        valueFormatter: (value) =>
          value ? dayjs(String(value)).format('DD.MM.YYYY HH:mm') : '—',
      },
      {
        field: 'apply',
        headerName: 'Wgraj',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const canApply =
            params.row.simulatedGrossCents != null &&
            params.row.offerGrossCents != null &&
            params.row.simulatedGrossCents !== params.row.offerGrossCents;
          if (!canApply) return null;
          return (
            <IconButton
              size="small"
              color="primary"
              aria-label="Wgraj symulację na ofertę Allegro"
              onClick={(event) => {
                event.stopPropagation();
                setApplyRow(params.row);
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" />
            </IconButton>
          );
        },
      },
      {
        field: 'marginCents',
        headerName: 'Marża (PLN)',
        description:
          'Marża przy cenie z tabeli (symulacja lub oferta). Szara wartość pod spodem to marża przy aktualnej cenie oferty Allegro.',
        type: 'number',
        width: 140,
        valueFormatter: (value) =>
          value == null ? '—' : formatPrice(Number(value)),
        renderCell: (params) => {
          const current =
            params.row.marginCents == null
              ? '—'
              : formatPrice(params.row.marginCents);
          const previous =
            params.row.offerMarginCents == null ||
            params.row.offerMarginCents === params.row.marginCents
              ? null
              : formatPrice(params.row.offerMarginCents);
          return <MarginDeltaCell value={current} previous={previous} />;
        },
      },
      {
        field: 'marginPercent',
        headerName: 'Marża %',
        description:
          'Marża % przy cenie z tabeli. Szara wartość pod spodem to marża % przy aktualnej cenie oferty Allegro.',
        type: 'number',
        width: 110,
        valueFormatter: (value) =>
          value == null ? '—' : `${Number(value).toFixed(1)}%`,
        renderCell: (params) => {
          const current =
            params.row.marginPercent == null
              ? '—'
              : `${params.row.marginPercent.toFixed(1)}%`;
          const previous =
            params.row.offerMarginPercent == null ||
            params.row.offerMarginPercent === params.row.marginPercent
              ? null
              : `${params.row.offerMarginPercent.toFixed(1)}%`;
          return <MarginDeltaCell value={current} previous={previous} />;
        },
      },
      {
        field: 'minPriceGrossCents',
        headerName: 'Cena min (PLN)',
        description:
          'Najniższe brutto, przy którym marża % dochodzi do celu z paska. Zaokrąglone w górę do końcówek Allegro (.90 / .99). Puste, gdy cel jest nieosiągalny.',
        type: 'number',
        width: 145,
        valueFormatter: (value) =>
          value == null ? '—' : formatPrice(Number(value)),
      },
      {
        field: 'commissionRateNet',
        headerName: 'Kategoria %',
        description:
          'Stawka prowizji netto z cennika Allegro po drzewie kategorii oferty. Liść dziedziczy stawkę po rodzicu. Bez kategorii lub bez stawki: 17% (Pozostałe). Minimum 0,40 zł netto.',
        type: 'number',
        width: 120,
        renderCell: (params) => {
          const path = params.row.categoryPath.length
            ? params.row.categoryPath.map((part) => part.name).join(' → ')
            : params.row.allegroCategoryId || 'brak kategorii';
          const cap =
            params.row.commissionCapNet != null
              ? `limit ${params.row.commissionCapNet.toFixed(2)} zł netto`
              : null;
          return (
            <Tooltip
              title={
                <Stack spacing={0.25}>
                  <span>{path}</span>
                  <span>{marginSourceLabel(params.row.commissionSource)}</span>
                  <span>
                    {`min ${params.row.commissionMinNet.toFixed(2)} zł netto`}
                  </span>
                  {cap ? <span>{cap}</span> : null}
                </Stack>
              }
            >
              <span>{`${(params.row.commissionRateNet * 100).toFixed(2)}%`}</span>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  if (canView === false) return <Navigate to={Pages.smSystemReports} replace />;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h5">{'Symulacja cen Allegro'}</Typography>
          <Button
            variant="text"
            href={`#${Pages.smSystemReports}`}
            sx={{ alignSelf: 'flex-start', px: 0 }}
          >
            {'← Wróć do raportów'}
          </Button>
        </Stack>
        <Button
          size="small"
          startIcon={<InfoOutlinedIcon />}
          onClick={() => setHowWeCalculateOpen(true)}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {'Jak liczymy'}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
          >
            <Tooltip title="Dotyczy każdej oferty. Plus = marża % ≥ ten cel. Granica = zysk, ale poniżej celu. Cena min to najniższe brutto, które ten cel jeszcze spełnia.">
              <TextField
                size="small"
                label="Cel marży %"
                value={targetDraft}
                onChange={(event) => setTargetDraft(event.target.value)}
                onBlur={() =>
                  setTargetMarginPercent(
                    commitDecimal(targetDraft, targetMarginPercent),
                  )
                }
                sx={{ width: { xs: '100%', sm: 140 } }}
              />
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              {'Dotyczy każdej oferty — Plus, Granica i cena min.'}
            </Typography>
          </Stack>
          {showGapSection ? (
            <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'action.hover' }}>
              <Stack spacing={0.75}>
                <Typography variant="overline" color="text.secondary">
                  {'Gdy brakuje danych'}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1.5}
                  flexWrap="wrap"
                  useFlexGap
                  alignItems="center"
                >
                  {showBuyerGap ? (
                    <GapFallbackField
                      label="Dostawa w prowizji, gdy brak zamówień (zł)"
                      tooltip="Allegro liczy prowizję od ceny plus ta kwota. Oferty ze sprzedażą z 180 dni biorą średnią z zamówień. Gdy zamówień nie ma — mediana ze sklepu. To pole widać tylko gdy sklep nie ma tej mediany."
                      value={buyerDraft}
                      onChange={setBuyerDraft}
                      onBlur={() =>
                        setBuyerDeliveryGross(
                          commitDecimal(buyerDraft, buyerDeliveryGross),
                        )
                      }
                      count={gapCounts.buyer}
                      total={gapCounts.total}
                      countsReady={gapCountsReady}
                      active={gapFilter === 'buyer'}
                      onToggle={() => toggleGapFilter('buyer')}
                    />
                  ) : null}
                  {showShippingGap ? (
                    <GapFallbackField
                      label="Koszt Twojej wysyłki, gdy brak billingu (%)"
                      tooltip="Domyślnie bierzemy medianę opłat za dostawę z billingu Allegro (Smart / Allegro Delivery) z 180 dni — najpierw tej oferty, potem grupy, potem sklepu. Zł wpisane przy grupie dostawy nadpisuje billing. Ten procent wchodzi tylko gdy nie ma ani billingu, ani zł z grupy."
                      value={shippingDraft}
                      onChange={setShippingDraft}
                      onBlur={() =>
                        setShippingRatePercent(
                          commitDecimal(shippingDraft, shippingRatePercent),
                        )
                      }
                      count={gapCounts.shipping}
                      total={gapCounts.total}
                      countsReady={gapCountsReady}
                      active={gapFilter === 'shipping'}
                      onToggle={() => toggleGapFilter('shipping')}
                    />
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          ) : null}
          <Stack spacing={0.75}>
            <Typography variant="overline" color="text.secondary">
              {'Filtry'}
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              alignItems="center"
            >
              <Tooltip title="Stan magazynowy w tabeli z tego oddziału. Nie zmienia wyliczenia marży.">
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{'Sklep'}</InputLabel>
                  <Select
                    label="Sklep"
                    value={branchId ?? ''}
                    onChange={(event) =>
                      setBranchId(
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  >
                    {(branches?.results ?? []).map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Tooltip>
              <TextField
                size="small"
                label="Szukaj"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: 160, flex: '1 1 180px' }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{'Status'}</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">{'Wszystkie'}</MenuItem>
                  <MenuItem value="ok">{'Plus'}</MenuItem>
                  <MenuItem value="thin">{'Granica'}</MenuItem>
                  <MenuItem value="loss">{'Strata'}</MenuItem>
                  <MenuItem value="missing">{'Brak danych'}</MenuItem>
                  <MenuItem value="unreachable">{'Cel nieosiągalny'}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>{'VAT'}</InputLabel>
                <Select
                  label="VAT"
                  value={vatFilter}
                  onChange={(event) => setVatFilter(event.target.value)}
                >
                  <MenuItem value="all">{'Wszystkie'}</MenuItem>
                  {vatOptions.map((vat) => (
                    <MenuItem key={vat} value={String(vat)}>
                      {`${vat}%`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {gapFilter === 'buyer' ? (
                <Chip
                  size="small"
                  label="Oferty bez zamówień"
                  onDelete={() => setGapFilter('all')}
                />
              ) : null}
              {gapFilter === 'shipping' ? (
                <Chip
                  size="small"
                  label="Oferty z kosztem wysyłki z %"
                  onDelete={() => setGapFilter('all')}
                />
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {isError ? (
        <Alert severity="error">
          {errorMessage ?? 'Nie udało się pobrać raportu.'}
        </Alert>
      ) : null}

      {isLoading && displayRows.length === 0 ? (
        <Skeleton variant="rounded" height={88} />
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <KpiCard
            title="Plus"
            value={String(displayKpis.ok)}
            tooltip="Marża % ≥ cel z paska."
          />
          <KpiCard
            title="Granica"
            value={String(displayKpis.thin)}
            tooltip="Marża ≥ 0, ale poniżej celu."
          />
          <KpiCard
            title="Strata"
            value={String(displayKpis.loss)}
            tooltip="Marża ujemna."
          />
          <KpiCard
            title="Cel nieosiągalny"
            value={String(displayKpis.unreachable)}
            tooltip="Struktura kosztów nie pozwala dojść do celu; aktualna marża jest nadal w tabeli."
          />
          <KpiCard
            title="Brak danych"
            value={String(displayKpis.missing)}
            tooltip="Brak zakupu, VAT albo ceny oferty."
          />
          <KpiCard
            title="Śr. marża %"
            value={
              displayKpis.avgMarginPercent == null
                ? '—'
                : `${displayKpis.avgMarginPercent.toFixed(1)}%`
            }
            tooltip="Średnia tylko z wierszy z danymi, po zapisanej symulacji."
          />
        </Stack>
      )}

      <Paper
        variant="outlined"
        sx={{
          height: { xs: 'min(70vh, 560px)', md: 560 },
          minHeight: 320,
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          disableColumnMenu
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          processRowUpdate={async (updated, original) => {
            const next = updated.simulatedGrossCents ?? null;
            if (next === (original.simulatedGrossCents ?? null)) return updated;
            setPriceOverrides((current) => ({
              ...current,
              [updated.offerId]: next,
            }));
            try {
              if (next == null || next <= 0) {
                await deleteOverride(updated.offerId);
                notify('success', 'Usunięto symulację — liczymy z ceny oferty');
              } else {
                await saveOverride({
                  offerId: updated.offerId,
                  priceGrossCents: next,
                });
                notify(
                  'success',
                  `Zapisano symulację ${formatPrice(next, currency)}`,
                );
              }
            } catch {
              notify('error', 'Nie udało się zapisać symulacji');
              throw new Error('Nie udało się zapisać symulacji');
            }
            return updated;
          }}
          onProcessRowUpdateError={() => undefined}
          onRowClick={(params: GridRowParams<DisplayRow>, event) => {
            const target = event.target as HTMLElement;
            if (
              target.closest('.MuiDataGrid-cell--editable') ||
              target.closest('.MuiIconButton-root')
            )
              return;
            setSelectedRow(params.row);
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </Paper>

      <Modal
        open={howWeCalculateOpen}
        onClose={() => setHowWeCalculateOpen(false)}
      >
        <Stack
          sx={{
            ...modalStyle({ width: 640 }),
            maxHeight: 'calc(100vh - 32px)',
            overflow: 'auto',
          }}
          spacing={2}
        >
          <Typography variant="h6">{'Jak liczymy'}</Typography>
          <Typography variant="body2">
            {
              'Marża = przychód netto − prowizja z kategorii − wysyłka sprzedawcy − zakup. Prowizja = stawka netto × (cena brutto + dostawa kupującego). Dostawa kupującego: średnia z zamówień oferty (180 dni), a jeśli brak zamówień — mediana ze sklepu (to pole ją nadpisuje). Wysyłka sprzedawcy: zł z grupy dostawy, jeśli jest wpisane; inaczej mediana opłat za dostawę z billingu Allegro (180 dni) — najpierw ta oferta, potem grupa, potem sklep. Gdy billingu i zł z grupy nie ma — procent z tej sekcji. CIT nie jest odejmowany. Kolumna Symulowana cena zapisuje się u nas i nie zmienia oferty na Allegro. Cena min to najniższe brutto przy celu marży.'
            }
          </Typography>
          {data?.calculation ? (
            <MarginCalculationBreakdown
              calculation={data.calculation}
              currency={currency}
            />
          ) : (
            <Typography color="text.secondary">
              {'Brak przykładowego wyliczenia — brak wierszy z danymi.'}
            </Typography>
          )}
        </Stack>
      </Modal>

      <AllegroPriceSimOfferModal
        open={selectedRow != null}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
        currency={currency}
        buyerDeliveryCents={buyerDeliveryCents}
        shippingRate={shippingRate}
        targetMargin={targetMargin}
        onApplyPrice={async (offerId, priceGrossCents) => {
          setPriceOverrides((current) => ({
            ...current,
            [offerId]: priceGrossCents,
          }));
          try {
            await saveOverride({ offerId, priceGrossCents });
            notify(
              'success',
              `Zastosowano ${formatPrice(priceGrossCents, currency)} w tabeli (tylko symulacja)`,
            );
          } catch {
            notify('error', 'Nie udało się zapisać symulacji');
            throw new Error('Nie udało się zapisać symulacji');
          }
        }}
      />

      <AllegroPriceSimApplyConfirmDialog
        row={applyRow}
        currency={currency}
        isApplying={isApplying}
        onClose={() => setApplyRow(null)}
        onConfirm={() => {
          const simulatedGrossCents = applyRow?.simulatedGrossCents;
          const offerGrossCents = applyRow?.offerGrossCents;
          if (
            applyRow == null ||
            simulatedGrossCents == null ||
            !Number.isFinite(simulatedGrossCents) ||
            simulatedGrossCents <= 0 ||
            offerGrossCents == null
          )
            return;
          const offerId = applyRow.offerId;
          void applyPrice({
            offerId,
            expectedOfferGrossCents: offerGrossCents,
            priceGrossCents: simulatedGrossCents,
          })
            .then((result) => {
              setApplyRow(null);
              if (result.status === 'stale') {
                setStaleResult(result);
                return;
              }
              if (result.status === 'error') {
                notify(
                  'error',
                  result.error || 'Nie udało się wgrać ceny na Allegro',
                );
                return;
              }
              notify(
                'success',
                `Wgrano ${formatPrice(simulatedGrossCents, currency)} na ofertę Allegro`,
              );
            })
            .catch(() =>
              notify('error', 'Nie udało się wgrać ceny na Allegro'),
            );
        }}
      />
      <AllegroPriceSimApplyStaleDialog
        result={staleResult}
        currency={currency}
        onClose={() => setStaleResult(null)}
        onRefresh={() => {
          void refetch();
        }}
      />
    </Stack>
  );
};
