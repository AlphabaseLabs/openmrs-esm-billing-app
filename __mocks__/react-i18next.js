const React = require('react');

function interpolate(value, options) {
  if (!options) {
    return value;
  }

  return Object.entries(options).reduce(
    (translatedValue, [key, replacement]) =>
      translatedValue.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(replacement)),
    value,
  );
}

module.exports = {
  I18nextProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  Trans: ({ children }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    i18n: {
      changeLanguage: () => Promise.resolve(),
    },
    t: (key, fallback, options) => interpolate(typeof fallback === 'string' ? fallback : key, options),
  }),
};
