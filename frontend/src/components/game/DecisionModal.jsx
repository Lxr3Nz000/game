import React from "react";
import { X } from "lucide-react";

export default function DecisionModal({ decision, lang, onChoose }) {
  if (!decision) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 4, 8, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 92,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
      data-testid="decision-modal"
    >
      <div
        className="sm-panel"
        style={{
          width: "100%",
          maxWidth: 460,
          borderLeft: "3px solid var(--sm-neon-cyan)",
        }}
      >
        <div className="p-4 md:p-5 border-b" style={{ borderColor: "var(--sm-border)" }}>
          <div className="sm-display text-lg md:text-xl neon-cyan">
            &gt; {decision.title[lang]}
          </div>
        </div>
        <div className="p-4 md:p-5 space-y-3">
          <div className="text-sm text-[color:var(--sm-text)]">{decision.body[lang]}</div>
          <div className="space-y-2">
            {decision.options.map((opt, i) => (
              <button
                key={i}
                className="sm-btn w-full !text-left !normal-case !tracking-normal !min-h-[48px]"
                onClick={() => onChoose(i)}
                data-testid={`decision-option-${i}`}
              >
                {opt.label[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
