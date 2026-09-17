/* The leverage tool's variables as a URL scenario — pure: objects in, objects out.

   js/composables/scenario.js speaks a flat object of short keys; this tool's state is six nested
   groups, some of whose fields are a value-or-instruction pair. This file is the translation, and
   nothing else. Cases in tests.html.

   THE KEYS BELOW ARE A PUBLIC INTERFACE. Every link anyone has ever shared is spelled with them,
   so a key may be added but never renamed or reused for something else (foundation plan §8). They
   are listed in one table rather than scattered through levier-defaults.js precisely so that
   uniqueness and coverage can be read off one screen — and so tests.html can assert both.

   Prose is deliberately absent. The two editor bodies are tens of kilobytes of Delta and belong
   nowhere near a URL; a shared link refills the form and leaves prose alone (tool plan §6, §13). */
(function () {
  'use strict';

  const D = window.LevierDefaults;

  /* 'group.field' → the parameter name. Short, lowercase, no separators. */
  const KEYS = {
    'financing.amountBorrowed':          'amt',
    'financing.financingType':           'fin',
    'financing.initialRate':             'rate',
    'financing.rateType':                'rt',
    'financing.amortization':            'am',
    'financing.paymentFrequency':        'freq',
    'financing.horizons':                'hz',
    'financing.financingFees':           'fees',
    'financing.deductibleInterest':      'ded',

    'investor.taxableIncome':            'inc',
    'investor.province':                 'prov',
    'investor.accountTypes':             'acct',
    'investor.taxRate':                  'tax',

    'investment.amountInvested':         'inv',
    'investment.portfolioType':          'pf',
    'investment.portfolioOther':         'pfo',
    'investment.returnsToTest':          'ret',
    'investment.managementFees':         'mer',
    'investment.inflation':              'infl',
    'investment.additionalContributions': 'add',

    'scenarios.marketCorrection':        'crash',
    'scenarios.crashTiming':             'when',
    'scenarios.returnAfterCrash':        'after',

    'rates.baseline':                    'base',
    'rates.favourable':                  'up',
    'rates.unfavourable':                'down',

    'monteCarlo.enabled':                'mc',
    'monteCarlo.simulations':            'sims',
    'monteCarlo.averageReturn':          'mcr',
    'monteCarlo.volatility':             'vol',
    'monteCarlo.percentiles':            'pct'
  };

  /* The sentinel an Auto field carries in a URL. It cannot collide with a real value: no option
     key is 'auto' and no number parses to it. */
  const AUTO = 'auto';

  /* A field's scenario type, from the kind it already declares in levier-defaults.js. An Auto
     field is always 'string', whatever it wraps — the parameter has to be able to say 'auto', and
     a 'number' spec would reject that and silently fall back to the default. fromFlat() is where
     the string becomes a number again. */
  function typeOf(field) {
    if (field.auto) return 'string';
    switch (field.kind) {
      case 'money': case 'rate': case 'count': case 'years': return 'number';
      case 'yearList': case 'rateList': return 'numbers';
      case 'choiceList': case 'choicePhrase': case 'literalList': return 'strings';
      case 'boolean': return 'boolean';
      default: return 'string';
    }
  }

  /* Walk every field once, so a field added to levier-defaults.js is either covered here or
     caught by the coverage case in tests.html — never silently dropped from a shared link. */
  function eachField(visit) {
    D.SECTIONS.forEach(function (section) {
      section.fields.forEach(function (field) {
        visit(section, field, section.key + '.' + field.key);
        /* A select with a free-text escape hatch carries two values, and the typed one is the
           half that matters to the reader. */
        if (field.other) {
          visit(section, { key: field.other, kind: 'text' }, section.key + '.' + field.other);
        }
      });
    });
  }

  /* The spec js/composables/scenario.js consumes, built from the defaults so the two can never
     drift: a default changed in levier-defaults.js changes what a URL omits, automatically. */
  function spec() {
    const defaults = D.values();
    const built = {};

    eachField(function (section, field, path) {
      const key = KEYS[path];
      if (!key) return;                       /* tests.html fails on this; it is not silent */

      const stored = defaults[section.key][field.key];
      const entry = { type: typeOf(field) };

      if (field.auto) entry.default = stored && stored.auto ? AUTO : String(stored.value);
      else entry.default = stored;

      /* An unknown option key must fall back rather than reach a component that cannot render
         it — a hand-edited URL is the normal way this happens. */
      if (field.options && entry.type === 'strings') {
        entry.allowed = (D.OPTIONS[field.options] || []).map(function (o) { return o.value; });
      }

      built[key] = entry;
    });

    return built;
  }

  /* Nested variables → the flat snapshot scenario.js encodes. */
  function toFlat(variables) {
    const flat = {};

    eachField(function (section, field, path) {
      const key = KEYS[path];
      if (!key) return;
      const group = (variables && variables[section.key]) || {};
      const stored = group[field.key];

      if (field.auto) {
        flat[key] = (stored && stored.auto) ? AUTO
          : String(stored && stored.value !== null && stored.value !== undefined
                   ? stored.value : '');
      } else {
        flat[key] = stored;
      }
    });

    return flat;
  }

  /* The flat snapshot → a complete variables object. Starts from the defaults and overwrites, so
     a URL naming three parameters still yields every field: a shared link says what the sender
     changed, and the rest is the default the recipient would have seen anyway. */
  function fromFlat(flat) {
    const variables = D.values();

    eachField(function (section, field, path) {
      const key = KEYS[path];
      if (!key || !(key in flat)) return;
      const incoming = flat[key];
      if (incoming === undefined || incoming === null) return;

      if (field.auto) {
        if (incoming === AUTO) { variables[section.key][field.key] = D.auto(); return; }
        /* A choice-valued Auto field keeps its string; a numeric one becomes a number again, and
           an unparseable one falls back to Auto rather than to NaN. */
        if (field.kind === 'choice') {
          variables[section.key][field.key] = { auto: false, value: String(incoming) };
          return;
        }
        const value = Number(incoming);
        variables[section.key][field.key] = isFinite(value)
          ? { auto: false, value: value }
          : D.auto();
        return;
      }

      variables[section.key][field.key] = incoming;
    });

    return variables;
  }

  window.LevierShare = {
    KEYS: KEYS,
    AUTO: AUTO,
    spec: spec,
    toFlat: toFlat,
    fromFlat: fromFlat,
    eachField: eachField
  };
})();
