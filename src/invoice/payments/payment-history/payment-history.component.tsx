import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  ComposedModal,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  IconButton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Tag,
  TextArea,
  Tooltip,
} from '@carbon/react';
import { type MappedBill, type Payment, type PendingPayment, type PendingPaymentStatus } from '../../../types';
import { formatDate, getCoreTranslation, showSnackbar, UserHasAccess } from '@openmrs/esm-framework';
import { formatBillDateTime } from '../../../helpers';
import { formatCurrency } from '../../../helpers/currency';
import { useTranslation } from 'react-i18next';
import { Checkmark, Close, TrashCan } from '@carbon/react/icons';
import styles from './payment-history.scss';
import { launchBillingWorkspace } from '../../../workspaces';
import {
  updatePaymentAttributes,
  updatePaymentDate,
  updatePendingPaymentReference,
  updatePendingPaymentStatus,
} from '../../../billing.resource';
import { EditableDatePicker, getDateWithCurrentTime } from '../../editable-date-picker.component';
import { EditableTextCell, editableCellStyles } from '../../../editable-carbon-table-cell-kit';
import { extractErrorMessagesFromResponse } from '../../../utils';

type PaymentHistoryProps = {
  bill: MappedBill;
  onRefreshBill?: () => unknown;
};

type EditingPaymentReference = {
  attributeUuid: string;
  paymentUuid: string;
  value: string;
};

type EditingPendingPaymentReference = {
  pendingPaymentUuid: string;
  value: string;
};

