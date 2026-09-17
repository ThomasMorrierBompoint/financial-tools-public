/* One rich-text section of the prompt (tool plan §5, foundation plan §7.1).

   <PEditor> is PrimeVue's own Quill wrapper, themed by the active brand — no hand-wrapping, and
   quill.snow.css is never loaded (design.md §11). Used twice, so the toolbar subset lives here
   once: headings, bold, italic, both list kinds, links and code, and nothing else. Every control
   offered is a format delta-text.js has to serialize, so a narrow toolbar is a correctness
   measure rather than taste.

   The model is the Quill Delta, not the HTML string v-model would give: it is what the prompt is
   serialized from and what autosave persists. Quill is therefore driven directly — setContents on
   load, getContents on change — instead of through v-model.

   editorStyle sets a height and nothing else. It is tempting to add overflow-y:auto there, and an
   earlier version did: the container's scrollHeight reports the full document, which reads like
   content about to spill. It is not — Quill's own .ql-editor already scrolls inside that height,
   and the inline rule only adds a SECOND scroll container, so the editor painted two scrollbars
   side by side. Measured in Chromium: with the rule, both .p-editor-content and .ql-editor paint
   a 15px bar; without it, only .ql-editor does, and the content still scrolls. */

window.PromptEditor = {
  props: {
    modelValue: { type: Object, required: true },   /* a Quill Delta */
    label: { type: String, required: true }
  },
  emits: ['update:modelValue', 'user-edit'],

  setup: function (props, context) {
    const i18n = window.i18n;
    let instance = null;

    function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

    function onLoad(event) {
      instance = event.instance;
      instance.setContents(props.modelValue);
    }

    function onTextChange(event) {
      context.emit('update:modelValue', event.instance.getContents());
      /* 'api' fires for our own setContents; only a real edit makes the prose the visitor's, and
         that is what stops a language switch from overwriting it (tool plan §10). */
      if (event.source === 'user') context.emit('user-edit');
    }

    /* A re-seed from outside — switching language on untouched prose, or Reset — has to reach
       Quill. Comparing first keeps setContents from re-entering through text-change. */
    Vue.watch(function () { return props.modelValue; }, function (next) {
      if (instance && !same(instance.getContents(), next)) instance.setContents(next);
    });

    return { t: i18n.t, onLoad: onLoad, onTextChange: onTextChange };
  },

  template: `
    <PEditor :aria-label="label" editorStyle="height: 26rem"
             @load="onLoad" @text-change="onTextChange">
      <template #toolbar>
        <span class="ql-formats">
          <select class="ql-header" :aria-label="t('levier.editor.heading')">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option selected></option>
          </select>
        </span>
        <span class="ql-formats">
          <button class="ql-bold" type="button" :aria-label="t('levier.editor.bold')"></button>
          <button class="ql-italic" type="button" :aria-label="t('levier.editor.italic')"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered" type="button"
                  :aria-label="t('levier.editor.ordered')"></button>
          <button class="ql-list" value="bullet" type="button"
                  :aria-label="t('levier.editor.bullet')"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-link" type="button" :aria-label="t('levier.editor.link')"></button>
          <button class="ql-code" type="button" :aria-label="t('levier.editor.code')"></button>
          <button class="ql-code-block" type="button"
                  :aria-label="t('levier.editor.codeBlock')"></button>
        </span>
      </template>
    </PEditor>
  `
};
