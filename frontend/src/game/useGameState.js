import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OFFICES, STAFF_ROLES, PROJECT_TEMPLATES, MILESTONES, EVENT_TYPES } from "./constants";
import { GEM_ITEMS } from "./gemShop";
import { DIFFICULTIES, getDifficulty, MARKETING_ACTIONS, DECISIONS } from "./difficulty";
import { getSpecialization, specMultiplier } from "./specializations";
import { sfx } from "./sfx";

const SAVE_KEY = "startup_master_save_v3";
const MAX_HISTORY = 60;

function makeInitialState(difficultyId = null, carryOver = null) {
  const diff = getDifficulty(difficultyId || "normal");
  return {
    version: 3,
    lang: carryOver?.lang || "en",
    difficulty: diff.id,
    cash: Math.round(800 * diff.cashStart),
    gems: carryOver?.gems ? Math.floor(carryOver.gems / 2) : 0,
    hype: diff.hypeStart,
    officeTier: 0,
    desks: 0,
    staff: [],
    activeProject: null,
    releasedApps: [],
    milestonesUnlocked: [],
    activeEvents: [],
    bonuses: { productivityBoost: 0, deskDiscount: 0, salaryMult: 1, revenueTax: 0 },
    garageReleases: 0,
    crunchSeconds: 0,
    totalEarned: 0,
    totalTaps: 0,
    nextTaxAt: Date.now() + 90000,
    startedAt: Date.now(),
    tutorialStep: carryOver?.tutorialDone ? 5 : 0,
    bankrupt: false,
    // new v3 fields
    prestigeMult: carryOver?.prestigeMult || 0,
    ipoRounds: carryOver?.ipoRounds || 0,
    marketingCooldowns: {},
    history: [],
    pendingDecision: null,
    nextDecisionAt: Date.now() + 60000,
    achievementQueue: [], // [{ uid, id }] for animated popups
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 3) return null;
    return s;
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {}
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
  const diff = getDifficulty(state.difficulty);
  const deskMaint = state.desks * 0.5;
  return (o.maintenance + deskMaint) * diff.burnMult;
}

export function totalSalary(state) {
  const salMult = state.bonuses.salaryMult || 1;
  const diff = getDifficulty(state.difficulty);
  return state.staff.reduce((sum, s) => {
    const role = STAFF_ROLES.find((r) => r.id === s.roleId);
    return sum + (role?.salary || 0);
  }, 0) * salMult * diff.burnMult;
}

export function productivityPerSec(state) {
  const office = currentOffice(state);
  const speedBonus = 1 + office.bonus.speed / 100;
  const boost = 1 + (state.bonuses.productivityBoost || 0) + (state.prestigeMult || 0);
  let eventMult = 1;
  state.activeEvents.forEach((ev) => {
    if (ev.effect.productivityMult) eventMult *= ev.effect.productivityMult;
  });
  // specialization match: per-staff multiplier based on active project category
  const projectCategory = state.activeProject
    ? (PROJECT_TEMPLATES.find((t) => t.id === state.activeProject.templateId)?.category || null)
    : null;
  const baseP = state.staff.reduce((sum, s) => {
    const role = STAFF_ROLES.find((r) => r.id === s.roleId);
    if (!role) return sum;
    const mult = specMultiplier(s.specialty || "none", projectCategory);
    return sum + role.productivity * mult;
  }, 0);
  return baseP * speedBonus * boost * eventMult;
}

export function revenuePerSec(state) {
  const hypeMult = 0.6 + (state.hype / 100) * 0.8;
  const diff = getDifficulty(state.difficulty);
  const investorTax = 1 - (state.bonuses.revenueTax || 0);
  let eventMult = 1;
  state.activeEvents.forEach((ev) => {
    if (ev.effect.revenueMult) eventMult *= ev.effect.revenueMult;
  });
  return state.releasedApps.reduce((sum, app) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === app.templateId);
    if (!tpl) return sum;
    const obsFactor = Math.max(0.1, 1 - app.age * 0.007);
    const levelMult = 1 + (app.level - 1) * 0.35;
    return sum + tpl.baseRevenue * obsFactor * levelMult * hypeMult * eventMult * diff.revMult * investorTax;
  }, 0);
}

export function burnRatePerSec(state) {
  return totalSalary(state) + maintenanceCost(state);
}

export function valuation(state) {
  const rev = revenuePerSec(state);
  return Math.round(state.cash + rev * 120 + state.releasedApps.length * 5000);
}

function workTarget(state, templateId) {
  const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
  const diff = getDifficulty(state.difficulty);
  return Math.max(1, Math.round(tpl.work * diff.workMult));
}

