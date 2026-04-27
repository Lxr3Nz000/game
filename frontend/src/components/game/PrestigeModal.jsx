import React from "react";
import { t } from "../../game/i18n";
import { Rocket, X } from "lucide-react";

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n);
}

// IPO / Prestige modal.
export default function PrestigeModal({ open, onClose, onIpo, state, derived, lang }) {
  if (!open) return null;
  const threshold = 10_000_000;
  const canIpo = derived.valuation >= threshold;
  const pointsEarned = canIpo ? Math.floor(Math.sqrt(derived.valuation / threshold) * 3) : 0;
  const nextMult = (state.prestigeMult || 0) + pointsEarned * 0.02;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 4, 8, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
      onClick={onClose}
      data-testid="prestige-modal"
    >
      <div
        className="sm-panel"
        style={{
          width: "100%",
          maxWidth: 520,
          borderLeft: "3px solid var(--sm-neon-amber)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b" style={{ borderColor: "var(--sm-border)" }}>
          <div className="flex items-center gap-2">
            <Rocket size={16} className="neon-amber" />
            <div className="sm-display text-xl md:text-2xl neon-amber">&gt; {t(lang, "prestige.title")}</div>
          </div>
          <button className="sm-btn !px-3 !py-2 !min-h-0" onClick={onClose} data-testid="prestige-close">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 md:p-5 space-y-3">
          <div className="text-sm text-[color:var(--sm-text-dim)]">{t(lang, "prestige.body")}</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="sm-panel p-2">
              <div className="text-[10px] uppercase text-[color:var(--sm-text-dim)]">
                {t(lang, "prestige.current_val")}
              </div>
              <div className="sm-heading text-base neon-cyan">€{fmt(derived.valuation)}</div>
            </div>
            <div className="sm-panel p-2">
              <div className="text-[10px] uppercase text-[color:var(--sm-text-dim)]">
                {t(lang, "prestige.threshold")}
              </div>
              <div className="sm-heading text-base neon-amber">€{fmt(threshold)}</div>
            </div>
            <div className="sm-panel p-2">
              <div className="text-[10px] uppercase text-[color:var(--sm-text-dim)]">
                {t(lang, "prestige.points")}
              </div>
              <div className="sm-heading text-base neon-green">+{pointsEarned}</div>
            </div>
            <div className="sm-panel p-2">
              <div className="text-[10px] uppercase text-[color:var(--sm-text-dim)]">
                {t(lang, "prestige.next_mult")}
              </div>
              <div className="sm-heading text-base neon-purple">+{Math.round(nextMult * 100)}%</div>
            </div>
          </div>

          <button
            className="sm-btn sm-btn-primary w-full min-h-[48px]"
            disabled={!canIpo}
            onClick={onIpo}
            data-testid="ipo-confirm-btn"
          >
            {canIpo ? t(lang, "prestige.go_ipo") : t(lang, "prestige.not_ready")}
          </button>
          <div className="text-[10px] text-center text-[color:var(--sm-text-dim)]">
            {t(lang, "prestige.warning")}
          </div>
        </div>
      </div>
    </div>
  );
}
