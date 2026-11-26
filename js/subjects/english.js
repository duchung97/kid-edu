/* ============================================================
   MÔN TIẾNG ANH: Từ vựng theo chủ đề
   Không có phần lý thuyết: vào thẳng game.
   Mỗi chủ đề: 5 màn + 3 màn Đấu Boss, dữ liệu ở english-data.js
   ============================================================ */
window.KE = window.KE || {};
KE.subjects = KE.subjects || [];

(function () {
  const { pick, shuffle } = KE.util;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const QUESTIONS_PER_LEVEL = 5;

  function parse(topic) {
    return topic.words.trim().split('\n').map((line) => {
      const [w, ipa, vi, pic, ex, exVi] = line.split('|').map((s) => s.trim());
      return { w, ipa, vi, pic, ex, exVi };
    });
  }

  /* Tìm từ trong câu (kể cả số nhiều: bananas, eyes...) */
  const wordRe = (w) => new RegExp('\\b(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es)?)\\b', 'i');
  const highlight = (W) => esc(W.ex).replace(wordRe(W.w), '<mark>$1</mark>');
  const blanked = (W) => (wordRe(W.w).test(W.ex) ? esc(W.ex).replace(wordRe(W.w), '<span class="gap">_____</span>') : null);

  const sayBtn = (text, label, cls) => `<button class="say-btn ${cls || ''}" data-say="${esc(text)}" data-lang="en-US">${label}</button>`;

  /* Phần giải thích chung sau mỗi câu */
  function explain(W, extra) {
    return `<div class="vexp">
      <div class="vexp-head"><span class="pic">${W.pic}</span>
        <div><b class="en-word">${esc(W.w)}</b> <span class="ipa">${esc(W.ipa)}</span><br>= ${esc(W.vi)}</div>
        ${sayBtn(W.w, '🔊')}
      </div>
      <div class="vexp-ex"><i>${highlight(W)}</i> ${sayBtn(W.ex, '🔊', 'small')}<br>→ ${esc(W.exVi)}</div>
      ${extra ? `<div class="sub-explain">${extra}</div>` : ''}
    </div>`;
  }

  const others = (W, words, n) => shuffle(words.filter((x) => x !== W)).slice(0, n || 3);

  /* Lỗi chính tả giả để làm đáp án nhiễu */
  function misspell(w) {
    const out = new Set();
    const letters = w.split('');
    const vowels = 'aeiou';
    for (let k = 0; k < 60 && out.size < 6; k++) {
      const a = letters.slice();
      const i = Math.floor(Math.random() * a.length);
      if (a[i] === ' ' || a[i] === '-' || i === 0) continue; // giữ nguyên chữ cái đầu cho dễ đọc
      const kind = Math.floor(Math.random() * 4);
      if (kind === 0 && a.length > 3) a.splice(i, 1); // bỏ một chữ
      else if (kind === 1) a.splice(i, 0, a[i]); // gấp đôi một chữ
      else if (kind === 2 && i < a.length - 1 && a[i + 1] !== ' ') [a[i], a[i + 1]] = [a[i + 1], a[i]]; // đảo hai chữ
      else if (vowels.includes(a[i].toLowerCase())) a[i] = pick(vowels.replace(a[i].toLowerCase(), '').split(''));
      const s = a.join('');
      if (s !== w) out.add(s);
    }
    return [...out];
  }

  /* ---------- Các dạng câu hỏi ---------- */
  const Q = {
    /* Nhìn chữ, phiên âm, câu ví dụ → chọn hình */
    card(W, words) {
      return {
        key: 'card' + W.w,
        card: true,
        prompt: `<div class="word-card">
            <div class="wc-word">${esc(W.w)} ${sayBtn(W.w, '🔊')}</div>
            <div class="ipa">${esc(W.ipa)}</div>
            <div class="wc-ex"><i>${highlight(W)}</i> ${sayBtn(W.ex, '🔊', 'small')}</div>
          </div><div class="q-ask">Chọn hình đúng với từ <b>${esc(W.w)}</b>:</div>`,
        say: W.w, autoSay: W.w,
        pics: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.pic)),
        answer: W.pic,
        afterSay: W.w,
        explain: explain(W),
      };
    },
    /* Chỉ nghe → chọn hình */
    listen(W, words) {
      return {
        key: 'listen' + W.w,
        prompt: `<div class="listen-box">${sayBtn(W.w, '🔊', 'big')}<div>Bấm loa để nghe lại</div></div><div class="q-ask">Nghe và chọn hình đúng:</div>`,
        say: W.w, autoSay: W.w,
        pics: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.pic)),
        answer: W.pic,
        afterSay: W.w,
        explain: explain(W),
      };
    },
    /* Câu có chỗ trống → chọn hình phù hợp */
    sentence(W, words) {
      const b = blanked(W);
      if (!b) return Q.card(W, words);
      return {
        key: 'sent' + W.w,
        prompt: `<div class="word-card"><div class="wc-ex big">${b}</div><div class="vi-hint">${esc(W.exVi)}</div></div><div class="q-ask">Chọn hình phù hợp với chỗ trống:</div>`,
        say: W.ex.replace(wordRe(W.w), '...'),
        pics: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.pic)),
        answer: W.pic,
        afterSay: W.ex,
        explain: explain(W),
      };
    },
    /* Boss 1: nhìn hình → chọn từ */
    picToWord(W, words) {
      return {
        key: 'p2w' + W.w,
        prompt: `<div class="big-pic"><span class="pic">${W.pic}</span></div><div class="q-ask">Hình này là từ nào?</div>`,
        say: 'What is this?',
        words: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.w)),
        answer: W.w,
        afterSay: W.w,
        explain: explain(W),
      };
    },
    /* Boss 2: chính tả */
    spelling(W) {
      const wrong = shuffle(misspell(W.w)).slice(0, 3);
      if (wrong.length < 3) return null;
      return {
        key: 'spell' + W.w,
        prompt: `<div class="big-pic"><span class="pic">${W.pic}</span> ${sayBtn(W.w, '🔊')}</div><div class="q-ask">Từ nào viết <b>đúng chính tả</b>?</div>`,
        say: W.w, autoSay: W.w,
        words: true,
        choices: shuffle([W.w, ...wrong]),
        answer: W.w,
        afterSay: W.w,
        explain: explain(W, `Chú ý cách viết: <b class="spell">${esc(W.w.split(' ').map((x) => x.split('').join('-')).join('   '))}</b>`),
      };
    },
    /* Boss 3: nghĩa tiếng Việt → chọn từ tiếng Anh */
    meaning(W, words) {
      return {
        key: 'mean' + W.w,
        prompt: `<div class="word-card"><div class="wc-word vi">“${esc(W.vi)}”</div></div><div class="q-ask">Trong tiếng Anh là từ nào?</div>`,
        say: '',
        words: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.w)),
        answer: W.w,
        afterSay: W.w,
        explain: explain(W),
      };
    },
    /* Boss 3: nghe → chọn từ viết đúng */
    listenWord(W, words) {
      return {
        key: 'lw' + W.w,
        prompt: `<div class="listen-box">${sayBtn(W.w, '🔊', 'big')}<div>Bấm loa để nghe lại</div></div><div class="q-ask">Nghe và chọn từ bạn vừa nghe:</div>`,
        say: W.w, autoSay: W.w,
        words: true,
        choices: shuffle([W, ...others(W, words)].map((x) => x.w)),
        answer: W.w,
        afterSay: W.w,
        explain: explain(W),
      };
    },
  };

  const PLAN = (n) => {
    const half = Math.ceil(n / 2);
    return [
      { title: 'Học từ mới (phần 1)', icon: '🚀', types: ['card'], range: [0, half] },
      { title: 'Học từ mới (phần 2)', icon: '⚡', types: ['card'], range: [half, n] },
      { title: 'Nghe và chọn hình', icon: '🎧', types: ['listen'] },
      { title: 'Điền vào câu', icon: '📚', types: ['sentence'] },
      { title: 'Thử thách Vàng', icon: '🏆', types: ['card', 'listen', 'sentence'] },
      { title: 'Đấu Boss 1', icon: '👾', boss: true, types: ['picToWord'] },
      { title: 'Đấu Boss 2', icon: '🐲', boss: true, types: ['spelling', 'spelling', 'picToWord'] },
      { title: 'Đấu Boss 3', icon: '👹', boss: true, types: ['meaning', 'listenWord', 'spelling'] },
    ];
  };

  function makeLevels(words) {
    return PLAN(words.length).map((p) => ({
      title: p.title, icon: p.icon, boss: !!p.boss,
      build() {
        const pool = p.range ? words.slice(p.range[0], p.range[1]) : words;
        const chosen = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);
        while (chosen.length < QUESTIONS_PER_LEVEL) chosen.push(pick(pool));
        const types = shuffle(Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => p.types[i % p.types.length]));
        return chosen.map((W, i) => Q[types[i]](W, words) || Q.picToWord(W, words));
      },
    }));
  }

  const lessons = KE.englishTopics.map((t) => {
    const words = parse(t);
    return {
      id: t.id, group: 'vocab', grade: t.en, icon: t.icon, title: t.title,
      words, levels: makeLevels(words),
    };
  });

  KE.subjects.push({
    id: 'tieng-anh',
    name: 'Tiếng Anh',
    icon: '🔤',
    desc: 'Từ vựng theo 15 chủ đề',
    lang: 'en-US',
    noTheory: true,
    levelHint: 'Không cần học lý thuyết, vào chơi luôn! Mỗi câu có chữ, phiên âm và câu ví dụ, bấm 🔊 để nghe. Đúng ít nhất 3/5 câu để mở màn tiếp theo. Vượt qua 5 màn sẽ gặp 3 Boss: nhìn hình đoán từ, chính tả và nghe hiểu.',
    groups: [{ id: 'vocab', name: 'Từ vựng theo chủ đề', icon: '📖' }],
    lessons,
  });
})();
