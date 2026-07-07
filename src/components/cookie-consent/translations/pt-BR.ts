import {
  CAT_ADVERTISEMENT,
  CAT_ANALYTICS,
  CAT_FUNCTIONALITY,
  CAT_NECESSARY,
  CAT_SECURITY,
} from '../consts';

const config = {
  consentModal: {
    title: 'Usamos cookies',
    description:
      'O Meu Racha utiliza cookies para melhorar sua experiência no site. Se você prosseguir na navegação, entendemos que está de acordo com o uso de cookies.',
    acceptAllBtn: 'Aceitar todos',
    acceptNecessaryBtn: 'Rejeitar todos',
    showPreferencesBtn: 'Gerenciar preferências',
  },
  preferencesModal: {
    title: 'Preferências de Cookies',
    acceptAllBtn: 'Aceitar todos',
    acceptNecessaryBtn: 'Rejeitar todos',
    savePreferencesBtn: 'Salvar preferências',
    closeIconLabel: 'Fechar',
    serviceCounterLabel: 'Serviço|Serviços',
    sections: [
      {
        title: 'Uso de Cookies',
        description:
          'Usamos cookies para garantir as funcionalidades básicas do site e melhorar sua experiência online.',
      },
      {
        title: 'Cookies Estritamente Necessários',
        description:
          'Esses cookies são essenciais para o funcionamento adequado do site, por exemplo, para autenticação de usuários, acessibilidade e navegação.',
        linkedCategory: CAT_NECESSARY,
      },
      {
        title: 'Análises',
        description:
          'Cookies usados para análises ajudam a coletar dados que permitem aos serviços entender como os usuários interagem com um serviço específico. Essas informações permitem que os serviços melhorem o conteúdo e desenvolvam recursos melhores que aprimoram a experiência do usuário.',
        linkedCategory: CAT_ANALYTICS,
        cookieTable: {
          headers: {
            name: 'Nome',
            domain: 'Serviço',
            description: 'Descrição',
            expiration: 'Expiração',
          },
          body: [
            {
              name: '_ga',
              domain: 'Google Analytics',
              description:
                'Cookie definido pelo <a target="_blank" rel="noopener noreferrer" href="https://business.safety.google/adscookies/">Google Analytics</a>',
              expiration: 'Expira após 12 dias',
            },
            {
              name: '_gid',
              domain: 'Google Analytics',
              description:
                'Cookie definido pelo <a target="_blank" rel="noopener noreferrer" href="https://business.safety.google/adscookies/">Google Analytics</a>',
              expiration: 'Sessão',
            },
          ],
        },
      },
      {
        title: 'Publicidade',
        description:
          'O Google usa cookies para publicidade, incluindo exibição e renderização de anúncios, personalização de anúncios (dependendo de suas configurações em <a rel="noopener noreferrer" href="https://g.co/adsettings">g.co/adsettings</a>), limitação do número de vezes que um anúncio é exibido para um usuário, ocultação de anúncios que você escolheu parar de ver e medição da eficácia dos anúncios.',
        linkedCategory: CAT_ADVERTISEMENT,
      },
      {
        title: 'Funcionalidade',
        description:
          'Cookies usados para funcionalidade permitem que os usuários interajam com um serviço ou site para acessar recursos que são fundamentais para esse serviço.',
        linkedCategory: CAT_FUNCTIONALITY,
      },
      {
        title: 'Segurança',
        description:
          'Cookies usados para segurança autenticam usuários, previnem fraudes e protegem usuários enquanto interagem com um serviço.',
        linkedCategory: CAT_SECURITY,
      },
    ],
  },
};

export default config;
