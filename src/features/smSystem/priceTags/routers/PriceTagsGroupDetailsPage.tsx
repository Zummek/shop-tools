import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  styled,
  Tooltip,
  TooltipProps,
  tooltipClasses,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridEditInputCell,
  GridRenderEditCellParams,
} from '@mui/x-data-grid';
import { useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { BranchListItem } from '../../branches/api';
import { useUpdateProduct } from '../../products/api';
import {
  Product,
  ProductUnit,
  ProductUnitScale,
  ProductUnitVolumeScale,
  ProductUnitWeightScale,
} from '../../products/types';
import { formatPrice } from '../../products/utils';
import {
  getPriceTagGroupDetailsQueryKey,
  useGetPriceTagGroupDetails,
  useUpdatePriceTagGroup,
} from '../api';
import { PdfFullPriceList, SelectBranch } from '../components';
import { SinglePriceList } from '../components/SinglePriceList';
import {
  ChangeProductsToPriceTagGroupModal,
  ConfirmDeletingPriceGroupModal,
} from '../modals';
import { PriceTagGroup } from '../types';
import { calcPricePerFullUnit } from '../utils/priceTag';

enum RouterParams {
  groupId = 'groupId',
}

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}));

function NameEditInputCell(props: GridRenderEditCellParams) {
  const { error } = props;

  return (
    <StyledTooltip open={!!error} title={error}>
      <GridEditInputCell {...props} />
    </StyledTooltip>
  );
}

