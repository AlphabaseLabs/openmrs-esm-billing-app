import { configSchema } from './config-schema';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { createLeftPanelLink } from './left-panel-link.component';
import { dashboardMeta } from './dashboard.meta';
import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@openmrs/esm-framework';
import appMenu from './billable-services/billable-services-menu-item/item.component';
import BillableServiceHome from './billable-services/billable-services-home.component';
import BillableServicesCardLink from './billable-services-admin-card-link.component';
import BillHistory from './bill-history/bill-history.component';
import BillingForm from './billing-form/billing-form.component';
import BillingCheckInForm from './billing-form/billing-checkin-form.component';
import RequirePaymentModal from './modal/require-payment-modal.component';
import RootComponent from './root.component';
import ServiceMetrics from './billable-services/dashboard/service-metrics.component';
import VisitAttributeTags from './invoice/payments/visit-tags/visit-attribute.component';
import { ClockIn } from './payment-points/payment-point/clock-in.modal';
import { createDashboardGroup } from './app-navigation/nav-utils';
import { Money } from '@carbon/react/icons';
import BillDepositSearch from './bill-deposit/components/search/bill-deposit-search.component';
import AddDepositWorkspace from './bill-deposit/components/forms/add-deposit.workspace';
import DeleteDepositModal from './bill-deposit/components/modal/delete-deposit.modal';
import DepositTransactionWorkspace from './bill-deposit/components/forms/deposit-transactions/deposit-transaction.workspace';
import ReverseTransactionModal from './bill-deposit/components/modal/reverse-transaction.modal';
import { ClockOut } from './payment-points/payment-point/clock-out.modal';
import { CreatePaymentPoint } from './payment-points/create-payment-point.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@openmrs/esm-billing-app';
const options = {
  featureName: 'billing',
  moduleName,
};

// t('Accounting', 'Accounting')
export const billingDashboardNavGroup = getSyncLifecycle(
  createDashboardGroup({
    slotName: 'billing-dashboard-group-nav-slot',
    title: 'Accounting',
    icon: null,
    isExpanded: false,
  }),
  options,
);

// Dashboard Links
export const billingSummaryDashboardLink = getSyncLifecycle(
  createDashboardLink({ ...dashboardMeta, icon: 'omrs-icon-money', moduleName }),
  options,
);

// Navigation Links
// t('overview', 'Overview')
export const billingOverviewLink = getSyncLifecycle(
  createLeftPanelLink({
    name: '',
    title: 'Overview',
  }),
  options,
);

// t('Bill Deposit', 'Bill Deposit')
export const billDepositDashboardLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'bill-deposit',
    title: 'Bill Deposit',
  }),
  options,
);

// t('Payment Points', 'Payment Points')
export const paymentPointsLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'payment-points',
    title: 'Payment Points',
  }),
  options,
);

// Core Components
export const root = getSyncLifecycle(RootComponent, options);
export const billingPatientSummary = getSyncLifecycle(BillHistory, options);
export const billingCheckInForm = getSyncLifecycle(BillingCheckInForm, options);
export const billingForm = getSyncLifecycle(BillingForm, options);
export const billingDashboard = getAsyncLifecycle(
  () => import('./billing-dashboard/billing-dashboard.component'),
  options,
);

// Bill Deposit Components
export const billDepositSearch = getSyncLifecycle(BillDepositSearch, options);
export const addDepositWorkspace = getSyncLifecycle(AddDepositWorkspace, options);
export const deleteDepositModal = getSyncLifecycle(DeleteDepositModal, options);
export const depositTransactionWorkspace = getSyncLifecycle(DepositTransactionWorkspace, options);
export const reverseTransactionModal = getSyncLifecycle(ReverseTransactionModal, options);

// Payment Points Components
export const createPaymentPoint = getSyncLifecycle(CreatePaymentPoint, options);
export const clockIn = getSyncLifecycle(ClockIn, options);
export const clockOut = getSyncLifecycle(ClockOut, options);

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Dont know
export const billableServicesAppMenuItem = getSyncLifecycle(appMenu, options);

// Admin Dashboard Card
export const billableServicesCardLink = getSyncLifecycle(BillableServicesCardLink, options);

// Billable Services Home
export const billableServicesHome = getSyncLifecycle(BillableServiceHome, options);

export const requirePaymentModal = getSyncLifecycle(RequirePaymentModal, options);

export const serviceMetrics = getSyncLifecycle(ServiceMetrics, options);

export const visitAttributeTags = getSyncLifecycle(VisitAttributeTags, options);

export const editBillLineItemDialog = getAsyncLifecycle(() => import('./bill-item-actions/edit-bill-item.component'), {
  featureName: 'edit bill line item',
  moduleName,
});
