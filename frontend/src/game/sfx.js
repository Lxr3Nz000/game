// Richer SFX — Web Audio API only, no external assets. Layered oscillators with
// envelopes, detune chorus, and noise textures. Calls are non-blocking.

let ctx = null;
let muted = false;
let masterGain = null;
let convolverReverb = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.85;
        masterGain.connect(ctx.destination);
        // simple reverb impulse (procedural)
        try {
          const rate = ctx.sampleRate;
          const len = Math.floor(rate * 0.6);
          const buf = ctx.createBuffer(2, len, rate);
          for (let ch = 0; ch < 2; ch++) {
            const data = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
            }
          }
          convolverReverb = ctx.createConvolver();
          convolverReverb.buffer = buf;
          const wet = ctx.createGain();
          wet.gain.value = 0.18;
          convolverReverb.connect(wet).connect(masterGain);
        } catch {
          convolverReverb = null;
        }
      }
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function dest() {
  return masterGain || (getCtx() && masterGain);
}

function tone({
  freq = 660, dur = 0.12, type = "square", vol = 0.12,
  attack = 0.005, release = 0.08, slide = 0, detune = 0, reverb = false,
  delay = 0,
}) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (detune) osc.detune.setValueAtTime(detune, now);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + release);
  osc.connect(gain);
  gain.connect(dest());
  if (reverb && convolverReverb) gain.connect(convolverReverb);
  osc.start(now);
  osc.stop(now + dur + release + 0.02);
}

function fatTone(opts) {
  // 3 detuned voices for a thicker pad
  tone({ ...opts, detune: -8 });
  tone({ ...opts, detune: 0 });
  tone({ ...opts, detune: 8 });
}

function noise({ dur = 0.2, vol = 0.08, freqStart = 4000, freqEnd = 200, q = 4, delay = 0 }) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freqStart, now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(100, freqEnd), now + dur);
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(dest());
  src.start(now);
  src.stop(now + dur + 0.05);
}

function arpeggio(notes, opts = {}) {
  const step = opts.step || 0.06;
  notes.forEach((n, i) => tone({ ...opts, freq: n, delay: i * step }));
}

export const sfx = {
  setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("sm_muted", muted ? "1" : "0"); } catch {}
  },
  isMuted() {
    if (typeof window === "undefined") return false;
    try {
      if (localStorage.getItem("sm_muted") === "1") muted = true;
    } catch {}
    return muted;
  },

  click: () => {
    tone({ freq: 720 + Math.random() * 80, dur: 0.04, type: "triangle", vol: 0.06, attack: 0.002, release: 0.04 });
  },

  buy: () => {
    tone({ freq: 523, dur: 0.05, type: "triangle", vol: 0.1 });
    tone({ freq: 784, dur: 0.06, type: "triangle", vol: 0.08, delay: 0.04 });
    noise({ dur: 0.1, vol: 0.04, freqStart: 6000, freqEnd: 800, delay: 0.03 });
  },

  hire: () => {
    arpeggio([523, 659, 784, 1047], { dur: 0.08, type: "triangle", vol: 0.09, step: 0.05 });
  },

  launch: () => {
    fatTone({ freq: 220, dur: 0.18, type: "sawtooth", vol: 0.04, slide: 600 });
    noise({ dur: 0.25, vol: 0.06, freqStart: 200, freqEnd: 4000, delay: 0.05 });
    tone({ freq: 880, dur: 0.18, type: "triangle", vol: 0.07, delay: 0.18, reverb: true });
  },

  release: () => {
    arpeggio([659, 784, 988, 1319, 1568, 1976], { dur: 0.1, type: "triangle", vol: 0.09, step: 0.06, reverb: true });
    tone({ freq: 3000, dur: 0.05, type: "sine", vol: 0.07, delay: 0.4, reverb: true });
  },

  event_good: () => {
    arpeggio([523, 659, 784], { dur: 0.12, type: "triangle", vol: 0.08, step: 0.08, reverb: true });
  },

  event_bad: () => {
    fatTone({ freq: 220, dur: 0.28, type: "sawtooth", vol: 0.05, slide: -120 });
    noise({ dur: 0.3, vol: 0.07, freqStart: 800, freqEnd: 200, q: 2 });
  },

  milestone: () => {
    // achievement chime
    arpeggio([784, 988, 1319, 1568, 1976], { dur: 0.1, type: "triangle", vol: 0.09, step: 0.07, reverb: true });
    tone({ freq: 2349, dur: 0.18, type: "sine", vol: 0.06, delay: 0.45, reverb: true });
    noise({ dur: 0.4, vol: 0.03, freqStart: 6000, freqEnd: 12000, q: 3, delay: 0.4 });
  },

  bankrupt: () => {
    fatTone({ freq: 110, dur: 0.6, type: "sawtooth", vol: 0.1, slide: -60 });
    noise({ dur: 0.7, vol: 0.1, freqStart: 1200, freqEnd: 80, q: 1 });
    tone({ freq: 65, dur: 0.6, type: "sine", vol: 0.07, delay: 0.1 });
  },

  gem: () => {
    arpeggio([1319, 1760, 2349, 2637], { dur: 0.07, type: "sine", vol: 0.09, step: 0.04, reverb: true });
    noise({ dur: 0.18, vol: 0.04, freqStart: 8000, freqEnd: 12000, q: 4, delay: 0.05 });
  },

  streak: () => {
    arpeggio([523, 784, 1047, 1319, 1568, 2093], { dur: 0.1, type: "triangle", vol: 0.09, step: 0.08, reverb: true });
  },

  error: () => {
    tone({ freq: 180, dur: 0.06, type: "square", vol: 0.08 });
    tone({ freq: 140, dur: 0.06, type: "square", vol: 0.08, delay: 0.07 });
  },
};

sfx.isMuted();
