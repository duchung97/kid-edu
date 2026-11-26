/* ============================================================
   MÔN TIẾNG ANH – PHẦN 3: 15 TRÒ CHƠI VUI
   Trò chơi tự thiết kế, dùng lại từ vựng, hình và giọng Mỹ thu sẵn.
   Mỗi trò: 5 màn + 3 màn Đấu Boss, màn sau khó hơn (d = 0..7).
   Mỗi màn có hàm game(api); khi chơi xong gọi api.done(đúng, tổng).
   ============================================================ */
window.KE = window.KE || {};

(function () {
  const { pick, shuffle, rand } = KE.util;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sub = KE.subjects.find((s) => s.id === 'tieng-anh');
  if (!sub) return;

  /* ---------- Dữ liệu dùng chung ---------- */
  const TOPICS = sub.lessons.filter((l) => l.group === 'vocab').map((l) => ({
    id: l.id, title: l.title, en: l.grade, icon: l.icon,
    words: l.words.map((w) => Object.assign({ topic: l.id }, w)),
  }));
  const ALL = [].concat(...TOPICS.map((t) => t.words));
  const topicOf = (w) => TOPICS.find((t) => t.id === w.topic);

  /* Bỏ từ trùng hình hoặc trùng chữ để không gây nhầm */
  function uniq(list) {
    const pics = new Set(), ws = new Set();
    return list.filter((w) => {
      if (pics.has(w.pic) || ws.has(w.w)) return false;
      pics.add(w.pic); ws.add(w.w); return true;
    });
  }
  /* Màn dễ: 1 chủ đề; màn giữa: 2 chủ đề; màn khó: trộn tất cả */
  function pool(d, min) {
    const n = d <= 2 ? 1 : d <= 4 ? 2 : TOPICS.length;
    const list = uniq(shuffle([].concat(...shuffle(TOPICS).slice(0, n).map((t) => t.words))));
    return list.length >= (min || 8) ? list : uniq(shuffle(ALL.slice()));
  }
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

  const sb = (text, cls) => `<button class="say-btn small ${cls || ''}" data-say="${esc(text)}" data-lang="en-US" aria-label="Nghe">🔊</button>`;
  const isSay = (e) => !!e.target.closest('.say-btn');
  const pic = (w, cls) => `<span class="g-pic ${cls || ''}">${w.pic}</span>`;

  function msg(api, html, cls) {
    const m = api.el.querySelector('.g-msg');
    if (m) { m.innerHTML = html; m.className = 'g-msg ' + (cls || ''); }
  }
  const good = (api, html) => { api.good(); msg(api, html || 'Giỏi quá! 🎉', 'ok'); };
  const bad = (api, html) => { api.bad(); msg(api, html || 'Chưa đúng rồi!', 'bad'); };
  const later = (api, fn, ms) => setTimeout(() => { if (api.alive()) fn(); }, ms);
  const shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

  /* Chơi n lượt liên tiếp, mỗi lượt round(i, xong) gọi xong(true/false) đúng một lần */
  function series(api, n, round) {
    let i = 0, c = 0;
    api.score(`⭐ 0/${n}`);
    const next = () => {
      if (!api.alive()) return;
      if (i >= n) return api.done(c, n);
      let used = false;
      round(i++, (ok) => {
        if (used) return; used = true;
        if (ok) c++;
        api.score(`⭐ ${c}/${n}`);
        later(api, next, ok ? 1100 : 2000);
      });
    };
    next();
  }

  /* Đồng hồ đếm ngược, gọi onEnd khi hết giờ. Trả về hàm dừng. */
  function timer(api, secs, onEnd) {
    const bar = document.createElement('div');
    bar.className = 'g-timer';
    bar.innerHTML = '<i></i><b></b>';
    api.el.prepend(bar);
    const t0 = Date.now();
    let stopped = false;
    const tick = () => {
      if (stopped || !api.alive()) return;
      const left = Math.max(0, secs - (Date.now() - t0) / 1000);
      bar.querySelector('i').style.width = (left / secs) * 100 + '%';
      bar.querySelector('b').textContent = '⏱️ ' + Math.ceil(left) + ' giây';
      if (left <= 0) { stopped = true; onEnd(); return; }
      setTimeout(tick, 200);
    };
    tick();
    return () => { stopped = true; };
  }

  /* ============================================================
     1. LẬT THẺ TRÍ NHỚ: tìm cặp hình và chữ
     ============================================================ */
  function memory(api, d) {
    const pairs = [3, 4, 4, 5, 6, 6, 7, 8][d];
    const words = pool(d).slice(0, pairs);
    const cards = shuffle([
      ...words.map((w, k) => ({ k, w, face: pic(w) })),
      ...words.map((w, k) => ({ k, w, face: `<span class="g-word">${esc(w.w)}</span>` })),
    ]);
    api.el.innerHTML = `<div class="g-msg">Lật 2 thẻ: một hình và một chữ giống nhau</div>
      <div class="g-memory">${cards.map((c, i) => `<button class="mcard" data-i="${i}"><span class="back">?</span><span class="front">${c.face}</span></button>`).join('')}</div>`;
    let open = [], found = 0, miss = 0, lock = false;
    api.score(`🃏 0/${pairs} cặp`);
    api.el.querySelector('.g-memory').onclick = (e) => {
      const b = e.target.closest('.mcard');
      if (!b || lock || b.classList.contains('up')) return;
      const c = cards[b.dataset.i];
      b.classList.add('up');
      api.say(c.w.w);
      open.push(b);
      if (open.length < 2) return;
      const [x, y] = open; open = [];
      const cx = cards[x.dataset.i], cy = cards[y.dataset.i];
      if (cx.k === cy.k) {
        x.classList.add('ok'); y.classList.add('ok');
        found++;
        good(api, `${cx.w.pic} <b>${esc(cx.w.w)}</b> = ${esc(cx.w.vi)} ${sb(cx.w.w)}`);
        api.score(`🃏 ${found}/${pairs} cặp`);
        if (found === pairs) api.done(Math.max(0, pairs - Math.floor(Math.max(0, miss - pairs) / 2)), pairs);
      } else {
        miss++; lock = true;
        msg(api, 'Chưa khớp, nhớ vị trí nhé! 🤔', 'bad');
        later(api, () => { x.classList.remove('up'); y.classList.remove('up'); lock = false; }, 1100);
      }
    };
  }

  /* ============================================================
     2. BẮN BÓNG BAY: nghe từ, bấm bóng có hình đúng trước khi bóng bay mất
     ============================================================ */
  function balloons(api, d) {
    const k = 3 + (d >= 3) + (d >= 6);
    const dur = Math.max(4, 8 - d * 0.6);
    series(api, 5, (i, finish) => {
      const words = pool(d).slice(0, k);
      const target = pick(words);
      const slots = shuffle([...Array(k).keys()]);
      api.el.innerHTML = `<div class="g-msg">Nghe và bấm quả bóng đúng! ${sb(target.w)}</div>
        <div class="g-sky">${words.map((w, j) => `<button class="balloon c${j}" data-j="${j}" style="left:${4 + slots[j] * (92 / k)}%;width:${Math.min(23, 88 / k)}%;animation-duration:${dur}s;animation-delay:${(Math.random() * 0.8).toFixed(2)}s"><span>${w.pic}</span></button>`).join('')}</div>`;
      api.say(target.w);
      let over = false;
      const end = (ok, html) => {
        if (over) return; over = true;
        api.el.querySelectorAll('.balloon').forEach((b) => b.classList.add('paused'));
        ok ? good(api, html) : bad(api, html);
        finish(ok);
      };
      const show = `${target.pic} <b>${esc(target.w)}</b> = ${esc(target.vi)} ${sb(target.w)}`;
      api.el.querySelector('.g-sky').onclick = (e) => {
        const b = e.target.closest('.balloon');
        if (!b || over) return;
        b.classList.add('pop');
        if (words[b.dataset.j] === target) end(true, 'Bùm! Đúng rồi! ' + show);
        else end(false, 'Chưa đúng. Đáp án: ' + show);
      };
      const tb = api.el.querySelectorAll('.balloon')[words.indexOf(target)];
      tb.addEventListener('animationend', () => end(false, 'Bóng bay mất rồi! Đáp án: ' + show));
    });
  }

  /* ============================================================
     3. ĐẬP HÌNH ĐÚNG: hình nhô lên từ các lỗ, đập đúng hình vừa nghe
     ============================================================ */
  function whack(api, d) {
    const GOAL = 8;
    const words = pool(d);
    let target = pick(words), hits = 0, wrong = 0, ended = false;
    const gap = 1000 - d * 70, stay = 1700 - d * 120;
    api.el.innerHTML = `<div class="g-msg"></div>
      <div class="g-holes">${[...Array(9)].map((_, i) => `<div class="hole" data-i="${i}"><button class="mole"></button></div>`).join('')}</div>`;
    const announce = () => { msg(api, `Đập hình: <b>${esc(target.w)}</b> ${sb(target.w)}`); api.say(target.w); };
    const score = () => api.score(`🔨 ${hits}/${GOAL} · ❌ ${wrong}`);
    announce(); score();
    const finish = () => {
      if (ended) return; ended = true; stopT();
      api.done(Math.max(0, hits - wrong), GOAL);
    };
    const stopT = timer(api, 45, finish);
    const holes = [...api.el.querySelectorAll('.hole')];
    const spawn = () => {
      if (ended || !api.alive()) return;
      const free = holes.filter((h) => !h.classList.contains('up'));
      if (free.length) {
        const h = pick(free);
        const w = Math.random() < 0.42 ? target : pick(words.filter((x) => x !== target));
        h.w = w;
        h.querySelector('.mole').innerHTML = w.pic;
        h.classList.remove('hit', 'miss');
        h.classList.add('up');
        h.t = setTimeout(() => h.classList.remove('up'), stay);
      }
      setTimeout(spawn, gap * (0.7 + Math.random() * 0.6));
    };
    later(api, spawn, 1200);
    api.el.querySelector('.g-holes').onclick = (e) => {
      const h = e.target.closest('.hole');
      if (!h || ended || !h.classList.contains('up')) return;
      clearTimeout(h.t);
      if (h.w === target) {
        hits++; api.good(); h.classList.add('hit');
        if (hits >= GOAL) { score(); return finish(); }
        if (hits % 3 === 0) { target = pick(words.filter((x) => x !== target)); announce(); }
      } else { wrong++; api.bad(); h.classList.add('miss'); }
      setTimeout(() => h.classList.remove('up'), 250);
      score();
    };
  }

  /* ============================================================
     4. ĐI CHỢ CÙNG KHỈ MẬP: nghe danh sách, chọn đủ đồ vào giỏ
     ============================================================ */
  function shopping(api, d) {
    const L = 2 + (d >= 3) + (d >= 6);
    const shelfN = d <= 2 ? 6 : 8;
    const base = () => {
      const ids = d <= 2 ? [pick(['fruits', 'food'])] : d <= 4 ? ['fruits', 'food'] : ['fruits', 'food', 'home', 'school', 'clothes'];
      return uniq(shuffle([].concat(...TOPICS.filter((t) => ids.includes(t.id)).map((t) => t.words))));
    };
    series(api, 5, (i, finish) => {
      const shelf = base().slice(0, shelfN);
      const list = shuffle(shelf).slice(0, L);
      const got = new Set();
      api.el.innerHTML = `<div class="g-msg">Khỉ Mập nhờ bé mua ${L} món. Nghe rồi chọn nhé!</div>
        <div class="g-basket"><button class="btn gold g-replay">🔊 Nghe lại danh sách</button>
          <span class="g-cart">🛒 ${list.map(() => '<i>⬜</i>').join('')}</span></div>
        <div class="g-shelf">${shelf.map((w, j) => `<div class="g-item-wrap"><button class="g-item" data-j="${j}">${w.pic}</button></div>`).join('')}</div>`;
      const sayList = () => api.say(list.map((w) => w.w));
      later(api, sayList, 300);
      api.el.querySelector('.g-replay').onclick = sayList;
      let over = false;
      const answer = () => list.map((w) => `${w.pic} <b>${esc(w.w)}</b> ${sb(w.w)}`).join(' · ');
      api.el.querySelector('.g-shelf').onclick = (e) => {
        const b = e.target.closest('.g-item');
        if (!b || over || b.classList.contains('picked')) return;
        const w = shelf[b.dataset.j];
        api.say(w.w);
        if (list.includes(w)) {
          got.add(w); b.classList.add('picked');
          api.el.querySelectorAll('.g-cart i')[got.size - 1].textContent = w.pic;
          if (got.size === list.length) { over = true; good(api, 'Mua đủ rồi! ' + answer()); finish(true); }
          else api.good();
        } else {
          over = true; shake(b);
          bad(api, `${w.pic} <b>${esc(w.w)}</b> không có trong danh sách. Cần mua: ${answer()}`);
          finish(false);
        }
      };
    });
  }

  /* ============================================================
     5. XẾP CHỮ CÁI: bấm các chữ cái theo đúng thứ tự
     ============================================================ */
  function spell(api, d) {
    const maxLen = [4, 4, 5, 5, 6, 7, 8, 9][d], minLen = d >= 5 ? 5 : 3;
    const ok = (w) => /^[a-z]+$/.test(w.w) && w.w.length >= minLen && w.w.length <= maxLen;
    let words = pool(d).filter(ok);
    if (words.length < 5) words = uniq(shuffle(ALL.filter(ok)));
    series(api, 5, (i, finish) => {
      const W = words[i % words.length];
      const decoy = d >= 5 ? shuffle('abcdefghijklmnoprstuvwy'.split('').filter((c) => !W.w.includes(c))).slice(0, d - 4) : [];
      const tiles = shuffle([...W.w.split(''), ...decoy]);
      let pos = 0, mistakes = 0, over = false;
      api.el.innerHTML = `<div class="g-msg">Xếp chữ cho hình này ${sb(W.w)}</div>
        <div class="g-center">${pic(W, 'big')}<div class="g-vi">${esc(W.vi)}</div></div>
        <div class="g-slots">${W.w.split('').map(() => '<span class="slot"></span>').join('')}</div>
        <div class="g-tiles">${tiles.map((c, j) => `<button class="tile-l" data-j="${j}">${c}</button>`).join('')}</div>`;
      later(api, () => api.say(W.w), 300);
      const slots = api.el.querySelectorAll('.slot');
      const reveal = () => W.w.split('').forEach((c, j) => { slots[j].textContent = c; });
      api.el.querySelector('.g-tiles').onclick = (e) => {
        const b = e.target.closest('.tile-l');
        if (!b || over || b.disabled) return;
        if (b.textContent === W.w[pos]) {
          slots[pos++].textContent = b.textContent; b.disabled = true; KE.sound.click();
          if (pos === W.w.length) {
            over = true; api.say(W.w);
            const win = mistakes <= 1;
            win ? good(api, `<b>${esc(W.w)}</b> ${esc(W.ipa)} = ${esc(W.vi)} ${sb(W.w)}`) : msg(api, `Xếp xong nhưng sai ${mistakes} lần. <b>${esc(W.w)}</b> ${sb(W.w)}`, 'bad');
            finish(win);
          }
        } else {
          mistakes++; shake(b); api.bad();
          if (mistakes >= 3) { over = true; reveal(); bad(api, `Từ đúng là <b>${esc(W.w)}</b> ${sb(W.w)}`); finish(false); }
          else msg(api, `Chưa đúng, thử lại nhé! (sai ${mistakes}/3) ${sb(W.w)}`, 'bad');
        }
      };
    });
  }

  /* ============================================================
     6. ĐÚNG HAY SAI: hình và tiếng có khớp không?
     ============================================================ */
  function trueFalse(api, d) {
    const words = pool(d);
    const secs = d >= 5 ? 9 - d : 0;
    series(api, 8, (i, finish) => {
      const W = words[i % words.length];
      const same = Math.random() < 0.5;
      const S = same ? W : pick(words.filter((x) => x !== W));
      api.el.innerHTML = `<div class="g-msg">Hình và tiếng có khớp không?</div>
        <div class="g-center">${pic(W, 'big')}<div class="g-word-row"><span class="g-word">${esc(S.w)}</span> ${sb(S.w)}</div></div>
        <div class="g-yesno"><button class="btn yes" data-v="1">✔ Đúng</button><button class="btn no" data-v="0">✖ Sai</button></div>`;
      later(api, () => api.say(S.w), 250);
      let over = false, stop = () => {};
      const end = (ans) => {
        if (over) return; over = true; stop();
        const right = ans === same;
        const html = same ? `Khớp: ${W.pic} là <b>${esc(W.w)}</b> ${sb(W.w)}` : `Không khớp: ${W.pic} là <b>${esc(W.w)}</b> ${sb(W.w)}, còn <b>${esc(S.w)}</b> là ${S.pic}`;
        right ? good(api, html) : bad(api, (ans === null ? 'Hết giờ! ' : '') + html);
        finish(right);
      };
      if (secs) stop = timer(api, secs, () => end(null));
      api.el.querySelector('.g-yesno').onclick = (e) => {
        const b = e.target.closest('button');
        if (b) end(b.dataset.v === '1');
      };
    });
  }

  /* ============================================================
     7. KHỈ MẬP LEO CÂY: trả lời đúng để Khỉ Mập leo lên hái chuối trước khi hết giờ
     ============================================================ */
  function climb(api, d) {
    const GOAL = 8, k = d <= 2 ? 3 : 4;
    const secs = [70, 65, 60, 55, 50, 45, 40, 36][d];
    const words = pool(d);
    let step = 0, ended = false, q = 0;
    api.el.innerHTML = `<div class="g-climb">
        <div class="g-tree"><div class="banana">🍌🍌</div>${[...Array(GOAL)].map(() => '<i></i>').join('')}<div class="g-monkey">${KE.mascot.svg(KE.store.level().lv, 56)}</div></div>
        <div class="g-qa"><div class="g-msg">Nghe và chọn hình đúng!</div><div class="g-q"></div></div>
      </div>`;
    const monkey = api.el.querySelector('.g-monkey');
    const move = () => { monkey.style.bottom = (step / GOAL) * 86 + '%'; api.score(`🐒 ${step}/${GOAL}`); };
    const finish = () => { if (ended) return; ended = true; stopT(); api.done(step, GOAL); };
    const stopT = timer(api, secs, () => { msg(api, 'Hết giờ rồi! ⏰', 'bad'); finish(); });
    move();
    const ask = () => {
      if (ended || !api.alive()) return;
      const opts = shuffle(words.slice()).slice(0, k);
      const W = opts[q++ % k];
      api.el.querySelector('.g-q').innerHTML = `<div class="g-word-row">${sb(W.w, 'big-say')}</div>
        <div class="g-opts">${opts.map((w, j) => `<button class="g-item" data-j="${j}">${w.pic}</button>`).join('')}</div>`;
      api.say(W.w);
      let done = false;
      api.el.querySelector('.g-opts').onclick = (e) => {
        const b = e.target.closest('.g-item');
        if (!b || done || ended) return;
        done = true;
        if (opts[b.dataset.j] === W) {
          step++; move(); good(api, `${W.pic} <b>${esc(W.w)}</b> = ${esc(W.vi)}`);
          if (step >= GOAL) { msg(api, 'Khỉ Mập hái được chuối rồi! 🍌🎉', 'ok'); return finish(); }
          later(api, ask, 700);
        } else {
          b.classList.add('wrong'); bad(api, `Đó là ${opts[b.dataset.j].pic}. ${W.pic} mới là <b>${esc(W.w)}</b>`);
          later(api, ask, 1400);
        }
      };
    };
    ask();
  }

  /* ============================================================
     8. NỐI HÌNH VỚI CHỮ: chọn một hình rồi chọn chữ đúng
     ============================================================ */
  function connect(api, d) {
    const pairs = [3, 4, 4, 5, 5, 6, 6, 6][d];
    const words = pool(d).slice(0, pairs);
    const left = shuffle(words.slice()), right = shuffle(words.slice());
    api.el.innerHTML = `<div class="g-msg">Bấm một hình, rồi bấm chữ đúng của nó (bấm chữ sẽ nghe đọc)</div>
      <div class="g-connect">
        <div class="col">${left.map((w, j) => `<button class="g-item c-pic" data-j="${j}">${w.pic}</button>`).join('')}</div>
        <div class="col">${right.map((w, j) => `<button class="c-word" data-j="${j}">${esc(w.w)}</button>`).join('')}</div>
      </div>`;
    let selP = null, selW = null, found = 0, miss = 0;
    api.score(`🔗 0/${pairs}`);
    const check = () => {
      if (!selP || !selW) return;
      const a = left[selP.dataset.j], b = right[selW.dataset.j];
      const P = selP, Wb = selW; selP = selW = null;
      P.classList.remove('sel'); Wb.classList.remove('sel');
      if (a === b) {
        P.classList.add('ok'); Wb.classList.add('ok'); P.disabled = Wb.disabled = true;
        found++; good(api, `${a.pic} <b>${esc(a.w)}</b> = ${esc(a.vi)} ${sb(a.w)}`);
        api.score(`🔗 ${found}/${pairs}`);
        if (found === pairs) api.done(Math.max(0, pairs - miss), pairs);
      } else { miss++; shake(P); shake(Wb); bad(api, 'Chưa khớp, thử lại nhé!'); }
    };
    api.el.querySelector('.g-connect').onclick = (e) => {
      const p = e.target.closest('.c-pic'), w = e.target.closest('.c-word');
      if (p && !p.disabled) { if (selP) selP.classList.remove('sel'); selP = p; p.classList.add('sel'); KE.sound.click(); }
      if (w && !w.disabled) { if (selW) selW.classList.remove('sel'); selW = w; w.classList.add('sel'); api.say(right[w.dataset.j].w); }
      check();
    };
  }

  /* ============================================================
     9. TÌM HÌNH LẠC LOÀI: hình nào không cùng nhóm?
     ============================================================ */
  function oddOne(api, d) {
    const k = d <= 2 ? 4 : d <= 5 ? 5 : 6;
    series(api, 5, (i, finish) => {
      const [A, B] = shuffle(TOPICS.slice());
      const same = uniq(shuffle(A.words.slice())).slice(0, k - 1);
      const odd = pick(B.words.filter((w) => !same.some((s) => s.pic === w.pic)));
      const items = shuffle([...same, odd]);
      api.el.innerHTML = `<div class="g-msg">Hình nào <b>không cùng nhóm</b> với các hình còn lại?</div>
        <div class="g-opts">${items.map((w, j) => `<div class="g-item-wrap"><button class="g-item" data-j="${j}">${w.pic}</button>${sb(w.w)}</div>`).join('')}</div>`;
      let over = false;
      api.el.querySelector('.g-opts').onclick = (e) => {
        if (isSay(e)) return;
        const b = e.target.closest('.g-item');
        if (!b || over) return;
        over = true;
        const w = items[b.dataset.j];
        const html = `${odd.pic} <b>${esc(odd.w)}</b> thuộc nhóm ${B.icon} ${esc(B.title)}, các hình kia thuộc nhóm ${A.icon} ${esc(A.title)}.`;
        api.say(odd.w);
        api.el.querySelectorAll('.g-item')[items.indexOf(odd)].classList.add('ok');
        if (w === odd) { good(api, 'Đúng rồi! ' + html); finish(true); }
        else { b.classList.add('wrong'); bad(api, html); finish(false); }
      };
    });
  }

  /* ============================================================
     10. PHÂN LOẠI VÀO GIỎ: đồ vật này thuộc giỏ nào?
     ============================================================ */
  function sortBaskets(api, d) {
    const nb = d <= 4 ? 2 : 3;
    const N = 8;
    const bs = shuffle(TOPICS.slice()).slice(0, nb);
    const items = shuffle([].concat(...bs.map((t) => uniq(shuffle(t.words.slice())).slice(0, Math.ceil(N / nb))))).slice(0, N);
    series(api, N, (i, finish) => {
      const W = items[i];
      api.el.innerHTML = `<div class="g-msg">Bỏ hình này vào đúng giỏ nhé!</div>
        <div class="g-center">${pic(W, 'big drop')}<div class="g-word-row"><span class="g-word">${esc(W.w)}</span> ${sb(W.w)}</div></div>
        <div class="g-baskets n${nb}">${bs.map((t, j) => `<div class="g-item-wrap"><button class="basket" data-j="${j}"><span class="bi">🧺${t.icon}</span><b>${esc(t.title)}</b><small>${esc(t.en)}</small></button>${sb(t.en)}</div>`).join('')}</div>`;
      later(api, () => api.say(W.w), 250);
      let over = false;
      api.el.querySelector('.g-baskets').onclick = (e) => {
        if (isSay(e)) return;
        const b = e.target.closest('.basket');
        if (!b || over) return;
        over = true;
        const right = bs[b.dataset.j].id === W.topic, T = topicOf(W);
        const html = `${W.pic} <b>${esc(W.w)}</b> (${esc(W.vi)}) thuộc giỏ ${T.icon} ${esc(T.title)}`;
        if (right) { b.classList.add('ok'); good(api, html); } else { b.classList.add('wrong'); bad(api, html); }
        finish(right);
      };
    });
  }

  /* ============================================================
     11. GHÉP CÂU: xếp các chữ thành câu đúng
     ============================================================ */
  function sentence(api, d) {
    const maxW = [4, 5, 5, 6, 6, 7, 8, 9][d];
    const ok = (w) => { const n = w.ex.split(' ').length; return n >= 3 && n <= maxW; };
    let words = pool(d).filter(ok);
    if (words.length < 5) words = uniq(shuffle(ALL.filter(ok)));
    series(api, 5, (i, finish) => {
      const W = words[i % words.length];
      const toks = W.ex.split(' ');
      const chips = shuffle(toks.map((t, j) => ({ t, j })));
      let pos = 0, mistakes = 0, over = false;
      api.el.innerHTML = `<div class="g-msg">Nghe câu rồi bấm các chữ theo thứ tự ${sb(W.ex)}</div>
        <div class="g-center">${pic(W, 'mid')}<div class="g-vi">${esc(W.exVi)}</div></div>
        <div class="g-line"></div>
        <div class="g-chips">${chips.map((c, j) => `<button class="chip" data-j="${j}">${esc(c.t)}</button>`).join('')}</div>`;
      later(api, () => api.say(W.ex), 300);
      const line = api.el.querySelector('.g-line');
      api.el.querySelector('.g-chips').onclick = (e) => {
        const b = e.target.closest('.chip');
        if (!b || over || b.disabled) return;
        const c = chips[b.dataset.j];
        if (c.t === toks[pos]) {
          pos++; b.disabled = true; KE.sound.click();
          line.insertAdjacentHTML('beforeend', `<span>${esc(c.t)}</span>`);
          if (pos === toks.length) {
            over = true; api.say(W.ex);
            const win = mistakes <= 1;
            win ? good(api, `<i>${esc(W.ex)}</i> ${sb(W.ex)}`) : msg(api, `Xong rồi nhưng sai ${mistakes} lần. <i>${esc(W.ex)}</i> ${sb(W.ex)}`, 'bad');
            finish(win);
          }
        } else {
          mistakes++; shake(b); api.bad();
          if (mistakes >= 3) { over = true; line.innerHTML = toks.map((t) => `<span>${esc(t)}</span>`).join(''); bad(api, `Câu đúng: <i>${esc(W.ex)}</i> ${sb(W.ex)}`); finish(false); }
          else msg(api, `Chưa đúng chữ này, nghe lại nhé! (sai ${mistakes}/3) ${sb(W.ex)}`, 'bad');
        }
      };
    });
  }

  /* ============================================================
     12. CHỮ CÁI ABC: nghe tên chữ cái, chọn chữ đúng
     ============================================================ */
  const LOOKALIKE = ['BDPQ', 'MNW', 'CGOQ', 'EF', 'IJL', 'UVW', 'KX', 'SZ'];
  function letters(api, d) {
    const k = 3 + Math.floor(d / 2);
    const lower = d >= 3;
    series(api, 8, (i, finish) => {
      const T = pick(LETTERS);
      const near = d >= 5 ? (LOOKALIKE.find((g) => g.includes(T)) || '').split('').filter((c) => c !== T) : [];
      const opts = shuffle([T, ...shuffle(near).slice(0, k - 1), ...shuffle(LETTERS.filter((c) => c !== T && !near.includes(c)))].slice(0, k));
      const show = (c) => (lower && d % 2 ? c.toLowerCase() : c);
      api.el.innerHTML = `<div class="g-msg">Nghe tên chữ cái rồi chọn chữ đúng</div>
        <div class="g-center">${sb(T, 'big-say')}</div>
        <div class="g-letters">${opts.map((c) => `<button class="letter" data-c="${c}">${show(c)}</button>`).join('')}</div>`;
      later(api, () => api.say(T), 250);
      let over = false;
      api.el.querySelector('.g-letters').onclick = (e) => {
        const b = e.target.closest('.letter');
        if (!b || over) return;
        over = true;
        const html = `Chữ <b>${T} ${T.toLowerCase()}</b> ${sb(T)}`;
        api.el.querySelector(`.letter[data-c="${T}"]`).classList.add('ok');
        if (b.dataset.c === T) { good(api, html); finish(true); } else { b.classList.add('wrong'); bad(api, html); api.say(T); finish(false); }
      };
    });
  }

  /* ============================================================
     13. ĐẾM SỐ TIẾNG ANH: đếm hình, chọn số đúng
     ============================================================ */
  function counting(api, d) {
    const max = [5, 5, 10, 10, 12, 15, 20, 20][d], min = d >= 5 ? 6 : 1;
    series(api, 6, (i, finish) => {
      const n = rand(min, max), W = pick(ALL);
      const cand = shuffle([n - 2, n - 1, n + 1, n + 2, n + 3].filter((x) => x >= 1 && x <= 20 && x !== n));
      const opts = shuffle([n, ...cand.slice(0, d <= 2 ? 2 : 3)]);
      api.el.innerHTML = `<div class="g-msg">How many? Có bao nhiêu hình? ${sb('How many?')} <small>(bấm vào hình để đánh dấu khi đếm)</small></div>
        <div class="g-count">${[...Array(n)].map(() => `<button class="cnt">${W.pic}</button>`).join('')}</div>
        <div class="g-numbers">${opts.map((x) => `<div class="g-item-wrap"><button class="num" data-n="${x}">${NUMBERS[x]}</button>${sb(NUMBERS[x])}</div>`).join('')}</div>`;
      later(api, () => api.say('How many?'), 250);
      api.el.querySelector('.g-count').onclick = (e) => { const c = e.target.closest('.cnt'); if (c) { c.classList.toggle('counted'); KE.sound.click(); } };
      let over = false;
      api.el.querySelector('.g-numbers').onclick = (e) => {
        if (isSay(e)) return;
        const b = e.target.closest('.num');
        if (!b || over) return;
        over = true;
        const html = `Có <b>${n}</b> hình ${W.pic}: <b>${NUMBERS[n]}</b> ${sb(NUMBERS[n])}`;
        api.say(NUMBERS[n]);
        if (+b.dataset.n === n) { b.classList.add('ok'); good(api, html); finish(true); }
        else { b.classList.add('wrong'); bad(api, html); finish(false); }
      };
    });
  }

  /* ============================================================
     14. HÌNH BÍ ẨN: các ô che dần mở ra, đoán xem là hình gì
     ============================================================ */
  function mystery(api, d) {
    const g = d <= 2 ? 3 : d <= 5 ? 4 : 5;
    const k = d <= 2 ? 3 : 4;
    const gap = Math.max(500, 1300 - d * 100);
    series(api, 5, (i, finish) => {
      const opts = pool(d).slice(0, k), W = pick(opts);
      api.el.innerHTML = `<div class="g-msg">Ô che mở dần ra. Đoán nhanh xem là gì!</div>
        <div class="g-mystery"><span class="g-pic">${W.pic}</span><div class="cover" style="grid-template-columns:repeat(${g},1fr)">${[...Array(g * g)].map(() => '<i></i>').join('')}</div></div>
        <div class="g-numbers">${opts.map((w, j) => `<div class="g-item-wrap"><button class="num" data-j="${j}">${esc(w.w)}</button>${sb(w.w)}</div>`).join('')}</div>`;
      const cells = shuffle([...api.el.querySelectorAll('.cover i')]);
      let over = false, c = 0;
      const open = () => {
        if (over || !api.alive() || c >= cells.length) return;
        cells[c++].classList.add('off');
        setTimeout(open, gap);
      };
      later(api, open, 600);
      api.el.querySelector('.g-numbers').onclick = (e) => {
        if (isSay(e)) return;
        const b = e.target.closest('.num');
        if (!b || over) return;
        over = true;
        cells.forEach((x) => x.classList.add('off'));
        api.say(W.w);
        const html = `Đó là ${W.pic} <b>${esc(W.w)}</b> = ${esc(W.vi)} ${sb(W.w)}`;
        if (opts[b.dataset.j] === W) { b.classList.add('ok'); good(api, (c <= cells.length / 3 ? 'Đoán siêu nhanh! ' : 'Đúng rồi! ') + html); finish(true); }
        else { b.classList.add('wrong'); bad(api, html); finish(false); }
      };
    });
  }

  /* ============================================================
     15. CHUỖI TRÍ NHỚ: nhớ thứ tự các hình sáng lên rồi bấm lại
     ============================================================ */
  function sequence(api, d) {
    const pads = d <= 3 ? 4 : 6;
    const start = 2 + Math.floor(d / 3);
    const ROUNDS = 5;
    const words = pool(d).slice(0, pads);
    let round = 0, lives = 2, seq = [];
    api.el.innerHTML = `<div class="g-msg"></div>
      <div class="g-simon n${pads}">${words.map((w, j) => `<button class="pad p${j}" data-j="${j}">${w.pic}</button>`).join('')}</div>
      <div class="g-center"><button class="btn g-replay" hidden>👀 Xem lại</button></div>`;
    const padEls = [...api.el.querySelectorAll('.pad')];
    const score = () => api.score(`🧠 ${round}/${ROUNDS} · ${'❤️'.repeat(lives)}`);
    let input = false, pos = 0;
    const light = (j) => { padEls.forEach((p) => p.classList.remove('lit')); if (j != null) padEls[j].classList.add('lit'); };
    const play = () => {
      input = false; pos = 0;
      api.el.querySelector('.g-replay').hidden = true;
      msg(api, `Nhìn và nghe thứ tự ${seq.length} hình nhé... 👀`);
      let ended = false;
      const ready = () => {
        if (ended || !api.alive()) return; ended = true;
        light(null); input = true;
        api.el.querySelector('.g-replay').hidden = false;
        msg(api, 'Đến lượt bé! Bấm lại đúng thứ tự.');
      };
      later(api, () => {
        KE.speech.speakList(seq.map((j) => words[j].w), { lang: 'en-US', rate: 0.85, onItem: (i) => light(seq[i]), onEnd: () => later(api, ready, 400) });
        setTimeout(ready, seq.length * 2200 + 1500);
      }, 700);
    };
    const nextRound = () => {
      if (!api.alive()) return;
      if (round >= ROUNDS) return api.done(round, ROUNDS);
      seq = [...Array(start + round)].map(() => rand(0, pads - 1));
      for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = (seq[i] + 1 + rand(0, pads - 2)) % pads;
      score(); play();
    };
    api.el.querySelector('.g-replay').onclick = () => { if (input) play(); };
    api.el.querySelector('.g-simon').onclick = (e) => {
      const b = e.target.closest('.pad');
      if (!b || !input) return;
      const j = +b.dataset.j;
      light(j); setTimeout(() => b.classList.remove('lit'), 350);
      api.say(words[j].w);
      if (j === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          input = false; round++; score();
          good(api, `Nhớ giỏi quá! ${seq.map((x) => words[x].pic).join(' ')}`);
          later(api, nextRound, 1500);
        }
      } else {
        input = false; lives--; score(); shake(b);
        bad(api, `Thứ tự đúng: ${seq.map((x) => words[x].pic).join(' → ')}`);
        if (lives <= 0) later(api, () => api.done(round, ROUNDS), 1200);
        else later(api, play, 2200);
      }
    };
    nextRound();
  }

  /* ---------- Danh sách 15 trò chơi ---------- */
  const GAMES = [
    ['lat-the', '🃏', 'Lật thẻ trí nhớ', 'Lật hai thẻ, tìm cặp hình và chữ giống nhau. Nhớ vị trí các thẻ nhé!', memory],
    ['bong-bay', '🎈', 'Bắn bóng bay', 'Nghe từ tiếng Anh rồi bấm quả bóng có hình đúng trước khi bóng bay mất.', balloons],
    ['dap-hinh', '🔨', 'Đập hình đúng', 'Hình sẽ nhô lên từ các lỗ. Chỉ đập hình đúng với từ vừa nghe. Đập đủ 8 lần để thắng!', whack],
    ['di-cho', '🛒', 'Đi chợ cùng Khỉ Mập', 'Nghe danh sách đồ cần mua, rồi chọn đủ các món bỏ vào giỏ.', shopping],
    ['xep-chu', '🔠', 'Xếp chữ cái', 'Nhìn hình, nghe từ, rồi bấm các chữ cái theo đúng thứ tự.', spell],
    ['dung-sai', '✅', 'Đúng hay sai', 'Nhìn hình và nghe từ. Nếu khớp thì bấm Đúng, không khớp thì bấm Sai.', trueFalse],
    ['leo-cay', '🌴', 'Khỉ Mập leo cây', 'Mỗi câu đúng, Khỉ Mập leo lên một bậc. Leo tới chùm chuối trước khi hết giờ nhé!', climb],
    ['noi-hinh', '🔗', 'Nối hình với chữ', 'Bấm một hình, rồi bấm chữ tiếng Anh đúng của hình đó.', connect],
    ['lac-loai', '🔍', 'Tìm hình lạc loài', 'Có một hình không cùng nhóm với các hình còn lại. Bé tìm ra nó nhé!', oddOne],
    ['phan-loai', '🧺', 'Phân loại vào giỏ', 'Bỏ mỗi hình vào đúng giỏ của nhóm nó.', sortBaskets],
    ['ghep-cau', '🧩', 'Ghép câu', 'Nghe câu tiếng Anh rồi bấm các chữ theo đúng thứ tự để ghép thành câu.', sentence],
    ['chu-cai', '🔤', 'Chữ cái A B C', 'Nghe tên chữ cái tiếng Anh rồi chọn chữ đúng.', letters],
    ['dem-so', '🔢', 'Đếm số tiếng Anh', 'Đếm xem có bao nhiêu hình, rồi chọn số đếm tiếng Anh đúng.', counting],
    ['hinh-bi-an', '🖼️', 'Hình bí ẩn', 'Các ô che sẽ mở dần ra. Đoán xem hình bí ẩn là gì càng nhanh càng giỏi!', mystery],
    ['chuoi-nho', '🧠', 'Chuỗi trí nhớ', 'Các hình sẽ sáng lên lần lượt. Nhớ thứ tự rồi bấm lại giống hệt nhé!', sequence],
  ];
  const STAGES = [
    ['Màn 1', '🌱'], ['Màn 2', '🍀'], ['Màn 3', '🌟'], ['Màn 4', '🔥'], ['Màn 5', '🏆'],
    ['Đấu Boss 1', '👾', true], ['Đấu Boss 2', '🐲', true], ['Đấu Boss 3', '👹', true],
  ];

  sub.desc = 'Từ vựng 15 chủ đề, nghe hiểu và 15 trò chơi vui';
  sub.groups.push({ id: 'games', name: 'Phần 3: Trò chơi vui', icon: '🎮' });
  GAMES.forEach(([id, icon, title, howto, fn]) => {
    sub.lessons.push({
      id: 'game-' + id, group: 'games', grade: 'Trò chơi', icon, title, howto,
      levels: STAGES.map(([t, ic, boss], d) => ({ title: boss ? t : ['Làm quen', 'Khởi động', 'Tăng tốc', 'Thử thách', 'Siêu sao'][d], icon: ic, boss: !!boss, game: (api) => fn(api, d, !!boss) })),
    });
  });

  /* Các câu cần có file giọng Mỹ (công cụ tạo âm thanh đọc danh sách này) */
  KE.gameTexts = [...LETTERS, ...NUMBERS.slice(1), 'How many?', ...TOPICS.map((t) => t.en)];
})();
