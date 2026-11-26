/* ============================================================
   LINH VẬT "KHỈ MẬP": chú khỉ nhỏ do Bé Vui Học tự thiết kế.
   Bé lên cấp thì Khỉ Mập nhận thêm đồ trang trí.
   ============================================================ */
window.KE = window.KE || {};

KE.mascot = (function () {
  const NAME = 'Khỉ Mập';
  /* Đồ trang trí mở khoá theo cấp */
  const ITEMS = [
    { lv: 2, id: 'scarf', name: 'Khăn quàng đỏ', icon: '🧣' },
    { lv: 3, id: 'shirt', name: 'Áo gile xanh', icon: '🦺' },
    { lv: 4, id: 'boots', name: 'Đôi ủng nâu', icon: '👢' },
    { lv: 5, id: 'cape', name: 'Áo choàng siêu nhân', icon: '🦸' },
    { lv: 6, id: 'badge', name: 'Huy hiệu ngôi sao', icon: '🎖️' },
    { lv: 7, id: 'crown', name: 'Vương miện', icon: '👑' },
    { lv: 8, id: 'wand', name: 'Gậy phép thuật', icon: '🪄' },
    { lv: 9, id: 'halo', name: 'Hào quang', icon: '😇' },
    { lv: 10, id: 'ship', name: 'Tàu vũ trụ', icon: '🛸' },
    { lv: 12, id: 'aura', name: 'Vũ trụ lấp lánh', icon: '🌌' },
  ];

  const has = (lv, id) => ITEMS.some((x) => x.id === id && lv >= x.lv);

  function svg(lv, size) {
    const h = (id) => has(lv, id);
    const uid = 'm' + Math.random().toString(36).slice(2, 7);
    const s = [];
    s.push(`<svg class="mascot ${h('halo') ? 'floaty' : ''}" viewBox="0 0 220 250" width="${size || 160}" height="${(size || 160) * 250 / 220}" role="img" aria-label="${NAME}">`);
    s.push(`<defs>
      <radialGradient id="${uid}a" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7c5cff" stop-opacity=".55"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${uid}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e53935"/><stop offset="1" stop-color="#8e1b1b"/></linearGradient>
    </defs>`);

    /* Vũ trụ lấp lánh (phía sau) */
    if (h('aura')) {
      s.push(`<circle cx="110" cy="130" r="105" fill="url(#${uid}a)"/>`);
      [[30, 60], [190, 50], [20, 170], [200, 160], [60, 25], [165, 215]].forEach(([x, y], i) =>
        s.push(`<path class="twinkle" style="animation-delay:${i * 0.3}s" d="M${x} ${y - 8} L${x + 2.5} ${y - 2.5} L${x + 8} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 8} L${x - 2.5} ${y + 2.5} L${x - 8} ${y} L${x - 2.5} ${y - 2.5}Z" fill="#fff3c4"/>`));
    }
    /* Áo choàng (phía sau thân) */
    if (h('cape')) s.push(`<path d="M70 140 Q110 130 150 140 L178 226 Q110 240 42 226 Z" fill="url(#${uid}c)"/>`);

    /* Đuôi cong */
    s.push(`<path d="M146 190 Q196 196 194 152 Q192 122 170 128 Q156 134 168 146" stroke="#7a4a22" stroke-width="9" fill="none" stroke-linecap="round"/>`);
    /* Chân */
    s.push(`<ellipse cx="92" cy="204" rx="13" ry="16" fill="#8d5a2b"/><ellipse cx="128" cy="204" rx="13" ry="16" fill="#8d5a2b"/>`);
    if (h('boots')) s.push(`<path d="M78 204 h26 v12 q0 6 -6 6 h-24 q-4 0 -4 -5 q0 -6 8 -7Z" fill="#5d3a17" stroke="#3e2610" stroke-width="1.5"/><path d="M116 204 h26 v12 q0 6 -6 6 h-24 q-4 0 -4 -5 q0 -6 8 -7Z" fill="#5d3a17" stroke="#3e2610" stroke-width="1.5"/>`);
    else s.push(`<ellipse cx="90" cy="218" rx="14" ry="7" fill="#f3d3a1"/><ellipse cx="130" cy="218" rx="14" ry="7" fill="#f3d3a1"/>`);
    /* Thân + bụng */
    s.push(`<ellipse cx="110" cy="166" rx="44" ry="40" fill="#8d5a2b"/>`);
    s.push(`<ellipse cx="110" cy="172" rx="27" ry="27" fill="#f3d3a1"/>`);
    /* Áo gile */
    if (h('shirt')) s.push(`<path d="M68 160 Q70 196 102 205 L102 146 Q84 138 72 146Z" fill="#2f6fd6"/><path d="M152 160 Q150 196 118 205 L118 146 Q136 138 148 146Z" fill="#2f6fd6"/><circle cx="96" cy="172" r="3" fill="#fff"/><circle cx="96" cy="186" r="3" fill="#fff"/>`);
    /* Tay */
    s.push(`<path d="M74 150 Q50 168 56 192" stroke="#8d5a2b" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="57" cy="194" r="10" fill="#f3d3a1"/>`);
    s.push(`<path d="M146 150 Q170 168 164 186" stroke="#8d5a2b" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="163" cy="188" r="10" fill="#f3d3a1"/>`);
    /* Huy hiệu */
    if (h('badge')) s.push(`<path d="M136 158 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.8 -7 3.8 1.5 -7.5 -5.5 -5 7.5 -1Z" fill="#fff3c4" stroke="#c8920e" stroke-width="1.5"/>`);
    /* Tai */
    s.push(`<circle cx="52" cy="94" r="22" fill="#8d5a2b"/><circle cx="52" cy="94" r="13" fill="#f3d3a1"/><circle cx="168" cy="94" r="22" fill="#8d5a2b"/><circle cx="168" cy="94" r="13" fill="#f3d3a1"/>`);
    /* Đầu */
    s.push(`<circle cx="110" cy="94" r="52" fill="#8d5a2b"/>`);
    s.push(`<path d="M98 46 Q104 26 112 42 Q118 28 126 46 Q114 40 98 46Z" fill="#f5c542"/>`);
    /* Mặt */
    s.push(`<g fill="#f3d3a1"><circle cx="92" cy="92" r="22"/><circle cx="128" cy="92" r="22"/><ellipse cx="110" cy="116" rx="36" ry="24"/></g>`);
    s.push(`<g class="eyes"><ellipse cx="94" cy="92" rx="8" ry="10" fill="#2b1a0e"/><ellipse cx="126" cy="92" rx="8" ry="10" fill="#2b1a0e"/>
      <circle cx="97" cy="88" r="3" fill="#fff"/><circle cx="129" cy="88" r="3" fill="#fff"/></g>`);
    s.push(`<circle cx="105" cy="110" r="2.5" fill="#5d3a17"/><circle cx="115" cy="110" r="2.5" fill="#5d3a17"/>`);
    s.push(`<path d="M95 120 Q110 135 125 120" stroke="#5d3a17" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    s.push(`<circle cx="80" cy="114" r="6" fill="#ff8fa3" opacity=".7"/><circle cx="140" cy="114" r="6" fill="#ff8fa3" opacity=".7"/>`);
    /* Khăn quàng */
    if (h('scarf')) s.push(`<path d="M72 136 Q110 154 148 136 L146 148 Q110 166 74 148Z" fill="#e53935"/><path d="M126 152 l12 28 l-14 -4 l-8 -22Z" fill="#c62828"/>`);
    /* Gậy phép */
    if (h('wand')) s.push(`<line x1="166" y1="186" x2="192" y2="122" stroke="#5d4037" stroke-width="5" stroke-linecap="round"/><path class="twinkle" d="M195 102 l4 9 10 1 -7.5 6.5 2.5 10 -9 -5.5 -9 5.5 2.5 -10 -7.5 -6.5 10 -1Z" fill="#ffd76a" stroke="#fff3c4"/>`);
    /* Vương miện */
    if (h('crown')) s.push(`<path d="M82 52 L86 26 L98 40 L110 20 L122 40 L134 26 L138 52 Z" fill="#ffd76a" stroke="#a87708" stroke-width="2.5"/><circle cx="110" cy="40" r="4" fill="#e53935"/><circle cx="94" cy="46" r="3" fill="#2f6fd6"/><circle cx="126" cy="46" r="3" fill="#2f6fd6"/>`);
    /* Hào quang */
    if (h('halo')) s.push(`<ellipse class="halo" cx="110" cy="10" rx="34" ry="7" fill="none" stroke="#fff3c4" stroke-width="5"/>`);
    /* Tàu vũ trụ (phía trước, bé ngồi trong tàu) */
    if (h('ship')) {
      s.push(`<path d="M96 238 L110 250 L124 238Z" fill="#ff9800" class="flame"/>`);
      s.push(`<ellipse cx="110" cy="212" rx="100" ry="24" fill="#9aa4b8" stroke="#5c6478" stroke-width="3"/>`);
      s.push(`<ellipse cx="110" cy="220" rx="66" ry="12" fill="#5c6478"/>`);
      [40, 75, 110, 145, 180].forEach((x, i) => s.push(`<circle class="blink" style="animation-delay:${i * 0.2}s" cx="${x}" cy="${i === 0 || i === 4 ? 214 : 223}" r="5" fill="#ffd76a"/>`));
    }
    s.push('</svg>');
    return s.join('');
  }

  function next(lv) { return ITEMS.find((x) => x.lv > lv) || null; }
  function unlockedAt(lv) { return ITEMS.filter((x) => x.lv === lv); }

  return { NAME, ITEMS, svg, next, unlockedAt };
})();
