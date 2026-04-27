import React from "react";
import { DIFFICULTIES } from "../../game/difficulty";
import { t } from "../../game/i18n";

export default function DifficultyModal({ open, lang, onSelect }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 4, 8, 0.92)",
        backdropFilter: "blur(6px)",
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
      data-testid="difficulty-modal"
    >
      <div className="sm-panel w-full" style={{ maxWidth: 640 }}>
        <div className="p-4 md:p-5 border-b" style={{ borderColor: "var(--sm-border)" }}>
          <div className="sm-display text-2xl md:text-3xl neon-green">&gt; {t(lang, "difficulty.title")}</div>
          <div className="text-xs text-[color:var(--sm-text-dim)] mt-1">{t(lang, "difficulty.subtitle")}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 p-4 md:p-5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className="sm-panel p-4 text-left flex flex-col gap-1 transition hover:scale-[1.02]"
              style={{ borderLeft: `3px solid ${d.color}`, cursor: "pointer", minHeight: 92 }}
              onClick={() => onSelect(d.id)}
              data-testid={`difficulty-${d.id}-btn`}
            >
              <div className="sm-heading text-base" style={{ color: d.color }}>
                {d.name[lang]}
              </div>
              <div className="text-xs text-[color:var(--sm-text-dim)]">{d.tagline[lang]}</div>
              <div className="text-[10px] mt-2 font-mono text-[color:var(--sm-text-dim)]">
                cash×{d.cashStart} · burn×{d.burnMult} · rev×{d.revMult} · work×{d.workMult}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
