import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';

import { PersistedDataGrid } from '../../../../components/dataGrid/PersistedDataGrid';
import { gridStorageIds } from '../../../../components/dataGrid/persistedGridState';
import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  OfferStatusFilter,
  StockPublishFilter,
  notifyOfferStockPublishError,
  useGetEcommerceOffers,
  useSetOfferStockPublish,
} from '../api';
import { ChannelProductLink } from '../types/channelLinks';
import { ORDER_CHANNELS, orderChannelLabel } from '../utils';

const productPath = (productId: number) =>
  Pages.smSystemProductDetails.replace(':productId', String(productId));

type PinnedOffer = {
  link: ChannelProductLink;
  index: number;
};

/** Keeps rows the active filter would drop, at the index they had before the toggle. */
const listWithPinnedOffers = (
  offers: ChannelProductLink[],
  pinned: Record<number, PinnedOffer>,
) => {
  const serverIds = new Set(offers.map((offer) => offer.id));
  const merged = offers.map((offer) => pinned[offer.id]?.link ?? offer);
  const missing = Object.values(pinned)
    .filter((pin) => !serverIds.has(pin.link.id))
    .sort((left, right) => left.index - right.index);

  for (const pin of missing) {
    const index = Math.max(0, Math.min(pin.index, merged.length));
    merged.splice(index, 0, pin.link);
  }
  return merged;
};

