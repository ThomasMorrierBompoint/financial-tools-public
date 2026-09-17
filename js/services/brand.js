/* Brand application (design.md §5, §7).

   One brand is active per deployment, chosen once at boot and never changed afterwards: this file
   runs at load time, before app.mount(), and the choice is fixed for the life of the page. There is
   no runtime switcher and no stored brand preference — rebranding is editing DEFAULT_BRAND in
   js/config.js and deploying.

   Four jobs, and nothing else: select, apply CSS variables, inject font + favicon, build the
   PrimeVue preset. */
(function () {
  'use strict';

  /* The pack's key names and the CSS property names differ on purpose (fonts.body → --brand-font),
     and fonts.weights is nested — so this is an explicit map, never a blind loop over the pack.
     fonts.url, logo, logoInverse, favicon, name and legal are consumed by JS, not CSS, and are
     deliberately absent. */
  const CSS_VARS = {
    'colors.primary':         '--brand-primary',
    'colors.primaryHover':    '--brand-primary-hover',
    'colors.primaryActive':   '--brand-primary-active',
    'colors.primaryContrast': '--brand-primary-contrast',
    'colors.primaryWash':     '--brand-primary-wash',
    'colors.dark':            '--brand-dark',
    'colors.darkDeep':        '--brand-dark-deep',
    'colors.heading':         '--brand-heading',
    'colors.text':            '--brand-text',
    'colors.textMuted':       '--brand-text-muted',
    'colors.accent':          '--brand-accent',
    'fonts.body':             '--brand-font',
    'fonts.display':          '--brand-font-display',
    'fonts.weights.ultralight': '--brand-weight-ultralight',
    'fonts.weights.light':      '--brand-weight-light',
    'fonts.weights.regular':    '--brand-weight-regular',
    'fonts.weights.medium':     '--brand-weight-medium',
    'fonts.weights.display':    '--brand-weight-display',
    'shape.radiusButton':     '--brand-radius-button',
    'shape.radiusCard':       '--brand-radius-card'
  };

  /* Consumed by JS rather than CSS, but just as required: a pack without a logo is broken. */
  const REQUIRED_KEYS = ['id', 'name.fr', 'name.en', 'logo', 'logoInverse', 'favicon',
                         'legal.fr', 'legal.en'];

  const FALLBACK_BRAND = 'bnc';

  function at(object, path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? undefined : o[k]); }, object);
  }

  /* ?brand=<id> → window.DEFAULT_BRAND → 'bnc'. The constant is the real answer for a deployment;
     the query parameter exists only to show someone a second pack without redeploying. */
  function select() {
    const packs = window.BRANDS || {};
    const requested = new URLSearchParams(location.search).get('brand');
    const id = [requested, window.DEFAULT_BRAND, FALLBACK_BRAND]
      .find(function (candidate) { return candidate && packs[candidate]; });

    if (!id) {
      throw new Error('Brand: no brand pack available. Looked for "' +
        [requested, window.DEFAULT_BRAND, FALLBACK_BRAND].filter(Boolean).join('", "') +
        '" in window.BRANDS — is the brand’s <script> tag in index.html?');
    }
    return packs[id];
  }

  /* A pack missing a key is a hard error at boot, not a silent fallback: a half-applied brand is
     worse than a crash. Validate everything before writing anything. */
  function applyCssVars(pack) {
    const missing = Object.keys(CSS_VARS).concat(REQUIRED_KEYS).filter(function (path) {
      const value = at(pack, path);
      return value === undefined || value === null || value === '';
    });

    if (missing.length) {
      throw new Error('Brand "' + (pack.id || '?') + '" is missing: ' + missing.join(', '));
    }

    const root = document.documentElement;
    Object.keys(CSS_VARS).forEach(function (path) {
      root.style.setProperty(CSS_VARS[path], String(at(pack, path)));
    });
  }

  function injectFontAndFavicon(pack) {
    if (pack.fonts.url) {
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = pack.fonts.url;
      document.head.appendChild(font);
    }

    const icon = document.querySelector('link[rel="icon"]') || document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = pack.favicon;
    document.head.appendChild(icon);
  }

  /* color-mix() strings are valid PrimeVue token values — verified in Chromium (design.md §7). */
  function ramp(hex) {
    return {
       50: 'color-mix(in srgb, ' + hex + '  8%, white)',
      100: 'color-mix(in srgb, ' + hex + ' 16%, white)',
      200: 'color-mix(in srgb, ' + hex + ' 32%, white)',
      300: 'color-mix(in srgb, ' + hex + ' 50%, white)',
      400: 'color-mix(in srgb, ' + hex + ' 75%, white)',
      500: hex,
      600: 'color-mix(in srgb, ' + hex + ' 88%, black)',
      700: 'color-mix(in srgb, ' + hex + ' 78%, black)',
      800: 'color-mix(in srgb, ' + hex + ' 66%, black)',
      900: 'color-mix(in srgb, ' + hex + ' 54%, black)',
      950: 'color-mix(in srgb, ' + hex + ' 38%, black)'
    };
  }

  /* The same colours that became CSS variables also become PrimeVue tokens. One source of truth —
     never hand-maintain a second palette inside the preset. */
  function presetFor(pack) {
    const c = pack.colors;
    return PrimeVue.definePreset(PrimeUIX.Themes.Aura, {
      semantic: {
        primary: ramp(c.primary),
        formField: { borderRadius: pack.shape.radiusCard, paddingX: '12px', paddingY: '10px' },
        focusRing: { width: '3px', style: 'solid',
                     color: 'color-mix(in srgb, ' + c.accent + ' 80%, transparent)', offset: '0' },
        colorScheme: { light: {
          primary: { color: c.primary, contrastColor: c.primaryContrast,
                     hoverColor: c.primaryHover, activeColor: c.primaryActive },
          surface: { 0: '#ffffff', 50: '#fafafa', 100: '#efefef', 200: '#e7e7e7', 300: '#e1e1e1',
                     400: '#d2d2d2', 500: '#c2c2c2', 600: c.textMuted, 700: c.text,
                     800: c.heading, 900: c.dark, 950: c.darkDeep },
          text: { color: c.text, mutedColor: c.textMuted },
          content: { borderRadius: pack.shape.radiusCard }
        }}
      },
      components: {
        button: { root: { borderRadius: pack.shape.radiusButton, paddingX: '24px', paddingY: '10px',
                          label: { fontWeight: '500' } },
                  /* Aura draws a secondary button's label from {surface.500} in both the outlined
                     and the text variant, and this preset maps that to #c2c2c2 — 1.78:1 on white,
                     nowhere near the 4.5:1 AA floor README.md §7 makes absolute. The brand's own
                     muted text colour is what it should have been: 5.62:1 for BNC, 5.79:1 for
                     Slate, measured. Token paths verified against @primeuix/themes@3.0.0. Every
                     secondary button on the site reads through these two lines (design.md §7). */
                  outlined: { secondary: { color: c.textMuted, borderColor: '{surface.400}' } },
                  text:     { secondary: { color: c.textMuted } } },
        card:   { root: { borderRadius: pack.shape.radiusCard, shadow: 'var(--shadow-card)' } },
        tag:    { root: { borderRadius: pack.shape.radiusButton } },
        slider: { handle: { background: c.primary } }
      }
    });
  }

  const pack = select();
  applyCssVars(pack);
  injectFontAndFavicon(pack);

  window.Brand = {
    id: pack.id,
    pack: pack,
    preset: function () { return presetFor(pack); }
  };
})();
