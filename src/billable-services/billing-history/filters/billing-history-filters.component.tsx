import {
  DatePicker,
  DatePickerInput,
  Dropdown,
  MultiSelect,
  Search,
  Select,
  SelectItem,
  SkeletonIcon,
} from '@carbon/react';
import { type FetchResponse, openmrsFetch, restBaseUrl, useDebounce } from '@openmrs/esm-framework';
import React from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { usePaymentModes } from '../../../billing.resource';
import { useTimeSheets } from '../../../payment-points/payment-points.resource';
import { PaymentStatus } from '../../../types';
import { useBillingHistoryFilterContext } from '../useBillingHistoryFilterContext';
import { useBillingHistoryBills } from '../useBillingHistoryBills';
import styles from './billing-history-filters.component.scss';

type FilterOption = {
  id: string;
  text: string;
  isSelectAll?: boolean;
};

type DateRange = [Date, Date];

type PatientSearchResult = {
  uuid: string;
  display?: string;
  identifiers?: Array<{
    identifier?: string;
    preferred?: boolean;
  }>;
  patientIdentifier?: {
    identifier?: string;
  };
  person?: {
    personName?: {
      display?: string;
      givenName?: string;
      middleName?: string;
      familyName?: string;
    };
  };
};

const fiscalYearStartMonth = 6;
const compactControlSize = 'sm';
const patientSearchRepresentation = encodeURIComponent(
  'custom:(uuid,display,identifiers:(identifier,preferred),patientIdentifier:(identifier),person:(personName))',
);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const startOfWeek = (date: Date) =>
  startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()));
const endOfWeek = (date: Date) =>
  endOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay())));
const startOfMonth = (date: Date) => startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
const endOfMonth = (date: Date) => endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
const startOfYear = (date: Date) => startOfDay(new Date(date.getFullYear(), 0, 1));
const endOfYear = (date: Date) => endOfDay(new Date(date.getFullYear(), 11, 31));

const getFiscalYearStart = (date: Date) => {
  const year = date.getMonth() < fiscalYearStartMonth ? date.getFullYear() - 1 : date.getFullYear();
  return startOfDay(new Date(year, fiscalYearStartMonth, 1));
};

const getFiscalYearEnd = (date: Date) => {
  const start = getFiscalYearStart(date);
  return endOfDay(new Date(start.getFullYear() + 1, fiscalYearStartMonth, 0));
};

const getFiscalQuarterRange = (date: Date) => {
  const fyStart = getFiscalYearStart(date);
  const monthsSinceFyStart = (date.getFullYear() - fyStart.getFullYear()) * 12 + (date.getMonth() - fyStart.getMonth());
  const quarterIndex = Math.floor(monthsSinceFyStart / 3);
  const quarterStart = startOfDay(new Date(fyStart.getFullYear(), fyStart.getMonth() + quarterIndex * 3, 1));
  const quarterEnd = endOfDay(new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0));
  return { start: quarterStart, end: quarterEnd };
};

const getDateRangeForPreset = (preset: string, today: Date): DateRange | null => {
  switch (preset) {
    case 'all':
      return [new Date(0), endOfDay(today)];
    case 'today':
      return [startOfDay(today), endOfDay(today)];
    case 'yesterday': {
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      return [startOfDay(yesterday), endOfDay(yesterday)];
    }
    case 'thisWeek':
      return [startOfWeek(today), endOfWeek(today)];
    case 'thisMonth':
      return [startOfMonth(today), endOfMonth(today)];
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    }
    case 'last3Months':
      return [startOfDay(new Date(today.getFullYear(), today.getMonth() - 2, 1)), endOfMonth(today)];
    case 'last6Months':
      return [startOfDay(new Date(today.getFullYear(), today.getMonth() - 5, 1)), endOfMonth(today)];
    case 'last12Months':
      return [startOfDay(new Date(today.getFullYear(), today.getMonth() - 11, 1)), endOfMonth(today)];
    case 'yearToDate':
      return [startOfYear(today), endOfDay(today)];
    case 'lastYear': {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1);
      return [startOfYear(lastYear), endOfYear(lastYear)];
    }
    case 'thisFiscalYear':
      return [getFiscalYearStart(today), getFiscalYearEnd(today)];
    case 'lastFiscalYear': {
      const thisFYStart = getFiscalYearStart(today);
      const lastFYStart = startOfDay(new Date(thisFYStart.getFullYear() - 1, thisFYStart.getMonth(), 1));
      const lastFYEnd = endOfDay(new Date(thisFYStart.getFullYear(), thisFYStart.getMonth(), 0));
      return [lastFYStart, lastFYEnd];
    }
    case 'thisFiscalQuarter': {
      const range = getFiscalQuarterRange(today);
      return [range.start, range.end];
    }
    case 'lastFiscalQuarter': {
      const previousQuarterDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const range = getFiscalQuarterRange(previousQuarterDate);
      return [range.start, range.end];
    }
    default:
      return null;
  }
};

