/* Lưu tiến độ của bé trong trình duyệt (localStorage). Không gửi đi đâu cả. */
window.KE = window.KE || {};

KE.store = (function () {
  const KEY = 'kid-edu-progress-v1';
  const blank = () => ({ xp: 0, stars: {}, settings: { sound: true, autoRead: false } });
  let state = blank();

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* bỏ qua: chế độ ẩn danh */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ }
  }

  const key = (subject, lesson, level) => `${subject}/${lesson}/${level}`;

  return {
    get: () => state,
    save,
    stars(subject, lesson, level) { return state.stars[key(subject, lesson, level)] || 0; },
    setStars(subject, lesson, level, n) {
      const k = key(subject, lesson, level);
      if ((state.stars[k] || 0) < n) state.stars[k] = n;
      save();
    },
    addXp(n) { state.xp += n; save(); },
    /* Cấp độ của bé: mỗi cấp cần nhiều XP hơn cấp trước một chút */
    level() {
      let lv = 1, need = 100, xp = state.xp;
      while (xp >= need) { xp -= need; lv++; need = 100 + (lv - 1) * 20; }
      return { lv, cur: xp, need };
    },
    totalStars() { return Object.values(state.stars).reduce((a, b) => a + b, 0); },
    setSetting(k, v) { state.settings[k] = v; save(); },
  };
})();
