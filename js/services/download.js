/* Hand the visitor a text file, without a server.

   A Blob plus an object URL plus a synthetic click is the whole of it — no dependency, and the
   file never leaves the browser, which is the point: the prompt can describe someone's finances
   and nothing here uploads it anywhere (README.md §7).

   revokeObjectURL matters. Without it the Blob is pinned for the life of the page, and the prompt
   is tens of kilobytes that a visitor may download a dozen times while tuning variables. */
(function () {
  'use strict';

  function downloadText(text, fileName, type) {
    const url = URL.createObjectURL(new Blob([text], {
      type: (type || 'text/plain') + ';charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    /* Revoking immediately can cancel the download in some browsers; a turn of the event loop is
       enough for the navigation to have started. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  window.DownloadService = { downloadText: downloadText };
})();
