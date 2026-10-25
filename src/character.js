// ダーツを投げるキャラクター：酔っぱらいのサラリーマン
// (赤ら顔・ネクタイ鉢巻き・ワイシャツの腕まくり・生ビールのジョッキ)
// 座標は足もと(画面下端)を原点、上がマイナス。投げる腕は 肩→肘→手首 の3関節
// 角度はすべて画面上の絶対角度(度、右向き0・時計回りがプラス)

export const RIG = {
  shoulder: { x: 70, y: -222 }, // 投げる腕の肩
  upper: 68, // 肩→肘
  fore: 72, // 肘→手の中心
  tip: 80, // 手の中心→ダーツの先
};

const rad = (d) => (d * Math.PI) / 180;
const rot = (p, d) => ({ x: p.x * Math.cos(rad(d)) - p.y * Math.sin(rad(d)), y: p.x * Math.sin(rad(d)) + p.y * Math.cos(rad(d)) });

// 姿勢から、握っているダーツの先の位置と向きを求める(キャラクターの座標で)
export function dartTip({ body, dx, upper, fore, dart }) {
  const s = RIG.shoulder;
  let p = {
    x: s.x + RIG.upper * Math.cos(rad(upper)) + RIG.fore * Math.cos(rad(fore)) + RIG.tip * Math.cos(rad(dart)),
    y: s.y + RIG.upper * Math.sin(rad(upper)) + RIG.fore * Math.sin(rad(fore)) + RIG.tip * Math.sin(rad(dart)),
  };
  p = rot(p, body);
  return { x: p.x + dx, y: p.y, angle: dart + body };
}

// ---------- 見た目 ----------
const C = {
  line: '#22180F',
  skin: '#F7D2AE',
  skinShade: '#E3AE86',
  flush: '#F2767A',
  hair: '#2A2420',
  hairLight: '#5A4D44',
  shirt: '#FFFFFF',
  shirtShade: '#D7DEE8',
  pants: '#4A4F5C',
  pantsDark: '#353945',
  shoe: '#5A3418',
  belt: '#2E2A26',
  buckle: '#C9CDD4',
  tieA: '#D7262E',
  tieB: '#1F3E8C',
  beer: '#F6B21A',
  foam: '#FFFDF4',
  glass: '#E9F4FA',
  mouth: '#7A1E22',
  tongue: '#E8616E',
};
const L = `stroke="${C.line}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const thin = `stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

