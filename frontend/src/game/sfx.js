// Lightweight SFX engine using Web Audio API — no assets, no deps.
// All sounds are synthesized procedurally (fast, < 1ms init).

let ctx = null;
let muted = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  // iOS requires resume on gesture
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function blip({ freq = 660, dur = 0.12, type = "square", vol = 0.12, attack = 0.005, release = 0.08, slide = 0 }) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + release);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + release + 0.02);
}

function chord(freqs, opts = {}) {
  freqs.forEach((f, i) => setTimeout(() => blip({ ...opts, freq: f }), i * 60));
}

export const sfx = {
  setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("sm_muted", muted ? "1" : "0"); } catch {}
  },
  isMuted() {
    if (typeof window === "undefined") return false;
    try {
      if (localStorage.getItem("sm_muted") === "1") { muted = true; }
    } catch {}
    return muted;
  },
  click:  () => blip({ freq: 520, dur: 0.05, type: "square", vol: 0.07 }),
  buy:    () => chord([660, 880], { dur: 0.08, type: "triangle", vol: 0.1 }),
  hire:   () => chord([523, 659, 784], { dur: 0.1, type: "triangle", vol: 0.1 }),
  launch: () => blip({ freq: 440, dur: 0.18, type: "sawtooth", vol: 0.08, slide: 300 }),
  release: () => chord([659, 784, 988, 1319], { dur: 0.12, type: "triangle", vol: 0.1 }),
  event_good: () => chord([523, 784], { dur: 0.12, type: "triangle", vol: 0.09 }),
  event_bad:  () => blip({ freq: 180, dur: 0.22, type: "sawtooth", vol: 0.11, slide: -90 }),
  milestone:  () => chord([659, 988, 1319, 1568], { dur: 0.14, type: "triangle", vol: 0.11 }),
  bankrupt:   () => blip({ freq: 120, dur: 0.6, type: "sawtooth", vol: 0.14, slide: -80 }),
  gem:        () => chord([1319, 1760, 2093], { dur: 0.09, type: "sine", vol: 0.1 }),
  error:      () => blip({ freq: 200, dur: 0.1, type: "square", vol: 0.1 }),
};

// init muted state
sfx.isMuted();