export function useGameState() {
  const [state, setState] = useState(() => loadSave() || makeInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const [needsDifficulty, setNeedsDifficulty] = useState(() => !loadSave());

  useEffect(() => { persist(state); }, [state]);

  // tick 1s
  useEffect(() => {
    const id = setInterval(() => setState((prev) => tick(prev)), 1000);
    return () => clearInterval(id);
  }, []);

  // hype fluctuation
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

  // random events
  useEffect(() => {
    const check = () => {
      const s = stateRef.current;
      if (s.bankrupt || s.tutorialStep < 5) return;
      const diff = getDifficulty(s.difficulty);
      if (Math.random() < diff.eventChance) triggerRandomEvent();
    };
    let id = setInterval(check, getDifficulty(stateRef.current.difficulty).eventFreqMs);
    return () => clearInterval(id);
  }, [state.difficulty]);

  // random decisions every 60-120s
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.bankrupt || prev.tutorialStep < 5 || prev.pendingDecision) return prev;
        if (Date.now() < prev.nextDecisionAt) return prev;
        const eligible = DECISIONS.filter((d) => !d.condition || d.condition(prev));
        if (eligible.length === 0) return { ...prev, nextDecisionAt: Date.now() + 45000 };
        const totalW = eligible.reduce((a, b) => a + b.weight, 0);
        let r = Math.random() * totalW;
        let chosen = eligible[0];
        for (const d of eligible) {
          r -= d.weight;
          if (r <= 0) { chosen = d; break; }
        }
        return {
          ...prev,
          pendingDecision: chosen.id,
          nextDecisionAt: Date.now() + 90000 + Math.random() * 60000,
        };
      });
    }, 5000);
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

  const hireStaff = useCallback((roleId, specialtyId = "none") => {
    setState((prev) => {
      const role = STAFF_ROLES.find((r) => r.id === roleId);
      if (!role) return prev;
      const spec = getSpecialization(specialtyId);
      const finalCost = Math.round(role.cost * spec.costMult);
      if (prev.cash < finalCost) { sfx.error(); return prev; }
      if (prev.staff.length >= prev.desks) { sfx.error(); return prev; }
      const office = currentOffice(prev);
      if (prev.staff.length >= office.capacity) { sfx.error(); return prev; }
      sfx.hire();
      const newMember = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        roleId,
        specialty: spec.id,
      };
      const next = { ...prev, cash: prev.cash - finalCost, staff: [...prev.staff, newMember] };
      return advanceTutorial(next, 2);
    });
  }, []);

  const fireStaff = useCallback((staffId) => {
    setState((prev) => {
      const idx = prev.staff.findIndex((s) => s.id === staffId);
      if (idx < 0) return prev;
      const member = prev.staff[idx];
      const role = STAFF_ROLES.find((r) => r.id === member.roleId);
      const spec = getSpecialization(member.specialty || "none");
      const severance = Math.round((role?.cost || 0) * spec.costMult * 0.5);
      if (prev.cash < severance) { sfx.error(); return prev; }
      sfx.click();
      return {
        ...prev,
        cash: prev.cash - severance,
        staff: prev.staff.filter((s) => s.id !== staffId),
      };
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
      const wt = workTarget(prev, templateId);
      const next = {
        ...prev,
        cash: prev.cash - tpl.cost,
        activeProject: { templateId, workDone: 0, workTarget: wt },
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
    setNeedsDifficulty(true);
  }, []);

  const chooseDifficulty = useCallback((id) => {
    setState((prev) => {
      const preserved = {
        lang: prev.lang,
        prestigeMult: prev.prestigeMult || 0,
        ipoRounds: prev.ipoRounds || 0,
        gems: prev.gems,
        tutorialDone: (prev.ipoRounds || 0) > 0,
      };
      return makeInitialState(id, preserved);
    });
    setNeedsDifficulty(false);
  }, []);

  const triggerIpo = useCallback(() => {
    setState((prev) => {
      const threshold = 10_000_000;
      const val = valuation(prev);
      if (val < threshold) { sfx.error(); return prev; }
      const pts = Math.floor(Math.sqrt(val / threshold) * 3);
      const newMult = (prev.prestigeMult || 0) + pts * 0.02;
      const carryOver = {
        lang: prev.lang,
        prestigeMult: newMult,
        ipoRounds: (prev.ipoRounds || 0) + 1,
        gems: prev.gems,
        tutorialDone: true,
      };
      sfx.milestone();
      return makeInitialState(prev.difficulty, carryOver);
    });
  }, []);

  const buyMarketing = useCallback((id) => {
    setState((prev) => {
      const m = MARKETING_ACTIONS.find((a) => a.id === id);
      if (!m) return prev;
      const now = Date.now();
      const lastUsed = (prev.marketingCooldowns || {})[id] || 0;
      if (now < lastUsed + m.cooldownMs) { sfx.error(); return prev; }
      if (prev.cash < m.cost) { sfx.error(); return prev; }
      sfx.event_good();
      let hype = prev.hype;
      if (m.effect.hype) hype = Math.min(100, hype + m.effect.hype);
      if (m.effect.hypeSet) hype = m.effect.hypeSet;
      let activeEvents = prev.activeEvents;
      if (m.effect.revenueMult) {
        activeEvents = [
          ...activeEvents,
          {
            id: `mk_${now}_${Math.random().toString(36).slice(2, 6)}`,
            eventType: `mk_${id}`,
            title: m.effect.title || m.name.en.toUpperCase(),
            message: m.effect.message || "",
            positive: true,
            expiresAt: now + (m.effect.durationMs || 30000),
            effect: { revenueMult: m.effect.revenueMult },
          },
        ];
      }
      return {
        ...prev,
        cash: prev.cash - m.cost,
        hype,
        activeEvents,
        marketingCooldowns: { ...(prev.marketingCooldowns || {}), [id]: now },
      };
    });
  }, []);

  const resolveDecision = useCallback((optionIdx) => {
    setState((prev) => {
      if (!prev.pendingDecision) return prev;
      const d = DECISIONS.find((x) => x.id === prev.pendingDecision);
      if (!d) return { ...prev, pendingDecision: null };
      const opt = d.options[optionIdx];
      if (!opt) return prev;
      sfx.click();
      const applied = opt.apply({ ...prev });
      return { ...applied, pendingDecision: null };
    });
  }, []);

  const consumeAchievement = useCallback((uid) => {
    setState((prev) => ({
      ...prev,
      achievementQueue: (prev.achievementQueue || []).filter((a) => a.uid !== uid),
    }));
  }, []);

  const claimStreakReward = useCallback((amount) => {
    setState((prev) => ({ ...prev, gems: prev.gems + amount }));
    try { sfx.streak(); } catch {}
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
    } catch {}

    setState((prev) => {
      let cash = prev.cash;
      let hype = prev.hype;
      const active = [...prev.activeEvents];
      const now = Date.now();
      const id = `ev_${now}_${Math.random().toString(36).slice(2, 6)}`;

      if (eventDef.effect.hype) hype = Math.max(5, Math.min(100, hype + eventDef.effect.hype));
      if (eventDef.effect.cashBonus) cash += eventDef.effect.cashBonus;
      if (eventDef.effect.cashPenalty) cash = Math.max(0, cash * (1 - eventDef.effect.cashPenalty));

      try { eventDef.positive ? sfx.event_good() : sfx.event_bad(); } catch {}

      if (eventDef.duration > 0) {
        active.push({
          id, eventType: eventDef.id, title, message, positive: eventDef.positive,
          expiresAt: now + eventDef.duration * 1000, effect: eventDef.effect,
        });
      } else {
        active.push({
          id, eventType: eventDef.id, title, message, positive: eventDef.positive,
          expiresAt: now + 8000, effect: {},
        });
      }
      return { ...prev, cash, hype, activeEvents: active };
    });
  }, []);

  const tapCode = useCallback(() => {
    setState((prev) => {
      if (prev.bankrupt) return prev;
      sfx.click();
      const totalTaps = (prev.totalTaps || 0) + 1;
      let tutorialStep = prev.tutorialStep;
      if (tutorialStep === 0 && totalTaps >= 5) tutorialStep = 1;

      if (prev.activeProject) {
        const newWork = prev.activeProject.workDone + 1;
        if (newWork >= prev.activeProject.workTarget) {
          const newApp = {
            id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            templateId: prev.activeProject.templateId,
            age: 0, level: 1,
          };
          sfx.release();
          const garageReleases = prev.garageReleases + (prev.officeTier === 0 ? 1 : 0);
          let nextTut = tutorialStep;
          if (tutorialStep === 3 || tutorialStep === 4) nextTut = 5;
          return {
            ...prev, totalTaps, tutorialStep: nextTut,
            activeProject: null,
            releasedApps: [...prev.releasedApps, newApp],
            garageReleases,
          };
        }
        return {
          ...prev, totalTaps, tutorialStep,
          activeProject: { ...prev.activeProject, workDone: newWork },
        };
      }
      const cashGain = totalTaps % 4 === 0 ? 1 : 0;
      return { ...prev, totalTaps, tutorialStep, cash: prev.cash + cashGain };
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
              title: item.event.title, message: item.event.message,
              positive: item.event.positive,
              expiresAt: now + item.event.durationMs, effect: item.event.effect,
            },
          ],
        };
      }
      return next;
    });
  }, []);

  return {
    state, needsDifficulty, chooseDifficulty,
    setLang, buyDesk, hireStaff, fireStaff, launchProject, upgradeOffice, releaseUpdate,
    dismissEvent, nextTutorialStep, skipTutorial, resetGame, triggerRandomEvent,
    purchaseGem, tapCode, buyMarketing, triggerIpo, resolveDecision,
    consumeAchievement, claimStreakReward,
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
        difficulty: getDifficulty(state.difficulty),
      }),
      [state]
    ),
  };
}

