/* Copy text to the clipboard, with the fallback the modern API needs.

   `navigator.clipboard` requires a secure context, so a file:// visit or a plain-http staging box
   does not have it. Rather than failing silently there, fall back to the old selection trick. The
   caller gets a promise of a boolean and decides what to say about it.

   This lives here rather than in a component because two of them need it: share-link copies the
   URL, and the leverage tool copies the assembled prompt (tool plan §7). Duplicating the fallback
   in both is how one of them quietly stops working. */
(function () {
  'use strict';

  /* Selection-based copy: a textarea off-screen but not display:none, since a hidden element
     cannot be selected. Kept readonly so a mobile keyboard does not appear on focus. */
  function legacyCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    try { return document.execCommand('copy'); }
    catch (error) { return false; }
    finally { document.body.removeChild(field); }
  }

  /* Always resolves — never rejects. A failed copy is a thing to tell the visitor about, not an
     exception for every caller to catch. */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* Not window.Clipboard: that name is already the DOM Clipboard interface, and shadowing it
     would break anything doing `navigator.clipboard instanceof Clipboard`. */
  window.ClipboardService = { copyText: copyText };
})();
