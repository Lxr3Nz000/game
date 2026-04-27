// Difficulty presets — multipliers applied during the run.
// cashStart: starting cash multiplier
// burnMult: burn rate multiplier
// revMult: revenue multiplier
// workMult: project work target multiplier
// eventMult: random event interval multiplier (< 1 = more frequent)
// hypeStart: absolute starting hype (0-100)
// taxPct: percent of cash taken every 90s after tutorial (0..1)

export const DIFFICULTIES = [
  {
    id: "easy",
    name: { en: "Easy", it: "Facile" },
    tagline: { en: "Coffee, chill, profit.", it: "Caffè, relax, profitto." },
    color: "var(--sm-neon-green)",
    cashStart: 1.8,
    burnMult: 0.7,
    revMult: 1.25,
    workMult: 0.8,
    eventFreqMs: 35000,
    eventChance: 0.45,
    hypeStart: 55,
    taxPct: 0.04,
  },
  {
    id: "normal",
    name: { en: "Normal", it: "Normale" },
    tagline: { en: "The real founder life.", it: "La vera vita da founder." },
    color: "var(--sm-neon-cyan)",
    cashStart: 1.0,
    burnMult: 1.0,
    revMult: 1.0,
    workMult: 1.0,
    eventFreqMs: 25000,
    eventChance: 0.65,
    hypeStart: 35,
    taxPct: 0.08,
  },
  {
    id: "hard",
    name: { en: "Hard", it: "Difficile" },
    tagline: { en: "Crunch forever.", it: "Crunch senza fine." },
    color: "var(--sm-neon-amber)",
    cashStart: 0.7,
    burnMult: 1.35,
    revMult: 0.85,
    workMult: 1.4,
    eventFreqMs: 18000,
    eventChance: 0.75,
    hypeStart: 25,
    taxPct: 0.12,
  },
  {
    id: "hardcore",
    name: { en: "Hardcore", it: "Hardcore" },
    tagline: { en: "Dot-com bust mode.", it: "Modalità bolla dot-com." },
    color: "var(--sm-neon-red)",
    cashStart: 0.5,
    burnMult: 1.7,
    revMult: 0.7,
    workMult: 1.8,
    eventFreqMs: 14000,
    eventChance: 0.85,
    hypeStart: 18,
    taxPct: 0.16,
  },
];

export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[1];
}

// Marketing quick-actions: spend cash to boost hype / revenue short-term.
export const MARKETING_ACTIONS = [
  {
    id: "ads",
    name: { en: "Run Ads", it: "Campagna Ads" },
    desc: { en: "+12 hype instantly.", it: "+12 hype subito." },
    cost: 80,
    cooldownMs: 15000,
    effect: { hype: 12 },
  },
  {
    id: "pr",
    name: { en: "PR Blast", it: "PR Blast" },
    desc: { en: "+25 hype, +30% revenue 30s.", it: "+25 hype, +30% ricavi 30s." },
    cost: 400,
    cooldownMs: 45000,
    effect: { hype: 25, revenueMult: 1.3, durationMs: 30000, title: "PR BLAST", message: "Your brand is everywhere." },
  },
  {
    id: "influencer",
    name: { en: "Influencer", it: "Influencer" },
    desc: { en: "Hype→100, +80% revenue 60s.", it: "Hype→100, +80% ricavi 60s." },
    cost: 2500,
    cooldownMs: 120000,
    effect: { hypeSet: 100, revenueMult: 1.8, durationMs: 60000, title: "INFLUENCER DEAL", message: "A mega-creator is hyping your app." },
  },
];

// Random dialog events ("decisions") that pop up and ask the player to choose.
export const DECISIONS = [
  {
    id: "raise_request",
    weight: 3,
    condition: (s) => s.staff.length >= 2 && s.tutorialStep >= 5,
    title: { en: "Salary Renegotiation", it: "Rinegoziazione Salario" },
    body: {
      en: "Your senior dev wants a 30% raise or threatens to quit for a rival startup.",
      it: "Il tuo senior dev vuole +30% di stipendio o minaccia di andarsene.",
    },
    options: [
      {
        label: { en: "Pay up (+30% salary, +15% productivity)", it: "Paghi (+30% stipendio, +15% produttività)" },
        apply: (s) => ({ ...s, bonuses: { ...s.bonuses, productivityBoost: (s.bonuses.productivityBoost || 0) + 0.15, salaryMult: (s.bonuses.salaryMult || 1) * 1.3 } }),
      },
      {
        label: { en: "Fire them (−1 dev)", it: "Licenziali (−1 dev)" },
        apply: (s) => ({ ...s, staff: s.staff.slice(0, -1) }),
      },
    ],
  },
  {
    id: "investor_offer",
    weight: 2,
    condition: (s) => s.cash < 2000 && s.tutorialStep >= 5,
    title: { en: "Angel Investor", it: "Angel Investor" },
    body: {
      en: "An angel offers €5,000 now for 10% of future revenue.",
      it: "Un angel offre €5,000 ora per il 10% dei ricavi futuri.",
    },
    options: [
      {
        label: { en: "Accept (+€5,000, −10% revenue)", it: "Accetta (+€5,000, −10% ricavi)" },
        apply: (s) => ({ ...s, cash: s.cash + 5000, bonuses: { ...s.bonuses, revenueTax: (s.bonuses.revenueTax || 0) + 0.1 } }),
      },
      {
        label: { en: "Decline", it: "Rifiuta" },
        apply: (s) => s,
      },
    ],
  },
  {
    id: "bug_report",
    weight: 2,
    condition: (s) => s.releasedApps.length >= 1,
    title: { en: "Emergency Bug", it: "Bug Urgente" },
    body: {
      en: "A showstopper bug is crashing your most popular app.",
      it: "Un bug critico sta facendo crashare la tua app più popolare.",
    },
    options: [
      {
        label: { en: "Hotfix now (−€500)", it: "Hotfix ora (−€500)" },
        apply: (s) => ({ ...s, cash: Math.max(0, s.cash - 500) }),
      },
      {
        label: { en: "Ignore (−20 hype)", it: "Ignora (−20 hype)" },
        apply: (s) => ({ ...s, hype: Math.max(5, s.hype - 20) }),
      },
    ],
  },
  {
    id: "conference",
    weight: 1,
    condition: (s) => s.cash >= 1000 && s.tutorialStep >= 5,
    title: { en: "Tech Conference", it: "Conferenza Tech" },
    body: {
      en: "A conference slot opened. €1,000 for massive exposure.",
      it: "Si è liberato uno slot in conferenza. €1,000 per grande visibilità.",
    },
    options: [
      {
        label: { en: "Attend (−€1,000, +35 hype)", it: "Partecipa (−€1,000, +35 hype)" },
        apply: (s) => ({ ...s, cash: Math.max(0, s.cash - 1000), hype: Math.min(100, s.hype + 35) }),
      },
      {
        label: { en: "Skip", it: "Salta" },
        apply: (s) => s,
      },
    ],
  },
];
