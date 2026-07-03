const React = require('react');

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
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
  }),
};
