/* VARIABLES model for the leverage prompt generator — data only, no formatting and no DOM.

   Every label, option and default here is lifted from the two source files in
   docs/plan-implementation/leverage-prompt-generator/: the French file supplies the values and the
   French labels, the English file the English ones. SECTIONS is ordered, and that order IS the
   order of the generated prompt — reordering a field here reorders the prompt and breaks the
   fidelity check in tests.html (tool plan §3.4).

   Several variables in the source are instructions rather than values — "[à déterminer]",
   "[calculer selon revenu et province]". Those fields carry an `auto` instruction and default to
   { auto: true }; levier-prompt.js emits the instruction verbatim, never a computed stand-in. */
(function () {
  'use strict';

  /* Option lists, keyed by the `options` name a field declares. The key stored in state is
     language-independent; only the label has two sides. */
  const OPTIONS = {
    financingType: [
      { value: 'mortgageTranche', label: { fr: 'tranche hypothécaire', en: 'mortgage tranche' } },
      { value: 'lineOfCredit',    label: { fr: 'marge de crédit',      en: 'line of credit' } },
      { value: 'investmentLoan',  label: { fr: 'prêt investissement',  en: 'investment loan' } },
      { value: 'other',           label: { fr: 'autre',                en: 'other' } }
    ],
    rateType: [
      { value: 'fixed',    label: { fr: 'fixe',     en: 'fixed' } },
      { value: 'variable', label: { fr: 'variable', en: 'variable' } }
    ],
    paymentFrequency: [
      { value: 'monthly',  label: { fr: 'mensuelle',          en: 'monthly' } },
      { value: 'biweekly', label: { fr: 'aux deux semaines',  en: 'biweekly' } },
      { value: 'weekly',   label: { fr: 'hebdomadaire',       en: 'weekly' } }
    ],
    deductibleInterest: [
      { value: 'applicableRules',
        label: { fr: 'selon règles fiscales applicables', en: 'according to applicable tax rules' } },
      { value: 'yes', label: { fr: 'oui', en: 'yes' } },
      { value: 'no',  label: { fr: 'non', en: 'no' } }
    ],
    province: [
      { value: 'QC', label: { fr: 'Québec',                    en: 'Quebec' } },
      { value: 'ON', label: { fr: 'Ontario',                   en: 'Ontario' } },
      { value: 'BC', label: { fr: 'Colombie-Britannique',      en: 'British Columbia' } },
      { value: 'AB', label: { fr: 'Alberta',                   en: 'Alberta' } },
      { value: 'SK', label: { fr: 'Saskatchewan',              en: 'Saskatchewan' } },
      { value: 'MB', label: { fr: 'Manitoba',                  en: 'Manitoba' } },
      { value: 'NB', label: { fr: 'Nouveau-Brunswick',         en: 'New Brunswick' } },
      { value: 'NS', label: { fr: 'Nouvelle-Écosse',           en: 'Nova Scotia' } },
      { value: 'PE', label: { fr: 'Île-du-Prince-Édouard',     en: 'Prince Edward Island' } },
      { value: 'NL', label: { fr: 'Terre-Neuve-et-Labrador',   en: 'Newfoundland and Labrador' } },
      { value: 'YT', label: { fr: 'Yukon',                     en: 'Yukon' } },
      { value: 'NT', label: { fr: 'Territoires du Nord-Ouest', en: 'Northwest Territories' } },
      { value: 'NU', label: { fr: 'Nunavut',                   en: 'Nunavut' } }
    ],
    accountTypes: [
      { value: 'tfsa',          label: { fr: 'CELI',                   en: 'TFSA' } },
      { value: 'nonRegistered', label: { fr: 'compte non enregistré',  en: 'non-registered account' } },
      { value: 'rrsp',          label: { fr: 'REER',                   en: 'RRSP' } },
      { value: 'fhsa',          label: { fr: 'CELIAPP',                en: 'FHSA' } }
    ],
    portfolioType: [
      { value: 'diversifiedEtf',
        label: { fr: 'portefeuille diversifié d’ETF', en: 'diversified ETF portfolio' } },
      { value: 'equities',  label: { fr: 'actions',            en: 'equities' } },
      { value: 'balanced',  label: { fr: 'portefeuille équilibré', en: 'balanced portfolio' } },
      { value: 'other',     label: { fr: 'autre',              en: 'other' } }
    ],
    crashTiming: [
      { value: 'beginning', label: { fr: 'début',  en: 'beginning' } },
      { value: 'middle',    label: { fr: 'milieu', en: 'middle' } },
      { value: 'end',       label: { fr: 'fin',    en: 'end' } }
    ],
    rateScenario: [
      { value: 'constant', label: { fr: 'taux constant', en: 'constant rate' } }
    ]
  };

  /* The instruction a field emits when it is on Auto — verbatim from the source files. */
  const AUTO = {
    taxRate:          { fr: 'calculer selon revenu et province',
                        en: 'calculate based on income and province' },
    returnAfterCrash: { fr: 'selon rendement testé',
                        en: 'according to the return being tested' },
    toBeDetermined:   { fr: 'à déterminer', en: 'to be determined' },
    byPortfolio:      { fr: 'à déterminer selon portefeuille',
                        en: 'to be determined based on the portfolio' }
  };

  const YEARS = { fr: 'ans', en: 'years' };

  const SECTIONS = [
    {
      key: 'financing',
      heading: { fr: 'Financement', en: 'Financing' },
      fields: [
        { key: 'amountBorrowed', control: 'currency', min: 0, max: 10000000, kind: 'money', decimals: 0,
          label: { fr: 'Montant emprunté', en: 'Amount borrowed' } },
        { key: 'financingType', control: 'select', kind: 'choice', options: 'financingType',
          label: { fr: 'Type de financement', en: 'Type of financing' } },
        { key: 'initialRate', control: 'percent', min: 0, max: 30, step: 0.1, kind: 'rate', decimals: 1,
          label: { fr: 'Taux initial', en: 'Initial rate' } },
        { key: 'rateType', control: 'selectButton', kind: 'choice', options: 'rateType',
          label: { fr: 'Type de taux', en: 'Rate type' } },
        { key: 'amortization', control: 'sliderNumber', min: 1, max: 40, kind: 'years',
          label: { fr: 'Amortissement', en: 'Amortization' } },
        { key: 'paymentFrequency', control: 'select', kind: 'choice', options: 'paymentFrequency',
          label: { fr: 'Fréquence des paiements', en: 'Payment frequency' } },
        { key: 'horizons', control: 'chips', kind: 'yearList',
          label: { fr: 'Horizons analysés', en: 'Horizons analyzed' } },
        { key: 'financingFees', control: 'currency', min: 0, max: 100000, kind: 'money', decimals: 0,
          label: { fr: 'Frais de financement', en: 'Financing fees' } },
        { key: 'deductibleInterest', control: 'select', kind: 'choice', options: 'deductibleInterest',
          label: { fr: 'Intérêts fiscalement déductibles', en: 'Tax-deductible interest' } }
      ]
    },
    {
      key: 'investor',
      heading: { fr: 'Investisseur et fiscalité', en: 'Investor and taxation' },
      fields: [
        { key: 'taxableIncome', control: 'currency', min: 0, max: 10000000, kind: 'money', decimals: 0,
          label: { fr: 'Revenu annuel imposable', en: 'Annual taxable income' } },
        { key: 'province', control: 'select', kind: 'choice', options: 'province',
          label: { fr: 'Province de résidence fiscale', en: 'Province of tax residence' } },
        { key: 'accountTypes', control: 'multiSelect', kind: 'choiceList', options: 'accountTypes',
          label: { fr: 'Types de comptes à comparer', en: 'Account types to compare' } },
        { key: 'taxRate', control: 'percent', min: 0, max: 100, kind: 'rate', decimals: 2, auto: AUTO.taxRate,
          label: { fr: 'Taux d’imposition', en: 'Tax rate' } }
      ]
    },
    {
      key: 'investment',
      heading: { fr: 'Investissement', en: 'Investment' },
      fields: [
        { key: 'amountInvested', control: 'currency', min: 0, max: 10000000, kind: 'money', decimals: 0,
          label: { fr: 'Montant initial investi', en: 'Initial amount invested' } },
        { key: 'portfolioType', control: 'select', other: 'portfolioOther', kind: 'choice', options: 'portfolioType',
          label: { fr: 'Type de portefeuille', en: 'Portfolio type' } },
        { key: 'returnsToTest', control: 'chips', kind: 'rateList', decimals: 0,
          label: { fr: 'Rendements annuels à tester', en: 'Annual returns to test' } },
        { key: 'managementFees', control: 'percent', min: 0, max: 10, step: 0.05, kind: 'rate', decimals: 2,
          label: { fr: 'Frais de gestion annuels', en: 'Annual management fees' } },
        { key: 'inflation', control: 'percent', min: 0, max: 20, step: 0.1, kind: 'rate', decimals: 0,
          label: { fr: 'Inflation annuelle', en: 'Annual inflation' } },
        { key: 'additionalContributions', control: 'currency', min: 0, max: 1000000, kind: 'money', decimals: 0,
          label: { fr: 'Contributions supplémentaires', en: 'Additional contributions' } }
      ]
    },
    {
      key: 'scenarios',
      heading: { fr: 'Scénarios de marché', en: 'Market scenarios' },
      fields: [
        { key: 'marketCorrection', control: 'percent', min: -100, max: 0, step: 1, kind: 'rate', decimals: 0,
          label: { fr: 'Correction boursière', en: 'Market correction' } },
        /* The source renders this one as a phrase — "début, milieu et fin de l’horizon" — not as a
           comma list, so it joins with Intl.ListFormat and carries a suffix. */
        { key: 'crashTiming', control: 'multiSelect', kind: 'choicePhrase', options: 'crashTiming',
          suffix: { fr: ' de l’horizon', en: ' of the horizon' },
          label: { fr: 'Moment du krach', en: 'Timing of the crash' } },
        { key: 'returnAfterCrash', control: 'percent', min: -100, max: 100, kind: 'rate', decimals: 0, auto: AUTO.returnAfterCrash,
          label: { fr: 'Rendement après le krach', en: 'Return after the crash' } }
      ]
    },
    {
      key: 'rates',
      heading: { fr: 'Taux d’intérêt', en: 'Interest rates' },
      /* The only section with a lead-in line, and its bullets are lowercase in both files. */
      intro: { fr: 'Analyser :', en: 'Analyze:' },
      fields: [
        { key: 'baseline', control: 'select', kind: 'choice', options: 'rateScenario', auto: AUTO.toBeDetermined,
          label: { fr: 'scénario de référence', en: 'baseline scenario' } },
        { key: 'favourable', control: 'percent', min: -20, max: 30, step: 0.1, kind: 'rate', decimals: 2, auto: AUTO.toBeDetermined,
          label: { fr: 'scénario favorable', en: 'favorable scenario' } },
        { key: 'unfavourable', control: 'percent', min: -20, max: 30, step: 0.1, kind: 'rate', decimals: 2, auto: AUTO.toBeDetermined,
          label: { fr: 'scénario défavorable', en: 'unfavorable scenario' } }
      ]
    },
    {
      key: 'monteCarlo',
      heading: { fr: 'Simulation probabiliste', en: 'Probabilistic simulation' },
      fields: [
        { key: 'enabled', control: 'toggle', kind: 'boolean',
          label: { fr: 'Simulation Monte-Carlo', en: 'Monte Carlo simulation' } },
        { key: 'simulations', control: 'number', min: 100, max: 100000, step: 100, kind: 'count',
          label: { fr: 'Nombre de simulations', en: 'Number of simulations' } },
        { key: 'averageReturn', control: 'percent', min: -20, max: 40, step: 0.1, kind: 'rate', decimals: 2, auto: AUTO.byPortfolio,
          label: { fr: 'Rendement moyen', en: 'Average return' } },
        { key: 'volatility', control: 'percent', min: 0, max: 100, step: 0.1, kind: 'rate', decimals: 2, auto: AUTO.byPortfolio,
          label: { fr: 'Volatilité annuelle', en: 'Annual volatility' } },
        { key: 'percentiles', control: 'chips', kind: 'literalList',
          label: { fr: 'Percentiles', en: 'Percentiles' } }
      ]
    }
  ];

  /* The two introductory paragraphs and the line under "# VARIABLES", verbatim from the sources. */
  const PREAMBLE = {
    fr: ['Agis comme un analyste financier spécialisé en investissement, fiscalité et stratégies ' +
         'utilisant l’effet de levier.',
         'Analyse une stratégie consistant à emprunter une somme afin de l’investir à long terme. ' +
         'Évalue le rendement potentiel, le coût réel du financement, les flux de trésorerie, la ' +
         'fiscalité et les risques.'],
    en: ['Act as a financial analyst specialized in investing, taxation and leverage-based ' +
         'strategies.',
         'Analyze a strategy consisting of borrowing a sum in order to invest it over the long ' +
         'term. Assess the potential return, the real cost of the financing, the cash flows, the ' +
         'taxation and the risks.']
  };

  const VARIABLES_INTRO = {
    fr: 'Utilise les paramètres suivants pour l’ensemble de l’analyse. Ne modifie pas ces ' +
        'hypothèses sauf si une donnée est manifestement incohérente; dans ce cas, signale-le ' +
        'avant de faire l’hypothèse nécessaire.',
    en: 'Use the following parameters for the entire analysis. Do not modify these assumptions ' +
        'unless a data point is manifestly inconsistent; in that case, flag it before making the ' +
        'necessary assumption.'
  };

  const YES_NO = { fr: { yes: 'oui', no: 'non' }, en: { yes: 'yes', no: 'no' } };

  /* A field on Auto is { auto: true }; its value is irrelevant and never shown. */
  function auto() { return { auto: true, value: null }; }

  /* A fresh defaults object on every call — callers mutate it, so a shared literal would leak
     one visitor's edits into the next Reset. */
  function values() {
    return {
      financing: {
        amountBorrowed: 100000,
        financingType: 'mortgageTranche',
        initialRate: 3.9,
        rateType: 'variable',
        amortization: 20,
        paymentFrequency: 'monthly',
        horizons: [5, 10, 15, 20],
        financingFees: 0,
        deductibleInterest: 'applicableRules'
      },
      investor: {
        taxableIncome: 140000,
        province: 'QC',
        accountTypes: ['tfsa', 'nonRegistered'],
        taxRate: auto()
      },
      investment: {
        amountInvested: 100000,
        portfolioType: 'diversifiedEtf',
        portfolioOther: '',
        returnsToTest: [2, 4, 6, 8, 10],
        managementFees: 0.20,
        inflation: 2,
        additionalContributions: 0
      },
      scenarios: {
        marketCorrection: -30,
        crashTiming: ['beginning', 'middle', 'end'],
        returnAfterCrash: auto()
      },
      rates: {
        baseline: { auto: false, value: 'constant' },
        favourable: auto(),
        unfavourable: auto()
      },
      monteCarlo: {
        enabled: true,
        simulations: 10000,
        averageReturn: auto(),
        volatility: auto(),
        percentiles: ['P10', 'P25', 'P50', 'P75', 'P90']
      }
    };
  }

  window.LevierDefaults = {
    SECTIONS: SECTIONS,
    OPTIONS: OPTIONS,
    AUTO: AUTO,
    YEARS: YEARS,
    YES_NO: YES_NO,
    PREAMBLE: PREAMBLE,
    VARIABLES_INTRO: VARIABLES_INTRO,
    values: values,
    auto: auto
  };
})();
