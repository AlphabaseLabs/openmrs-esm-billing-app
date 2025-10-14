import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import dayjs from 'dayjs';

export const generateReceiptNumber = async (): Promise<string> => {
  try {
    const today = dayjs();
    const startOfDay = today.startOf('day').toISOString();
    const endOfDay = today.endOf('day').toISOString();

    // Fetch today's bills to get the count for sequence number
    const url = `${restBaseUrl}/cashier/bill?v=custom:(receiptNumber)&createdOnOrAfter=${startOfDay}&createdOnOrBefore=${endOfDay}`;
    const response = await openmrsFetch(url);
    const bills = response?.data?.results || [];

    // Generate sequence number based on today's bill count + 1
    const sequenceNumber = bills.length == 0 ? 1 : parseInt(bills[0].receiptNumber.split('-')[1]) + 1;

    // Format: YYYYMMDD-XXX (e.g., 20231215-001)
    const dateString = today.format('YYYYMMDD');
    const paddedSequence = sequenceNumber.toString().padStart(3, '0');

    return `${dateString}-${paddedSequence}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    // Fallback to timestamp-based if API fails
    const fallbackTimestamp = Date.now().toString();
    const dateString = dayjs().format('YYYYMMDD');
    return `${dateString}-${fallbackTimestamp.slice(-3)}`;
  }
};
