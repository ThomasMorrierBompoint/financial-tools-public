/* The Auto half of a value-or-instruction field (tool plan §4).

   Several variables in the source prompt are instructions rather than values — "[à déterminer]",
   "[calculer selon revenu et province]". Checking Auto disables the input and makes the generated
   prompt carry that instruction verbatim, so the model is asked to determine the figure instead of
   being handed a number the visitor invented.

   It sits beside the control rather than wrapping it so that the label, the input and the hint stay
   in one markup path in variables-form.js — a wrapper would mean writing every control twice.

   Accessibility: a disabled input is not reachable by keyboard, so the state cannot be left to the
   greying alone (design.md §13). The hint is associated with the input through aria-describedby and
   is a live region, so toggling Auto is announced and the reason is available on focus. */

window.AutoField = {
  props: {
    modelValue: { type: Object, required: true },   /* { auto: Boolean, value: * } */
    instruction: { type: String, required: true },  /* what the prompt carries when Auto is on */
    inputId: { type: String, required: true }
  },
  emits: ['update:modelValue'],
  setup: function (props, context) {
    const i18n = window.i18n;

    const auto = Vue.computed({
      get: function () { return !!props.modelValue.auto; },
      set: function (next) {
        context.emit('update:modelValue', { auto: next, value: props.modelValue.value });
      }
    });

    return {
      t: i18n.t,
      auto: auto,
      checkboxId: Vue.computed(function () { return props.inputId + '-auto'; }),
      hintId: Vue.computed(function () { return props.inputId + '-auto-hint'; })
    };
  },
  template: `
    <div class="field-auto">
      <PCheckbox v-model="auto" binary :inputId="checkboxId" />
      <label :for="checkboxId">{{ t('levier.auto') }}</label>
    </div>
    <p class="field-help" :id="hintId" aria-live="polite">
      {{ auto ? t('levier.autoOn', { instruction: instruction }) : t('levier.autoOff') }}
    </p>
  `
};
