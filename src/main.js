import { pickStation, isInsideWards, aimAt, buildPlan, nextState } from './logic.js?v=12';
import { WARD_STYLE, burst, decorSVG, dartSVG, aimSVG } from './decor.js?v=12';
import { createAudio } from './audio.js?v=12';
import { characterSVG, applyPose, dartTip, setFace } from './character.js?v=12';

const $ = (id) => document.getElementById(id);
const svg = $('map');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const touchFirst = matchMedia('(pointer: coarse)').matches;

// データを更新して公開し直したとき、古いキャッシュを使わないよう毎回確認する
const loadJSON = (p) => fetch(p, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(p))));
let wardsData, stations, shops;
try {
  [wardsData, stations, shops] = await Promise.all([
    loadJSON('data/wards.json'),
    loadJSON('data/stations.json'),
    loadJSON('data/shops.json').catch(() => ({})),
  ]);
} catch (err) {
  $('action').disabled = true;
  $('hint').textContent = '地図データを読み込めませんでした。ページを再読み込みしてください。';
  throw err;
}

const rings = wardsData.wards.flatMap((w) => w.rings);
const [, , W, H] = wardsData.viewBox.split(' ').map(Number);
const pts = rings.flat();
const bounds = {
  minX: Math.min(...pts.map((p) => p[0])), maxX: Math.max(...pts.map((p) => p[0])),
  minY: Math.min(...pts.map((p) => p[1])), maxY: Math.max(...pts.map((p) => p[1])),
};
// ダーツを投げる酔っぱらいのサラリーマン。地図の左下に立たせる
const CHARA = { x: 150, y: H, scale: 0.85 };

// ---------- 地図を描く ----------
function drawMap() {
  const wardShapes = wardsData.wards.map((w) => `
    <path d="${w.path}" transform="translate(7 7)" fill="#111"/>
    <path d="${w.path}" fill="${WARD_STYLE[w.name].fill}" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>`).join('');
  const labels = wardsData.wards.map((w) => {
    const [x, y] = WARD_STYLE[w.name].label;
    return `<g transform="translate(${x} ${y}) rotate(-3)" class="ward-label">
      <rect x="-50" y="-22" width="100" height="40" rx="8" fill="#111"/>
      <rect x="-50" y="-26" width="100" height="40" rx="8" fill="#fff" stroke="#111" stroke-width="3"/>
      <text x="0" y="3" text-anchor="middle" class="ward-name">${w.name}</text></g>`;
  }).join('');
  const dots = stations.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.rank === 'center' ? 6.5 : 4.5}" class="dot ${s.rank}"/>`).join('');
  const names = stations.filter((s) => s.rank === 'center').map((s) =>
    `<text x="${s.x + 9}" y="${s.y + 4}" class="st-name">${s.name}</text>`).join('');

  svg.setAttribute('viewBox', wardsData.viewBox);
  $('charaLayer').setAttribute('viewBox', wardsData.viewBox);
  $('charaLayer').innerHTML = `<g id="chara" transform="translate(${CHARA.x} ${CHARA.y}) scale(${CHARA.scale})">${characterSVG()}</g>`;
  svg.innerHTML = `
    <style>
      .tag{font:900 17px var(--font-body);fill:#111;paint-order:stroke;stroke:#fff;stroke-width:5px}
      .tag.small{font-size:13px;stroke-width:0}
      .tag.light{fill:#fff;stroke-width:0;font-size:15px}
      .ward-name{font:400 22px var(--font-display);fill:#111}
      .dot{fill:#fff;stroke:#111;stroke-width:2.2}
      .dot.center{fill:#111;stroke:#fff;stroke-width:2}
      .st-name{font:900 15px var(--font-body);fill:#111;paint-order:stroke;stroke:#fff;stroke-width:4px}
      .decor{pointer-events:none}
      .hit-ring{fill:none;stroke:#E53935;stroke-width:5}
    </style>
    <rect x="-2000" y="-2000" width="5000" height="5000" fill="#5BB8F0"/>
    ${burst(W / 2, H / 2)}
    <g id="wards">${wardShapes}</g>
    ${decorSVG()}
    <g id="dots">${dots}${names}</g>
    ${labels}
    <g id="hit"></g>
    <g id="dartLayer"></g>
    <g id="aim" visibility="hidden">${aimSVG()}</g>`;
}

