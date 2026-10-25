// ゲームの純粋なロジック(画面に依存しない)

// 大きいほど当たりやすい。判定は「重み付き距離」が最小の駅
export const RANK_WEIGHTS = { nerai: 3, center: 2.2, jutaku: 0.5 };
// 駅の点からこの距離以内に刺さったら、重みに関係なく一番近い駅(直撃)
export const DIRECT_HIT = 12;
// 重みが効くのは駅からこの距離まで。それより遠くは素の距離で伸びる
// (駅の少ない地域で、1つの狙い目駅が区の大半を取ってしまうのを防ぐ)
export const BONUS_REACH = 60;

export const GENRES = ['izakaya', 'tokucho', 'snack'];
export const GENRE_LABEL = { izakaya: '大衆居酒屋', tokucho: '特徴のある居酒屋', snack: 'スナック' };
const SEARCH_WORD = { izakaya: '大衆居酒屋', tokucho: '立ち飲み', snack: 'スナック' };

export const STANDARD = {
  izakaya: { budget: [2500, 3000], stay: [90, 90] },
  tokucho: { budget: [2000, 3000], stay: [60, 60] },
  snack: { budget: [3000, 5000], stay: [60, 90] },
};

const weighted = (d, w) => (d <= BONUS_REACH ? d / w : BONUS_REACH / w + (d - BONUS_REACH));

function argmin(stations, score) {
  let best = null;
  let bestScore = Infinity;
  for (const s of stations) {
    const v = score(s);
    if (v < bestScore) {
      bestScore = v;
      best = s;
    }
  }
  return best;
}

export function pickStation(point, stations) {
  const dist = (s) => Math.hypot(s.x - point.x, s.y - point.y);
  const nearest = argmin(stations, dist);
  if (dist(nearest) <= DIRECT_HIT) return nearest;
  return argmin(stations, (s) => weighted(dist(s), RANK_WEIGHTS[s.rank]));
}

function inRing({ x, y }, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function isInsideWards(point, wardPolygons) {
  return wardPolygons.some((ring) => inRing(point, ring));
}

// 速い正弦波を重ねた不規則な動き。seed で周波数と位相が変わる
export function aimAt(tMs, seed, { minX, maxX, minY, maxY }) {
  const r = (k) => {
    const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const wave = (axis) =>
    0.55 * Math.sin(tMs * (0.009 + 0.004 * r(axis + 1)) + 6.28 * r(axis + 2)) +
    0.3 * Math.sin(tMs * (0.017 + 0.006 * r(axis + 3)) + 6.28 * r(axis + 4)) +
    0.15 * Math.sin(tMs * (0.031 + 0.01 * r(axis + 5)) + 6.28 * r(axis + 6));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return {
    x: clamp(cx + wave(0) * (maxX - minX) / 2, minX, maxX),
    y: clamp(cy + wave(10) * (maxY - minY) / 2, minY, maxY),
  };
}

export function searchUrl(stationName, genre) {
  return 'https://www.google.com/maps/search/' + encodeURIComponent(`${stationName}駅 ${SEARCH_WORD[genre]}`);
}

// 店に値があればその範囲(最小〜最大)、なければ標準値
function range(shops, key, fallback) {
  const vals = shops.map((s) => s[key]).filter(Boolean);
  if (!vals.length) return fallback;
  return [Math.min(...vals.map((v) => v[0])), Math.max(...vals.map((v) => v[1]))];
}

export function buildPlan(station, shopsByStation) {
  const data = shopsByStation[station.name] ?? {};
  const steps = GENRES.map((genre) => {
    const shops = data[genre] ?? [];
    return {
      genre,
      label: GENRE_LABEL[genre],
      shops,
      searchUrl: searchUrl(station.name, genre),
      budget: range(shops, 'budget', STANDARD[genre].budget),
      stay: range(shops, 'stay', STANDARD[genre].stay),
    };
  });
  const sum = (key, i) => steps.reduce((a, s) => a + s[key][i], 0);
  return { steps, total: { budget: [sum('budget', 0), sum('budget', 1)], stay: [sum('stay', 0), sum('stay', 1)] } };
}

const TRANSITIONS = {
  idle: { start: 'aiming' },
  aiming: { throw: 'flying' },
  flying: { landed: 'announced' },
  announced: { retry: 'aiming' },
};

export function nextState(state, event) {
  if (event === 'reset') return 'idle';
  return TRANSITIONS[state]?.[event] ?? state;
}