export const EcommerceOffersPage = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { notify } = useNotify();
  const {
    offers,
    totalCount,
    isLoading,
    isError,
    page,
    setPage,
    query,
    setQuery,
    channel,
    setChannel,
    stockPublish,
    setStockPublish,
    offerStatus,
    setOfferStatus,
    pageSize,
  } = useGetEcommerceOffers();
  const { setOfferStockPublish } = useSetOfferStockPublish();
  const [searchInput, setSearchInput] = useState(query);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const listKey = [query, page, channel, stockPublish, offerStatus].join('\0');
  const listKeyRef = useRef(listKey);
  listKeyRef.current = listKey;
  const [pinnedScope, setPinnedScope] = useState(listKey);
  const [pinned, setPinned] = useState<Record<number, PinnedOffer>>({});

  if (pinnedScope !== listKey) {
    setPinnedScope(listKey);
    setPinned({});
  }

  const visibleOffers = useMemo(
    () => listWithPinnedOffers(offers, pinnedScope === listKey ? pinned : {}),
    [offers, listKey, pinned, pinnedScope],
  );

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setQuery]);

  useEffect(() => {
    setPinned((current) => {
      const ids = Object.keys(current);
      if (ids.length === 0) return current;

      let changed = false;
      const next = { ...current };
      for (const id of ids) {
        const pin = current[Number(id)];
        if (!pin) continue;
        const serverRow = offers.find((offer) => offer.id === pin.link.id);
        if (
          serverRow &&
          serverRow.stockPublishEnabled === pin.link.stockPublishEnabled
        ) {
          delete next[pin.link.id];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [offers]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const toggleStockPublish = async (link: ChannelProductLink) => {
    const enabled = !link.stockPublishEnabled;
    const index = visibleOffers.findIndex((offer) => offer.id === link.id);
    const label = link.offerName || link.externalOfferId;
    const scopeAtToggle = listKeyRef.current;
    const previousPin = pinned[link.id];
    const stillOnThisList = () => listKeyRef.current === scopeAtToggle;

    setPendingId(link.id);
    setPinned((current) => ({
      ...current,
      [link.id]: {
        link: { ...link, stockPublishEnabled: enabled },
        index: current[link.id]?.index ?? Math.max(index, 0),
      },
    }));

    try {
      const updated = await setOfferStockPublish({ id: link.id, enabled });
      if (stillOnThisList()) {
        setPinned((current) => ({
          ...current,
          [link.id]: {
            link: { ...link, ...updated, stockPublishEnabled: enabled },
            index: current[link.id]?.index ?? Math.max(index, 0),
          },
        }));
      }
      const action = enabled ? 'Włączono' : 'Wyłączono';
      notify('success', `${action} aktualizację stanu (${label}).`);
    } catch (error) {
      if (stillOnThisList()) {
        setPinned((current) => {
          const next = { ...current };
          if (previousPin) next[link.id] = previousPin;
          else delete next[link.id];
          return next;
        });
      }
      notifyOfferStockPublishError(notify, error);
    } finally {
      setPendingId(null);
    }
  };

  const columns: GridColDef<ChannelProductLink>[] = [
    {
      field: 'offerName',
      headerName: 'Oferta',
      flex: 1.4,
      minWidth: 220,
      sortable: false,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.row.offerName || params.row.externalOfferId}
        </Typography>
      ),
    },
    {
      field: 'channel',
      headerName: 'Kanał',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => orderChannelLabel(row.channel),
    },
    {
      field: 'productName',
      headerName: 'Produkt',
      flex: 1,
      minWidth: 180,
      sortable: false,
      renderCell: (params) =>
        params.row.productId ? (
          <Link
            component={RouterLink}
            to={productPath(params.row.productId)}
            underline="hover"
            noWrap
          >
            {params.row.productName || params.row.productInternalId}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      field: 'offerStatus',
      headerName: 'Status',
      width: 120,
      sortable: false,
      valueGetter: (_value, row) => row.offerStatus || '—',
    },
    {
      field: 'stockAvailable',
      headerName: 'Stan na ofercie',
      width: 140,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row) =>
        row.stockAvailable == null ? '—' : String(row.stockAvailable),
    },
    {
      field: 'stockPublishEnabled',
      headerName: 'Aktualizuj stan',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Switch
          checked={params.row.stockPublishEnabled}
          disabled={pendingId === params.row.id}
          onChange={() => void toggleStockPublish(params.row)}
          slotProps={{ input: { 'aria-label': 'Aktualizuj stan' } }}
        />
      ),
    },
  ];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{'Oferty'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {
            'Aktualizacja stanu jest wyłączona, dopóki jej nie włączysz. Wyłączenie zostawia na kanale ostatnią liczbę.'
          }
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label="Szukaj nazwy, SKU, EAN"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="offer-channel-filter">{'Kanał'}</InputLabel>
          <Select
            labelId="offer-channel-filter"
            label="Kanał"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <MenuItem value="">{'Wszystkie'}</MenuItem>
            {ORDER_CHANNELS.map((item) => (
              <MenuItem key={item.source} value={item.source}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="offer-status-filter">{'Status oferty'}</InputLabel>
          <Select
            labelId="offer-status-filter"
            label="Status oferty"
            value={offerStatus}
            onChange={(event) =>
              setOfferStatus(event.target.value as OfferStatusFilter)
            }
          >
            <MenuItem value="active">{'Aktywne'}</MenuItem>
            <MenuItem value="paused">{'Wstrzymane i szkice'}</MenuItem>
            <MenuItem value="ended">{'Zakończone'}</MenuItem>
            <MenuItem value="all">{'Wszystkie'}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="offer-stock-publish-filter">
            {'Aktualizacja stanu'}
          </InputLabel>
          <Select
            labelId="offer-stock-publish-filter"
            label="Aktualizacja stanu"
            value={stockPublish}
            onChange={(event) =>
              setStockPublish(event.target.value as StockPublishFilter)
            }
          >
            <MenuItem value="off">{'Wyłączona'}</MenuItem>
            <MenuItem value="on">{'Włączona'}</MenuItem>
            <MenuItem value="all">{'Wszystkie'}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isError ? (
        <Alert severity="error">{'Nie udało się wczytać ofert.'}</Alert>
      ) : (
        <PersistedDataGrid
          storageKey={gridStorageIds.ecommerceOffers}
          rows={visibleOffers}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableColumnFilter
          disableColumnMenu
          disableRowSelectionOnClick
          pageSizeOptions={[pageSize]}
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => setPage(model.page)}
          localeText={{ noRowsLabel: 'Brak ofert' }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      )}
    </Stack>
  );
};
