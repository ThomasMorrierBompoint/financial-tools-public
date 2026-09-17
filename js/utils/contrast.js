/* WCAG contrast ratios (pure). The per-brand checklist in design.md §16 asks for the same handful
   of pairings on every pack; this makes that check mechanical rather than a promise — tests.html
   runs it over every registered pack, so a new brand cannot ship below AA unnoticed.

   Formula: WCAG 2.1 relative luminance and contrast ratio. */
(function () {
  'use strict';

  function channel(value) {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /* '#rrggbb' or '#rgb' */
  function luminance(hex) {
    const value = String(hex).trim().replace('#', '');
    const full = value.length === 3
      ? value.split('').map(function (c) { return c + c; }).join('')
      : value;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return NaN;
    const rgb = [0, 2, 4].map(function (i) { return parseInt(full.slice(i, i + 2), 16); });
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function ratio(foreground, background) {
    const a = luminance(foreground);
    const b = luminance(background);
    if (isNaN(a) || isNaN(b)) return NaN;
    const light = Math.max(a, b);
    const dark = Math.min(a, b);
    return (light + 0.05) / (dark + 0.05);
  }

  window.Contrast = { ratio: ratio, luminance: luminance };
})();
