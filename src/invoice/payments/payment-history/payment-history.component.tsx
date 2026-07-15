import React, { useCallback, useState } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Tooltip,
} from '@carbon/react';
import { type MappedBill, type Payment } from '../../../types';
import { formatDate, getCoreTranslation, UserHasAccess } from '@openmrs/esm-framework';
import { convertToCurrency } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { TrashCan } from '@carbon/react/icons';
import styles from './payment-history.scss';
import { launchBillingWorkspace } from '../../../workspaces';

type PaymentHistoryProps = {
  bill: MappedBill;
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ bill }) => {
  const { t } = useTranslation();
  const [hoveredVoidedPaymentUuid, setHoveredVoidedPaymentUuid] = useState<string | null>(null);
  const billIsOpen = !bill.closed;
  const voidedPaymentTooltip = t(
    'deletedPaymentsAreRetainedForRecordKeeping',
    'Deleted payments are retained for record-keeping and cannot be modified.',
  );
  const voidedPaymentUuids = new Set(
    (bill?.payments ?? []).filter((payment) => payment.voided).map((payment) => payment.uuid),
  );

  // Check if any payment has reference codes
  const hasReferenceCodes = bill?.payments?.some(
    (payment) => payment.attributes && payment.attributes.length > 0 && payment.attributes.some((attr) => attr.value),
  );

  const handleDeletePayment = useCallback(
    (payment: Payment) => {
      launchBillingWorkspace('delete-payment-workspace', {
        bill,
        payment,
      });
    },
    [bill],
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

  // Add actions header only if bill is still open
  if (billIsOpen) {
    headers.push({
      key: 'actions',
      header: getCoreTranslation('actions', 'Actions'),
    });
  }

  const rows = (bill?.payments ?? [])
    .slice()
    .sort((a, b) => {
      if (a.voided !== b.voided) {
        return Number(a.voided) - Number(b.voided);
      }

      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    })
    .map((payment) => ({
      id: `${payment.uuid}`,
      dateCreated: formatDate(new Date(payment.dateCreated)),
      amountTendered: convertToCurrency(payment.amountTendered),
      amount: convertToCurrency(payment.amount),
      paymentMethod: payment.instanceType.name,
      ...(hasReferenceCodes && {
        referenceCodes: payment.attributes.map((attribute) => attribute.value).join(', '),
      }),
      ...(billIsOpen && {
        actions: (
          <span className={styles.actionButtons}>
            <UserHasAccess privilege="o3: Delete Bill">
              <Button
                size="sm"
                hasIconOnly
                data-testid={`delete-payment-button-${payment.uuid}`}
                disabled={payment.voided}
                renderIcon={(props) => <TrashCan size={16} {...props} />}
                iconDescription={t('deletePayment', 'Delete payment')}
                kind="danger--ghost"
                onClick={() => {
                  if (!payment.voided) {
                    handleDeletePayment(payment);
                  }
                }}
              />
            </UserHasAccess>
          </span>
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
            {rows.map((row) => {
              const isVoidedPayment = voidedPaymentUuids.has(row.id);

              return (
                <TableRow
                  {...getRowProps({ row })}
                  className={isVoidedPayment ? styles.voidedPaymentRow : undefined}
                  onMouseEnter={() => {
                    if (isVoidedPayment) {
                      setHoveredVoidedPaymentUuid(row.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isVoidedPayment) {
                      setHoveredVoidedPaymentUuid(null);
                    }
                  }}>
                  {row.cells.map((cell, index) => (
                    <TableCell key={cell.id}>
                      {index === 0 && hoveredVoidedPaymentUuid === row.id ? (
                        <Tooltip
                          align="top-start"
                          className={styles.voidedPaymentTooltip}
                          defaultOpen
                          enterDelayMs={0}
                          label={voidedPaymentTooltip}>
                          <span
                            aria-label={voidedPaymentTooltip}
                            className={styles.voidedPaymentTooltipAnchor}
                            data-testid={`voided-payment-tooltip-${row.id}`}
                          />
                        </Tooltip>
                      ) : null}
                      {cell.value}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DataTable>
  );
};

export default PaymentHistory;
