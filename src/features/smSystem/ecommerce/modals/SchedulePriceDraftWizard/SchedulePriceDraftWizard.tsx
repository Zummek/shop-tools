import { useState } from 'react';

import { ChannelProductLink } from '../../types/channelLinks';
import { PriceScheduleWindow } from '../../types/priceSchedules';
import { BulkSchedulePriceDraftModal } from '../BulkSchedulePriceDraftModal/BulkSchedulePriceDraftModal';
import { SelectAllegroOfferForScheduleModal } from '../SelectAllegroOfferForScheduleModal/SelectAllegroOfferForScheduleModal';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when at least one draft was saved, including a partial batch. */
  onCreated?: (createdCount: number) => void;
  initialLinks?: ChannelProductLink[];
  initialWindows?: PriceScheduleWindow[];
  initialStep?: 'pick' | 'settings';
  discountFromScheduleId?: number | null;
}

const WizardSteps = ({
  onClose,
  onCreated,
  initialLinks = [],
  initialWindows = [],
  initialStep = 'pick',
  discountFromScheduleId = null,
}: Omit<Props, 'open'>) => {
  const [step, setStep] = useState<'pick' | 'settings'>(initialStep);
  const [links, setLinks] = useState<ChannelProductLink[]>(initialLinks);
  const [windows, setWindows] =
    useState<PriceScheduleWindow[]>(initialWindows);

  if (step === 'pick') {
    return (
      <SelectAllegroOfferForScheduleModal
        open
        initialSelected={links}
        onClose={onClose}
        onConfirm={(nextLinks) => {
          setLinks(nextLinks);
          setStep('settings');
        }}
      />
    );
  }
  return (
    <BulkSchedulePriceDraftModal
      open
      links={links}
      windows={windows}
      onWindowsChange={setWindows}
      onLinksChange={setLinks}
      onBack={() => setStep('pick')}
      onClose={onClose}
      discountFromScheduleId={discountFromScheduleId}
      onCreated={(createdCount) => onCreated?.(createdCount)}
    />
  );
};

export const SchedulePriceDraftWizard = ({ open, ...rest }: Props) =>
  open ? <WizardSteps {...rest} /> : null;
