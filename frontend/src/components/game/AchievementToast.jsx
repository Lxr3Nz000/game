import React from "react";
import { Trophy, Sparkles } from "lucide-react";
import { t } from "../../game/i18n";
import { MILESTONES } from "../../game/constants";

// Animated achievement toasts queue. Top-center stack. Each entry persists ~4s.
export default function AchievementToast({ queue, lang, onConsume }) {
  if (!queue || queue.length === 0) return null;
  return (
    <div className="sm-ach-stack" data-testid="achievement-stack">
      {queue.slice(0, 3).map((m) => {
        const milestone = MILESTONES.find((x) => x.id === m.id);
        if (!milestone) return null;
        return (
          <Toast
            key={m.uid}
            milestone={milestone}
            lang={lang}
            onDone={() => onConsume(m.uid)}
          />
        );
      })}
    </div>
  );
}

function Toast({ milestone, lang, onDone }) {
  React.useEffect(() => {
    const id = setTimeout(onDone, 4200);
    return () => clearTimeout(id);
  }, [onDone]);

  const rewardChips = [];
  if (milestone.reward.gems) rewardChips.push({ label: `+${milestone.reward.gems} 💎`, color: "neon-purple" });
  if (milestone.reward.discount) rewardChips.push({ label: `−${Math.round(milestone.reward.discount * 100)}% desks`, color: "neon-cyan" });
  if (milestone.reward.productivity) rewardChips.push({ label: `+${Math.round(milestone.reward.productivity * 100)}% prod.`, color: "neon-green" });
  if (milestone.reward.unlock) rewardChips.push({ label: `Unlock ${milestone.reward.unlock}`, color: "neon-amber" });

  return (
    <div
      className="sm-ach-toast"
      data-testid={`ach-toast-${milestone.id}`}
      onClick={onDone}
    >
      <div className="sm-ach-glow" />
      <div className="sm-ach-inner">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={14} className="neon-amber" />
          <div className="text-[10px] uppercase tracking-widest neon-amber">
            {t(lang, "milestones.unlocked")}
          </div>
          <Sparkles size={12} className="neon-purple ml-auto" />
        </div>
        <div className="sm-display text-xl md:text-2xl neon-green">
          &gt; {milestone.title[lang]}
        </div>
        <div className="text-[11px] md:text-xs text-[color:var(--sm-text-dim)] mt-1">
          {milestone.desc[lang]}
        </div>
        {rewardChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rewardChips.map((c, i) => (
              <span
                key={i}
                className={`sm-hud-chip !py-0.5 !px-2 ${c.color}`}
                style={{ fontSize: 11 }}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
