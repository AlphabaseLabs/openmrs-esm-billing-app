import React, { useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useLayoutType, isDesktop, useConfig, ErrorState, navigate } from '@openmrs/esm-framework';
import { EmptyDataIllustration } from '@openmrs/esm-patient-common-lib';
import { useBillsPaginated } from '../billing.resource';
import { convertToCurrency, getInvoiceUrl, getPatientChartUrl } from '../helpers';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './all-bills-table.scss';

const filterItems = [
  { id: '', text: 'All bills' },
  { id: 'PENDING', text: 'Pending bills' },
  { id: 'PAID', text: 'Paid bills' },
];

interface AllBillsTableProps {
  actions?: React.ReactNode;
}

const AllBillsTable: React.FC<AllBillsTableProps> = ({ actions }) => {
  const { t } = useTranslation();
  const id = useId();
  const config = useConfig();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [billPaymentStatus, setBillPaymentStatus] = useState('PENDING');
  const pageSizes = config?.bills?.pageSizes ?? [10, 20, 50, 100, 500, 1000];
  const [pageSize, setPageSize] = useState(config?.bills?.pageSize ?? 10);
  const [currentPage, setCurrentPage] = useState(1);
  const { selectedDate } = useContext(SelectedDateContext);

  const startDate = selectedDate
    ? dayjs(selectedDate).startOf('day').toDate()
    : dayjs().subtract(10, 'year').startOf('day').toDate();
  const endDate = selectedDate ? dayjs(selectedDate).endOf('day').toDate() : dayjs().endOf('day').toDate();
  const isPendingFilter = billPaymentStatus === 'PENDING';
  const combinedPageSize = currentPage * pageSize;

  const {
    bills: filteredBills,
    totalCount: filteredTotalCount,
    isLoading: isLoadingFilteredBills,
    isValidating: isValidatingFilteredBills,
    error: filteredBillsError,
    mutate: mutateFilteredBills,
  } = useBillsPaginated({
    patientUuid: '',
    billStatus: isPendingFilter ? '' : billPaymentStatus,
    startingDate: startDate,
    endDate: endDate,
    page: currentPage,
    pageSize: pageSize,
    enabled: !isPendingFilter,
  });
  const {
    bills: pendingBills,
    totalCount: pendingTotalCount,
    isLoading: isLoadingPendingBills,
    isValidating: isValidatingPendingBills,
    error: pendingBillsError,
    mutate: mutatePendingBills,
  } = useBillsPaginated({
    patientUuid: '',
    billStatus: 'PENDING',
    startingDate: startDate,
    endDate: endDate,
    page: 1,
    pageSize: combinedPageSize,
    enabled: isPendingFilter,
  });
  const {
    bills: postedBills,
    totalCount: postedTotalCount,
    isLoading: isLoadingPostedBills,
    isValidating: isValidatingPostedBills,
    error: postedBillsError,
    mutate: mutatePostedBills,
  } = useBillsPaginated({
    patientUuid: '',
    billStatus: 'POSTED',
    startingDate: startDate,
    endDate: endDate,
    page: 1,
    pageSize: combinedPageSize,
    enabled: isPendingFilter,
  });
  const [searchString, setSearchString] = useState('');

  const bills = useMemo(() => {
    if (!isPendingFilter) {
      return filteredBills;
    }

    const mergedBills = sortBy([...(pendingBills ?? []), ...(postedBills ?? [])], ['dateCreatedUnformatted']).reverse();
    const startIndex = (currentPage - 1) * pageSize;

    return mergedBills.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredBills, isPendingFilter, pageSize, pendingBills, postedBills]);

  const totalCount = useMemo(() => {
    if (!isPendingFilter) {
      return filteredTotalCount;
    }

    return pendingTotalCount !== null && postedTotalCount !== null ? pendingTotalCount + postedTotalCount : null;
  }, [filteredTotalCount, isPendingFilter, pendingTotalCount, postedTotalCount]);

  const isLoading = isPendingFilter ? isLoadingPendingBills || isLoadingPostedBills : isLoadingFilteredBills;
  const isValidating = isPendingFilter
    ? isValidatingPendingBills || isValidatingPostedBills
    : isValidatingFilteredBills;
  const error = isPendingFilter ? (pendingBillsError ?? postedBillsError) : filteredBillsError;

  const headerData = [
    {
      header: t('billDate', 'Bill date'),
      key: 'billDate',
    },
    {
      header: t('name', 'Name'),
      key: 'patientName',
    },
    {
      header: t('status', 'Status'),
      key: 'status',
    },
    {
      header: t('billedItems', 'Billed items'),
      key: 'billedItems',
    },
    {
      header: t('billTotal', 'Bill total'),
      key: 'billTotal',
    },
  ];

  // Client-side search filtering on current page results
  const searchResults = useMemo(() => {
    if (bills !== undefined && bills.length > 0) {
      if (searchString && searchString.trim() !== '') {
        const search = searchString.toLowerCase();
        return bills?.filter(
          (activeBillRow) =>
            activeBillRow.patientName?.toLowerCase().includes(search) ||
            activeBillRow.identifier?.toLowerCase().includes(search),
        );
      }
    }

    return bills;
  }, [searchString, bills]);

  const setBilledItems = (bill) =>
    bill?.lineItems?.reduce(
      (acc, item) => acc + (acc ? ' & ' : '') + (item?.billableService.split(':')[1] || item?.item.split(':')[1] || ''),
      '',
    );

  const rowData = searchResults?.map((bill, index) => ({
    id: `${index}`,
    uuid: bill.uuid,
    patientUuid: bill.patientUuid,
    patientName: (
      <a
        href={getPatientChartUrl(bill.patientUuid)}
        className={styles.patientChartLink}
        onClick={(e) => e.stopPropagation()}>
        {bill.patientName}
      </a>
    ),
    billDate: <span className={styles.billDateCell}>{bill.dateCreated}</span>,
    status: bill.status,
    billedItems: setBilledItems(bill),
    billTotal: convertToCurrency(Number(bill.totalAmount ?? 0)),
  }));

  const handleSearch = useCallback(
    (e) => {
      setCurrentPage(1);
      setSearchString(e.target.value);
    },
    [setSearchString],
  );

  const handleFilterChange = ({ selectedItem }) => {
    setBillPaymentStatus(selectedItem.id);
    setCurrentPage(1);
  };

  const handleRowClick = useCallback((patientUuid: string, billUuid: string) => {
    navigate({ to: getInvoiceUrl(patientUuid, billUuid) });
  }, []);

  const handleRefresh = useCallback(() => {
    if (isPendingFilter) {
      void Promise.all([mutatePendingBills(), mutatePostedBills()]);
      return;
    }

    void mutateFilteredBills();
  }, [isPendingFilter, mutateFilteredBills, mutatePendingBills, mutatePostedBills]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  if (isLoading && !bills?.length) {
    return (
      <div className={styles.loaderContainer} role="progressbar" aria-label={t('loading', 'Loading')}>
        <DataTableSkeleton
          rowCount={pageSize}
          showHeader={false}
          showToolbar={false}
          zebra
          columnCount={headerData?.length}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Layer>
          <ErrorState error={error} headerTitle={t('billsList', 'Bill list')} />
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
            initialSelectedItem={filterItems.find((item) => item.id === billPaymentStatus)}
            items={filterItems}
            itemToString={(item) => (item ? item.text : '')}
            label=""
            onChange={handleFilterChange}
            size={responsiveSize}
            titleText={t('filterBy', 'Filter by') + ':'}
            type="inline"
          />
        </div>
        {actions ? <div className={styles.actionsContainer}>{actions}</div> : null}
      </div>

      {bills?.length > 0 ? (
        <div className={styles.billListContainer}>
          <FilterableTableHeader
            handleRefresh={handleRefresh}
            handleSearch={handleSearch}
            isValidating={isValidating}
            isRefreshing={isLoading || isValidating}
            layout={layout}
            responsiveSize={responsiveSize}
            t={t}
          />
          <DataTable
            isSortable
            rows={rowData}
            headers={headerData}
            size={responsiveSize}
            useZebraStyles={rowData?.length > 1 ? true : false}>
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
                          {...getRowProps({
                            row,
                          })}
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
          {searchResults?.length === 0 && (
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
          )}
          {totalCount !== null && totalCount > 0 && (
            <Pagination
              forwardText="Next page"
              backwardText="Previous page"
              page={currentPage}
              pageSize={pageSize}
              pageSizes={pageSizes}
              totalItems={totalCount}
              className={styles.pagination}
              size={responsiveSize}
              onChange={({ pageSize: newPageSize, page: newPage }) => {
                if (newPageSize !== pageSize) {
                  setPageSize(newPageSize);
                }
                if (newPage !== currentPage) {
                  setCurrentPage(newPage);
                }
              }}
            />
          )}
        </div>
      ) : (
        <Layer className={styles.emptyStateContainer}>
          <Tile className={styles.tile}>
            <div className={styles.illo}>
              <EmptyDataIllustration />
            </div>
            <p className={styles.content}>There are no bills to display.</p>
          </Tile>
        </Layer>
      )}
    </>
  );
};

function FilterableTableHeader({ layout, handleRefresh, handleSearch, isRefreshing, isValidating, responsiveSize, t }) {
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
          placeholder={t('filterBillsByPatientNameOrIdentifier', 'Filter bills by patient name or identifer')}
          onChange={handleSearch}
          size={responsiveSize}
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
