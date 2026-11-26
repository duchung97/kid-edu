/* ============================================================
   MÔN TOÁN (lớp 1 - 3): Phép cộng, phép trừ, phép nhân
   Mỗi bài học gồm:
     - theory: danh sách đoạn lý thuyết (được đọc to), có thể kèm ví dụ minh hoạ (ex)
     - levels: các màn chơi, mỗi màn sinh câu hỏi trắc nghiệm ngẫu nhiên
   ============================================================ */
window.KE = window.KE || {};
KE.subjects = KE.subjects || [];

(function () {
  const U = KE.util;
  const { rand, pick, shuffle, fmt } = U;
  const SYM = { add: '+', sub: '−', mul: '×' };
  const NAMES = ['Lan', 'Minh', 'Hoa', 'Nam', 'An', 'Bình', 'Mai', 'Khôi', 'Linh', 'Tú'];
  const EMOJI = ['🍎', '🍊', '⭐', '🌸', '🐟', '🍓', '🎈', '🐥'];

  /* ---------- Hình minh hoạ ---------- */
  const row = (e, n, cls) => `<span class="items ${cls || ''}">${Array(n).fill(e).join('')}</span>`;
  function visual(op, a, b) {
    const e = pick(EMOJI);
    if (op === 'add') return `<div class="visual">${row(e, a)}<span class="op">+</span>${row(e, b)}</div>`;
    if (op === 'sub') return `<div class="visual">${row(e, a - b)}${row(e, b, 'gone')}</div><div class="visual-note">Có ${a}, bớt đi ${b} (hình mờ)</div>`;
    if (op === 'mul') {
      let g = '';
      for (let i = 0; i < b; i++) g += `<span class="group">${row(e, a)}</span>`;
      return `<div class="visual">${g}</div><div class="visual-note">${b} nhóm, mỗi nhóm ${a}</div>`;
    }
    return '';
  }
  function column(a, op, b) {
    const w = Math.max(fmt(a).length, fmt(b).length) + 2;
    const pad = (s) => s.padStart(w, ' ');
    return `<div class="column"><div>${pad(fmt(a))}</div><div><span class="col-op">${op}</span>${pad(fmt(b)).slice(1)}</div><div class="col-line"></div><div class="col-res">${pad(fmt(op === '+' ? a + b : op === '−' ? a - b : a * b))}</div></div>`;
  }
  function table(n) {
    let h = `<div class="mtable"><div class="mtable-h">Bảng nhân ${n}</div>`;
    for (let i = 1; i <= 10; i++) h += `<div>${n} × ${i} = <b>${n * i}</b></div>`;
    return h + '</div>';
  }

  /* ---------- Sinh cặp số ---------- */
  const digitsR = (n) => String(n).split('').reverse().map(Number);
  function hasCarry(a, b) {
    const x = digitsR(a), y = digitsR(b);
    let c = 0;
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const s = (x[i] || 0) + (y[i] || 0) + c;
      if (s >= 10) return true;
      c = 0;
    }
    return false;
  }
  /* a có nd chữ số, b có bd chữ số, tổng < 10^nd, có/không nhớ */
  function genAdd(nd, carry, bd) {
    bd = bd || nd;
    for (let t = 0; t < 500; t++) {
      const a = rand(10 ** (nd - 1), 10 ** nd - 1);
      const b = rand(bd === 1 ? 1 : 10 ** (bd - 1), 10 ** bd - 1);
      if (a + b < 10 ** nd && hasCarry(a, b) === carry) return [a, b];
    }
    return [10 ** (nd - 1), 1];
  }
  const mulNoCarry = (a, b) => digitsR(a).every((x) => x * b < 10);
  function genMul(nd, carry) {
    for (let t = 0; t < 500; t++) {
      const a = rand(10 ** (nd - 1), 10 ** nd - 1);
      const b = rand(2, 9);
      if (mulNoCarry(a, b) !== carry && a * b < 10000) return [a, b];
    }
    return [12, 3];
  }

  /* ---------- Tính và giải thích ---------- */
  function calc(op, a, b) { return op === 'add' ? a + b : op === 'sub' ? a - b : a * b; }

  function explainCalc(L, a, b) {
    const op = L.op;
    if (op === 'add') return L.small ? U.explainAddSmall(a, b) : U.explainAddColumn(a, b);
    if (op === 'sub') return L.small ? U.explainSubSmall(a, b) : U.explainSubColumn(a, b);
    // phép nhân
    if (a <= 10 && b <= 10) {
      const p = a * b;
      if (b === 1) return `Số nào nhân với 1 cũng bằng chính số đó: ${a} × 1 = <b>${a}</b>.`;
      let t = `${a} × ${b} nghĩa là ${a} được lấy ${b} lần`;
      if (b <= 6) t += `: ${Array(b).fill(a).join(' + ')} = <b>${p}</b>.`;
      else t += `.<br>Ta nhớ ${a} × ${b - 1} = ${a * (b - 1)}, thêm ${a} nữa: ${a * (b - 1)} + ${a} = <b>${p}</b>.`;
      return t;
    }
    return U.explainMulColumn(a, b);
  }

  function distractors(L, a, b, r) {
    let d;
    if (L.op === 'add') d = [r - 10, r + 10, r + 1, r - 1, a - b > 0 ? a - b : r + 2];
    else if (L.op === 'sub') d = [r + 10, r - 10, r + 1, r - 1, a + b];
    else d = [r + a, r - a, r + b, r - b, a + b, r + 10];
    // bài nhỏ (lớp 1): bỏ các đáp án nhiễu lệch quá xa
    return L.small ? d.filter((x) => Math.abs(x - r) < 10) : d;
  }

  /* ---------- Các dạng câu hỏi ---------- */
  const Q = {
    calc(L, d) {
      const [a, b] = L.pair(d);
      const r = calc(L.op, a, b);
      const prompt = `${fmt(a)} ${SYM[L.op]} ${fmt(b)} = ?`;
      return {
        key: prompt,
        prompt,
        say: `${a} ${SYM[L.op]} ${b} bằng mấy?`,
        visual: L.visual && d <= 1 ? visual(L.op, a, b) : '',
        choices: U.numberChoices(r, distractors(L, a, b, r)).map((x) => fmt(+x)),
        answer: fmt(r),
        explain: explainCalc(L, a, b),
      };
    },

    missing(L, d) {
      const [a, b] = L.pair(d);
      const r = calc(L.op, a, b);
      const s = SYM[L.op];
      let prompt, ans, ex;
      if (L.op === 'add') {
        if (Math.random() < 0.5) {
          prompt = `${fmt(a)} + ? = ${fmt(r)}`; ans = b;
          ex = `Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: ${fmt(r)} − ${fmt(a)} = <b>${fmt(b)}</b>.<br>Thử lại: ${fmt(a)} + ${fmt(b)} = ${fmt(r)} ✔`;
        } else {
          prompt = `? + ${fmt(b)} = ${fmt(r)}`; ans = a;
          ex = `Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: ${fmt(r)} − ${fmt(b)} = <b>${fmt(a)}</b>.<br>Thử lại: ${fmt(a)} + ${fmt(b)} = ${fmt(r)} ✔`;
        }
      } else if (L.op === 'sub') {
        if (Math.random() < 0.5) {
          prompt = `${fmt(a)} − ? = ${fmt(r)}`; ans = b;
          ex = `Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu: ${fmt(a)} − ${fmt(r)} = <b>${fmt(b)}</b>.<br>Thử lại: ${fmt(a)} − ${fmt(b)} = ${fmt(r)} ✔`;
        } else {
          prompt = `? − ${fmt(b)} = ${fmt(r)}`; ans = a;
          ex = `Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: ${fmt(r)} + ${fmt(b)} = <b>${fmt(a)}</b>.<br>Thử lại: ${fmt(a)} − ${fmt(b)} = ${fmt(r)} ✔`;
        }
      } else {
        prompt = `${a} × ? = ${r}`; ans = b;
        const seq = [];
        for (let i = 1; i <= b; i++) seq.push(`${a} × ${i} = ${a * i}`);
        ex = `Nhẩm bảng nhân ${a}: ${seq.join('; ')}.<br>Vậy số cần điền là <b>${b}</b>.`;
      }
      if (L.small && L.op !== 'mul') {
        ex = (L.op === 'add'
          ? `Ta nhẩm: ${prompt.replace('?', 'mấy').replace('=', 'bằng')}? `
          : `Ta nhẩm: ${prompt.replace('?', 'mấy').replace('=', 'bằng')}? `) + '<br>' + ex;
      }
      return {
        key: prompt, prompt, say: prompt.replace('?', 'mấy') + '. Số nào thay cho dấu hỏi?',
        choices: U.numberChoices(ans, [ans + 1, ans - 1, r + (L.op === 'mul' ? a : ans), ans + 10]).map((x) => fmt(+x)),
        answer: fmt(ans), explain: ex,
      };
    },

    compare(L, d) {
      const [a, b] = L.pair(d);
      const r = calc(L.op, a, b);
      const delta = pick([-2, -1, 0, 0, 1, 2, r >= 20 ? 10 : 3, r >= 20 ? -10 : -3]);
      const c = Math.max(0, r + delta);
      const sign = r > c ? '>' : r < c ? '<' : '=';
      const expr = `${fmt(a)} ${SYM[L.op]} ${fmt(b)}`;
      const word = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' }[sign];
      return {
        key: expr + c,
        prompt: `${expr} <span class="blank">?</span> ${fmt(c)}`,
        say: `So sánh ${a} ${SYM[L.op]} ${b} với ${c}. Chọn dấu lớn hơn, bé hơn hay bằng?`,
        choices: ['>', '<', '='],
        answer: sign,
        explain: `Tính trước: ${expr} = ${fmt(r)}.<br>Vì ${fmt(r)} ${word} ${fmt(c)} nên điền dấu <b>${sign}</b>.`,
      };
    },

    which(L, d) {
      const [a, b] = L.pair(d);
      const r = calc(L.op, a, b);
      const opts = [[a, b]];
      const seen = new Set([r]);
      for (let t = 0; t < 200 && opts.length < 4; t++) {
        const p = L.pair(d);
        const v = calc(L.op, p[0], p[1]);
        if (!seen.has(v)) { seen.add(v); opts.push(p); }
      }
      const s = SYM[L.op];
      const label = (p) => `${fmt(p[0])} ${s} ${fmt(p[1])}`;
      const list = opts.map((p) => `${label(p)} = ${fmt(calc(L.op, p[0], p[1]))}${p === opts[0] ? ' ✔' : ''}`);
      return {
        key: 'which' + r,
        prompt: `Phép tính nào có kết quả bằng <b>${fmt(r)}</b>?`,
        say: `Phép tính nào có kết quả bằng ${r}?`,
        choices: shuffle(opts.map(label)),
        answer: label(opts[0]),
        small: true,
        explain: `Tính từng phép tính:<br>• ${list.join('<br>• ')}`,
      };
    },

    word(L, d) {
      const [a, b] = L.pair(d);
      const r = calc(L.op, a, b);
      const n = pick(NAMES);
      const m = pick(NAMES.filter((x) => x !== n));
      const big = Math.max(a, b, r) > 100;
      const T = {
        add: [
          !big && [`${n} có ${a} viên bi, ${m} cho ${n} thêm ${b} viên bi. Hỏi ${n} có tất cả bao nhiêu viên bi?`, 'viên bi'],
          !big && [`Trên cành có ${a} con chim, có thêm ${b} con chim bay đến. Hỏi trên cành có tất cả bao nhiêu con chim?`, 'con chim'],
          [`Thư viện có ${fmt(a)} quyển sách, nhà trường mua thêm ${fmt(b)} quyển sách. Hỏi thư viện có tất cả bao nhiêu quyển sách?`, 'quyển sách'],
          [`Một trang trại có ${fmt(a)} con gà và ${fmt(b)} con vịt. Hỏi trang trại có tất cả bao nhiêu con gà và vịt?`, 'con'],
        ],
        sub: [
          !big && [`${n} có ${a} cái kẹo, ${n} cho em ${b} cái kẹo. Hỏi ${n} còn lại bao nhiêu cái kẹo?`, 'cái kẹo'],
          !big && [`Trên cây có ${a} quả xoài, mẹ hái xuống ${b} quả. Hỏi trên cây còn lại bao nhiêu quả xoài?`, 'quả xoài'],
          [`Thư viện có ${fmt(a)} quyển sách, các bạn đã mượn ${fmt(b)} quyển. Hỏi thư viện còn lại bao nhiêu quyển sách?`, 'quyển sách'],
          [`Một cửa hàng có ${fmt(a)} quyển vở, đã bán ${fmt(b)} quyển. Hỏi cửa hàng còn lại bao nhiêu quyển vở?`, 'quyển vở'],
        ],
        mul: [
          [`Mỗi hộp có ${fmt(a)} cái bánh. Hỏi ${b} hộp như thế có bao nhiêu cái bánh?`, 'cái bánh', 'hộp'],
          [`Mỗi bạn có ${fmt(a)} viên bi. Hỏi ${b} bạn có tất cả bao nhiêu viên bi?`, 'viên bi', 'bạn'],
          [`Mỗi xe chở ${fmt(a)} bao gạo. Hỏi ${b} xe như thế chở được bao nhiêu bao gạo?`, 'bao gạo', 'xe'],
        ],
      }[L.op].filter(Boolean);
      const [text, unit, per] = pick(T);
      let lead;
      if (L.op === 'add') lead = `Muốn biết có tất cả bao nhiêu, ta gộp lại bằng phép cộng: ${fmt(a)} + ${fmt(b)} = ${fmt(r)}.`;
      else if (L.op === 'sub') lead = `Muốn biết còn lại bao nhiêu, ta bớt đi bằng phép trừ: ${fmt(a)} − ${fmt(b)} = ${fmt(r)}.`;
      else lead = `Mỗi ${per} có ${fmt(a)} ${unit}, có ${b} ${per} tức là ${fmt(a)} được lấy ${b} lần. Ta làm phép nhân: ${fmt(a)} × ${b} = ${fmt(r)}.`;
      return {
        key: text,
        prompt: text,
        say: text,
        small: true,
        choices: U.numberChoices(r, distractors(L, a, b, r)).map((x) => fmt(+x)),
        answer: fmt(r),
        explain: `${lead}<br><span class="dap-so">Đáp số: ${fmt(r)} ${unit}.</span><div class="sub-explain">${explainCalc(L, a, b)}</div>`,
      };
    },

    /* Chỉ dùng cho bài "Phép nhân là gì?" */
    toMul(L, d) {
      const [a, b] = L.pair(d);
      const sum = Array(b).fill(a).join(' + ');
      const right = `${a} × ${b}`;
      const wrong = shuffle([...new Set([`${b} × ${b}`, `${a} + ${b}`, `${a} × ${a}`, `${a} × ${b + 1}`, `${a} + ${b + 1}`, `${a} × ${b - 1}`])]
        .filter((x) => x !== right && x !== `${b} × ${a}`)).slice(0, 3);
      return {
        key: 'tomul' + a + b,
        prompt: `Viết <b>${sum}</b> thành phép nhân:`,
        say: `Viết ${sum} thành phép nhân.`,
        small: true,
        choices: shuffle([right, ...wrong]),
        answer: right,
        explain: `Số ${a} được lấy ${b} lần nên ta viết ${a} × ${b}.<br>${sum} = ${a} × ${b} = <b>${a * b}</b>.`,
      };
    },
    fromMul(L, d) {
      const [a, b] = L.pair(d);
      const right = Array(b).fill(a).join(' + ');
      const wrong = shuffle([...new Set([`${a} + ${b}`, Array(a).fill(b + 1).join(' + '), Array(Math.max(2, b - 1)).fill(a).join(' + '), Array(b + 1).fill(a).join(' + '), Array(b).fill(a + 1).join(' + ')])]
        .filter((x) => x !== right)).slice(0, 3);
      return {
        key: 'frommul' + a + b,
        prompt: `<b>${a} × ${b}</b> bằng tổng nào?`,
        say: `${a} nhân ${b} bằng tổng nào?`,
        small: true,
        choices: shuffle([right, ...wrong]),
        answer: right,
        explain: `${a} × ${b} nghĩa là ${a} được lấy ${b} lần: ${right} = <b>${a * b}</b>.`,
      };
    },
  };

  /* ---------- Kế hoạch 5 màn chơi chung ---------- */
  const PLAN = [
    { title: 'Khởi động', icon: '🚀', types: ['calc'] },
    { title: 'Tăng tốc', icon: '⚡', types: ['calc', 'compare', 'calc'] },
    { title: 'Tìm số bí ẩn', icon: '🔍', types: ['missing', 'missing', 'calc'] },
    { title: 'Giải toán có lời văn', icon: '📚', types: ['word', 'word', 'calc'] },
    { title: 'Thử thách Vàng', icon: '🏆', types: ['calc', 'missing', 'word', 'compare', 'which'] },
  ];
  const QUESTIONS_PER_LEVEL = 5;

  /* ============================================================
     ĐẤU BOSS: bài toán tư duy khó hơn, dùng kiến thức của bài học
     t = 1, 2, 3 (Boss càng về sau càng khó)
     ============================================================ */
  const ev = (op, x, y) => (op === '+' ? x + y : op === '−' ? x - y : x * y);
  const numQ = (key, prompt, say, ans, extra, explain) => ({
    key, prompt, say, small: true,
    choices: U.numberChoices(ans, extra).map((x) => fmt(+x)),
    answer: fmt(ans), explain,
  });
  function stepFor(M) {
    if (M <= 10) return rand(1, 2);
    if (M <= 20) return rand(2, 4);
    if (M <= 100) return rand(3, 15);
    if (M <= 1000) return rand(3, 15) * 10 + pick([0, 5]);
    return rand(3, 15) * 100 + pick([0, 50]);
  }
  const unitFor = (M) => (M <= 100 ? pick([['viên bi', 'viên bi'], ['bông hoa', 'bông hoa'], ['nhãn vở', 'nhãn vở']]) : pick([['quyển sách', 'quyển sách'], ['cây xanh', 'cây'], ['viên gạch', 'viên gạch']]));

  const B = {
    /* Dãy tính nhiều bước */
    chain(L, t) {
      const M = L.max;
      for (let k = 0; k < 400; k++) {
        const lo = M >= 100 ? Math.floor(M / 20) : 1;
        const a = rand(lo, M), b = rand(lo, M), c = rand(lo, M);
        const ops = t >= 3 ? pick([['+', '−'], ['−', '+']]) : L.op === 'add' ? ['+', '+'] : ['−', '−'];
        const x = ev(ops[0], a, b), r = ev(ops[1], x, c);
        if (x < 0 || x > M || r < 0 || r > M || r === 0) continue;
        const prompt = `${fmt(a)} ${ops[0]} ${fmt(b)} ${ops[1]} ${fmt(c)} = ?`;
        return numQ(prompt, `<span class="boss-expr">${prompt}</span>`, `${a} ${ops[0]} ${b} ${ops[1]} ${c} bằng mấy?`, r,
          [x, r + 1, r - 1, ev(ops[1] === '+' ? '−' : '+', x, c)],
          `Với dãy tính chỉ có cộng, trừ, ta tính lần lượt <b>từ trái sang phải</b>:<br>• Bước 1: ${fmt(a)} ${ops[0]} ${fmt(b)} = ${fmt(x)}<br>• Bước 2: ${fmt(x)} ${ops[1]} ${fmt(c)} = <b>${fmt(r)}</b>`);
      }
      return null;
    },

    /* Quy luật dãy số */
    seq(L, t) {
      const M = L.max, s = stepFor(M), up = L.op === 'add';
      const start = up ? rand(0, M - 4 * s) : rand(4 * s, M);
      const terms = [0, 1, 2, 3, 4].map((i) => (up ? start + i * s : start - i * s));
      const miss = t === 1 ? 4 : rand(1, 4);
      const shown = terms.map((x, i) => (i === miss ? '<span class="blank">?</span>' : fmt(x))).join(', ');
      return numQ('seq' + terms.join(), `Tìm quy luật rồi điền số còn thiếu:<br><span class="boss-expr">${shown}</span>`,
        `Tìm quy luật rồi điền số còn thiếu: ${terms.map((x, i) => (i === miss ? 'mấy' : x)).join(', ')}`,
        terms[miss], [terms[miss] + 1, terms[miss] - 1, up ? terms[miss] + s : terms[miss] - s, up ? terms[miss] - s : terms[miss] + s],
        `Hai số liền nhau ${up ? 'hơn' : 'kém'} nhau ${fmt(s)} đơn vị (ví dụ ${fmt(terms[miss === 0 ? 1 : 0])} ${up ? '+' : '−'} ${fmt(s)} = ${fmt(terms[miss === 0 ? 2 : 1])}).<br>Mỗi số sau ${up ? 'cộng thêm' : 'bớt đi'} ${fmt(s)}, nên số cần điền là <b>${fmt(terms[miss])}</b>.<br>Dãy đầy đủ: ${terms.map(fmt).join(', ')}.`);
    },

    /* Bài toán nhiều hơn / ít hơn, có thể 2 bước */
    moreLess(L, t) {
      const M = L.max, up = L.op === 'add';
      const [X, Y] = shuffle(NAMES).slice(0, 2);
      const [unit] = unitFor(M);
      const two = t >= 2;
      for (let k = 0; k < 400; k++) {
        const a = rand(M >= 100 ? Math.floor(M / 10) : 2, M), b = rand(1, M >= 100 ? Math.floor(M / 2) : Math.max(2, M / 2));
        const y = up ? a + b : a - b;
        const r = two ? a + y : y;
        if (y <= 0 || y > M || r > M) continue;
        const rel = up ? 'nhiều hơn' : 'ít hơn';
        const q = `${X} có ${fmt(a)} ${unit}. ${Y} có ${rel} ${X} ${fmt(b)} ${unit}. ` + (two ? `Hỏi cả hai bạn có tất cả bao nhiêu ${unit}?` : `Hỏi ${Y} có bao nhiêu ${unit}?`);
        let ex = `“${rel[0].toUpperCase() + rel.slice(1)}” nên ta làm phép ${up ? 'cộng' : 'trừ'}.<br>• ${two ? 'Bước 1: ' : ''}Số ${unit} của ${Y}: ${fmt(a)} ${up ? '+' : '−'} ${fmt(b)} = ${fmt(y)}`;
        if (two) ex += `<br>• Bước 2: Cả hai bạn có: ${fmt(a)} + ${fmt(y)} = ${fmt(r)}`;
        ex += `<br><span class="dap-so">Đáp số: ${fmt(r)} ${unit}.</span>`;
        if (two) ex += `<div class="sub-explain">Bẫy thường gặp: chỉ tính số ${unit} của ${Y} (${fmt(y)}) mà quên cộng thêm của ${X}.</div>`;
        return numQ(q, q, q, r, two ? [y, up ? a - b + a : a + b + a, a + b] : [up ? a - b : a + b, y + 1, y - 1], ex);
      }
      return null;
    },

    /* Cân bằng hai vế */
    balance(L, t) {
      const M = L.max;
      for (let k = 0; k < 400; k++) {
        const lo = M >= 100 ? Math.floor(M / 20) : 1;
        const a = rand(lo, M), b = rand(lo, M), c = rand(lo, M);
        let right, ans, prompt, ex;
        if (L.op === 'add') {
          right = b + c; ans = right - a;
          if (right > M || ans <= 0) continue;
          prompt = `${fmt(a)} + ? = ${fmt(b)} + ${fmt(c)}`;
          ex = `Tính vế phải trước: ${fmt(b)} + ${fmt(c)} = ${fmt(right)}.<br>Vậy ${fmt(a)} + ? = ${fmt(right)}, số cần tìm là ${fmt(right)} − ${fmt(a)} = <b>${fmt(ans)}</b>.`;
        } else {
          right = b - c; ans = a - right;
          if (right <= 0 || ans <= 0 || a > M) continue;
          prompt = `${fmt(a)} − ? = ${fmt(b)} − ${fmt(c)}`;
          ex = `Tính vế phải trước: ${fmt(b)} − ${fmt(c)} = ${fmt(right)}.<br>Vậy ${fmt(a)} − ? = ${fmt(right)}, số cần tìm là ${fmt(a)} − ${fmt(right)} = <b>${fmt(ans)}</b>.`;
        }
        return numQ(prompt, `Hai bên bằng nhau. Tìm số thay cho dấu hỏi:<br><span class="boss-expr">${prompt}</span>`,
          `Hai bên bằng nhau. ${prompt.replace('?', 'mấy')}`, ans, [right, ans + 1, ans - 1, ans + 10], ex);
      }
      return null;
    },

    /* Đố vui hình con vật / trái cây */
    symbols(L, t) {
      const M = L.max;
      const [P, Q2] = shuffle(['🍎', '🍌', '🐱', '🐶', '⭐', '🌸']).slice(0, 2);
      for (let k = 0; k < 400; k++) {
        const x = rand(1, Math.floor(M / 2)), y = rand(1, M);
        const s = L.op === 'add' ? x + y : x - y;
        if (s <= 0 || s > M) continue;
        const sg = L.op === 'add' ? '+' : '−';
        const prompt = `${P} + ${P} = ${fmt(2 * x)}<br>${P} ${sg} ${Q2} = ${fmt(s)}<br>Hỏi ${Q2} = ?`;
        return numQ('sym' + x + y, `<span class="boss-expr">${prompt}</span>`, `Hai hình giống nhau cộng lại bằng ${2 * x}. Hình thứ nhất ${sg} hình thứ hai bằng ${s}. Hỏi hình thứ hai bằng mấy?`,
          y, [x, s, 2 * x, y + 1],
          `• ${P} + ${P} = ${fmt(2 * x)}, hai số giống nhau cộng lại bằng ${fmt(2 * x)} nên ${P} = ${fmt(x)} (vì ${fmt(x)} + ${fmt(x)} = ${fmt(2 * x)}).<br>• ${fmt(x)} ${sg} ${Q2} = ${fmt(s)} nên ${Q2} = ${L.op === 'add' ? `${fmt(s)} − ${fmt(x)}` : `${fmt(x)} − ${fmt(s)}`} = <b>${fmt(y)}</b>.`);
      }
      return null;
    },

    /* Bài toán tuổi (chỉ cho bài số nhỏ) */
    age(L, t) {
      for (let k = 0; k < 400; k++) {
        const a = rand(5, 12), b = rand(2, 6), c = rand(1, 5);
        if (L.op === 'add') {
          const r = a + b + c;
          if (r > Math.max(20, L.max)) continue;
          const q = `Năm nay em ${a} tuổi. Anh hơn em ${b} tuổi. Hỏi ${c} năm nữa anh bao nhiêu tuổi?`;
          return numQ(q, q, q, r, [a + b, a + c, r + 1, r - 1],
            `• Bước 1: Năm nay anh: ${a} + ${b} = ${a + b} tuổi.<br>• Bước 2: ${c} năm nữa anh: ${a + b} + ${c} = ${r} tuổi.<br><span class="dap-so">Đáp số: ${r} tuổi.</span>`);
        }
        const r = a - b - c;
        if (r < 1 || a > Math.max(20, L.max)) continue;
        const q = `Năm nay anh ${a} tuổi. Em kém anh ${b} tuổi. Hỏi ${c} năm trước em bao nhiêu tuổi?`;
        return numQ(q, q, q, r, [a - b, a - c, r + 1, r + 2],
          `• Bước 1: Năm nay em: ${a} − ${b} = ${a - b} tuổi.<br>• Bước 2: ${c} năm trước em: ${a - b} − ${c} = ${r} tuổi.<br><span class="dap-so">Đáp số: ${r} tuổi.</span>`);
      }
      return null;
    },

    /* ---------- Boss phép nhân ---------- */
    mseq(L, t) {
      const [a] = L.bossPair(t);
      const k0 = a >= 10 ? 1 : rand(1, 5);
      const terms = [0, 1, 2, 3, 4].map((i) => a * (k0 + i));
      const miss = t === 1 ? 4 : rand(1, 4);
      const shown = terms.map((x, i) => (i === miss ? '<span class="blank">?</span>' : fmt(x))).join(', ');
      return numQ('mseq' + terms.join(), `Tìm quy luật rồi điền số còn thiếu:<br><span class="boss-expr">${shown}</span>`,
        `Tìm quy luật rồi điền số còn thiếu: ${terms.map((x, i) => (i === miss ? 'mấy' : x)).join(', ')}`,
        terms[miss], [terms[miss] + 1, terms[miss] - 1, terms[miss] + a, terms[miss] - a],
        `Mỗi số sau hơn số trước ${fmt(a)} đơn vị, đó là ${fmt(a)} nhân lần lượt với ${k0}, ${k0 + 1}, ${k0 + 2}...: ${terms.map((x, i) => `${fmt(a)} × ${k0 + i} = ${fmt(x)}`).join('; ')}.<br>Số cần điền là <b>${fmt(terms[miss])}</b>.`);
    },
    mulAdd(L, t) {
      const [a, b] = L.bossPair(t);
      const p = a * b;
      const plus = t === 1 ? true : Math.random() < 0.5;
      const c = plus ? rand(2, Math.max(3, Math.floor(p / 2))) : rand(1, p - 1);
      const r = plus ? p + c : p - c;
      const sg = plus ? '+' : '−';
      const prompt = `${fmt(a)} × ${b} ${sg} ${fmt(c)} = ?`;
      const wrong = plus ? a * (b + c) : a * Math.max(1, b - c);
      return numQ(prompt, `<span class="boss-expr">${prompt}</span>`, `${a} nhân ${b} ${sg} ${c} bằng mấy?`, r, [wrong, p, r + 1, r - 1],
        `Trong dãy tính có nhân và ${plus ? 'cộng' : 'trừ'}, ta <b>nhân trước, ${plus ? 'cộng' : 'trừ'} sau</b>:<br>• Bước 1: ${fmt(a)} × ${b} = ${fmt(p)}<br>• Bước 2: ${fmt(p)} ${sg} ${fmt(c)} = <b>${fmt(r)}</b>`);
    },
    legs(L, t) {
      const g = rand(2, 9), d = rand(2, 9);
      const r = g * 2 + d * 4;
      const q = `Trong sân có ${g} con gà và ${d} con chó. Hỏi có tất cả bao nhiêu cái chân?`;
      return numQ(q, q, q, r, [(g + d) * 2, (g + d) * 4, g * 2, d * 4, r + 2],
        `Mỗi con gà có 2 chân, mỗi con chó có 4 chân.<br>• Chân gà: 2 × ${g} = ${g * 2}<br>• Chân chó: 4 × ${d} = ${d * 4}<br>• Tất cả: ${g * 2} + ${d * 4} = ${r}<br><span class="dap-so">Đáp số: ${r} cái chân.</span>`);
    },
    twoStep(L, t) {
      const [a, b] = L.bossPair(t);
      const p = a * b;
      const c = rand(1, Math.max(1, p - 1));
      const r = p - c;
      const q = `Mỗi hộp có ${fmt(a)} cái bút chì. Cô giáo mua ${b} hộp rồi phát cho học sinh ${fmt(c)} cái. Hỏi cô còn lại bao nhiêu cái bút chì?`;
      return numQ(q, q, q, r, [p, p + c, r + 1, r - 1, a * b - a],
        `• Bước 1: Số bút trong ${b} hộp: ${fmt(a)} × ${b} = ${fmt(p)} cái.<br>• Bước 2: Số bút còn lại: ${fmt(p)} − ${fmt(c)} = ${fmt(r)} cái.<br><span class="dap-so">Đáp số: ${fmt(r)} cái bút chì.</span>`);
    },
    symbolsMul(L, t) {
      const [a, b] = L.bossPair(t);
      const c = rand(2, 9);
      const S = pick(['⭐', '🍎', '🐱']);
      const prompt = `${S} × ${b} = ${a * b}<br>Hỏi ${S} + ${c} = ?`;
      return numQ('symm' + a + b + c, `<span class="boss-expr">${prompt}</span>`, `Một hình nhân ${b} bằng ${a * b}. Hỏi hình đó cộng ${c} bằng mấy?`,
        a + c, [a * b + c, a, b + c, a + c + 1],
        `• ${S} × ${b} = ${a * b}. Nhẩm bảng nhân: ${a} × ${b} = ${a * b}, nên ${S} = ${a}.<br>• ${S} + ${c} = ${a} + ${c} = <b>${a + c}</b>.`);
    },
    maxProduct(L, t) {
      const opts = [], seen = new Set();
      for (let k = 0; k < 300 && opts.length < 4; k++) {
        const p = L.bossPair(t);
        const v = p[0] * p[1];
        if (!seen.has(v)) { seen.add(v); opts.push(p); }
      }
      const best = opts.reduce((m, p) => (p[0] * p[1] > m[0] * m[1] ? p : m));
      const label = (p) => `${fmt(p[0])} × ${p[1]}`;
      return {
        key: 'max' + opts.map(label).join(), small: true,
        prompt: 'Phép nhân nào có kết quả <b>lớn nhất</b>?', say: 'Phép nhân nào có kết quả lớn nhất?',
        choices: shuffle(opts.map(label)), answer: label(best),
        explain: `Tính từng phép nhân rồi so sánh:<br>• ${opts.map((p) => `${label(p)} = ${fmt(p[0] * p[1])}${p === best ? ' ✔ lớn nhất' : ''}`).join('<br>• ')}`,
      };
    },
  };

  const BOSS_PLAN = {
    addsub: {
      1: ['chain', 'seq', 'moreLess', 'chain', 'seq'],
      2: ['balance', 'moreLess', 'seq', 'chain', 'balance'],
      3: ['symbols', 'balance', 'chain', 'moreLess', 'age'],
    },
    mul: {
      1: ['mseq', 'mulAdd', 'twoStep', 'mseq', 'maxProduct'],
      2: ['mulAdd', 'legs', 'twoStep', 'maxProduct', 'mseq'],
      3: ['legs', 'symbolsMul', 'twoStep', 'mulAdd', 'maxProduct'],
    },
  };
  const BOSSES = [
    { title: 'Đấu Boss 1', icon: '👾', tier: 1 },
    { title: 'Đấu Boss 2', icon: '🐲', tier: 2 },
    { title: 'Đấu Boss 3', icon: '👹', tier: 3 },
  ];
  function bossTypes(L, t) {
    let types = BOSS_PLAN[L.op === 'mul' ? 'mul' : 'addsub'][t].slice();
    if (L.op !== 'mul' && L.max > 20) types = types.map((x) => (x === 'age' ? 'symbols' : x));
    if (L.op === 'mul' && L.bigMul) types = types.map((x) => (x === 'legs' ? 'twoStep' : x === 'symbolsMul' ? 'mulAdd' : x));
    return types;
  }

  function buildSet(types, gen) {
    const out = [], seen = new Set();
    const order = shuffle(Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => types[i % types.length]));
    for (const t of order) {
      let q;
      for (let k = 0; k < 30; k++) { q = gen(t); if (q && !seen.has(q.key)) break; }
      if (!q) q = gen(types[0]) || gen(types[1]);
      seen.add(q.key);
      out.push(q);
    }
    return out;
  }

  function makeLevels(L) {
    const normal = PLAN.map((p, d) => {
      let types = p.types.map((t) => (L.typeMap && L.typeMap[t]) || t);
      if (L.extraTypes && L.extraTypes[d]) types = L.extraTypes[d];
      return { title: p.title, icon: p.icon, build: () => buildSet(types, (t) => Q[t](L, d)) };
    });
    // Boss phép nhân: tránh các phép quá dễ (nhân với 1, 2)
    if (!L.bossPair) L.bossPair = () => { let p; for (let k = 0; k < 50; k++) { p = L.pair(4); if (p[1] >= 3) break; } return p; };
    const boss = BOSSES.map((b) => ({
      title: b.title, icon: b.icon, boss: true,
      build: () => buildSet(bossTypes(L, b.tier), (t) => B[t](L, b.tier)),
    }));
    return normal.concat(boss);
  }

  const pairFromAdd = (fn) => (d) => { const [x, y] = fn(d); return [x + y, y]; };

  /* ---------- Danh sách bài học ---------- */
  const LESSONS = [
    /* ===== PHÉP CỘNG ===== */
    {
      id: 'cong-10', sym: '+10', max: 10, group: 'add', op: 'add', grade: 'Lớp 1', title: 'Cộng trong phạm vi 10', small: true, visual: true,
      pair: (d) => { const max = d < 1 ? 5 : 10; const a = rand(1, max - 1); return [a, rand(1, max - a)]; },
      theory: [
        { t: 'Phép cộng là gộp lại. Khi gộp hai nhóm đồ vật với nhau, ta dùng phép cộng.', ex: () => visual('add', 3, 2) },
        { t: 'Ví dụ: Bé có 3 quả táo, mẹ cho thêm 2 quả táo. Gộp lại bé có 5 quả táo. Ta viết 3 + 2 = 5, đọc là ba cộng hai bằng năm.' },
        { t: 'Cách tính nhẩm: bắt đầu từ số lớn hơn rồi đếm thêm. Ví dụ 6 + 3: đếm tiếp 7, 8, 9. Vậy 6 + 3 = 9.' },
        { t: 'Khi đổi chỗ hai số trong phép cộng thì kết quả không thay đổi: 2 + 5 = 5 + 2 = 7.' },
        { t: 'Số nào cộng với 0 cũng bằng chính số đó: 4 + 0 = 4.' },
        { t: 'Các cặp số cộng lại bằng 10 rất quan trọng: 1 và 9, 2 và 8, 3 và 7, 4 và 6, 5 và 5. Bé hãy học thuộc nhé!', ex: () => '<div class="pairs">1+9 · 2+8 · 3+7 · 4+6 · 5+5 = 10</div>' },
      ],
    },
    {
      id: 'cong-20', sym: '+20', max: 20, group: 'add', op: 'add', grade: 'Lớp 1 – 2', title: 'Cộng trong phạm vi 20', small: true,
      pair: (d) => {
        if (d === 0) { const a = rand(11, 17); return [a, rand(1, 9 - (a % 10))]; }
        const a = rand(2, 9); const b = rand(11 - a, 9);
        return Math.random() < 0.5 ? [a, b] : [b, a];
      },
      theory: [
        { t: 'Số 10 còn gọi là một chục. Các số từ 11 đến 19 gồm 1 chục và một số đơn vị. Ví dụ 13 gồm 1 chục và 3 đơn vị.' },
        { t: 'Cộng không qua 10: với 12 + 3, ta lấy 2 + 3 = 5, giữ nguyên 1 chục, được 15.' },
        { t: 'Cộng qua 10: tách số thứ hai để làm tròn 10. Ví dụ 8 + 5: tách 5 thành 2 và 3. Lấy 8 + 2 = 10, rồi 10 + 3 = 13. Vậy 8 + 5 = 13.', ex: () => '<div class="pairs">8 + 5 = 8 + 2 + 3 = 10 + 3 = 13</div>' },
        { t: 'Mẹo nhỏ: 9 cộng với một số thì bằng 10 cộng với số đó rồi bớt đi 1. Ví dụ 9 + 6 = 10 + 6 − 1 = 15.' },
        { t: 'Bé nhớ thật kỹ các cặp số cộng lại bằng 10 thì sẽ tính rất nhanh!' },
      ],
    },
    {
      id: 'cong-100', sym: '+100', max: 100, group: 'add', op: 'add', grade: 'Lớp 1 – 2', title: 'Cộng trong phạm vi 100',
      pair: (d) => [genAdd(2, false, 1), genAdd(2, false, 2), genAdd(2, true, 1), genAdd(2, true, 2), genAdd(2, true, 2)][d],
      theory: [
        { t: 'Số có hai chữ số gồm hàng chục và hàng đơn vị. Ví dụ 47 gồm 4 chục và 7 đơn vị.' },
        { t: 'Khi cộng, ta đặt tính thẳng cột: hàng đơn vị thẳng hàng đơn vị, hàng chục thẳng hàng chục. Rồi cộng từ phải sang trái.', ex: () => column(34, '+', 25) },
        { t: 'Ví dụ 34 + 25: 4 + 5 = 9, viết 9. 3 + 2 = 5, viết 5. Vậy 34 + 25 = 59.' },
        { t: 'Cộng có nhớ: khi hàng đơn vị cộng lại được 10 trở lên, ta viết chữ số hàng đơn vị và nhớ 1 sang hàng chục.' },
        { t: 'Ví dụ 47 + 35: 7 + 5 = 12, viết 2, nhớ 1. 4 + 3 = 7, thêm 1 bằng 8, viết 8. Vậy 47 + 35 = 82.', ex: () => column(47, '+', 35) },
        { t: 'Bé nhớ: đừng quên cộng thêm số nhớ nhé!' },
      ],
    },
    {
      id: 'cong-1000', sym: '+1000', max: 1000, group: 'add', op: 'add', grade: 'Lớp 2 – 3', title: 'Cộng trong phạm vi 1000',
      pair: (d) => [genAdd(3, false, 2), genAdd(3, false, 3), genAdd(3, true, 2), genAdd(3, true, 3), genAdd(3, true, 3)][d],
      theory: [
        { t: 'Số có ba chữ số gồm hàng trăm, hàng chục và hàng đơn vị. Ví dụ 352 gồm 3 trăm, 5 chục và 2 đơn vị.' },
        { t: 'Ta đặt tính thẳng cột theo từng hàng, rồi cộng từ phải sang trái: hàng đơn vị, đến hàng chục, rồi hàng trăm.', ex: () => column(256, '+', 132) },
        { t: 'Ví dụ 256 + 132: 6 + 2 = 8, 5 + 3 = 8, 2 + 1 = 3. Vậy 256 + 132 = 388.' },
        { t: 'Hàng nào cộng được 10 trở lên thì viết chữ số hàng đơn vị và nhớ 1 sang hàng bên trái.' },
        { t: 'Ví dụ 468 + 275: 8 + 5 = 13, viết 3, nhớ 1. 6 + 7 = 13, thêm 1 bằng 14, viết 4, nhớ 1. 4 + 2 = 6, thêm 1 bằng 7, viết 7. Vậy 468 + 275 = 743.', ex: () => column(468, '+', 275) },
      ],
    },
    {
      id: 'cong-10000', sym: '+10k', max: 10000, group: 'add', op: 'add', grade: 'Lớp 3', title: 'Cộng trong phạm vi 10 000',
      pair: (d) => [genAdd(4, false, 3), genAdd(4, false, 4), genAdd(4, true, 3), genAdd(4, true, 4), genAdd(4, true, 4)][d],
      theory: [
        { t: 'Số có bốn chữ số gồm hàng nghìn, hàng trăm, hàng chục và hàng đơn vị. Ví dụ 4 725 gồm 4 nghìn, 7 trăm, 2 chục và 5 đơn vị.' },
        { t: 'Cách cộng giống như số có ba chữ số: đặt tính thẳng cột, cộng từ phải sang trái, được 10 trở lên thì nhớ 1 sang hàng bên trái.' },
        { t: 'Ví dụ 3 546 + 2 378: 6 + 8 = 14, viết 4, nhớ 1. 4 + 7 = 11, thêm 1 bằng 12, viết 2, nhớ 1. 5 + 3 = 8, thêm 1 bằng 9, viết 9. 3 + 2 = 5, viết 5. Vậy kết quả là 5 924.', ex: () => column(3546, '+', 2378) },
        { t: 'Tính xong, bé có thể ước lượng để kiểm tra: 3 546 gần bằng 3 500, 2 378 gần bằng 2 400, tổng khoảng 5 900. Kết quả 5 924 là hợp lý.' },
      ],
    },

    /* ===== PHÉP TRỪ ===== */
    {
      id: 'tru-10', sym: '−10', max: 10, group: 'sub', op: 'sub', grade: 'Lớp 1', title: 'Trừ trong phạm vi 10', small: true, visual: true,
      pair: pairFromAdd((d) => { const max = d < 1 ? 5 : 10; const a = rand(1, max - 1); return [a, rand(1, max - a)]; }),
      theory: [
        { t: 'Phép trừ là bớt đi. Khi có một nhóm đồ vật rồi lấy bớt đi một số, ta dùng phép trừ.', ex: () => visual('sub', 5, 2) },
        { t: 'Ví dụ: Có 5 quả bóng, bay mất 2 quả. Còn lại 3 quả. Ta viết 5 − 2 = 3, đọc là năm trừ hai bằng ba.' },
        { t: 'Cách tính nhẩm: bắt đầu từ số lớn rồi đếm lùi. Ví dụ 8 − 3: đếm lùi 7, 6, 5. Vậy 8 − 3 = 5.' },
        { t: 'Phép trừ là phép ngược của phép cộng: vì 3 + 4 = 7 nên 7 − 3 = 4 và 7 − 4 = 3.' },
        { t: 'Số nào trừ đi 0 cũng bằng chính số đó: 6 − 0 = 6. Hai số giống nhau trừ cho nhau thì bằng 0: 4 − 4 = 0.' },
      ],
    },
    {
      id: 'tru-20', sym: '−20', max: 20, group: 'sub', op: 'sub', grade: 'Lớp 1 – 2', title: 'Trừ trong phạm vi 20', small: true,
      pair: pairFromAdd((d) => {
        if (d === 0) { const a = rand(11, 17); return [a, rand(1, 9 - (a % 10))]; }
        const a = rand(2, 9); return [a, rand(11 - a, 9)];
      }),
      theory: [
        { t: 'Trừ không qua 10: với 17 − 4, ta lấy 7 − 4 = 3, giữ nguyên 1 chục, được 13.' },
        { t: 'Trừ qua 10: tách số trừ để về tròn 10. Ví dụ 13 − 5: tách 5 thành 3 và 2. Lấy 13 − 3 = 10, rồi 10 − 2 = 8. Vậy 13 − 5 = 8.', ex: () => '<div class="pairs">13 − 5 = 13 − 3 − 2 = 10 − 2 = 8</div>' },
        { t: 'Cách khác: nghĩ đến phép cộng. 13 − 5 bằng mấy? Ta nghĩ 5 cộng mấy bằng 13. Vì 5 + 8 = 13 nên 13 − 5 = 8.' },
        { t: 'Muốn kiểm tra phép trừ, bé lấy kết quả cộng với số trừ. Nếu bằng số bị trừ là đúng.' },
      ],
    },
    {
      id: 'tru-100', sym: '−100', max: 100, group: 'sub', op: 'sub', grade: 'Lớp 1 – 2', title: 'Trừ trong phạm vi 100',
      pair: pairFromAdd((d) => [genAdd(2, false, 1), genAdd(2, false, 2), genAdd(2, true, 1), genAdd(2, true, 2), genAdd(2, true, 2)][d]),
      theory: [
        { t: 'Phép trừ có ba thành phần: số bị trừ, số trừ và hiệu. Ví dụ 58 − 23 = 35: 58 là số bị trừ, 23 là số trừ, 35 là hiệu.' },
        { t: 'Đặt tính thẳng cột, trừ từ phải sang trái. Ví dụ 58 − 23: 8 − 3 = 5, viết 5. 5 − 2 = 3, viết 3. Vậy 58 − 23 = 35.', ex: () => column(58, '−', 23) },
        { t: 'Trừ có nhớ: nếu chữ số ở trên nhỏ hơn chữ số ở dưới, ta mượn 1 chục. Ví dụ 52 − 27: 2 không trừ được 7, lấy 12 − 7 = 5, viết 5, nhớ 1. 2 thêm 1 bằng 3, 5 − 3 = 2, viết 2. Vậy 52 − 27 = 25.', ex: () => column(52, '−', 27) },
        { t: 'Thử lại: lấy hiệu cộng với số trừ phải bằng số bị trừ. 25 + 27 = 52. Đúng rồi!' },
      ],
    },
    {
      id: 'tru-1000', sym: '−1000', max: 1000, group: 'sub', op: 'sub', grade: 'Lớp 2 – 3', title: 'Trừ trong phạm vi 1000',
      pair: pairFromAdd((d) => [genAdd(3, false, 2), genAdd(3, false, 3), genAdd(3, true, 2), genAdd(3, true, 3), genAdd(3, true, 3)][d]),
      theory: [
        { t: 'Trừ các số có ba chữ số: đặt tính thẳng cột theo hàng trăm, hàng chục, hàng đơn vị, rồi trừ từ phải sang trái.' },
        { t: 'Ví dụ 786 − 352: 6 − 2 = 4, 8 − 5 = 3, 7 − 3 = 4. Vậy 786 − 352 = 434.', ex: () => column(786, '−', 352) },
        { t: 'Ví dụ có nhớ 532 − 178: 2 không trừ được 8, lấy 12 − 8 = 4, viết 4, nhớ 1. 7 thêm 1 bằng 8, 3 không trừ được 8, lấy 13 − 8 = 5, viết 5, nhớ 1. 1 thêm 1 bằng 2, 5 − 2 = 3, viết 3. Vậy 532 − 178 = 354.', ex: () => column(532, '−', 178) },
        { t: 'Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ. Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu.' },
      ],
    },
    {
      id: 'tru-10000', sym: '−10k', max: 10000, group: 'sub', op: 'sub', grade: 'Lớp 3', title: 'Trừ trong phạm vi 10 000',
      pair: pairFromAdd((d) => [genAdd(4, false, 3), genAdd(4, false, 4), genAdd(4, true, 3), genAdd(4, true, 4), genAdd(4, true, 4)][d]),
      theory: [
        { t: 'Trừ các số có bốn chữ số cũng làm như vậy: đặt tính thẳng cột, trừ từ phải sang trái, nhớ khi cần.' },
        { t: 'Ví dụ 6 385 − 2 749: 5 không trừ được 9, lấy 15 − 9 = 6, viết 6, nhớ 1. 4 thêm 1 bằng 5, 8 − 5 = 3, viết 3. 3 không trừ được 7, lấy 13 − 7 = 6, viết 6, nhớ 1. 2 thêm 1 bằng 3, 6 − 3 = 3, viết 3. Vậy kết quả là 3 636.', ex: () => column(6385, '−', 2749) },
        { t: 'Thử lại: 3 636 + 2 749 = 6 385. Đúng rồi!' },
      ],
    },

    /* ===== PHÉP NHÂN ===== */
    {
      id: 'nhan-gioi-thieu', sym: '×?', group: 'mul', op: 'mul', grade: 'Lớp 2', title: 'Phép nhân là gì?', visual: true,
      pair: (d) => [rand(2, 5), d === 0 ? rand(2, 3) : rand(2, 5)],
      extraTypes: [['toMul'], ['fromMul', 'toMul'], ['calc'], ['word', 'word', 'calc'], ['toMul', 'fromMul', 'calc', 'word', 'missing']],
      theory: [
        { t: 'Phép nhân là cách viết gọn của phép cộng các số giống nhau.' },
        { t: 'Ví dụ: có 3 đĩa, mỗi đĩa có 2 quả cam. Ta có 2 + 2 + 2 = 6 quả cam. Số 2 được lấy 3 lần, ta viết 2 × 3 = 6, đọc là hai nhân ba bằng sáu.', ex: () => visual('mul', 2, 3) },
        { t: 'Trong phép nhân 2 × 3 = 6, số 2 và số 3 là các thừa số, số 6 là tích.' },
        { t: 'Khi đổi chỗ các thừa số thì tích không thay đổi: 2 × 3 = 3 × 2 = 6.' },
        { t: 'Số nào nhân với 1 cũng bằng chính số đó: 5 × 1 = 5.' },
      ],
    },
    {
      id: 'bang-nhan-2-5', sym: '×2 ×5', group: 'mul', op: 'mul', grade: 'Lớp 2', title: 'Bảng nhân 2 và 5',
      pair: (d) => [d === 0 ? 2 : d === 1 ? 5 : pick([2, 5]), rand(1, 10)],
      theory: [
        { t: 'Bảng nhân 2: mỗi lần thêm 2. 2 × 1 = 2, 2 × 2 = 4, 2 × 3 = 6, 2 × 4 = 8, 2 × 5 = 10.', ex: () => table(2) },
        { t: '2 × 6 = 12, 2 × 7 = 14, 2 × 8 = 16, 2 × 9 = 18, 2 × 10 = 20.' },
        { t: 'Bảng nhân 5: mỗi lần thêm 5. 5 × 1 = 5, 5 × 2 = 10, 5 × 3 = 15, 5 × 4 = 20, 5 × 5 = 25.', ex: () => table(5) },
        { t: '5 × 6 = 30, 5 × 7 = 35, 5 × 8 = 40, 5 × 9 = 45, 5 × 10 = 50.' },
        { t: 'Mẹo: kết quả bảng nhân 2 luôn là số chẵn. Kết quả bảng nhân 5 luôn có chữ số tận cùng là 0 hoặc 5.' },
      ],
    },
    {
      id: 'bang-nhan-3-4', sym: '×3 ×4', group: 'mul', op: 'mul', grade: 'Lớp 3', title: 'Bảng nhân 3 và 4',
      pair: (d) => [d === 0 ? 3 : d === 1 ? 4 : pick([3, 4]), rand(1, 10)],
      theory: [
        { t: 'Bảng nhân 3: đếm thêm 3. Ba, sáu, chín, mười hai, mười lăm, mười tám, hai mươi mốt, hai mươi tư, hai mươi bảy, ba mươi.', ex: () => table(3) },
        { t: 'Bảng nhân 4: đếm thêm 4. Bốn, tám, mười hai, mười sáu, hai mươi, hai mươi tư, hai mươi tám, ba mươi hai, ba mươi sáu, bốn mươi.', ex: () => table(4) },
        { t: 'Mẹo: nếu quên 4 × 7, bé lấy 4 × 6 = 24 rồi cộng thêm 4, được 28.' },
        { t: 'Mẹo: nhân với 4 bằng gấp đôi nhân với 2. Ví dụ 2 × 6 = 12, gấp đôi lên là 4 × 6 = 24.' },
      ],
    },
    {
      id: 'bang-nhan-6-9', sym: '×6–9', group: 'mul', op: 'mul', grade: 'Lớp 3', title: 'Bảng nhân 6, 7, 8, 9',
      pair: (d) => [[pick([6, 7]), pick([6, 7]), pick([8, 9]), pick([8, 9]), rand(6, 9)][d], rand(1, 10)],
      theory: [
        { t: 'Bảng nhân 6: sáu, mười hai, mười tám, hai mươi tư, ba mươi, ba mươi sáu, bốn mươi hai, bốn mươi tám, năm mươi tư, sáu mươi.', ex: () => table(6) },
        { t: 'Bảng nhân 7: bảy, mười bốn, hai mươi mốt, hai mươi tám, ba mươi lăm, bốn mươi hai, bốn mươi chín, năm mươi sáu, sáu mươi ba, bảy mươi.', ex: () => table(7) },
        { t: 'Bảng nhân 8: tám, mười sáu, hai mươi tư, ba mươi hai, bốn mươi, bốn mươi tám, năm mươi sáu, sáu mươi tư, bảy mươi hai, tám mươi.', ex: () => table(8) },
        { t: 'Bảng nhân 9: chín, mười tám, hai mươi bảy, ba mươi sáu, bốn mươi lăm, năm mươi tư, sáu mươi ba, bảy mươi hai, tám mươi mốt, chín mươi.', ex: () => table(9) },
        { t: 'Mẹo bảng nhân 9: lấy 10 nhân với số đó rồi trừ đi chính số đó. Ví dụ 9 × 3 = 30 − 3 = 27.' },
        { t: 'Mẹo đổi chỗ: 6 × 7 = 7 × 6 = 42. Bé chỉ cần nhớ một phép là biết cả hai!' },
      ],
    },
    {
      id: 'nhan-nhieu-chu-so', sym: '×123', bigMul: true, bossPair: (t) => [genMul(2, true), genMul(3, false), genMul(3, true)][t - 1], group: 'mul', op: 'mul', grade: 'Lớp 3', title: 'Nhân số có 2, 3 chữ số với số có 1 chữ số',
      pair: (d) => [genMul(2, false), genMul(2, true), genMul(3, false), genMul(3, true), genMul(3, true)][d],
      typeMap: { missing: 'calc' },
      theory: [
        { t: 'Đặt tính: viết thừa số có nhiều chữ số ở trên, thừa số có một chữ số ở dưới, thẳng cột với hàng đơn vị. Rồi nhân từ phải sang trái.' },
        { t: 'Ví dụ 23 × 3: 3 nhân 3 bằng 9, viết 9. 3 nhân 2 bằng 6, viết 6. Vậy 23 × 3 = 69.', ex: () => column(23, '×', 3) },
        { t: 'Có nhớ: 46 × 3. 3 nhân 6 bằng 18, viết 8, nhớ 1. 3 nhân 4 bằng 12, thêm 1 bằng 13, viết 13. Vậy 46 × 3 = 138.', ex: () => column(46, '×', 3) },
        { t: 'Số có ba chữ số: 215 × 4. 4 nhân 5 bằng 20, viết 0, nhớ 2. 4 nhân 1 bằng 4, thêm 2 bằng 6, viết 6. 4 nhân 2 bằng 8, viết 8. Vậy 215 × 4 = 860.', ex: () => column(215, '×', 4) },
      ],
    },
  ];

  LESSONS.forEach((L) => { L.levels = makeLevels(L); });

  KE.subjects.push({
    id: 'toan',
    name: 'Toán',
    icon: '🔢',
    desc: 'Cộng, trừ, nhân lớp 1 – 3',
    lang: 'vi-VN',
    groups: [
      { id: 'add', name: 'Phép cộng', icon: '➕' },
      { id: 'sub', name: 'Phép trừ', icon: '➖' },
      { id: 'mul', name: 'Phép nhân', icon: '✖️' },
    ],
    lessons: LESSONS,
  });
})();
