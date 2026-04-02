import { useCallback, useEffect } from 'react';
import { launchWorkspace2, launchWorkspaceGroup2, showModal, useVisit, useFeatureFlag } from '@openmrs/esm-framework';
import { launchStartVisitPrompt, useSystemVisitSetting } from '@openmrs/esm-patient-common-lib';

export const billingWorkspaceGroupName = 'billing-workspace-group';

export function initializeBillingWorkspaceGroup(groupProps?: Record<string, unknown> | null) {
  return launchWorkspaceGroup2(billingWorkspaceGroupName, groupProps ?? null);
}

export function useInitializeBillingWorkspaceGroup(groupProps?: Record<string, unknown> | null) {
  useEffect(() => {
    initializeBillingWorkspaceGroup(groupProps);
  }, [groupProps]);
}

export function launchBillingWorkspace<WorkspaceProps extends object>(
  workspaceName: string,
  workspaceProps?: WorkspaceProps | null,
) {
  initializeBillingWorkspaceGroup();
  return launchWorkspace2(workspaceName, workspaceProps ?? null);
}

export function useLaunchBillingWorkspaceRequiringVisit<WorkspaceProps extends object>(
  patientUuid: string,
  workspaceName: string,
) {
  const { systemVisitEnabled } = useSystemVisitSetting();
  const { currentVisit, activeVisit } = useVisit(patientUuid);
  const isRdeEnabled = useFeatureFlag('rde');
  const visitContext = currentVisit ?? activeVisit;

  return useCallback(
    (workspaceProps?: WorkspaceProps) => {
      const launchWorkspace = () => launchBillingWorkspace(workspaceName, workspaceProps ?? null);

      if (!systemVisitEnabled || visitContext) {
        return launchWorkspace();
      }

      if (isRdeEnabled) {
        const dispose = showModal('visit-context-switcher', {
          patientUuid,
          closeModal: () => dispose(),
          onAfterVisitSelected: launchWorkspace,
          size: 'sm',
        });

        return;
      }

      launchStartVisitPrompt();
    },
    [visitContext, isRdeEnabled, patientUuid, systemVisitEnabled, workspaceName],
  );
}