// ---------- 音 ----------
const audio = createAudio();

// ---------- 状態 ----------
let state = 'idle';
let seed = Math.random() * 1000;
let t0 = 0;
let aimPoint = { x: W / 2, y: H / 2 };
let raf = 0;
// やり直しで、途中の演出(await の続き)を打ち切るための番号
let run = 0;

const action = $('action');
const hint = $('hint');
const aimEl = () => $('aim');

function setView(x, y, w, h) {
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
}

function animate(dur, step) {
  return new Promise((resolve) => {
    if (reduceMotion) { step(1); resolve(); return; }
    const start = performance.now();
    const frame = (now) => {
      const k = Math.min(1, (now - start) / dur);
      step(k);
      if (k < 1) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });
}
const ease = (k) => 1 - Math.pow(1 - k, 3);

const easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
const easeIn = (k) => k * k;
const lerp = (a, b, t) => a + (b - a) * t;

// キャラクターの姿勢(角度は度)。body=体の傾き、dx=重心の前後、upper/fore=上腕/前腕の向き、dart=手首(ダーツ)の向き
const REST = { body: 0, dx: 0, upper: -40, fore: -105, dart: -40 };
const WINDUP = { body: -8, dx: -10, upper: -70, fore: -140, dart: -95 }; // 肘を上げ、手を頭の後ろまで引く
const FOLLOW = { body: 8, dx: 12, upper: -10, fore: 20, dart: 30 }; // 腕を前に振り抜く
const RELEASE_FORE = -60; // 前腕がこの向きを過ぎた瞬間にダーツを放す
let pose = { ...REST };
function setPose(next) {
  pose = next;
  applyPose($('chara'), pose);
}
const tween = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)]));

// 今の姿勢で、握っているダーツの先が地図上のどこにあるか
function heldTipNow() {
  const p = dartTip(pose);
  return { x: CHARA.x + p.x * CHARA.scale, y: CHARA.y + p.y * CHARA.scale, angle: p.angle };
}
const holdDart = (on) => $('chara').querySelector('.held-dart').setAttribute('visibility', on ? 'visible' : 'hidden');

function aimLoop(now) {
  const p = aimAt(now - t0, seed, bounds);
  if (isInsideWards(p, rings)) aimPoint = p;
  aimEl().setAttribute('transform', `translate(${aimPoint.x} ${aimPoint.y})`);
  // 狙いを定めるように、腕と体を小さく揺らす
  const t = (now - t0) / 1000;
  setPose({ ...REST, body: Math.sin(t * 5.5) * 1.5, upper: REST.upper + Math.sin(t * 4.1) * 3, fore: REST.fore + Math.sin(t * 8.3) * 7 });
  raf = requestAnimationFrame(aimLoop);
}

function dispatch(event) {
  const next = nextState(state, event);
  if (next === state) return;
  state = next;
  if (event === 'reset') resetGame();
  if (state === 'aiming') startAiming();
  if (state === 'flying') throwDart();
}

function startAiming() {
  $('announce').hidden = true;
  $('hit').innerHTML = '';
  $('dartLayer').innerHTML = '';
  setView(0, 0, W, H);
  seed = Math.random() * 1000;
  t0 = performance.now();
  aimEl().setAttribute('visibility', 'visible');
  holdDart(true);
  setPose(REST);
  setFace($('chara'), 'focus');
  action.textContent = '投げる！';
  action.classList.add('armed');
  action.disabled = false;
  hint.textContent = touchFirst ? '地図をタップして投げる' : 'スペースキー or 地図をクリックで投げる';
  audio.tension(true);
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(aimLoop);
}

function resetGame() {
  run++;
  cancelAnimationFrame(raf);
  audio.tension(false);
  $('announce').hidden = true;
  $('hit').innerHTML = '';
  $('dartLayer').innerHTML = '';
  aimEl().setAttribute('visibility', 'hidden');
  holdDart(true);
  setPose(REST);
  setFace($('chara'), 'normal');
  setView(0, 0, W, H);
  $('planBody').hidden = true;
  $('planEmpty').hidden = false;
  action.textContent = 'ダーツを構える';
  action.classList.remove('armed');
  action.disabled = false;
  hint.textContent = 'ボタンを押すと照準が動き出します';
}

