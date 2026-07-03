import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-webpack5';

const currentDir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const webpack = require('webpack');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.NormalModuleReplacementPlugin(
        /^\.\.\/hooks\/useBillableServices$/,
        `${currentDir}/mocks/useBillableServices.ts`,
      ),
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/workspaces$/, `${currentDir}/mocks/workspaces.ts`),
    ];

    config.module = {
      ...config.module,
      rules: [
        ...(config.module?.rules ?? []),
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve('swc-loader'),
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                  },
                },
              },
            },
          },
        },
        {
          test: /\.s[ac]ss$/,
          use: [
            require.resolve('style-loader'),
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
                modules: {
                  auto: /\.scss$/i,
                  namedExport: false,
                  exportLocalsConvention: 'asIs',
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
              },
            },
            require.resolve('sass-loader'),
          ],
        },
      ],
    };

    config.resolve = {
      ...config.resolve,
      extensions: Array.from(new Set([...(config.resolve?.extensions ?? []), '.ts', '.tsx'])),
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@mocks': `${currentDir}/../__mocks__`,
        'react-i18next': `${currentDir}/../__mocks__/react-i18next.js`,
        '@openmrs/esm-framework/mock$': `${currentDir}/mocks/openmrs-esm-framework.tsx`,
        '@openmrs/esm-framework$': `${currentDir}/mocks/openmrs-esm-framework.tsx`,
        '@openmrs/esm-framework': `${currentDir}/mocks/openmrs-esm-framework.tsx`,
      },
    };

    return config;
  },
};

export default config;
