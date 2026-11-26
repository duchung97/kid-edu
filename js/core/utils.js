/* Tiện ích dùng chung cho mọi môn học */
window.KE = window.KE || {};

KE.util = (function () {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* Định dạng số kiểu Việt Nam: 10 000 */
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* Tạo 4 lựa chọn số: đáp án đúng + 3 đáp án nhiễu gần đúng */
  function numberChoices(answer, extra) {
    const cands = new Set();
    (extra || []).forEach((x) => cands.add(x));
    [1, -1, 2, -2, 3, -3].forEach((d) => cands.add(answer + d));
    if (answer >= 20) { cands.add(answer + 10); cands.add(answer - 10); }
    if (answer >= 100) { cands.add(answer + 100); cands.add(answer - 100); }
    const wrong = shuffle([...cands].filter((x) => x >= 0 && x !== answer));
    // ưu tiên các đáp án nhiễu "hợp lý" truyền vào trước
    const pri = (extra || []).filter((x) => x >= 0 && x !== answer);
    const chosen = [...new Set([...shuffle(pri), ...wrong])].slice(0, 3);
    return shuffle([answer, ...chosen]).map(String);
  }

  /* Đổi biểu thức thành câu đọc cho giọng nói */
  function toSpeech(str) {
    return String(str)
      .replace(/<[^>]+>/g, ' ')
      .replace(/(\d) (\d{3})/g, '$1$2')
      .replace(/\+/g, ' cộng ')
      .replace(/−/g, ' trừ ')
      .replace(/×/g, ' nhân ')
      .replace(/(\d)\s*:\s*(\d)/g, '$1 chia $2')
      .replace(/=/g, ' bằng ')
      .replace(/\?/g, ' mấy ')
      .replace(/>/g, ' lớn hơn ')
      .replace(/</g, ' bé hơn ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const PLACES = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn'];
  const digits = (n) => String(n).split('').reverse().map(Number);

  /* Giải thích phép cộng đặt tính theo cột */
  function explainAddColumn(a, b) {
    const da = digits(a), db = digits(b);
    const len = Math.max(da.length, db.length);
    let carry = 0;
    const steps = [];
    for (let i = 0; i < len; i++) {
      const x = da[i] || 0, y = db[i] || 0;
      const s = x + y + carry;
      const place = 'Hàng ' + PLACES[i];
      let t;
      if (i >= da.length || i >= db.length) {
        const only = i >= da.length ? y : x;
        t = carry ? `${place}: ${only} thêm ${carry} bằng ${s}` : `${place}: hạ ${only}`;
      } else if (carry) {
        t = `${place}: ${x} + ${y} = ${x + y}, thêm ${carry} bằng ${s}`;
      } else {
        t = `${place}: ${x} + ${y} = ${s}`;
      }
      if (s >= 10 && i < len - 1) { t += `, viết ${s % 10}, nhớ 1.`; carry = 1; }
      else if (s >= 10) { t += `, viết ${s}.`; carry = 0; }
      else { t += `, viết ${s}.`; carry = 0; }
      steps.push(t);
    }
    return `Đặt tính rồi cộng từ phải sang trái:<br>• ${steps.join('<br>• ')}<br>Vậy ${fmt(a)} + ${fmt(b)} = <b>${fmt(a + b)}</b>.`;
  }

  /* Giải thích phép trừ đặt tính theo cột */
  function explainSubColumn(a, b) {
    const da = digits(a), db = digits(b);
    let borrow = 0;
    const steps = [];
    for (let i = 0; i < da.length; i++) {
      const x = da[i], y = db[i] || 0;
      const place = 'Hàng ' + PLACES[i];
      const isTop = i === da.length - 1;
      if (i >= db.length && !borrow) {
        if (!(isTop && x === 0)) steps.push(`${place}: hạ ${x}.`);
        continue;
      }
      const sub = y + borrow;
      let t = `${place}: `;
      if (borrow) t += `${y} thêm 1 bằng ${sub}; `;
      if (x >= sub) {
        const r = x - sub;
        t += `${x} − ${sub} = ${r}`;
        t += isTop && r === 0 ? '.' : `, viết ${r}.`;
        borrow = 0;
      } else {
        t += `${x} không trừ được ${sub}, lấy ${x + 10} − ${sub} = ${x + 10 - sub}, viết ${x + 10 - sub}, nhớ 1.`;
        borrow = 1;
      }
      steps.push(t);
    }
    return `Đặt tính rồi trừ từ phải sang trái:<br>• ${steps.join('<br>• ')}<br>Vậy ${fmt(a)} − ${fmt(b)} = <b>${fmt(a - b)}</b>.`;
  }

  /* Giải thích phép nhân số nhiều chữ số với số có một chữ số */
  function explainMulColumn(a, b) {
    const da = digits(a);
    let carry = 0;
    const steps = [];
    for (let i = 0; i < da.length; i++) {
      const x = da[i];
      const p = x * b + carry;
      let t = `${b} nhân ${x} bằng ${x * b}`;
      if (carry) t += `, thêm ${carry} bằng ${p}`;
      if (i < da.length - 1 && p >= 10) { t += `, viết ${p % 10}, nhớ ${Math.floor(p / 10)}.`; carry = Math.floor(p / 10); }
      else { t += `, viết ${p}.`; carry = 0; }
      steps.push(t);
    }
    return `Đặt tính rồi nhân từ phải sang trái (lấy ${b} nhân lần lượt từng chữ số):<br>• ${steps.join('<br>• ')}<br>Vậy ${fmt(a)} × ${b} = <b>${fmt(a * b)}</b>.`;
  }

  /* Giải thích phép cộng nhỏ (trong phạm vi 20) */
  function explainAddSmall(a, b) {
    const s = a + b;
    if (b === 0) return `Số nào cộng với 0 cũng bằng chính số đó: ${a} + 0 = <b>${a}</b>.`;
    if (a === 0) return `0 cộng với số nào cũng bằng chính số đó: 0 + ${b} = <b>${b}</b>.`;
    if (a < 10 && b < 10 && s > 10) {
      const need = 10 - a, rest = b - need;
      return `Tách ${b} thành ${need} và ${rest} để ${a} tròn chục:<br>${a} + ${need} = 10, rồi 10 + ${rest} = ${s}.<br>Vậy ${a} + ${b} = <b>${s}</b>.`;
    }
    if (b <= 5 && s <= 20) {
      const seq = [];
      for (let i = 1; i <= b; i++) seq.push(a + i);
      return `Bắt đầu từ ${a}, đếm thêm ${b}: ${seq.join(', ')}.<br>Vậy ${a} + ${b} = <b>${s}</b>.`;
    }
    if (a <= 5 && s <= 20) {
      const seq = [];
      for (let i = 1; i <= a; i++) seq.push(b + i);
      return `Đổi chỗ hai số cho dễ: ${b} + ${a}. Bắt đầu từ ${b}, đếm thêm ${a}: ${seq.join(', ')}.<br>Vậy ${a} + ${b} = <b>${s}</b>.`;
    }
    return `${a} + ${b} = <b>${s}</b>. Bé có thể dùng que tính: lấy ${a} que, thêm ${b} que, đếm tất cả được ${s} que.`;
  }

  /* Giải thích phép trừ nhỏ (trong phạm vi 20) */
  function explainSubSmall(a, b) {
    const r = a - b;
    if (b === 0) return `Số nào trừ đi 0 cũng bằng chính số đó: ${a} − 0 = <b>${a}</b>.`;
    if (r === 0) return `Hai số bằng nhau trừ cho nhau thì bằng 0: ${a} − ${b} = <b>0</b>.`;
    if (a > 10 && b < 10 && r < 10) {
      const first = a - 10, rest = b - first;
      return `Tách ${b} thành ${first} và ${rest}:<br>${a} − ${first} = 10, rồi 10 − ${rest} = ${r}.<br>Vậy ${a} − ${b} = <b>${r}</b>.`;
    }
    if (b <= 5) {
      const seq = [];
      for (let i = 1; i <= b; i++) seq.push(a - i);
      return `Bắt đầu từ ${a}, đếm lùi ${b}: ${seq.join(', ')}.<br>Vậy ${a} − ${b} = <b>${r}</b>.`;
    }
    return `Vì ${b} + ${r} = ${a} nên ${a} − ${b} = <b>${r}</b>.`;
  }

  return {
    rand, pick, shuffle, fmt, numberChoices, toSpeech,
    explainAddColumn, explainSubColumn, explainMulColumn,
    explainAddSmall, explainSubSmall,
  };
})();
