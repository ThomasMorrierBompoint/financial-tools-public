/* Quill Delta → plain text with Markdown conventions (foundation plan §7.1).

   Serialization is one-way. What a tool stores is the Delta — it round-trips into the editor
   exactly — and text is an output, produced on demand for the prompt. Nothing parses text back
   into the editor, which is why there is no Markdown parser here.

   The covered formats are exactly the toolbar subset: headings, bold, italic, ordered and
   unordered lists, links, inline code and code blocks. Anything else in a Delta (an image, a
   colour) is not offered by the toolbar and is rendered as its plain text.

   Pure: no DOM, no Vue, no i18n. Cases in tests.html. */
(function () {
  'use strict';

  const BLOCK_KEYS = ['header', 'list', 'indent', 'code-block', 'blockquote'];

  function blockAttributes(attributes) {
    const block = {};
    if (!attributes) return block;
    BLOCK_KEYS.forEach(function (key) {
      if (attributes[key] !== undefined) block[key] = attributes[key];
    });
    return block;
  }

  /* One line of the document: its text segments, plus the attributes carried by its newline. */
  function lines(delta) {
    const ops = (delta && delta.ops) || [];
    const result = [];
    let segments = [];

    ops.forEach(function (op) {
      if (typeof op.insert !== 'string') return;      /* embeds are outside the toolbar subset */
      const parts = op.insert.split('\n');
      parts.forEach(function (part, index) {
        if (index > 0) {
          result.push({ segments: segments, block: blockAttributes(op.attributes) });
          segments = [];
        }
        if (part) segments.push({ text: part, attributes: op.attributes || {} });
      });
    });

    if (segments.length) result.push({ segments: segments, block: {} });
    return result;
  }

  function inline(segment) {
    const attributes = segment.attributes || {};
    let text = segment.text;

    /* Inline code wins: emphasis markers inside a code span are literal characters. */
    if (attributes.code) text = '`' + text + '`';
    else {
      if (attributes.bold) text = '**' + text + '**';
      if (attributes.italic) text = '*' + text + '*';
    }

    if (attributes.link) text = '[' + text + '](' + attributes.link + ')';
    return text;
  }

  function textOf(line) {
    return line.segments.map(inline).join('');
  }

  function isListItem(line) { return !!line.block.list; }
  function isCode(line)     { return !!line.block['code-block']; }

  function toText(delta) {
    const source = lines(delta);
    const blocks = [];
    let counters = [];
    let listBuffer = null;
    let listType = null;
    let codeBuffer = null;

    function flush() {
      if (listBuffer) { blocks.push(listBuffer.join('\n')); listBuffer = null; listType = null; }
      if (codeBuffer) { blocks.push('```\n' + codeBuffer.join('\n') + '\n```'); codeBuffer = null; }
    }

    source.forEach(function (line) {
      const text = textOf(line);

      if (isCode(line)) {
        if (listBuffer) { flush(); counters = []; }
        codeBuffer = codeBuffer || [];
        codeBuffer.push(line.segments.map(function (s) { return s.text; }).join(''));
        return;
      }
      if (codeBuffer) { blocks.push('```\n' + codeBuffer.join('\n') + '\n```'); codeBuffer = null; }

      if (isListItem(line)) {
        const depth = line.block.indent || 0;

        /* A bullet list running straight into a numbered one is ambiguous in Markdown — separate
           them into two blocks. */
        if (listBuffer && depth === 0 && line.block.list !== listType) {
          flush();
          counters = [];
        }
        if (depth === 0) listType = line.block.list;

        counters = counters.slice(0, depth + 1);
        const indent = '  '.repeat(depth);

        if (line.block.list === 'ordered') {
          counters[depth] = (counters[depth] || 0) + 1;
          listBuffer = listBuffer || [];
          listBuffer.push(indent + counters[depth] + '. ' + text);
        } else {
          counters[depth] = 0;
          listBuffer = listBuffer || [];
          listBuffer.push(indent + '- ' + text);
        }
        return;
      }

      flush();
      counters = [];

      if (!text) return;                              /* an empty line is a block separator */

      if (line.block.header) blocks.push('#'.repeat(line.block.header) + ' ' + text);
      else if (line.block.blockquote) blocks.push('> ' + text);
      else blocks.push(text);
    });

    flush();
    return blocks.join('\n\n');
  }

  window.DeltaText = { toText: toText, lines: lines };
})();
