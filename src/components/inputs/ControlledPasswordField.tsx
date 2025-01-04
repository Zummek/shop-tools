import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { IconButton } from '@mui/material';
import { forwardRef, useState } from 'react';

import {
  ControlledTextField,
  ControlledTextFieldProps,
  TextInputRef,
} from './ControlledTextField';

export const ControlledPasswordField = forwardRef<
  TextInputRef,
  ControlledTextFieldProps
>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <ControlledTextField
      margin="normal"
      fullWidth
      alwaysShowLabel
      type={showPassword ? 'text' : 'password'}
      autoCapitalize="off"
      endIcon={
        <IconButton
          aria-label="toggle password visibility"
          onClick={handleClickShowPassword}
          onMouseDown={handleMouseDownPassword}
          edge="end"
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      }
      {...props}
      ref={ref}
    />
  );
});
