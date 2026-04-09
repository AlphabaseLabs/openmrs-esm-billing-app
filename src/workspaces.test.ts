import { launchWorkspace2, launchWorkspaceGroup2 } from '@openmrs/esm-framework';
import {
  billingPatientSearchWorkspaceName,
  billingWorkspaceGroupName,
  launchCreateBillWorkspace,
  mergePatientChartBillingFormProps,
} from './workspaces';

jest.mock('@openmrs/esm-framework', () => ({
  launchWorkspace2: jest.fn(),
  launchWorkspaceGroup2: jest.fn(),
  showModal: jest.fn(),
  useFeatureFlag: jest.fn(),
  useVisit: jest.fn(),
}));

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  launchStartVisitPrompt: jest.fn(),
  useSystemVisitSetting: jest.fn(),
}));

describe('launchCreateBillWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens patient search and launches the standalone billing form after patient selection', () => {
    const t = jest.fn((key, defaultValue) => defaultValue);

    launchCreateBillWorkspace(t);

    expect(launchWorkspaceGroup2).toHaveBeenCalledWith(billingWorkspaceGroupName, null);
    expect(launchWorkspace2).toHaveBeenCalledWith(
      billingPatientSearchWorkspaceName,
      expect.objectContaining({
        hideActionsOverflow: true,
        initialQuery: '',
        primaryActionLabel: 'Create Bill',
        primaryActionMode: 'selectPatient',
        workspaceTitle: 'Create Bill',
        onPatientSelected: expect.any(Function),
      }),
      {
        startVisitWorkspaceName: 'billing-form',
      },
    );

    const [, workspaceProps] = (launchWorkspace2 as jest.Mock).mock.calls[0];
    const launchChildWorkspace = jest.fn();
    const closeSearchWorkspace = jest.fn();

    workspaceProps.onPatientSelected(
      'patient-uuid',
      { id: 'patient-uuid' },
      launchChildWorkspace,
      closeSearchWorkspace,
    );

    expect(launchChildWorkspace).toHaveBeenCalledWith(
      'billing-form',
      mergePatientChartBillingFormProps({
        patientUuid: 'patient-uuid',
        workspaceTitle: 'Create Bill',
        onSuccess: expect.any(Function),
      }),
    );

    const [, launchedBillingFormProps] = launchChildWorkspace.mock.calls[0];
    launchedBillingFormProps.onSuccess();

    expect(closeSearchWorkspace).toHaveBeenCalledWith({ discardUnsavedChanges: true });
  });
});
