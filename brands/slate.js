/* Second brand pack — a deliberately contrasting test of the white-label seam (foundation plan
   §3.4). Everything a pack is allowed to change is changed: a teal primary instead of red, a
   6px radius instead of the 58px pill, a different family. If the product still looks coherent
   under this pack, the system holds. */

window.BRANDS = window.BRANDS || {};
window.BRANDS.slate = {
  id: 'slate',
  name: { fr: 'Style Slate', en: 'Slate style' },
  logo: './assets/brands/slate/logo.svg',
  logoInverse: './assets/brands/slate/logo-inverse.svg',
  favicon: './assets/brands/slate/favicon.svg',

  colors: {
    primary: '#0a6c5b', primaryHover: '#085b4c', primaryActive: '#064c40',
    primaryContrast: '#ffffff', primaryWash: '#e8f2f0',
    dark: '#17242e', darkDeep: '#0d171e',
    heading: '#1f3340', text: '#4a545c', textMuted: '#5b6772',
    accent: '#0b64a8'
  },

  fonts: {
    url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@200;300;400;500;600&display=swap',
    body:    '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
    display: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
    weights: { display: 600, light: 300, regular: 400, medium: 500, ultralight: 200 }
  },

  shape: { radiusButton: '6px', radiusCard: '4px' },

  legal: {
    fr: 'Outils à titre indicatif seulement. Aucun conseil financier, aucun lien avec une ' +
        'institution financière.',
    en: 'Tools for illustration only. No financial advice, no affiliation with any financial ' +
        'institution.'
  }
};
