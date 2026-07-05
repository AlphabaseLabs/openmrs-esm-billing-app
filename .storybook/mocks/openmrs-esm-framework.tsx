import React from 'react';

type IconProps = {
  size?: number;
  [key: string]: unknown;
};

export const useLayoutType = () => 'desktop';

export const isDesktop = (layout: string) => layout === 'desktop' || layout === 'large-desktop';

export const useDebounce = <T,>(value: T) => value;

export const useConfig = () => ({
  localeCurrencyMapping: {
    en: 'PKR',
    'en-PK': 'PKR',
  },
  sendInvoiceUrl: '/storybook/send-invoice',
});

export const openmrsFetch = async (url?: string) => {
  if (`${url ?? ''}`.includes('/cashier/billableService')) {
    return {
      ok: true,
      data: {
        results: [
          {
            uuid: 'service-consultation',
            name: 'Consultation',
            shortName: 'Consultation',
            serviceStatus: 'ENABLED',
            serviceType: { display: 'Clinical service' },
            servicePrices: [
              { uuid: 'price-consultation', name: 'Default', price: 2000 },
              { uuid: 'price-consultation-card', name: 'Card', price: 2300 },
              { uuid: 'price-consultation-panel', name: 'Panel', price: 2500 },
            ],
          },
          {
            uuid: 'service-clear-aligner',
            name: 'Clear Aligner',
            shortName: 'Clear Aligner',
            serviceStatus: 'ENABLED',
            serviceType: { display: 'Dental service' },
            servicePrices: [
              { uuid: 'price-clear-aligner', name: 'Default', price: 249999 },
              { uuid: 'price-clear-aligner-card', name: 'Card', price: 259999 },
              { uuid: 'price-clear-aligner-panel', name: 'Panel', price: 279999 },
            ],
          },
          {
            uuid: 'service-registration',
            name: 'Registration',
            shortName: 'Registration',
            serviceStatus: 'ENABLED',
            serviceType: { display: 'Administration' },
            servicePrices: [
              { uuid: 'price-registration', name: 'Default', price: 5000 },
              { uuid: 'price-registration-card', name: 'Card', price: 5500 },
            ],
          },
        ],
      },
    };
  }

  return {
    ok: true,
    data: {},
  };
};

export const showSnackbar = () => {};

export const showModal = () => () => {};

export const navigate = () => {};

export const launchWorkspace2 = () => {};

export const launchWorkspaceGroup2 = () => {};

export const useVisit = () => ({
  activeVisit: null,
  currentVisit: null,
  isLoading: false,
});

export const useFeatureFlag = () => false;

export const restBaseUrl = '/ws/rest/v1';

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

export const getCoreTranslation = (_key: string, fallback: string) => fallback;

export const useSession = () => ({
  currentProvider: {
    uuid: 'provider-storybook',
    display: 'Storybook Provider',
  },
  sessionLocation: {
    uuid: 'location-storybook',
    display: 'Alphabase Clinic',
  },
});

export const UserHasAccess = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const ExtensionSlot = () => null;

export const ResponsiveWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const ErrorState = ({ headerTitle, error }: { headerTitle?: string; error?: Error | string }) => (
  <div role="alert">
    <strong>{headerTitle ?? 'Error'}</strong>
    {error ? <p>{typeof error === 'string' ? error : error.message}</p> : null}
  </div>
);

export const EditIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    focusable="false"
    height={size}
    viewBox="0 0 32 32"
    width={size}
    {...props}>
    <path d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0L6 15.6V23h7.4L25.4 9zM20.4 4 24 7.6l-2.8 2.8-3.6-3.6L20.4 4zM8 21v-4.6l8.2-8.2 3.6 3.6-8.2 8.2H8z" />
  </svg>
);
