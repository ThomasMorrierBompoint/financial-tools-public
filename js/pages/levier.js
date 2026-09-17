/* Leverage analysis prompt generator — the tool view.

   Batches 1 and 2 of docs/plan-implementation/leverage-prompt-generator/plan.md: the page the
   registry routes to, and a read-only preview of the prompt that levier-prompt.js assembles from
   the defaults. The VARIABLES form (batch 3), the two editors (batch 4) and the copy action
   (batch 6) replace the preview panel; nothing here is meant to survive them unchanged.

   All computation lives in js/utils/levier-prompt.js. This file wires state to markup and does no
   formatting of its own. */

window.LevierPage = {
  props: { tool: { type: Object, required: true } },
  setup: function (props) {
    const i18n = window.i18n;

    /* The defaults are the starting state; the form will edit this object in place (batch 3) and
       autosave will persist it (batch 7). */
    const variables = Vue.reactive(window.LevierDefaults.values());

    const prompt = Vue.computed(function () {
      return window.LevierPrompt.assemble({ variables: variables }, i18n.lang.value);
    });

    return {
      t: i18n.t,
      title: Vue.computed(function () { return props.tool.title[i18n.lang.value]; }),
      blurb: Vue.computed(function () { return props.tool.blurb[i18n.lang.value]; }),
      prompt: prompt,
      characters: Vue.computed(function () {
        return window.Format.number(prompt.value.length, i18n.lang.value);
      }),
      tokens: Vue.computed(function () {
        return window.Format.number(window.LevierPrompt.estimateTokens(prompt.value),
                                    i18n.lang.value);
      })
    };
  },
  template: `
    <section class="section">
      <div class="container">
        <h1>{{ title }}</h1>
        <p class="lead">{{ blurb }}</p>

        <PMessage severity="info" :closable="false">{{ t('levier.buildingNote') }}</PMessage>

        <h2>{{ t('levier.previewHeading') }}</h2>
        <p>{{ t('levier.previewNote') }}</p>

        <PTextarea :model-value="prompt" readonly rows="18" fluid
                   :aria-label="t('levier.previewHeading')" />

        <p class="legal">{{ t('levier.counts', { characters: characters, tokens: tokens }) }}</p>

        <p class="row">
          <ShareLink />
        </p>

        <LegalLine />
      </div>
    </section>
  `
};
