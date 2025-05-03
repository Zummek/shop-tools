import { CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { SetStateAction, useEffect, useState } from 'react';

import { useGetSuppliers } from '../api/useGetSuppliers';
import SuppliersTable from '../tables/SuppliersTable';

export const SuppliersPage = () => {
  const [page, setPage] = useState(0);
  const [name, setName] = useState<string>('');
  const [nameToSearch, setNameToSearch] = useState<string>('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    name: searchedName,
  } = useGetSuppliers(nameToSearch);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setNameToSearch((event.target as HTMLInputElement).value);
      setPage(0);
    }
  };

  const handleChange = (event: { target: { value: SetStateAction<string> } }) => {
    const value = event.target.value;
    if (value==='')
      setNameToSearch('')
    setName(value);
  };

  useEffect(() => {
    if (searchedName) 
      setName(searchedName);    
  }, [searchedName]);

  if (isError) {
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
  if (!data && isLoading) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack width="100%" alignItems="center">
      <Stack width={670} height={435} spacing={1}>
        <SuppliersTable data={data} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} page={page} setPage={setPage} />
        <TextField
          label="Wyszukaj"
          variant="outlined"
          value={name}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          sx={{
            width: '180px',
          }}
        />
      </Stack>
    </Stack>
  );
};