// 手を離れたダーツを、放した位置と向きから目標まで飛ばす
function launch(from, target, me) {
  holdDart(false);
  audio.whoosh();
  const layer = $('dartLayer');
  layer.innerHTML = dartSVG();
  const dart = layer.firstElementChild;
  // 放した向きに少し進んでから落ちてくる弧(2次ベジェ)
  const dir = { x: Math.cos((from.angle * Math.PI) / 180), y: Math.sin((from.angle * Math.PI) / 180) };
  const reach = Math.hypot(target.x - from.x, target.y - from.y);
  const ctrl = { x: from.x + dir.x * reach * 0.55, y: Math.min(from.y + dir.y * reach * 0.55, target.y - 120) };
  return animate(700, (k) => {
    if (me !== run) return;
    const t = ease(k);
    const x = (1 - t) ** 2 * from.x + 2 * (1 - t) * t * ctrl.x + t * t * target.x;
    const y = (1 - t) ** 2 * from.y + 2 * (1 - t) * t * ctrl.y + t * t * target.y;
    const dx = 2 * (1 - t) * (ctrl.x - from.x) + 2 * t * (target.x - ctrl.x);
    const dy = 2 * (1 - t) * (ctrl.y - from.y) + 2 * t * (target.y - ctrl.y);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    dart.setAttribute('transform', `translate(${x} ${y}) rotate(${angle}) scale(${1.2 - 0.45 * t})`);
  });
}

async function throwDart() {
  const me = run;
  cancelAnimationFrame(raf);
  audio.tension(false);
  const target = { ...aimPoint };
  action.disabled = true;
  action.classList.remove('armed');
  hint.textContent = 'いけーっ！';

  // 1) 腕を頭の横まで引いて、体ごと振りかぶる
  const start = { ...pose };
  await animate(380, (k) => me === run && setPose(tween(start, WINDUP, easeInOut(k))));
  if (me !== run) return;

  // 2) 腕を一気に前へ振り抜く。途中でダーツが手を離れて飛んでいく
  let flight = null;
  await animate(210, (k) => {
    if (me !== run) return;
    setPose(tween(WINDUP, FOLLOW, easeIn(k)));
    if (!flight && pose.fore >= RELEASE_FORE) flight = launch(heldTipNow(), target, me);
  });
  if (me !== run) return;
  flight ??= launch(heldTipNow(), target, me);
  // 3) 投げ終わった姿勢から、ゆっくり元に戻る(ダーツの飛行と同時に)
  animate(650, (k) => me === run && setPose(tween(FOLLOW, REST, easeInOut(k))));
  await flight;
  if (me !== run) return;
  aimEl().setAttribute('visibility', 'hidden');
  audio.thud();
  const wrap = $('mapWrap');
  wrap.classList.remove('shake');
  void wrap.offsetWidth;
  wrap.classList.add('shake');

  const station = pickStation(target, stations);
  await revealStation(station, target, me);
  if (me !== run) return;
  setFace($('chara'), 'happy');
  dispatch('landed');
  action.textContent = 'もう一回投げる';
  action.disabled = false;
  hint.textContent = '行き慣れた駅だったら、投げ直してもOK';
}

async function revealStation(station, target, me) {
  const hit = $('hit');
  hit.innerHTML = `
    <path d="M${target.x} ${target.y} L${station.x} ${station.y}" stroke="#111" stroke-width="3" stroke-dasharray="6 6"/>
    <circle cx="${station.x}" cy="${station.y}" r="16" class="hit-ring"/>
    <circle cx="${station.x}" cy="${station.y}" r="8" fill="#E53935" stroke="#111" stroke-width="3"/>`;

  // 駅に向かってズーム(発表の文字が下に出るので、駅は少し上に置く)
  const zw = 440;
  const zh = zw * (H / W);
  const zx = Math.min(Math.max(station.x - zw / 2, -60), W - zw + 60);
  const zy = Math.min(Math.max(station.y - zh * 0.38, -60), H - zh + 60);
  await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 350));
  if (me !== run) return;
  await animate(700, (k) => {
    if (me !== run) return;
    const t = ease(k);
    setView(zx * t, zy * t, W + (zw - W) * t, H + (zh - H) * t);
  });
  if (me !== run) return;

  $('announceName').textContent = station.name;
  $('announceWard').textContent = station.ward;
  $('announce').hidden = false;
  audio.duck();
  audio.fanfare();
  renderPlan(station);
}

