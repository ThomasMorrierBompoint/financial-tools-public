/* Leverage analysis prompt generator — the tool view.

   Batches 1–3 of docs/plan-implementation/leverage-prompt-generator/plan.md: the registry entry,
   the VARIABLES model and pure assembler, and the form.

   Layout is the form beside its live output rather than the tab strip in plan §3.2 — watching the
   prompt change as a variable changes is the thing worth seeing, and design.md §12 puts inputs and
   results side by side above 1200px. The Analyse and Présentation editors (batch 4) become tabs in
   the left column; the prompt stays where it is.

   All computation lives in js/utils/: levier-prompt.js assembles, levier-validate.js checks. This
   file wires state to markup and formats nothing itself. */

window.LevierPage = {
  /* Registered here rather than in app.js: these belong to this tool, not to the shell. */
  components: { VariablesForm: window.VariablesForm },

  props: { tool: { type: Object, required: true } },

  setup: function (props) {
    const i18n = window.i18n;

    /* The defaults are the starting state — the tool is useful before anything is typed
       (design.md §9). Batch 7 will restore this from localStorage instead. */
    const variables = Vue.reactive(window.LevierDefaults.values());

    const prompt = Vue.computed(function () {
      return window.LevierPrompt.assemble({ variables: variables }, i18n.lang.value);
    });

    return {
      t: i18n.t,
      title: Vue.computed(function () { return props.tool.title[i18n.lang.value]; }),
      blurb: Vue.computed(function () { return props.tool.blurb[i18n.lang.value]; }),
      variables: variables,
      prompt: prompt,
      notices: Vue.computed(function () { return window.LevierValidate.validate(variables); }),
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

        <div class="tool-split">
          <div class="tool-inputs">
            <h2>{{ t('levier.variablesHeading') }}</h2>
            <VariablesForm :variables="variables" :notices="notices" />
          </div>

          <div class="tool-output">
            <h2>{{ t('levier.previewHeading') }}</h2>
            <p class="field-help">{{ t('levier.previewNote') }}</p>
            <PTextarea :model-value="prompt" readonly rows="20" fluid
                       :aria-label="t('levier.previewHeading')" />
            <p class="legal">
              {{ t('levier.counts', { characters: characters, tokens: tokens }) }}
            </p>
          </div>
        </div>

        <p class="row">
          <ShareLink />
        </p>

        <LegalLine />
      </div>
    </section>
  `
};
