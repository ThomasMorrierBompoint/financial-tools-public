/* Bilingual support — fr-CA default and fallback, en-CA second (design.md §8).

   Language is product-level, not brand-level. Switching never reloads the page and never resets an
   input: the reactive value swaps, the preference is stored, the URL is rewritten in place and
   PrimeVue's own strings are reassigned. */
(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const LOCALE = { fr: 'fr-CA', en: 'en-CA' };   /* the audience is Canadian — never fr-FR / en-US */
  const STORAGE_KEY = 'lang';

  /* ─── PrimeVue locales ───────────────────────────────────────────────────────────────────────
     Both languages are supplied in full, including the aria block, which PrimeVue leaves in English
     and which is the half everyone forgets. Key names are those of primevue@5.0.1's own default
     locale, read out of the shipped bundle. */

  const PRIME = {
    fr: {
      startsWith: 'Commence par', contains: 'Contient', notContains: 'Ne contient pas',
      endsWith: 'Se termine par', equals: 'Égal à', notEquals: 'Différent de',
      noFilter: 'Aucun filtre', lt: 'Inférieur à', lte: 'Inférieur ou égal à',
      gt: 'Supérieur à', gte: 'Supérieur ou égal à', dateIs: 'La date est',
      dateIsNot: 'La date n’est pas', dateBefore: 'La date est avant',
      dateAfter: 'La date est après', clear: 'Effacer', apply: 'Appliquer',
      matchAll: 'Correspond à tout', matchAny: 'Correspond à au moins un',
      addRule: 'Ajouter une règle', removeRule: 'Retirer la règle',
      accept: 'Oui', reject: 'Non', choose: 'Choisir', upload: 'Téléverser', cancel: 'Annuler',
      completed: 'Terminé', pending: 'En cours',
      fileSizeTypes: ['o', 'ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'],
      dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      dayNamesShort: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
      dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      monthNames: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                   'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
      monthNamesShort: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin',
                        'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
      chooseYear: 'Choisir une année', chooseMonth: 'Choisir un mois',
      chooseDate: 'Choisir une date', prevDecade: 'Décennie précédente',
      nextDecade: 'Décennie suivante', prevYear: 'Année précédente', nextYear: 'Année suivante',
      prevMonth: 'Mois précédent', nextMonth: 'Mois suivant', prevHour: 'Heure précédente',
      nextHour: 'Heure suivante', prevMinute: 'Minute précédente', nextMinute: 'Minute suivante',
      prevSecond: 'Seconde précédente', nextSecond: 'Seconde suivante',
      am: 'am', pm: 'pm', today: 'Aujourd’hui', weekHeader: 'Sem',
      firstDayOfWeek: 0, showMonthAfterYear: false,
      dateFormat: 'yy-mm-dd',                       /* 2026-09-16, never 09/16/2026 */
      weak: 'Faible', medium: 'Moyen', strong: 'Fort',
      passwordPrompt: 'Saisissez un mot de passe',
      emptyFilterMessage: 'Aucun résultat', searchMessage: '{0} résultats disponibles',
      selectionMessage: '{0} éléments sélectionnés', emptySelectionMessage: 'Aucune sélection',
      emptySearchMessage: 'Aucun résultat', fileChosenMessage: '{0} fichiers',
      noFileChosenMessage: 'Aucun fichier choisi', emptyMessage: 'Aucune option disponible',
      aria: {
        trueLabel: 'Vrai', falseLabel: 'Faux', nullLabel: 'Non sélectionné',
        star: '1 étoile', stars: '{star} étoiles',
        selectAll: 'Tous les éléments sélectionnés',
        unselectAll: 'Aucun élément sélectionné',
        close: 'Fermer', previous: 'Précédent', next: 'Suivant', navigation: 'Navigation',
        scrollTop: 'Défiler vers le haut', moveTop: 'Déplacer tout en haut',
        moveUp: 'Déplacer vers le haut', moveDown: 'Déplacer vers le bas',
        moveBottom: 'Déplacer tout en bas', moveToTarget: 'Déplacer vers la cible',
        moveToSource: 'Déplacer vers la source',
        moveAllToTarget: 'Tout déplacer vers la cible',
        moveAllToSource: 'Tout déplacer vers la source',
        pageLabel: 'Page {page}', firstPageLabel: 'Première page',
        lastPageLabel: 'Dernière page', nextPageLabel: 'Page suivante',
        prevPageLabel: 'Page précédente', rowsPerPageLabel: 'Lignes par page',
        jumpToPageDropdownLabel: 'Aller à la page (liste)',
        jumpToPageInputLabel: 'Aller à la page (saisie)',
        selectRow: 'Ligne sélectionnée', unselectRow: 'Ligne désélectionnée',
        expandRow: 'Ligne développée', collapseRow: 'Ligne réduite',
        showFilterMenu: 'Afficher le menu de filtres',
        hideFilterMenu: 'Masquer le menu de filtres',
        filterOperator: 'Opérateur de filtre', filterConstraint: 'Contrainte de filtre',
        editRow: 'Modifier la ligne', saveEdit: 'Enregistrer', cancelEdit: 'Annuler',
        listView: 'Vue en liste', gridView: 'Vue en grille',
        slide: 'Diapositive', slideNumber: '{slideNumber}',
        zoomImage: 'Agrandir l’image', zoomIn: 'Agrandir', zoomOut: 'Réduire',
        rotateRight: 'Pivoter à droite', rotateLeft: 'Pivoter à gauche',
        listLabel: 'Liste d’options'
      }
    },

    /* English overrides PrimeVue's own defaults only where Canadian usage differs. */
    en: {
      dateFormat: 'yy-mm-dd',
      firstDayOfWeek: 0
    }
  };

  /* ─── Product strings ────────────────────────────────────────────────────────────────────────
     Flat keys, full sentences. Never assemble a sentence from fragments: French word order differs
     and every generated takeaway line is a template. */

  const STRINGS = {
    fr: {
      'site.title': 'Outils financiers',
      'site.description': 'Des outils financiers clairs, gratuits et sans inscription, pour ' +
                          'comprendre vos décisions financières.',

      'nav.skip': 'Aller au contenu principal',
      'nav.home': 'Accueil',
      'nav.primary': 'Navigation principale',
      'nav.utility': 'Navigation secondaire',

      'lang.label': 'Langue',
      'lang.fr': 'Fr',
      'lang.en': 'En',
      'lang.switch': 'Switch to English',
      'lang.current': 'Français, langue affichée',

      'home.h1': 'Outils financiers',
      'home.lead': 'Chaque outil répond à une seule question, avec des chiffres que vous pouvez ' +
                   'vérifier.',
      'home.toolsHeading': 'Les outils',
      'home.open': 'Ouvrir l’outil',
      'home.soon': 'Bientôt',
      'home.soonBlurb': 'Le premier outil arrive : un générateur de prompt d’analyse de levier ' +
                        'financier.',

      'footer.site': 'Le site',
      'footer.about': 'À propos',
      'footer.source': 'Code source',
      'footer.home': 'Accueil',

      'legal.disclaimer': 'À titre indicatif seulement — il ne s’agit pas de conseils ' +
                          'financiers.',

      'share.copy': 'Copier le lien',
      'share.copied': 'Lien copié',
      'share.copiedDetail': 'Le lien reproduit exactement ce que vous voyez.',
      'share.failed': 'La copie a échoué',
      'share.failedDetail': 'Copiez l’adresse depuis la barre du navigateur.'
    },

    en: {
      'site.title': 'Financial tools',
      'site.description': 'Clear financial tools, free and without signup, to understand your ' +
                          'financial decisions.',

      'nav.skip': 'Skip to main content',
      'nav.home': 'Home',
      'nav.primary': 'Main navigation',
      'nav.utility': 'Secondary navigation',

      'lang.label': 'Language',
      'lang.fr': 'Fr',
      'lang.en': 'En',
      'lang.switch': 'Afficher en français',
      'lang.current': 'English, displayed language',

      'home.h1': 'Financial tools',
      'home.lead': 'Each tool answers one question, with numbers you can check.',
      'home.toolsHeading': 'The tools',
      'home.open': 'Open the tool',
      'home.soon': 'Coming soon',
      'home.soonBlurb': 'The first tool is on its way: a financial leverage analysis prompt ' +
                        'generator.',

      'footer.site': 'The site',
      'footer.about': 'About',
      'footer.source': 'Source code',
      'footer.home': 'Home',

      'legal.disclaimer': 'For illustration only — not financial advice.',

      'share.copy': 'Copy the link',
      'share.copied': 'Link copied',
      'share.copiedDetail': 'The link reproduces exactly what you see.',
      'share.failed': 'Copying failed',
      'share.failedDetail': 'Copy the address from the browser bar.'
    }
  };

  /* ─── Selection ──────────────────────────────────────────────────────────────────────────── */

  /* The query string of the hash route: '#/levier?p=1&lang=en' -> URLSearchParams('p=1&lang=en') */
  function hashQuery() {
    const i = location.hash.indexOf('?');
    return new URLSearchParams(i < 0 ? '' : location.hash.slice(i + 1));
  }

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function persist(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode: not fatal */ }
  }

  /* Hash query → search query → stored preference → browser languages → fr. The hash comes first
     because that is where shared links carry their parameters; a stored preference beats the
     browser because the visitor chose it deliberately. */
  function pickLang() {
    const q = hashQuery().get('lang') || new URLSearchParams(location.search).get('lang');
    if (SUPPORTED.indexOf(q) > -1) return q;

    const saved = stored();
    if (SUPPORTED.indexOf(saved) > -1) return saved;

    const nav = (navigator.languages || [navigator.language || ''])
      .map(function (l) { return l.slice(0, 2).toLowerCase(); })
      .find(function (l) { return SUPPORTED.indexOf(l) > -1; });

    return nav || 'fr';
  }

  const lang = Vue.ref(pickLang());

  function t(key, params) {
    const table = STRINGS[lang.value] || STRINGS.fr;
    let value = table[key];
    if (value === undefined) value = STRINGS.fr[key];
    if (value === undefined) return key;          /* visible in development, never a blank space */
    if (params) {
      Object.keys(params).forEach(function (name) {
        value = value.split('{' + name + '}').join(params[name]);
      });
    }
    return value;
  }

  /* ─── Head and URL ───────────────────────────────────────────────────────────────────────── */

  function head(selector, create) {
    let node = document.head.querySelector(selector);
    if (!node) { node = create(); document.head.appendChild(node); }
    return node;
  }

  function updateHead() {
    document.documentElement.lang = LOCALE[lang.value];
    document.title = t('site.title');

    head('meta[name="description"]', function () {
      const m = document.createElement('meta');
      m.name = 'description';
      return m;
    }).content = t('site.description');

    SUPPORTED.forEach(function (code) {
      head('link[rel="alternate"][hreflang="' + LOCALE[code] + '"]', function () {
        const l = document.createElement('link');
        l.rel = 'alternate';
        l.hreflang = LOCALE[code];
        return l;
      }).href = './?lang=' + code;
    });
  }

  /* Rewrite lang in the hash query, in place — no reload, nothing reset. */
  function writeLangToUrl() {
    const hash = location.hash || '#/';
    const i = hash.indexOf('?');
    const route = i < 0 ? hash : hash.slice(0, i);
    const params = new URLSearchParams(i < 0 ? '' : hash.slice(i + 1));
    params.set('lang', lang.value);
    const query = params.toString();
    history.replaceState(null, '', location.pathname + location.search +
      route + (query ? '?' + query : ''));
  }

  /* PrimeVue's own strings are swapped in place, on the live config object, so mounted components
     pick them up without remounting. The instance is handed over from a component's setup(), which
     is the only place usePrimeVue() can inject it. */
  let primevue = null;

  function syncPrimeVue() {
    if (primevue && primevue.config && primevue.config.locale) {
      Object.assign(primevue.config.locale, PRIME[lang.value]);
    }
  }

  function attachPrimeVue(instance) {
    primevue = instance;
    syncPrimeVue();
  }

  function setLang(next) {
    if (SUPPORTED.indexOf(next) < 0 || next === lang.value) return;
    lang.value = next;
    persist(next);
    updateHead();
    writeLangToUrl();
    syncPrimeVue();
  }

  updateHead();

  window.I18N = {
    fr: { prime: PRIME.fr, strings: STRINGS.fr },
    en: { prime: PRIME.en, strings: STRINGS.en }
  };

  window.i18n = {
    SUPPORTED: SUPPORTED,
    LOCALE: LOCALE,
    lang: lang,
    locale: Vue.computed(function () { return LOCALE[lang.value]; }),
    t: t,
    setLang: setLang,
    pickLang: pickLang,
    hashQuery: hashQuery,
    attachPrimeVue: attachPrimeVue
  };
})();
