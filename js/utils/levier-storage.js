/* The saved-state envelope for the leverage tool — pure: strings in, objects out.

   What autosave writes and what Export JSON downloads are the same document, because they answer
   the same question: everything the visitor typed, and nothing else. Keeping the shape in one
   pure file is what lets tests.html exercise import without a browser or a file picker.

   WHAT NEVER GOES IN HERE: an API key, a provider response, or anything derived. Phase 2's key is
   memory-only by contract (README.md §7, tool plan §8.2) and a response can describe the
   visitor's finances (tool plan §8.4). The prompt itself is derived from the fields below and is
   never stored either — storing it would create a second truth that could disagree with the form.

   Deltas, not text. A Delta round-trips into Quill exactly; text would have to be re-parsed, and
   nothing in this project parses Markdown back into the editor (foundation plan §7.1). */
(function () {
  'use strict';

  const D = window.LevierDefaults;

  const VERSION = 1;
  const KEY = 'levier-v1';

  /* A Delta is { ops: [...] }. Anything else — a string, null, a hand-edited file — is refused
     rather than handed to Quill, which throws on a malformed one and takes the page with it. */
  function isDelta(value) {
    return !!value && typeof value === 'object' && Array.isArray(value.ops);
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  /* Overwrite the defaults with whatever the saved document actually has, group by group and
     field by field. A file from an older version, or one a person edited by hand, therefore
     contributes what it can and cannot corrupt the rest: an unknown group is ignored, a missing
     field keeps its default, and a field of the wrong shape is skipped. */
  function mergeVariables(saved) {
    const variables = D.values();
    if (!isPlainObject(saved)) return variables;

    Object.keys(variables).forEach(function (group) {
      const incoming = saved[group];
      if (!isPlainObject(incoming)) return;

      Object.keys(variables[group]).forEach(function (field) {
        if (!(field in incoming)) return;
        const value = incoming[field];
        const current = variables[group][field];

        /* An Auto field must stay an { auto, value } pair; a bare number where a pair belongs
           would disable the Auto checkbox and quietly change what the prompt asks for. */
        if (isPlainObject(current) && 'auto' in current) {
          if (isPlainObject(value) && 'auto' in value) {
            variables[group][field] = { auto: !!value.auto, value: value.value };
          }
          return;
        }
        if (Array.isArray(current) !== Array.isArray(value)) return;
        if (value === null || value === undefined) return;
        variables[group][field] = value;
      });
    });

    return variables;
  }

  /* The document autosave writes and Export downloads. savedAt is for the human reading an
     exported file, never for logic — nothing here branches on it. */
  function serialize(state) {
    return JSON.stringify({
      version: VERSION,
      savedAt: new Date().toISOString(),
      lang: state.lang,
      variables: state.variables,
      analysis: state.analysis,
      presentation: state.presentation,
      touched: {
        analysis: !!(state.touched && state.touched.analysis),
        presentation: !!(state.touched && state.touched.presentation)
      }
    }, null, 2);
  }

  /* Returns { ok: true, value } or { ok: false, reason }. Never throws and never returns a
     partial object: a corrupt autosave blob and a wrong file dropped on Import take the same
     path, and the caller shows the same message.

     `reason` is an id, not a sentence — the two languages live in i18n.js. */
  function deserialize(text) {
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (error) { return { ok: false, reason: 'notJson' }; }

    if (!isPlainObject(parsed)) return { ok: false, reason: 'notJson' };
    if (parsed.version !== VERSION) return { ok: false, reason: 'version' };
    /* Variables are the one thing a scenario file must actually contain; prose is optional
       because the seeds are a valid starting point for it. */
    if (!isPlainObject(parsed.variables)) return { ok: false, reason: 'shape' };

    return {
      ok: true,
      value: {
        lang: parsed.lang === 'en' || parsed.lang === 'fr' ? parsed.lang : null,
        variables: mergeVariables(parsed.variables),
        analysis: isDelta(parsed.analysis) ? parsed.analysis : null,
        presentation: isDelta(parsed.presentation) ? parsed.presentation : null,
        touched: {
          analysis: !!(parsed.touched && parsed.touched.analysis),
          presentation: !!(parsed.touched && parsed.touched.presentation)
        }
      }
    };
  }

  /* The file an Export downloads. Dated, because the point of exporting is keeping more than one.
     ASCII only, for the same reason as the prompt's file name (tool plan §7). */
  function fileName(lang, date) {
    const stamp = (date || new Date()).toISOString().slice(0, 10);
    return (lang === 'en' ? 'leverage-scenario-' : 'scenario-levier-') + stamp + '.json';
  }

  window.LevierStorage = {
    VERSION: VERSION,
    KEY: KEY,
    serialize: serialize,
    deserialize: deserialize,
    mergeVariables: mergeVariables,
    fileName: fileName,
    isDelta: isDelta
  };
})();
