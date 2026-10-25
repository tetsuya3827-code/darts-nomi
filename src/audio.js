// 効果音とBGM(Web Audio で合成。音声ファイルは使わない)
// ブラウザは操作前の再生を止めるので、最初のクリック等で unlock() を呼ぶ。失敗しても無音で進む

const BPM = 148;
const STEP = 60 / BPM / 4; // 16分音符の長さ(秒)
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// 4小節ループ：C → Am → F → G(明るく前のめりな進行)
const ROOTS = [48, 45, 41, 43]; // C3 A2 F2 G2
const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
// メロディ(8分音符×8 / 小節)。null は休符
const MELODY = [
  [76, 79, 84, 79, 76, 79, 81, 79],
  [76, 81, 84, 81, 76, 81, 83, 81],
  [77, 81, 84, 81, 77, 81, 86, 84],
  [83, 86, 79, 86, 83, 79, 81, 83],
];

export function createAudio() {
  let ctx = null;
  let sfxGain, bgmGain, noise;
  let sfxOn = true;
  let bgmOn = true;
  let tense = false;
  let timer = 0;
  let step = 0;
  let nextTime = 0;

  function init() {
    if (ctx) return ctx;
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
    sfxGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.55;
    bgmGain.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone(out, type, freq, t, dur, vol, endFreq) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function hit(out, t, dur, vol, filterType, freq) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // 1ステップ(16分音符)ぶんの音を予約する
  function schedule(i, t) {
    const bar = Math.floor(i / 16) % 4;
    const s = i % 16;
    const root = ROOTS[bar];
    // ベース：ルートとオクターブを跳ねる
    if (s % 2 === 0) tone(bgmGain, 'square', hz(root + (s % 4 === 2 ? 12 : 0)), t, STEP * 1.6, 0.07);
    // コードの裏打ち
    if (s % 4 === 2) for (const n of CHORDS[bar]) tone(bgmGain, 'sawtooth', hz(n), t, STEP * 1.2, 0.018);
    // メロディ
    if (s % 2 === 0) {
      const n = MELODY[bar][s / 2];
      if (n) tone(bgmGain, 'square', hz(n), t, STEP * 1.8, 0.035);
    }
    // ドラム
    if (s === 0 || s === 8 || (bar === 3 && s === 10)) tone(bgmGain, 'sine', 150, t, 0.18, 0.6, 40);
    if (s === 4 || s === 12) hit(bgmGain, t, 0.12, 0.25, 'bandpass', 1800);
    if (s % 2 === 1 || tense) hit(bgmGain, t, 0.03, tense ? 0.1 : 0.06, 'highpass', 7000);
    // 照準中はスネアのロールで盛り上げる
    if (tense) hit(bgmGain, t, 0.05, 0.05 + 0.1 * (s / 16), 'bandpass', 2400);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.12) {
      schedule(step, nextTime);
      nextTime += STEP;
      step++;
    }
  }

  function startBgm() {
    if (!ctx || timer || !bgmOn) return;
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(tick, 25);
  }

  function stopBgm() {
    clearInterval(timer);
    timer = 0;
  }

  const play = (fn) => {
    if (!sfxOn || !init()) return;
    try {
      fn(ctx.currentTime);
    } catch {
      // 音が鳴らなくてもゲームは続ける
    }
  };

  return {
    unlock() {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      startBgm();
    },
    setSfx(on) {
      sfxOn = on;
    },
    setBgm(on) {
      bgmOn = on;
      if (on && ctx) startBgm();
      else stopBgm();
    },
    tension(on) {
      tense = on;
    },
    // 発表のファンファーレ中はBGMを少し下げる
    duck() {
      if (!ctx) return;
      const g = bgmGain.gain;
      const t = ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(0.15, t);
      g.linearRampToValueAtTime(0.55, t + 1.6);
    },
    whoosh: () => play((t) => tone(sfxGain, 'sawtooth', 900, t, 0.5, 0.05, 120)),
    thud: () => play((t) => {
      tone(sfxGain, 'sine', 140, t, 0.3, 0.5, 45);
      tone(sfxGain, 'square', 80, t, 0.08, 0.08);
    }),
    fanfare: () => play((t) => [523, 659, 784, 1047].forEach((f, i) => tone(sfxGain, 'triangle', f, t + 0.12 * i, i === 3 ? 0.7 : 0.16, 0.18))),
  };
}
