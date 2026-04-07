import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@carbon/react';
import { ArrowLeft, OverflowMenuVertical } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import BillingHeader from '../billing-header/billing-header.component';
import AllBillsTable from '../all-bills-table/all-bills-table.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-dashboard.scss';
import { ExtensionSlot } from '@openmrs/esm-framework';
import { PaymentHistory } from '../billable-services/payment-history/payment-history.component';
import BillManager from '../billable-services/bill-manager/bill-manager.component';
import { ChargeItemsDashboard } from '../billable-services/dashboard/dashboard.component';
import Invoice from '../invoice/invoice.component';

type BillingActionKey = 'overview' | 'payment-history' | 'bill-manager' | 'charge-items';

function getBillingActionFromPath(pathname: string): BillingActionKey {
  if (pathname.endsWith('/payment-history')) {
    return 'payment-history';
  }

  if (pathname.endsWith('/bill-manager')) {
    return 'bill-manager';
  }

  if (pathname.endsWith('/charge-items')) {
    return 'charge-items';
  }

  return 'overview';
}

function isInvoiceRoute(pathname: string) {
  return Boolean(matchPath('/patient/:patientUuid/:billUuid', pathname));
}

function BillingDashboard() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedActionTitle, setSelectedActionTitle] = useState<string | null>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<BillingActionKey>(() => getBillingActionFromPath(location.pathname));
  const showInvoiceOverview = isInvoiceRoute(location.pathname);

  const getPageTitle = (action: BillingActionKey) => {
    switch (action) {
      case 'payment-history':
        return t('paymentHistory', 'Payment History');
      case 'bill-manager':
        return t('billManager', 'Bill Manager');
      case 'charge-items':
        return t('chargeItems', 'Charge Items');
      default:
        return t('home', 'Home');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsOptionsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setSelectedAction(getBillingActionFromPath(location.pathname));
    setSelectedActionTitle(null);
  }, [location.pathname]);

  const handleActionSelection = useCallback(
    (action: string, title?: string) => {
      const nextAction = action as BillingActionKey;
      setSelectedAction(nextAction);
      setSelectedActionTitle(title ?? null);

      switch (nextAction) {
        case 'payment-history':
          navigate('/payment-history');
          break;
        case 'bill-manager':
          navigate('/bill-manager');
          break;
        case 'charge-items':
          navigate('/charge-items');
          break;
        default:
          navigate('/');
      }
    },
    [navigate],
  );

  const handleBack = () => {
    if (getBillingActionFromPath(location.pathname) !== 'overview') {
      navigate('/');
      return;
    }

    setSelectedAction('overview');
    setSelectedActionTitle(null);
  };

  const renderInlinePage = () => {
    switch (selectedAction) {
      case 'payment-history':
        return <PaymentHistory showHeader={false} />;
      case 'bill-manager':
        return <BillManager showHeader={false} />;
      case 'charge-items':
        return <ChargeItemsDashboard showHeader={false} />;
      default:
        return null;
    }
  };

  const headerActions = (
    <>
      <div className={styles.optionsMenuWrapper} ref={optionsMenuRef}>
        <Button
          kind="tertiary"
          size="sm"
          renderIcon={OverflowMenuVertical}
          aria-haspopup="menu"
          aria-expanded={isOptionsOpen}
          onClick={() => setIsOptionsOpen((currentValue) => !currentValue)}>
          {t('billingOptions', 'Billing options')}
        </Button>
        {isOptionsOpen ? (
          <div className={styles.optionsMenu} role="menu" aria-label={t('billingOptions', 'Billing options')}>
            <ExtensionSlot
              name="billing-dashboard-actions-slot"
              state={{
                onSelect: () => setIsOptionsOpen(false),
                onSelectAction: handleActionSelection,
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <main className={styles.container}>
        <BillingHeader title={selectedActionTitle ?? getPageTitle(selectedAction)} />
        {showInvoiceOverview ? (
          <section className={styles.embeddedPageContainer}>
            <div className={styles.embeddedPageContent}>
              <Invoice showPatientHeader={false} />
            </div>
          </section>
        ) : selectedAction !== 'overview' ? (
          <section className={styles.embeddedPageContainer}>
            <Button
              className={styles.backButton}
              iconDescription={t('back', 'Back')}
              kind="ghost"
              onClick={handleBack}
              renderIcon={ArrowLeft}
              size="sm">
              <span>{t('back', 'Back')}</span>
            </Button>
            <div className={styles.embeddedPageContent}>{renderInlinePage()}</div>
          </section>
        ) : (
          <section className={styles.billsTableContainer}>
            <AllBillsTable actions={headerActions} />
          </section>
        )}
      </main>
    </SelectedDateContext.Provider>
  );
}

export default BillingDashboard;
