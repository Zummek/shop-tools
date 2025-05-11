import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

import { useGetBranches } from '../api';

interface BranchSelectorProps {
  selectedBranchId: number | null;
  onChange: (branchId: number) => void;
  label?: string;
  error?: string;
}

export const BranchSelector = ({
  selectedBranchId,
  onChange,
  label,
  error,
}: BranchSelectorProps) => {
  const { branches, isLoading } = useGetBranches();

  return (
    <FormControl>
      <InputLabel shrink error={!!error}>
        {label}
      </InputLabel>
      <Select
        disabled={isLoading}
        value={selectedBranchId}
        onChange={(event) => onChange(event.target.value as number)}
        sx={{ width: 200 }}
        error={!!error}
        label={label}
      >
        {branches?.results?.map((branch) => (
          <MenuItem key={branch.id} value={branch.id}>
            {branch.name}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
};