// 丸い端の太い棒(袖・腕)。輪郭線＋本体
function capsule(x1, y1, x2, y2, w, fill) {
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  return `
    <path d="${d}" stroke="${C.line}" stroke-width="${w + 8}" stroke-linecap="round" fill="none"/>
    <path d="${d}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
}

function defs() {
  return `
  <defs>
    <pattern id="cTie" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
      <rect width="14" height="14" fill="${C.tieA}"/><rect width="5" height="14" fill="${C.tieB}"/>
    </pattern>
    <radialGradient id="cFace" cx="0.45" cy="0.4" r="0.65">
      <stop offset="0" stop-color="#FFE0C2"/><stop offset="0.75" stop-color="${C.skin}"/><stop offset="1" stop-color="${C.skinShade}"/>
    </radialGradient>
    <linearGradient id="cShirt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${C.shirtShade}"/>
    </linearGradient>
    <linearGradient id="cBeerShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#B86F00" stop-opacity="0.35"/>
    </linearGradient>
  </defs>`;
}

function legs() {
  return `
  <!-- スラックスと革靴(少しガニ股の千鳥足) -->
  <path d="M-52 -112 L-62 -16 H-14 L0 -76 L14 -16 H62 L52 -112 Z" fill="${C.pants}" ${L}/>
  <path d="M-36 -96 L-40 -20 M36 -96 L40 -20" stroke="${C.pantsDark}" stroke-width="3" stroke-linecap="round"/>
  <path d="M-74 -2 C-76 -22 -16 -26 -12 -10 L-12 0 H-74 Z" fill="${C.shoe}" ${L}/>
  <path d="M74 -2 C76 -22 16 -26 12 -10 L12 0 H74 Z" fill="${C.shoe}" ${L}/>
  <path d="M-64 -14 q12 -6 28 -4 M64 -14 q-12 -6 -28 -4" fill="none" stroke="#8C5A30" stroke-width="3" stroke-linecap="round"/>`;
}

function torso() {
  return `
  <!-- ワイシャツ(第一ボタンを外し、すそが少しはみ出している) -->
  <path d="M-72 -228 C-80 -190 -66 -140 -58 -104 H58 C66 -140 80 -190 72 -228 C46 -244 -46 -244 -72 -228 Z" fill="url(#cShirt)" ${L}/>
  <path d="M0 -236 V-110" stroke="${C.shirtShade}" stroke-width="3"/>
  ${[-200, -172, -144].map((y) => `<circle cx="5" cy="${y}" r="3" fill="#fff" stroke="${C.line}" stroke-width="1.6"/>`).join('')}
  <path d="M-46 -150 q-8 20 -2 40 M46 -170 q8 18 4 36" fill="none" stroke="${C.shirtShade}" stroke-width="3" stroke-linecap="round"/>
  <!-- 開いた襟元と首 -->
  <path d="M-20 -244 L0 -214 L20 -244 Z" fill="${C.skin}" ${thin}/>
  <path d="M-34 -246 L-18 -244 L-4 -222 L-24 -226 Z M34 -246 L18 -244 L4 -222 L24 -226 Z" fill="#fff" ${thin}/>
  <!-- ベルト(すそがはみ出す) -->
  <rect x="-60" y="-116" width="120" height="14" rx="3" fill="${C.belt}" ${L}/>
  <rect x="-10" y="-119" width="20" height="20" rx="3" fill="${C.buckle}" ${thin}/>
  <path d="M30 -112 C38 -100 50 -98 58 -104 L56 -116 Z" fill="#fff" ${thin}/>`;
}

function face(mood) {
  const eyeY = -318;
  if (mood === 'happy') {
    return `
    <g class="face face-happy">
      <path d="M-34 -314 Q-22 -330 -10 -314 M10 -314 Q22 -330 34 -314" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-26 -284 C-14 -278 14 -278 26 -284 C24 -260 12 -250 0 -250 C-12 -250 -24 -260 -26 -284 Z" fill="${C.mouth}" ${thin}/>
      <path d="M-24 -283 C-12 -278 12 -278 24 -283 L22 -277 C10 -273 -10 -273 -22 -277 Z" fill="#fff"/>
      <path d="M-12 -258 C-6 -266 6 -266 12 -258 C6 -253 -6 -253 -12 -258 Z" fill="${C.tongue}"/>
      <path d="M-48 -330 l-8 -6 M-50 -320 l-10 -2 M48 -330 l8 -6 M50 -320 l10 -2" stroke="${C.line}" stroke-width="2.5" stroke-linecap="round"/>
    </g>`;
  }
  if (mood === 'focus') {
    return `
    <g class="face face-focus">
      <!-- 片目をつぶって狙いを定める -->
      <path d="M-34 -318 L-12 -314" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-36 -330 L-12 -324" stroke="${C.hair}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="22" cy="${eyeY}" rx="7" ry="8" fill="#fff" ${thin}/>
      <circle cx="24" cy="${eyeY}" r="4" fill="${C.line}"/>
      <path d="M12 -332 L34 -328" stroke="${C.hair}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-10 -272 Q4 -276 16 -268" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M16 -268 q4 1 6 -3" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  }
  return `
  <g class="face face-normal">
    <!-- とろんとした酔い目 -->
    <path d="M-34 -316 Q-22 -306 -10 -316" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
    <path d="M10 -316 Q22 -306 34 -316" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
    <path d="M-34 -330 Q-22 -336 -10 -330 M10 -330 Q22 -336 34 -330" fill="none" stroke="${C.hair}" stroke-width="4" stroke-linecap="round"/>
    <!-- ゆるんだ口 -->
    <path d="M-18 -280 C-8 -276 8 -276 18 -282 C14 -266 4 -262 -2 -262 C-10 -262 -16 -268 -18 -280 Z" fill="${C.mouth}" ${thin}/>
    <path d="M-8 -266 C-4 -271 4 -271 8 -266 C4 -263 -4 -263 -8 -266 Z" fill="${C.tongue}"/>
    <!-- ヒック -->
    <g class="hic">
      <circle cx="-76" cy="-350" r="5" fill="#fff" ${thin}/>
      <circle cx="-90" cy="-366" r="7" fill="#fff" ${thin}/>
      <text x="-98" y="-382" text-anchor="end" font-size="20" font-weight="900" fill="${C.line}" font-family="'RocknRoll One', 'Noto Sans JP', sans-serif">ヒック</text>
    </g>
  </g>`;
}

