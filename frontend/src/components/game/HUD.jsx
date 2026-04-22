import React from "react";
import { t } from "../../game/i18n";
import { Coins, Gem, Flame, TrendingUp, Activity, Building2, Users } from "lucide-react";

function formatCash(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toString();
}

export default function HUD({ state, derived, lang, onLangToggle, onReset }) {
  const hypeColor =
    state.hype >= 66 ? "sm-bar-fill hype" : state.hype >= 33 ? "sm-bar-fill" : "sm-bar-fill hype";

  return (
    <div className="sm-panel p-4 md:p-5" data-testid="hud-panel">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="sm-display text-3xl neon-green">&gt; STARTUP_MASTER</div>
          <span className="text-xs text-[color:var(--sm-text-dim)] hidden md:inline">
            // {t(lang, "app_subtitle")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="sm-btn"
            data-testid="lang-toggle-btn"
            onClick={onLangToggle}
            title="Toggle language"
          >
            {lang === "en" ? "IT" : "EN"}
          </button>
          <button className="sm-btn sm-btn-danger" data-testid="reset-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2" data-testid="hud-stats">
        <Stat
          icon={<Coins size={14} />}
          label={t(lang, "hud.cash")}
          value={"€" + formatCash(state.cash)}
          cls="neon-green"
          testid="stat-cash"
        />
        <Stat
          icon={<Gem size={14} />}
          label={t(lang, "hud.gems")}
          value={state.gems}
          cls="neon-purple"
          testid="stat-gems"
        />
        <Stat
          icon={<TrendingUp size={14} />}
          label={t(lang, "hud.revenue")}
          value={"+€" + formatCash(derived.revenue) + "/s"}
          cls="neon-green"
          testid="stat-revenue"
        />
        <Stat
          icon={<Flame size={14} />}
          label={t(lang, "hud.burn")}
          value={"-€" + formatCash(derived.burn) + "/s"}
          cls="neon-red"
          testid="stat-burn"
        />
        <Stat
          icon={<Activity size={14} />}
          label={t(lang, "hud.hype")}
          value={Math.round(state.hype) + "%"}
          cls="neon-amber"
          testid="stat-hype"
          extra={
            <div className="sm-bar mt-1">
              <div className={hypeColor} style={{ width: `${state.hype}%` }} />
            </div>
          }
        />
        <Stat
          icon={<Building2 size={14} />}
          label={t(lang, "hud.office")}
          value={derived.office.name[lang]}
          cls="neon-cyan"
          testid="stat-office"
        />
        <Stat
          icon={<Users size={14} />}
          label={t(lang, "hud.devs")}
          value={`${state.staff.length}/${derived.office.capacity}`}
          cls="neon-cyan"
          testid="stat-staff"
        />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, cls, extra, testid }) {
  return (
    <div
      className="sm-panel p-3 flex flex-col gap-1 min-w-0"
      style={{ borderColor: "var(--sm-border)" }}
      data-testid={testid}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)]">
        {icon} {label}
      </div>
      <div className={`text-lg sm-heading ${cls || ""}`}>{value}</div>
      {extra}
    </div>
  );
}
