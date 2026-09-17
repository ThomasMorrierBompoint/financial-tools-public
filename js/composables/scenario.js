/* Shareable state: a tool's inputs live in the hash query (foundation plan §8).

   The whole job is refilling the form. A shared link lands on the right tool, in the right
   language, with every input exactly as the sender left it — that is the entire requirement.

   Keys are short and stable ('p', 'r', 'n') because they are a public interface: changing one
   breaks every link already shared. Large free text does not belong in a URL; a tool with prose
   keeps its variables here and falls back to default prose.

   The codec half is pure and has cases in tests.html; use() is the Vue binding. */
(function () {
  'use strict';

  const WRITE_DELAY = 300;          /* one history entry's worth of typing, not one per keystroke */
  const RESERVED = ['lang'];        /* owned by i18n — a scenario never overwrites it */

  function route() {
    const raw = location.hash || '#/';
    const query = raw.indexOf('?');
    return query < 0 ? raw : raw.slice(0, query);
  }

  function queryParams() {
    const raw = location.hash || '';
    const query = raw.indexOf('?');
    return new URLSearchParams(query < 0 ? '' : raw.slice(query + 1));
  }

  /* ─── Codec (pure) ───────────────────────────────────────────────────────────────────────── */

  /* A spec entry is { default, type }, where type is 'number' | 'integer' | 'boolean' | 'string'
     | 'numbers' (a comma-separated list). An absent or unparseable value falls back to the
     default — a malformed URL must never leave a tool empty. */
  function decodeValue(spec, raw) {
    if (raw === null || raw === undefined || raw === '') return spec.default;

    switch (spec.type) {
      case 'number': {
        const value = Number(raw);
        return isFinite(value) ? value : spec.default;
      }
      case 'integer': {
        const value = parseInt(raw, 10);
        return isFinite(value) ? value : spec.default;
      }
      case 'boolean':
        return raw === '1' || raw === 'true';
      case 'numbers': {
        /* An empty part must not become 0 — Number('') is 0, and a stray comma would otherwise
           silently add a zero to a list of horizons. */
        const values = String(raw).split(',')
          .map(function (part) { return part.trim(); })
          .filter(function (part) { return part !== ''; })
          .map(Number)
          .filter(function (value) { return isFinite(value); });
        return values.length ? values : spec.default;
      }
      default:
        return String(raw);
    }
  }

  function encodeValue(spec, value) {
    if (value === null || value === undefined) return null;
    switch (spec.type) {
      case 'boolean':  return value ? '1' : '0';
      case 'numbers':  return Array.isArray(value) ? value.join(',') : String(value);
      default:         return String(value);
    }
  }

  function same(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every(function (value, i) { return value === b[i]; });
    }
    return a === b;
  }

  /* Read a whole scenario out of a query string. */
  function decode(spec, search) {
    const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
    const state = {};
    Object.keys(spec).forEach(function (key) {
      state[key] = decodeValue(spec[key], params.get(key));
    });
    return state;
  }

  /* Write a scenario into a query string, dropping defaults so a shared URL stays readable.
     Parameters the scenario does not own (lang, and anything a future feature adds) survive. */
  function encode(spec, state, existing) {
    const params = existing instanceof URLSearchParams
      ? new URLSearchParams(existing.toString())
      : new URLSearchParams(existing || '');

    Object.keys(spec).forEach(function (key) {
      if (RESERVED.indexOf(key) > -1) return;
      const encoded = encodeValue(spec[key], state[key]);
      if (encoded === null || same(state[key], spec[key].default)) params.delete(key);
      else params.set(key, encoded);
    });

    return params.toString();
  }

  /* ─── Binding ────────────────────────────────────────────────────────────────────────────── */

  function use(spec) {
    const state = Vue.reactive(decode(spec, queryParams()));
    const keys = Object.keys(spec);
    let timer = null;

    function write() {
      const query = encode(spec, state, queryParams());
      history.replaceState(null, '', location.pathname + location.search +
        route() + (query ? '?' + query : ''));
    }

    Vue.watch(function () {
      return keys.map(function (key) { return state[key]; });
    }, function () {
      clearTimeout(timer);
      timer = setTimeout(write, WRITE_DELAY);
    }, { deep: true });

    /* replaceState does not fire hashchange, so anything arriving here is external: a pasted link,
       the back button, or the language toggle rewriting the slug. Refill from the URL. */
    function readBack() {
      const incoming = decode(spec, queryParams());
      keys.forEach(function (key) {
        if (!same(state[key], incoming[key])) state[key] = incoming[key];
      });
    }

    window.addEventListener('hashchange', readBack);

    return state;
  }

  window.Scenario = {
    WRITE_DELAY: WRITE_DELAY,
    decode: decode,
    encode: encode,
    decodeValue: decodeValue,
    encodeValue: encodeValue,
    use: use
  };
})();
