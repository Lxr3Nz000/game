import React from "react";
import { MARKETING_ACTIONS } from "../../game/difficulty";
import { Megaphone } from "lucide-react";
import { t } from "../../game/i18n";

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n);
}

export default function MarketingPanel({ state, lang, onRun }) {
  const now = Date.now();
  return (
    <div className="sm-panel p-3 md:p-4" data-testid="marketing-panel">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone size={14} className="neon-amber" />
        <div className="sm-heading text-sm uppercase tracking-widest text-[color:var(--sm-text-dim)]">
          {t(lang, "marketing.title")}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MARKETING_ACTIONS.map((m) => {
          const lastUsed = (state.marketingCooldowns || {})[m.id] || 0;
          const cdLeft = Math.max(0, lastUsed + m.cooldownMs - now);
          const disabled = state.cash < m.cost || cdLeft > 0;
          return (
            <button
              key={m.id}
              className="sm-btn text-left flex flex-col items-stretch !py-2 !px-2.5"
              onClick={() => onRun(m.id)}
              disabled={disabled}
              data-testid={`marketing-${m.id}-btn`}
              style={{ minHeight: 74 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] md:text-xs truncate">{m.name[lang]}</span>
                <span className="text-[10px] neon-amber shrink-0 ml-1">€{fmt(m.cost)}</span>
              </div>
              <div className="text-[9px] text-[color:var(--sm-text-dim)] truncate normal-case tracking-normal mt-0.5">
                {m.desc[lang]}
              </div>
              {cdLeft > 0 && (
                <div className="text-[9px] neon-red mt-0.5">
                  ⏱ {Math.ceil(cdLeft / 1000)}s
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
