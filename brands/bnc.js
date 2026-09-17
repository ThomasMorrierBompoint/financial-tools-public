/* Default and reference brand pack (design.md §5). Visual language only — no BNC logo, pictogram,
   photography or wordmark, and nothing here implies affiliation. The mark is a neutral placeholder.

   Values extracted from the live bnc.ca stylesheets, September 2026. This pack is the calibration
   target: if another pack applied to the same product still feels coherent, the system works. */

window.BRANDS = window.BRANDS || {};
window.BRANDS.bnc = {
  id: 'bnc',
  name: { fr: 'Style Banque Nationale', en: 'National Bank style' },
  logo: './assets/brands/bnc/logo.svg',
  logoInverse: './assets/brands/bnc/logo-inverse.svg',
  favicon: './assets/brands/bnc/favicon.svg',

  colors: {
    primary: '#e41c23', primaryHover: '#be171d', primaryActive: '#a3141a',
    primaryContrast: '#ffffff', primaryWash: '#fce6e7',
    dark: '#00314d', darkDeep: '#001e2e',
    heading: '#425865', text: '#565656', textMuted: '#566a7a',
    accent: '#1572c5'
  },

  fonts: {
    /* Gilroy is licensed and not on a public CDN; Figtree is the free stand-in with the same
       geometric character, and the system stack catches the rest. */
    url: 'https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap',
    body:    '"Gilroy", "Figtree", "Helvetica Neue", Arial, sans-serif',
    display: '"Gilroy", "Figtree", "Helvetica Neue", Arial, sans-serif',
    weights: { display: 600, light: 300, regular: 400, medium: 500, ultralight: 200 }
  },

  shape: { radiusButton: '58px', radiusCard: '8px' },

  legal: {
    fr: 'Outils à titre indicatif seulement. Aucun lien avec une institution financière; ' +
        'la Banque Nationale du Canada n’est ni l’auteur ni le commanditaire de ce site.',
    en: 'Tools for illustration only. Not affiliated with any financial institution; ' +
        'National Bank of Canada neither authored nor sponsored this site.'
  }
};
