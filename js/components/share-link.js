/* Copy the current URL, with a confirmation toast.

   The URL is the scenario (design.md §9), so this button is how a tool gets shared. It copies
   location.href verbatim — whatever the visitor sees is what the recipient gets.

   The clipboard mechanics, including the fallback for a non-secure context, live in
   js/services/clipboard.js because the leverage tool's "copy the prompt" needs the same ones. */

window.ShareLink = {
  props: {
    label: { type: String, default: null },
    severity: { type: String, default: 'secondary' }
  },
  setup: function (props) {
    const i18n = window.i18n;
    const toast = PrimeVue.useToast();

    function copy() {
      window.ClipboardService.copyText(location.href).then(function (ok) {
        toast.add(ok
          ? { severity: 'success', summary: i18n.t('share.copied'),
              detail: i18n.t('share.copiedDetail'), life: 3000 }
          : { severity: 'warn', summary: i18n.t('share.failed'),
              detail: i18n.t('share.failedDetail'), life: 6000 });
      });
    }

    return {
      copy: copy,
      buttonLabel: Vue.computed(function () { return props.label || i18n.t('share.copy'); })
    };
  },
  template: `
    <PButton :label="buttonLabel" icon="pi pi-link" :severity="severity" outlined @click="copy" />
  `
};
