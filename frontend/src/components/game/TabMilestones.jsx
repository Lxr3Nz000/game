import React from "react";
import { t } from "../../game/i18n";
import { MILESTONES } from "../../game/constants";
import { Trophy, Lock } from "lucide-react";

export default function TabMilestones({ state, lang }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="tab-milestones">
      {MILESTONES.map((m) => {
        const unlocked = state.milestonesUnlocked.includes(m.id);
        const rewardText = [];
        if (m.reward.gems) rewardText.push(`+${m.reward.gems} 💎`);
        if (m.reward.discount) rewardText.push(`-${Math.round(m.reward.discount * 100)}% desks`);
        if (m.reward.productivity) rewardText.push(`+${Math.round(m.reward.productivity * 100)}% prod.`);
        if (m.reward.unlock) rewardText.push(`Unlock ${m.reward.unlock}`);
        return (
          <div
            key={m.id}
            className={`sm-panel p-4 ${unlocked ? "milestone-unlocked" : ""}`}
            data-testid={`milestone-${m.id}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {unlocked ? (
                  <Trophy size={14} className="text-[color:var(--sm-neon-green)]" />
                ) : (
                  <Lock size={14} className="text-[color:var(--sm-text-dim)]" />
                )}
                <div className="sm-heading text-sm">{m.title[lang]}</div>
              </div>
              <span className={`text-[10px] uppercase ${unlocked ? "neon-green" : "text-[color:var(--sm-text-dim)]"}`}>
                {unlocked ? t(lang, "milestones.unlocked") : t(lang, "milestones.locked")}
              </span>
            </div>
            <div className="text-xs text-[color:var(--sm-text-dim)] mb-2">{m.desc[lang]}</div>
            <div className="text-[11px] neon-amber">
              {t(lang, "milestones.reward")}: {rewardText.join(" · ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
