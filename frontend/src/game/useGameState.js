import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OFFICES, STAFF_ROLES, PROJECT_TEMPLATES, MILESTONES, EVENT_TYPES } from "./constants";
import { GEM_ITEMS } from "./gemShop";
import { sfx } from "./sfx";

const SAVE_KEY = "startup_master_save_v1";

function makeInitialState() {
  return {
    version: 2,
    lang: "en",
    cash: 800,
    gems: 0,
    hype: 35, // 0..100 — start low for harder pacing
    officeTier: 0,
    desks: 0,
    staff: [],
    activeProject: null,
    releasedApps: [],
    milestonesUnlocked: [],
    activeEvents: [],
    bonuses: { productivityBoost: 0, deskDiscount: 0 },
    garageReleases: 0,
    crunchSeconds: 0,
    totalEarned: 0,
    totalTaps: 0,
    nextTaxAt: Date.now() + 90000, // first tax 90s in
    startedAt: Date.now(),
    tutorialStep: 0,
    bankrupt: false,
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 2) return null;
    return s;
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function costForDesk(state) {
  const base = 120 * Math.pow(1.35, state.desks);
  const disc = 1 - (state.bonuses.deskDiscount || 0);
  return Math.round(base * disc);
}

export function currentOffice(state) {
  return OFFICES[state.officeTier];
}

export function maintenanceCost(state) {
  const o = currentOffice(state);
  const deskMaint = state.desks * 0.5;
  return o.maintenance + deskMaint;
}

export function totalSalary(state) {
  return state.staff.reduce((sum, s) => {
    const role = STAFF_ROLES.find((r) => r.id === s.roleId);
    return sum + (role?.salary || 0);
  }, 0);
}

export function productivityPerSec(state) {
  const office = currentOffice(state);
  const speedBonus = 1 + office.bonus.speed / 100;
  const boost = 1 + (state.bonuses.productivityBoost || 0);
  let eventMult = 1;
  state.activeEvents.forEach((ev) => {
    if (ev.effect.productivityMult) eventMult *= ev.effect.productivityMult;
  });
  const baseP = state.staff.reduce((sum, s) => {
    const role = STAFF_ROLES.find((r) => r.id === s.roleId);
    return sum + (role?.productivity || 0);
  }, 0);
  return baseP * speedBonus * boost * eventMult;
}

export function revenuePerSec(state) {
  const hypeMult = 0.6 + (state.hype / 100) * 0.8; // 0.6..1.4
  let eventMult = 1;
  state.activeEvents.forEach((ev) => {
    if (ev.effect.revenueMult) eventMult *= ev.effect.revenueMult;
  });
  return state.releasedApps.reduce((sum, app) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === app.templateId);
    if (!tpl) return sum;
    // obsolescence: lose 0.7% per second, floor 10%
    const obsFactor = Math.max(0.1, 1 - app.age * 0.007);
    const levelMult = 1 + (app.level - 1) * 0.35;
    return sum + tpl.baseRevenue * obsFactor * levelMult * hypeMult * eventMult;
  }, 0);
}

export function burnRatePerSec(state) {
  return totalSalary(state) + maintenanceCost(state);
}

export function valuation(state) {
  const rev = revenuePerSec(state);
  return Math.round(state.cash + rev * 120 + state.releasedApps.length * 5000);
}