function advanceTutorial(state, justDid) {
  if (state.tutorialStep === justDid) {
    return { ...state, tutorialStep: state.tutorialStep + 1 };
  }
  return state;
}

function tick(prev) {
  if (prev.bankrupt) return prev;
  const now = Date.now();

  const activeEvents = prev.activeEvents.filter((e) => e.expiresAt > now);

  const rev = revenuePerSec({ ...prev, activeEvents });
  const burn = burnRatePerSec(prev);
  let cash = prev.cash + rev - burn;
  const totalEarned = prev.totalEarned + Math.max(0, rev);

  const diff = getDifficulty(prev.difficulty);
  let nextTaxAt = prev.nextTaxAt || (now + 90000);
  let taxedThisTick = false;
  if (prev.tutorialStep >= 5 && now >= nextTaxAt) {
    cash = cash * (1 - diff.taxPct);
    nextTaxAt = now + 90000;
    taxedThisTick = true;
  }

  let bankrupt = false;
  if (cash < 0) {
    cash = 0;
    bankrupt = true;
    try { sfx.bankrupt(); } catch {}
  }

  let activeProject = prev.activeProject;
  let releasedApps = [...prev.releasedApps];
  let garageReleases = prev.garageReleases;
  let justReleased = false;

  if (activeProject) {
    const nextWork = activeProject.workDone + productivityPerSec({ ...prev, activeEvents });
    if (nextWork >= activeProject.workTarget) {
      releasedApps.push({
        id: `app_${now}_${Math.random().toString(36).slice(2, 6)}`,
        templateId: activeProject.templateId, age: 0, level: 1,
      });
      if (prev.officeTier === 0) garageReleases += 1;
      activeProject = null;
      justReleased = true;
    } else {
      activeProject = { ...activeProject, workDone: nextWork };
    }
  }
  if (justReleased) { try { sfx.release(); } catch {} }

  releasedApps = releasedApps.map((a) => ({ ...a, age: a.age + 1 }));

  const crunchSeconds =
    prev.staff.length > 0 && prev.desks >= prev.staff.length
      ? prev.crunchSeconds + 1
      : prev.crunchSeconds;

  let tutorialStep = prev.tutorialStep;
  if (tutorialStep === 3 && activeProject === null && releasedApps.length > prev.releasedApps.length) {
    tutorialStep = 4;
  }
  if (tutorialStep === 4 && releasedApps.length >= 1) {
    tutorialStep = 5;
  }

  let finalActive = activeEvents;
  if (taxedThisTick) {
    finalActive = [
      ...activeEvents,
      {
        id: `tax_${now}`, eventType: "tax_audit",
        title: prev.lang === "it" ? "TASSE TRIMESTRALI" : "QUARTERLY TAXES",
        message: prev.lang === "it"
          ? `Il fisco ha prelevato il ${Math.round(diff.taxPct * 100)}% della cassa.`
          : `The taxman grabbed ${Math.round(diff.taxPct * 100)}% of your cash.`,
        positive: false,
        expiresAt: now + 6000,
        effect: {},
      },
    ];
    try { sfx.event_bad(); } catch {}
  }

  const milestonesUnlocked = [...prev.milestonesUnlocked];
  const bonuses = { ...prev.bonuses };
  let gems = prev.gems;
  const achievementQueue = [...(prev.achievementQueue || [])];
  const snapshot = {
    ...prev, cash, activeEvents: finalActive, releasedApps,
    garageReleases, crunchSeconds, totalEarned,
    valuation: valuation({ ...prev, cash, releasedApps, activeEvents: finalActive }),
  };
  MILESTONES.forEach((m) => {
    if (!milestonesUnlocked.includes(m.id) && m.check(snapshot)) {
      milestonesUnlocked.push(m.id);
      if (m.reward.gems) gems += m.reward.gems;
      if (m.reward.discount) bonuses.deskDiscount = Math.max(bonuses.deskDiscount || 0, m.reward.discount);
      if (m.reward.productivity) bonuses.productivityBoost = (bonuses.productivityBoost || 0) + m.reward.productivity;
      achievementQueue.push({
        uid: `ach_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        id: m.id,
      });
      try { sfx.milestone(); } catch {}
    }
  });

  // append history point (downsampled every tick)
  const history = [...(prev.history || []), { t: now, rev, burn, cash }].slice(-MAX_HISTORY);

  return {
    ...prev,
    cash, totalEarned,
    activeEvents: finalActive,
    activeProject, releasedApps, garageReleases, crunchSeconds,
    milestonesUnlocked, gems, bonuses,
    tutorialStep, bankrupt, nextTaxAt, history,
    achievementQueue,
  };
}
