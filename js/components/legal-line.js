/* The illustration-only line. Every tool carries it, in both languages (README.md §3). */

window.LegalLine = {
  setup: function () {
    return { t: window.i18n.t };
  },
  template: `
    <p class="legal legal-line">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <span>{{ t('legal.disclaimer') }}</span>
    </p>
  `
};
