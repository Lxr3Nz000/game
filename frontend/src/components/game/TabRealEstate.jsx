import React from "react";
import { t } from "../../game/i18n";
import { OFFICES } from "../../game/constants";

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toString();
}

export default function TabRealEstate({ state, lang, upgradeOffice }) {
  return (
    <div className="space-y-4" data-testid="tab-realestate">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICES.map((o) => {
          const isCurrent = state.officeTier === o.tier;
          const isPast = state.officeTier > o.tier;
          const canAfford = state.cash >= o.cost;
          const disabled = isCurrent || isPast || !canAfford;
          const moonLocked = o.id === "moon" && !state.milestonesUnlocked.includes("unicorn");
          return (
            <div
              key={o.id}
              className={`sm-panel p-4 flex flex-col gap-2 ${isCurrent ? "milestone-unlocked" : ""} ${moonLocked ? "opacity-50" : ""}`}
              data-testid={`office-${o.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="sm-heading text-base">{o.name[lang]}</div>
                <span className="text-[10px] uppercase neon-cyan">TIER {o.tier}</span>
              </div>
              <div className="text-xs text-[color:var(--sm-text-dim)]">{o.tagline[lang]}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                <div>
                  {t(lang, "realestate.cap")}: <span className="neon-cyan">{o.capacity}</span>
                </div>
                <div>
                  {t(lang, "realestate.bonus")}: <span className="neon-green">+{o.bonus.speed}%</span>
                </div>
              </div>
              {isCurrent && (
                <div className="text-[10px] neon-green uppercase" data-testid={`office-${o.id}-current`}>
                  &gt; {t(lang, "realestate.owned")}
                </div>
              )}
              <button
                className="sm-btn mt-auto"
                onClick={() => upgradeOffice(o.tier)}
                disabled={disabled || moonLocked}
                data-testid={`upgrade-${o.id}-btn`}
              >
                {o.cost === 0 ? "FREE" : `€${fmt(o.cost)}`} · {t(lang, "realestate.upgrade")}
              </button>
              {moonLocked && (
                <div className="text-[10px] neon-amber">
                  🔒 unlock via Unicorn milestone
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
