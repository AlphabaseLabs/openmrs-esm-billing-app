import { Form, Select, SelectItem } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { PaymentStatus } from '../../../types';
import styles from '../payment-history.scss';
import { usePaymentFilterContext } from '../usePaymentFilterContext';

const schema = z.object({
  billStatus: z.string(),
});

type FormData = z.infer<typeof schema>;

export const BillStatusFilter = () => {
  const { t } = useTranslation();
  const { filters, setFilters } = usePaymentFilterContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      billStatus: PaymentStatus.PAID, // Default to PAID to match current behavior
    },
  });

  const { register, watch } = form;
  const selectedStatus = watch('billStatus');

  const handleStatusChange = (status: string) => {
    const newFilters = {
      ...filters,
      billStatus: status,
    };
    setFilters(newFilters);
  };

  const billStatusOptions = [
    { value: '', label: t('all', 'All') },
    { value: PaymentStatus.PAID, label: t('paid', 'Paid') },
    { value: PaymentStatus.PENDING, label: t('pending', 'Pending') },
    { value: PaymentStatus.CANCELLED, label: t('cancelled', 'Cancelled') },
    { value: PaymentStatus.CREDITED, label: t('credited', 'Credited') },
    { value: PaymentStatus.ADJUSTED, label: t('adjusted', 'Adjusted') },
    { value: PaymentStatus.EXEMPTED, label: t('exempted', 'Exempted') },
    { value: PaymentStatus.POSTED, label: t('posted', 'Posted') },
  ];

  return (
    <Form {...form}>
      <Select
        id="billStatus"
        {...register('billStatus')}
        labelText={t('billStatus', 'Bill Status')}
        className={styles.billStatusFilter}
        onChange={(e) => handleStatusChange(e.target.value)}>
        {billStatusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} text={option.label} />
        ))}
      </Select>
    </Form>
  );
};

