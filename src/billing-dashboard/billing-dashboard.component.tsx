import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Search } from '@carbon/react';
import { Add, ArrowLeft, OverflowMenuVertical } from '@carbon/react/icons';
import { ExtensionSlot } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import BillingHeader from '../billing-header/billing-header.component';
import AllBillsTable from '../all-bills-table/all-bills-table.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-dashboard.scss';
import { BillingHistory } from '../billable-services/billing-history/billing-history.component';
import { PaymentHistory } from '../billable-services/payment-history/payment-history.component';
import BillManager from '../billable-services/bill-manager/bill-manager.component';
import { ChargeItemsDashboard } from '../billable-services/dashboard/dashboard.component';
import Invoice from '../invoice/invoice.component';
import { launchCreateBillWorkspace } from '../workspaces';

type BillingActionKey = 'overview' | 'payment-history' | 'billing-history' | 'bill-manager' | 'charge-items';
type EmbeddedBillingActionKey = Exclude<BillingActionKey, 'overview'>;

const billingActionRoutes: Record<EmbeddedBillingActionKey, string> = {
  'payment-history': '/payment-history',
  'billing-history': '/billing-history',
  'bill-manager': '/bill-manager',
  'charge-items': '/charge-items',
};

function getBillingActionFromPath(pathname: string): BillingActionKey {
  return (
    (Object.entries(billingActionRoutes).find(([, route]) => pathname.endsWith(route))?.[0] as BillingActionKey) ??
    'overview'
  );
}

function isInvoiceRoute(pathname: string) {
  return Boolean(matchPath('/patient/:patientUuid/:billUuid', pathname));
}

function BillingDashboard() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedActionTitle, setSelectedActionTitle] = useState<string | null>(null);
  const [receiptNumberSearch, setReceiptNumberSearch] = useState('');
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<BillingActionKey>(() =>
    getBillingActionFromPath(location.pathname),
  );
  const showInvoiceOverview = isInvoiceRoute(location.pathname);
  const showHomeDateFilter = !showInvoiceOverview && selectedAction === 'overview';

  const getPageTitle = (action: BillingActionKey) => {
    switch (action) {
      case 'payment-history':
        return t('paymentHistory', 'Payment History');
      case 'billing-history':
        return t('billingHistory', 'Billing History');
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

      navigate(nextAction === 'overview' ? '/' : billingActionRoutes[nextAction]);
    },
    [navigate],
  );

  const handleLaunchCreateBill = useCallback(() => {
    launchCreateBillWorkspace(t);
  }, [t]);

  const handleReceiptSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptNumberSearch(event.target.value);
  }, []);

  const handleReceiptSearchClear = useCallback(() => {
    setReceiptNumberSearch('');
  }, []);

  const handleBack = () => {
    if (getBillingActionFromPath(location.pathname) !== 'overview') {
      navigate('/');
      return;
    }

    setSelectedAction('overview');
    setSelectedActionTitle(null);
  };

  const renderInlinePage = () => {
    const embeddedPages: Record<EmbeddedBillingActionKey, React.ReactNode> = {
      'payment-history': <PaymentHistory showHeader={false} />,
      'billing-history': <BillingHistory showHeader={false} />,
      'bill-manager': <BillManager showHeader={false} />,
      'charge-items': <ChargeItemsDashboard showHeader={false} />,
    };

    return selectedAction === 'overview' ? null : embeddedPages[selectedAction];
  };

  const headerActions = React.useMemo(
    () => (
      <div className={styles.headerActions}>
        <div className={styles.invoiceSearchWrapper}>
          <Search
            id="billing-home-invoice-search"
            labelText={t('invoiceNumberShort', 'Invoice #')}
            closeButtonLabelText={t('clearSearch', 'Clear')}
            placeholder={t('filterBillsByInvoiceNumber', 'Search bills by invoice number')}
            value={receiptNumberSearch}
            onChange={handleReceiptSearchChange}
            onClear={handleReceiptSearchClear}
            size="sm"
          />
        </div>
        <div className={styles.headerButtons}>
          <Button kind="primary" size="sm" renderIcon={Add} onClick={handleLaunchCreateBill}>
            {t('createBill', 'Create Bill')}
          </Button>
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
        </div>
      </div>
    ),
    [
      handleActionSelection,
      handleLaunchCreateBill,
      handleReceiptSearchChange,
      handleReceiptSearchClear,
      isOptionsOpen,
      receiptNumberSearch,
      t,
    ],
  );

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <main className={styles.container}>
        {!showInvoiceOverview ? (
          <BillingHeader
            title={selectedActionTitle ?? getPageTitle(selectedAction)}
            showDateFilter={showHomeDateFilter}
          />
        ) : null}
        {showInvoiceOverview ? (
          <Invoice />
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
            <AllBillsTable actions={headerActions} receiptNumber={receiptNumberSearch} />
          </section>
        )}
      </main>
    </SelectedDateContext.Provider>
  );
}

export default BillingDashboard;
