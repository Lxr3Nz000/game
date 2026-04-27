// Daily streak system — claim once per UTC day. Persisted in localStorage outside game save.
const STREAK_KEY = "sm_streak";

const REWARD_TABLE = [0, 5, 8, 12, 18, 25, 35, 50, 70, 100]; // index = streak day, capped at last entry

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function load() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(obj) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(obj)); } catch {}
}

// Returns { streak, reward, alreadyClaimedToday } based on the stored data + current date.
// Does NOT mutate storage; call markClaimed() to commit after granting the reward.
export function evaluateStreak() {
  const today = todayKey();
  const data = load();
  if (!data) {
    // first ever visit — pending day 1
    return { streak: 1, reward: REWARD_TABLE[1], alreadyClaimedToday: false, isNew: true };
  }
  if (data.lastClaim === today) {
    return { streak: data.streak, reward: rewardFor(data.streak), alreadyClaimedToday: true, isNew: false };
  }
  // compute days gap
  const last = new Date(data.lastClaim + "T00:00:00Z").getTime();
  const cur = new Date(today + "T00:00:00Z").getTime();
  const diffDays = Math.round((cur - last) / 86400000);
  let nextStreak;
  if (diffDays === 1) nextStreak = data.streak + 1;
  else if (diffDays > 1) nextStreak = 1; // broke
  else nextStreak = data.streak; // shouldn't happen
  return { streak: nextStreak, reward: rewardFor(nextStreak), alreadyClaimedToday: false, isNew: false };
}

export function markClaimed(streak) {
  save({ lastClaim: todayKey(), streak });
}

export function rewardFor(streak) {
  const idx = Math.min(streak, REWARD_TABLE.length - 1);
  return REWARD_TABLE[idx];
}

export function getStreakSnapshot() {
  return load() || { lastClaim: null, streak: 0 };
}
