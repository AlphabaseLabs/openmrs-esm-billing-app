import { configSchema } from './config-schema';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle } from '@openmrs/esm-framework';
import { dashboardMeta } from './dashboard.meta';

// Dashboard and Navigation Components
import { createDashboardGroup } from './app-navigation/nav-utils';
import { createLeftPanelLink } from './left-panel-link.component';
import RootComponent from './root.component';

import BillableServicesCardLink from './billable-services-admin-card-link.component';

// Billing Core Components
import BillingForm from './billing-form/billing-form.component';
import BillingCheckInForm from './billing-form/billing-checkin-form.component';
import BillHistory from './bill-history/bill-history.component';

// Bill Manager Components
import CancelLineItem from './billable-services/bill-manager/bill-actions/cancel-line-item.component';
import DeleteBillActionButton from './billable-services/bill-manager/bill-actions/delete-bill-action-button.component';
import EditLineItem from './billable-services/bill-manager/bill-actions/edit-line-item.component';
import RefundLineItem from './billable-services/bill-manager/bill-actions/refund-line-item.component';
import WaiveBillActionButton from './billable-services/bill-manager/bill-actions/waive-bill-action-button.component';
import { DeleteBillModal } from './billable-services/bill-manager/modals/delete-bill.modal';
import { RefundBillModal } from './billable-services/bill-manager/modals/refund-bill.modal';
import BillActionModal from './modal/bill-action.modal';
import DeleteBillableServiceModal from './billable-services/bill-manager/modals/delete-billable-service.modal';
import CancelBillWorkspace from './billable-services/bill-manager/workspaces/cancel-bill/cancel-bill.workspace';
import { EditBillForm } from './billable-services/bill-manager/workspaces/edit-bill/edit-bill-form.workspace';
import { WaiveBillForm } from './billable-services/bill-manager/workspaces/waive-bill/waive-bill-form.workspace';
import CreateBillWorkspace from './billable-services/bill-manager/workspaces/create-bill/create-bill.workspace';

// Billable Services Components
import CommodityForm from './billable-services/billables/commodity/commodity-form.workspace';
import AddServiceForm from './billable-services/billables/services/service-form.workspace';
import { BulkImportBillableServices } from './billable-services/bulk-import-billable-service.modal';

// Order Components
import DrugOrder from './billable-services/billiable-item/drug-order/drug-order.component';
import ImagingOrder from './billable-services/billiable-item/test-order/imaging-order.component';
import LabOrder from './billable-services/billiable-item/test-order/lab-order.component';
import PriceInfoOrder from './billable-services/billiable-item/test-order/price-info-order.componet';
import ProcedureOrder from './billable-services/billiable-item/test-order/procedure-order.component';
import OrderActionButton from './billable-services/billiable-item/order-actions/components/order-action-button.component';

// Payment Points Components
import { CreatePaymentPoint } from './payment-points/create-payment-point.component';
import { ClockIn } from './payment-points/payment-point/clock-in.modal';
import { ClockOut } from './payment-points/payment-point/clock-out.modal';

// Bill Deposit Components
import BillDepositSearch from './bill-deposit/components/search/bill-deposit-search.component';
import AddDepositWorkspace from './bill-deposit/components/forms/add-deposit.workspace';
import DeleteDepositModal from './bill-deposit/components/modal/delete-deposit.modal';
import DepositTransactionWorkspace from './bill-deposit/components/forms/deposit-transactions/deposit-transaction.workspace';
import ReverseTransactionModal from './bill-deposit/components/modal/reverse-transaction.modal';

import VisitAttributeTags from './invoice/payments/visit-tags/visit-attribute.component';
import DeletePaymentModeModal from './payment-modes/delete-payment-mode.modal';
import PaymentModeWorkspace from './payment-modes/payment-mode.workspace';
import RequirePaymentModal from './prompt-payment/prompt-payment-modal.component';

// Print Preview Components
import PrintPreviewModal from './print-preview/print-preview.modal';
import PaymentWorkspace from './invoice/payments/payment-form/payment.workspace';
import DeletePaymentWorkspace from './invoice/payments/delete-payment/delete-payment.workspace';

// Translation
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

// t('Payment History', 'Payment History')
export const paymentHistoryLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'payment-history',
    title: 'Payment History',
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

