import React from 'react';
import { render, screen } from '@testing-library/react';
import { createDashboardLink } from './create-dashboard-link';

const mockDashboardExtension = jest.fn(({ path, title, basePath, icon }) => (
  <div data-testid="dashboard-extension">
    {path}|{title}|{basePath}|{icon}
  </div>
));

jest.mock('@openmrs/esm-styleguide', () => ({
  DashboardExtension: (props) => mockDashboardExtension(props),
}));

describe('createDashboardLink', () => {
  test('renders a dashboard extension with the configured home base path', () => {
    const DashboardLink = createDashboardLink({
      path: 'billing',
      title: 'Accounting',
      basePath: `${window.spaBase}/home`,
      icon: 'omrs-icon-money',
    });

    render(<DashboardLink />);

    expect(screen.getByTestId('dashboard-extension')).toHaveTextContent(
      `billing|Accounting|${window.spaBase}/home|omrs-icon-money`,
    );
    expect(mockDashboardExtension).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'billing',
        title: 'Accounting',
        basePath: `${window.spaBase}/home`,
        icon: 'omrs-icon-money',
      }),
    );
  });
});