function head() {
  return `
  <g class="head">
    <!-- 耳 -->
    <ellipse cx="-62" cy="-302" rx="12" ry="17" fill="${C.skin}" ${L}/>
    <ellipse cx="62" cy="-302" rx="12" ry="17" fill="${C.skin}" ${L}/>
    <!-- 顔(酔って赤い) -->
    <path d="M-60 -330 C-62 -376 62 -376 60 -330 C62 -290 44 -250 0 -246 C-44 -250 -62 -290 -60 -330 Z" fill="url(#cFace)" ${L}/>
    <ellipse cx="0" cy="-300" rx="54" ry="38" fill="${C.flush}" opacity="0.18"/>
    <!-- 赤いほっぺと鼻 -->
    <ellipse cx="-38" cy="-292" rx="15" ry="9" fill="${C.flush}" opacity="0.85"/>
    <ellipse cx="38" cy="-292" rx="15" ry="9" fill="${C.flush}" opacity="0.85"/>
    <path d="M-46 -296 l-3 7 M-39 -297 l-3 7 M-32 -296 l-3 7 M32 -296 l3 7 M39 -297 l3 7 M46 -296 l3 7" stroke="#FFC0C2" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="0" cy="-298" rx="10" ry="8" fill="#F0606A" ${thin}/>
    <ellipse cx="-3" cy="-301" rx="3" ry="2" fill="#FFC6CA"/>
    <!-- 7:3分けの黒髪(ちょっと乱れ気味) -->
    <path d="M-62 -330 C-70 -382 30 -400 62 -352 C64 -340 62 -332 60 -326 C50 -344 30 -352 6 -356 C-14 -350 -40 -348 -54 -320 Z" fill="${C.hair}" ${L}/>
    <path d="M-20 -372 q-14 6 -24 22 M4 -378 q20 4 36 18" fill="none" stroke="${C.hairLight}" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 -376 q10 -14 4 -24 M44 -370 q16 -6 18 -18" fill="none" stroke="${C.hair}" stroke-width="4" stroke-linecap="round"/>
    <!-- ネクタイ鉢巻き -->
    <g transform="rotate(-8 0 -344)">
      <path d="M-66 -352 C-24 -360 24 -360 66 -352 L66 -336 C24 -344 -24 -344 -66 -336 Z" fill="url(#cTie)" ${L}/>
      <rect x="58" y="-356" width="18" height="20" rx="5" fill="url(#cTie)" ${L}/>
      <path d="M72 -340 L104 -314 L92 -294 L68 -330 Z" fill="url(#cTie)" ${L}/>
      <path d="M74 -346 L102 -340 L108 -312 L94 -310 Z" fill="url(#cTie)" ${L}/>
    </g>
    <g class="faces">
      ${face('normal')}
      ${face('focus')}
      ${face('happy')}
    </g>
  </g>`;
}

// 生ビールのジョッキを持つ反対の腕。喜ぶと掲げて「カンパイ」する
export const MUG_HAND = { x: -96, y: -138 };
function offArm() {
  return `
  <g id="g-offarm">
    ${capsule(-70, -222, -104, -176, 30, C.shirt)}
    ${capsule(-104, -176, MUG_HAND.x + 6, MUG_HAND.y - 8, 26, C.shirt)}
    <path d="M-110 -168 l14 -10" stroke="${C.shirtShade}" stroke-width="5" stroke-linecap="round"/>
    <g id="g-mug" transform="translate(${MUG_HAND.x} ${MUG_HAND.y})">
      <path d="M-28 -20 h-10 a12 12 0 0 0 0 24 h10" fill="none" stroke="${C.line}" stroke-width="9"/>
      <path d="M-28 -20 h-10 a12 12 0 0 0 0 24 h10" fill="none" stroke="${C.glass}" stroke-width="4"/>
      <rect x="-28" y="-34" width="44" height="58" rx="6" fill="${C.glass}" ${L}/>
      <rect x="-24" y="-26" width="36" height="46" rx="4" fill="${C.beer}"/>
      <rect x="-24" y="-26" width="36" height="46" rx="4" fill="url(#cBeerShade)"/>
      <circle cx="-12" cy="6" r="2.5" fill="${C.foam}"/><circle cx="2" cy="-4" r="2" fill="${C.foam}"/><circle cx="-4" cy="14" r="1.8" fill="${C.foam}"/>
      <path d="M-32 -30 C-36 -46 -20 -50 -14 -42 C-8 -54 10 -50 12 -40 C22 -42 24 -28 14 -28 H-26 C-34 -28 -34 -30 -32 -30 Z" fill="${C.foam}" ${L}/>
      <!-- ジョッキを持つ手 -->
      <ellipse cx="-40" cy="-8" rx="13" ry="14" fill="${C.skin}" ${L}/>
    </g>
  </g>`;
}

