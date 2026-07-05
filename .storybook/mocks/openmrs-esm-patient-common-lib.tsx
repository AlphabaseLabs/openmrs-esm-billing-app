export { CardHeader } from '@openmrs/esm-patient-common-lib/src/cards/card-header.component';
export { ErrorState } from '@openmrs/esm-patient-common-lib/src/error-state';

export function useSystemVisitSetting() {
  return { systemVisitEnabled: false };
}

export function launchStartVisitPrompt() {
  return undefined;
}
