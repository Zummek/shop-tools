import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNotify } from '../../../../hooks';
import { useConditionsFromOrders } from '../api/useConditionsFromOrders';
import { useGetProductConditionsList } from '../api/useGetProductConditionsList';
import {
  useGetProductConditions,
  useUpdateProductConditions,
} from '../api/useProductConditions';
import { FillConditionsFromOrdersDialog } from '../components/FillConditionsFromOrdersDialog';
import { SuppliersOrdersToolbar } from '../components/SuppliersOrdersToolbar';
import { OrderCondition, OrderConditionsPerBranch } from '../types';

interface BandRow extends OrderCondition {
  key: string;
}

const validateBands = (bands: BandRow[]): string | null => {
  const sorted = [...bands].sort((a, b) => a.lowerBound - b.lowerBound);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].lowerBound >= sorted[i].upperBound) 
      return 'Dolna granica musi być mniejsza od górnej';
    
    if (sorted[i].lowerBound < 0 || sorted[i].toOrderAmount < 0) 
      return 'Wartości nie mogą być ujemne';
    
    if (i > 0 && sorted[i - 1].upperBound > sorted[i].lowerBound) 
      return 'Przedziały nie mogą nachodzić na siebie';
    
  }
  return null;
};

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Produkt', flex: 1 },
];

