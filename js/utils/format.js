/* Intl formatters (design.md §8). Nothing anywhere in the product hand-formats a number.

   Take whatever Intl produces and do not post-process it. For fr-CA it emits U+00A0 as the group
   separator and before the dollar sign — "1 234,50 $" — not the narrower U+202F a typographer would
   choose. That is correct Canadian output and every other fr-CA site renders it the same way.

   Every function takes an explicit language so it stays pure and testable; omitted, it follows the
   active language. */
(function () {
  'use strict';

  const LOCALE = { fr: 'fr-CA', en: 'en-CA' };
  const CURRENCY = 'CAD';
  const NO_VALUE = '—';                     /* em dash, never "NaN" in front of a visitor */

  const cache = new Map();

  function formatter(locale, options) {
    const key = locale + '|' + JSON.stringify(options);
    if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(locale, options));
    return cache.get(key);
  }

  function localeFor(lang) {
    const active = (window.i18n && window.i18n.lang.value) || 'fr';
    return LOCALE[lang] || LOCALE[active] || LOCALE.fr;
  }

  function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  /* 1234.5 -> "1 234,50 $" (fr) · "$1,234.50" (en) */
  function money(value, lang, options) {
    if (!isNumber(value)) return NO_VALUE;
    const decimals = options && options.decimals !== undefined ? options.decimals : 2;
    return formatter(localeFor(lang), {
      style: 'currency', currency: CURRENCY,
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }).format(value);
  }

  /* A fraction: 0.0425 -> "4,25 %" (fr) · "4.25%" (en) */
  function percent(fraction, lang, options) {
    if (!isNumber(fraction)) return NO_VALUE;
    const decimals = options && options.decimals !== undefined ? options.decimals : 2;
    return formatter(localeFor(lang), {
      style: 'percent',
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }).format(fraction);
  }

  /* Percentage points, which is how rates are entered and stored: 4.25 -> "4,25 %" */
  function rate(points, lang, options) {
    if (!isNumber(points)) return NO_VALUE;
    return percent(points / 100, lang, options);
  }

  function number(value, lang, options) {
    if (!isNumber(value)) return NO_VALUE;
    const decimals = options && options.decimals !== undefined ? options.decimals : 0;
    return formatter(localeFor(lang), {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }).format(value);
  }

  /* 'short' gives 2026-09-16 in both languages; 'long' gives 16 septembre 2026 / September 16, 2026.
     Never 09/16/2026. */
  function date(value, lang, options) {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return NO_VALUE;
    const style = (options && options.style) || 'short';
    const shape = style === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat(localeFor(lang), shape).format(d);
  }

  window.Format = {
    LOCALE: LOCALE,
    CURRENCY: CURRENCY,
    NO_VALUE: NO_VALUE,
    money: money,
    percent: percent,
    rate: rate,
    number: number,
    date: date
  };
})();
