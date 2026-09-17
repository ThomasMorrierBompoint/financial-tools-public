/* Landing page: a card grid built from the registry, so a new tool appears here for free. */

window.HomePage = {
  setup: function () {
    const i18n = window.i18n;
    return {
      t: i18n.t,
      lang: i18n.lang,
      tools: window.TOOLS,
      href: function (tool) {
        return '#/' + tool.slugs[i18n.lang.value] + '?lang=' + i18n.lang.value;
      }
    };
  },
  template: `
    <section class="section">
      <div class="container">
        <h1>{{ t('home.h1') }}</h1>
        <p class="lead">{{ t('home.lead') }}</p>
      </div>
    </section>

    <section class="section surface-muted">
      <div class="container">
        <h2>{{ t('home.toolsHeading') }}</h2>
        <ul class="grid-cards tool-grid">
          <li v-for="tool in tools" :key="tool.id">
            <PCard class="tool-card">
              <template #title>
                <span class="tool-card-title">
                  <i :class="tool.icon" aria-hidden="true"></i>
                  <a :href="href(tool)">{{ tool.title[lang] }}</a>
                </span>
              </template>
              <template #content>
                <p>{{ tool.blurb[lang] }}</p>
              </template>
              <template #footer>
                <PTag v-if="tool.status === 'soon'" :value="t('home.soon')" severity="secondary" />
              </template>
            </PCard>
          </li>
        </ul>
      </div>
    </section>
  `
};