export function useGameState() {
  const [state, setState] = useState(() => loadSave() || makeInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;

  // persist on every change (debounced via RAF would be nicer, but ok)
  useEffect(() => {
    persist(state);
  }, [state]);

  // Main tick: 1s
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => tick(prev));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Hype fluctuation: every 3s wobble, small
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.bankrupt) return prev;
        const delta = (Math.random() - 0.5) * 6;
        return { ...prev, hype: Math.max(5, Math.min(100, prev.hype + delta)) };
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Random events: every 25s random chance
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.bankrupt || s.tutorialStep < 5) return;
      if (Math.random() < 0.65) {
        triggerRandomEvent();
      }
    }, 25000);
    return () => clearInterval(id);
  }, []);

  const buyDesk = useCallback(() => {
    setState((prev) => {
      const cost = costForDesk(prev);
      const office = currentOffice(prev);
      if (prev.cash < cost) { sfx.error(); return prev; }
      if (prev.desks >= office.capacity) { sfx.error(); return prev; }
      sfx.buy();
      const next = { ...prev, cash: prev.cash - cost, desks: prev.desks + 1 };
      return advanceTutorial(next, 1);
    });
  }, []);

  const hireStaff = useCallback((roleId) => {
    setState((prev) => {
      const role = STAFF_ROLES.find((r) => r.id === roleId);
      if (!role) return prev;
      if (prev.cash < role.cost) { sfx.error(); return prev; }
      if (prev.staff.length >= prev.desks) { sfx.error(); return prev; }
      const office = currentOffice(prev);
      if (prev.staff.length >= office.capacity) { sfx.error(); return prev; }
      sfx.hire();
      const newMember = { id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, roleId };
      const next = { ...prev, cash: prev.cash - role.cost, staff: [...prev.staff, newMember] };
      return advanceTutorial(next, 2);
    });
  }, []);

  const launchProject = useCallback((templateId) => {
    setState((prev) => {
      if (prev.activeProject) { sfx.error(); return prev; }
      const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return prev;
      if (prev.cash < tpl.cost) { sfx.error(); return prev; }
      if (prev.officeTier < tpl.minOffice) { sfx.error(); return prev; }
      sfx.launch();
      const next = {
        ...prev,
        cash: prev.cash - tpl.cost,
        activeProject: { templateId, workDone: 0, workTarget: tpl.work },
      };
      return advanceTutorial(next, 3);
    });
  }, []);

  const upgradeOffice = useCallback((tier) => {
    setState((prev) => {
      if (tier <= prev.officeTier) return prev;
      const office = OFFICES[tier];
      if (!office) return prev;
      if (prev.cash < office.cost) { sfx.error(); return prev; }
      sfx.release();
      return { ...prev, cash: prev.cash - office.cost, officeTier: tier };
    });
  }, []);

  const releaseUpdate = useCallback((appId) => {
    setState((prev) => {
      const app = prev.releasedApps.find((a) => a.id === appId);
      if (!app) return prev;
      const tpl = PROJECT_TEMPLATES.find((t) => t.id === app.templateId);
      if (!tpl) return prev;
      const updateCost = Math.round(tpl.cost * 0.4 * Math.pow(1.6, app.level - 1)) + 50;
      if (prev.cash < updateCost) { sfx.error(); return prev; }
      sfx.release();
      return {
        ...prev,
        cash: prev.cash - updateCost,
        releasedApps: prev.releasedApps.map((a) =>
          a.id === appId ? { ...a, age: 0, level: a.level + 1 } : a
        ),
      };
    });
  }, []);

  const purchaseGem = useCallback((itemId) => {
    setState((prev) => {
      const item = GEM_ITEMS.find((i) => i.id === itemId);
      if (!item) return prev;
      if (prev.gems < item.cost) { sfx.error(); return prev; }
      if (item.onlyWhen && !item.onlyWhen(prev)) { sfx.error(); return prev; }
      sfx.gem();
      let next = { ...prev, gems: prev.gems - item.cost };
      if (item.apply) next = item.apply(next);
      if (item.type === "event" && item.event) {
        const now = Date.now();
        next = {
          ...next,
          activeEvents: [
            ...next.activeEvents,
            {
              id: `gem_${now}_${Math.random().toString(36).slice(2, 6)}`,
              eventType: item.event.eventType,
              title: item.event.title,
              message: item.event.message,
              positive: item.event.positive,
              expiresAt: now + item.event.durationMs,
              effect: item.event.effect,
            },
          ],
        };
      }
      return next;
    });
  }, []);

  // tap-to-code: contribute work points to active project, or earn a tiny cash trickle when idle
  const tapCode = useCallback(() => {
    setState((prev) => {
      if (prev.bankrupt) return prev;
      sfx.click();
      const totalTaps = (prev.totalTaps || 0) + 1;
      // tutorial: first tap unlocks step 1
      let tutorialStep = prev.tutorialStep;
      if (tutorialStep === 0 && totalTaps >= 5) tutorialStep = 1;

      if (prev.activeProject) {
        const newWork = prev.activeProject.workDone + 1;
        if (newWork >= prev.activeProject.workTarget) {
          // complete project right now
          const newApp = {
            id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            templateId: prev.activeProject.templateId,
            age: 0,
            level: 1,
          };
          sfx.release();
          let garageReleases = prev.garageReleases + (prev.officeTier === 0 ? 1 : 0);
          let nextTutStep = tutorialStep;
          if (tutorialStep === 3) nextTutStep = 5;
          else if (tutorialStep === 4) nextTutStep = 5;
          return {
            ...prev,
            totalTaps,
            tutorialStep: nextTutStep,
            activeProject: null,
            releasedApps: [...prev.releasedApps, newApp],
            garageReleases,
          };
        }
        return {
          ...prev,
          totalTaps,
          tutorialStep,
          activeProject: { ...prev.activeProject, workDone: newWork },
        };
      }
      // idle tap: small cash drip (max 1€ per 4 taps)
      const cashGain = totalTaps % 4 === 0 ? 1 : 0;
      return { ...prev, totalTaps, tutorialStep, cash: prev.cash + cashGain };
    });
  }, []);

  const dismissEvent = useCallback((eventId) => {
    setState((prev) => ({
      ...prev,
      activeEvents: prev.activeEvents.filter((e) => e.id !== eventId),
    }));
  }, []);

  const setLang = useCallback((lang) => {
    setState((prev) => ({ ...prev, lang }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialStep: Math.min(5, prev.tutorialStep + 1) }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialStep: 5 }));
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setState(makeInitialState());
  }, []);

  const triggerRandomEvent = useCallback(async () => {
    const eventDef = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const lang = stateRef.current.lang;
    let title = eventDef.id.replace(/_/g, " ").toUpperCase();
    let message = "";

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/api/events/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: eventDef.id, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        message = data.message || "";
      }
    } catch {
      // ignore and keep static fallback handled backend-side
    }

    setState((prev) => {
      let cash = prev.cash;
      let hype = prev.hype;
      const active = [...prev.activeEvents];
      const now = Date.now();
      const id = `ev_${now}_${Math.random().toString(36).slice(2, 6)}`;

      if (eventDef.effect.hype) hype = Math.max(5, Math.min(100, hype + eventDef.effect.hype));
      if (eventDef.effect.cashBonus) cash += eventDef.effect.cashBonus;
      if (eventDef.effect.cashPenalty) cash = Math.max(0, cash * (1 - eventDef.effect.cashPenalty));

      if (eventDef.duration > 0) {
        active.push({
          id,
          eventType: eventDef.id,
          title,
          message,
          positive: eventDef.positive,
          expiresAt: now + eventDef.duration * 1000,
          effect: eventDef.effect,
        });
      } else {
        // instant one-shot: still surface to UI briefly
        active.push({
          id,
          eventType: eventDef.id,
          title,
          message,
          positive: eventDef.positive,
          expiresAt: now + 8000,
          effect: {},
        });
      }
      return { ...prev, cash, hype, activeEvents: active };
    });
  }, []);

  return {
    state,
    setLang,
    buyDesk,
    hireStaff,
    launchProject,
    upgradeOffice,
    releaseUpdate,
    dismissEvent,
    nextTutorialStep,
    skipTutorial,
    resetGame,
    triggerRandomEvent,
    purchaseGem,
    tapCode,
    derived: useMemo(
      () => ({
        deskCost: costForDesk(state),
        office: currentOffice(state),
        salary: totalSalary(state),
        maintenance: maintenanceCost(state),
        burn: burnRatePerSec(state),
        revenue: revenuePerSec(state),
        productivity: productivityPerSec(state),
        valuation: valuation(state),
      }),
      [state]
    ),
  };
}

