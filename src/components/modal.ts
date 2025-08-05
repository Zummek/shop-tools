export const modalStyle = ({ width }: { width: number }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  paddingX: 6,
  paddingY: 4,
  width,
  display: 'flex',
  flexDirection: 'column',
});
