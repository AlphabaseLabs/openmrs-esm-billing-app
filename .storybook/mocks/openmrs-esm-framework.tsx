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
});

export const openmrsFetch = async () => ({
  data: {},
});

export const showSnackbar = () => {};

export const restBaseUrl = '/ws/rest/v1';

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
