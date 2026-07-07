import type { CookieConsentConfig } from 'vanilla-cookieconsent';
import * as CookieConsent from 'vanilla-cookieconsent';
import ptBR from './translations/pt-BR';
import en from './translations/en';
import {
  CAT_ADVERTISEMENT,
  CAT_ANALYTICS,
  CAT_FUNCTIONALITY,
  CAT_NECESSARY,
  CAT_SECURITY,
  SERVICE_AD_PERSONALIZATION,
  SERVICE_AD_STORAGE,
  SERVICE_AD_USER_DATA,
  SERVICE_ANALYTICS_STORAGE,
  SERVICE_FUNCTIONALITY_STORAGE,
  SERVICE_PERSONALIZATION_STORAGE,
  SERVICE_SECURITY_STORAGE,
} from './consts';

function updateGtagConsent() {
  const consent: Record<string, string> = {
    [SERVICE_ANALYTICS_STORAGE]: CookieConsent.acceptedService(
      SERVICE_ANALYTICS_STORAGE,
      CAT_ANALYTICS,
    )
      ? 'granted'
      : 'denied',
    [SERVICE_AD_STORAGE]: CookieConsent.acceptedService(SERVICE_AD_STORAGE, CAT_ADVERTISEMENT)
      ? 'granted'
      : 'denied',
    [SERVICE_AD_USER_DATA]: CookieConsent.acceptedService(SERVICE_AD_USER_DATA, CAT_ADVERTISEMENT)
      ? 'granted'
      : 'denied',
    [SERVICE_AD_PERSONALIZATION]: CookieConsent.acceptedService(
      SERVICE_AD_PERSONALIZATION,
      CAT_ADVERTISEMENT,
    )
      ? 'granted'
      : 'denied',
    [SERVICE_FUNCTIONALITY_STORAGE]: CookieConsent.acceptedService(
      SERVICE_FUNCTIONALITY_STORAGE,
      CAT_FUNCTIONALITY,
    )
      ? 'granted'
      : 'denied',
    [SERVICE_PERSONALIZATION_STORAGE]: CookieConsent.acceptedService(
      SERVICE_PERSONALIZATION_STORAGE,
      CAT_FUNCTIONALITY,
    )
      ? 'granted'
      : 'denied',
    [SERVICE_SECURITY_STORAGE]: CookieConsent.acceptedService(
      SERVICE_SECURITY_STORAGE,
      CAT_SECURITY,
    )
      ? 'granted'
      : 'denied',
  };

  window.gtag('consent', 'update', consent);

  window.dataLayer.push({
    event: 'cookie_consent_updated',
  });
}

export const config: CookieConsentConfig = {
  root: '#cc-container',
  disablePageInteraction: true,
  cookie: {
    name: 'meuracha_cc_cookie',
  },
  guiOptions: {
    consentModal: {
      layout: 'box inline',
      position: 'bottom left',
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: true,
      flipButtons: false,
    },
  },
  categories: {
    [CAT_NECESSARY]: {
      enabled: true,
      readOnly: true,
    },
    [CAT_SECURITY]: {
      enabled: true,
      readOnly: true,
      services: {
        [SERVICE_SECURITY_STORAGE]: {
          label:
            'Habilita armazenamento relacionado a segurança, como autenticação, prevenção de fraudes e outras proteções ao usuário.',
        },
      },
    },
    [CAT_ANALYTICS]: {
      services: {
        [SERVICE_ANALYTICS_STORAGE]: {
          label: 'Habilita armazenamento relacionado a análises, como duração da visita.',
        },
      },
      autoClear: {
        cookies: [
          {
            name: /^_ga/,
          },
          {
            name: '_gid',
          },
        ],
      },
    },
    [CAT_ADVERTISEMENT]: {
      services: {
        [SERVICE_AD_STORAGE]: {
          label: 'Habilita armazenamento (como cookies) relacionado a publicidade.',
        },
        [SERVICE_AD_USER_DATA]: {
          label:
            'Define consentimento para enviar dados do usuário relacionados a publicidade ao Google.',
        },
        [SERVICE_AD_PERSONALIZATION]: {
          label: 'Define consentimento para publicidade personalizada.',
        },
      },
    },
    [CAT_FUNCTIONALITY]: {
      services: {
        [SERVICE_FUNCTIONALITY_STORAGE]: {},
        [SERVICE_PERSONALIZATION_STORAGE]: {},
      },
    },
  },
  language: {
    default: 'pt-BR',
    autoDetect: 'browser',
    translations: {
      en: () => en,
      'pt-BR': () => ptBR,
    },
  },
  onFirstConsent: function () {
    updateGtagConsent();
  },
  onConsent: () => {
    updateGtagConsent();
  },
  onChange: () => {
    updateGtagConsent();
  },
};
