import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import dayjs from 'dayjs';
import { type Timesheet, type Filter } from '../../types';

interface BillingHistoryFilterContextType {
  dateRange: [Date, Date];
  setDateRange: Dispatch<SetStateAction<[Date, Date]>>;
  appliedFilters: string[];
  setAppliedFilters: Dispatch<SetStateAction<string[]>>;
  appliedTimesheet: Timesheet | undefined;
  setAppliedTimesheet: Dispatch<SetStateAction<Timesheet | undefined>>;
  resetFilters: () => void;
  getAllAppliedFilters: () => string[];
  filters: Filter;
  setFilters: Dispatch<SetStateAction<Filter>>;
}

const defaultDateRange: [Date, Date] = [new Date(0), dayjs().endOf('day').toDate()];
const defaultFilters: Filter = {
  paymentMethods: [],
  cashiers: [],
  serviceTypes: [],
  billStatus: '',
  patientUuid: '',
};

export const BillingHistoryFilterContext = createContext<BillingHistoryFilterContextType>({
  dateRange: defaultDateRange,
  setDateRange: () => {},
  appliedFilters: [],
  setAppliedFilters: () => {},
  appliedTimesheet: undefined,
  setAppliedTimesheet: () => {},
  resetFilters: () => {},
  getAllAppliedFilters: () => [],
  filters: defaultFilters,
  setFilters: () => {},
});

interface BillingHistoryFilterProviderProps {
  children: ReactNode;
}

export const BillingHistoryFilterProvider = ({ children }: BillingHistoryFilterProviderProps) => {
  const [dateRange, setDateRange] = useState<[Date, Date]>(defaultDateRange);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [appliedTimesheet, setAppliedTimesheet] = useState<Timesheet | undefined>();
  const [filters, setFilters] = useState<Filter>(defaultFilters);

  const resetFilters = useCallback(() => {
    setAppliedFilters([]);
    setAppliedTimesheet(undefined);
    setDateRange(defaultDateRange);
    setFilters(defaultFilters);
  }, []);

  const getAllAppliedFilters = useCallback((): string[] => {
    const allFilters = [...appliedFilters];
    if (appliedTimesheet) {
      allFilters.push(`${appliedTimesheet.display} (${appliedTimesheet.cashier.display})`);
    }
    return allFilters;
  }, [appliedFilters, appliedTimesheet]);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      appliedFilters,
      setAppliedFilters,
      appliedTimesheet,
      setAppliedTimesheet,
      resetFilters,
      getAllAppliedFilters,
      filters,
      setFilters,
    }),
    [appliedFilters, appliedTimesheet, dateRange, filters, getAllAppliedFilters, resetFilters],
  );

  return <BillingHistoryFilterContext.Provider value={value}>{children}</BillingHistoryFilterContext.Provider>;
};

export const useBillingHistoryFilterContext = () => {
  const context = useContext(BillingHistoryFilterContext);

  if (context === undefined) {
    throw new Error('useBillingHistoryFilterContext must be used within a BillingHistoryFilterProvider');
  }

  return context;
};
