/* Âm thanh hiệu ứng tạo bằng Web Audio (không cần file mp3) */
window.KE = window.KE || {};

KE.sound = (function () {
  let ctx = null;
  const ac = () => {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    return ctx;
  };

  function tone(freq, start, dur, type, vol) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  }

  const on = () => KE.store.get().settings.sound !== false;

  return {
    correct() { if (!on()) return; tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.18, 'triangle'); },
    wrong() { if (!on()) return; tone(220, 0, 0.18, 'sawtooth', 0.08); tone(180, 0.15, 0.25, 'sawtooth', 0.08); },
    win() { if (!on()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle')); },
    click() { if (!on()) return; tone(520, 0, 0.05, 'square', 0.05); },
  };
})();
