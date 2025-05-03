import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetBranches } from '../api/useGetBranches';
import { useGetProducts } from '../api/useGetProducts';
import { useGetSupplierDetails } from '../api/useGetSupplierDetails';
import { useUpdateSupplierDetails } from '../api/useUpdateSupplierDetails';
import BranchesInSupplierTable from '../tables/BranchesInSupplierTable';
import ProductsInSupplierTable from '../tables/ProductsInSupplierTable';

export const SupplierDetailsPage = () => {
  const getIdFromUrl = () => {
    const url = window.location.hash;
    const match = url.match(/suppliers\/(\d+)/);

    if (match) {
      const id = parseInt(match[1], 10);
      return Number.isInteger(id) ? id : 0;
    }
    return 0;
  };

  const id = getIdFromUrl();

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const { updateSupplierDetails, isSaving, isError: isErrorSaving } = useUpdateSupplierDetails();

  const {
    data: dataSupplierDetails,
    isLoading: isLoadingSupplierDetails,
    isError: isErrorSupplierDetails
  } = useGetSupplierDetails(id);

  const {
    data: dataProducts,
    isLoading: isLoadingProducts,
    isFetchingNextPage: isFetchingNextPageProducts,
    fetchNextPage: fetchNextPageProducts,
    isError: isErrorProducts,
  } = useGetProducts();

  const {
    data: dataBranches,
    isLoading: isLoadingBranches,
    isFetchingNextPage: isFetchingNextPageBranches,
    fetchNextPage: fetchNextPageBranches,
    isError: isErrorBranches,
  } = useGetBranches();

  const [pageProducts, setPageProducts] = useState(0);
  const [pageBranches, setPageBranches] = useState(0);

  useEffect(() => {
    if (dataSupplierDetails && dataSupplierDetails.detail !== 'No Supplier matches the given query.') {
      setSelectedBranches(dataSupplierDetails.branches.map(branch => branch.id));
      setSelectedProducts(dataSupplierDetails.products.map(product => product.id));
    }
  }, [dataSupplierDetails]);

  if (isLoadingSupplierDetails || isLoadingBranches || isLoadingProducts) {
      return (
        <Stack width="100%" alignItems="center" paddingTop={8}>
          <CircularProgress />
        </Stack>
      );
    }
  if (isErrorSupplierDetails || isErrorBranches || isErrorProducts) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Błąd pobierania danych'}
      </Typography>
    );
  }

  if (!dataSupplierDetails || !dataBranches) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Brak danych'}
      </Typography>
    );
  }

  if (isErrorSaving) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Błąd zapisu'}
      </Typography>
    );
  }
  
  if (dataSupplierDetails.detail === 'No Supplier matches the given query.') {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Nie znaleziono dostawcy o podanym ID'}
      </Typography>
    );
  }

  const handleCheckboxChange = (id: number) => {
    const isProductSelected = selectedProducts.includes(id);
    const updatedSelectedProducts = isProductSelected
      ? selectedProducts.filter(productId => productId !== id)
      : [...selectedProducts, id];
  
    setSelectedProducts(updatedSelectedProducts);
  };
  
  const handleCheckboxChangeB = (idB: number) => {
    const IsBranchSelected = selectedBranches.includes(idB);
    const updatedSelectedBranches = IsBranchSelected
      ? selectedBranches.filter(id => id !== idB)
      : [...selectedBranches, idB];
  
    setSelectedBranches(updatedSelectedBranches);
  };

  const handleSave = () => {
    if (selectedBranches.length > 0 && selectedProducts.length > 0) {
      const payload = {
        id: dataSupplierDetails.id,
        name: dataSupplierDetails.name,
        branches_ids: selectedBranches,
        products_ids: selectedProducts,
      };
      updateSupplierDetails(payload);
    }
  };
    

  return (
    <Stack>
      <Stack width='100%' spacing={2} alignItems='center' height={491} >
        <Typography
          variant="h5"
          color="primary"
          sx={{ width: '100%', textAlign: 'center' }}
        >
          {dataSupplierDetails.name}
        </Typography>
        <Stack spacing={2} direction='row'>
          <ProductsInSupplierTable data={dataProducts} isFetchingNextPage={isFetchingNextPageProducts} fetchNextPage={fetchNextPageProducts} page={pageProducts} setPage={setPageProducts} selectedProducts={selectedProducts} handleCheckboxChange={handleCheckboxChange} />
          <BranchesInSupplierTable data={dataBranches} isFetchingNextPage={isFetchingNextPageBranches} fetchNextPage={fetchNextPageBranches} page={pageBranches} setPage={setPageBranches} selectedBranches={selectedBranches} handleCheckboxChange={handleCheckboxChangeB} />
        </Stack>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </Stack>
    </Stack>
  );
};
