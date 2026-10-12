import { useEffect, useState } from 'react';

import { ChannelProductLink } from '../../types/channelLinks';
import { PriceScheduleWindow } from '../../types/priceSchedules';
import { BulkSchedulePriceDraftModal } from '../BulkSchedulePriceDraftModal/BulkSchedulePriceDraftModal';
import { SelectAllegroOfferForScheduleModal } from '../SelectAllegroOfferForScheduleModal/SelectAllegroOfferForScheduleModal';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when at least one draft was saved, including a partial batch. */
  onCreated?: (createdCount: number) => void;
}

export const SchedulePriceDraftWizard = ({
  open,
  onClose,
  onCreated,
}: Props) => {
  const [step, setStep] = useState<'pick' | 'settings'>('pick');
  const [links, setLinks] = useState<ChannelProductLink[]>([]);
  const [windows, setWindows] = useState<PriceScheduleWindow[]>([]);

  useEffect(() => {
    if (open) return;
    setStep('pick');
    setLinks([]);
    setWindows([]);
  }, [open]);

  return (
    <>
      {open && step === 'pick' && (
        <SelectAllegroOfferForScheduleModal
          open
          initialSelected={links}
          onClose={onClose}
          onConfirm={(nextLinks) => {
            setLinks(nextLinks);
            setStep('settings');
          }}
        />
      )}
      {open && step === 'settings' && (
        <BulkSchedulePriceDraftModal
          open
          links={links}
          windows={windows}
          onWindowsChange={setWindows}
          onLinksChange={setLinks}
          onBack={() => setStep('pick')}
          onClose={onClose}
          onCreated={(createdCount) => onCreated?.(createdCount)}
        />
      )}
    </>
  );
};
