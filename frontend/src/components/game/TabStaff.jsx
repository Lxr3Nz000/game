import React, { useState } from "react";
import { t } from "../../game/i18n";
import { STAFF_ROLES } from "../../game/constants";
import { SPECIALIZATIONS, getSpecialization } from "../../game/specializations";
import { X } from "lucide-react";

export default function TabStaff({ state, derived, lang, hireStaff, fireStaff, tutorialStep }) {
  const office = derived.office;
  const freeDesks = state.desks - state.staff.length;
  const [chosenSpec, setChosenSpec] = useState({}); // { roleId: specialtyId }

  return (
    <div className="space-y-3 md:space-y-4" data-testid="tab-staff">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {STAFF_ROLES.map((role) => {
          const selectedSpec = chosenSpec[role.id] || "none";
          const spec = getSpecialization(selectedSpec);
          const finalCost = Math.round(role.cost * spec.costMult);
          const canAfford = state.cash >= finalCost;
          const canSeat = freeDesks > 0 && state.staff.length < office.capacity;
          const disabled = !canAfford || !canSeat;
          const isJunior = role.id === "junior";
          const highlight = tutorialStep === 2 && isJunior ? "tut-highlight" : "";
          return (
            <div key={role.id} className="sm-panel p-4 md:p-5 flex flex-col gap-3" data-testid={`role-${role.id}`}>
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

              {/* Specialty selector */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--sm-text-dim)] mb-1">
                  {t(lang, "specialty.label")}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {SPECIALIZATIONS.map((sp) => {
                    const active = selectedSpec === sp.id;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => setChosenSpec((s) => ({ ...s, [role.id]: sp.id }))}
                        className="sm-spec-btn"
                        style={{
                          borderColor: active ? sp.glow : "var(--sm-border)",
                          color: active ? sp.glow : "var(--sm-text-dim)",
                          background: active ? "rgba(255,255,255,0.04)" : "transparent",
                        }}
                        data-testid={`spec-${role.id}-${sp.id}`}
                        title={sp.name[lang]}
                      >
                        <span style={{ fontSize: 14 }}>{sp.icon}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedSpec !== "none" && (
                  <div className="text-[10px] mt-1" style={{ color: spec.glow }}>
                    {spec.name[lang]} · +{Math.round((spec.bonusMult - 1) * 100)}% {spec.matchCategories.join("/")}
                  </div>
                )}
              </div>

              <button
                className={`sm-btn ${isJunior ? "sm-btn-primary" : ""} ${highlight}`}
                onClick={() => hireStaff(role.id, selectedSpec)}
                disabled={disabled}
                data-testid={`hire-${role.id}-btn`}
              >
                {t(lang, "staff.hire")} · €{finalCost}
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
              const sp = getSpecialization(s.specialty);
              const baseCost = (role?.cost || 0) * sp.costMult;
              const severance = Math.round(baseCost * 0.5);
              return (
                <div
                  key={s.id}
                  className="sm-hud-chip"
                  data-testid={`staff-chip-${i}`}
                  style={{
                    borderColor: sp.id === "none" ? "var(--sm-border-strong)" : sp.glow,
                    paddingRight: 6,
                  }}
                >
                  <div className={`iso-dev ${role?.color || ""}`} style={{ position: "relative", top: 0, left: 0, width: 14, height: 18 }} />
                  <span className="ml-2">
                    {role?.name[lang]}
                    {sp.id !== "none" && (
                      <span style={{ color: sp.glow }} className="ml-1.5 text-[10px]">
                        {sp.icon} {sp.name[lang]}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm(t(lang, "staff.fire_confirm", { cost: severance }))) {
                        fireStaff(s.id);
                      }
                    }}
                    data-testid={`fire-staff-btn-${i}`}
                    className="ml-2 text-[color:var(--sm-neon-red)] hover:text-white"
                    style={{ padding: 2, display: "inline-flex", alignItems: "center", borderRadius: 4 }}
                    title={`${t(lang, "staff.fire")} (€${severance})`}
                  >
                    <X size={12} />
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
