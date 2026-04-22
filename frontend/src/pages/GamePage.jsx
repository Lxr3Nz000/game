import React, { useEffect, useState } from "react";
import HUD from "../components/game/HUD";
import IsometricOffice from "../components/game/IsometricOffice";
import TabOffice from "../components/game/TabOffice";
import TabStaff from "../components/game/TabStaff";
import TabResearch from "../components/game/TabResearch";
import TabRealEstate from "../components/game/TabRealEstate";
import TabMilestones from "../components/game/TabMilestones";
import EventNotification from "../components/game/EventNotification";
import TutorialManager, { TutorialDoneBanner } from "../components/game/TutorialManager";
import { useGameState } from "../game/useGameState";
import { t } from "../game/i18n";

const TABS = ["office", "staff", "research", "realestate", "milestones"];

export default function GamePage() {
  const game = useGameState();
  const { state, derived } = game;
  const lang = state.lang;

  const [tab, setTab] = useState("office");
  const [showDone, setShowDone] = useState(false);

  // show tutorial completion banner once
  useEffect(() => {
    if (state.tutorialStep === 5 && state.milestonesUnlocked.includes("first_app") && !localStorage.getItem("tut_done_shown")) {
      setShowDone(true);
      localStorage.setItem("tut_done_shown", "1");
      // reward gems once
      // (we already grant via milestones; extra 50 here via one-shot flag)
    }
  }, [state.tutorialStep, state.milestonesUnlocked]);

  // auto-switch tab with tutorial steps for guided experience
  useEffect(() => {
    if (state.tutorialStep === 1) setTab("office");
    else if (state.tutorialStep === 2) setTab("staff");
    else if (state.tutorialStep === 3) setTab("research");
    else if (state.tutorialStep === 4) setTab("research");
  }, [state.tutorialStep]);

  return (
    <div className="min-h-screen relative" style={{ padding: "18px" }} data-testid="game-root">
      <div className="max-w-[1400px] mx-auto space-y-4 relative z-10">
        <HUD
          state={state}
          derived={derived}
          lang={lang}
          onLangToggle={() => game.setLang(lang === "en" ? "it" : "en")}
          onReset={() => {
            if (window.confirm("Reset save?")) {
              localStorage.removeItem("tut_done_shown");
              game.resetGame();
            }
          }}
        />

        <IsometricOffice state={state} derived={derived} lang={lang} />

        <div className="sm-panel p-1 flex flex-wrap gap-1" data-testid="tabs-nav">
          {TABS.map((k) => (
            <button
              key={k}
              className={`sm-tab ${tab === k ? "active" : ""}`}
              onClick={() => setTab(k)}
              data-testid={`tab-${k}-btn`}
            >
              {t(lang, `tabs.${k}`)}
            </button>
          ))}
        </div>

        <div data-testid="tab-content">
          {tab === "office" && (
            <TabOffice
              state={state}
              derived={derived}
              lang={lang}
              buyDesk={game.buyDesk}
              tutorialStep={state.tutorialStep}
            />
          )}
          {tab === "staff" && (
            <TabStaff
              state={state}
              derived={derived}
              lang={lang}
              hireStaff={game.hireStaff}
              tutorialStep={state.tutorialStep}
            />
          )}
          {tab === "research" && (
            <TabResearch
              state={state}
              derived={derived}
              lang={lang}
              launchProject={game.launchProject}
              releaseUpdate={game.releaseUpdate}
              tutorialStep={state.tutorialStep}
            />
          )}
          {tab === "realestate" && (
            <TabRealEstate state={state} lang={lang} upgradeOffice={game.upgradeOffice} />
          )}
          {tab === "milestones" && <TabMilestones state={state} lang={lang} />}
        </div>

        <div className="text-center text-[10px] text-[color:var(--sm-text-dim)] py-4 sm-display">
          &gt; STARTUP_MASTER // valuation: €{derived.valuation.toLocaleString()} · session {Math.floor((Date.now() - state.startedAt) / 60000)}m
        </div>
      </div>

      <EventNotification events={state.activeEvents} onDismiss={game.dismissEvent} />

      <TutorialManager
        step={state.tutorialStep}
        lang={lang}
        onNext={game.nextTutorialStep}
        onSkip={game.skipTutorial}
      />

      {showDone && (
        <TutorialDoneBanner
          lang={lang}
          onClose={() => setShowDone(false)}
        />
      )}

      {state.bankrupt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 4, 8, 0.85)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          data-testid="bankrupt-overlay"
        >
          <div className="sm-panel p-6 shake" style={{ width: 420, borderLeft: "3px solid var(--sm-neon-red)" }}>
            <div className="sm-display text-4xl neon-red mb-2">
              &gt; {t(lang, "common.bankrupt_title")}
            </div>
            <div className="text-sm text-[color:var(--sm-text-dim)] mb-4">
              {t(lang, "common.bankrupt_msg")}
            </div>
            <button
              className="sm-btn sm-btn-primary w-full"
              onClick={() => {
                localStorage.removeItem("tut_done_shown");
                game.resetGame();
              }}
              data-testid="retry-btn"
            >
              {t(lang, "common.retry")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
