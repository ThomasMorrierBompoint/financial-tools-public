/* Application boot: the hash router, the shell, and component registration.

   Hash routing only — direct navigation and refresh must never 404 on static hosting, and the
   scenario plus the language travel in the hash query (design.md §9). The router is hand-written
   and about thirty lines; a router dependency would buy nothing here. */
(function () {
  'use strict';

  const i18n = window.i18n;

  /* ─── Router ─────────────────────────────────────────────────────────────────────────────── */

  /* '#/levier?p=1' -> 'levier' · '#/' and '' -> '' (the landing page) */
  function slugFromHash() {
    const raw = (location.hash || '#/').slice(1);
    const query = raw.indexOf('?');
    const path = query < 0 ? raw : raw.slice(0, query);
    return decodeURIComponent(path.replace(/^\/+/, '').split('/')[0] || '');
  }

  function toolFor(slug) {
    return window.TOOLS.find(function (tool) {
      return tool.slugs.fr === slug || tool.slugs.en === slug;
    }) || null;
  }

  const slug = Vue.ref(slugFromHash());
  const tool = Vue.computed(function () { return toolFor(slug.value); });

  /* Keep the query — it carries the language and, for a tool, the scenario. */
  function currentQuery() {
    const raw = location.hash || '';
    const query = raw.indexOf('?');
    return query < 0 ? '' : raw.slice(query);
  }

  function readRoute() {
    const next = slugFromHash();
    /* An unknown route is not an error page: send it to the landing page, keeping the language. */
    if (next && !toolFor(next)) {
      history.replaceState(null, '', location.pathname + location.search + '#/' + currentQuery());
      slug.value = '';
      return;
    }
    slug.value = next;
  }

  window.addEventListener('hashchange', readRoute);

  /* A tool's URL is in the reader's language: #/levier in French, #/leverage in English. Switching
     language rewrites the slug in place, keeping the query and adding no history entry. */
  Vue.watch(i18n.lang, function (lang) {
    if (!tool.value) return;
    const wanted = tool.value.slugs[lang];
    if (wanted === slug.value) return;
    history.replaceState(null, '', location.pathname + location.search +
      '#/' + wanted + currentQuery());
    slug.value = wanted;
  });

  /* ─── Shell ──────────────────────────────────────────────────────────────────────────────── */

  const Shell = {
    setup: function () {
      /* usePrimeVue() can only inject inside setup(); i18n needs the live config object so it can
         swap PrimeVue's own strings in place on a language change (design.md §8). */
      try { i18n.attachPrimeVue(PrimeVue.usePrimeVue()); }
      catch (error) { console.warn('PrimeVue locale not attached:', error); }

      const brand = window.Brand.pack;

      const page = Vue.computed(function () {
        return slug.value === '' ? 'HomePage' : (tool.value ? tool.value.page : 'HomePage');
      });

      /* HomePage takes no props; a tool page takes the registry entry it was routed from. */
      const pageProps = Vue.computed(function () {
        return tool.value ? { tool: tool.value } : {};
      });

      return {
        t: i18n.t,
        lang: i18n.lang,
        languages: i18n.SUPPORTED,
        setLang: i18n.setLang,
        tools: window.TOOLS,
        page: page,
        pageProps: pageProps,
        activeTool: tool,
        brandName: Vue.computed(function () { return brand.name[i18n.lang.value]; }),
        brandLegal: Vue.computed(function () { return brand.legal[i18n.lang.value]; }),
        logo: brand.logo,
        logoInverse: brand.logoInverse,
        repository: (window.SITE || {}).repository,
        homeHref: Vue.computed(function () { return '#/?lang=' + i18n.lang.value; }),
        toolHref: function (entry) {
          return '#/' + entry.slugs[i18n.lang.value] + '?lang=' + i18n.lang.value;
        }
      };
    },

    template: `
      <a class="skip-link" href="#main">{{ t('nav.skip') }}</a>

      <header class="site-header">
        <div class="utility-bar dark-block">
          <div class="container utility-bar-inner">
            <nav class="lang-toggle" :aria-label="t('lang.label')">
              <template v-for="(code, index) in languages" :key="code">
                <span v-if="index" class="lang-separator" aria-hidden="true">|</span>
                <button type="button"
                        :aria-current="lang === code ? 'true' : null"
                        :aria-label="lang === code ? t('lang.current') : t('lang.switch')"
                        @click="setLang(code)">{{ t('lang.' + code) }}</button>
              </template>
            </nav>
          </div>
        </div>

        <div class="main-bar">
          <div class="container main-bar-inner">
            <a class="brand-link" :href="homeHref">
              <img :src="logo" :alt="brandName" width="155" height="50">
            </a>
            <nav class="site-nav" :aria-label="t('nav.primary')">
              <a :href="homeHref"
                 :aria-current="!activeTool ? 'page' : null">{{ t('nav.home') }}</a>
              <a v-for="entry in tools" :key="entry.id" :href="toolHref(entry)"
                 :aria-current="activeTool && activeTool.id === entry.id ? 'page' : null">
                {{ entry.title[lang] }}
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main id="main">
        <component :is="page" v-bind="pageProps" />
      </main>

      <PToast position="bottom-right" />

      <footer class="site-footer dark-block">
        <div class="container">
          <div class="footer-columns">
            <div>
              <img :src="logoInverse" :alt="brandName" width="155" height="50">
            </div>
            <nav :aria-label="t('footer.site')">
              <h2 class="footer-heading">{{ t('footer.site') }}</h2>
              <ul class="footer-links">
                <li><a :href="homeHref">{{ t('footer.home') }}</a></li>
                <li v-for="entry in tools" :key="entry.id">
                  <a :href="toolHref(entry)">{{ entry.title[lang] }}</a>
                </li>
              </ul>
            </nav>
            <div>
              <h2 class="footer-heading">{{ t('footer.about') }}</h2>
              <ul class="footer-links">
                <li v-if="repository"><a :href="repository">{{ t('footer.source') }}</a></li>
              </ul>
            </div>
          </div>
          <p class="footer-legal legal">{{ brandLegal }}</p>
        </div>
      </footer>
    `
  };

  /* ─── Boot ───────────────────────────────────────────────────────────────────────────────── */

  readRoute();

  const app = Vue.createApp(Shell);

  /* PrimeVue.PrimeVue, not PrimeVue.default — the latter is the v4 name and is undefined in v5
     (design.md §3). PrimeUIX.Themes.Aura is the preset object itself, not .default. */
  app.use(PrimeVue.PrimeVue, {
    license: window.PRIMEUI_LICENSE,
    theme: {
      preset: window.Brand.preset(),
      options: { darkModeSelector: false, cssLayer: false }
    },
    locale: window.I18N[i18n.lang.value].prime,
    ripple: true
  });
  app.use(PrimeVue.ToastService);

  /* Nothing auto-registers in the UMD build. A typo here is silent in production, so a missing
     component is a loud failure instead. */
  ['Button', 'Card', 'Tag', 'Message', 'Toast', 'Dialog', 'Editor', 'InputText', 'InputNumber',
   'Textarea', 'Password', 'Select', 'SelectButton', 'MultiSelect', 'AutoComplete', 'ToggleSwitch',
   'Checkbox', 'Slider', 'DataTable', 'Column', 'Chart', 'Accordion', 'AccordionPanel',
   'AccordionHeader', 'AccordionContent', 'Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel']
    .forEach(function (name) {
      if (!PrimeVue[name]) throw new Error('PrimeVue.' + name + ' is not in the UMD bundle');
      app.component('P' + name, PrimeVue[name]);
    });

  app.directive('tooltip', PrimeVue.Tooltip);

  ['LegalLine', 'ShareLink', 'HomePage', 'SoonPage'].forEach(function (name) {
    app.component(name, window[name]);
  });

  app.mount('#app');
})();
