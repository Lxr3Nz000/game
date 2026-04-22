import React from "react";
import { t } from "../../game/i18n";
import { PROJECT_TEMPLATES, OFFICES } from "../../game/constants";

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n);
}

export default function TabResearch({ state, derived, lang, launchProject, releaseUpdate, tutorialStep }) {
  return (
    <div className="space-y-3 md:space-y-4" data-testid="tab-research">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {PROJECT_TEMPLATES.map((tpl) => {
          const locked = state.officeTier < tpl.minOffice;
          const busy = !!state.activeProject;
          const canAfford = state.cash >= tpl.cost;
          const disabled = locked || busy || !canAfford;
          const isHello = tpl.id === "hello";
          const highlight = tutorialStep === 3 && isHello ? "tut-highlight" : "";
          return (
            <div
              key={tpl.id}
              className={`sm-panel p-4 flex flex-col gap-2 ${locked ? "opacity-60" : ""}`}
              data-testid={`project-${tpl.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="sm-heading text-base">{tpl.name[lang]}</div>
                <span className="text-[10px] uppercase neon-cyan">{tpl.category}</span>
              </div>
              <div className="text-xs text-[color:var(--sm-text-dim)]">
                {t(lang, "research.duration")}: <span className="neon-cyan">{tpl.work} wp</span>
              </div>
              <div className="text-xs text-[color:var(--sm-text-dim)]">
                {t(lang, "research.revenue_boost")}: <span className="neon-green">€{tpl.baseRevenue}/s</span>
              </div>
              {locked && (
                <div className="text-xs neon-amber">
                  {t(lang, "research.min_lvl")}: {OFFICES[tpl.minOffice].name[lang]}
                </div>
              )}
              <button
                className={`sm-btn mt-auto ${isHello ? "sm-btn-primary" : ""} ${highlight}`}
                onClick={() => launchProject(tpl.id)}
                disabled={disabled}
                data-testid={`launch-${tpl.id}-btn`}
              >
                {t(lang, "research.launch")} · €{tpl.cost}
              </button>
            </div>
          );
        })}
      </div>

      <div className="sm-panel p-4">
        <div className="sm-heading text-sm mb-3 uppercase tracking-widest text-[color:var(--sm-text-dim)]">
          {t(lang, "research.active")} ({state.releasedApps.length})
        </div>
        {state.releasedApps.length === 0 ? (
          <div className="text-sm text-[color:var(--sm-text-dim)] italic" data-testid="no-apps-msg">
            &gt; {t(lang, "research.no_active")}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {state.releasedApps.map((app) => {
              const tpl = PROJECT_TEMPLATES.find((t) => t.id === app.templateId);
              const obs = Math.max(10, Math.round((1 - app.age * 0.005) * 100));
              const updCost = Math.round(tpl.cost * 0.4 * Math.pow(1.6, app.level - 1)) + 50;
              return (
                <div key={app.id} className="sm-panel p-3" data-testid={`app-${app.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="sm-heading text-sm">
                      {tpl.name[lang]} <span className="text-xs neon-cyan">v{app.level}</span>
                    </div>
                    <div className="text-[10px] text-[color:var(--sm-text-dim)]">
                      {t(lang, "research.age")}: {app.age}s
                    </div>
                  </div>
                  <div className="text-xs mb-2">
                    {t(lang, "research.obsolescence")}: <span className={obs > 50 ? "neon-green" : obs > 25 ? "neon-amber" : "neon-red"}>{obs}%</span>
                  </div>
                  <div className="sm-bar mb-2">
                    <div className="sm-bar-fill" style={{ width: `${obs}%` }} />
                  </div>
                  <button
                    className="sm-btn w-full"
                    disabled={state.cash < updCost}
                    onClick={() => releaseUpdate(app.id)}
                    data-testid={`update-app-btn-${app.id}`}
                  >
                    {t(lang, "research.update")} · €{formatNum(updCost)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
