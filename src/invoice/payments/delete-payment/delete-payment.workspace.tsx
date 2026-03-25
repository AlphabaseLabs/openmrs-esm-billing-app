import React from 'react';
import styles from './delete-payment.scss';
import { type Payment, type MappedBill } from '../../../types';
import { Controller, useForm } from 'react-hook-form';
import {
  ResponsiveWrapper,
  Workspace2,
  type Workspace2DefinitionProps,
  restBaseUrl,
  showSnackbar,
  useLayoutType,
} from '@openmrs/esm-framework';
import classNames from 'classnames';
import { Form, Button, ButtonSet, InlineLoading, TextArea, InlineNotification } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { convertToCurrency } from '../../../helpers';
import { deleteBillPayment } from './delete-payment.resource';
import { mutate } from 'swr';
import { extractErrorMessagesFromResponse } from '../../../utils';

type DeletePaymentWorkspaceProps = {
  bill: MappedBill;
  payment: Payment;
};

const DeletePaymentWorkspace: React.FC<Workspace2DefinitionProps<DeletePaymentWorkspaceProps>> = ({
  workspaceProps,
  closeWorkspace,
}) => {
  const { t } = useTranslation();
  const { bill, payment } = workspaceProps ?? ({} as DeletePaymentWorkspaceProps);
  const isTablet = useLayoutType() === 'tablet';

  const deleteSchema = z.object({
    reason: z.string().min(1, { message: 'Reason is required' }),
  });

  type DeletePaymentFormData = z.infer<typeof deleteSchema>;

  const {
    handleSubmit,
    control,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<DeletePaymentFormData>({
    resolver: zodResolver(deleteSchema),
  });

  const onSubmit = async (formData: DeletePaymentFormData) => {
    try {
      const response = await deleteBillPayment(bill.uuid, payment.uuid, formData.reason);
      if (response.ok) {
        showSnackbar({
          title: t('paymentDelete', 'Payment delete'),
          subtitle: t('paymentDeleteSuccess', 'Payment delete was successful'),
          kind: 'success',
          timeoutInMs: 5000,
        });
      }
      // mutate the bill
      mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/cashier/bill`), undefined, {
        revalidate: true,
      });
      closeWorkspace({ discardUnsavedChanges: true });
    } catch (error) {
      showSnackbar({
        title: t('paymentDelete', 'Payment delete'),
        subtitle:
          t('paymentDeleteError', 'An error occurred while deleting the payment') +
          `: ${extractErrorMessagesFromResponse(error?.responseBody)}`,
        kind: 'error',
        timeoutInMs: 5000,
      });
    }
  };

  const subtitleText = `${t('paymentMethod', 'Payment method')}: ${payment.instanceType.name} - ${t(
    'amount',
    'Amount',
  )}: ${convertToCurrency(payment.amountTendered)}`;

  return (
    <Workspace2 title={t('deletePayment', 'Delete Payment')}>
      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formContainer}>
          <InlineNotification
            title={t('deletePayment', 'Delete Payment')}
            subtitle={subtitleText}
            kind="warning"
            lowContrast
            hideCloseButton
          />
          <ResponsiveWrapper>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <TextArea
                  {...field}
                  placeholder={t('pleaseEnterReasonForDeletion', 'Please enter reason for deletion')}
                  labelText={t('reasonForDeletion', 'Reason for deletion')}
                />
              )}
            />
          </ResponsiveWrapper>
        </div>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
          <Button className={styles.button} kind="secondary" onClick={() => closeWorkspace()}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button className={styles.button} disabled={!isValid || !isDirty || isSubmitting} kind="danger" type="submit">
            {isSubmitting ? (
              <InlineLoading description={t('deletingPayment', 'Deleting payment...')} />
            ) : (
              <span>{t('deleteAndClose', 'Delete & close')}</span>
            )}
          </Button>
        </ButtonSet>
      </Form>
    </Workspace2>
  );
};

export default DeletePaymentWorkspace;
