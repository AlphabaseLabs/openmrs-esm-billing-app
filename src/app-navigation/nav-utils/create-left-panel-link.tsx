import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LinkExtension } from './link-extension.component';
import { type CarbonIconType } from '@carbon/react/icons';

type LinkConfig = {
  route: string;
  title: string;
  otherRoutes?: Array<string>;
  icon?: CarbonIconType;
};

type LinkExtensionProps = {
  onSelect?: () => void;
};

const createLeftPanelLink = (config: LinkConfig) => {
  return ({ onSelect }: LinkExtensionProps) => (
    <BrowserRouter>
      <LinkExtension
        route={config.route}
        title={config.title}
        otherRoutes={config.otherRoutes}
        icon={config.icon}
        onSelect={onSelect}
      />
    </BrowserRouter>
  );
};

export default createLeftPanelLink;
