import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';

import { BranchListItem, useGetBranches } from '../../branches/api';

interface Props {
  branch: BranchListItem | null;
  onBranchChange: (branch: BranchListItem | null) => void;
}

export const SelectBranch = ({ branch, onBranchChange }: Props) => {
  const { branches } = useGetBranches({
    defaultPageSize: 1000,
  });

  useEffect(() => {
    if (branches?.results?.length && !branch)
      onBranchChange(branches.results[0]);
  }, [branch, branches?.results, onBranchChange]);

  const setBranch = (newBranchId: number) => {
    const newBranch = branches?.results?.find((b) => b.id === newBranchId);

    onBranchChange(newBranch ?? null);
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="body1">{'Sklep: '}</Typography>
      <ToggleButtonGroup
        value={branch?.id ?? null}
        exclusive
        size="small"
        onChange={(_event, branchId) => setBranch(branchId)}
      >
        {branches?.results?.map((branch) => (
          <ToggleButton
            key={branch.id}
            value={branch.id}
            sx={{ textTransform: 'none' }}
          >
            {branch.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};
