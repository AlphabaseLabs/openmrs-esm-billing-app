import React, { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Dropdown,
  InlineLoading,
  Layer,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import { ErrorState, isDesktop, navigate, useConfig, useLayoutType } from '@openmrs/esm-framework';
import { EmptyDataIllustration } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import { useBillsPaginated } from '../billing.resource';
import SelectedDateContext from '../hooks/selectedDateContext';
import { convertToCurrency, getInvoiceUrl } from '../helpers';
import { toPatientSearchOption, type PatientSearchResult, usePatientSearchResults } from '../hooks/use-patient-search';
import type { MappedBill } from '../types';
import styles from './all-bills-table.scss';

type BillStatusFilter = '' | 'PENDING' | 'PAID';

type FilterOption = {
  id: BillStatusFilter;
  text: string;
};

type SelectedPatient = {
  uuid: string;
  label: string;
};

type TableRowData = {
  id: string;
  uuid: string;
  patientUuid: string;
  patientName: string;
  billDate: string;
  status: string;
  billedItems: string;
  billTotal: string;
};

interface AllBillsTableProps {
  actions?: React.ReactNode;
  patientUuid?: string;
  receiptNumber?: string;
}

interface BillTableDataParams {
  patientUuid: string;
  billStatus: BillStatusFilter;
  receiptNumber: string;
  currentPage: number;
  pageSize: number;
  startDate: Date;
  endDate: Date;
}

interface BillTableDataResult {
  bills: Array<MappedBill>;
  totalItems: number | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  refresh: () => void;
}

interface DisplayTableState {
  visibleBills: Array<MappedBill>;
  totalItems: number | null;
  hasResolvedData: boolean;
}

const getBillLineItemLabel = (value?: string) => {
  if (!value) {
    return '';
  }

  const [, label] = value.split(':');
  return label ?? value;
};

const getBilledItems = (bill: MappedBill) =>
  bill.lineItems
    ?.map((item) => getBillLineItemLabel(item?.billableService) || getBillLineItemLabel(item?.item))
    .filter(Boolean)
    .join(' & ') ?? '';

function useBillTableData({
  patientUuid,
  billStatus,
  receiptNumber,
  currentPage,
  pageSize,
  startDate,
  endDate,
}: BillTableDataParams): BillTableDataResult {
  const billsResponse = useBillsPaginated({
    patientUuid,
    billStatus,
    receiptNumber,
    startingDate: startDate,
    endDate: endDate,
    page: currentPage,
    pageSize,
    enabled: true,
  });

  const refresh = useCallback(() => {
    void billsResponse.mutate();
  }, [billsResponse]);

  return {
    bills: billsResponse.bills,
    totalItems: billsResponse.totalCount,
    isLoading: billsResponse.isLoading,
    isValidating: billsResponse.isValidating,
    error: billsResponse.error,
    refresh,
  };
}

function useDisplayedTableState(
  visibleBills: Array<MappedBill>,
  totalItems: number | null,
  isLoading: boolean,
  error: Error | undefined,
): DisplayTableState {
  const [snapshot, setSnapshot] = useState<{
    visibleBills: Array<MappedBill>;
    totalItems: number | null;
    ready: boolean;
  }>({
    visibleBills: [],
    totalItems: null,
    ready: false,
  });
  const lastResolvedSignature = useRef('');
  const resolvedSignature = useMemo(
    () => `${totalItems ?? 'null'}::${visibleBills.map((bill) => bill.uuid).join('|')}`,
    [totalItems, visibleBills],
  );

  useEffect(() => {
    if (!isLoading && !error && lastResolvedSignature.current !== resolvedSignature) {
      lastResolvedSignature.current = resolvedSignature;
      setSnapshot({
        visibleBills,
        totalItems,
        ready: true,
      });
    }
  }, [error, isLoading, resolvedSignature, totalItems, visibleBills]);

  if (isLoading && snapshot.ready) {
    return {
      visibleBills: snapshot.visibleBills,
      totalItems: snapshot.totalItems,
      hasResolvedData: true,
    };
  }

  return {
    visibleBills,
    totalItems,
    hasResolvedData: snapshot.ready,
  };
}

const AllBillsTable: React.FC<AllBillsTableProps> = ({ actions, patientUuid = '', receiptNumber = '' }) => {
  const { t } = useTranslation();
  const id = useId();
  const config = useConfig();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [billStatus, setBillStatus] = useState<BillStatusFilter>('');
  const [pageSize, setPageSize] = useState(config?.bills?.pageSize ?? 10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const { selectedDate } = useContext(SelectedDateContext);
  const pageSizes = config?.bills?.pageSizes ?? [10, 20, 50, 100, 500, 1000];
  const filterOptions = useMemo<Array<FilterOption>>(
    () => [
      { id: '', text: t('allBills', 'All bills') },
      { id: 'PENDING', text: t('pendingBills', 'Pending bills') },
      { id: 'PAID', text: t('paidBillsFilter', 'Paid bills') },
    ],
    [t],
  );
  const selectedFilter = filterOptions.find((option) => option.id === billStatus) ?? filterOptions[0];
  const resolvedPatientUuid = selectedPatient?.uuid ?? patientUuid;
  const {
    error: patientSearchError,
    isLoading: isLoadingPatients,
    results: patientSearchResults,
    showResults: showPatientSearchResults,
  } = usePatientSearchResults(patientSearchTerm, selectedPatient?.label);

  const startDate = useMemo(
    () =>
      selectedDate ? dayjs(selectedDate).startOf('day').toDate() : dayjs().subtract(10, 'year').startOf('day').toDate(),
    [selectedDate],
  );
  const endDate = useMemo(
    () => (selectedDate ? dayjs(selectedDate).endOf('day').toDate() : dayjs().endOf('day').toDate()),
    [selectedDate],
  );

  const billTableData = useBillTableData({
    patientUuid: resolvedPatientUuid,
    billStatus,
    receiptNumber: receiptNumber.trim(),
    currentPage,
    pageSize,
    startDate,
    endDate,
  });
  const hasActiveTableFilters = Boolean(resolvedPatientUuid || receiptNumber.trim() || billStatus);
  const displayedTable = useDisplayedTableState(
    billTableData.bills,
    billTableData.totalItems,
    billTableData.isLoading,
    billTableData.error,
  );
  const showInitialSkeleton = billTableData.isLoading && !displayedTable.hasResolvedData;
  const shouldRenderTableShell = displayedTable.visibleBills.length > 0 || hasActiveTableFilters;

  const headerData = useMemo(
    () => [
      { header: t('billDate', 'Bill date'), key: 'billDate' },
      { header: t('name', 'Name'), key: 'patientName' },
      { header: t('status', 'Status'), key: 'status' },
      { header: t('billedItems', 'Billed items'), key: 'billedItems' },
      { header: t('billTotal', 'Bill total'), key: 'billTotal' },
    ],
    [t],
  );

  const rowData = useMemo<Array<TableRowData>>(
    () =>
      displayedTable.visibleBills.map((bill) => ({
        id: bill.uuid,
        uuid: bill.uuid,
        patientUuid: bill.patientUuid,
        patientName: bill.patientName ?? '--',
        billDate: bill.dateCreated,
        status: bill.status,
        billedItems: getBilledItems(bill),
        billTotal: convertToCurrency(Number(bill.totalAmount ?? 0)),
      })),
    [displayedTable.visibleBills],
  );
  const rowLookup = useMemo(() => new Map(rowData.map((row) => [row.id, row])), [rowData]);

  const handlePatientSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPatientSearchTerm(event.target.value);
    setSelectedPatient(null);
    setCurrentPage(1);
  }, []);

  const handlePatientSearchClear = useCallback(() => {
    setPatientSearchTerm('');
    setSelectedPatient(null);
    setCurrentPage(1);
  }, []);

  const handlePatientSelect = useCallback((patient: PatientSearchResult) => {
    const patientOption = toPatientSearchOption(patient);
    setSelectedPatient(patientOption);
    setPatientSearchTerm(patientOption.label);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(({ selectedItem }: { selectedItem: FilterOption }) => {
    setBillStatus(selectedItem.id);
    setCurrentPage(1);
  }, []);

  const handleRowClick = useCallback((patientUuid: string, billUuid: string) => {
    navigate({ to: getInvoiceUrl(patientUuid, billUuid) });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, receiptNumber, resolvedPatientUuid, selectedDate]);

  if (showInitialSkeleton) {
    return (
      <div className={styles.loaderContainer} role="progressbar" aria-label={t('loading', 'Loading')}>
        <DataTableSkeleton
          rowCount={pageSize}
          showHeader={false}
          showToolbar={false}
          zebra
          columnCount={headerData.length}
        />
      </div>
    );
  }

  if (billTableData.error) {
    return (
      <div className={styles.errorContainer}>
        <Layer>
          <ErrorState error={billTableData.error} headerTitle={t('billsList', 'Bill list')} />
        </Layer>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tableToolbar}>
        <div className={styles.filterContainer}>
          <Dropdown
            className={styles.filterDropdown}
            direction="bottom"
            id={`filter-${id}`}
            items={filterOptions}
            selectedItem={selectedFilter}
            itemToString={(item: FilterOption | null) => item?.text ?? ''}
            label=""
            onChange={handleFilterChange}
            size={responsiveSize}
            titleText={`${t('filterBy', 'Filter by')}:`}
            type="inline"
          />
        </div>
        {actions ? <div className={styles.actionsContainer}>{actions}</div> : null}
      </div>

      {shouldRenderTableShell ? (
        <div className={styles.billListContainer}>
          <FilterableTableHeader
            handleRefresh={billTableData.refresh}
            handleSearch={handlePatientSearchChange}
            handleClearSearch={handlePatientSearchClear}
            handlePatientSelect={handlePatientSelect}
            isRefreshing={billTableData.isLoading || billTableData.isValidating}
            isValidating={billTableData.isValidating}
            layout={layout}
            patientSearchError={patientSearchError}
            patientSearchResults={patientSearchResults}
            responsiveSize={responsiveSize}
            searchString={patientSearchTerm}
            showPatientSearchResults={showPatientSearchResults}
            isLoadingPatients={isLoadingPatients}
            t={t}
          />
          <DataTable
            isSortable
            rows={rowData}
            headers={headerData}
            size={responsiveSize}
            useZebraStyles={rowData.length > 1}>
            {({ rows, headers, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()} aria-label="bill list">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key}>{header.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const rowDetails = rowLookup.get(row.id);

                      return (
                        <TableRow
                          key={row.id}
                          {...getRowProps({ row })}
                          className={styles.clickableRow}
                          onClick={() => rowDetails && handleRowClick(rowDetails.patientUuid, rowDetails.uuid)}>
                          {row.cells.map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={cell.info.header === 'billDate' ? styles.billDateCell : undefined}>
                              {cell.value}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          {!billTableData.isLoading && displayedTable.visibleBills.length === 0 && hasActiveTableFilters ? (
            <div className={styles.filterEmptyState}>
              <Layer level={0}>
                <Tile className={styles.filterEmptyStateTile}>
                  <p className={styles.filterEmptyStateContent}>
                    {t('noMatchingBillsToDisplay', 'No matching bills to display')}
                  </p>
                  <p className={styles.filterEmptyStateHelper}>{t('checkFilters', 'Check the filters above')}</p>
                </Tile>
              </Layer>
            </div>
          ) : null}
          {displayedTable.totalItems !== null && displayedTable.totalItems > 0 ? (
            <Pagination
              forwardText={t('nextPage', 'Next page')}
              backwardText={t('previousPage', 'Previous page')}
              page={currentPage}
              pageSize={pageSize}
              pageSizes={pageSizes}
              totalItems={displayedTable.totalItems}
              className={styles.pagination}
              size={responsiveSize}
              onChange={({ pageSize: nextPageSize, page: nextPage }) => {
                if (nextPageSize !== pageSize) {
                  setPageSize(nextPageSize);
                }
                if (nextPage !== currentPage) {
                  setCurrentPage(nextPage);
                }
              }}
            />
          ) : null}
        </div>
      ) : (
        <Layer className={styles.emptyStateContainer}>
          <Tile className={styles.tile}>
            <div className={styles.illo}>
              <EmptyDataIllustration />
            </div>
            <p className={styles.content}>{t('thereAreNoBillsToDisplay', 'There are no bills to display.')}</p>
          </Tile>
        </Layer>
      )}
    </>
  );
};

interface FilterableTableHeaderProps {
  handleRefresh: () => void;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearSearch: () => void;
  handlePatientSelect: (patient: PatientSearchResult) => void;
  isRefreshing: boolean;
  isValidating: boolean;
  isLoadingPatients: boolean;
  layout: ReturnType<typeof useLayoutType>;
  patientSearchError: Error | undefined;
  patientSearchResults: Array<PatientSearchResult>;
  responsiveSize: 'sm' | 'lg';
  searchString: string;
  showPatientSearchResults: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

function FilterableTableHeader({
  handleRefresh,
  handleSearch,
  handleClearSearch,
  handlePatientSelect,
  isRefreshing,
  isValidating,
  isLoadingPatients,
  layout,
  patientSearchError,
  patientSearchResults,
  responsiveSize,
  searchString,
  showPatientSearchResults,
  t,
}: FilterableTableHeaderProps) {
  return (
    <>
      <div className={styles.headerContainer}>
        <div
          className={classNames({
            [styles.tabletHeading]: !isDesktop(layout),
            [styles.desktopHeading]: isDesktop(layout),
          })}>
          <h4>{t('billList', 'Bill List')}</h4>
        </div>
        <div className={styles.backgroundDataFetchingIndicator}>
          <span>{isValidating ? <InlineLoading /> : null}</span>
        </div>
      </div>
      <div className={styles.searchContainer}>
        <div className={styles.tableSearchWrapper}>
          <Search
            className={styles.searchbar}
            labelText=""
            placeholder={t('searchForPatient', 'Search patient by name or identifier')}
            onChange={handleSearch}
            onClear={handleClearSearch}
            size={responsiveSize}
            value={searchString}
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
                  const patientOption = toPatientSearchOption(patient);

                  return (
                    <button
                      type="button"
                      key={patient.uuid}
                      className={styles.patientSearchResultButton}
                      onClick={() => handlePatientSelect(patient)}>
                      <span className={styles.patientSearchResultName}>{patientOption.name}</span>
                      {patientOption.identifier ? (
                        <span className={styles.patientSearchResultMeta}>{patientOption.identifier}</span>
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
        <Button
          kind="ghost"
          size={responsiveSize}
          hasIconOnly
          renderIcon={(props) => <Renew size={16} {...props} />}
          iconDescription={t('refreshBills', 'Refresh bills')}
          tooltipAlignment="end"
          tooltipPosition="top"
          onClick={handleRefresh}
          disabled={isRefreshing}
        />
      </div>
    </>
  );
}

export default AllBillsTable;
