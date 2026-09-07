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
import { formatDate, getCoreTranslation, showSnackbar, UserHasAccess } from '@openmrs/esm-framework';
import { convertToCurrency } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { TrashCan } from '@carbon/react/icons';
import styles from './payment-history.scss';
import { launchBillingWorkspace } from '../../../workspaces';
import { updatePaymentAttributes, updatePaymentDate } from '../../../billing.resource';
import { EditableDatePicker, getDateWithCurrentTime } from '../../editable-date-picker.component';
import { EditableTextCell, editableCellStyles } from '../../../editable-carbon-table-cell-kit';

type PaymentHistoryProps = {
  bill: MappedBill;
  onRefreshBill?: () => unknown;
};

type EditingPaymentReference = {
  attributeUuid: string;
  paymentUuid: string;
  value: string;
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ bill, onRefreshBill }) => {
  const { t } = useTranslation();
  const [hoveredVoidedPaymentUuid, setHoveredVoidedPaymentUuid] = useState<string | null>(null);
  const [updatingPaymentUuid, setUpdatingPaymentUuid] = useState<string | null>(null);
  const [editingPaymentReference, setEditingPaymentReference] = useState<EditingPaymentReference | null>(null);
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

  const handlePaymentDateChange = async (payment: Payment, [selectedDate]: Array<Date | string>) => {
    if (!selectedDate || !bill?.uuid || !payment?.uuid || bill.closed) {
      return;
    }

    const dateCreated = getDateWithCurrentTime(selectedDate, payment.dateCreated);
    setUpdatingPaymentUuid(payment.uuid);

    try {
      const response = await updatePaymentDate(bill.uuid, payment.uuid, dateCreated);
      if (!response.ok) {
        throw new Error('Payment date update failed');
      }

      await onRefreshBill?.();
      showSnackbar({
        title: t('paymentDateUpdated', 'Payment date updated'),
        kind: 'success',
        subtitle: t('paymentDateUpdatedSuccessfully', 'Payment date updated successfully'),
      });
    } catch (error) {
      showSnackbar({
        title: t('paymentDateUpdateFailed', 'Payment date update failed'),
        kind: 'error',
        subtitle:
          error instanceof Error
            ? error.message
            : t('paymentDateUpdateFailedFallback', 'Unable to update payment date'),
      });
    } finally {
      setUpdatingPaymentUuid(null);
    }
  };

  const renderPaymentDate = (payment: Payment) => {
    const paymentDate = formatDate(new Date(payment.dateCreated));

    if (!billIsOpen || payment.voided) {
      return paymentDate;
    }

    return (
      <EditableDatePicker
        ariaLabel={t('editPaymentDate', 'Edit payment date')}
        disabled={updatingPaymentUuid === payment.uuid}
        displayValue={paymentDate}
        id={`payment-date-${payment.uuid}`}
        onChange={(selectedDates) => handlePaymentDateChange(payment, selectedDates)}
        value={payment.dateCreated}
      />
    );
  };

  const handlePaymentReferenceChange = async (payment: Payment, attributeUuid: string, value: string) => {
    if (!bill?.uuid || !payment?.uuid || bill.closed || payment.voided) {
      return false;
    }

    const attributes = payment.attributes.map((attribute) => ({
      uuid: attribute.uuid,
      attributeType: attribute.attributeType.uuid,
      value: attribute.uuid === attributeUuid ? value : attribute.value,
    }));

    if (attributes.some((attribute) => !attribute.uuid || !attribute.attributeType)) {
      return false;
    }

    setUpdatingPaymentUuid(payment.uuid);

    try {
      const response = await updatePaymentAttributes(bill.uuid, payment.uuid, attributes);
      if (!response.ok) {
        throw new Error('Payment reference update failed');
      }

      await onRefreshBill?.();
      showSnackbar({
        title: t('paymentReferenceUpdated', 'Payment reference updated'),
        kind: 'success',
        subtitle: t('paymentReferenceUpdatedSuccessfully', 'Payment reference updated successfully'),
      });
      setEditingPaymentReference(null);
    } catch (error) {
      showSnackbar({
        title: t('paymentReferenceUpdateFailed', 'Payment reference update failed'),
        kind: 'error',
        subtitle:
          error instanceof Error
            ? error.message
            : t('paymentReferenceUpdateFailedFallback', 'Unable to update payment reference'),
      });
    } finally {
      setUpdatingPaymentUuid(null);
    }
  };

  const renderPaymentReferences = (payment: Payment) => (
    <span className={styles.referenceCodes}>
      {payment.attributes.map((attribute) => {
        const disabled =
          !billIsOpen ||
          payment.voided ||
          updatingPaymentUuid === payment.uuid ||
          !attribute.uuid ||
          !attribute.attributeType?.uuid;
        const isEditing =
          editingPaymentReference?.paymentUuid === payment.uuid &&
          editingPaymentReference.attributeUuid === attribute.uuid;

        return (
          <EditableTextCell
            activeContent={
              <input
                aria-label={t('editPaymentReferenceNumber', 'Edit payment reference number')}
                autoFocus
                className={`${editableCellStyles.editableCellContent} ${editableCellStyles.textContent} ${editableCellStyles.cellSearchInput} ${editableCellStyles.inlineTextEditor}`}
                disabled={disabled}
                onBlur={() => {
                  if (editingPaymentReference?.value === attribute.value) {
                    setEditingPaymentReference(null);
                  } else if (editingPaymentReference) {
                    void handlePaymentReferenceChange(payment, attribute.uuid, editingPaymentReference.value);
                  }
                }}
                onChange={(event) =>
                  setEditingPaymentReference((current) => (current ? { ...current, value: event.target.value } : null))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setEditingPaymentReference(null);
                  }
                }}
                value={editingPaymentReference?.value ?? attribute.value}
              />
            }
            isActive={isEditing}
            isEditable={!disabled}
            isOpen={isEditing}
            key={attribute.uuid}
            onActivate={() =>
              setEditingPaymentReference({
                attributeUuid: attribute.uuid,
                paymentUuid: payment.uuid,
                value: attribute.value,
              })
            }
            value={attribute.value}
          />
        );
      })}
    </span>
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
      dateCreated: renderPaymentDate(payment),
      amountTendered: convertToCurrency(payment.amountTendered),
      amount: convertToCurrency(payment.amount),
      paymentMethod: payment.instanceType.name,
      ...(hasReferenceCodes && {
        referenceCodes: renderPaymentReferences(payment),
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
