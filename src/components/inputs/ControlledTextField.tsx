import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';
import {
  useController,
  UseControllerProps,
  useFormContext,
} from 'react-hook-form';

export type TextInputRef = HTMLInputElement;

export type ControlledTextFieldProps = TextFieldProps & {
  name: string;
  rules?: UseControllerProps['rules'];
  defaultValue?: UseControllerProps['defaultValue'];
  alwaysShowLabel?: boolean;
  endIcon?: React.ReactNode;
};

export const ControlledTextField = forwardRef<
  TextInputRef,
  ControlledTextFieldProps
>(
  (
    {
      name,
      rules,
      defaultValue,
      helperText,
      disabled,
      alwaysShowLabel,
      endIcon,
      ...inputProps
    },
    ref
  ) => {
    const { formState } = useFormContext();
    const {
      field: { onChange, ...field },
    } = useController({ name, rules, defaultValue });

    const error = formState.errors[name]?.message?.toString();
    const isLoading = formState.isSubmitting;

    return (
      <TextField
        {...inputProps}
        {...field}
        defaultChecked={field.value}
        ref={ref}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        disabled={isLoading || disabled}
        helperText={error || helperText}
        InputProps={{
          endAdornment: !!endIcon && (
            <InputAdornment position="end">{endIcon}</InputAdornment>
          ),
        }}
        InputLabelProps={{
          shrink: alwaysShowLabel,
        }}
      />
    );
  }
);
