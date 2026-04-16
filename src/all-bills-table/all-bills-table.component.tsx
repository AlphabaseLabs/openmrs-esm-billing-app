import React, { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import sortBy from 'lodash-es/sortBy';
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
import { useBills, useBillsPaginated } from '../billing.resource';
import SelectedDateContext from '../hooks/selectedDateContext';
import { convertToCurrency, getInvoiceUrl, getPatientChartUrl } from '../helpers';
import type { MappedBill } from '../types';
import styles from './all-bills-table.scss';

type BillStatusFilter = '' | 'PENDING' | 'PAID';

type FilterOption = {
  id: BillStatusFilter;
  text: string;
};

type TableRowData = {
  id: string;
  uuid: string;
  patientUuid: string;
  patientName: React.ReactNode;
  billDate: React.ReactNode;
  status: string;
  billedItems: string;
  billTotal: string;
};

interface AllBillsTableProps {
  actions?: React.ReactNode;
}

interface BillTableDataParams {
  billStatus: BillStatusFilter;
  hasSearch: boolean;
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

const mergeBillsByDate = (...billCollections: Array<Array<MappedBill> | undefined>) => {
  const deduplicatedBills = new Map<string, MappedBill>();

  billCollections
    .flatMap((bills) => bills ?? [])
    .forEach((bill) => {
      deduplicatedBills.set(bill.uuid, bill);
    });

  return sortBy(Array.from(deduplicatedBills.values()), ['dateCreatedUnformatted']).reverse();
};

const paginateBills = (bills: Array<MappedBill>, currentPage: number, pageSize: number) => {
  const startIndex = (currentPage - 1) * pageSize;
  return bills.slice(startIndex, startIndex + pageSize);
};

const matchesSearch = (bill: MappedBill, searchTerm: string) =>
  [bill.patientName, bill.identifier, bill.receiptNumber].some((value) => value?.toLowerCase().includes(searchTerm));

function useBillTableData({
  billStatus,
  hasSearch,
  currentPage,
  pageSize,
  startDate,
  endDate,
}: BillTableDataParams): BillTableDataResult {
  const isPendingFilter = billStatus === 'PENDING';
  const pendingBrowsePageSize = currentPage * pageSize;

  const pendingBrowseBills = useBillsPaginated({
    patientUuid: '',
    billStatus: 'PENDING',
    startingDate: startDate,
    endDate: endDate,
    page: 1,
    pageSize: pendingBrowsePageSize,
    enabled: isPendingFilter && !hasSearch,
  });

  const postedBrowseBills = useBillsPaginated({
    patientUuid: '',
    billStatus: 'POSTED',
    startingDate: startDate,
    endDate: endDate,
    page: 1,
    pageSize: pendingBrowsePageSize,
    enabled: isPendingFilter && !hasSearch,
  });

  const filteredBrowseBills = useBillsPaginated({
    patientUuid: '',
    billStatus,
    startingDate: startDate,
    endDate: endDate,
    page: currentPage,
    pageSize,
    enabled: !isPendingFilter && !hasSearch,
  });

  const pendingSearchBills = useBills('', 'PENDING', startDate, endDate, isPendingFilter && hasSearch);
  const postedSearchBills = useBills('', 'POSTED', startDate, endDate, isPendingFilter && hasSearch);
  const filteredSearchBills = useBills('', billStatus, startDate, endDate, !isPendingFilter && hasSearch);

  const bills = useMemo(() => {
    if (hasSearch) {
      return isPendingFilter
        ? mergeBillsByDate(pendingSearchBills.bills, postedSearchBills.bills)
        : (filteredSearchBills.bills ?? []);
    }

    if (isPendingFilter) {
      return paginateBills(mergeBillsByDate(pendingBrowseBills.bills, postedBrowseBills.bills), currentPage, pageSize);
    }

    return filteredBrowseBills.bills ?? [];
  }, [
    currentPage,
    filteredBrowseBills.bills,
    filteredSearchBills.bills,
    hasSearch,
    isPendingFilter,
    pageSize,
    pendingBrowseBills.bills,
    pendingSearchBills.bills,
    postedBrowseBills.bills,
    postedSearchBills.bills,
  ]);

  const totalItems = useMemo(() => {
    if (hasSearch) {
      return null;
    }

    if (isPendingFilter) {
      if (pendingBrowseBills.totalCount === null || postedBrowseBills.totalCount === null) {
        return null;
      }

      return pendingBrowseBills.totalCount + postedBrowseBills.totalCount;
    }

    return filteredBrowseBills.totalCount;
  }, [
    filteredBrowseBills.totalCount,
    hasSearch,
    isPendingFilter,
    pendingBrowseBills.totalCount,
    postedBrowseBills.totalCount,
  ]);

  const isLoading = hasSearch
    ? isPendingFilter
      ? pendingSearchBills.isLoading || postedSearchBills.isLoading
      : filteredSearchBills.isLoading
    : isPendingFilter
      ? pendingBrowseBills.isLoading || postedBrowseBills.isLoading
      : filteredBrowseBills.isLoading;

  const isValidating = hasSearch
    ? isPendingFilter
      ? pendingSearchBills.isValidating || postedSearchBills.isValidating
      : filteredSearchBills.isValidating
    : isPendingFilter
      ? pendingBrowseBills.isValidating || postedBrowseBills.isValidating
      : filteredBrowseBills.isValidating;

  const error = hasSearch
    ? isPendingFilter
      ? (pendingSearchBills.error ?? postedSearchBills.error)
      : filteredSearchBills.error
    : isPendingFilter
      ? (pendingBrowseBills.error ?? postedBrowseBills.error)
      : filteredBrowseBills.error;

  const refresh = useCallback(() => {
    if (hasSearch) {
      if (isPendingFilter) {
        void Promise.all([pendingSearchBills.mutate(), postedSearchBills.mutate()]);
        return;
      }

      void filteredSearchBills.mutate();
      return;
    }

    if (isPendingFilter) {
      void Promise.all([pendingBrowseBills.mutate(), postedBrowseBills.mutate()]);
      return;
    }

    void filteredBrowseBills.mutate();
  }, [
    filteredBrowseBills,
    filteredSearchBills,
    hasSearch,
    isPendingFilter,
    pendingBrowseBills,
    pendingSearchBills,
    postedBrowseBills,
    postedSearchBills,
  ]);

  return {
    bills,
    totalItems,
    isLoading,
    isValidating,
    error,
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

const AllBillsTable: React.FC<AllBillsTableProps> = ({ actions }) => {
  const { t } = useTranslation();
  const id = useId();
  const config = useConfig();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [billStatus, setBillStatus] = useState<BillStatusFilter>('PENDING');
  const [pageSize, setPageSize] = useState(config?.bills?.pageSize ?? 10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchString, setSearchString] = useState('');
  const { selectedDate } = useContext(SelectedDateContext);
  const hasSearch = searchString.trim().length > 0;
  const searchTerm = searchString.trim().toLowerCase();
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
    billStatus,
    hasSearch,
    currentPage,
    pageSize,
    startDate,
    endDate,
  });

  const matchingBills = useMemo(() => {
    if (!hasSearch) {
      return billTableData.bills;
    }

    return billTableData.bills.filter((bill) => matchesSearch(bill, searchTerm));
  }, [billTableData.bills, hasSearch, searchTerm]);

  const visibleBills = useMemo(
    () => (hasSearch ? paginateBills(matchingBills, currentPage, pageSize) : matchingBills),
    [currentPage, hasSearch, matchingBills, pageSize],
  );

  const liveTotalItems = hasSearch ? matchingBills.length : billTableData.totalItems;
  const displayedTable = useDisplayedTableState(
    visibleBills,
    liveTotalItems,
    billTableData.isLoading,
    billTableData.error,
  );
  const showInitialSkeleton = billTableData.isLoading && !displayedTable.hasResolvedData;
  const shouldRenderTableShell = displayedTable.visibleBills.length > 0 || hasSearch;

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
        patientName: (
          <a
            href={getPatientChartUrl(bill.patientUuid)}
            className={styles.patientChartLink}
            onClick={(event) => event.stopPropagation()}>
            {bill.patientName}
          </a>
        ),
        billDate: <span className={styles.billDateCell}>{bill.dateCreated}</span>,
        status: bill.status,
        billedItems: getBilledItems(bill),
        billTotal: convertToCurrency(Number(bill.totalAmount ?? 0)),
      })),
    [displayedTable.visibleBills],
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchString('');
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
  }, [pageSize, selectedDate]);

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
            handleSearch={handleSearchChange}
            handleClearSearch={handleClearSearch}
            isRefreshing={billTableData.isLoading || billTableData.isValidating}
            isValidating={billTableData.isValidating}
            layout={layout}
            responsiveSize={responsiveSize}
            searchString={searchString}
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
                      const rowDetails = rowData.find((dataRow) => dataRow.id === row.id);

                      return (
                        <TableRow
                          key={row.id}
                          {...getRowProps({ row })}
                          className={styles.clickableRow}
                          onClick={() => rowDetails && handleRowClick(rowDetails.patientUuid, rowDetails.uuid)}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          {!billTableData.isLoading && matchingBills.length === 0 ? (
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
  isRefreshing: boolean;
  isValidating: boolean;
  layout: ReturnType<typeof useLayoutType>;
  responsiveSize: 'sm' | 'lg';
  searchString: string;
  t: ReturnType<typeof useTranslation>['t'];
}

function FilterableTableHeader({
  handleRefresh,
  handleSearch,
  handleClearSearch,
  isRefreshing,
  isValidating,
  layout,
  responsiveSize,
  searchString,
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
        <Search
          className={styles.searchbar}
          labelText=""
          placeholder={t(
            'filterBillsByPatientNameIdentifierOrInvoiceNumber',
            'Filter bills by patient name, identifier, or invoice number',
          )}
          onChange={handleSearch}
          onClear={handleClearSearch}
          size={responsiveSize}
          value={searchString}
        />
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
