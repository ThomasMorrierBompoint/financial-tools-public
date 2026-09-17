/* Leverage analysis prompt generator — the tool view.

   Batches 1–4 of docs/plan-implementation/leverage-prompt-generator/plan.md: the registry entry,
   the VARIABLES model and pure assembler, the form, and the two rich-text sections. Copying the
   prompt (batch 6) is still to come.

   Layout is the inputs beside their live output rather than the tab strip plan §3.2 first
   described — watching the prompt change as a variable changes is the thing worth seeing, and
   design.md §12 puts inputs and results side by side above 1200px. The tabs now live in the left
   column, which is where the two editors join the form.

   All computation lives in js/utils/: levier-prompt.js assembles, levier-validate.js checks,
   delta-text.js serializes. This file wires state to markup and formats nothing itself. */

window.LevierPage = {
  /* Registered here rather than in app.js: these belong to this tool, not to the shell. */
  components: { VariablesForm: window.VariablesForm, PromptEditor: window.PromptEditor },

  props: { tool: { type: Object, required: true } },

  setup: function (props) {
    const i18n = window.i18n;

    /* The defaults are the starting state — the tool is useful before anything is typed
       (design.md §9). Batch 7 will restore this from localStorage instead. */
    const variables = Vue.reactive(window.LevierDefaults.values());

    function seed(part) {
      return JSON.parse(JSON.stringify(window.LevierSeeds[part][i18n.lang.value]));
    }

    /* shallowRef, not reactive: a Delta is handed to Quill whole and replaced whole. Making its
       thousands of ops individually reactive would buy nothing and cost a proxy per op. */
    const analysis = Vue.shallowRef(seed('analysis'));
    const presentation = Vue.shallowRef(seed('presentation'));

    /* Whether the visitor has made this section theirs. Untouched prose follows the language;
       edited prose never does, because silently overwriting what someone wrote is the one thing
       this must not do (tool plan §10). Reset (batch 7) is the way back. */
    const touched = Vue.reactive({ analysis: false, presentation: false });

    Vue.watch(i18n.lang, function () {
      if (!touched.analysis) analysis.value = seed('analysis');
      if (!touched.presentation) presentation.value = seed('presentation');
    });

    const prompt = Vue.computed(function () {
      return window.LevierPrompt.assemble({
        variables: variables,
        analysis: analysis.value,
        presentation: presentation.value
      }, i18n.lang.value);
    });

    return {
      t: i18n.t,
      title: Vue.computed(function () { return props.tool.title[i18n.lang.value]; }),
      blurb: Vue.computed(function () { return props.tool.blurb[i18n.lang.value]; }),
      variables: variables,
      analysis: analysis,
      presentation: presentation,
      touched: touched,
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
            <PTabs value="variables">
              <PTabList>
                <PTab value="variables">{{ t('levier.variablesHeading') }}</PTab>
                <PTab value="analysis">{{ t('levier.analysisHeading') }}</PTab>
                <PTab value="presentation">{{ t('levier.presentationHeading') }}</PTab>
              </PTabList>
              <PTabPanels>
                <PTabPanel value="variables">
                  <VariablesForm :variables="variables" :notices="notices" />
                </PTabPanel>

                <PTabPanel value="analysis">
                  <p class="field-help">{{ t('levier.editorNote') }}</p>
                  <PromptEditor v-model="analysis" :label="t('levier.analysisHeading')"
                                @user-edit="touched.analysis = true" />
                </PTabPanel>

                <PTabPanel value="presentation">
                  <p class="field-help">{{ t('levier.editorNote') }}</p>
                  <PromptEditor v-model="presentation" :label="t('levier.presentationHeading')"
                                @user-edit="touched.presentation = true" />
                </PTabPanel>
              </PTabPanels>
            </PTabs>
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
