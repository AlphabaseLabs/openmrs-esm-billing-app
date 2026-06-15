import React from 'react';
import { ModalBody, ModalFooter, Button, TextArea } from '@carbon/react';
import cancelBillStyles from './delete-services.scss';
import { type MappedBill } from '../../../types';
import { ResponsiveWrapper, openmrsFetch, restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

type DeleteBillModalProps = {
  onClose: () => void;
  bill: MappedBill;
  isForceDelete?: boolean;
};

const deleteSchema = z.object({
  reason: z.string().min(1, { message: 'Reason is required' }),
});

type DeleteBillFormData = z.infer<typeof deleteSchema>;

export const DeleteBillModal: React.FC<DeleteBillModalProps> = ({ onClose, bill, isForceDelete = false }) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    formState: { isValid, isSubmitting },
  } = useForm<DeleteBillFormData>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      reason: '',
    },
    mode: 'onChange',
  });
  const onSubmit = async (formData: DeleteBillFormData) => {
    try {
      const response = await openmrsFetch(
        `${restBaseUrl}/cashier/bill/${bill.uuid}?reason=${encodeURIComponent(formData.reason)}`,
        {
          method: 'DELETE',
        },
      );
      if (response.ok) {
        showSnackbar({
          title: t('billDelete', 'Bill delete'),
          subtitle: t('billDeleteSuccess', 'Bill delete was successful'),
          kind: 'success',
          timeoutInMs: 5000,
        });
        // mutate the bill
        mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/cashier/bill`), undefined, {
          revalidate: true,
        });
        onClose();
      }
    } catch (error) {
      showSnackbar({
        title: t('billDelete', 'Bill delete'),
        subtitle: t('billDeleteError', 'An error occurred while deleting the bill'),
        kind: 'error',
        timeoutInMs: 5000,
      });
    }
  };

  return (
    <React.Fragment>
      <div className={cancelBillStyles.modalHeaderLabel}>
        {isForceDelete ? t('forceDeleteBill', 'Force delete bill') : t('deleteBill', 'Delete bill')}
      </div>
      <ModalBody>
        <p className={cancelBillStyles.modalHeaderHeading}>
          {isForceDelete
            ? t(
                'forceDeleteBillConfirmation',
                'Force deleting this bill will permanently delete the bill and all of its line items. This action cannot be undone.',
              )
            : t(
                'deleteBillConfirmation',
                'Are you sure you want to delete this bill? All line items in this bill will be deleted. This action cannot be undone.',
              )}
        </p>
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="reason"
            render={({ field, fieldState: { error } }) => (
              <TextArea
                {...field}
                className={cancelBillStyles.formField}
                labelText={
                  isForceDelete
                    ? t('enterReasonForForceDeletingBill', 'Enter reason for force deleting bill')
                    : t('enterReasonForDeletingBill', 'Enter reason for deleting bill')
                }
                placeholder={
                  isForceDelete
                    ? t('enterReasonForForceDeletingBill', 'Enter reason for force deleting bill')
                    : t('enterReasonForDeletingBill', 'Enter reason for deleting bill')
                }
                invalid={!!error}
                invalidText={error?.message}
              />
            )}
          />
        </ResponsiveWrapper>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="danger" disabled={!isValid || isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isForceDelete ? t('deleteBill', 'Delete bill') : t('continue', 'Continue')}
        </Button>
      </ModalFooter>
    </React.Fragment>
  );
};
