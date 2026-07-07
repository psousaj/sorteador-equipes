import {
  CAT_ADVERTISEMENT,
  CAT_ANALYTICS,
  CAT_FUNCTIONALITY,
  CAT_NECESSARY,
  CAT_SECURITY,
} from '../consts';

const config = {
  consentModal: {
    title: 'We use cookies',
    description:
      'Meu Racha uses cookies to improve your browsing experience. By continuing to browse, you agree to the use of cookies.',
    acceptAllBtn: 'Accept all',
    acceptNecessaryBtn: 'Reject all',
    showPreferencesBtn: 'Manage preferences',
  },
  preferencesModal: {
    title: 'Cookie Preferences',
    acceptAllBtn: 'Accept all',
    acceptNecessaryBtn: 'Reject all',
    savePreferencesBtn: 'Save preferences',
    closeIconLabel: 'Close',
    serviceCounterLabel: 'Service|Services',
    sections: [
      {
        title: 'Cookie Usage',
        description:
          'We use cookies to ensure basic site functionality and enhance your online experience.',
      },
      {
        title: 'Strictly Necessary Cookies',
        description:
          'These cookies are essential for the proper functioning of the site, such as user authentication, accessibility, and navigation.',
        linkedCategory: CAT_NECESSARY,
      },
      {
        title: 'Analytics',
        description:
          'Analytics cookies help collect data that allows services to understand how users interact with a particular service. This information enables services to improve content and develop better features.',
        linkedCategory: CAT_ANALYTICS,
        cookieTable: {
          headers: {
            name: 'Name',
            domain: 'Service',
            description: 'Description',
            expiration: 'Expiration',
          },
          body: [
            {
              name: '_ga',
              domain: 'Google Analytics',
              description:
                'Cookie set by <a target="_blank" rel="noopener noreferrer" href="https://business.safety.google/adscookies/">Google Analytics</a>',
              expiration: 'Expires after 12 days',
            },
            {
              name: '_gid',
              domain: 'Google Analytics',
              description:
                'Cookie set by <a target="_blank" rel="noopener noreferrer" href="https://business.safety.google/adscookies/">Google Analytics</a>',
              expiration: 'Session',
            },
          ],
        },
      },
      {
        title: 'Advertising',
        description:
          'Google uses cookies for advertising, including ad display and rendering, ad personalization (depending on your settings at <a rel="noopener noreferrer" href="https://g.co/adsettings">g.co/adsettings</a>), limiting how often an ad is shown to a user, hiding ads you have chosen to stop seeing, and measuring ad effectiveness.',
        linkedCategory: CAT_ADVERTISEMENT,
      },
      {
        title: 'Functionality',
        description:
          'Functionality cookies allow users to interact with a service or site to access features that are fundamental to that service.',
        linkedCategory: CAT_FUNCTIONALITY,
      },
      {
        title: 'Security',
        description:
          'Security cookies authenticate users, prevent fraud, and protect users while interacting with a service.',
        linkedCategory: CAT_SECURITY,
      },
    ],
  },
};

export default config;