const areSameRange = (firstRange: DateRange, secondRange: DateRange) =>
  firstRange[0].getTime() === secondRange[0].getTime() && firstRange[1].getTime() === secondRange[1].getTime();

const itemToString = (item: FilterOption | null | undefined) => item?.text ?? '';
const getDisplayDateValue = (date: Date | null | undefined, shouldShow = true) =>
  shouldShow && date && date.getTime() !== 0 ? date : undefined;

const extractPatientName = (patient: PatientSearchResult) => {
  const personName = patient.person?.personName;
  if (personName?.display) {
    return personName.display;
  }

  if (personName) {
    return [personName.givenName, personName.middleName, personName.familyName].filter(Boolean).join(' ');
  }

  const [, displayName = patient.display ?? patient.uuid] = patient.display?.split(' - ') ?? [];
  return displayName;
};

const extractPatientIdentifier = (patient: PatientSearchResult) =>
  patient.patientIdentifier?.identifier ||
  patient.identifiers?.find((identifier) => identifier.preferred)?.identifier ||
  patient.identifiers?.[0]?.identifier ||
  patient.display?.split(' - ')[0]?.trim() ||
  '';

const formatPatientLabel = (patientName: string, patientIdentifier: string) =>
  patientIdentifier ? `${patientName} (${patientIdentifier})` : patientName;

const getPatientSearchUrl = (query: string) =>
  `${restBaseUrl}/patient?q=${encodeURIComponent(query)}&v=${patientSearchRepresentation}&limit=10&totalCount=false`;

