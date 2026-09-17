/* Placeholder page for a registry entry whose tool is not built yet. It exists so the registry,
   the router and the landing card can be exercised before the first tool ships — and so a visitor
   following a link finds an honest answer rather than a redirect. */

window.SoonPage = {
  props: { tool: { type: Object, required: true } },
  setup: function (props) {
    const i18n = window.i18n;
    return {
      t: i18n.t,
      lang: i18n.lang,
      title: Vue.computed(function () { return props.tool.title[i18n.lang.value]; }),
      blurb: Vue.computed(function () { return props.tool.blurb[i18n.lang.value]; })
    };
  },
  template: `
    <section class="section">
      <div class="container container-narrow">
        <PTag :value="t('home.soon')" severity="secondary" />
        <h1>{{ title }}</h1>
        <p class="lead">{{ blurb }}</p>
        <p>{{ t('home.soonBlurb') }}</p>
        <p class="row">
          <ShareLink />
        </p>
        <LegalLine />
      </div>
    </section>
  `
};
