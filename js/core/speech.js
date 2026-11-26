/* ============================================================
   Đọc to
   - Tiếng Anh: ưu tiên file MP3 giọng Mỹ thu sẵn trong audio/en (cùng một giọng trên mọi máy).
     Nếu thiếu file thì dùng giọng tiếng Anh Mỹ tốt nhất của trình duyệt.
   - Tiếng Việt: dùng giọng tiếng Việt của trình duyệt.
   ============================================================ */
window.KE = window.KE || {};

KE.speech = (function () {
  const synth = window.speechSynthesis;
  let voices = [];
  let warned = {};
  let token = 0;
  let audio = null;

  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  /* Mã tên file âm thanh: FNV-1a 32-bit của câu (khớp với công cụ tạo âm thanh) */
  function hash(text) {
    let h = 0x811c9dc5;
    for (const b of new TextEncoder().encode(text)) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }
  function audioFile(text, lang) {
    if (!lang.startsWith('en') || !KE.audioEn) return null;
    const h = hash(String(text).trim());
    return KE.audioEn.has(h) ? `audio/en/${h}.mp3` : null;
  }

  /* Chọn giọng tốt nhất của trình duyệt */
  const PREFER = {
    en: [/Google US English/i, /Microsoft (Aria|Jenny|Ana|Guy|Michelle|Ava|Andrew|Emma|Brian).*(Online|Natural)/i, /(Online|Natural).*English \(United States\)/i, /Samantha/i, /Alex/i, /Microsoft Zira/i],
    vi: [/HoaiMy/i, /NamMinh/i, /Google.*Vi/i, /Linh/i, /natural|online/i],
  };
  function voiceFor(lang) {
    const norm = (v) => (v.lang || '').toLowerCase().replace('_', '-');
    const base = lang.split('-')[0].toLowerCase();
    const exact = voices.filter((v) => norm(v) === lang.toLowerCase());
    const loose = voices.filter((v) => norm(v).startsWith(base));
    for (const re of PREFER[base] || []) {
      const v = exact.find((x) => re.test(x.name)) || loose.find((x) => re.test(x.name) && (base !== 'en' || norm(x) === 'en-us'));
      if (v) return v;
    }
    return exact[0] || loose[0] || null;
  }

  function supported() { return !!synth || !!window.Audio; }

  function stop() {
    token++;
    if (synth) synth.cancel();
    if (audio) { audio.pause(); audio = null; }
  }

  /**
   * Đọc lần lượt một danh sách câu.
   * onItem(i) được gọi khi bắt đầu đọc câu thứ i; onEnd() khi đọc xong.
   */
  function speakList(texts, opts) {
    opts = opts || {};
    const lang = opts.lang || 'vi-VN';
    stop();
    const my = ++token;
    let i = 0;

    const viaTts = (text, done) => {
      if (!synth) {
        if (!warned.none) { warned.none = true; KE.ui && KE.ui.toast('Trình duyệt này không hỗ trợ đọc to. Hãy dùng Chrome, Edge hoặc Safari.'); }
        done(); return;
      }
      const voice = voiceFor(lang);
      if (!voice && !warned[lang] && voices.length) {
        warned[lang] = true;
        KE.ui && KE.ui.toast(lang.startsWith('vi')
          ? 'Máy chưa có giọng đọc tiếng Việt, giọng đọc có thể chưa chuẩn. Nên dùng Edge hoặc điện thoại.'
          : 'Máy chưa có giọng đọc tiếng Anh, giọng đọc có thể chưa chuẩn.');
      }
      const u = new SpeechSynthesisUtterance(lang.startsWith('vi') ? KE.util.toSpeech(text) : text);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.9;
      u.onend = done;
      u.onerror = done;
      synth.speak(u);
    };

    const next = () => {
      if (my !== token) return;
      if (i >= texts.length) { opts.onEnd && opts.onEnd(); return; }
      const text = texts[i];
      const idx = i;
      const done = () => { if (my !== token) return; i++; next(); };
      opts.onItem && opts.onItem(idx);
      const file = audioFile(text, lang);
      if (file) {
        audio = new Audio(file);
        audio.onended = () => setTimeout(done, 250);
        audio.onerror = () => viaTts(text, done);
        audio.play().catch(() => viaTts(text, done));
      } else {
        viaTts(text, done);
      }
    };
    next();
  }

  function speak(text, opts) { speakList([].concat(text), opts); }

  return { speak, speakList, stop, supported, hash };
})();
