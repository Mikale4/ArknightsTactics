
// ---------- sound (tiny WebAudio synth) ----------
const SFX = { ctx: null, noise: null };
function sfx(kind) {
  if (!S.settings.sound) return;
  try {
    const A = SFX.ctx || (SFX.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (A.state === "suspended") A.resume();
    const t = A.currentTime;
    const osc = (type, f0, f1, dur, vol, at = 0) => {
      const o = A.createOscillator(), g = A.createGain(); o.type = type; o.connect(g); g.connect(A.destination);
      o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + at + dur);
      g.gain.setValueAtTime(.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + .015); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      o.start(t + at); o.stop(t + at + dur + .02);
    };
    const noise = (dur, vol, freq = 1200) => {
      if (!SFX.noise) { const b = A.createBuffer(1, A.sampleRate * .6, A.sampleRate), d = b.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = R() * 2 - 1; SFX.noise = b; }
      const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(); s.buffer = SFX.noise; f.type = "lowpass"; f.frequency.value = freq;
      s.connect(f); f.connect(g); g.connect(A.destination);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.start(t); s.stop(t + dur);
    };
    if (kind === "blaster") osc("square", 1500 + R() * 300, 160, .17, .05);
    else if (kind === "saber") { noise(.16, .2, 2600); osc("sine", 1100, 320, .14, .02); }
    else if (kind === "bow") { noise(.06, .22, 3200); osc("triangle", 240, 110, .14, .06); }
    else if (kind === "shot") { noise(.11, .38, 3400); osc("square", 190, 55, .09, .06); }
    else if (kind === "arts") { osc("sine", 620, 1500, .18, .045); osc("triangle", 310, 920, .22, .03, .03); }
    else if (kind === "hit") noise(.12, .18, 900);
    else if (kind === "crit") { noise(.2, .28, 1600); osc("square", 300, 90, .2, .05); }
    else if (kind === "boom") { noise(.7, .45, 420); osc("sine", 120, 30, .6, .25); }
    else if (kind === "zap") { for (let k = 0; k < 4; k++) osc("square", 800 + R() * 900, 200 + R() * 300, .07, .03, k * .06); }
    else if (kind === "heal") { [523, 659, 784].forEach((f, k) => osc("sine", f, f * 1.01, .25, .05, k * .07)); }
    else if (kind === "special") { osc("sawtooth", 160, 640, .45, .045); osc("sine", 320, 1280, .45, .04); }
    else if (kind === "win") { [392, 523, 659, 784].forEach((f, k) => osc("triangle", f, f, .32, .07, k * .12)); }
    else if (kind === "lose") { [392, 330, 262].forEach((f, k) => osc("triangle", f, f * .98, .4, .06, k * .18)); }
    else if (kind === "flame") noise(.6, .2, 700);
    else if (kind === "tap") osc("sine", 880, 660, .05, .03);
    else if (kind === "warp") osc("sine", 200, 1400, .4, .04);
    // Beyblade sounds: metal on metal, the ripcord, the countdown, a top flying out of the dish
    else if (kind === "clash") { noise(.09, .3, 5200); osc("square", 1800 + R() * 600, 900, .08, .035); osc("sine", 2600, 2200, .12, .02, .01); }
    else if (kind === "launch") { noise(.35, .22, 2200); osc("sawtooth", 140, 900, .35, .04); }
    else if (kind === "count") osc("square", 880, 880, .12, .04);
    else if (kind === "go") { osc("square", 1320, 1320, .3, .05); osc("sawtooth", 220, 880, .4, .03); }
    else if (kind === "ringout") { noise(.5, .3, 1800); osc("sine", 900, 120, .5, .06); }
    else if (kind === "sleepout") { osc("triangle", 500, 90, .7, .05); }
  } catch (e) { /* audio unavailable */ }
}

// ---------- camera shots ----------
