/* Copy the current URL, with a confirmation toast.

   The URL is the scenario (design.md §9), so this button is how a tool gets shared. It copies
   location.href verbatim — whatever the visitor sees is what the recipient gets. */

window.ShareLink = {
  props: {
    label: { type: String, default: null },
    severity: { type: String, default: 'secondary' }
  },
  setup: function (props) {
    const i18n = window.i18n;
    const toast = PrimeVue.useToast();

    /* navigator.clipboard needs a secure context; a file:// or plain-http visit falls back to the
       old selection trick rather than failing silently. */
    function legacyCopy(text) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { return document.execCommand('copy'); }
      finally { document.body.removeChild(field); }
    }

    function confirm(ok) {
      toast.add(ok
        ? { severity: 'success', summary: i18n.t('share.copied'),
            detail: i18n.t('share.copiedDetail'), life: 3000 }
        : { severity: 'warn', summary: i18n.t('share.failed'),
            detail: i18n.t('share.failedDetail'), life: 6000 });
    }

    function copy() {
      const url = location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url)
          .then(function () { confirm(true); })
          .catch(function () { confirm(legacyCopy(url)); });
        return;
      }
      confirm(legacyCopy(url));
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
