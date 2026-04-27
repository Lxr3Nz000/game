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
import GemShop from "../components/game/GemShop";
import { useGameState } from "../game/useGameState";
import { t } from "../game/i18n";
import { sfx } from "../game/sfx";
import { Building2, Users, FlaskConical, Store, Trophy } from "lucide-react";

const TABS = [
  { k: "office", icon: Building2 },
  { k: "staff", icon: Users },
  { k: "research", icon: FlaskConical },
  { k: "realestate", icon: Store },
  { k: "milestones", icon: Trophy },
];

export default function GamePage() {
  const game = useGameState();
  const { state, derived } = game;
  const lang = state.lang;

  const [tab, setTab] = useState("office");
  const [showDone, setShowDone] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [muted, setMuted] = useState(() => sfx.isMuted());

  useEffect(() => {
    if (state.tutorialStep === 5 && state.releasedApps.length >= 1 && !localStorage.getItem("tut_done_shown")) {
      setShowDone(true);
      localStorage.setItem("tut_done_shown", "1");
    }
  }, [state.tutorialStep, state.releasedApps.length]);

  // Auto-focus the right tab during the tutorial
  useEffect(() => {
    if (state.tutorialStep === 1) setTab("office");
    else if (state.tutorialStep === 2) setTab("staff");
    else if (state.tutorialStep === 3 || state.tutorialStep === 4) setTab("research");
  }, [state.tutorialStep]);

  const toggleMute = () => {
    const next = !muted;
    sfx.setMuted(next);
    setMuted(next);
  };

  const handleShopOpen = () => {
    sfx.click();
    setShopOpen(true);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ padding: "10px", paddingBottom: "90px", paddingTop: "64px" }}
      data-testid="game-root"
    >
      <TutorialManager state={state} lang={lang} onSkip={game.skipTutorial} />

      <div className="max-w-[1400px] mx-auto space-y-3 md:space-y-4 relative z-10">
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
          onOpenShop={handleShopOpen}
          muted={muted}
          onToggleMute={toggleMute}
        />

        <IsometricOffice
          state={state}
          derived={derived}
          lang={lang}
          onTap={game.tapCode}
          tutorialStep={state.tutorialStep}
        />

        <div
          className="sm-panel p-1 flex gap-1 overflow-x-auto no-scrollbar"
          data-testid="tabs-nav"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map(({ k, icon: Icon }) => (
            <button
              key={k}
              className={`sm-tab !px-3 md:!px-4 !py-2.5 flex items-center gap-1.5 shrink-0 min-h-[44px] ${tab === k ? "active" : ""}`}
              onClick={() => { sfx.click(); setTab(k); }}
              data-testid={`tab-${k}-btn`}
            >
              <Icon size={14} />
              <span className="text-[11px] md:text-[13px]">{t(lang, `tabs.${k}`)}</span>
            </button>
          ))}
        </div>

        <div data-testid="tab-content">
          {tab === "office" && (
            <TabOffice state={state} derived={derived} lang={lang}
              buyDesk={game.buyDesk} tutorialStep={state.tutorialStep} />
          )}
          {tab === "staff" && (
            <TabStaff state={state} derived={derived} lang={lang}
              hireStaff={game.hireStaff} tutorialStep={state.tutorialStep} />
          )}
          {tab === "research" && (
            <TabResearch state={state} derived={derived} lang={lang}
              launchProject={game.launchProject} releaseUpdate={game.releaseUpdate}
              tutorialStep={state.tutorialStep} />
          )}
          {tab === "realestate" && (
            <TabRealEstate state={state} lang={lang} upgradeOffice={game.upgradeOffice} />
          )}
          {tab === "milestones" && <TabMilestones state={state} lang={lang} />}
        </div>

        <div className="text-center text-[10px] text-[color:var(--sm-text-dim)] py-4 sm-display px-2">
          &gt; valuation: €{derived.valuation.toLocaleString()} · session {Math.floor((Date.now() - state.startedAt) / 60000)}m · taps {state.totalTaps || 0}
        </div>
      </div>

      <EventNotification events={state.activeEvents} onDismiss={game.dismissEvent} />

      <GemShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        state={state}
        lang={lang}
        onPurchase={(id) => {
          game.purchaseGem(id);
        }}
      />

      {showDone && (
        <TutorialDoneBanner lang={lang} onClose={() => setShowDone(false)} />
      )}

      {state.bankrupt && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(2, 4, 8, 0.85)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          data-testid="bankrupt-overlay"
        >
          <div className="sm-panel p-5 md:p-6 shake"
               style={{ width: "100%", maxWidth: 420, borderLeft: "3px solid var(--sm-neon-red)" }}>
            <div className="sm-display text-3xl md:text-4xl neon-red mb-2">
              &gt; {t(lang, "common.bankrupt_title")}
            </div>
            <div className="text-sm text-[color:var(--sm-text-dim)] mb-4">
              {t(lang, "common.bankrupt_msg")}
            </div>
            <div className="space-y-2">
              {state.gems >= 30 && (
                <button
                  className="sm-btn w-full min-h-[48px]"
                  onClick={() => { setShopOpen(true); }}
                  data-testid="bankrupt-shop-btn"
                  style={{ borderColor: "var(--sm-neon-purple)", color: "var(--sm-neon-purple)" }}
                >
                  Spend 30 💎 to Revive
                </button>
              )}
              <button
                className="sm-btn sm-btn-primary w-full min-h-[48px]"
                onClick={() => { localStorage.removeItem("tut_done_shown"); game.resetGame(); }}
                data-testid="retry-btn"
              >
                {t(lang, "common.retry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
