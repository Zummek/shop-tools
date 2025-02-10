import { Stack, Step, StepLabel, Stepper } from '@mui/material';
import { useState } from 'react';

import { ImportProductsStep1 } from './ImportProductsStep1';
import { ImportProductsStep2 } from './ImportProductsStep2';
import { ImportProductsStep3 } from './ImportProductsStep3';
import { ImportProductsStep4 } from './ImportProductsStep4';

const steps = [
  'Wybierz plik',
  'Przedgląd produktów',
  'Przedgląd kategorii',
  'Import',
];

export const ImportProductsPage = () => {
  const [activeStep, setActiveStep] = useState(0);

  const isStepComplete = (step: number) => step < activeStep;

  return (
    <Stack spacing={2}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={label} completed={isStepComplete(index)}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === 0 && (
        <ImportProductsStep1 onNextStep={() => setActiveStep(1)} />
      )}
      {activeStep === 1 && (
        <ImportProductsStep2 onNextStep={() => setActiveStep(2)} />
      )}
      {activeStep === 2 && (
        <ImportProductsStep3 onNextStep={() => setActiveStep(3)} />
      )}
      {activeStep === 3 && <ImportProductsStep4 />}
    </Stack>
  );
};
