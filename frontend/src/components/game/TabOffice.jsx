import React from "react";
import { t } from "../../game/i18n";

export default function TabOffice({ state, derived, lang, buyDesk, tutorialStep }) {
  const cost = derived.deskCost;
  const office = derived.office;
  const atCap = state.desks >= office.capacity;
  const disabled = state.cash < cost || atCap;
  const highlight = tutorialStep === 1 ? "tut-highlight" : "";

  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="tab-office">
      <div className="sm-panel p-5 md:col-span-1">
        <div className="sm-heading text-lg mb-2">{t(lang, "office.title")}</div>
        <div className="text-sm text-[color:var(--sm-text-dim)] mb-4">
          {t(lang, "office.capacity")}: <span className="neon-cyan">{state.desks}/{office.capacity}</span>
        </div>
        <button
          className={`sm-btn sm-btn-primary w-full ${highlight}`}
          onClick={buyDesk}
          disabled={disabled}
          data-testid="buy-desk-btn"
        >
          {t(lang, "office.buy_desk")} · €{cost}
        </button>
        {atCap && (
          <div className="text-xs neon-red mt-2" data-testid="office-full-msg">
            {t(lang, "staff.too_many")}
          </div>
        )}
      </div>

      <div className="sm-panel p-5 md:col-span-2">
        <div className="sm-heading text-lg mb-2">
          {office.name[lang]} <span className="text-xs text-[color:var(--sm-text-dim)]">TIER {office.tier}</span>
        </div>
        <div className="text-sm text-[color:var(--sm-text-dim)] mb-3">{office.tagline[lang]}</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label={t(lang, "hud.office")} value={`${state.desks}/${office.capacity} ${t(lang, "office.desks")}`} />
          <Stat label="Speed" value={`+${office.bonus.speed}%`} color="neon-green" />
          <Stat label="Creativity" value={`+${office.bonus.creativity}%`} color="neon-cyan" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "" }) {
  return (
    <div className="sm-panel p-3">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)]">{label}</div>
      <div className={`sm-heading text-base ${color}`}>{value}</div>
    </div>
  );
}
