import React from 'react';
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';
import { type MappedBill } from '../../../types';
import { formatDate } from '@openmrs/esm-framework';
import { convertToCurrency } from '../../../helpers';
import { useTranslation } from 'react-i18next';

type PaymentHistoryProps = {
  bill: MappedBill;
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ bill }) => {
  const { t } = useTranslation();

  // Check if any payment has reference codes
  const hasReferenceCodes = bill?.payments?.some(
    (payment) => payment.attributes && payment.attributes.length > 0 && payment.attributes.some((attr) => attr.value)
  );

  const headers = [
    {
      key: 'dateCreated',
      header: t('dateOfPayment', 'Date of payment'),
    },
    {
      key: 'amountTendered',
      header: t('amountTendered', 'Amount tendered'),
    },
    {
      key: 'paymentMethod',
      header: t('paymentMethod', 'Payment method'),
    },
  ];

  // Add reference codes header only if any payment has it
  if (hasReferenceCodes) {
    headers.push({
      key: 'referenceCodes',
      header: t('referenceCodes', 'Reference codes'),
    });
  }

  const rows = bill?.payments
    ?.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
    .map((payment) => ({
      id: `${payment.uuid}`,
      dateCreated: formatDate(new Date(payment.dateCreated)),
      amountTendered: convertToCurrency(payment.amountTendered),
      amount: convertToCurrency(payment.amount),
      paymentMethod: payment.instanceType.name,
      ...(hasReferenceCodes && {
        referenceCodes: payment.attributes.map((attribute) => attribute.value).join(', '),
      }),
    }));

  if (Object.values(bill?.payments ?? {}).length === 0) {
    return;
  }

  return (
    <DataTable size="sm" rows={rows} headers={headers}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow {...getRowProps({ row })}>
                {row.cells.map((cell) => (
                  <TableCell key={cell.id}>{cell.value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTable>
  );
};

export default PaymentHistory;
