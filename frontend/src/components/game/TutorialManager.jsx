import React from "react";
import { t } from "../../game/i18n";

// Tutorial overlay with a small panel indicating the current step.
// Uses CSS .tut-highlight applied by the Tab components via the `tutorialStep` prop.
export default function TutorialManager({ step, lang, onNext, onSkip }) {
  if (step >= 5) return null;

  const messages = [
    t(lang, "tutorial.welcome_msg"),
    t(lang, "tutorial.step_desk"),
    t(lang, "tutorial.step_hire"),
    t(lang, "tutorial.step_launch"),
    t(lang, "tutorial.step_collect"),
  ];

  const titles = [
    t(lang, "tutorial.welcome_title"),
    "STEP 1/4",
    "STEP 2/4",
    "STEP 3/4",
    "STEP 4/4",
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 60,
        pointerEvents: "none",
      }}
      data-testid="tutorial-overlay"
    >
      <div
        className="sm-panel p-4 mx-auto"
        style={{
          maxWidth: 640,
          borderLeft: "3px solid var(--sm-neon-green)",
          pointerEvents: "auto",
          boxShadow: "0 10px 40px rgba(0, 255, 157, 0.15)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="sm-display text-2xl neon-green">&gt; {titles[step]}</div>
            <div className="text-sm mt-1 text-[color:var(--sm-text)]">{messages[step]}</div>
          </div>
          <div className="flex gap-2">
            {step === 0 && (
              <button className="sm-btn sm-btn-primary" onClick={onNext} data-testid="tutorial-next-btn">
                {t(lang, "tutorial.next")}
              </button>
            )}
            <button className="sm-btn" onClick={onSkip} data-testid="tutorial-skip-btn">
              {t(lang, "tutorial.skip")}
            </button>
          </div>
        </div>
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
      }}
      data-testid="tutorial-done-banner"
    >
      <div
        className="sm-panel p-6"
        style={{
          width: 400,
          borderLeft: "3px solid var(--sm-neon-green)",
          background: "linear-gradient(180deg, rgba(18, 24, 33, 0.98), rgba(12, 17, 23, 0.98))",
        }}
      >
        <div className="sm-display text-3xl neon-green mb-2">
          &gt; {t(lang, "tutorial.done_title")}
        </div>
        <div className="text-sm text-[color:var(--sm-text-dim)] mb-4">
          {t(lang, "tutorial.done_msg")}
        </div>
        <button className="sm-btn sm-btn-primary w-full" onClick={onClose} data-testid="tutorial-done-close">
          {t(lang, "tutorial.next")}
        </button>
      </div>
    </div>
  );
}
