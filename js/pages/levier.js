/* Leverage analysis prompt generator — the tool view.

   Batches 1–7 of docs/plan-implementation/leverage-prompt-generator/plan.md: the registry entry,
   the VARIABLES model and pure assembler, the form, the two rich-text sections, the live preview,
   Phase 1 (copy and download) and persistence.

   Layout is the inputs beside their live output rather than the tab strip plan §3.2 first
   described — watching the prompt change as a variable changes is the thing worth seeing, and
   design.md §12 puts inputs and results side by side above 1200px. The tabs now live in the left
   column, which is where the two editors join the form.

   All computation lives in js/utils/: levier-prompt.js assembles, levier-validate.js checks,
   levier-share.js maps state to a URL, levier-storage.js is the saved-state envelope,
   delta-text.js serializes. This file wires state to markup and formats nothing itself. */

window.LevierPage = {
  /* Registered here rather than in app.js: these belong to this tool, not to the shell. */
  components: { VariablesForm: window.VariablesForm, PromptEditor: window.PromptEditor },

  props: { tool: { type: Object, required: true } },

  setup: function (props) {
    const i18n = window.i18n;
    const toast = PrimeVue.useToast();
    const D = window.LevierDefaults;
    const Share = window.LevierShare;
    const Store = window.LevierStorage;

    /* Longer than the URL's 300ms: localStorage writes are synchronous and serializing two Deltas
       is not free, so this one waits for a real pause in typing (tool plan §6). */
    const SAVE_DELAY = 500;

    const SPEC = Share.spec();

    /* ─── Restore ─────────────────────────────────────────────────────────────────────────────

       Precedence, highest first: the URL, then the saved state, then the defaults — the same
       order i18n uses for the language, and for the same reason (foundation plan §4). An explicit
       link is an instruction; a saved blob is only a convenience.

       localStorage throws rather than returning null when storage is disabled or a private window
       is full, and a tool that will not open is worse than a tool that forgets. */
    function readSaved() {
      try {
        const raw = localStorage.getItem(Store.KEY);
        return raw ? Store.deserialize(raw) : null;
      } catch (error) { return null; }
    }

    const saved = readSaved();
    const restored = saved && saved.ok ? saved.value : null;

    const variables = Vue.reactive(D.values());

    /* Group by group, so the reactive object the form is bound to is never replaced — replacing
       it would detach every v-model in variables-form.js. */
    function assign(next) {
      Object.keys(variables).forEach(function (group) {
        if (next[group]) Object.assign(variables[group], next[group]);
      });
    }

    const url = window.Scenario.bind(SPEC, {
      read: function () { return Share.toFlat(variables); },
      write: function (flat) { assign(Share.fromFlat(flat)); }
    });

    /* A link that names even one parameter wins whole. Blending the sender's values with the
       recipient's saved ones would produce a form neither of them ever saw, and foundation plan
       §8 asks for "exactly what the sender saw". Prose is not in the URL and is left alone. */
    if (url.present) assign(Share.fromFlat(url.fromUrl));
    else if (restored) assign(restored.variables);

    /* Then make the URL say what the form says, before anyone can touch anything. Without this a
       scenario restored from storage leaves a bare URL, and `share-link` — which copies
       location.href verbatim — would send a recipient the defaults while the sender is looking at
       their own numbers. Encoding drops defaults, so a fresh visit still gets a clean URL. */
    url.push();

    function seed(part) {
      return JSON.parse(JSON.stringify(window.LevierSeeds[part][i18n.lang.value]));
    }

    /* Only prose the visitor made theirs is restored. Untouched prose is just the seed of
       whatever language was active when it was saved, so restoring it across a language change
       would show French text to someone reading English — the seed for the current language is
       the better answer, and is what an untouched section means. */
    function openWith(part) {
      return restored && restored.touched[part] && restored[part] ? restored[part] : seed(part);
    }

    /* shallowRef, not reactive: a Delta is handed to Quill whole and replaced whole. Making its
       thousands of ops individually reactive would buy nothing and cost a proxy per op. */
    const analysis = Vue.shallowRef(openWith('analysis'));
    const presentation = Vue.shallowRef(openWith('presentation'));

    /* Whether the visitor has made this section theirs. Untouched prose follows the language;
       edited prose never does, because silently overwriting what someone wrote is the one thing
       this must not do (tool plan §10). Reset is the way back. */
    const touched = Vue.reactive({
      analysis: !!(restored && restored.touched.analysis),
      presentation: !!(restored && restored.touched.presentation)
    });

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

    /* ─── Autosave ────────────────────────────────────────────────────────────────────────── */

    function snapshot() {
      return {
        lang: i18n.lang.value,
        variables: variables,
        analysis: analysis.value,
        presentation: presentation.value,
        touched: touched
      };
    }

    let saveTimer = null;

    /* A failed write is not worth interrupting anyone over: the tool keeps working, it just does
       not remember. Quota and disabled-storage both land here. */
    function save() {
      try { localStorage.setItem(Store.KEY, Store.serialize(snapshot())); }
      catch (error) { /* nothing to do and nothing worth saying */ }
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_DELAY);
    }

    /* Variables go to both places; prose only to storage, because a Delta has no business in a
       URL (tool plan §6). */
    Vue.watch(variables, function () { scheduleSave(); url.schedule(); }, { deep: true });
    Vue.watch([analysis, presentation, function () { return [touched.analysis,
                                                            touched.presentation]; }],
              scheduleSave, { deep: true });

    /* ─── Reset, export, import ───────────────────────────────────────────────────────────── */

    const confirmingReset = Vue.ref(false);
    const fileInput = Vue.ref(null);

    function reset() {
      assign(D.values());
      touched.analysis = false;
      touched.presentation = false;
      analysis.value = seed('analysis');
      presentation.value = seed('presentation');

      /* Clear the URL and the saved blob now rather than on the next debounce tick: someone who
         resets and immediately closes the tab must not come back to the old scenario. */
      try { localStorage.removeItem(Store.KEY); } catch (error) { /* already gone */ }
      url.push();

      confirmingReset.value = false;
      toast.add({ severity: 'success', summary: i18n.t('levier.resetDone'),
                  detail: i18n.t('levier.resetDoneDetail'), life: 3000 });
    }

    function exportJson() {
      window.DownloadService.downloadText(Store.serialize(snapshot()),
                                          Store.fileName(i18n.lang.value),
                                          'application/json');
      toast.add({ severity: 'success', summary: i18n.t('levier.exported'),
                  detail: i18n.t('levier.exportedDetail'), life: 3000 });
    }

    function importJson(value) {
      assign(value.variables);
      if (value.analysis) analysis.value = value.analysis;
      if (value.presentation) presentation.value = value.presentation;
      /* The file's own flags, not an inference from whether it carried prose: a section the
         sender never edited should keep following the reader's language. */
      touched.analysis = value.touched.analysis;
      touched.presentation = value.touched.presentation;
      url.push();
      toast.add({ severity: 'success', summary: i18n.t('levier.imported'),
                  detail: i18n.t('levier.importedDetail'), life: 3000 });
    }

    function refuse(reason) {
      toast.add({ severity: 'warn', summary: i18n.t('levier.importFailed'),
                  detail: i18n.t('levier.importFailed.' + reason), life: 8000 });
    }

    /* A hidden <input type="file"> behind a button: PrimeVue's FileUpload is a whole upload
       widget with progress and a drop zone, and this reads one small file locally. */
    function pickFile() {
      if (fileInput.value) fileInput.value.click();
    }

    function onFile(event) {
      const file = event.target.files && event.target.files[0];
      /* Reset the input either way, or picking the same file twice fires no change event. */
      function done() { event.target.value = ''; }
      if (!file) { done(); return; }

      const reader = new FileReader();
      reader.onload = function () {
        const result = Store.deserialize(String(reader.result));
        if (result.ok) importJson(result.value); else refuse(result.reason);
        done();
      };
      reader.onerror = function () { refuse('unreadable'); done(); };
      reader.readAsText(file);
    }

    return {
      t: i18n.t,
      copyPrompt: function () {
        window.ClipboardService.copyText(prompt.value).then(function (ok) {
          toast.add(ok
            ? { severity: 'success', summary: i18n.t('levier.copied'),
                detail: i18n.t('levier.copiedDetail'), life: 3000 }
            : { severity: 'warn', summary: i18n.t('levier.copyFailed'),
                detail: i18n.t('levier.copyFailedDetail'), life: 6000 });
        });
      },
      /* The summary says "started", not "downloaded": a Blob download has no completion callback,
         so the page cannot honestly claim the file landed. The browser's own download UI is the
         confirmation; this toast exists for the second line, which is the privacy promise. */
      downloadPrompt: function () {
        window.DownloadService.downloadText(prompt.value,
                                            window.LevierPrompt.fileName(i18n.lang.value),
                                            'text/markdown');
        toast.add({ severity: 'success', summary: i18n.t('levier.downloaded'),
                    detail: i18n.t('levier.downloadedDetail'), life: 3000 });
      },
      confirmingReset: confirmingReset,
      fileInput: fileInput,
      reset: reset,
      exportJson: exportJson,
      pickFile: pickFile,
      onFile: onFile,
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

        <!-- Sticky to the bottom of the tool region (plan §3.2): the form is long, and the
             action the visitor came for should never be a scroll away. What you do with the
             prompt sits on the left; what you do with the scenario is pushed to the right. -->
        <div class="tool-actions">
          <div class="tool-actions-row">
          <PButton :label="t('levier.copy')" icon="pi pi-copy" @click="copyPrompt" />
          <PButton :label="t('levier.download')" icon="pi pi-download"
                   severity="secondary" outlined @click="downloadPrompt" />
          <ShareLink />

          <span class="tool-actions-gap"></span>

          <PButton :label="t('levier.export')" icon="pi pi-file-export"
                   severity="secondary" text @click="exportJson" />
          <PButton :label="t('levier.import')" icon="pi pi-file-import"
                   severity="secondary" text @click="pickFile" />
          <PButton :label="t('levier.reset')" icon="pi pi-refresh"
                   severity="secondary" text @click="confirmingReset = true" />

          <!-- Off-screen rather than display:none so assistive tech can still reach it, and
               labelled because a bare file input announces nothing useful. -->
          <input ref="fileInput" type="file" accept="application/json,.json"
                 class="visually-hidden" :aria-label="t('levier.import')" @change="onFile">
          </div>

          <!-- Inside the sticky bar, not after it: a caveat about what a shared link leaves
               behind is only useful while the share button is on screen. -->
          <p class="field-help tool-actions-note">{{ t('levier.savedNote') }}</p>
        </div>

        <PDialog v-model:visible="confirmingReset" modal :draggable="false"
                 :header="t('levier.reset')" :style="{ width: '32rem' }">
          <p>{{ t('levier.resetWarning') }}</p>
          <template #footer>
            <PButton :label="t('levier.cancel')" severity="secondary" text
                     @click="confirmingReset = false" />
            <PButton :label="t('levier.resetConfirm')" icon="pi pi-refresh" @click="reset" />
          </template>
        </PDialog>

        <LegalLine />
      </div>
    </section>
  `
};
