export enum TransferStatusEnum {
  PREPARING = 'PREPARING',
  PREPARED = 'PREPARED',
  RECEIVED = 'RECEIVED',
  POSTED = 'POSTED',
  CANCELED = 'CANCELED',
}

export const transferStatusColors: Record<TransferStatusEnum, string> = {
  PREPARING: 'black',
  PREPARED: 'black',
  RECEIVED: 'blue',
  POSTED: 'green',
  CANCELED: 'red',
};

export const getTransferStatusColor = (
  toTransferAmount: number,
  receivedAmount: number
) => {
  if (toTransferAmount === receivedAmount) return 'green';
  if (toTransferAmount > receivedAmount) return 'red';
  if (toTransferAmount < receivedAmount) return '#a88132';
  return 'black';
};
