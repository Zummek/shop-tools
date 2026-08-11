import {
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { modalStyle } from '../../../../../components';
import {
  useGetAllegroConnection,
  useGetErliConnection,
  useGetWooCommerceConnection,
  useImportAllegroOrders,
  useImportErliOrders,
  useImportWooCommerceOrders,
} from '../../api';

import { ImportEcommerceOrderModalImportedDetailsStep } from './ImportEcommerceOrderModalImportedDetailsStep';
import {
  ImportEcommerceOrderModalImportingStep,
  OnImportFn,
} from './ImportEcommerceOrderModalImportingStep';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ImportChannel = 'allegro' | 'woocommerce' | 'erli';

const CHANNEL_NOTES: Record<ImportChannel, string> = {
  woocommerce:
    'WooCommerce: importowane są wszystkie statusy zamówień. Statusy synchronizują się w obie strony (SM ↔ Woo) — przy konflikcie system zapyta o decyzję.',
  erli: 'Erli: importowane są tylko opłacone zamówienia (purchased). Statusy nie są synchronizowane z Erli.',
  allegro:
    'Allegro: importowane są tylko nowe zamówienia (NEW). Statusy nie są synchronizowane z Allegro.',
};

const CHANNEL_LABELS: Record<ImportChannel, string> = {
  allegro: 'Allegro',
  woocommerce: 'WooCommerce',
  erli: 'Erli',
};

export const ImportEcommerceOrderModal = ({ open, onClose }: Props) => {
  const { allegroConnection } = useGetAllegroConnection();
  const { wooCommerceConnection } = useGetWooCommerceConnection();
  const { erliConnection } = useGetErliConnection();

  const allegroConnected = !!allegroConnection?.isConnected;
  const wooConnected = !!wooCommerceConnection?.isConnected;
  const erliConnected = !!erliConnection?.isConnected;

  const availableChannels = useMemo(() => {
    const channels: ImportChannel[] = [];
    if (allegroConnected) channels.push('allegro');
    if (wooConnected) channels.push('woocommerce');
    if (erliConnected) channels.push('erli');
    return channels;
  }, [allegroConnected, wooConnected, erliConnected]);

  const [selectedChannels, setSelectedChannels] = useState<ImportChannel[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedChannels((prev) => {
      const stillAvailable = prev.filter((c) => availableChannels.includes(c));
      if (stillAvailable.length > 0) return stillAvailable;
      return [...availableChannels];
    });
  }, [open, availableChannels]);

  const {
    importAllegroOrders,
    isPending: isAllegroPending,
    importAllegroOrdersData,
    resetAllegroOrdersData,
  } = useImportAllegroOrders();

  const {
    importWooCommerceOrders,
    isPending: isWooPending,
    importWooCommerceOrdersData,
    resetWooCommerceOrdersData,
  } = useImportWooCommerceOrders();

  const {
    importErliOrders,
    isPending: isErliPending,
    importErliOrdersData,
    resetErliOrdersData,
  } = useImportErliOrders();

  const isPending = isAllegroPending || isWooPending || isErliPending;

  const allSelected =
    availableChannels.length > 0 &&
    availableChannels.every((c) => selectedChannels.includes(c));
  const someSelected = selectedChannels.length > 0 && !allSelected;

  const importResult = useMemo(() => {
    if (isPending) return null;

    const hasAnyResult =
      !!importAllegroOrdersData ||
      !!importWooCommerceOrdersData ||
      !!importErliOrdersData;
    if (!hasAnyResult) return null;

    return {
      createdOrdersIds: [
        ...(importAllegroOrdersData?.createdOrdersIds ?? []),
        ...(importWooCommerceOrdersData?.createdOrdersIds ?? []),
        ...(importErliOrdersData?.createdOrdersIds ?? []),
      ],
      updatedOrdersIds: importWooCommerceOrdersData
        ? (importWooCommerceOrdersData.updatedOrdersIds ?? [])
        : undefined,
      errors: [
        ...(importAllegroOrdersData?.errors ?? []),
        ...(importWooCommerceOrdersData?.errors ?? []),
        ...(importErliOrdersData?.errors ?? []),
      ],
    };
  }, [
    isPending,
    importAllegroOrdersData,
    importWooCommerceOrdersData,
    importErliOrdersData,
  ]);

  const toggleChannel = (channel: ImportChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedChannels(checked ? [...availableChannels] : []);
  };

  const handleImportEcommerceOrders: OnImportFn = async ({
    dateFrom,
    dateTo,
  }) => {
    if (selectedChannels.length === 0) return;
    const payload = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };

    await Promise.allSettled(
      selectedChannels.map(async (channel) => {
        if (channel === 'woocommerce') await importWooCommerceOrders(payload);
        else if (channel === 'erli') await importErliOrders(payload);
        else await importAllegroOrders(payload);
      }),
    );
  };

  const handleCloseModal = () => {
    onClose();
    resetAllegroOrdersData();
    resetWooCommerceOrdersData();
    resetErliOrdersData();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Stack sx={modalStyle({ width: 600 })} spacing={4}>
        <Typography variant="h4" align="center">
          {'Importuj zamówienia'}
        </Typography>

        {!importResult && availableChannels.length > 1 && (
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {'Wybierz platformy'}
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    disabled={isPending}
                  />
                }
                label="Wszystkie"
                disabled={isPending}
              />
              {availableChannels.map((channel) => (
                <FormControlLabel
                  key={channel}
                  control={
                    <Checkbox
                      checked={selectedChannels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      disabled={isPending}
                    />
                  }
                  label={CHANNEL_LABELS[channel]}
                  disabled={isPending}
                />
              ))}
            </FormGroup>
          </Stack>
        )}

        {!importResult &&
          selectedChannels.map((channel) => (
            <Alert key={channel} severity="info">
              {CHANNEL_NOTES[channel]}
            </Alert>
          ))}

        {importResult ? (
          <ImportEcommerceOrderModalImportedDetailsStep
            createdOrdersIds={importResult.createdOrdersIds}
            updatedOrdersIds={importResult.updatedOrdersIds}
            errors={importResult.errors}
            onClose={handleCloseModal}
          />
        ) : (
          <ImportEcommerceOrderModalImportingStep
            onImport={handleImportEcommerceOrders}
            onClose={handleCloseModal}
            isPending={isPending || selectedChannels.length === 0}
          />
        )}
      </Stack>
    </Modal>
  );
};
