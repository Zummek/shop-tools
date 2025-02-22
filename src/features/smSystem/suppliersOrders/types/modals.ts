import {IdName} from './index';

export interface BasicModalProps {
  open: boolean;
  handleClose: () => void;
}

export interface AddOrderModalProps extends BasicModalProps {
  suppliers: IdName[],
  branches: IdName[],
}