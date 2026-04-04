import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@carbon/react';
import { ArrowLeft, ChevronDown, ChevronUp, OverflowMenuVertical } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import BillingHeader from '../billing-header/billing-header.component';
import AllBillsTable from '../all-bills-table/all-bills-table.component';
import MetricsCards from '../metrics-cards/metrics-cards.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-dashboard.scss';
import { ClockOutStrip } from './clock-out-strip.component';
import { ExtensionSlot, UserHasAccess } from '@openmrs/esm-framework';
import { PaymentHistory } from '../billable-services/payment-history/payment-history.component';
import BillManager from '../billable-services/bill-manager/bill-manager.component';
import { ChargeItemsDashboard } from '../billable-services/dashboard/dashboard.component';

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

function BillingDashboard() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BillingActionKey>(() =>
    getBillingActionFromPath(window.location.pathname),
  );
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

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
  }, [location.pathname]);

  const handleActionSelection = useCallback(
    (action: string) => {
      const nextAction = action as BillingActionKey;
      setSelectedAction(nextAction);

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
      <Button
        kind="ghost"
        size="sm"
        renderIcon={isSummaryExpanded ? ChevronUp : ChevronDown}
        onClick={() => setIsSummaryExpanded((currentValue) => !currentValue)}>
        {isSummaryExpanded ? t('showLess', 'Show less') : t('showMore', 'Show more')}
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
    </>
  );

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <main className={styles.container}>
        <BillingHeader title={t('home', 'Home')} actions={headerActions} />
        {isSummaryExpanded ? (
          <section className={styles.summaryPanel}>
            <ClockOutStrip />
            <UserHasAccess privilege="o3: View Billing Metrics">
              <MetricsCards />
            </UserHasAccess>
          </section>
        ) : null}
        {selectedAction !== 'overview' ? (
          <section className={styles.embeddedPageContainer}>
            <Button kind="ghost" size="sm" renderIcon={ArrowLeft} className={styles.backButton} onClick={handleBack}>
              {t('back', 'Back')}
            </Button>
            <div className={styles.embeddedPageContent}>{renderInlinePage()}</div>
          </section>
        ) : (
          <section className={styles.billsTableContainer}>
            <AllBillsTable />
          </section>
        )}
      </main>
    </SelectedDateContext.Provider>
  );
}

export default BillingDashboard;