export const BillingHistoryFilters = () => {
  const { t } = useTranslation();
  const { dateRange, setDateRange, filters, setFilters, appliedTimesheet, setAppliedTimesheet, setAppliedFilters } =
    useBillingHistoryFilterContext();
  const todayRef = React.useRef(new Date());
  const paymentMethods = filters.paymentMethods ?? [];
  const cashiers = React.useMemo(() => filters.cashiers ?? [], [filters.cashiers]);
  const [selectedPatient, setSelectedPatient] = React.useState<{ uuid: string; label: string } | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = React.useState('');
  const debouncedPatientSearchTerm = useDebounce(patientSearchTerm.trim(), 300);

  const dateOptions = React.useMemo<Array<FilterOption>>(
    () => [
      { id: 'all', text: t('all', 'All') },
      { id: 'today', text: t('today', 'Today') },
      { id: 'yesterday', text: t('yesterday', 'Yesterday') },
      { id: 'thisWeek', text: t('thisWeek', 'This Week') },
      { id: 'thisMonth', text: t('thisMonth', 'This Month') },
      { id: 'lastMonth', text: t('lastMonth', 'Last Month') },
      { id: 'last3Months', text: t('last3Months', 'Last 3 Months') },
      { id: 'thisFiscalQuarter', text: t('thisFiscalQuarter', 'This Fiscal Quarter') },
      { id: 'lastFiscalQuarter', text: t('lastFiscalQuarter', 'Last Fiscal Quarter') },
      { id: 'last6Months', text: t('last6Months', 'Last 6 Months') },
      { id: 'last12Months', text: t('last12Months', 'Last 12 Months') },
      { id: 'yearToDate', text: t('yearToDate', 'Year to Date') },
      { id: 'lastYear', text: t('lastYear', 'Last Year') },
      { id: 'thisFiscalYear', text: t('thisFiscalYear', 'This Fiscal Year') },
      { id: 'lastFiscalYear', text: t('lastFiscalYear', 'Last Fiscal Year') },
      { id: 'custom', text: t('customDate', 'Custom Date') },
    ],
    [t],
  );

  const resolvePresetFromRange = React.useCallback(
    (range: DateRange) => {
      const matchingPreset = dateOptions.find((option) => {
        if (option.id === 'custom') {
          return false;
        }

        const presetRange = getDateRangeForPreset(option.id, todayRef.current);
        return presetRange ? areSameRange(presetRange, range) : false;
      });

      return matchingPreset?.id ?? 'custom';
    },
    [dateOptions],
  );

  const [selectedDatePreset, setSelectedDatePreset] = React.useState(() => resolvePresetFromRange(dateRange));
  const { bills: cashierBills } = useBillingHistoryBills({ ...filters, cashiers: [] });
  const { bills: currentBills } = useBillingHistoryBills(filters);
  const { paymentModes = [], isLoading: isLoadingPaymentModes } = usePaymentModes(false);
  const { timesheets = [] } = useTimeSheets();

  React.useEffect(() => {
    setSelectedDatePreset(resolvePresetFromRange(dateRange));
  }, [dateRange, resolvePresetFromRange]);

  const updateFilters = React.useCallback(
    (nextValues: Partial<typeof filters>) => {
      setFilters({
        ...filters,
        ...nextValues,
      });
    },
    [filters, setFilters],
  );

  const handleDatePresetChange = ({ selectedItem }: { selectedItem?: FilterOption }) => {
    const preset = selectedItem?.id ?? 'custom';
    setSelectedDatePreset(preset);

    const nextDateRange = getDateRangeForPreset(preset, todayRef.current);
    if (nextDateRange) {
      setDateRange(nextDateRange);
      return;
    }

    setDateRange([startOfDay(todayRef.current), endOfDay(todayRef.current)]);
  };

  const handleStartDateChange = (dates: Array<Date>) => {
    const date = dates?.[0];
    if (!date) {
      return;
    }

    setDateRange([startOfDay(date), dateRange[1]]);
    setSelectedDatePreset('custom');
  };

  const handleEndDateChange = (dates: Array<Date>) => {
    const date = dates?.[0];
    if (!date) {
      return;
    }

    setDateRange([dateRange[0], endOfDay(date)]);
    setSelectedDatePreset('custom');
  };

  const handleBillStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({
      billStatus: event.target.value,
    });
  };

  const paymentTypeOptions = React.useMemo<Array<FilterOption>>(
    () => [
      { id: 'select-all', text: t('allPaymentModes', 'All Payment Modes'), isSelectAll: true },
      ...paymentModes.map((mode) => ({
        id: mode.uuid ?? mode.name,
        text: mode.name,
      })),
    ],
    [paymentModes, t],
  );

  const cashierOptions = React.useMemo<Array<FilterOption>>(
    () => [
      { id: 'select-all', text: t('allCashiers', 'All Cashiers'), isSelectAll: true },
      ...Array.from(new Map(cashierBills.map((bill) => [bill.cashier.uuid, bill.cashier])).values())
        .sort((first, second) => first.display.localeCompare(second.display))
        .map((cashier) => ({
          id: cashier.uuid,
          text: cashier.display,
        })),
    ],
    [cashierBills, t],
  );

  const selectedCashierIds = React.useMemo(
    () => new Set(currentBills.map((bill) => bill.cashier.uuid).filter((cashierId) => cashiers.includes(cashierId))),
    [cashiers, currentBills],
  );

  const selectedCashiersTimesheets = React.useMemo(
    () =>
      timesheets
        .filter((sheet) => selectedCashierIds.has(sheet.cashier.uuid))
        .sort((first, second) => new Date(second.clockIn).getTime() - new Date(first.clockIn).getTime()),
    [selectedCashierIds, timesheets],
  );

  React.useEffect(() => {
    if (appliedTimesheet && !selectedCashiersTimesheets.some((sheet) => sheet.uuid === appliedTimesheet.uuid)) {
      setAppliedTimesheet(undefined);
    }
  }, [appliedTimesheet, selectedCashiersTimesheets, setAppliedTimesheet]);

  const showPatientSearchResults =
    debouncedPatientSearchTerm.length >= 2 &&
    (!selectedPatient || debouncedPatientSearchTerm !== selectedPatient.label);

  const {
    data: patientSearchResponse,
    isLoading: isLoadingPatients,
    error: patientSearchError,
  } = useSWR<FetchResponse<{ results: Array<PatientSearchResult> }>, Error>(
    showPatientSearchResults ? getPatientSearchUrl(debouncedPatientSearchTerm) : null,
    openmrsFetch,
    {
      revalidateOnFocus: false,
    },
  );

  const patientSearchResults = patientSearchResponse?.data?.results ?? [];

  React.useEffect(() => {
    if (!filters.patientUuid) {
      setSelectedPatient(null);
      return;
    }

    if (selectedPatient || patientSearchTerm) {
      return;
    }

    const currentPatientBill = currentBills.find((bill) => bill.patientUuid === filters.patientUuid);
    const patientLabel = currentPatientBill
      ? formatPatientLabel(currentPatientBill.patientName, currentPatientBill.identifier)
      : filters.patientUuid;

    setSelectedPatient({ uuid: filters.patientUuid, label: patientLabel });
    setPatientSearchTerm(patientLabel);
  }, [currentBills, filters.patientUuid, patientSearchTerm, selectedPatient]);

  const selectedDateItem = dateOptions.find((option) => option.id === selectedDatePreset) ?? dateOptions[0];
  const selectedPaymentTypeItems = paymentTypeOptions.filter((option) => paymentMethods.includes(option.text));
  const selectedCashierItems = cashierOptions.filter((option) => cashiers.includes(option.id));

  const handlePaymentTypeChange = ({ selectedItems = [] }: { selectedItems?: Array<FilterOption> }) => {
    const nextPaymentTypes = selectedItems.some((item) => item.id === 'select-all')
      ? paymentModes.map((mode) => mode.name)
      : selectedItems.filter((item) => item.id !== 'select-all').map((item) => item.text);

    setAppliedFilters(nextPaymentTypes);
    updateFilters({
      paymentMethods: nextPaymentTypes,
    });
  };

  const handleCashierChange = ({ selectedItems = [] }: { selectedItems?: Array<FilterOption> }) => {
    const nextCashiers = selectedItems.some((item) => item.id === 'select-all')
      ? cashierOptions.filter((item) => item.id !== 'select-all').map((item) => item.id)
      : selectedItems.filter((item) => item.id !== 'select-all').map((item) => item.id);

    updateFilters({
      cashiers: nextCashiers,
    });
  };

  const handleTimesheetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTimesheet = selectedCashiersTimesheets.find((sheet) => sheet.uuid === event.target.value);
    setAppliedTimesheet(selectedTimesheet);
  };

  const handlePatientSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPatientSearchTerm(nextValue);
    setSelectedPatient(null);

    if (filters.patientUuid) {
      updateFilters({
        patientUuid: '',
      });
    }
  };

  const handlePatientSearchClear = () => {
    setPatientSearchTerm('');
    setSelectedPatient(null);
    if (!filters.patientUuid) {
      return;
    }

    updateFilters({
      patientUuid: '',
    });
  };

  const handlePatientSelect = (patient: PatientSearchResult) => {
    const patientName = extractPatientName(patient);
    const patientIdentifier = extractPatientIdentifier(patient);
    const patientLabel = formatPatientLabel(patientName, patientIdentifier);

    setSelectedPatient({
      uuid: patient.uuid,
      label: patientLabel,
    });
    setPatientSearchTerm(patientLabel);
    updateFilters({
      patientUuid: patient.uuid,
    });
  };

  const showTimesheetFilter = selectedCashiersTimesheets.length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.primaryRow}>
        <div className={styles.filterControl}>
          <Dropdown
            id="billing-history-date-filter"
            titleText={t('date', 'Date')}
            label={selectedDateItem.text}
            items={dateOptions}
            itemToString={itemToString}
            selectedItem={selectedDateItem}
            onChange={handleDatePresetChange}
            size={compactControlSize}
          />
        </div>

        <div className={styles.filterControl}>
          <DatePicker
            datePickerType="single"
            // maxDate={new Date()}
            value={getDisplayDateValue(dateRange[0], selectedDatePreset !== 'all')}
            onChange={handleStartDateChange}>
            <DatePickerInput
              id="billing-history-start-date"
              placeholder="mm/dd/yyyy"
              labelText={t('startDate', 'Start date')}
              size={compactControlSize}
            />
          </DatePicker>
        </div>

        <div className={styles.filterControl}>
          <DatePicker
            datePickerType="single" // maxDate={new Date()}
            value={getDisplayDateValue(dateRange[1])}
            onChange={handleEndDateChange}>
            <DatePickerInput
              id="billing-history-end-date"
              placeholder="mm/dd/yyyy"
              labelText={t('endDate', 'End date')}
              size={compactControlSize}
            />
          </DatePicker>
        </div>

        <div className={styles.filterControl}>
          <Select
            id="bill-status-filter"
            labelText={t('billStatus', 'Bill Status')}
            value={filters.billStatus ?? ''}
            onChange={handleBillStatusChange}
            size={compactControlSize}>
            <SelectItem value="" text={t('all', 'All')} />
            <SelectItem value={PaymentStatus.PAID} text={t('paid', 'Paid')} />
            <SelectItem value={PaymentStatus.PENDING} text={t('pending', 'Pending')} />
            <SelectItem value={PaymentStatus.POSTED} text={t('posted', 'Posted')} />
          </Select>
        </div>

        <div className={styles.filterControl}>
          {isLoadingPaymentModes ? (
            <SkeletonIcon className={styles.filterSkeleton} />
          ) : (
            <MultiSelect
              id="payment-type-filter"
              label={t('paymentType', 'Payment Type')}
              titleText={t('paymentType', 'Payment Type')}
              items={paymentTypeOptions}
              selectedItems={selectedPaymentTypeItems}
              itemToString={itemToString}
              selectionFeedback="top-after-reopen"
              onChange={handlePaymentTypeChange}
              size={compactControlSize}
            />
          )}
        </div>

        <div className={styles.filterControl}>
          <MultiSelect
            id="cashier-filter"
            label={t('cashier', 'Cashier')}
            titleText={t('cashier', 'Cashier')}
            items={cashierOptions}
            selectedItems={selectedCashierItems}
            itemToString={itemToString}
            selectionFeedback="top-after-reopen"
            onChange={handleCashierChange}
            size={compactControlSize}
          />
        </div>

        {showTimesheetFilter ? (
          <div className={styles.filterControl}>
            <Select
              id="timesheet-filter"
              labelText={t('timesheet', 'Timesheet')}
              value={appliedTimesheet?.uuid ?? ''}
              onChange={handleTimesheetChange}
              size={compactControlSize}>
              <SelectItem value="" text={t('allTimesheets', 'All Timesheets')} />
              {selectedCashiersTimesheets.map((sheet) => (
                <SelectItem
                  key={sheet.uuid}
                  value={sheet.uuid}
                  text={`${sheet.display} ${selectedCashierIds.size > 1 ? `(${sheet.cashier.display})` : ''}`}
                />
              ))}
            </Select>
          </div>
        ) : null}

        <div className={styles.patientSearchWrapper}>
          <Search
            id="patient-filter"
            labelText={t('patient', 'Patient')}
            closeButtonLabelText={t('clearSearch', 'Clear')}
            placeholder={t('searchForPatient', 'Search patient by name or identifier')}
            value={patientSearchTerm}
            onChange={handlePatientSearchChange}
            onClear={handlePatientSearchClear}
            size={compactControlSize}
          />
          {showPatientSearchResults ? (
            <div className={styles.patientSearchResults} role="listbox" aria-label={t('patient', 'Patient')}>
              {isLoadingPatients ? (
                <div className={styles.patientSearchState}>{t('searchingPatients', 'Searching patients...')}</div>
              ) : patientSearchError ? (
                <div className={styles.patientSearchState}>
                  {t('patientSearchError', 'Unable to load patient search results')}
                </div>
              ) : patientSearchResults.length ? (
                patientSearchResults.map((patient) => {
                  const patientName = extractPatientName(patient);
                  const patientIdentifier = extractPatientIdentifier(patient);

                  return (
                    <button
                      type="button"
                      key={patient.uuid}
                      className={styles.patientSearchResultButton}
                      onClick={() => handlePatientSelect(patient)}>
                      <span className={styles.patientSearchResultName}>{patientName}</span>
                      {patientIdentifier ? (
                        <span className={styles.patientSearchResultMeta}>{patientIdentifier}</span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className={styles.patientSearchState}>{t('noMatchingPatients', 'No matching patients')}</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
