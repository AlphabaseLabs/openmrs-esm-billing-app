import React, { type CSSProperties } from 'react';
import dayjs from 'dayjs';
import {
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import amountStyles from '../../helpers/table.scss';

export interface HistoryTableHeader {
  header: string;
  key: string;
}

export const historyControlSize = 'sm';
export const historyTableSize = 'sm';
export const historyPageSizes = [10, 20, 50, 100];
export const billingHistoryAmountKeys = ['totalAmount', 'totalDiscount', 'totalPaid', 'amountDue'];
export const paymentHistoryAmountKeys = ['paymentAmount'];

const billingAmountColumnStyle = {
  inlineSize: '11.5rem',
  minInlineSize: '11.5rem',
  whiteSpace: 'nowrap',
} as const;

export const billingHistoryColumnStyles = {
  dateCreated: { inlineSize: '12rem', whiteSpace: 'nowrap' },
  receiptNumber: { inlineSize: '9rem', whiteSpace: 'nowrap' },
  patientName: { inlineSize: '13rem', minInlineSize: '13rem' },
  identifier: { inlineSize: '7.5rem', minInlineSize: '7.5rem', whiteSpace: 'nowrap' },
  billedItems: { inlineSize: '16rem' },
  referenceCodes: { inlineSize: '18rem', minInlineSize: '18rem' },
  totalAmount: billingAmountColumnStyle,
  totalDiscount: billingAmountColumnStyle,
  totalPaid: billingAmountColumnStyle,
  amountDue: billingAmountColumnStyle,
} as const;

export const paymentHistoryColumnStyles = {
  paymentDate: { inlineSize: '12rem', whiteSpace: 'nowrap' },
  invoiceId: { inlineSize: '9rem', whiteSpace: 'nowrap' },
  paymentAmount: { inlineSize: '9rem', whiteSpace: 'nowrap' },
} as const;

export const getHistoryResponsiveSize = (layout: string) => (layout !== 'tablet' ? 'sm' : 'md');

export const getHistoryColumnStyle = (columnStyles: Record<string, CSSProperties>, columnKey: string) =>
  columnStyles[columnKey];

const parseDateValue = (value: unknown) => {
  const parsedDate = dayjs(`${value ?? ''}`, 'DD-MMM-YYYY, hh:mm A', true);
  return parsedDate.isValid() ? parsedDate.valueOf() : 0;
};

export const createHistorySortRow =
  (dateKey: string, currencyKeys: string[] = []) =>
  (cellA, cellB, { key, sortDirection, sortStates, compare }) => {
    const compareValues = (firstValue: number, secondValue: number) =>
      sortDirection === sortStates.ASC ? firstValue - secondValue : secondValue - firstValue;

    if (key === dateKey) {
      return compareValues(parseDateValue(cellA), parseDateValue(cellB));
    }

    if (currencyKeys.includes(key)) {
      return compareValues(Number(cellA), Number(cellB));
    }

    return sortDirection === sortStates.ASC ? compare(cellA, cellB) : compare(cellB, cellA);
  };

interface HistoryTableSkeletonProps {
  amountKeys: string[];
  columnStyles: Record<string, CSSProperties>;
  headers: Array<HistoryTableHeader>;
  title: string;
  compactWidthKeys?: string[];
}

export const HistoryTableSkeleton = ({
  amountKeys,
  columnStyles,
  headers,
  title,
  compactWidthKeys = [],
}: HistoryTableSkeletonProps) => (
  <TableContainer>
    <Table size={historyTableSize} aria-label={title} aria-busy useZebraStyles>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableHeader
              key={header.key}
              className={
                amountKeys.includes(header.key)
                  ? `${amountStyles.numericCell} ${amountStyles.sortableNumericCell}`
                  : undefined
              }
              style={getHistoryColumnStyle(columnStyles, header.key)}>
              {header.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={`${title}-skeleton-row-${rowIndex}`}>
            {headers.map((header) => (
              <TableCell
                key={`${header.key}-${rowIndex}`}
                className={
                  amountKeys.includes(header.key)
                    ? `${amountStyles.numericCell} ${amountStyles.sortableNumericCell}`
                    : undefined
                }
                style={getHistoryColumnStyle(columnStyles, header.key)}>
                <SkeletonText heading={false} width={compactWidthKeys.includes(header.key) ? '70%' : '90%'} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
