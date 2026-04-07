const config = require('openmrs/default-webpack-config');

const transpiledNodeModules = ['@openmrs/esm-patient-common-lib'];

config.scriptRuleConfig.exclude = (resourcePath) =>
  /node_modules/.test(resourcePath) &&
  !transpiledNodeModules.some((packageName) => resourcePath.includes(`node_modules/${packageName}/`));

module.exports = config;
