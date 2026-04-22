import React from "react";
import { t } from "../../game/i18n";
import { STAFF_ROLES } from "../../game/constants";

export default function TabStaff({ state, derived, lang, hireStaff, tutorialStep }) {
  const office = derived.office;
  const freeDesks = state.desks - state.staff.length;

  return (
    <div className="space-y-4" data-testid="tab-staff">
      <div className="grid md:grid-cols-3 gap-4">
        {STAFF_ROLES.map((role, i) => {
          const canAfford = state.cash >= role.cost;
          const canSeat = freeDesks > 0 && state.staff.length < office.capacity;
          const disabled = !canAfford || !canSeat;
          const isJunior = role.id === "junior";
          const highlight = tutorialStep === 2 && isJunior ? "tut-highlight" : "";
          return (
            <div key={role.id} className="sm-panel p-5 flex flex-col gap-3" data-testid={`role-${role.id}`}>
              <div className="flex items-center gap-2">
                <div className={`iso-dev ${role.color}`} style={{ position: "relative", top: 0, left: 0 }} />
                <div className="sm-heading text-base ml-2">{role.name[lang]}</div>
              </div>
              <div className="text-sm text-[color:var(--sm-text-dim)]">
                {t(lang, "staff.salary")}: <span className="neon-red">€{role.salary}/s</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>{t(lang, "staff.productivity")}: <span className="neon-green">{role.productivity}</span></div>
                <div>{t(lang, "staff.creativity")}: <span className="neon-cyan">{role.creativity}</span></div>
              </div>
              <button
                className={`sm-btn ${isJunior ? "sm-btn-primary" : ""} ${highlight}`}
                onClick={() => hireStaff(role.id)}
                disabled={disabled}
                data-testid={`hire-${role.id}-btn`}
              >
                {t(lang, "staff.hire")} · €{role.cost}
              </button>
              {!canSeat && freeDesks <= 0 && (
                <div className="text-xs neon-amber" data-testid={`role-${role.id}-nodesks`}>
                  {t(lang, "staff.no_desk")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sm-panel p-4">
        <div className="sm-heading text-sm mb-3 uppercase tracking-widest text-[color:var(--sm-text-dim)]">
          {t(lang, "staff.your_team")} ({state.staff.length})
        </div>
        {state.staff.length === 0 ? (
          <div className="text-sm text-[color:var(--sm-text-dim)] italic" data-testid="no-staff-msg">
            &gt; {t(lang, "staff.no_team")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {state.staff.map((s, i) => {
              const role = STAFF_ROLES.find((r) => r.id === s.roleId);
              return (
                <div
                  key={s.id}
                  className="sm-hud-chip"
                  data-testid={`staff-chip-${i}`}
                  style={{ borderColor: "var(--sm-border-strong)" }}
                >
                  <div className={`iso-dev ${role?.color || ""}`} style={{ position: "relative", top: 0, left: 0, width: 14, height: 18 }} />
                  <span className="ml-2">{role?.name[lang]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
