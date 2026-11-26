/* Đọc to bằng Web Speech API (giọng tiếng Việt nếu máy có) */
window.KE = window.KE || {};

KE.speech = (function () {
  const synth = window.speechSynthesis;
  let voices = [];
  let warned = false;
  let token = 0;

  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  function voiceFor(lang) {
    const base = lang.split('-')[0].toLowerCase();
    const list = voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
    // ưu tiên giọng tự nhiên / online
    return list.find((v) => /natural|online|google/i.test(v.name)) || list[0] || null;
  }

  function supported() { return !!synth; }

  function stop() {
    token++;
    if (synth) synth.cancel();
  }

  /**
   * Đọc lần lượt một danh sách câu.
   * onItem(i) được gọi khi bắt đầu đọc câu thứ i; onEnd() khi đọc xong.
   */
  function speakList(texts, opts) {
    opts = opts || {};
    const lang = opts.lang || 'vi-VN';
    if (!synth) { KE.ui && KE.ui.toast('Trình duyệt này không hỗ trợ đọc to. Hãy dùng Chrome, Edge hoặc Safari.'); return; }
    stop();
    const my = ++token;
    const voice = voiceFor(lang);
    if (!voice && !warned && voices.length) {
      warned = true;
      KE.ui && KE.ui.toast(lang.startsWith('vi')
        ? 'Máy chưa có giọng đọc tiếng Việt, giọng đọc có thể chưa chuẩn. Nên dùng Edge hoặc điện thoại.'
        : 'Máy chưa có giọng đọc tiếng Anh, giọng đọc có thể chưa chuẩn.');
    }
    let i = 0;
    const next = () => {
      if (my !== token) return;
      if (i >= texts.length) { opts.onEnd && opts.onEnd(); return; }
      const u = new SpeechSynthesisUtterance(lang.startsWith('vi') ? KE.util.toSpeech(texts[i]) : texts[i]);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.9;
      u.pitch = 1.05;
      const idx = i;
      u.onstart = () => { if (my === token) opts.onItem && opts.onItem(idx); };
      u.onend = () => { i++; next(); };
      u.onerror = () => { i++; next(); };
      synth.speak(u);
    };
    next();
  }

  function speak(text, opts) { speakList([text], opts); }

  return { speak, speakList, stop, supported };
})();
