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
        words: true, sayChoices: true,
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
        prompt: `<div class="word-card"><div class="wc-word vi">“${esc(W.vi)}” ${sayBtn(W.vi, '🔊').replace('en-US', 'vi-VN')}</div></div><div class="q-ask">Trong tiếng Anh là từ nào?</div>`,
        say: '',
        words: true, sayChoices: true,
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


  /* ============================================================
     PHẦN 2: NGHE HIỂU
     ============================================================ */
  function parseListen(text) {
    return text.trim().split('\n').map((line) => {
      const [s, sVi, q, qVi, ...ans] = line.split('|').map((x) => x.trim());
      const answers = ans.map((a) => { const [t, pic, vi] = a.split('~'); return { t, pic, vi }; });
      return { s, sVi, q, qVi, answers };
    });
  }

  function listenQ(it, showText, boss) {
    const right = it.answers[0];
    const items = shuffle(it.answers).map((a) => ({
      v: a.t, say: a.t,
      html: `<span class="pic">${a.pic}</span><span class="clabel">${esc(a.t)}</span>`,
    }));
    return {
      key: 'lis' + it.s,
      prompt: `<div class="story ${boss ? 'boss' : ''}">
          <div class="story-row">${sayBtn(it.s, '🔊', 'big')}
            <div class="story-text">${showText ? `<div class="story-en">${esc(it.s)}</div>` : '<div class="story-hidden">Bấm loa để nghe câu nói</div>'}</div>
          </div>
          <div class="story-q">${sayBtn(it.q, '🔊')}<b>${esc(it.q)}</b></div>
        </div>
        <div class="q-ask">Nghe rồi chọn câu trả lời đúng:</div>`,
      say: [it.s, it.q],
      autoSay: [it.s, it.q],
      choiceItems: items,
      choices: items.map((x) => x.v),
      answer: right.t,
      answerHtml: `<span class="pic">${right.pic}</span> ${esc(right.t)}`,
      afterSay: right.t,
      explain: `<div class="vexp">
          <div class="vexp-ex">🗣️ <i>${esc(it.s)}</i> ${sayBtn(it.s, '🔊', 'small')}<br>→ ${esc(it.sVi)}</div>
          <div class="vexp-ex">❓ <i>${esc(it.q)}</i> ${sayBtn(it.q, '🔊', 'small')}<br>→ ${esc(it.qVi)}</div>
          <div class="vexp-ex">✅ <b>${esc(right.t)}</b> <span class="pic">${right.pic}</span> = ${esc(right.vi)}</div>
        </div>`,
    };
  }

  function listeningLessons() {
    return (KE.listeningTopics || []).map((t) => {
      const items = parseListen(t.items);
      const boss = parseListen(t.boss);
      const pickN = (arr, n) => shuffle(arr).slice(0, n);
      const plan = [
        { title: 'Nghe và đọc', icon: '🚀', build: () => pickN(items, 5).map((x) => listenQ(x, true)) },
        { title: 'Nghe là chính', icon: '⚡', build: () => pickN(items, 5).map((x, i) => listenQ(x, i < 2)) },
        { title: 'Chỉ nghe', icon: '🎧', build: () => pickN(items, 5).map((x) => listenQ(x, false)) },
        { title: 'Chỉ nghe (tiếp)', icon: '👂', build: () => shuffle([...pickN(items, 4).map((x) => listenQ(x, false)), ...pickN(boss, 1).map((x) => listenQ(x, true, true))]) },
        { title: 'Thử thách Vàng', icon: '🏆', build: () => shuffle([...pickN(items, 3).map((x) => listenQ(x, false)), ...pickN(boss, 2).map((x) => listenQ(x, false, true))]) },
        { title: 'Đấu Boss 1', icon: '👾', boss: true, build: () => shuffle([...pickN(boss, 3).map((x) => listenQ(x, false, true)), ...pickN(items, 2).map((x) => listenQ(x, false))]) },
        { title: 'Đấu Boss 2', icon: '🐲', boss: true, build: () => shuffle([...pickN(boss, 4).map((x) => listenQ(x, false, true)), ...pickN(items, 1).map((x) => listenQ(x, false))]) },
        { title: 'Đấu Boss 3', icon: '👹', boss: true, build: () => pickN(boss, 5).map((x) => listenQ(x, false, true)) },
      ];
      return { id: t.id, group: 'listen', grade: t.en, icon: t.icon, title: t.title, levels: plan };
    });
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
    desc: 'Từ vựng 15 chủ đề và nghe hiểu',
    lang: 'en-US',
    noTheory: true,
    levelHint: 'Không cần học lý thuyết, vào chơi luôn! Bấm 🔊 để nghe. Tất cả các màn đều mở sẵn, bé giỏi có thể thử Boss ngay. Đúng 5/5 câu được 3 sao.',
    groups: [
      { id: 'vocab', name: 'Phần 1: Từ vựng theo chủ đề', icon: '📖' },
      { id: 'listen', name: 'Phần 2: Nghe hiểu', icon: '🎧' },
    ],
    lessons: lessons.concat(listeningLessons()),
  });
})();