export const ConditionsPage = () => {
  const { notify } = useNotify();
  const {
    products,
    totalCount,
    isLoading,
    query,
    setQuery,
    page,
    setPage,
    pageSize,
  } = useGetProductConditionsList();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [draft, setDraft] = useState<Record<number, BandRow[]>>({});
  const [fillDialogOpen, setFillDialogOpen] = useState(false);

  const { productConditions, isLoading: isLoadingDetails } =
    useGetProductConditions(selectedProductId);
  const { updateConditions, isSaving } = useUpdateProductConditions();
  const { suggestFromOrders, isSuggesting } = useConditionsFromOrders();

  useEffect(() => {
    if (!productConditions) return;
    const next: Record<number, BandRow[]> = {};
    productConditions.orderConditionsPerBranch.forEach(
      (group: OrderConditionsPerBranch) => {
        next[group.branch.id] = group.orderConditions.map(
          (condition, index) => ({
            ...condition,
            key: `${group.branch.id}-${condition.id ?? index}`,
          }),
        );
      },
    );
    setDraft(next);
  }, [productConditions]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setQuery(value);
      setPage(0);
    }, 300),
    [setQuery, setPage],
  );

  const handleRowClick = (params: GridRowParams) => {
    setSelectedProductId(params.row.id);
  };

  const branches = productConditions?.orderConditionsPerBranch ?? [];

  const validationError = useMemo(() => {
    for (const bands of Object.values(draft)) {
      const error = validateBands(bands);
      if (error) return error;
    }
    return null;
  }, [draft]);

  const handleSave = async () => {
    if (!selectedProductId) return;
    if (validationError) {
      notify('error', validationError);
      return;
    }
    await updateConditions({
      productId: selectedProductId,
      conditions: branches.map((group) => ({
        branchId: group.branch.id,
        orderConditions: (draft[group.branch.id] ?? []).map(
          ({ lowerBound, upperBound, toOrderAmount }) => ({
            lowerBound,
            upperBound,
            toOrderAmount,
          }),
        ),
      })),
    });
  };

  const handleFillSelectedFromHistory = async () => {
    if (!selectedProductId) return;
    try {
      const result = await suggestFromOrders({
        productId: selectedProductId,
        overwrite: true,
        apply: false,
      });
      if (!result?.suggestions.length) {
        notify(
          'warning',
          'Brak historii zamówień do wyliczenia warunków dla tego produktu',
        );
        return;
      }
      setDraft((prev) => {
        const next = { ...prev };
        result.suggestions.forEach((row) => {
          next[row.branchId] = row.bands.map((band, index) => ({
            key: `${row.branchId}-hist-${index}`,
            lowerBound: band.lowerBound,
            upperBound: band.upperBound,
            toOrderAmount: band.toOrderAmount,
          }));
        });
        return next;
      });
      notify(
        'success',
        `Wstawiono propozycje dla ${result.branchesSuggested} oddziałów. Sprawdź i zapisz.`,
      );
    } catch {
      return;
    }
  };

  const updateBand = (
    branchId: number,
    key: string,
    field: keyof OrderCondition,
    value: number,
  ) => {
    setDraft((prev) => ({
      ...prev,
      [branchId]: (prev[branchId] ?? []).map((band) =>
        band.key === key ? { ...band, [field]: value } : band,
      ),
    }));
  };

  const addBand = (branchId: number) => {
    setDraft((prev) => {
      const current = prev[branchId] ?? [];
      const lastUpper =
        current.length > 0
          ? Math.max(...current.map((band) => band.upperBound))
          : 0;
      return {
        ...prev,
        [branchId]: [
          ...current,
          {
            key: `${branchId}-${Date.now()}`,
            lowerBound: lastUpper,
            upperBound: lastUpper + 10,
            toOrderAmount: 0,
          },
        ],
      };
    });
  };

  const removeBand = (branchId: number, key: string) => {
    setDraft((prev) => ({
      ...prev,
      [branchId]: (prev[branchId] ?? []).filter((band) => band.key !== key),
    }));
  };

  return (
    <Stack spacing={2}>
      <SuppliersOrdersToolbar
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setFillDialogOpen(true)}
          >
            {'Wypełnij puste z historii'}
          </Button>
        }
      />
      <FillConditionsFromOrdersDialog
        open={fillDialogOpen}
        onClose={() => setFillDialogOpen(false)}
      />
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} width={360}>
          <TextField
            size="small"
            label="Szukaj produktu"
            defaultValue={query}
            onChange={(e) => debouncedSetQuery(e.target.value)}
          />
          <Box height={560}>
            <DataGrid
              rows={products}
              columns={columns}
              loading={isLoading}
              disableColumnSorting
              disableColumnMenu
              disableRowSelectionOnClick
              onRowClick={handleRowClick}
              paginationMode="server"
              rowCount={totalCount}
              pageSizeOptions={[25]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => setPage(model.page)}
              rowSelectionModel={selectedProductId ? [selectedProductId] : []}
              localeText={{ noRowsLabel: 'Brak produktów' }}
            />
          </Box>
        </Stack>

        <Stack spacing={2} flex={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle1" fontWeight={600} flex={1}>
              {productConditions
                ? `Warunki: ${productConditions.name}`
                : 'Wybierz produkt'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={handleFillSelectedFromHistory}
              loading={isSuggesting}
              disabled={!selectedProductId || isLoadingDetails}
            >
              {'Z historii'}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              loading={isSaving}
              disabled={
                !selectedProductId || !!validationError || isLoadingDetails
              }
            >
              {'Zapisz warunki'}
            </Button>
          </Stack>
          {validationError && (
            <Typography color="error" variant="body2">
              {validationError}
            </Typography>
          )}
          {branches.map((group) => (
            <Accordion key={group.branch.id} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {group.branch.name}{' '}
                  <Typography component="span" color="text.secondary">
                    {'('}{(draft[group.branch.id] ?? []).length} {'przedziałów)'}
                  </Typography>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  {(draft[group.branch.id] ?? []).map((band) => (
                    <Stack
                      key={band.key}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <TextField
                        size="small"
                        type="number"
                        label="Od (stan)"
                        value={band.lowerBound}
                        onChange={(e) =>
                          updateBand(
                            group.branch.id,
                            band.key,
                            'lowerBound',
                            Number(e.target.value),
                          )
                        }
                        sx={{ width: 140 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Do (stan, exclusive)"
                        value={band.upperBound}
                        onChange={(e) =>
                          updateBand(
                            group.branch.id,
                            band.key,
                            'upperBound',
                            Number(e.target.value),
                          )
                        }
                        sx={{ width: 180 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Zamów"
                        value={band.toOrderAmount}
                        onChange={(e) =>
                          updateBand(
                            group.branch.id,
                            band.key,
                            'toOrderAmount',
                            Number(e.target.value),
                          )
                        }
                        sx={{ width: 120 }}
                      />
                      <IconButton
                        onClick={() => removeBand(group.branch.id, band.key)}
                        size="small"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => addBand(group.branch.id)}
                  >
                    {'Dodaj przedział'}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};
