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

export interface HistoryTableHeader {
  header: string;
  key: string;
}

export const historyControlSize = 'sm';
export const historyTableSize = 'sm';
export const historyPageSizes = [10, 20, 50, 100];

export const getHistoryResponsiveSize = (layout: string) => (layout !== 'tablet' ? 'sm' : 'md');

export const getHistoryColumnStyle = (columnStyles: Record<string, CSSProperties>, columnKey: string) =>
  columnStyles[columnKey];

const parseCurrencyValue = (value: unknown) => Number(`${value ?? ''}`.replace(/[^0-9.-]/g, '') || 0);

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
      return compareValues(parseCurrencyValue(cellA), parseCurrencyValue(cellB));
    }

    return sortDirection === sortStates.ASC ? compare(cellA, cellB) : compare(cellB, cellA);
  };

interface HistoryTableSkeletonProps {
  columnStyles: Record<string, CSSProperties>;
  headers: Array<HistoryTableHeader>;
  title: string;
  compactWidthKeys?: string[];
}

export const HistoryTableSkeleton = ({
  columnStyles,
  headers,
  title,
  compactWidthKeys = [],
}: HistoryTableSkeletonProps) => (
  <TableContainer>
    <Table size={historyTableSize} aria-label={title}>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableHeader key={header.key} style={getHistoryColumnStyle(columnStyles, header.key)}>
              {header.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={`${title}-skeleton-row-${rowIndex}`}>
            {headers.map((header) => (
              <TableCell key={`${header.key}-${rowIndex}`} style={getHistoryColumnStyle(columnStyles, header.key)}>
                <SkeletonText heading={false} width={compactWidthKeys.includes(header.key) ? '70%' : '90%'} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
