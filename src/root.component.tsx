import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BillingDashboard from './billing-dashboard/billing-dashboard.component';
// import ClaimsManagementOverview from './claims/claims-management/main/claims-overview-main.component';
// import ClaimsManagementPreAuthRequest from './claims/claims-management/main/claims-pre-auth-main.component';
// import ClaimScreen from './claims/dashboard/claims-dashboard.component';
import Invoice from './invoice/invoice.component';
import PaymentModeHome from './payment-modes/payment-mode-home.component';
import { ClockInBoundary } from './payment-points/clock-in-boundary.component';
import { PaymentPoint } from './payment-points/payment-point/payment-point.component';
import { PaymentPoints } from './payment-points/payment-points.component';
import BillDepositDashboard from './bill-deposit/components/dashboard/bill-deposit-dashboard.component';
import { useInitializeBillingWorkspaceGroup } from './workspaces';

const RootComponent: React.FC = () => {
  const baseName = window.getOpenmrsSpaBase() + 'home/billing';
  useInitializeBillingWorkspaceGroup();

  return (
    <BrowserRouter basename={baseName}>
      <Routes>
        <Route path="/" element={<BillingDashboard />} />
        <Route path="/payment-history" element={<BillingDashboard />} />
        <Route path="/bill-manager" element={<BillingDashboard />} />
        <Route path="/charge-items" element={<BillingDashboard />} />
        {/* <Route path="/claims-overview" element={<ClaimsManagementOverview />} /> */}
        {/* <Route path="/preauth-requests" element={<ClaimsManagementPreAuthRequest />} /> */}
        <Route
          path="/patient/:patientUuid/:billUuid"
          element={
            <ClockInBoundary>
              <Invoice />
            </ClockInBoundary>
          }
        />
        {/* <Route
          path="/patient/:patientUuid/:billUuid/claims"
          element={
            <ClockInBoundary>
              <ClaimScreen />
            </ClockInBoundary>
          }
        /> */}
        <Route path="/payment-points" element={<PaymentPoints />} />
        <Route path="/payment-points/:paymentPointUUID" element={<PaymentPoint />} />
        <Route path="/payment-modes" element={<PaymentModeHome />} />
        <Route path="/bill-deposit" element={<BillDepositDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RootComponent;
