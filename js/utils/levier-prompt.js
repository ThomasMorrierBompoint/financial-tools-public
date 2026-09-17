/* Prompt assembly for the leverage tool — pure: state in, text out. No DOM, no Vue, no I/O.

   That purity is the point. The generated VARIABLES block has to reproduce the structure of
   docs/plan-implementation/leverage-prompt-generator/leverage-prompt.<lang>.md line for line, and
   the only way to keep it that way as the form grows is to diff the two — which tests.html does
   (tool plan §3.4).

   Number presentation is the one thing allowed to differ from the source file: Intl emits a
   non-breaking group separator where the file has an ASCII space. Nothing here post-processes what
   Intl returns — design.md §8 forbids it, and the difference does not change what is asked. */
(function () {
  'use strict';

  const D = window.LevierDefaults;
  const Format = window.Format;

  /* French puts a space before the colon, English does not. */
  const SEPARATOR = { fr: ' : ', en: ': ' };

  function optionLabel(name, value, lang) {
    const list = D.OPTIONS[name] || [];
    const found = list.find(function (option) { return option.value === value; });
    return found ? found.label[lang] : String(value);
  }

  function optionLabels(name, values, lang) {
    return (values || []).map(function (value) { return optionLabel(name, value, lang); });
  }

  /* One field's bracketed value — the instruction verbatim when it is on Auto, otherwise the
     formatted value. A field whose state is { auto: … } stores its value under .value. */
  function renderValue(field, stored, lang) {
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      if (stored.auto) return field.auto[lang];
      stored = stored.value;
    }

    const decimals = field.decimals;

    switch (field.kind) {
      case 'money':
        return Format.money(stored, lang, { decimals: decimals });
      case 'rate':
        return Format.rate(stored, lang, { decimals: decimals });
      case 'count':
        return Format.number(stored, lang);
      case 'years':
        return Format.number(stored, lang) + ' ' + D.YEARS[lang];
      case 'yearList':
        return (stored || []).map(function (value) { return Format.number(value, lang); })
          .join(', ') + ' ' + D.YEARS[lang];
      case 'rateList':
        return (stored || []).map(function (value) {
          return Format.rate(value, lang, { decimals: decimals });
        }).join(', ');
      case 'choice':
        return optionLabel(field.options, stored, lang);
      case 'choiceList':
        return optionLabels(field.options, stored, lang).join(', ');
      case 'choicePhrase':
        return Format.list(optionLabels(field.options, stored, lang), lang) +
               (field.suffix ? field.suffix[lang] : '');
      case 'literalList':
        return (stored || []).join(', ');
      case 'boolean':
        return D.YES_NO[lang][stored ? 'yes' : 'no'];
      default:
        return String(stored);
    }
  }

  /* The "# **VARIABLES**" block: heading, lead-in, then one "## **Section**" per group with its
     bullets. Returns an array of lines so the caller decides how paragraphs are joined. */
  function variableLines(variables, lang) {
    const lines = ['# **VARIABLES**', '', D.VARIABLES_INTRO[lang]];

    D.SECTIONS.forEach(function (section) {
      lines.push('', '## **' + section.heading[lang] + '**', '');
      if (section.intro) lines.push(section.intro[lang], '');

      const group = (variables && variables[section.key]) || {};
      section.fields.forEach(function (field) {
        lines.push('- ' + field.label[lang] + SEPARATOR[lang] +
                   '[' + renderValue(field, group[field.key], lang) + ']');
      });
    });

    return lines;
  }

  function renderVariables(variables, lang) {
    return variableLines(variables, lang).join('\n');
  }

  /* The whole prompt. The "---" rule belongs here rather than in either editor: in the source it
     separates the generated VARIABLES block from the prose that follows, so it is a property of
     the assembly, not of anything the visitor typed. */
  function assemble(state, lang) {
    const analysis = state.analysis ? toText(state.analysis) : '';
    const presentation = state.presentation ? toText(state.presentation) : '';

    return D.PREAMBLE[lang]
      .concat([renderVariables(state.variables, lang), '---'])
      .concat(analysis ? [analysis] : [])
      .concat(presentation ? [presentation] : [])
      .join('\n\n');
  }

  /* The editors hold Quill Deltas; plain strings pass straight through so the assembler can be
     exercised before the editors exist. */
  function toText(body) {
    if (typeof body === 'string') return body;
    return window.DeltaText ? window.DeltaText.toText(body) : '';
  }

  /* Rough token count for the Prompt tab. French runs about 3.5 characters per token; it is an
     estimate and is labelled as one in the UI, never presented as a billing figure. */
  function estimateTokens(text) {
    return Math.ceil((text || '').length / 3.5);
  }

  window.LevierPrompt = {
    renderVariables: renderVariables,
    variableLines: variableLines,
    renderValue: renderValue,
    assemble: assemble,
    estimateTokens: estimateTokens
  };
})();
