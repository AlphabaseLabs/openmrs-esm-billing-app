import React, { useCallback } from 'react';
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Button } from '@carbon/react';
import { PaymentStatus, type MappedBill, type Payment } from '../../../types';
import { formatDate, launchWorkspace, getCoreTranslation, UserHasAccess } from '@openmrs/esm-framework';
import { convertToCurrency } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { TrashCan } from '@carbon/react/icons';
import styles from './payment-history.scss';

type PaymentHistoryProps = {
  bill: MappedBill;
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ bill }) => {
  const { t } = useTranslation();

  // Check if any payment has reference codes
  const hasReferenceCodes = bill?.payments?.some(
    (payment) => payment.attributes && payment.attributes.length > 0 && payment.attributes.some((attr) => attr.value),
  );

  const handleDeletePayment = useCallback(
    (payment: Payment) => {
      launchWorkspace('delete-payment-workspace', {
        workspaceTitle: t('deletePayment', 'Delete Payment'),
        bill,
        payment,
      });
    },
    [bill, t],
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

  // Add actions header only if bill is not fully paid
  if (bill.status !== PaymentStatus.PAID) {
    headers.push({
      key: 'actions',
      header: getCoreTranslation('actions', 'Actions'),
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
      ...(bill.status !== PaymentStatus.PAID && {
        actions: (
          <div className={styles.actionButtons}>
            <UserHasAccess privilege="o3: Delete Bill">
              <Button
                size="sm"
                hasIconOnly
                data-testid={`delete-payment-button-${payment.uuid}`}
                renderIcon={(props) => <TrashCan size={16} {...props} />}
                iconDescription={t('deletePayment', 'Delete payment')}
                kind="danger--ghost"
                onClick={() => handleDeletePayment(payment)}
              />
            </UserHasAccess>
          </div>
        ),
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
