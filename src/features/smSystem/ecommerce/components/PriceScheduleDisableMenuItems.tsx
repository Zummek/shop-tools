import { ListItemText, MenuItem } from '@mui/material';

type PriceScheduleDisableMenuItemsProps = {
  applied: boolean;
  plural?: boolean;
  onRevertNow: () => void;
  onRevertAtWindowEnd: () => void;
  onForce: () => void;
};

const itemSx = {
  alignItems: 'flex-start',
  whiteSpace: 'normal',
  maxWidth: 360,
  py: 1,
} as const;

const secondarySlotProps = {
  secondary: {
    variant: 'caption' as const,
    sx: { whiteSpace: 'normal', display: 'block' },
  },
};

const revertNowSecondary = (applied: boolean, plural: boolean) => {
  if (plural) {
    return applied
      ? 'Oferty z ceną tymczasową od razu wracają do bazowej.'
      : 'Wyłącza same harmonogramy. Ceny na ofertach się nie zmienią.';
  }
  return applied
    ? 'Cena na ofercie od razu wraca do bazowej.'
    : 'Wyłącza sam harmonogram. Cena na ofercie się nie zmieni.';
};

const windowEndSecondary = (applied: boolean, plural: boolean) => {
  if (!applied) {
    return plural
      ? 'Tylko gdy na którejś ofercie jest właśnie cena tymczasowa.'
      : 'Tylko gdy na ofercie jest właśnie cena tymczasowa.';
  }
  return plural
    ? 'Ceny tymczasowe zostają do końca okna, a potem wracają bazowe.'
    : 'Cena tymczasowa zostaje do końca okna, a potem wraca bazowa.';
};

export const PriceScheduleDisableMenuItems = ({
  applied,
  plural = false,
  onRevertNow,
  onRevertAtWindowEnd,
  onForce,
}: PriceScheduleDisableMenuItemsProps) => {
  const revertNowPrimary = applied
    ? 'Wyłącz i przywróć cenę bazową teraz'
    : 'Wyłącz';
  const forceSecondary = plural
    ? 'Zostawia ceny takie, jakie są. Gdy ofert nie da się zmienić, np. zostały usunięte.'
    : 'Zostawia cenę taką, jaka jest. Gdy oferty nie da się zmienić, np. została usunięta.';

  return (
    <>
      <MenuItem onClick={onRevertNow} sx={itemSx}>
        <ListItemText
          primary={revertNowPrimary}
          secondary={revertNowSecondary(applied, plural)}
          slotProps={secondarySlotProps}
        />
      </MenuItem>
      <MenuItem
        onClick={onRevertAtWindowEnd}
        disabled={!applied}
        sx={itemSx}
      >
        <ListItemText
          primary="Wyłącz — cena wróci po zakończeniu okna"
          secondary={windowEndSecondary(applied, plural)}
          slotProps={secondarySlotProps}
        />
      </MenuItem>
      <MenuItem onClick={onForce} sx={itemSx}>
        <ListItemText
          primary="Wyłącz bez zmiany ceny na kanale (wymuszone)"
          secondary={forceSecondary}
          slotProps={secondarySlotProps}
        />
      </MenuItem>
    </>
  );
};
