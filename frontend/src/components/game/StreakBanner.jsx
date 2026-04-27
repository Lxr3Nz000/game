import React from "react";
import { Flame, Gem } from "lucide-react";
import { t } from "../../game/i18n";

export default function StreakBanner({ open, streak, reward, lang, onClaim }) {
  if (!open) return null;
  const days = [];
  for (let i = 1; i <= 7; i++) {
    days.push({ day: i, active: i <= streak });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(2, 4, 8, 0.86)",
        backdropFilter: "blur(6px)",
        zIndex: 96,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 12,
      }}
      data-testid="streak-banner"
    >
      <div
        className="sm-panel"
        style={{
          width: "100%", maxWidth: 460,
          borderLeft: "3px solid var(--sm-neon-amber)",
        }}
      >
        <div className="p-4 md:p-5 border-b" style={{ borderColor: "var(--sm-border)" }}>
          <div className="flex items-center gap-2">
            <Flame size={18} className="neon-amber" />
            <div className="sm-display text-2xl neon-amber">
              &gt; {t(lang, "streak.title")}
            </div>
          </div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">
            {t(lang, "streak.subtitle")}
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-1.5 justify-between">
            {days.map((d) => (
              <div
                key={d.day}
                className="sm-panel"
                style={{
                  flex: 1,
                  padding: 6,
                  textAlign: "center",
                  borderColor: d.active ? "var(--sm-neon-amber)" : "var(--sm-border)",
                  background: d.active
                    ? "linear-gradient(180deg, rgba(255,176,32,0.18), rgba(0,0,0,0.2))"
                    : undefined,
                }}
                data-testid={`streak-day-${d.day}`}
              >
                <div className={`text-[9px] uppercase ${d.active ? "neon-amber" : "text-[color:var(--sm-text-dim)]"}`}>
                  D{d.day}
                </div>
                {d.active && <div className="text-[10px] neon-amber">✓</div>}
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="text-xs text-[color:var(--sm-text-dim)] uppercase tracking-widest mb-1">
              {t(lang, "streak.day")} {streak} · {t(lang, "streak.reward")}
            </div>
            <div className="sm-display text-4xl neon-purple flex items-center justify-center gap-2">
              <Gem size={22} /> +{reward}
            </div>
          </div>

          <button
            className="sm-btn sm-btn-primary w-full min-h-[48px]"
            onClick={onClaim}
            data-testid="streak-claim-btn"
          >
            {t(lang, "streak.claim")}
          </button>
        </div>
      </div>
    </div>
  );
}