// ダーツ(先が +x 方向、原点が手の中心)
function dart() {
  const k = 1.3;
  return `
  <g class="held-dart" transform="translate(${RIG.tip} 0) scale(${k})">
    <path d="M-24 0 L0 0" stroke="#5c5c5c" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="-56" y="-5" width="34" height="10" rx="4" fill="#E53935" stroke="${C.line}" stroke-width="2"/>
    <rect x="-68" y="-3" width="14" height="6" fill="#F5C400" stroke="${C.line}" stroke-width="1.6"/>
    <path d="M-68 0 L-92 -16 L-83 0 L-92 16 Z" fill="#F5C400" stroke="${C.line}" stroke-width="2" stroke-linejoin="round"/>
  </g>`;
}

// 投げる腕(ワイシャツの袖をまくっている)。関節ごとに入れ子にして回せるようにする
function throwArm() {
  const s = RIG.shoulder;
  return `
  <g id="g-upper" transform="translate(${s.x} ${s.y})">
    ${capsule(0, 0, RIG.upper, 0, 30, C.shirt)}
    <path d="M10 -9 H${RIG.upper - 8}" stroke="${C.shirtShade}" stroke-width="4" stroke-linecap="round"/>
    <g id="g-fore" transform="translate(${RIG.upper} 0)">
      <!-- まくった袖と腕 -->
      ${capsule(18, 0, RIG.fore - 4, 0, 22, C.skin)}
      <rect x="-8" y="-17" width="28" height="34" rx="9" fill="${C.shirt}" ${L}/>
      <path d="M2 -16 V16 M12 -16 V16" stroke="${C.shirtShade}" stroke-width="2.5"/>
      <g id="g-hand" transform="translate(${RIG.fore} 0)">
        ${dart()}
        <!-- ダーツを握る手 -->
        <path d="M-14 -14 C-6 -22 12 -20 16 -10 C20 0 16 14 4 16 C-8 18 -18 10 -18 0 C-18 -6 -16 -11 -14 -14 Z" fill="${C.skin}" ${L}/>
        <path d="M-2 -18 C4 -10 4 6 -2 14 M8 -16 C13 -8 13 6 8 13" fill="none" stroke="${C.skinShade}" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </g>
  </g>
  <circle cx="${s.x}" cy="${s.y}" r="17" fill="${C.shirt}" stroke="none"/>`;
}

export function characterSVG() {
  return `
  ${defs()}
  <g id="g-body">
    ${legs()}
    ${offArm()}
    ${torso()}
    ${throwArm()}
    ${head()}
  </g>`;
}

// 姿勢を画面に反映する。root は characterSVG() を入れた要素
export function applyPose(root, { body, dx, upper, fore, dart }) {
  const s = RIG.shoulder;
  root.querySelector('#g-body').setAttribute('transform', `translate(${dx} 0) rotate(${body})`);
  root.querySelector('#g-upper').setAttribute('transform', `translate(${s.x} ${s.y}) rotate(${upper})`);
  root.querySelector('#g-fore').setAttribute('transform', `translate(${RIG.upper} 0) rotate(${fore - upper})`);
  root.querySelector('#g-hand').setAttribute('transform', `translate(${RIG.fore} 0) rotate(${dart - fore})`);
}

// 表情を切り替える。'normal'(ほろ酔い) | 'focus'(片目で狙う) | 'happy'(大笑いで乾杯)
export function setFace(root, mood) {
  for (const el of root.querySelectorAll('.face')) {
    el.setAttribute('visibility', el.classList.contains(`face-${mood}`) ? 'visible' : 'hidden');
  }
  const cheers = mood === 'happy';
  root.querySelector('#g-offarm').setAttribute('transform', cheers ? 'rotate(112 -70 -222)' : '');
  root.querySelector('#g-mug').setAttribute('transform', `translate(${MUG_HAND.x} ${MUG_HAND.y})${cheers ? ' rotate(-100)' : ''}`);
}
