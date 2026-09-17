/* Tool registry (foundation plan §5). Adding a tool is one entry here, its two files, their
   <script> tags in index.html, its strings in i18n.js and its cases in tests.html — nothing in the
   shell changes. The landing page and the router both read this list.

   status: 'ready' routes to the tool's own page; 'soon' routes to the shared placeholder and shows
   a badge on the landing card. */

window.TOOLS = [
  {
    id: 'levier',
    slugs: { fr: 'levier', en: 'leverage' },
    title: { fr: 'Analyse de levier financier',
             en: 'Financial leverage analysis' },
    blurb: { fr: 'Transformez vos variables en un prompt d’analyse complet, prêt à soumettre ' +
                 'au modèle de votre choix.',
             en: 'Turn your variables into a complete analysis prompt, ready for the model of ' +
                 'your choice.' },
    icon: 'pi pi-chart-line',
    page: 'SoonPage',
    status: 'soon'
  }
];
