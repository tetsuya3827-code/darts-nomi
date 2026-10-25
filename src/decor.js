// 地図の装飾(区の色・名物イラスト)と、ダーツ・照準のSVG
// 座標は data/wards.json と同じ 1000×940 の地図座標

export const WARD_STYLE = {
  練馬区: { fill: '#CDE8A8', label: [175, 222] },
  板橋区: { fill: '#FBE2A6', label: [455, 112] },
  豊島区: { fill: '#FFC79C', label: [612, 488] },
  文京区: { fill: '#D9CFF6', label: [905, 428] },
  新宿区: { fill: '#FFB4B0', label: [560, 548] },
  渋谷区: { fill: '#BFEBD3', label: [548, 760] },
};

const g = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})" class="decor">${body}</g>`;
const K = 'stroke="#111" stroke-width="3" stroke-linejoin="round"';

// 集中線(放射状の光)
export function burst(cx, cy, n = 40) {
  let out = '';
  for (let i = 0; i < n; i += 2) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    const r = 1600;
    out += `<path d="M${cx},${cy}L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}L${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}Z" fill="#7CCBF5"/>`;
  }
  return out;
}

const decorations = [
  // 練馬：大根畑とアニメの星
  g(150, 330, 1, `
    <rect x="-70" y="10" width="150" height="50" rx="8" fill="#9C6B3C" ${K}/>
    <path d="M-60 25H70M-60 45H70" stroke="#7A5230" stroke-width="3"/>
    ${[-40, 0, 40].map((dx) => `
      <path d="M${dx} 30 q-14 -40 0 -78 q14 38 0 78z" fill="#fff" ${K}/>
      <path d="M${dx} -46 q-22 -26 -10 -44 M${dx} -46 q4 -30 16 -40 M${dx} -46 q18 -18 30 -22" fill="none" stroke="#2E9E5B" stroke-width="7" stroke-linecap="round"/>`).join('')}
    <text x="5" y="88" text-anchor="middle" class="tag">練馬大根</text>`),
  g(400, 250, 0.9, `
    <path d="M0 -44 L12 -12 L46 -12 L18 8 L28 42 L0 22 L-28 42 L-18 8 L-46 -12 L-12 -12 Z" fill="#FFD740" ${K}/>
    <rect x="-36" y="52" width="72" height="34" rx="6" fill="#111"/>
    <path d="M-36 52 l14 -14 h14 l-14 14 M-8 52 l14 -14 h14 l-14 14 M20 52 l14 -14 h2" fill="#fff" stroke="#111" stroke-width="2"/>
    <text x="0" y="76" text-anchor="middle" class="tag light">アニメ</text>`),
  // 板橋：荒川と商店街アーチ
  g(560, 52, 1, `
    <path d="M-150 0 q25 -16 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#2D86C9" stroke-width="16" stroke-linecap="round"/>
    <path d="M-150 0 q25 -16 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#9FDBFF" stroke-width="5" stroke-linecap="round"/>
    <text x="0" y="34" text-anchor="middle" class="tag">荒川</text>`),
  g(560, 205, 1, `
    <path d="M-70 40 V-6 Q0 -60 70 -6 V40" fill="none" stroke="#111" stroke-width="10"/>
    <path d="M-70 40 V-6 Q0 -60 70 -6 V40" fill="none" stroke="#E86C00" stroke-width="5"/>
    <rect x="-58" y="-34" width="116" height="26" rx="6" fill="#fff" ${K}/>
    <text x="0" y="-15" text-anchor="middle" class="tag small">ハッピーロード</text>
    ${[-50, -30, -10, 10, 30, 50].map((dx) => `<circle cx="${dx}" cy="0" r="6" fill="#E53935" stroke="#111" stroke-width="2"/>`).join('')}`),
  // 豊島：サンシャインと都電
  g(770, 452, 0.9, `
    <rect x="-22" y="-110" width="44" height="120" fill="#E8EEF4" ${K}/>
    ${[-95, -75, -55, -35, -15].map((y) => `<path d="M-14 ${y}h28" stroke="#5BB8F0" stroke-width="6"/>`).join('')}
    <rect x="-8" y="-128" width="16" height="18" fill="#E53935" ${K}/>
    <text x="0" y="34" text-anchor="middle" class="tag">サンシャイン</text>`),
  g(812, 340, 0.85, `
    <rect x="-46" y="-26" width="92" height="44" rx="12" fill="#F5C400" ${K}/>
    <rect x="-46" y="4" width="92" height="14" fill="#2E9E5B" stroke="#111" stroke-width="3"/>
    ${[-32, -10, 12].map((dx) => `<rect x="${dx}" y="-16" width="18" height="14" rx="3" fill="#BDE6FF" stroke="#111" stroke-width="2"/>`).join('')}
    <circle cx="-26" cy="22" r="7" fill="#111"/><circle cx="26" cy="22" r="7" fill="#111"/>
    <path d="M0 -26 V-40 M-12 -40 H12" stroke="#111" stroke-width="3"/>
    <text x="0" y="50" text-anchor="middle" class="tag">都電</text>`),
  // 文京：赤門と東京ドーム
  g(938, 470, 0.85, `
    <rect x="-46" y="-30" width="92" height="12" fill="#C62828" ${K}/>
    <path d="M-56 -42 H56 L46 -30 H-46 Z" fill="#4A4A4A" ${K}/>
    <rect x="-38" y="-18" width="12" height="52" fill="#E53935" ${K}/>
    <rect x="26" y="-18" width="12" height="52" fill="#E53935" ${K}/>
    <rect x="-26" y="-6" width="52" height="40" fill="#7A2A1F" stroke="#111" stroke-width="3"/>
    <text x="0" y="58" text-anchor="middle" class="tag">赤門</text>`),
  g(880, 598, 0.8, `
    <path d="M-60 10 Q-60 -42 0 -42 Q60 -42 60 10 Z" fill="#fff" ${K}/>
    <path d="M-40 -20 Q0 -34 40 -20 M-56 -4 Q0 -18 56 -4" fill="none" stroke="#9AA" stroke-width="2"/>
    <rect x="-66" y="8" width="132" height="12" rx="4" fill="#8E9AA6" ${K}/>
    <text x="0" y="44" text-anchor="middle" class="tag">ドーム</text>`),
  // 新宿：高層ビル群と横丁の提灯
  g(588, 652, 0.85, `
    <rect x="-56" y="-70" width="34" height="90" fill="#6E7F91" ${K}/>
    <rect x="-18" y="-104" width="40" height="124" fill="#8EA2B6" ${K}/>
    <path d="M-18 -104 l20 -16 l20 16" fill="#8EA2B6" ${K}/>
    <rect x="26" y="-56" width="30" height="76" fill="#6E7F91" ${K}/>
    ${[-86, -66, -46, -26, -6].map((y) => `<path d="M-10 ${y}h24" stroke="#FFD740" stroke-width="5"/>`).join('')}
    <text x="0" y="46" text-anchor="middle" class="tag">高層ビル</text>`),
  g(712, 600, 0.8, `
    <path d="M-60 -30 H60" stroke="#111" stroke-width="3"/>
    ${[-40, 0, 40].map((dx) => `
      <ellipse cx="${dx}" cy="0" rx="15" ry="22" fill="#E53935" ${K}/>
      <path d="M${dx - 13} -8 h26 M${dx - 13} 8 h26" stroke="#111" stroke-width="2"/>
      <path d="M${dx} -30 v8" stroke="#111" stroke-width="3"/>`).join('')}
    <text x="0" y="48" text-anchor="middle" class="tag">横丁</text>`),
  // 渋谷：スクランブル交差点とハチ公
  g(662, 862, 0.9, `
    <rect x="-56" y="-40" width="112" height="80" rx="6" fill="#4A4A4A" ${K}/>
    ${[-36, -18, 0, 18, 36].map((d) => `<path d="M${d - 30} ${d + 30} L${d + 30} ${d - 30}" stroke="#fff" stroke-width="6" stroke-linecap="square" clip-path="url(#cross)"/>`).join('')}
    ${[-36, -18, 0, 18, 36].map((d) => `<path d="M${d - 30} ${-d - 30} L${d + 30} ${-d + 30}" stroke="#fff" stroke-width="6" clip-path="url(#cross)"/>`).join('')}
    <text x="0" y="62" text-anchor="middle" class="tag">スクランブル</text>`),
  g(560, 872, 0.85, `
    <ellipse cx="0" cy="10" rx="28" ry="18" fill="#C9A26B" ${K}/>
    <circle cx="24" cy="-16" r="16" fill="#C9A26B" ${K}/>
    <path d="M18 -30 l-4 -14 l12 8 Z M34 -28 l6 -12 l2 14 Z" fill="#C9A26B" ${K}/>
    <circle cx="28" cy="-18" r="2.5" fill="#111"/><circle cx="39" cy="-12" r="3" fill="#111"/>
    <path d="M-18 24 v12 M14 24 v12" stroke="#111" stroke-width="5" stroke-linecap="round"/>
    <path d="M-26 0 q-14 -10 -6 -22" fill="none" stroke="#111" stroke-width="4"/>
    <text x="4" y="58" text-anchor="middle" class="tag">ハチ公</text>`),
];