function advanceTutorial(state, justDid) {
  // steps: 1 desk, 2 hire, 3 launch, 4 collect (auto when releasedApps>=1)
  if (state.tutorialStep === justDid) {
    return { ...state, tutorialStep: state.tutorialStep + 1 };
  }
  return state;
}

function tick(prev) {
  if (prev.bankrupt) return prev;
  const now = Date.now();

  // expire events
  const activeEvents = prev.activeEvents.filter((e) => e.expiresAt > now);

  // economy
  const rev = revenuePerSec({ ...prev, activeEvents });
  const burn = burnRatePerSec(prev);
  let cash = prev.cash + rev - burn;
  const totalEarned = prev.totalEarned + Math.max(0, rev);

  // periodic tax: 8% of cash every 90s, but only after tutorial finished
  let nextTaxAt = prev.nextTaxAt || (now + 90000);
  let taxedThisTick = false;
  if (prev.tutorialStep >= 5 && now >= nextTaxAt) {
    cash = cash * 0.92;
    nextTaxAt = now + 90000;
    taxedThisTick = true;
  }

  let bankrupt = false;
  if (cash < 0) {
    cash = 0;
    bankrupt = true;
    try { sfx.bankrupt(); } catch {}
  }

  // project progress
  let activeProject = prev.activeProject;
  let releasedApps = [...prev.releasedApps];
  let garageReleases = prev.garageReleases;
  let justReleased = false;

  if (activeProject) {
    const nextWork = activeProject.workDone + productivityPerSec({ ...prev, activeEvents });
    if (nextWork >= activeProject.workTarget) {
      releasedApps.push({
        id: `app_${now}_${Math.random().toString(36).slice(2, 6)}`,
        templateId: activeProject.templateId,
        age: 0,
        level: 1,
      });
      if (prev.officeTier === 0) garageReleases += 1;
      activeProject = null;
      justReleased = true;
    } else {
      activeProject = { ...activeProject, workDone: nextWork };
    }
  }
  if (justReleased) { try { sfx.release(); } catch {} }

  // age apps
  releasedApps = releasedApps.map((a) => ({ ...a, age: a.age + 1 }));

  // crunch seconds (staff all working)
  const crunchSeconds =
    prev.staff.length > 0 && prev.desks >= prev.staff.length
      ? prev.crunchSeconds + 1
      : prev.crunchSeconds;

  // tutorial auto-advance for launch→collect flow (steps 3 → 4 → 5)
  let tutorialStep = prev.tutorialStep;
  if (tutorialStep === 3 && activeProject === null && releasedApps.length > prev.releasedApps.length) {
    tutorialStep = 4;
  }
  if (tutorialStep === 4 && releasedApps.length >= 1) {
    tutorialStep = 5;
  }

  // inject tax notification (one-shot popup)
  let finalActive = activeEvents;
  if (taxedThisTick) {
    finalActive = [
      ...activeEvents,
      {
        id: `tax_${now}`,
        eventType: "tax_audit",
        title: prev.lang === "it" ? "TASSE TRIMESTRALI" : "QUARTERLY TAXES",
        message: prev.lang === "it" ? "Il fisco ha prelevato l'8% della tua cassa." : "The taxman grabbed 8% of your cash.",
        positive: false,
        expiresAt: now + 6000,
        effect: {},
      },
    ];
    try { sfx.event_bad(); } catch {}
  }

  // milestones check
  const milestonesUnlocked = [...prev.milestonesUnlocked];
  const bonuses = { ...prev.bonuses };
  let gems = prev.gems;
  const snapshot = {
    ...prev,
    cash,
    activeEvents: finalActive,
    releasedApps,
    garageReleases,
    crunchSeconds,
    totalEarned,
    valuation: valuation({ ...prev, cash, releasedApps, activeEvents: finalActive }),
  };
  MILESTONES.forEach((m) => {
    if (!milestonesUnlocked.includes(m.id) && m.check(snapshot)) {
      milestonesUnlocked.push(m.id);
      if (m.reward.gems) gems += m.reward.gems;
      if (m.reward.discount) bonuses.deskDiscount = Math.max(bonuses.deskDiscount || 0, m.reward.discount);
      if (m.reward.productivity) bonuses.productivityBoost = (bonuses.productivityBoost || 0) + m.reward.productivity;
      try { sfx.milestone(); } catch {}
    }
  });

  return {
    ...prev,
    cash,
    totalEarned,
    activeEvents: finalActive,
    activeProject,
    releasedApps,
    garageReleases,
    crunchSeconds,
    milestonesUnlocked,
    gems,
    bonuses,
    tutorialStep,
    bankrupt,
    nextTaxAt,
  };
}