// ---------- プラン表示 ----------
// 食べログ式の「〜2,999円」は100円単位に丸めて「〜3,000円」と見せる
const yen = (n) => '¥' + (Math.round(n / 100) * 100).toLocaleString('ja-JP');
const yenRange = ([a, b]) => (a === b ? yen(a) : `${yen(a)}〜${yen(b)}`);
const minutes = (m) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}時間${r ? r + '分' : ''}` : `${r}分`;
};
const stayRange = ([a, b]) => (a === b ? minutes(a) : `${minutes(a)}〜${minutes(b)}`);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderPlan(station) {
  const plan = buildPlan(station, shops);
  $('planStation').textContent = station.name;
  $('steps').innerHTML = plan.steps.map((step, i) => {
    const list = step.shops.length
      ? step.shops.map((shop) => `
        <div class="shop">
          <div class="shop-row">
            <a class="shop-name" href="${esc(shop.mapUrl)}" target="_blank" rel="noopener">${esc(shop.name)}</a>
            <a class="shop-map" href="${esc(shop.mapUrl)}" target="_blank" rel="noopener">Googleマップ</a>
          </div>
          ${shop.via ? `<span class="shop-via">となりの${esc(shop.via)}駅エリア</span>` : ''}
          <span class="shop-note">${esc(shop.note)}</span>
          <span class="shop-meta">予算 ${shop.budget ? yenRange(shop.budget) : '不明'}${shop.stay ? ` ・ 滞在 ${stayRange(shop.stay)}` : ''}</span>
        </div>`).join('')
      : '<p class="no-shop">このジャンルは駅の近くで見つからなかったので、地図検索で探そう。</p>';
    return `
      <li class="step">
        <div class="step-head">
          <span class="step-no">${i + 1}軒目</span>
          <span class="step-genre">${step.label}</span>
          <span class="step-meta">目安 ${yenRange(step.budget)} ・ ${stayRange(step.stay)}</span>
        </div>
        <div class="step-body">${list}
          <a class="search" href="${step.searchUrl}" target="_blank" rel="noopener">ほかの「${step.label}」を探す →</a>
        </div>
      </li>`;
  }).join('');
  $('total').innerHTML = `
    <span>プラン合計</span><b>${yenRange(plan.total.budget)}</b><b>${stayRange(plan.total.stay)}</b>
    <small>1人あたりの目安。店の予算が分からないときは、ジャンルの標準値で計算しています。</small>`;
  $('planEmpty').hidden = true;
  $('planBody').hidden = false;
}

// ---------- 操作 ----------
action.addEventListener('click', () => {
  audio.unlock();
  dispatch(state === 'idle' ? 'start' : state === 'aiming' ? 'throw' : 'retry');
});
// click は左クリックとタップだけで起き、スクロールでは起きない
svg.addEventListener('click', () => {
  if (state !== 'aiming') return;
  audio.unlock();
  dispatch('throw');
});
// スペースキーは常にゲーム操作(ページのスクロールやボタンの二重押しにしない)
const ownsSpace = (e) => e.code === 'Space' && !(e.target instanceof HTMLAnchorElement) && !e.target.closest?.('.bar, #reset');
document.addEventListener('keydown', (e) => {
  if (!ownsSpace(e)) return;
  e.preventDefault();
  if (e.repeat || state === 'flying') return;
  audio.unlock();
  dispatch(state === 'idle' ? 'start' : state === 'aiming' ? 'throw' : 'retry');
});
document.addEventListener('keyup', (e) => {
  if (ownsSpace(e)) e.preventDefault();
});
$('reset').addEventListener('click', () => dispatch('reset'));
function toggle(id, label, apply) {
  $(id).addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    e.currentTarget.textContent = `${label} ${on ? 'ON' : 'OFF'}`;
    apply(on);
    if (on) audio.unlock();
  });
}
toggle('bgm', 'BGM', (on) => audio.setBgm(on));
toggle('sound', '効果音', (on) => audio.setSfx(on));

drawMap();
setPose(REST);
setFace($('chara'), 'normal');