// t('Payment Modes', 'Payment Modes')
export const paymentModesLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'payment-modes',
    title: 'Payment Modes',
  }),
  options,
);

// t('Bill Manager', 'Bill Manager')
export const billManagerLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'bill-manager',
    title: 'Bill Manager',
  }),
  options,
);
// t('Charge Items', 'Charge Items')
export const chargeableItemsLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'charge-items',
    title: 'Charge Items',
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

// Bill Manager Components
export const deleteBillableServiceModal = getSyncLifecycle(DeleteBillableServiceModal, options);
export const createBillWorkspace = getSyncLifecycle(CreateBillWorkspace, options);
export const deleteBillModal = getSyncLifecycle(DeleteBillModal, options);
export const waiveBillForm = getSyncLifecycle(WaiveBillForm, options);
export const editBillForm = getSyncLifecycle(EditBillForm, options);
export const refundBillModal = getSyncLifecycle(RefundBillModal, options);
export const billActionModal = getSyncLifecycle(BillActionModal, options);
export const cancelBillWorkspace = getSyncLifecycle(CancelBillWorkspace, options);
export const waiveBillActionButton = getSyncLifecycle(WaiveBillActionButton, options);
export const deleteBillActionButton = getSyncLifecycle(DeleteBillActionButton, options);
export const refundLineItem = getSyncLifecycle(RefundLineItem, options);
export const cancelLineItem = getSyncLifecycle(CancelLineItem, options);
export const editLineItem = getSyncLifecycle(EditLineItem, options);

// Order Components
export const labOrder = getSyncLifecycle(LabOrder, options);
export const priceInfoOrder = getSyncLifecycle(PriceInfoOrder, options);
export const procedureOrder = getSyncLifecycle(ProcedureOrder, options);
export const imagingOrder = getSyncLifecycle(ImagingOrder, options);
export const drugOrder = getSyncLifecycle(DrugOrder, options);
export const orderActionButton = getSyncLifecycle(OrderActionButton, options);

// Payment Components
export const requirePaymentModal = getSyncLifecycle(RequirePaymentModal, options);
export const visitAttributeTags = getSyncLifecycle(VisitAttributeTags, options);
// export const initiatePaymentDialog = getSyncLifecycle(InitiatePaymentDialog, options);
export const paymentModeWorkspace = getSyncLifecycle(PaymentModeWorkspace, options);
export const deletePaymentModeModal = getSyncLifecycle(DeletePaymentModeModal, options);
export const paymentWorkspace = getSyncLifecycle(PaymentWorkspace, options);
export const deletePaymentWorkspace = getSyncLifecycle(DeletePaymentWorkspace, options);

// Payment Points Components
export const createPaymentPoint = getSyncLifecycle(CreatePaymentPoint, options);
export const clockIn = getSyncLifecycle(ClockIn, options);
export const clockOut = getSyncLifecycle(ClockOut, options);

// Service Management Components
export const addServiceForm = getSyncLifecycle(AddServiceForm, options);
export const addCommodityForm = getSyncLifecycle(CommodityForm, options);
export const bulkImportBillableServicesModal = getSyncLifecycle(BulkImportBillableServices, options);

// Bill Deposit Components
export const billDepositSearch = getSyncLifecycle(BillDepositSearch, options);
export const addDepositWorkspace = getSyncLifecycle(AddDepositWorkspace, options);
export const deleteDepositModal = getSyncLifecycle(DeleteDepositModal, options);
export const depositTransactionWorkspace = getSyncLifecycle(DepositTransactionWorkspace, options);
export const reverseTransactionModal = getSyncLifecycle(ReverseTransactionModal, options);

// Print Preview Components
export const printPreviewModal = getSyncLifecycle(PrintPreviewModal, options);

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Dont know
// export const billableServicesAppMenuItem = getSyncLifecycle(appMenu, options);

// Admin Dashboard Card
export const billableServicesCardLink = getSyncLifecycle(BillableServicesCardLink, options);

// Billable Services Home
// export const billableServicesHome = getSyncLifecycle(BillableServiceHome, options);

// export const serviceMetrics = getSyncLifecycle(ServiceMetrics, options);

// export const editBillLineItemDialog = getAsyncLifecycle(() => import('./bill-item-actions/edit-bill-item.component'), {
//   featureName: 'edit bill line item',
//   moduleName,
// });
