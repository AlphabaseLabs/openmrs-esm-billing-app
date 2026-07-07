const config = require('openmrs/default-webpack-config');

const transpiledNodeModules = ['@openmrs/esm-patient-common-lib'];

config.scriptRuleConfig.exclude = (resourcePath) =>
  /node_modules/.test(resourcePath) &&
  !transpiledNodeModules.some((packageName) => resourcePath.includes(`node_modules/${packageName}/`));

config.scssRuleConfig.use = [
  require.resolve('style-loader'),
  {
    loader: require.resolve('css-loader'),
  },
  {
    loader: require.resolve('sass-loader'),
    options: {
      api: 'modern',
      implementation: require('sass'),
    },
  },
];

module.exports = config;
