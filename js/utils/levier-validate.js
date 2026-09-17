/* Cross-field checks for the VARIABLES form — pure, and deliberately non-blocking.

   Nothing here prevents generating a prompt. These are the combinations that produce a prompt the
   model will answer confidently and wrongly, so the visitor is told and left to decide (tool plan
   §4). Returning ids and params rather than sentences keeps the strings in i18n.js where the two
   languages stay in step, and lets the cases below assert on behaviour rather than on copy. */
(function () {
  'use strict';

  function isAuto(field) {
    return !!(field && typeof field === 'object' && field.auto);
  }

  function validate(variables) {
    const notices = [];
    const financing = variables.financing || {};
    const investor = variables.investor || {};
    const investment = variables.investment || {};

    /* Borrowing one amount and investing another is legitimate — a partial deployment — but it is
       far more often a half-finished edit, and the prompt reads as though it were deliberate. */
    if (typeof financing.amountBorrowed === 'number' &&
        typeof investment.amountInvested === 'number' &&
        financing.amountBorrowed !== investment.amountInvested) {
      notices.push({
        id: 'investedDiffersFromBorrowed',
        section: 'investment',
        field: 'amountInvested',
        params: { borrowed: financing.amountBorrowed, invested: investment.amountInvested }
      });
    }

    /* "Calculate based on income and province" cannot be honoured without a province. */
    if (isAuto(investor.taxRate) && !investor.province) {
      notices.push({ id: 'taxRateAutoWithoutProvince', section: 'investor', field: 'province' });
    }

    /* A horizon past the amortization asks about a debt that no longer exists at that date. */
    const horizons = financing.horizons || [];
    const beyond = horizons.filter(function (years) {
      return typeof financing.amortization === 'number' && years > financing.amortization;
    });
    if (beyond.length) {
      notices.push({
        id: 'horizonBeyondAmortization',
        section: 'financing',
        field: 'horizons',
        params: { horizons: beyond.join(', '), amortization: financing.amortization }
      });
    }

    return notices;
  }

  window.LevierValidate = { validate: validate, isAuto: isAuto };
})();