const getColumnClassName = (columnKey: string) => {
  switch (columnKey) {
    case 'dateCreated':
      return styles.dateColumn;
    case 'amountTendered':
      return styles.amountColumn;
    case 'paymentMethod':
      return styles.paymentMethodColumn;
    case 'referenceCodes':
      return styles.referenceColumn;
    case 'actions':
      return styles.actionsColumn;
    default:
      return undefined;
  }
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ bill, onRefreshBill }) => {
  const { t } = useTranslation();
  const [hoveredVoidedPaymentUuid, setHoveredVoidedPaymentUuid] = useState<string | null>(null);
  const [updatingPaymentUuid, setUpdatingPaymentUuid] = useState<string | null>(null);
  const [updatingPendingPaymentUuid, setUpdatingPendingPaymentUuid] = useState<string | null>(null);
  const pendingRequestInFlight = useRef(false);
  const [editingPaymentReference, setEditingPaymentReference] = useState<EditingPaymentReference | null>(null);
  const [editingPendingPaymentReference, setEditingPendingPaymentReference] =
    useState<EditingPendingPaymentReference | null>(null);
  const [pendingPaymentToReject, setPendingPaymentToReject] = useState<PendingPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonTouched, setRejectionReasonTouched] = useState(false);
  const billIsOpen = !bill.closed;
  const refreshBill = () =>
    // Reuse the invoice's best-effort refresh pattern: a saved change must not be reported as failed.
    Promise.resolve()
      .then(() => onRefreshBill?.())
      .catch(() => undefined);
  const voidedPaymentTooltip = t(
    'deletedPaymentsAreRetainedForRecordKeeping',
    'Deleted payments are retained for record-keeping and cannot be modified.',
  );
  const voidedPaymentUuids = new Set(
    (bill?.payments ?? []).filter((payment) => payment.voided).map((payment) => payment.uuid),
  );

  // Check if any payment has reference codes
  const pendingPayments = (bill.pendingPayments ?? []).filter(
    (request) => !request.voided && request.status !== 'SUCCESS',
  );
  const hasReferenceCodes =
    bill?.payments?.some(
      (payment) => payment.attributes && payment.attributes.length > 0 && payment.attributes.some((attr) => attr.value),
    ) || pendingPayments.length > 0;

  const rejectedPendingPaymentUuids = new Set(
    pendingPayments.filter((request) => request.status === 'REJECTED').map((request) => request.uuid),
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

      await refreshBill();
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
    const tooltip = formatBillDateTime(new Date(payment.dateCreated));

    if (!billIsOpen || payment.voided) {
      return tooltip ? (
        <Tooltip autoAlign align="top-start" label={tooltip} enterDelayMs={0}>
          <span tabIndex={0}>{paymentDate}</span>
        </Tooltip>
      ) : (
        paymentDate
      );
    }

    return (
      <EditableDatePicker
        ariaLabel={t('editPaymentDate', 'Edit payment date')}
        showEditIcon
        disabled={updatingPaymentUuid === payment.uuid}
        displayValue={paymentDate}
        tooltip={tooltip}
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

      await refreshBill();
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

  const handlePendingPaymentStatusChange = async (
    pendingPayment: PendingPayment,
    status: PendingPaymentStatus,
    reviewNote?: string,
  ) => {
    if (
      pendingRequestInFlight.current ||
      pendingPayment.voided ||
      pendingPayment.status !== 'PENDING' ||
      status === 'PENDING' ||
      !billIsOpen
    ) {
      return false;
    }

    pendingRequestInFlight.current = true;
    setUpdatingPendingPaymentUuid(pendingPayment.uuid);
    try {
      const response = await updatePendingPaymentStatus(pendingPayment.uuid, status, reviewNote);
      if (!response.ok) {
        throw new Error('Payment review update failed');
      }
      await refreshBill();
      showSnackbar({
        title: t('paymentReviewUpdated', 'Payment review updated'),
        kind: 'success',
        subtitle:
          status === 'SUCCESS'
            ? t('paymentApprovedSuccessfully', 'The payment was approved and added to the invoice')
            : t('paymentRejectedSuccessfully', 'The payment request was rejected'),
      });
      return true;
    } catch (error: any) {
      showSnackbar({
        title: t('paymentReviewUpdateFailed', 'Payment review update failed'),
        kind: 'error',
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : error instanceof Error
            ? error.message
            : t('paymentReviewUpdateFailedFallback', 'Unable to update payment review'),
      });
      return false;
    } finally {
      pendingRequestInFlight.current = false;
      setUpdatingPendingPaymentUuid(null);
    }
  };

  const closeRejectionModal = () => {
    if (updatingPendingPaymentUuid === pendingPaymentToReject?.uuid) {
      return;
    }
    setPendingPaymentToReject(null);
    setRejectionReason('');
    setRejectionReasonTouched(false);
  };

  const confirmPendingPaymentRejection = async () => {
    const normalizedReason = rejectionReason.trim();
    setRejectionReasonTouched(true);
    if (!pendingPaymentToReject || !normalizedReason || normalizedReason.length > 1024) {
      return;
    }

    if (await handlePendingPaymentStatusChange(pendingPaymentToReject, 'REJECTED', normalizedReason)) {
      setPendingPaymentToReject(null);
      setRejectionReason('');
      setRejectionReasonTouched(false);
    }
  };

  const handlePendingPaymentReferenceChange = async (pendingPayment: PendingPayment, referenceCode: string) => {
    if (pendingRequestInFlight.current || pendingPayment.voided || pendingPayment.status !== 'PENDING' || !billIsOpen) {
      return;
    }

    const normalizedReferenceCode = referenceCode.trim();
    pendingRequestInFlight.current = true;
    setUpdatingPendingPaymentUuid(pendingPayment.uuid);
    try {
      const response = await updatePendingPaymentReference(pendingPayment.uuid, normalizedReferenceCode);
      if (!response.ok) {
        throw new Error('Payment reference update failed');
      }
      await refreshBill();
      showSnackbar({
        title: t('paymentReferenceUpdated', 'Payment reference updated'),
        kind: 'success',
        subtitle: t('paymentReferenceUpdatedSuccessfully', 'Payment reference updated successfully'),
      });
      setEditingPendingPaymentReference(null);
    } catch (error: any) {
      showSnackbar({
        title: t('paymentReferenceUpdateFailed', 'Payment reference update failed'),
        kind: 'error',
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : error instanceof Error
            ? error.message
            : t('paymentReferenceUpdateFailedFallback', 'Unable to update payment reference'),
      });
    } finally {
      pendingRequestInFlight.current = false;
      setUpdatingPendingPaymentUuid(null);
    }
  };

  const renderPendingPaymentReference = (pendingPayment: PendingPayment) => {
    const currentReferenceCode = pendingPayment.referenceCode ?? '';
    const disabled = pendingPayment.status !== 'PENDING' || !billIsOpen || Boolean(updatingPendingPaymentUuid);
    const isEditing = editingPendingPaymentReference?.pendingPaymentUuid === pendingPayment.uuid;

    return (
      <EditableTextCell
        activeContent={
          <input
            aria-label={t('editPendingPaymentReferenceNumber', 'Edit pending payment reference number')}
            autoFocus
            className={`${editableCellStyles.editableCellContent} ${editableCellStyles.textContent} ${editableCellStyles.cellSearchInput} ${editableCellStyles.inlineTextEditor}`}
            disabled={disabled}
            maxLength={255}
            onBlur={() => {
              const editedValue = editingPendingPaymentReference?.value ?? currentReferenceCode;
              if (editedValue.trim() === currentReferenceCode.trim()) {
                setEditingPendingPaymentReference(null);
              } else {
                void handlePendingPaymentReferenceChange(pendingPayment, editedValue);
              }
            }}
            onChange={(event) =>
              setEditingPendingPaymentReference((current) =>
                current ? { ...current, value: event.target.value } : null,
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setEditingPendingPaymentReference(null);
              }
            }}
            value={editingPendingPaymentReference?.value ?? currentReferenceCode}
          />
        }
        isActive={isEditing}
        isEditable={!disabled}
        isOpen={isEditing}
        onActivate={() =>
          setEditingPendingPaymentReference({
            pendingPaymentUuid: pendingPayment.uuid,
            value: currentReferenceCode,
          })
        }
        value={currentReferenceCode || '--'}
      />
    );
  };

  const renderPaymentMethod = (method: string, status?: React.ReactNode, reviewNote?: string | null) => (
    <span className={styles.paymentMethodDetails}>
      <span className={styles.paymentMethodContent}>
        <span className={styles.paymentMethodName}>{method}</span>
        {status}
      </span>
      {reviewNote ? (
        <span className={styles.reviewNote} title={reviewNote}>
          {`${t('reason', 'Reason')}: ${reviewNote}`}
        </span>
      ) : null}
    </span>
  );

  const renderPendingPaymentActions = (pendingPayment: PendingPayment) => {
    if (pendingPayment.status !== 'PENDING' || !billIsOpen) {
      return '';
    }

    const isUpdating = Boolean(updatingPendingPaymentUuid) || Boolean(editingPendingPaymentReference);
    return (
      <span className={styles.actionButtons}>
        <IconButton
          size="sm"
          kind="ghost"
          autoAlign
          align="top"
          aria-labelledby=""
          label={t('approvePayment', 'Approve payment')}
          aria-label={t('approvePayment', 'Approve payment')}
          data-testid={`approve-pending-payment-${pendingPayment.uuid}`}
          disabled={isUpdating}
          onClick={() => void handlePendingPaymentStatusChange(pendingPayment, 'SUCCESS')}>
          <Checkmark size={16} />
        </IconButton>
        <IconButton
          size="sm"
          kind="ghost"
          autoAlign
          align="top"
          aria-labelledby=""
          label={t('rejectPayment', 'Reject payment')}
          aria-label={t('rejectPayment', 'Reject payment')}
          data-testid={`reject-pending-payment-${pendingPayment.uuid}`}
          disabled={isUpdating}
          className="cds--btn--danger--ghost"
          onClick={() => {
            setPendingPaymentToReject(pendingPayment);
            setRejectionReason('');
            setRejectionReasonTouched(false);
          }}>
          <Close size={16} />
        </IconButton>
      </span>
    );
  };

  const headers = [
    {
      key: 'dateCreated',
      header: t('date', 'Date'),
    },
    {
      key: 'amountTendered',
      header: t('amount', 'Amount'),
    },
    {
      key: 'paymentMethod',
      header: t('method', 'Method'),
    },
  ];

  // Add reference codes header only if any payment has it
  if (hasReferenceCodes) {
    headers.push({
      key: 'referenceCodes',
      header: t('reference', 'Reference'),
    });
  }

  // Add actions header only if bill is still open
  if (billIsOpen) {
    headers.push({
      key: 'actions',
      header: getCoreTranslation('actions', 'Actions'),
    });
  }

  const paymentRows = (bill?.payments ?? []).map((payment) => ({
    id: `${payment.uuid}`,
    dateCreated: renderPaymentDate(payment),
    amountTendered: formatCurrency(payment.amountTendered, { style: 'decimal', maximumFractionDigits: 2 }),
    paymentMethod: renderPaymentMethod(payment.instanceType.name),
    ...(hasReferenceCodes && {
      referenceCodes: renderPaymentReferences(payment),
    }),
    ...(billIsOpen && {
      actions: (
        <span className={styles.actionButtons}>
          <UserHasAccess privilege="o3: Delete Bill">
            <IconButton
              size="sm"
              data-testid={`delete-payment-button-${payment.uuid}`}
              disabled={payment.voided}
              label={t('deletePayment', 'Delete payment')}
              aria-label={t('deletePayment', 'Delete payment')}
              aria-labelledby=""
              autoAlign
              align="top-start"
              kind="ghost"
              className="cds--btn--danger--ghost"
              onClick={() => {
                if (!payment.voided) {
                  handleDeletePayment(payment);
                }
              }}>
              <TrashCan size={16} />
            </IconButton>
          </UserHasAccess>
        </span>
      ),
    }),
  }));

  const pendingPaymentRows = pendingPayments.map((pendingPayment) => ({
    id: pendingPayment.uuid,
    dateCreated: formatDate(new Date(pendingPayment.dateCreated)),
    amountTendered: formatCurrency(pendingPayment.amountTendered, {
      style: 'decimal',
      maximumFractionDigits: 2,
    }),
    paymentMethod: renderPaymentMethod(
      pendingPayment.paymentMode?.name ?? pendingPayment.paymentMode?.display ?? '--',
      pendingPayment.status === 'REJECTED' ? (
        <Tag className={styles.reviewStatusTag} type="red" size="sm">
          {t('rejected', 'Rejected')}
        </Tag>
      ) : undefined,
      pendingPayment.status === 'REJECTED' ? pendingPayment.reviewNote : undefined,
    ),
    ...(hasReferenceCodes && { referenceCodes: renderPendingPaymentReference(pendingPayment) }),
    ...(billIsOpen && { actions: renderPendingPaymentActions(pendingPayment) }),
  }));

  const paymentDates = new Map(
    [...(bill.payments ?? []), ...pendingPayments].map((payment) => [
      payment.uuid,
      new Date(payment.dateCreated).getTime() || 0,
    ]),
  );
  const rows = [...paymentRows, ...pendingPaymentRows].sort((left, right) => {
    const leftRank = rejectedPendingPaymentUuids.has(left.id) ? 2 : voidedPaymentUuids.has(left.id) ? 1 : 0;
    const rightRank = rejectedPendingPaymentUuids.has(right.id) ? 2 : voidedPaymentUuids.has(right.id) ? 1 : 0;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return paymentDates.get(right.id) - paymentDates.get(left.id);
  });

  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <DataTable size="sm" rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()} className={styles.table}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} className={getColumnClassName(header.key)}>
                    {header.key === 'amountTendered' ? (
                      <span className={styles.amountContent}>{header.header}</span>
                    ) : (
                      header.header
                    )}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const isVoidedPayment = voidedPaymentUuids.has(row.id);
                const isRejectedPayment = rejectedPendingPaymentUuids.has(row.id);

                return (
                  <TableRow
                    {...getRowProps({ row })}
                    className={
                      isRejectedPayment
                        ? styles.rejectedPaymentRow
                        : isVoidedPayment
                          ? styles.voidedPaymentRow
                          : undefined
                    }
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
                      <TableCell key={cell.id} className={getColumnClassName(cell.info.header)}>
                        {index === 0 && hoveredVoidedPaymentUuid === row.id ? (
                          <Tooltip
                            autoAlign
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
                        {cell.info.header === 'amountTendered' ? (
                          <span className={styles.amountContent}>{cell.value}</span>
                        ) : (
                          cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
      <ComposedModal open={Boolean(pendingPaymentToReject)} size="sm" onClose={closeRejectionModal}>
        <ModalHeader title={t('rejectInsurancePayment', 'Reject insurance payment')} />
        <ModalBody>
          <p className={styles.rejectionModalDescription}>
            {t('rejectInsurancePaymentDescription', 'Add a reason for rejecting this insurance payment request.')}
          </p>
          <TextArea
            id="insurance-payment-rejection-reason"
            labelText={t('rejectionReason', 'Rejection reason')}
            placeholder={t('enterRejectionReason', 'Enter the rejection reason')}
            value={rejectionReason}
            maxCount={1024}
            maxLength={1024}
            invalid={rejectionReasonTouched && !rejectionReason.trim()}
            invalidText={t('rejectionReasonRequired', 'A rejection reason is required')}
            disabled={updatingPendingPaymentUuid === pendingPaymentToReject?.uuid}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" disabled={Boolean(updatingPendingPaymentUuid)} onClick={closeRejectionModal}>
            {getCoreTranslation('cancel', 'Cancel')}
          </Button>
          <Button
            kind="danger"
            disabled={updatingPendingPaymentUuid === pendingPaymentToReject?.uuid}
            onClick={() => void confirmPendingPaymentRejection()}>
            {t('rejectPayment', 'Reject payment')}
          </Button>
        </ModalFooter>
      </ComposedModal>
    </>
  );
};

export default PaymentHistory;