export const PriceTagsGroupDetailsPage = () => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const { groupId } = useParams<RouterParams>();

  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const [branch, setBranch] = useState<BranchListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openChangingProductsModal, setOpenChangingProductsModal] =
    useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [priceTagGroupName, setPriceTagGroupName] = useState('');
  const [
    isDeletingPriceTagGroupModalOpen,
    setIsDeletingPriceTagGroupModalOpen,
  ] = useState(false);

  const generatePriceListPdf = useReactToPrint({
    content: () => componentToPrintRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 0mm;
      }
    `,
  });

  const { priceTagGroupDetails, isLoading } =
    useGetPriceTagGroupDetails(groupId);

  useEffect(() => {
    setPriceTagGroupName(priceTagGroupDetails?.name || '');
  }, [priceTagGroupDetails?.name]);

  const { updatePriceTagGroup, isPending: isUpdatingPriceTagGroup } =
    useUpdatePriceTagGroup({ groupId });

  const {
    updatePriceTagName,
    updateUnit,
    updateUnitScale,
    updateUnitScaleValue,
  } = useUpdateProduct();

  const getUnitScaleFieldValues = useCallback((product: Product) => {
    if (product.unit === ProductUnit.pc) return '1';

    if (product.unitScaleValue && isFinite(product.unitScaleValue))
      return product.unitScaleValue;

    return '';
  }, []);

  const processRowUpdate = useCallback(
    async (updatedProduct: PriceTagGroup['products'][number]) => {
      const isPriceTagNameChanged =
        updatedProduct.priceTagName !==
        priceTagGroupDetails?.products.find(
          (product) => product.id === updatedProduct.id
        )?.priceTagName;

      if (!isPriceTagNameChanged) return updatedProduct;

      await updatePriceTagName(
        updatedProduct.id,
        updatedProduct.priceTagName || ''
      );
      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(groupId || ''),
        (oldData: PriceTagGroup) => {
          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product.id === updatedProduct.id ? updatedProduct : product
            ),
          };
        }
      );
      notify('success', 'Nazwa produktu na etykiecie została zaktualizowana');
      return updatedProduct;
    },
    [updatePriceTagName, queryClient, groupId, notify, priceTagGroupDetails]
  );

  const handleUpdateUnit = useCallback(
    async (productId: number, unit: ProductUnit) => {
      const updatedProduct = await updateUnit(productId, unit);
      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(groupId || ''),
        (oldData: PriceTagGroup) => {
          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product.id === productId ? updatedProduct : product
            ),
          };
        }
      );
      notify('success', 'Jednostka została zaktualizowana');
    },
    [updateUnit, notify, queryClient, groupId]
  );

  const handleUpdateUnitScale = useCallback(
    async (productId: number, unitScale: ProductUnitScale) => {
      const updatedProduct = await updateUnitScale(productId, unitScale);
      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(groupId || ''),
        (oldData: PriceTagGroup) => {
          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product.id === productId ? updatedProduct : product
            ),
          };
        }
      );
      notify('success', 'Skala została zaktualizowana');
    },
    [updateUnitScale, notify, queryClient, groupId]
  );

  const handleUpdateUnitScaleValue = useMemo(
    () =>
      debounce(async (productId: number, unitScaleValue: number | null) => {
        const updatedProduct = await updateUnitScaleValue(
          productId,
          unitScaleValue
        );
        queryClient.setQueryData(
          getPriceTagGroupDetailsQueryKey(groupId || ''),
          (oldData: PriceTagGroup) => {
            return {
              ...oldData,
              products: oldData.products.map((product) =>
                product.id === productId ? updatedProduct : product
              ),
            };
          }
        );
      }, 500),
    [updateUnitScaleValue, queryClient, groupId]
  );

  const columns: GridColDef<PriceTagGroup['products'][number]>[] = [
    {
      field: 'internalId',
      headerName: 'ID',
      sortable: false,
      width: 80,
    },
    {
      field: 'name',
      headerName: 'Nazwa produktu',
      minWidth: 200,
      flex: 1,
      sortable: false,
    },
    {
      field: 'priceTagName',
      headerName: 'Nazwa produktu na etykiecie',
      minWidth: 200,
      flex: 1,
      editable: true,
      sortable: false,
      preProcessEditCellProps: (params) => {
        if (params.props.value.length > 23) {
          return {
            ...params.props,
            error: 'Nazwa na etykiecie jest na dwie linijki',
          };
        }
        return { ...params, error: false };
      },
      renderEditCell: (params) => {
        return <NameEditInputCell {...params} />;
      },
      renderCell: (params) => {
        const isError = params.row.priceTagName.length > 23;
        return (
          <Typography
            variant="body2"
            color={isError ? 'error' : 'text.primary'}
            fontWeight={isError ? 600 : 400}
          >
            {params.row.priceTagName}
          </Typography>
        );
      },
    },
    {
      field: 'price',
      headerName: 'Cena na wybrany sklep',
      sortable: false,
      renderCell: (params) => {
        const branchData = params.row.branches.find(
          (b) => b.branch.id === branch?.id
        );
        return (
          <Typography>
            {formatPrice(branchData?.grossPrice ?? 0)} {'zł'}
          </Typography>
        );
      },
    },
    {
      field: 'unit',
      headerName: 'Jednostka',
      sortable: false,
      renderCell: ({ row }) => (
        <ToggleButtonGroup
          value={row.unit}
          exclusive
          size="small"
          onChange={(_event, unit) => handleUpdateUnit(row.id, unit)}
        >
          <ToggleButton value={ProductUnit.kg} sx={{ textTransform: 'none' }}>
            {'kg'}
          </ToggleButton>
          <ToggleButton value={ProductUnit.l} sx={{ textTransform: 'none' }}>
            {'l'}
          </ToggleButton>
          <ToggleButton value={ProductUnit.pc} sx={{ textTransform: 'none' }}>
            {'szt'}
          </ToggleButton>
        </ToggleButtonGroup>
      ),
    },
    {
      field: 'unitScale',
      headerName: 'Skala',
      sortable: false,
      renderCell: ({ row }) => (
        <>
          {row.unit === ProductUnit.kg && (
            <ToggleButtonGroup
              value={row.unitScale}
              exclusive
              size="small"
              onChange={(_event, unitScale) =>
                handleUpdateUnitScale(row.id, unitScale)
              }
            >
              <ToggleButton
                value={ProductUnitWeightScale.kg}
                sx={{ textTransform: 'none' }}
              >
                {'kg'}
              </ToggleButton>
              <ToggleButton
                value={ProductUnitWeightScale.g}
                sx={{ textTransform: 'none' }}
              >
                {'g'}
              </ToggleButton>
              <ToggleButton
                value={ProductUnitWeightScale.mg}
                sx={{ textTransform: 'none' }}
              >
                {'mg'}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {row.unit === ProductUnit.l && (
            <ToggleButtonGroup
              value={row.unitScale}
              exclusive
              size="small"
              onChange={(_event, unitScale) =>
                handleUpdateUnitScale(row.id, unitScale)
              }
            >
              <ToggleButton
                value={ProductUnitVolumeScale.l}
                sx={{ textTransform: 'none' }}
              >
                {'l'}
              </ToggleButton>
              <ToggleButton
                value={ProductUnitVolumeScale.ml}
                sx={{ textTransform: 'none' }}
              >
                {'ml'}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </>
      ),
    },
    {
      field: 'unitScaleValue',
      headerName: 'Rozmiar',
      sortable: false,
      minWidth: 120,
      renderCell: ({ row }) => {
        if (row.unit === ProductUnit.pc) return null;
        return (
          <TextField
            size="small"
            error={row.unitScaleValue === null}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{row.unitScale}</InputAdornment>
              ),
            }}
            defaultValue={getUnitScaleFieldValues(row)}
            onChange={(event) =>
              handleUpdateUnitScaleValue(
                row.id,
                event.target.value ? parseFloat(event.target.value) : null
              )
            }
          />
        );
      },
    },
    {
      field: 'pricePerFullUnit',
      headerName: 'Cena za pełną jednostkę',
      sortable: false,
      valueFormatter: (_value, row) => {
        const branchData = row.branches.find((b) => b.branch.id === branch?.id);
        if (!branchData) return '';
        const price = calcPricePerFullUnit({
          price: branchData?.grossPrice,
          productSizeInUnit: row.unitScaleValue,
          unit: row.unit,
          unitScale: row.unitScale,
        });
        return price
          ? `${formatPrice(price)} zł/${
              row.unit === ProductUnit.pc ? 'szt' : row.unit
            }`
          : '';
      },
    },
  ];

  const filteredProducts = useMemo(() => {
    if (!priceTagGroupDetails?.products) return [];

    if (!searchTerm.trim()) return priceTagGroupDetails.products;

    return priceTagGroupDetails.products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [priceTagGroupDetails?.products, searchTerm]);

  const productsWithoutFullUnitPriceAmount = useMemo(() => {
    const productsWithFullUnitPrice = filteredProducts.filter((product) => {
      return (
        product.priceTagName &&
        product.unit &&
        (product.unitScaleValue || product.unit === ProductUnit.pc) &&
        (product.unitScale || product.unit === ProductUnit.pc)
      );
    }).length;

    return (
      (priceTagGroupDetails?.products.length || 0) - productsWithFullUnitPrice
    );
  }, [filteredProducts, priceTagGroupDetails?.products.length]);

  const isSthToPrint = useMemo(() => {
    if (!priceTagGroupDetails) return false;
    return (
      productsWithoutFullUnitPriceAmount >=
      priceTagGroupDetails?.products.length
    );
  }, [priceTagGroupDetails, productsWithoutFullUnitPriceAmount]);

  const handleUpdateName = useCallback(async () => {
    setIsEditingName(false);
    if (!priceTagGroupName.trim()) return;
    await updatePriceTagGroup({ name: priceTagGroupName.trim() });
    notify('success', 'Nazwa grupy etykiet została zaktualizowana');
  }, [updatePriceTagGroup, priceTagGroupName, notify]);

  return (
    <Box>
      <Stack spacing={4}>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            href={`#${Pages.smSystemPriceTagsGroups}`}
          >
            {'Cofnij'}
          </Button>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h4" component="h1">
              {`Grupa etykiet: ${
                isEditingName ? '' : priceTagGroupDetails?.name
              }`}
            </Typography>
            {isEditingName && (
              <TextField
                value={priceTagGroupName}
                onChange={(e) => setPriceTagGroupName(e.target.value)}
              />
            )}
            {isEditingName && (
              <IconButton onClick={handleUpdateName}>
                <SaveIcon />
              </IconButton>
            )}
            <IconButton onClick={() => setIsEditingName((prev) => !prev)}>
              {isEditingName ? <CloseIcon /> : <EditIcon />}
            </IconButton>
            {isUpdatingPriceTagGroup && <CircularProgress size={20} />}
          </Stack>
          <Stack direction="row" spacing={4}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setIsDeletingPriceTagGroupModalOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {'Usuń grupę'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={generatePriceListPdf}
              disabled={isSthToPrint}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {'Drukuj cenówki'}
            </Button>
          </Stack>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Stack spacing={2}>
            <SelectBranch branch={branch} onBranchChange={setBranch} />
            <Stack direction="row" spacing={4}>
              <Typography variant="caption">
                {'Liczba produktów: ' + priceTagGroupDetails?.products.length}
              </Typography>
              <Typography
                variant="caption"
                color={
                  productsWithoutFullUnitPriceAmount > 0
                    ? 'error'
                    : 'text.primary'
                }
                fontWeight={productsWithoutFullUnitPriceAmount > 0 ? 600 : 400}
              >
                {'Bez ceny jednostkowej: ' + productsWithoutFullUnitPriceAmount}
              </Typography>
            </Stack>
          </Stack>

          <SinglePriceList
            branch={branch}
            product={filteredProducts[0] || null}
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <TextField
            label="Szukaj po nazwie produktu"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenChangingProductsModal(true)}
          >
            {'Zmień produkty'}
          </Button>
        </Box>
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          disableRowSelectionOnClick
          disableColumnFilter
          disableColumnMenu
          rows={filteredProducts}
          columns={columns}
          pageSizeOptions={[50]}
          loading={isLoading}
          processRowUpdate={processRowUpdate}
          localeText={{
            noRowsLabel: searchTerm.trim()
              ? 'Brak produktów pasujących do wyszukiwania'
              : 'Brak produktów w grupie, dodaj produkty',
          }}
        />
        <ChangeProductsToPriceTagGroupModal
          open={openChangingProductsModal}
          onClose={() => setOpenChangingProductsModal(false)}
          groupId={groupId}
          originallySelectedProductIds={
            priceTagGroupDetails?.products.map((product) => product.id) || []
          }
        />
        <ConfirmDeletingPriceGroupModal
          open={isDeletingPriceTagGroupModalOpen}
          onClose={() => setIsDeletingPriceTagGroupModalOpen(false)}
          groupId={groupId}
          groupName={priceTagGroupDetails?.name || ''}
        />
      </Stack>

      <div style={{ display: 'none' }}>
        <div ref={componentToPrintRef}>
          <PdfFullPriceList products={filteredProducts} branch={branch} />
        </div>
      </div>
    </Box>
  );
};
