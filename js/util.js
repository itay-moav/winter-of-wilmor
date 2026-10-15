// Shared helpers: randomness, dice, small utilities.
window.BT = window.BT || {};
(function () {
  const U = {};

  // Seeded PRNG (mulberry32) used for deterministic map generation.
  U.seeded = function (seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (n) => Math.floor(r() * n);
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    return r;
  };

  U.rand = (n) => Math.floor(Math.random() * n);
  U.chance = (p) => Math.random() < p;
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // roll(n, sides, plus)
  U.roll = function (n, s, plus) {
    let t = plus || 0;
    for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * s);
    return t;
  };
  // dice as [n, sides, plus]
  U.rollD = (d) => (d ? U.roll(d[0], d[1], d[2] || 0) : 0);
  U.diceStr = (d) => d[0] + 'd' + d[1] + (d[2] ? (d[2] > 0 ? '+' : '') + d[2] : '');

  // Weighted pick from [[value, weight], ...]
  U.weighted = function (list, rng) {
    const r = rng || Math.random;
    let total = 0;
    for (const [, w] of list) total += w;
    let x = r() * total;
    for (const [v, w] of list) {
      x -= w;
      if (x < 0) return v;
    }
    return list[list.length - 1][0];
  };

  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Directions: 0=N 1=E 2=S 3=W
  U.DX = [0, 1, 0, -1];
  U.DY = [-1, 0, 1, 0];
  U.DIRNAME = ['North', 'East', 'South', 'West'];

  BT.U = U;
})();
