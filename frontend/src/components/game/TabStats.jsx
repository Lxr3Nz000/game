import React from "react";
import StatsChart from "./StatsChart";
import { t } from "../../game/i18n";
import { Rocket } from "lucide-react";

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n);
}

export default function TabStats({ state, derived, lang, onOpenPrestige }) {
  const prestigeMult = state.prestigeMult || 0;
  return (
    <div className="space-y-3 md:space-y-4" data-testid="tab-stats">
      <StatsChart history={state.history || []} lang={lang} />

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm-panel p-4" data-testid="stats-card-earnings">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)] mb-2">
            {t(lang, "stats.earnings")}
          </div>
          <div className="sm-heading text-2xl neon-green">€{fmt(state.totalEarned || 0)}</div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">
            {t(lang, "stats.earnings_desc")}
          </div>
        </div>

        <div className="sm-panel p-4" data-testid="stats-card-valuation">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)] mb-2">
            {t(lang, "stats.valuation")}
          </div>
          <div className="sm-heading text-2xl neon-cyan">€{fmt(derived.valuation)}</div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">
            {t(lang, "stats.valuation_desc")}
          </div>
        </div>

        <div className="sm-panel p-4" data-testid="stats-card-taps">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)] mb-2">
            {t(lang, "stats.total_taps")}
          </div>
          <div className="sm-heading text-2xl neon-amber">{state.totalTaps || 0}</div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">
            {t(lang, "stats.taps_desc")}
          </div>
        </div>

        <div className="sm-panel p-4" data-testid="stats-card-prestige">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)]">
              {t(lang, "stats.prestige")}
            </div>
            <Rocket size={12} className="neon-purple" />
          </div>
          <div className="sm-heading text-2xl neon-purple">+{Math.round(prestigeMult * 100)}%</div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">
            IPO×{state.ipoRounds || 0}
          </div>
          <button
            className="sm-btn w-full mt-2"
            onClick={onOpenPrestige}
            data-testid="open-prestige-btn"
            style={{ borderColor: "var(--sm-neon-amber)", color: "var(--sm-neon-amber)" }}
          >
            {t(lang, "stats.open_ipo")}
          </button>
        </div>
      </div>
    </div>
  );
}
