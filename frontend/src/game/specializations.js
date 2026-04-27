// Dev specializations — boost productivity on matching project category.
export const SPECIALIZATIONS = [
  {
    id: "none",
    name: { en: "Generalist", it: "Generalista" },
    icon: "⌨",
    matchCategories: [],   // matches nothing → no bonus
    costMult: 1.0,
    bonusMult: 1.0,
    glow: "var(--sm-text-dim)",
  },
  {
    id: "mobile",
    name: { en: "Mobile", it: "Mobile" },
    icon: "📱",
    matchCategories: ["mobile"],
    costMult: 1.3,
    bonusMult: 1.6,
    glow: "var(--sm-neon-cyan)",
  },
  {
    id: "backend",
    name: { en: "Backend", it: "Backend" },
    icon: "⚙",
    matchCategories: ["saas", "os"],
    costMult: 1.3,
    bonusMult: 1.6,
    glow: "var(--sm-neon-amber)",
  },
  {
    id: "ai",
    name: { en: "AI", it: "AI" },
    icon: "✦",
    matchCategories: ["ai"],
    costMult: 1.5,
    bonusMult: 1.8,
    glow: "var(--sm-neon-purple)",
  },
];

export function getSpecialization(id) {
  return SPECIALIZATIONS.find((s) => s.id === id) || SPECIALIZATIONS[0];
}

// Multiplier applied to a staff member based on the active project category.
export function specMultiplier(specialtyId, projectCategory) {
  const spec = getSpecialization(specialtyId);
  if (!projectCategory) return 1.0;
  return spec.matchCategories.includes(projectCategory) ? spec.bonusMult : 1.0;
}
