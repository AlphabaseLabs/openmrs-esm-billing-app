import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardExtension } from '@openmrs/esm-styleguide';
import { type IconId } from '@openmrs/esm-framework';

type DashboardLinkConfig = {
  path: string;
  title: string;
  basePath: string;
  icon?: IconId;
};

export const createDashboardLink = (config: DashboardLinkConfig) => () => (
  <BrowserRouter>
    <DashboardExtension path={config.path} title={config.title} basePath={config.basePath} icon={config.icon} />
  </BrowserRouter>
);