export function decorSVG() {
  return `<defs><clipPath id="cross"><rect x="-56" y="-40" width="112" height="80" rx="6"/></clipPath></defs>${decorations.join('')}`;
}

// ダーツ(先端が (0,0)、右向き)
export function dartSVG() {
  return `
  <g class="dart">
    <path d="M0 0 L-22 0" stroke="#555" stroke-width="3"/>
    <rect x="-52" y="-5" width="32" height="10" rx="4" fill="#E53935" stroke="#111" stroke-width="2"/>
    <rect x="-62" y="-3" width="12" height="6" fill="#F5C400" stroke="#111" stroke-width="2"/>
    <path d="M-62 0 L-84 -16 L-76 0 L-84 16 Z" fill="#F5C400" stroke="#111" stroke-width="2"/>
  </g>`;
}

// 照準
export function aimSVG() {
  return `
  <g class="aim">
    <circle r="22" fill="none" stroke="#fff" stroke-width="7"/>
    <circle r="22" fill="none" stroke="#E53935" stroke-width="4"/>
    <path d="M-34 0 H-10 M10 0 H34 M0 -34 V-10 M0 10 V34" stroke="#fff" stroke-width="7"/>
    <path d="M-34 0 H-10 M10 0 H34 M0 -34 V-10 M0 10 V34" stroke="#E53935" stroke-width="3.5"/>
    <circle r="3.5" fill="#E53935"/>
  </g>`;
}
