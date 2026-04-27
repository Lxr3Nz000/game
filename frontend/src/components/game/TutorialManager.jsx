import React from "react";
import { t } from "../../game/i18n";
import { ChevronRight } from "lucide-react";

// Compact sticky top stepper that guides the player without blocking the screen.
export default function TutorialManager({ state, lang, onSkip }) {
  const step = state.tutorialStep;
  if (step >= 5) return null;

  const totalSteps = 5; // 0..4 shown, 5 = done
  const messages = [
    t(lang, "tutorial.step_tap"),
    t(lang, "tutorial.step_desk"),
    t(lang, "tutorial.step_hire"),
    t(lang, "tutorial.step_launch"),
    t(lang, "tutorial.step_collect"),
  ];

  let extra = null;
  if (step === 0) {
    const left = Math.max(0, 5 - (state.totalTaps || 0));
    extra = <span className="neon-amber">· {t(lang, "tutorial.taps_left", { n: left })}</span>;
  }

  return (
    <div className="sm-tutorial-sticky" data-testid="tutorial-overlay">
      <div
        className="sm-panel flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5"
        style={{
          borderLeft: "3px solid var(--sm-neon-green)",
          boxShadow: "0 6px 24px rgba(0, 255, 157, 0.18)",
        }}
      >
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="sm-display text-[11px] md:text-xs neon-green uppercase">
            {t(lang, "tutorial.progress_label")}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 4,
                  borderRadius: 2,
                  background:
                    i < step ? "var(--sm-neon-green)" : i === step ? "var(--sm-neon-green)" : "rgba(255,255,255,0.12)",
                  opacity: i === step ? 1 : i < step ? 0.7 : 1,
                  boxShadow: i === step ? "0 0 8px rgba(0,255,157,0.6)" : "none",
                }}
              />
            ))}
          </div>
        </div>
        <ChevronRight size={14} className="text-[color:var(--sm-text-dim)] shrink-0 hidden sm:block" />
        <div className="text-[11px] md:text-sm min-w-0 flex-1 truncate">
          <span className="neon-green">&gt;</span> {messages[step]} {extra}
        </div>
        <button
          className="sm-btn !px-2.5 !py-1.5 !text-[10px] !min-h-[32px] shrink-0"
          onClick={onSkip}
          data-testid="tutorial-skip-btn"
        >
          {t(lang, "tutorial.skip")}
        </button>
      </div>
    </div>
  );
}

export function TutorialDoneBanner({ lang, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 80,
        width: "calc(100% - 32px)",
        maxWidth: 400,
      }}
      data-testid="tutorial-done-banner"
    >
      <div
        className="sm-panel p-5 md:p-6"
        style={{
          borderLeft: "3px solid var(--sm-neon-green)",
          background: "linear-gradient(180deg, rgba(18, 24, 33, 0.98), rgba(12, 17, 23, 0.98))",
        }}
      >
        <div className="sm-display text-2xl md:text-3xl neon-green mb-2">
          &gt; {t(lang, "tutorial.done_title")}
        </div>
        <div className="text-xs md:text-sm text-[color:var(--sm-text-dim)] mb-4">
          {t(lang, "tutorial.done_msg")}
        </div>
        <button
          className="sm-btn sm-btn-primary w-full min-h-[48px]"
          onClick={onClose}
          data-testid="tutorial-done-close"
        >
          {t(lang, "tutorial.next")}
        </button>
      </div>
    </div>
  );
}
