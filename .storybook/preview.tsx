import React from 'react';
import type { Preview } from '@storybook/react-webpack5';
import '@carbon/styles/css/styles.css';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="omrs-breakpoint-gt-tablet">
        <Story />
      </div>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f4f4f4' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
};

export default preview;
