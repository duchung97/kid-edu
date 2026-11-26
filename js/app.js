/* ============================================================
   Ứng dụng chính: điều hướng và hiển thị màn hình
   ============================================================ */
window.KE = window.KE || {};

(function () {
  const $app = document.getElementById('app');
  const S = KE.store;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Thông báo nhỏ ---------- */
  KE.ui = {
    toast(msg) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.classList.add('show'), 10);
      setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
    },
  };

  const subject = (id) => KE.subjects.find((s) => s.id === id);
  const lessonOf = (sub, id) => sub && sub.lessons.find((l) => l.id === id);
  const unlocked = () => true; // tất cả các màn đều mở sẵn
  const starStr = (n, max) => '★'.repeat(n) + '☆'.repeat((max || 3) - n);
  const lessonStars = (sid, L) => L.levels.reduce((a, _, i) => a + S.stars(sid, L.id, i), 0);

  /* ---------- Thanh trên cùng ---------- */
  function renderHeader() {
    const lv = S.level();
    const sound = S.get().settings.sound !== false;
    document.getElementById('hud').innerHTML = `
      <a href="#/" class="logo"><span class="logo-icon">${KE.mascot.svg(S.level().lv, 34)}</span><span>Bé Vui Học</span></a>
      <div class="hud-right">
        <div class="player" title="Điểm kinh nghiệm">
          <span class="lv">Cấp ${lv.lv}</span>
          <span class="xpbar"><span style="width:${Math.round((lv.cur / lv.need) * 100)}%"></span></span>
          <span class="star-total">⭐ ${S.totalStars()}</span>
        </div>
        <button class="icon-btn" id="btn-sound" aria-label="Bật/tắt âm thanh">${sound ? '🔔' : '🔕'}</button>
      </div>`;
    document.getElementById('btn-sound').onclick = () => {
      S.setSetting('sound', !sound);
      renderHeader();
    };
  }

  /* ---------- Trang chủ ---------- */
  function viewHome() {
    const lv = S.level();
    $app.innerHTML = `
      <section class="hero">
        <div class="hero-mascot">${KE.mascot.svg(lv.lv, 170)}</div>
        <div class="mascot-name">Khỉ ${KE.mascot.NAME} · bạn đồng hành của bé</div>
        <h1>Chào bé! Hôm nay mình học gì nào?</h1>
        <p>Chơi qua từng màn để nhận <b>sao vàng</b>, <b>lên cấp</b> và tặng quà cho khỉ ${KE.mascot.NAME}!</p>
        <div class="hero-stats">
          <div><b>Cấp ${lv.lv}</b><span>Cấp độ</span></div>
          <div><b>${S.get().xp}</b><span>Điểm XP</span></div>
          <div><b>${S.totalStars()}</b><span>Sao vàng</span></div>
        </div>
      </section>
      <h2 class="section-title">Chọn môn học</h2>
      <div class="grid subjects">
        ${KE.subjects.map((s) => `
          <a class="card subject ${s.comingSoon ? 'locked' : ''}" ${s.comingSoon ? '' : `href="#/s/${s.id}"`}>
            <div class="subject-icon">${s.icon}</div>
            <div class="subject-name">${esc(s.name)}</div>
            <div class="subject-desc">${esc(s.desc)}</div>
            ${s.comingSoon ? '<span class="badge">Sắp ra mắt</span>' : ''}
          </a>`).join('')}
      </div>
      <h2 class="section-title">🎁 Tủ đồ của ${KE.mascot.NAME}</h2>
      <p class="hint">${(() => { const n = KE.mascot.next(lv.lv); return n ? `Lên <b>cấp ${n.lv}</b> để tặng ${KE.mascot.NAME} món <b>${n.name}</b> ${n.icon}. Mỗi câu đúng được +10 XP, câu đúng ở màn Boss được +20 XP.` : `${KE.mascot.NAME} đã có đủ mọi món đồ. Bé thật giỏi!`; })()}</p>
      <div class="wardrobe">${KE.mascot.ITEMS.map((it) => `<div class="ward ${lv.lv >= it.lv ? 'own' : ''}"><span class="pic">${lv.lv >= it.lv ? it.icon : '🔒'}</span><b>${it.name}</b><small>Cấp ${it.lv}</small></div>`).join('')}</div>
`;
  }

  /* ---------- Danh sách bài học ---------- */
  function viewSubject(sid) {
    const sub = subject(sid);
    if (!sub || sub.comingSoon) return go('#/');
    $app.innerHTML = `
      <nav class="crumbs"><a href="#/">Trang chủ</a> › ${esc(sub.name)}</nav>
      <h1 class="page-title">${sub.icon} ${esc(sub.name)}</h1>
      ${sub.groups.map((g) => `
        <h2 class="section-title">${g.icon} ${esc(g.name)}</h2>
        <div class="grid lessons">
          ${sub.lessons.filter((l) => l.group === g.id).map((L) => {
            const got = lessonStars(sid, L), max = L.levels.length * 3;
            return `<a class="card lesson" href="#/s/${sid}/l/${L.id}">
              <span class="grade">${esc(L.grade)}</span>
              <div class="lesson-title">${L.icon ? `<span class="lesson-icon pic">${L.icon}</span> ` : ''}${esc(L.title)}</div>
              <div class="progress"><span style="width:${Math.round((got / max) * 100)}%"></span></div>
              <div class="lesson-stars">⭐ ${got} / ${max}</div>
            </a>`;
          }).join('')}
        </div>`).join('')}`;
  }

  /* ---------- Bài học: lý thuyết + bản đồ màn chơi ---------- */
  function viewLesson(sid, lid) {
    const sub = subject(sid), L = lessonOf(sub, lid);
    if (!L) return go('#/s/' + sid);
    const levels = L.levels.map((lv, i) => {
      const open = unlocked(sid, lid, i), st = S.stars(sid, lid, i);
      return `${lv.boss && i > 0 && !L.levels[i - 1].boss ? '<div class="boss-divider">⚔️ Khu vực Boss: bài toán tư duy</div>' : ''}<a class="level-node ${lv.boss ? 'boss' : ''} ${open ? '' : 'locked'} ${st ? 'done' : ''}" ${open ? `href="#/s/${sid}/l/${lid}/p/${i}"` : ''}>
        <span class="node-num">${open ? lv.icon : '🔒'}</span>
        <span class="node-info"><b>${lv.boss ? '' : `Màn ${i + 1}: `}${esc(lv.title)}</b><span class="node-stars">${starStr(st)}</span></span>
      </a>`;
    }).join('');

    $app.innerHTML = `
      <nav class="crumbs"><a href="#/">Trang chủ</a> › <a href="#/s/${sid}">${esc(sub.name)}</a> › ${esc(L.title)}</nav>
      <h1 class="page-title">${esc(L.title)} <span class="grade">${esc(L.grade)}</span></h1>

      ${sub.noTheory ? '' : `<section class="panel theory">
        <div class="panel-head">
          <h2>📖 Lý thuyết</h2>
          <button class="btn gold" id="btn-read">🔊 Nghe cả bài</button>
        </div>
        ${L.theory.map((p, i) => `
          <div class="tp" data-i="${i}">
            <button class="icon-btn small say" data-i="${i}" aria-label="Nghe đoạn này">🔊</button>
            <div class="tp-body"><p>${esc(p.t)}</p>${p.ex ? `<div class="example">${p.ex()}</div>` : ''}</div>
          </div>`).join('')}
      </section>`}

      <section class="panel">
        <div class="panel-head"><h2>🎮 Chơi qua màn</h2></div>
        <p class="hint">${sub.levelHint || 'Tất cả các màn đều mở sẵn, bé giỏi có thể thử Boss ngay. Đúng 3/5 câu là qua màn, đúng hết 5 câu được 3 sao! 3 màn Boss là các bài toán tư duy khó hơn.'}</p>
        <div class="level-map">${levels}</div>
      </section>`;

    if (sub.noTheory) return;
    const paras = [...$app.querySelectorAll('.tp')];
    const mark = (i) => paras.forEach((p, k) => p.classList.toggle('reading', k === i));
    const btn = document.getElementById('btn-read');
    let reading = false;
    const reset = () => { reading = false; btn.textContent = '🔊 Nghe cả bài'; mark(-1); };
    btn.onclick = () => {
      if (reading) { KE.speech.stop(); reset(); return; }
      reading = true; btn.textContent = '⏹ Dừng đọc';
      KE.speech.speakList(L.theory.map((p) => p.t), { lang: sub.lang, onItem: mark, onEnd: reset });
    };
    $app.querySelectorAll('.say').forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.i;
        reset();
        KE.speech.speakList([L.theory[i].t], { lang: sub.lang, onItem: () => mark(i), onEnd: () => mark(-1) });
      };
    });
  }

  /* ---------- Màn chơi trắc nghiệm ---------- */
  function viewPlay(sid, lid, lvIdx) {
    const sub = subject(sid), L = lessonOf(sub, lid);
    lvIdx = +lvIdx;
    if (!L || !L.levels[lvIdx] || !unlocked(sid, lid, lvIdx)) return go(`#/s/${sid}/l/${lid}`);
    const level = L.levels[lvIdx];
    const qs = level.build();
    const st = { i: 0, correct: 0, results: [] };

    function renderQ() {
      const q = qs[st.i];
      const dots = qs.map((_, k) => `<span class="dot ${k < st.i ? (st.results[k] ? 'ok' : 'bad') : k === st.i ? 'cur' : ''}"></span>`).join('');
      $app.innerHTML = `
        <nav class="crumbs"><a href="#/s/${sid}/l/${lid}">‹ ${esc(L.title)}</a></nav>
        <div class="play-head">
          <div class="play-title ${level.boss ? 'boss' : ''}">${level.icon} ${level.boss ? '' : `Màn ${lvIdx + 1}: `}${esc(level.title)}</div>
          <div class="dots">${dots}</div>
        </div>
        <section class="panel question">
          <div class="q-top"><span class="q-num">Câu ${st.i + 1}/${qs.length}</span>
            ${q.say ? '<button class="icon-btn small" id="btn-say" aria-label="Đọc câu hỏi">🔊</button>' : ''}</div>
          <div class="q-prompt ${q.small ? 'text' : ''}">${q.prompt}</div>
          ${q.visual || ''}
          <div class="choices ${q.choices.length === 3 ? 'three' : ''} ${q.pics ? 'pics' : ''} ${q.words ? 'words' : ''}">
            ${(q.choiceItems || q.choices.map((c) => ({ v: c, say: q.sayChoices ? c : '', html: q.pics ? `<span class="pic">${esc(c)}</span>` : esc(c) })))
              .map((it) => `<div class="choice-wrap"><button class="choice" data-v="${esc(it.v)}">${it.html}</button>${it.say ? `<button class="say-btn small choice-say" data-say="${esc(it.say)}" data-lang="${sub.lang}" aria-label="Nghe đáp án">🔊</button>` : ''}</div>`).join('')}
          </div>
          <div id="feedback"></div>
        </section>`;
      if (q.say) document.getElementById('btn-say').onclick = () => KE.speech.speak(q.say, { lang: sub.lang, rate: 0.85 });
      if (q.autoSay) setTimeout(() => KE.speech.speakList([].concat(q.autoSay), { lang: sub.lang, rate: 0.85 }), 250);
      else if (S.get().settings.autoRead && q.say) KE.speech.speak(q.say, { lang: sub.lang });
      /* Bé chưa biết đọc: thêm nút loa đọc câu hướng dẫn tiếng Việt */
      $app.querySelectorAll('.q-ask').forEach((el) => {
        el.insertAdjacentHTML('beforeend', ` <button class="say-btn small" data-say="${esc(el.textContent.trim())}" data-lang="vi-VN" aria-label="Nghe hướng dẫn">🔊</button>`);
      });
      $app.querySelectorAll('.choice').forEach((b) => { b.onclick = () => answer(b, q); });
    }

    function answer(btn, q) {
      if (st.answered === st.i) return;
      st.answered = st.i;
      const ok = btn.dataset.v === q.answer;
      st.results.push(ok);
      if (ok) st.correct++;
      $app.querySelectorAll('.choice').forEach((b) => {
        b.disabled = true;
        if (b.dataset.v === q.answer) b.classList.add('right');
        else if (b === btn) b.classList.add('wrong');
      });
      ok ? KE.sound.correct() : KE.sound.wrong();
      if (q.afterSay) setTimeout(() => KE.speech.speak(q.afterSay, { lang: sub.lang, rate: 0.85 }), 450);
      const praise = KE.util.pick(['Giỏi quá!', 'Chính xác!', 'Tuyệt vời!', 'Bé làm đúng rồi!']);
      const last = st.i === qs.length - 1;
      document.getElementById('feedback').innerHTML = `
        <div class="feedback ${ok ? 'ok' : 'bad'}">
          <div class="fb-title">${ok ? '🎉 ' + praise : '💪 Chưa đúng rồi, cố lên nhé!'}</div>
          <div class="fb-answer">Đáp án đúng: <b class="${q.pics ? 'pic' : ''}">${q.answerHtml || esc(q.answer)}</b></div>
          <details class="fb-explain" ${ok && !sub.noTheory ? '' : 'open'}>
            <summary>💡 Xem giải thích</summary>
            <div>${q.explain}</div>
          </details>
          <button class="btn gold big" id="btn-next">${last ? 'Xem kết quả 🏁' : 'Câu tiếp theo ➜'}</button>
        </div>`;
      const nx = document.getElementById('btn-next');
      nx.focus({ preventScroll: true });
      document.getElementById('feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      nx.onclick = () => { KE.speech.stop(); st.i++; st.i < qs.length ? renderQ() : finish(); };
    }

    function finish() {
      const c = st.correct, n = qs.length;
      const stars = c === n ? 3 : c >= n - 1 ? 2 : c >= 3 ? 1 : 0;
      const before = S.stars(sid, lid, lvIdx);
      const lvBefore = S.level().lv;
      const xp = c * (level.boss ? 20 : 10) + (stars === 3 && before < 3 ? 20 : 0);
      S.addXp(xp);
      if (stars) S.setStars(sid, lid, lvIdx, stars);
      const lvAfter = S.level().lv;
      renderHeader();
      const hasNext = lvIdx + 1 < L.levels.length;
      if (stars) KE.sound.win();
      $app.innerHTML = `
        <section class="panel result">
          <div class="big-stars">${[0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
          <h1>${stars === 3 ? 'Xuất sắc!' : stars === 2 ? 'Rất tốt!' : stars === 1 ? 'Qua màn rồi!' : 'Chưa qua màn, thử lại nhé!'}</h1>
          <p>Bé trả lời đúng <b>${c}/${n}</b> câu và nhận <b>+${xp} XP</b>.</p>
          ${lvAfter > lvBefore ? `<div class="levelup">🎊 Lên cấp ${lvAfter}! 🎊</div>
            <div class="result-mascot">${KE.mascot.svg(lvAfter, 150)}</div>
            ${(() => { const got = KE.mascot.ITEMS.filter((it) => it.lv > lvBefore && it.lv <= lvAfter); return got.length ? `<p class="gift">${KE.mascot.NAME} nhận được quà mới: ${got.map((it) => `<b>${it.icon} ${it.name}</b>`).join(', ')}!</p>` : ''; })()}` : ''}
          <div class="result-btns">
            <a class="btn" href="#/s/${sid}/l/${lid}">📖 Về bài học</a>
            <button class="btn" id="btn-again">🔁 Chơi lại</button>
            ${hasNext ? `<a class="btn gold" href="#/s/${sid}/l/${lid}/p/${lvIdx + 1}">Màn tiếp theo ➜</a>` : ''}
          </div>
        </section>`;
      document.getElementById('btn-again').onclick = () => viewPlay(sid, lid, lvIdx);
      if (stars >= 2) confetti();
      KE.speech.speak(stars ? `Bé trả lời đúng ${c} trên ${n} câu. Giỏi lắm!` : `Bé trả lời đúng ${c} trên ${n} câu. Mình thử lại nhé!`, { lang: 'vi-VN' });
    }

    renderQ();
  }

  function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 0.8 + 's';
      p.style.background = KE.util.pick(['#f5c542', '#ffd76a', '#fff3c4', '#e0a800', '#ffffff']);
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
  }

  /* ---------- Điều hướng ---------- */
  function go(h) { location.hash = h; }
  function route() {
    KE.speech.stop();
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    renderHeader();
    let parent = null;
    if (parts[0] === 's' && parts[2] === 'l' && parts[4] === 'p') { parent = `#/s/${parts[1]}/l/${parts[3]}`; viewPlay(parts[1], parts[3], parts[5]); }
    else if (parts[0] === 's' && parts[2] === 'l') { parent = `#/s/${parts[1]}`; viewLesson(parts[1], parts[3]); }
    else if (parts[0] === 's') { parent = '#/'; viewSubject(parts[1]); }
    else viewHome();
    /* Nút quay lại cố định: về menu ngay phía trước */
    const back = document.getElementById('backbar');
    back.hidden = !parent;
    if (parent) back.querySelector('a').setAttribute('href', parent);
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-say]');
    if (sb) { KE.speech.speak(sb.dataset.say, { lang: sb.dataset.lang || 'vi-VN', rate: sb.classList.contains('small') ? 0.8 : 0.85 }); return; }
    if (e.target.closest('.btn, .card, .level-node')) KE.sound.click();
  });
  window.addEventListener('hashchange', route);
  route();
})();
