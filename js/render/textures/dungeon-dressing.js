// Texture pack: dungeon set dressing - wall decals (torches, moss, algae, carvings...), water and stone floors, ceilings and props.
// Wall decals (dc_*, transparent overlays composited over a base wall: row 0 = ceiling line,
// row 127 = floor line), full walls, floors and ceilings (opaque, tileable) and props (pr_*,
// transparent billboards standing on the bottom edge or hanging from the top).
(function () {
  BT.TX.addPack(function (A) {
    const TS = A.TS, PI = Math.PI, TAU = PI * 2;
    A.seed(9137);
    const R = A.rng;
    const rnd = (a, b) => a + (b - a) * R();
    const ri = (a, b) => Math.floor(rnd(a, b + 1));
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    function mk() { const c = A.canvas(); return [c, c.getContext('2d')]; }

    // ---------- tileable value noise ----------
    const NG = 64, ngrid = new Float32Array(NG * NG);
    for (let i = 0; i < ngrid.length; i++) ngrid[i] = R();
    function vn(x, y, f, o) {
      o = o || 0;
      const fx = x * f / TS, fy = y * f / TS, ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const x0 = ((ix % f) + f) % f, y0 = ((iy % f) + f) % f, x1 = (x0 + 1) % f, y1 = (y0 + 1) % f;
      const ox = o % NG, oy = (o * 7) % NG;
      const a = ngrid[(x0 + ox) % NG + ((y0 + oy) % NG) * NG], b = ngrid[(x1 + ox) % NG + ((y0 + oy) % NG) * NG];
      const c = ngrid[(x0 + ox) % NG + ((y1 + oy) % NG) * NG], d = ngrid[(x1 + ox) % NG + ((y1 + oy) % NG) * NG];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    }
    function fbm(x, y, o) { return vn(x, y, 4, o) * 0.45 + vn(x, y, 8, o) * 0.27 + vn(x, y, 16, o) * 0.17 + vn(x, y, 32, o) * 0.11; }

    function pix(ctx, fn) {
      const img = ctx.getImageData(0, 0, TS, TS), d = img.data;
      for (let y = 0, i = 0; y < TS; y++) for (let x = 0; x < TS; x++, i += 4) fn(x, y, d, i);
      ctx.putImageData(img, 0, 0);
    }
    // grain only where something is drawn (keeps decals transparent)
    function grain(ctx, amt) {
      pix(ctx, (x, y, d, i) => { if (!d[i + 3]) return; const n = (R() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; });
    }
    function mottle(ctx, amt, o) {
      pix(ctx, (x, y, d, i) => { if (!d[i + 3]) return; const m = 1 + (fbm(x, y, o) - 0.5) * amt * 2; d[i] *= m; d[i + 1] *= m; d[i + 2] *= m; });
    }
    function glow(ctx, x, y, r, rgb, a) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
      g.addColorStop(0.35, 'rgba(' + rgb + ',' + (a * 0.5) + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    function ell(ctx, x, y, rx, ry, col, rot) { if (col) ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); ctx.fill(); }
    function poly(ctx, pts, col) { if (col) ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); ctx.fill(); }
    function line(ctx, x0, y0, x1, y1, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (let k = 0; k < stops.length; k += 2) g.addColorStop(stops[k], stops[k + 1]); return g; }
    // draw f at the 9 wrapped offsets so the result tiles
    function wrap(ctx, f) { for (const dx of [-TS, 0, TS]) for (const dy of [-TS, 0, TS]) { ctx.save(); ctx.translate(dx, dy); f(); ctx.restore(); } }
    function wrapX(ctx, f) { for (const dx of [-TS, 0, TS]) { ctx.save(); ctx.translate(dx, 0); f(); ctx.restore(); } }

    // ---------- shared drawing pieces ----------
    function tear(ctx, x, yb, w, h, lean) {
      ctx.beginPath(); ctx.moveTo(x + lean, yb - h);
      ctx.bezierCurveTo(x + w * 0.5 + lean * 0.4, yb - h * 0.6, x + w, yb - h * 0.2, x, yb);
      ctx.bezierCurveTo(x - w, yb - h * 0.2, x - w * 0.5 + lean * 0.4, yb - h * 0.6, x + lean, yb - h);
      ctx.fill();
    }
    function flame(ctx, x, yb, w, h, halo) {
      if (halo !== false) glow(ctx, x, yb - h * 0.45, h * 1.25, '255,150,60', 0.42);
      ctx.fillStyle = '#b8261a'; tear(ctx, x, yb, w, h, rnd(-2, 2));
      ctx.fillStyle = '#f2561c'; tear(ctx, x - w * 0.4, yb - h * 0.05, w * 0.55, h * 0.72, -w * 0.4); tear(ctx, x + w * 0.4, yb - h * 0.05, w * 0.5, h * 0.66, w * 0.4);
      ctx.fillStyle = '#ff8a26'; tear(ctx, x, yb, w * 0.8, h * 0.86, rnd(-1, 1));
      ctx.fillStyle = '#ffc443'; tear(ctx, x, yb - h * 0.02, w * 0.56, h * 0.62, 0);
      ctx.fillStyle = '#fff8d0'; tear(ctx, x, yb - h * 0.04, w * 0.28, h * 0.34, 0);
    }
    function candleFlame(ctx, x, y, s) {
      glow(ctx, x, y - s, s * 4.5, '255,190,90', 0.45);
      ctx.fillStyle = '#ff9a2a'; tear(ctx, x, y, s * 0.75, s * 2.4, 0);
      ctx.fillStyle = '#ffe9a0'; tear(ctx, x, y - s * 0.15, s * 0.42, s * 1.5, 0);
      ctx.fillStyle = '#fff'; tear(ctx, x, y - s * 0.25, s * 0.2, s * 0.7, 0);
    }
    function bez(p, t) {
      const u = 1 - t;
      return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6],
        u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]];
    }
    // tapered stroke along a cubic bezier p = [x0,y0,c1x,c1y,c2x,c2y,x1,y1]
    function taper(ctx, p, w0, w1, col, hi, sh) {
      const N = 22, pts = [];
      for (let k = 0; k <= N; k++) pts.push(bez(p, k / N));
      ctx.lineCap = 'round';
      const pass = (c, dx, dy, sc) => {
        ctx.strokeStyle = c;
        for (let k = 0; k < N; k++) {
          ctx.lineWidth = Math.max(0.6, (w0 + (w1 - w0) * k / N) * sc);
          ctx.beginPath(); ctx.moveTo(pts[k][0] + dx, pts[k][1] + dy); ctx.lineTo(pts[k + 1][0] + dx, pts[k + 1][1] + dy); ctx.stroke();
        }
      };
      if (sh) pass(sh, 1.3, 1.6, 1.05);
      pass(col, 0, 0, 1);
      if (hi) pass(hi, -w0 * 0.2, -w0 * 0.15, 0.32);
      return pts;
    }
    function chain(ctx, pts, L, dark, light) {
      let acc = 0, k = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const x0 = pts[i][0], y0 = pts[i][1], x1 = pts[i + 1][0], y1 = pts[i + 1][1];
        const seg = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
        while (acc <= seg) {
          const t = seg ? acc / seg : 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          if (k % 2 === 0) {
            ctx.lineWidth = 2; ctx.strokeStyle = dark; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.62, L * 0.38, 0, 0, TAU); ctx.stroke();
            ctx.lineWidth = 0.9; ctx.strokeStyle = light; ctx.beginPath(); ctx.ellipse(0, -0.4, L * 0.6, L * 0.36, 0, PI * 1.1, PI * 1.9); ctx.stroke();
          } else {
            ctx.fillStyle = dark; ctx.fillRect(-L * 0.62, -1.4, L * 1.24, 2.8);
            ctx.fillStyle = light; ctx.fillRect(-L * 0.5, -1.4, L, 0.9);
          }
          ctx.restore(); acc += L * 0.86; k++;
        }
        acc -= seg;
      }
    }
    function sag(x0, y0, x1, y1, dip, n) { const p = []; n = n || 20; for (let k = 0; k <= n; k++) { const t = k / n; p.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * PI) * dip]); } return p; }
    function bone(ctx, x, y, len, ang, w, col) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-len / 2 + 1, -w / 2 + 1.5, len, w);
      ctx.fillStyle = col; ctx.fillRect(-len / 2, -w / 2, len, w);
      for (const s of [-1, 1]) { ell(ctx, s * len / 2, -w * 0.42, w * 0.62, w * 0.6); ell(ctx, s * len / 2, w * 0.42, w * 0.62, w * 0.6); }
      ctx.fillStyle = 'rgba(255,255,240,0.4)'; ctx.fillRect(-len / 2, -w / 2, len, w * 0.3);
      ctx.fillStyle = 'rgba(70,45,20,0.35)'; ctx.fillRect(-len / 2, w * 0.15, len, w * 0.35);
      ctx.restore();
    }
    function skull(ctx, x, y, s, col, turn) {
      turn = turn || 0;
      ctx.fillStyle = col;
      ell(ctx, x, y, s, s * 0.9);
      ctx.beginPath(); ctx.moveTo(x - s * 0.62, y + s * 0.25); ctx.lineTo(x - s * 0.48 + turn, y + s * 1.12); ctx.lineTo(x + s * 0.48 + turn, y + s * 1.12); ctx.lineTo(x + s * 0.62, y + s * 0.25); ctx.fill();
      const g = ctx.createRadialGradient(x - s * 0.35, y - s * 0.45, s * 0.1, x, y + s * 0.2, s * 1.35);
      g.addColorStop(0, 'rgba(255,255,240,0.5)'); g.addColorStop(0.6, 'rgba(255,255,240,0)'); g.addColorStop(1, 'rgba(50,30,10,0.55)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 1.02, s * 1.08, 0, 0, TAU); ctx.fill();
      ell(ctx, x - s * 0.37 + turn, y + s * 0.2, s * 0.27, s * 0.25, '#140c06');
      ell(ctx, x + s * 0.37 + turn, y + s * 0.2, s * 0.27, s * 0.25, '#140c06');
      poly(ctx, [x + turn, y + s * 0.45, x - s * 0.1 + turn, y + s * 0.68, x + s * 0.1 + turn, y + s * 0.68], '#20140a');
      ctx.fillStyle = 'rgba(30,18,8,0.7)';
      for (let k = -2; k <= 2; k++) ctx.fillRect(x + turn + k * s * 0.17 - 0.4, y + s * 0.84, 0.8, s * 0.24);
    }
    function flake(ctx, x, y, r, col, lw) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU - PI / 2, c = Math.cos(a), s = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c * r, y + s * r); ctx.stroke();
        for (const f of [0.45, 0.72]) {
          const mx = x + c * r * f, my = y + s * r * f, bl = r * (f < 0.5 ? 0.3 : 0.2);
          for (const sg of [-1, 1]) { const b = a + sg * 0.75; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(b) * bl, my + Math.sin(b) * bl); ctx.stroke(); }
        }
      }
      ctx.restore();
    }
    // carved symbol: dark groove with a lit lower edge
    function carve(ctx, sym, x, y, r) {
      A.symbol[sym](ctx, x + 1, y + 1.2, r, 'rgba(255,255,255,0.22)');
      A.symbol[sym](ctx, x - 0.6, y - 0.6, r, 'rgba(0,0,0,0.75)');
      A.symbol[sym](ctx, x, y, r, 'rgba(20,16,14,0.55)');
    }
    function stoneRect(ctx, x, y, w, h, col) {
      ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fillRect(x + 1, y + 1, w - 2, 1.5); ctx.fillRect(x + 1, y + 1, 1.5, h - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 1, y + h - 2.5, w - 2, 1.5); ctx.fillRect(x + w - 2.5, y + 1, 1.5, h - 2);
    }
    // tileable flagstones
    function flags(ctx, base, rowH, mot) {
      ctx.fillStyle = A.shade(base, 0.42); ctx.fillRect(0, 0, TS, TS);
      for (let y = 0; y < TS; y += rowH) {
        const x0 = Math.floor(rnd(0, 24)); let x = x0;
        while (x < x0 + TS) {
          let w = pick([24, 32, 40, 48]); const rem = x0 + TS - x;
          if (rem - w < 16) w = rem;
          const col = A.shade(base, 0.76 + R() * 0.4);
          stoneRect(ctx, x, y, w, rowH, col); stoneRect(ctx, x - TS, y, w, rowH, col);
          x += w;
        }
      }
      mottle(ctx, mot || 0.35, ri(0, 60));
    }
    // ragged blob edge used by moss/frost
    function crystalPrism(ctx, x, y, len, ang, w, light, mid, dark) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      // pointing along -y
      poly(ctx, [-w, 0, -w, -len * 0.8, 0, -len, w, -len * 0.8, w, 0], mid);
      poly(ctx, [-w, 0, -w, -len * 0.8, 0, -len, -w * 0.15, -len * 0.8, -w * 0.15, 0], dark);
      poly(ctx, [w * 0.35, 0, w * 0.35, -len * 0.8, 0, -len, w, -len * 0.8, w, 0], light);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-w * 0.15, -2); ctx.lineTo(-w * 0.15, -len * 0.8); ctx.lineTo(0, -len); ctx.stroke();
      ctx.restore();
    }
    function hourglass(ctx, x, y, h, frame, glass) {
      const w = h * 0.42;
      ctx.fillStyle = glass;
      ctx.beginPath(); ctx.moveTo(x - w, y - h); ctx.quadraticCurveTo(x - w, y - h * 0.2, x - 1, y); ctx.quadraticCurveTo(x - w, y + h * 0.2, x - w, y + h);
      ctx.lineTo(x + w, y + h); ctx.quadraticCurveTo(x + w, y + h * 0.2, x + 1, y); ctx.quadraticCurveTo(x + w, y - h * 0.2, x + w, y - h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - h * 0.85); ctx.quadraticCurveTo(x - w * 0.6, y - h * 0.3, x - 1.5, y - h * 0.08); ctx.stroke();
      ctx.fillStyle = frame;
      ctx.fillRect(x - w - 2, y - h - 2.5, w * 2 + 4, 2.5); ctx.fillRect(x - w - 2, y + h, w * 2 + 4, 2.5);
      ctx.fillRect(x - w - 2, y - h, 1.4, h * 2); ctx.fillRect(x + w + 0.6, y - h, 1.4, h * 2);
    }
    function clockFace(ctx, x, y, r, rim) {
      ell(ctx, x, y, r + 2.5, r + 2.5, rim);
      ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, r + 2, PI * 1.05, PI * 1.7); ctx.stroke();
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      g.addColorStop(0, '#fbf3dc'); g.addColorStop(1, '#c9b892');
      ell(ctx, x, y, r, r, g);
      ctx.strokeStyle = '#3a2a1a';
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * TAU; ctx.lineWidth = k % 3 ? 0.7 : 1.4;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); ctx.lineTo(x + Math.cos(a) * r * 0.94, y + Math.sin(a) * r * 0.94); ctx.stroke();
      }
      // every clock stopped at 11:47
      const am = (47 / 60) * TAU - PI / 2, ah = ((11 + 47 / 60) / 12) * TAU - PI / 2;
      ctx.lineCap = 'round';
      line(ctx, x, y, x + Math.cos(ah) * r * 0.5, y + Math.sin(ah) * r * 0.5, '#1a120c', Math.max(1.2, r * 0.12));
      line(ctx, x, y, x + Math.cos(am) * r * 0.8, y + Math.sin(am) * r * 0.8, '#1a120c', Math.max(0.8, r * 0.07));
      ell(ctx, x, y, 1.2, 1.2, '#b08a3a');
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r * 0.8, PI * 1.1, PI * 1.45); ctx.stroke();
    }
    function frostEdge(ctx, mask, amt) {
      // mask(x,y) -> 0..1 coverage of rime
      pix(ctx, (x, y, d, i) => {
        const m = mask(x, y);
        if (m <= 0) return;
        const t = Math.min(1, m) * (amt || 0.85), sp = R() < 0.04 * m ? 40 : 0;
        d[i] = d[i] + (225 + sp - d[i]) * t; d[i + 1] = d[i + 1] + (238 + sp - d[i + 1]) * t; d[i + 2] = d[i + 2] + (250 - d[i + 2]) * t;
        if (d[i + 3] < 255) d[i + 3] = Math.max(d[i + 3], 255 * t);
      });
    }
    function icicle(ctx, x, y, w, len) {
      const g = lin(ctx, x - w, 0, x + w, 0, [0, 'rgba(150,195,230,0.9)', 0.4, 'rgba(235,248,255,0.98)', 1, 'rgba(120,170,210,0.85)']);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 0.5, y + len * 0.5, x + rnd(-0.5, 0.5), y + len); ctx.quadraticCurveTo(x + w * 0.5, y + len * 0.5, x + w, y); ctx.closePath(); ctx.fill();
      line(ctx, x - w * 0.3, y + 1, x - w * 0.05, y + len * 0.7, 'rgba(255,255,255,0.9)', 0.7);
      ell(ctx, x, y + len + 1.5, 0.9, 1.3, 'rgba(210,240,255,0.8)');
    }

    // =====================================================================
    // WALL DECALS
    // =====================================================================
    function sconce(ctx, lit) {
      // soot stain above
      glow(ctx, 64, lit ? 18 : 30, 26, '10,8,6', 0.45);
      // wall plate
      const plate = lin(ctx, 56, 0, 72, 0, [0, '#1a1716', 0.5, '#3b3532', 1, '#151210']);
      ctx.fillStyle = plate; ctx.beginPath(); ctx.moveTo(57, 62); ctx.lineTo(71, 62); ctx.lineTo(73, 88); ctx.lineTo(64, 96); ctx.lineTo(55, 88); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,140,120,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
      for (const [rx, ry] of [[59.5, 66], [68.5, 66], [64, 90]]) { ell(ctx, rx, ry, 1.6, 1.6, '#0c0a09'); ell(ctx, rx - 0.4, ry - 0.5, 0.7, 0.7, '#8a7a6a'); }
      // bracket arm and ring
      ctx.strokeStyle = '#262120'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(64, 80); ctx.quadraticCurveTo(64, 70, 64, 64); ctx.stroke();
      // torch shaft
      const sh = lin(ctx, 60, 0, 68, 0, [0, '#3a2414', 0.45, '#7a5232', 1, '#2c1a0e']);
      ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(60.5, 52); ctx.lineTo(67.5, 52); ctx.lineTo(66, 84); ctx.lineTo(62, 84); ctx.closePath(); ctx.fill();
      // iron cup and ring
      const cup = lin(ctx, 57, 0, 71, 0, [0, '#141110', 0.4, '#5a504a', 1, '#100d0c']);
      ctx.fillStyle = cup; ctx.beginPath(); ctx.moveTo(56, 56); ctx.lineTo(72, 56); ctx.lineTo(69, 66); ctx.lineTo(59, 66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b605a'; ctx.fillRect(56, 56, 16, 1.4);
      ctx.fillStyle = '#211c1a'; ctx.fillRect(58, 72, 12, 3); ctx.fillStyle = '#5d5550'; ctx.fillRect(58, 72, 12, 1);
      // wrapped head
      ctx.fillStyle = lit ? '#3a2416' : '#1a1410';
      ctx.beginPath(); ctx.ellipse(64, 51, 6.5, 6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = lit ? 'rgba(255,140,60,0.6)' : 'rgba(80,70,60,0.6)'; ctx.lineWidth = 0.8;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(58, 47 + k * 3); ctx.lineTo(70, 49 + k * 3); ctx.stroke(); }
    }
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 40, 62, '255,140,50', 0.32);
      sconce(ctx, true);
      // embers on the wrap
      for (let k = 0; k < 10; k++) ell(ctx, rnd(59, 69), rnd(46, 54), 0.8, 0.8, pick(['#ff7a20', '#ffcf60', '#ff4a10']));
      flame(ctx, 64, 50, 9, 30, false);
      for (let k = 0; k < 6; k++) ell(ctx, 64 + rnd(-10, 10), rnd(6, 22), 0.8, 0.8, 'rgba(255,200,90,0.9)');
      A.grab('dc_torch', c);
    }
    {
      const [c, ctx] = mk();
      sconce(ctx, false);
      // charred, cracked stub with a last ember and a smoke wisp
      ctx.fillStyle = '#0d0b0a'; ctx.beginPath(); ctx.ellipse(64, 47, 5.5, 4, 0, PI, TAU); ctx.fill();
      ell(ctx, 65, 50, 1, 0.8, 'rgba(255,90,30,0.85)');
      for (let k = 0; k < 16; k++) { const t = k / 16, p = bez([64, 44, 56, 34, 72, 24, 60, 8], t); glow(ctx, p[0], p[1], 3 + t * 7, '150,145,140', 0.22 * (1 - t * 0.6)); }
      A.grab('dc_torch_out', c);
    }
    // moss creeping up from the floor and along mortar
    {
      const [c, ctx] = mk();
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, 3), n2 = fbm(x + 40, y + 17, 9);
        const rise = Math.pow(y / TS, 2.2) * 0.75;
        const seam = 0;
        const v = n * 1.1 + rise + seam - 1.05 + n2 * 0.25;
        if (v <= 0) return;
        const a = Math.min(1, v * 5);
        const lt = 0.55 + n2 * 0.8;
        d[i] = (40 + 36 * n2) * lt; d[i + 1] = (70 + 52 * n) * lt; d[i + 2] = (30 + 18 * n2) * lt; d[i + 3] = 255 * a;
      });
      // tufts and sporangia
      for (let k = 0; k < 70; k++) {
        const x = rnd(0, TS), y = 128 - Math.pow(R(), 1.7) * 40;
        ctx.fillStyle = pick(['#7fbf3e', '#5c9a2c', '#a8d860', '#3e6e22']);
        ctx.fillRect(x, y, 1, rnd(1, 3));
      }
      for (let k = 0; k < 18; k++) ell(ctx, rnd(0, TS), 128 - Math.pow(R(), 1.5) * 50, 1, 1, 'rgba(210,240,140,0.8)');
      grain(ctx, 14);
      A.grab('dc_moss', c);
    }
    // lichen rosettes
    {
      const [c, ctx] = mk();
      for (let k = 0; k < 16; k++) {
        const x = rnd(10, 118), y = rnd(30, 120), r = rnd(3, 10), rust = R() < 0.4;
        const cols = rust ? ['#9a4a1c', '#c8682a', '#e0904a'] : ['#8a9a3a', '#b8c460', '#d8de8a'];
        for (let ring = 0; ring < 3; ring++) {
          const rr = r * (1 - ring * 0.3);
          for (let j = 0; j < 10 + rr * 3; j++) {
            const a = rnd(0, TAU), dd = rr * Math.sqrt(R());
            ell(ctx, x + Math.cos(a) * dd, y + Math.sin(a) * dd * 0.85, rnd(0.8, 2), rnd(0.7, 1.6), cols[ring], a);
          }
        }
        ctx.strokeStyle = rust ? 'rgba(90,40,10,0.5)' : 'rgba(60,70,20,0.5)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 0.8, 0, 0, TAU); ctx.stroke();
        for (let j = 0; j < 4; j++) ell(ctx, x + rnd(-r, r) * 0.4, y + rnd(-r, r) * 0.4, 0.9, 0.9, rust ? '#4a1e08' : '#4a5218');
      }
      grain(ctx, 18);
      A.grab('dc_lichen', c);
    }
    // algae below a waterline
    {
      const [c, ctx] = mk();
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, 11), st = vn(x, y * 0.15, 32, 5);
        let v;
        if (y >= 100) v = 0.75 + n * 0.25;
        else v = (st - 0.55) * 3 - (100 - y) / 40 + n * 0.3;
        if (v <= 0) return;
        const a = Math.min(y >= 100 ? 0.55 + vn(x, y, 16, 8) * 0.35 : 0.85, v);
        d[i] = 12 + 20 * n; d[i + 1] = 48 + 50 * n + st * 20; d[i + 2] = 40 + 35 * st; d[i + 3] = 255 * a;
      });
      // scum line
      for (let x = 0; x < TS; x++) {
        const y = 99 + Math.sin(x * 0.2) * 0.8 + vn(x, 0, 16, 2) * 2;
        ctx.fillStyle = 'rgba(120,150,90,0.8)'; ctx.fillRect(x, y, 1, 1.6);
        ctx.fillStyle = 'rgba(30,60,40,0.9)'; ctx.fillRect(x, y + 1.6, 1, 1.4);
      }
      // wet sheen
      for (let k = 0; k < 22; k++) {
        const x = rnd(0, TS), y = rnd(60, 120), h = rnd(6, 20);
        ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [0, 'rgba(190,255,230,0)', 0.5, 'rgba(190,255,230,0.45)', 1, 'rgba(190,255,230,0)']);
        ctx.fillRect(x, y, 1, h);
      }
      for (let k = 0; k < 12; k++) ell(ctx, rnd(0, TS), rnd(103, 126), 1.2, 0.8, 'rgba(220,255,240,0.6)');
      A.grab('dc_algae', c);
    }
    // water stains and drips
    {
      const [c, ctx] = mk();
      for (let k = 0; k < 7; k++) {
        const x0 = rnd(6, 122), w = rnd(3, 11), len = rnd(50, 128), dark = rnd(0.25, 0.45);
        for (let y = 0; y < len; y++) {
          const wy = w * (1 - y / len * 0.6) * (0.8 + vn(x0, y, 32, k) * 0.4), xx = x0 + Math.sin(y * 0.08 + k) * 1.5;
          ctx.fillStyle = 'rgba(8,12,14,' + (dark * (1 - y / len * 0.5)) + ')'; ctx.fillRect(xx - wy / 2, y, wy, 1);
          if (R() < 0.3) { ctx.fillStyle = 'rgba(180,220,230,0.18)'; ctx.fillRect(xx - wy / 2 + 1, y, 1, 1); }
        }
        // a mineral rim at the top
        ell(ctx, x0, 2, w * 0.8, 3, 'rgba(200,200,180,0.35)');
        // droplets along the stain
        for (let j = 0; j < 3; j++) {
          const y = rnd(15, len), x = x0 + Math.sin(y * 0.08 + k) * 1.5;
          ell(ctx, x, y, 1.4, 2, 'rgba(120,160,175,0.85)'); ell(ctx, x - 0.4, y - 0.7, 0.5, 0.6, 'rgba(255,255,255,0.95)');
        }
      }
      // damp patches
      for (let k = 0; k < 4; k++) glow(ctx, rnd(10, 118), rnd(70, 120), rnd(14, 24), '5,10,14', 0.35);
      // puddle line
      ctx.fillStyle = lin(ctx, 0, 118, 0, 128, [0, 'rgba(10,18,22,0)', 0.5, 'rgba(10,18,22,0.6)', 1, 'rgba(10,18,22,0.85)']);
      ctx.fillRect(0, 118, TS, 10);
      for (let x = 0; x < TS; x += rnd(3, 9)) { ctx.fillStyle = 'rgba(170,215,230,0.6)'; ctx.fillRect(x, 125 + rnd(-1, 1), rnd(2, 6), 1); }
      A.grab('dc_drip', c);
    }
    // cracks and chipped stone
    {
      const [c, ctx] = mk();
      // chipped spalls
      for (let k = 0; k < 5; k++) {
        const x = rnd(12, 116), y = rnd(14, 110), r = rnd(5, 11), pts = [];
        for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + rnd(-0.3, 0.3), rr = r * rnd(0.6, 1.1); pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
        poly(ctx, pts, 'rgba(0,0,0,0.42)');
        ctx.save(); ctx.translate(0.8, 1); poly(ctx, pts.map((v) => v), 'rgba(0,0,0,0)'); ctx.restore();
        ctx.strokeStyle = 'rgba(255,250,240,0.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pts[pts.length - 2], pts[pts.length - 1] + 1); for (let j = 0; j < 6; j += 2) ctx.lineTo(pts[j], pts[j + 1] + 1); ctx.stroke();
        for (let j = 0; j < 8; j++) ell(ctx, x + rnd(-r, r) * 0.5, y + rnd(-r, r) * 0.4, rnd(0.5, 1.4), rnd(0.5, 1.2), 'rgba(0,0,0,0.35)');
      }
      // big branching cracks
      const crack = (x, y, a, len, w, depth) => {
        const pts = [[x, y]];
        for (let s = 0; s < len; s += 4) { a += rnd(-0.5, 0.5); x += Math.cos(a) * 4; y += Math.sin(a) * 4; pts.push([x, y]); }
        for (let k = 0; k < pts.length - 1; k++) {
          const ww = w * (1 - k / pts.length) + 0.5;
          line(ctx, pts[k][0] + 0.8, pts[k][1] + 1, pts[k + 1][0] + 0.8, pts[k + 1][1] + 1, 'rgba(255,250,235,0.25)', ww * 0.6);
          line(ctx, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 'rgba(5,4,3,0.92)', ww);
          if (depth < 2 && R() < 0.18) crack(pts[k][0], pts[k][1], a + pick([-1, 1]) * rnd(0.6, 1.2), len * 0.4, ww * 0.6, depth + 1);
        }
      };
      ctx.lineCap = 'round';
      crack(30, 0, 1.3, 90, 3, 0);
      crack(100, 128, -1.9, 70, 2.6, 0);
      crack(128, 40, 2.9, 50, 2, 1);
      // debris at the floor line
      for (let k = 0; k < 14; k++) { const x = rnd(4, 124), s = rnd(1, 3.5); ell(ctx, x + 0.8, 126.5, s, s * 0.5, 'rgba(0,0,0,0.5)'); poly(ctx, [x - s, 126, x - s * 0.4, 126 - s * 1.2, x + s * 0.7, 126 - s, x + s, 126], pick(['#7a756c', '#5e5a52', '#908a7e'])); }
      A.grab('dc_cracks', c);
    }
    // roots breaking through from the top
    function rootsDecal(ctx, amber) {
      // broken stone and earth at the top
      ctx.fillStyle = '#1a120b';
      ctx.beginPath(); ctx.moveTo(10, 0);
      for (let x = 10; x <= 118; x += 6) ctx.lineTo(x, 6 + Math.sin(x * 0.11) * 4 + rnd(0, 6));
      ctx.lineTo(118, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(150,130,110,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      const base = amber ? '#4a3018' : '#5a3a20', hi = amber ? '#c88a3a' : '#9a7048';
      const roots = [];
      for (let k = 0; k < 7; k++) {
        const x0 = rnd(16, 112), len = rnd(50, 125), x1 = x0 + rnd(-30, 30);
        const p = [x0, 4, x0 + rnd(-20, 20), len * 0.35, x1 + rnd(-20, 20), len * 0.7, x1, len];
        roots.push([p, rnd(4, 9)]);
      }
      roots.sort((a, b) => b[1] - a[1]);
      for (const [p, w] of roots) {
        const pts = taper(ctx, p, w, 0.8, base, hi, 'rgba(0,0,0,0.45)');
        // rootlets
        for (let j = 0; j < 4; j++) {
          const q = pts[ri(4, 18)], a = rnd(0, PI);
          taper(ctx, [q[0], q[1], q[0] + Math.cos(a) * 8, q[1] + 6, q[0] + Math.cos(a) * 14, q[1] + 12, q[0] + Math.cos(a) * 18, q[1] + rnd(16, 28)], w * 0.3, 0.4, base, null, null);
        }
        // bark rings
        for (let j = 2; j < 20; j += 3) { const q = pts[j]; ell(ctx, q[0], q[1], w * 0.35 * (1 - j / 22) + 0.4, 0.6, 'rgba(20,10,4,0.6)'); }
        if (amber) {
          // glowing vein along the root
          ctx.lineCap = 'round';
          for (let j = 0; j < pts.length - 1; j++) {
            line(ctx, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], 'rgba(255,170,50,' + (0.85 - j / 40) + ')', Math.max(0.6, w * 0.22 * (1 - j / 22)));
          }
          for (let j = 0; j < 3; j++) { const q = pts[ri(3, 20)]; glow(ctx, q[0], q[1], 9, '255,170,60', 0.45); ell(ctx, q[0], q[1], 1.8, 1.8, '#ffd27a'); }
        }
      }
      // crumbs of earth
      for (let k = 0; k < 20; k++) ell(ctx, rnd(10, 118), rnd(6, 30), rnd(0.5, 1.5), rnd(0.5, 1.2), 'rgba(40,26,14,0.8)');
    }
    {
      const [c, ctx] = mk(); rootsDecal(ctx, false); grain(ctx, 16); A.grab('dc_roots', c);
    }
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 50, 70, '255,150,50', 0.16);
      rootsDecal(ctx, true); A.grab('dc_amberroots', c);
    }
    // shackles and chains
    {
      const [c, ctx] = mk();
      const dark = '#1c1a1a', light = '#8a8580';
      for (const x of [30, 98]) {
        ell(ctx, x, 30, 5, 5, '#141212'); ell(ctx, x - 1, 29, 3.5, 3.5, '#4a4642'); ell(ctx, x, 30, 1.6, 1.6, '#0a0909');
        ctx.strokeStyle = dark; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, 36, 4, 0, TAU); ctx.stroke();
        ctx.strokeStyle = light; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, 36, 4, PI, PI * 1.6); ctx.stroke();
      }
      chain(ctx, sag(30, 40, 98, 40, 34), 6, dark, light);
      // two hanging shackles
      for (const [x, y0, len] of [[30, 40, 52], [98, 40, 40]]) {
        chain(ctx, [[x, y0], [x + 1, y0 + len]], 6, dark, light);
        const cy = y0 + len + 7;
        ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x + 1, cy, 7, 6, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = light; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x + 1, cy, 7, 6, 0, PI * 1.05, PI * 1.7); ctx.stroke();
        ctx.fillStyle = '#2a2624'; ctx.fillRect(x - 2, cy + 4, 6, 4);
        // rust streak below
        ctx.fillStyle = lin(ctx, 0, cy + 8, 0, cy + 30, [0, 'rgba(120,50,20,0.4)', 1, 'rgba(120,50,20,0)']); ctx.fillRect(x - 1, cy + 8, 3, 22);
      }
      A.grab('dc_chains', c);
    }
    // sewer outflow grate
    {
      const [c, ctx] = mk();
      // dark opening with an arched head
      const op = () => { ctx.beginPath(); ctx.moveTo(36, 114); ctx.lineTo(36, 88); ctx.arc(64, 88, 28, PI, 0); ctx.lineTo(92, 114); ctx.closePath(); };
      // voussoirs
      for (let k = 0; k < 9; k++) {
        const a0 = PI + k / 9 * PI, a1 = PI + (k + 1) / 9 * PI;
        ctx.beginPath(); ctx.arc(64, 88, 36, a0 + 0.01, a1 - 0.01); ctx.arc(64, 88, 28, a1 - 0.01, a0 + 0.01, true); ctx.closePath();
        ctx.fillStyle = A.shade('#6a6a5e', 0.8 + R() * 0.35); ctx.fill();
      }
      ctx.fillStyle = '#5c5c52'; ctx.fillRect(28, 88, 8, 30); ctx.fillRect(92, 88, 8, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(28, 88, 8, 1); ctx.fillRect(92, 88, 8, 1);
      op(); ctx.fillStyle = lin(ctx, 0, 60, 0, 114, [0, '#020303', 1, '#0d1612']); ctx.fill();
      // lip
      ctx.fillStyle = '#787868'; ctx.fillRect(26, 112, 76, 5); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(26, 112, 76, 1);
      // iron bars
      ctx.save(); op(); ctx.clip();
      for (let x = 40; x <= 88; x += 8) {
        ctx.fillStyle = lin(ctx, x - 2, 0, x + 2, 0, [0, '#151515', 0.4, '#5d5a55', 1, '#151515']); ctx.fillRect(x - 2, 56, 4, 60);
        ctx.fillStyle = 'rgba(130,60,20,0.5)'; ctx.fillRect(x - 2, 100 + rnd(-6, 6), 4, rnd(3, 8));
      }
      ctx.fillStyle = '#2a2826'; ctx.fillRect(36, 80, 56, 4); ctx.fillStyle = '#6a665e'; ctx.fillRect(36, 80, 56, 1);
      ctx.restore();
      // slime stain under the outflow
      ctx.fillStyle = lin(ctx, 0, 117, 0, 128, [0, 'rgba(30,60,30,0.85)', 1, 'rgba(30,60,30,0.4)']); ctx.fillRect(40, 117, 48, 11);
      // water trickling out over the lip
      ctx.fillStyle = lin(ctx, 0, 110, 0, 128, [0, 'rgba(120,170,160,0.85)', 1, 'rgba(70,120,110,0.7)']);
      ctx.beginPath(); ctx.moveTo(50, 112); ctx.quadraticCurveTo(48, 120, 44, 128); ctx.lineTo(82, 128); ctx.quadraticCurveTo(78, 120, 76, 112); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 10; k++) { const x = rnd(50, 76); line(ctx, x, 112, x + (x - 63) * 0.3, 128, 'rgba(220,255,250,0.55)', 0.7); }
      for (let k = 0; k < 10; k++) ell(ctx, rnd(42, 86), rnd(124, 128), rnd(1, 3), 0.8, 'rgba(230,255,250,0.7)');
      A.grab('dc_grate', c);
    }
    // corroded pipe with valve wheel
    {
      const [c, ctx] = mk();
      const pipeG = lin(ctx, 0, 36, 0, 50, [0, '#4a2a18', 0.25, '#c07a48', 0.45, '#e0a070', 0.7, '#8a4a28', 1, '#2a160c']);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 50, TS, 3);
      ctx.fillStyle = pipeG; ctx.fillRect(0, 36, TS, 14);
      // vertical stub down to the valve
      const vG = lin(ctx, 58, 0, 70, 0, [0, '#3a2012', 0.35, '#c88050', 0.6, '#9a5a32', 1, '#2a160c']);
      ctx.fillStyle = vG; ctx.fillRect(58, 48, 12, 34);
      // flanges
      for (const x of [18, 104]) {
        ctx.fillStyle = lin(ctx, 0, 32, 0, 54, [0, '#2a1a10', 0.3, '#a06a40', 1, '#20120a']); ctx.fillRect(x - 3, 32, 6, 22);
        for (const y of [34, 51]) ell(ctx, x, y, 1.2, 1.2, '#e0b080');
      }
      // brackets into the wall
      for (const x of [40, 88]) { ctx.fillStyle = '#1e1c1a'; ctx.fillRect(x - 2, 33, 4, 20); ctx.fillStyle = '#5a5550'; ctx.fillRect(x - 2, 33, 1, 20); }
      // verdigris
      for (let k = 0; k < 40; k++) {
        const onStub = R() < 0.3, x = onStub ? rnd(58, 70) : rnd(0, TS), y = onStub ? rnd(50, 80) : rnd(37, 49);
        ell(ctx, x, y, rnd(1, 3.5), rnd(0.8, 2), pick(['rgba(80,170,140,0.75)', 'rgba(110,200,170,0.6)', 'rgba(50,120,100,0.7)']));
      }
      // valve wheel
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(62, 82, 4, 6);
      ctx.strokeStyle = '#2a1410'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(64, 70, 12, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#b8402a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(64, 70, 12, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,150,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(64, 70, 12.5, PI * 1.1, PI * 1.6); ctx.stroke();
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; line(ctx, 64, 70, 64 + Math.cos(a) * 11, 70 + Math.sin(a) * 11, '#8a3020', 2); }
      ell(ctx, 64, 70, 3, 3, '#3a2010'); ell(ctx, 63, 69, 1, 1, '#e0a070');
      // drip from the right flange
      ctx.fillStyle = lin(ctx, 0, 54, 0, 128, [0, 'rgba(40,90,80,0.6)', 1, 'rgba(10,20,20,0.1)']); ctx.fillRect(103, 54, 3, 74);
      ell(ctx, 105, 60, 1.5, 2.2, 'rgba(160,220,210,0.9)'); ell(ctx, 104.6, 59.3, 0.5, 0.6, '#fff');
      ell(ctx, 105, 96, 1.3, 2, 'rgba(160,220,210,0.8)');
      ell(ctx, 105, 126, 8, 1.6, 'rgba(120,180,170,0.5)');
      grain(ctx, 12);
      A.grab('dc_pipe', c);
    }
    // cobwebs in the upper corners
    function web(ctx, cx, cy, sx, sy, r, a0, a1, col) {
      const n = 7, spokes = [];
      ctx.strokeStyle = col; ctx.lineWidth = 0.8;
      for (let k = 0; k < n; k++) {
        const a = a0 + (a1 - a0) * k / (n - 1), rr = r * rnd(0.85, 1.05);
        spokes.push([a, rr]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy); ctx.stroke();
      }
      for (let ring = 1; ring <= 7; ring++) {
        const f = ring / 7.5;
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const [a, rr] = spokes[k], x = cx + Math.cos(a) * rr * f * sx, y = cy + Math.sin(a) * rr * f * sy;
          if (!k) ctx.moveTo(x, y);
          else { const [pa, pr] = spokes[k - 1], am = (a + pa) / 2, rm = (rr + pr) / 2 * f * 0.86; ctx.quadraticCurveTo(cx + Math.cos(am) * rm * sx, cy + Math.sin(am) * rm * sy + 1.5, x, y); }
        }
        ctx.stroke();
      }
      // sheet of dusty silk near the corner
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5);
      g.addColorStop(0, 'rgba(220,220,215,0.45)'); g.addColorStop(1, 'rgba(220,220,215,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    {
      const [c, ctx] = mk();
      web(ctx, 0, 0, 1, 1, 52, 0, PI / 2, 'rgba(225,225,220,0.7)');
      web(ctx, 128, 0, 1, 1, 44, PI / 2, PI, 'rgba(225,225,220,0.7)');
      // a loose dangling strand with a spider
      line(ctx, 96, 0, 92, 46, 'rgba(225,225,220,0.6)', 0.6);
      ell(ctx, 92, 48, 2.2, 2.6, '#140e0c'); ell(ctx, 92, 45, 1.4, 1.4, '#140e0c');
      ctx.strokeStyle = '#140e0c'; ctx.lineWidth = 0.6;
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(92, 47 + k * 0.6); ctx.quadraticCurveTo(92 + s * 4, 44 + k * 2, 92 + s * 5, 48 + k * 2.2); ctx.stroke(); }
      A.grab('dc_cobweb', c);
    }
    // rime and icicles
    {
      const [c, ctx] = mk();
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, 21), edge = 10 + n * 22 + vn(x, 0, 32, 4) * 6;
        const side = Math.min(x, 127 - x), sideEdge = (3 + n * 10) * Math.max(0, 1 - y / 70);
        let a = 0;
        if (y < edge) a = Math.min(1, (edge - y) / 6);
        if (side < sideEdge) a = Math.max(a, Math.min(0.8, (sideEdge - side) / 6));
        if (a <= 0) return;
        const s = 205 + n * 50;
        d[i] = s - 15; d[i + 1] = s; d[i + 2] = 255; d[i + 3] = 255 * a * 0.92;
      });
      // feathery frost ferns
      ctx.strokeStyle = 'rgba(235,248,255,0.55)'; ctx.lineWidth = 0.6;
      for (let k = 0; k < 14; k++) {
        let x = rnd(0, TS), y = rnd(14, 30), a = rnd(PI * 0.3, PI * 0.7);
        for (let s = 0; s < 8; s++) {
          const nx = x + Math.cos(a) * 3, ny = y + Math.sin(a) * 3;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(a - 0.9) * 2.5, ny + Math.sin(a - 0.9) * 2.5); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(a + 0.9) * 2.5, ny + Math.sin(a + 0.9) * 2.5); ctx.stroke();
          x = nx; y = ny; a += rnd(-0.3, 0.3);
        }
      }
      for (let k = 0; k < 16; k++) { const x = 6 + k * 7.7 + rnd(-2, 2); icicle(ctx, x, rnd(8, 16), rnd(1.6, 3.6), rnd(10, 48)); }
      for (let k = 0; k < 30; k++) ell(ctx, rnd(0, TS), rnd(0, 26), 0.7, 0.7, '#ffffff');
      A.grab('dc_frost', c);
    }
    // ossuary niche of skulls and bones
    {
      const [c, ctx] = mk();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(12, 26, 104, 82);
      ctx.fillStyle = lin(ctx, 0, 28, 0, 100, [0, '#070605', 1, '#1a1612']); ctx.fillRect(16, 30, 96, 72);
      const bc = ['#d8ccae', '#c8b994', '#e2d8bc', '#bfae88'];
      // stacked long bones (ends towards us: rows of knobs) at the back
      for (let row = 0; row < 4; row++) {
        const y = 92 - row * 9;
        for (let x = 19; x < 110; x += 5.2) { ell(ctx, x + (row % 2) * 2.5, y, 2.8, 3.6, pick(bc)); ell(ctx, x + (row % 2) * 2.5 - 0.6, y - 1, 1.2, 1.4, 'rgba(255,255,245,0.6)'); ell(ctx, x + (row % 2) * 2.5 + 0.8, y + 1.6, 1.4, 1, 'rgba(60,40,20,0.5)'); }
      }
      // long bones laid across
      for (let k = 0; k < 3; k++) bone(ctx, 64 + rnd(-8, 8), 56 + k * 3, 86, rnd(-0.03, 0.03), 3.6, pick(bc));
      // row of skulls on top
      for (let k = 0; k < 6; k++) skull(ctx, 24 + k * 16, 44, 6.6, pick(bc), rnd(-1, 1));
      // lintel and sill
      ctx.fillStyle = '#5a554c'; ctx.fillRect(10, 22, 108, 8); ctx.fillRect(10, 100, 108, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(10, 22, 108, 1.2); ctx.fillRect(10, 100, 108, 1.2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, 29, 108, 1.4); ctx.fillRect(10, 107, 108, 1.4);
      ctx.fillStyle = '#4a463e'; ctx.fillRect(10, 30, 6, 70); ctx.fillRect(112, 30, 6, 70);
      // inner shadow under lintel
      ctx.fillStyle = lin(ctx, 0, 30, 0, 44, [0, 'rgba(0,0,0,0.7)', 1, 'rgba(0,0,0,0)']); ctx.fillRect(16, 30, 96, 14);
      grain(ctx, 16);
      A.grab('dc_ossuary', c);
    }
    // the sleeping stone king in his niche
    {
      const [c, ctx] = mk();
      // carved Root sigil above, partly chiselled over with a crude Dawn sun
      carve(ctx, 'root', 64, 20, 15);
      ctx.strokeStyle = 'rgba(225,215,195,0.55)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (let k = 0; k < 14; k++) { const x = 64 + rnd(-12, 12), y = 20 + rnd(-12, 12); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rnd(-3, 3), y + rnd(2, 5)); ctx.stroke(); }
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(232,222,200,0.75)';
      ctx.beginPath(); ctx.arc(64 + 0.5, 20, 6, 0, TAU); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.15; ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * 8, 20 + Math.sin(a) * 8); ctx.lineTo(64 + Math.cos(a) * (13 + rnd(-1, 2)), 20 + Math.sin(a) * (13 + rnd(-1, 2))); ctx.stroke(); }
      // arched niche
      const arch = () => { ctx.beginPath(); ctx.moveTo(14, 118); ctx.lineTo(14, 64); ctx.quadraticCurveTo(14, 40, 64, 38); ctx.quadraticCurveTo(114, 40, 114, 64); ctx.lineTo(114, 118); ctx.closePath(); };
      arch(); ctx.lineWidth = 6; ctx.strokeStyle = '#4e4a44'; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
      arch(); ctx.fillStyle = lin(ctx, 0, 38, 0, 118, [0, '#08080a', 1, '#1c1a1c']); ctx.fill();
      // slab
      ctx.fillStyle = '#6a665e'; ctx.fillRect(16, 102, 96, 10); ctx.fillStyle = '#8a857a'; ctx.fillRect(16, 102, 96, 2); ctx.fillStyle = '#3e3a34'; ctx.fillRect(16, 112, 96, 6);
      // effigy body (head to the left), lit from above
      const st = lin(ctx, 0, 78, 0, 102, [0, '#b4ada0', 0.5, '#8a8478', 1, '#4e4a42']);
      ctx.fillStyle = st;
      ctx.beginPath(); ctx.moveTo(34, 100); ctx.quadraticCurveTo(36, 86, 46, 84); ctx.quadraticCurveTo(70, 80, 96, 86); ctx.quadraticCurveTo(108, 88, 108, 94); ctx.lineTo(108, 102); ctx.lineTo(34, 102); ctx.closePath(); ctx.fill();
      // feet
      ell(ctx, 106, 88, 3.4, 5, '#9a9488'); ell(ctx, 103, 90, 3.2, 4.4, '#8a8478');
      // folded hands and sword-less rod of the Root (staff along body)
      line(ctx, 46, 88, 100, 88, 'rgba(60,55,48,0.8)', 1.3);
      ell(ctx, 68, 84, 5, 3.4, '#a8a194'); ell(ctx, 67, 83, 2, 1.2, 'rgba(255,255,255,0.3)');
      // robe folds
      for (let k = 0; k < 6; k++) line(ctx, 50 + k * 9, 90, 52 + k * 9, 101, 'rgba(40,36,30,0.45)', 1);
      // pillow and head
      ctx.fillStyle = '#7a756a'; ctx.fillRect(18, 92, 18, 10);
      ell(ctx, 32, 87, 7, 6.5, '#aaa396');
      ell(ctx, 30, 85, 3, 2.2, 'rgba(255,255,255,0.25)');
      // closed eye, nose
      line(ctx, 30, 87, 34, 87, 'rgba(40,36,30,0.8)', 0.8);
      // crown
      ctx.fillStyle = '#c0a868';
      poly(ctx, [25, 84, 25, 76, 27.5, 80, 30, 74, 32.5, 80, 35, 75, 36.5, 81, 37, 84], '#a89660');
      ctx.fillStyle = 'rgba(255,240,190,0.5)'; ctx.fillRect(25, 82, 12, 1);
      // frosted beard flowing down over the chest
      ctx.fillStyle = '#e8f2fa';
      ctx.beginPath(); ctx.moveTo(34, 90); ctx.quadraticCurveTo(44, 88, 52, 92); ctx.quadraticCurveTo(46, 96, 36, 96); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 7; k++) line(ctx, 36 + k * 2, 91, 40 + k * 2.2, 95, 'rgba(160,190,215,0.8)', 0.6);
      for (let k = 0; k < 5; k++) icicle(ctx, 38 + k * 3, 95.5, 0.9, rnd(2, 5));
      // rime on the effigy
      for (let k = 0; k < 40; k++) ell(ctx, rnd(30, 106), rnd(82, 92), rnd(0.5, 1.4), 0.6, 'rgba(230,242,255,0.75)');
      grain(ctx, 12);
      A.grab('dc_king_niche', c);
    }
    // large carved Root sigil
    {
      const [c, ctx] = mk();
      const g = ctx.createRadialGradient(64, 60, 30, 64, 60, 52);
      g.addColorStop(0, 'rgba(255,240,210,0.06)'); g.addColorStop(0.85, 'rgba(255,240,210,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 60, 52, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(64, 60, 51, 0, TAU); ctx.stroke();
      ctx.save(); ctx.lineWidth = 1;
      A.symbol.root(ctx, 65.5, 61.8, 42, 'rgba(255,245,225,0.28)');
      A.symbol.root(ctx, 63.2, 59.2, 42, 'rgba(0,0,0,0.85)');
      A.symbol.root(ctx, 64, 60, 42, 'rgba(26,22,18,0.75)');
      ctx.restore();
      // old amber pigment in the grooves
      A.symbol.root(ctx, 64, 60, 42, 'rgba(170,110,40,0.25)');
      // little moss in the ring
      for (let k = 0; k < 30; k++) { const a = rnd(0.3, PI - 0.3); ell(ctx, 64 + Math.cos(a) * 42, 60 + Math.sin(a) * 42, rnd(0.8, 2), rnd(0.8, 1.5), 'rgba(70,110,40,0.7)'); }
      grain(ctx, 10);
      A.grab('dc_rootsigil', c);
    }
    // Root sigil defaced by a crude Dawn sun
    {
      const [c, ctx] = mk();
      carve(ctx, 'root', 64, 58, 40);
      // gouged chisel marks over the sigil
      ctx.lineCap = 'round';
      for (let k = 0; k < 70; k++) {
        const x = 64 + rnd(-38, 38), y = 58 + rnd(-38, 38);
        if (Math.hypot(x - 64, y - 58) > 42) continue;
        const a = rnd(0.6, 1.2), l = rnd(3, 7);
        line(ctx, x + 0.8, y + 0.8, x + Math.cos(a) * l + 0.8, y + Math.sin(a) * l + 0.8, 'rgba(0,0,0,0.4)', 1.6);
        line(ctx, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 'rgba(215,205,185,0.55)', 1.4);
      }
      // the crude sun, cut in raw pale stone with leftover gilt
      ctx.strokeStyle = 'rgba(230,220,200,0.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, r = 15 + rnd(-1.5, 1.5); ctx[k ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * r, 58 + Math.sin(a) * r); } ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + rnd(-0.1, 0.1); line(ctx, 64 + Math.cos(a) * 20, 58 + Math.sin(a) * 20, 64 + Math.cos(a) * (33 + rnd(-3, 3)), 58 + Math.sin(a) * (33 + rnd(-3, 3)), 'rgba(230,220,200,0.85)', 3); }
      ctx.strokeStyle = 'rgba(214,170,70,0.7)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(64, 58, 15, 0.4, 2.6); ctx.stroke();
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; line(ctx, 64 + Math.cos(a) * 21, 58 + Math.sin(a) * 21, 64 + Math.cos(a) * 30, 58 + Math.sin(a) * 30, 'rgba(214,170,70,0.65)', 1.2); }
      // chips fallen below
      for (let k = 0; k < 12; k++) ell(ctx, rnd(30, 98), rnd(120, 126), rnd(0.8, 2), 0.9, 'rgba(200,190,170,0.8)');
      A.grab('dc_sunchisel', c);
    }
    // Pale Hour frost runes
    function runeSpec() {
      const t = ri(0, 4), n = ri(1, 3), br = [];
      for (let k = 0; k < n; k++) br.push([rnd(-1, 0.6), pick([-1, 1]), pick([-1, 1]) * rnd(0.3, 0.8)]);
      return { t, br };
    }
    function rune(ctx, x, y, s, sp) {
      ctx.beginPath();
      if (sp.t !== 3) { ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); }
      for (const [fy, side, dy] of sp.br) { const sy = y + fy * s; ctx.moveTo(x, sy); ctx.lineTo(x + side * s * 0.6, sy + dy * s); }
      if (sp.t === 3) { ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.55, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.55, y); ctx.closePath(); }
      if (sp.t === 4) { ctx.moveTo(x - s * 0.5, y - s * 0.4); ctx.arc(x, y - s * 0.4, s * 0.5, PI, 0); }
      ctx.stroke();
    }
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 62, 64, '150,210,255', 0.2);
      ctx.lineCap = 'round';
      const rows = [[28, 7], [50, 6], [72, 7], [94, 5]];
      for (const [y, n] of rows) for (let k = 0; k < n; k++) {
        const x = 64 + (k - (n - 1) / 2) * 14 + rnd(-1.5, 1.5), yy = y + rnd(-1.5, 1.5), sp = runeSpec();
        ctx.strokeStyle = 'rgba(0,10,30,0.55)'; ctx.lineWidth = 2.8; rune(ctx, x + 0.8, yy + 0.9, 6, sp);
        ctx.save(); ctx.shadowColor = 'rgba(140,210,255,1)'; ctx.shadowBlur = 7;
        ctx.strokeStyle = '#c4eaff'; ctx.lineWidth = 1.7; rune(ctx, x, yy, 6, sp); ctx.restore();
        line(ctx, x - 0.4, yy - 6, x - 0.4, yy - 2, 'rgba(255,255,255,0.6)', 0.6);
      }
      // a scratched snowflake binding the rows
      ctx.save(); ctx.shadowColor = 'rgba(140,210,255,0.8)'; ctx.shadowBlur = 5; flake(ctx, 64, 114, 9, 'rgba(190,230,255,0.85)', 1.2); ctx.restore();
      A.grab('dc_frost_runes', c);
    }
    // crude scratched crown above a rat
    function scratch(ctx, pts, col) {
      for (let p = 0; p < 2; p++) {
        ctx.strokeStyle = col; ctx.lineWidth = p ? 0.8 : 1.6; ctx.beginPath();
        for (let k = 0; k < pts.length; k += 2) ctx[k ? 'lineTo' : 'moveTo'](pts[k] + rnd(-0.8, 0.8), pts[k + 1] + rnd(-0.8, 0.8));
        ctx.stroke();
      }
    }
    {
      const [c, ctx] = mk();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const S = 'rgba(232,226,210,0.85)', D = 'rgba(0,0,0,0.45)';
      const crown = [38, 50, 34, 24, 47, 38, 56, 18, 64, 36, 74, 16, 82, 38, 94, 22, 90, 50, 38, 50];
      scratch(ctx, crown.map((v, i) => v + (i % 2 ? 1 : 1)), D); scratch(ctx, crown, S);
      scratch(ctx, [42, 44, 86, 44], S);
      for (const x of [34, 56, 74, 94]) { ctx.strokeStyle = S; ctx.beginPath(); ctx.arc(x, x === 56 ? 15 : x === 74 ? 13 : 20, 2.5, 0, TAU); ctx.stroke(); }
      // the rat
      const body = [30, 92, 34, 80, 48, 70, 66, 68, 82, 72, 92, 80, 98, 86, 104, 88, 98, 94, 86, 96, 60, 97, 40, 96, 30, 92];
      scratch(ctx, body.map((v) => v + 1), D); scratch(ctx, body, S);
      scratch(ctx, [92, 76, 94, 68, 98, 74], S); // ear
      scratch(ctx, [30, 92, 18, 90, 10, 82, 8, 70, 14, 62], S); // tail
      scratch(ctx, [48, 96, 46, 104], S); scratch(ctx, [80, 96, 82, 104], S);
      scratch(ctx, [104, 88, 114, 84], S); scratch(ctx, [104, 89, 114, 90], S); // whiskers
      ctx.fillStyle = 'rgba(200,30,20,0.85)'; ell(ctx, 95, 81, 1.6, 1.6);
      // tally marks
      for (let k = 0; k < 6; k++) scratch(ctx, [20 + k * 4, 112, 22 + k * 4, 122], 'rgba(232,226,210,0.6)');
      A.grab('dc_graffiti_crown', c);
    }
    // THE KING BELOW SEES ALL, daubed in red
    {
      const [c, ctx] = mk();
      const lines = [['THE KING', 30], ['BELOW', 62], ['SEES ALL', 94]];
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (const [t, y] of lines) {
        let fs = 26; ctx.font = '900 ' + fs + 'px Impact, "Arial Black", "Helvetica Neue", sans-serif';
        const w = ctx.measureText(t).width; if (w > 116) { fs = Math.floor(fs * 116 / w); ctx.font = '900 ' + fs + 'px Impact, "Arial Black", "Helvetica Neue", sans-serif'; }
        ctx.save(); ctx.translate(64, y); ctx.rotate(rnd(-0.04, 0.04));
        ctx.fillStyle = 'rgba(40,0,0,0.5)'; ctx.fillText(t, 1, 1);
        ctx.fillStyle = '#a3140f'; ctx.fillText(t, 0, 0);
        ctx.fillStyle = 'rgba(220,60,40,0.55)'; ctx.fillText(t, -0.6, -0.8);
        ctx.restore();
        // drips
        const tw = Math.min(116, ctx.measureText(t).width);
        for (let k = 0; k < 6; k++) {
          const x = 64 - tw / 2 + R() * tw, l = rnd(4, 16);
          ctx.fillStyle = '#9a120e'; ctx.fillRect(x, y - 2, 1.6, l); ell(ctx, x + 0.8, y - 2 + l, 1.4, 1.8, '#9a120e');
        }
      }
      // rough out the paint (dry patches)
      pix(ctx, (x, y, d, i) => { if (d[i + 3] && vn(x, y, 32, 13) < 0.28) d[i + 3] *= 0.45; });
      A.grab('dc_red_words', c);
    }
    // soggy Pale Hour tract nailed to the wall
    {
      const [c, ctx] = mk();
      ctx.save(); ctx.translate(64, 66); ctx.rotate(0.06);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-24, -30, 50, 66);
      ctx.fillStyle = lin(ctx, -25, -32, 25, 34, [0, '#e2dcc4', 0.6, '#cfc6a6', 1, '#a89c78']);
      ctx.beginPath(); ctx.moveTo(-25, -32); ctx.lineTo(24, -31); ctx.lineTo(25, 22); ctx.quadraticCurveTo(20, 28, 14, 34); ctx.lineTo(-24, 33); ctx.closePath(); ctx.fill();
      // curled corner
      poly(ctx, [25, 22, 14, 34, 16, 24], '#8a7e60');
      // water stains
      for (let k = 0; k < 5; k++) glow(ctx, rnd(-20, 20), rnd(-10, 30), rnd(6, 14), '90,80,50', 0.3);
      ctx.fillStyle = 'rgba(80,70,40,0.25)'; ctx.fillRect(-25, 22, 50, 12);
      A.symbol.pale(ctx, 0, -14, 12, 'rgba(60,85,130,0.9)');
      ctx.fillStyle = 'rgba(40,40,50,0.7)';
      for (let k = 0; k < 7; k++) ctx.fillRect(-19, 4 + k * 4, 38 - (k === 6 ? 16 : rnd(0, 8)), 1.4);
      ctx.restore();
      ell(ctx, 64, 36, 2, 2, '#2a2420'); ell(ctx, 63.4, 35.4, 0.8, 0.8, '#b0a090');
      ctx.fillStyle = 'rgba(80,40,20,0.45)'; ctx.fillRect(63.5, 38, 1.2, 8);
      grain(ctx, 12);
      A.grab('dc_tract', c);
    }
    // Malthor's banner: red, with a white snowflake
    {
      const [c, ctx] = mk();
      const x0 = 40, x1 = 88;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0 + 3, 10, x1 - x0, 112);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x0, 8); ctx.lineTo(x1, 8); ctx.lineTo(x1, 120); ctx.lineTo(64, 104); ctx.lineTo(x0, 120); ctx.closePath(); ctx.clip();
      ctx.fillStyle = lin(ctx, x0, 0, x1, 0, [0, '#4a0a0c', 0.15, '#8e1a1c', 0.3, '#6a1012', 0.5, '#a8241f', 0.7, '#701214', 0.85, '#9a1e1c', 1, '#420809']);
      ctx.fillRect(x0, 8, x1 - x0, 116);
      ctx.fillStyle = lin(ctx, 0, 8, 0, 120, [0, 'rgba(0,0,0,0.25)', 0.2, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.35)']); ctx.fillRect(x0, 8, x1 - x0, 116);
      // gold trim
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + 3, 12); ctx.lineTo(x0 + 3, 114); ctx.lineTo(64, 99.5); ctx.lineTo(x1 - 3, 114); ctx.lineTo(x1 - 3, 12); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2;
      flake(ctx, 64, 50, 17, '#f4f8ff', 2.6); ctx.restore();
      ell(ctx, 64, 50, 3, 3, '#ffffff');
      // frost on the cloth
      for (let k = 0; k < 40; k++) ell(ctx, rnd(x0, x1), rnd(8, 30), rnd(0.5, 1.3), 0.7, 'rgba(235,245,255,0.6)');
      // pole with finials
      ctx.fillStyle = lin(ctx, 0, 4, 0, 10, [0, '#8a6a30', 0.5, '#e0c070', 1, '#5a4018']); ctx.fillRect(34, 5, 60, 4);
      ell(ctx, 33, 7, 3.2, 3.2, '#d8b860'); ell(ctx, 95, 7, 3.2, 3.2, '#d8b860');
      ell(ctx, 32.2, 6, 1.1, 1.1, '#fff2c0'); ell(ctx, 94.2, 6, 1.1, 1.1, '#fff2c0');
      line(ctx, 64, 0, 64, 5, '#3a3430', 1.2);
      grain(ctx, 12);
      A.grab('dc_banner_snow', c);
    }
    // wall weapon rack
    function spear(ctx, x, y0, y1, ang) {
      ctx.save(); ctx.translate(x, y1); ctx.rotate(ang || 0);
      const L = y1 - y0;
      ctx.fillStyle = lin(ctx, -1.5, 0, 1.5, 0, [0, '#3a2412', 0.5, '#8a6038', 1, '#2a180a']); ctx.fillRect(-1.5, -L + 14, 3, L - 14);
      ctx.fillStyle = '#2a2624'; ctx.fillRect(-2, -L + 12, 4, 4);
      ctx.fillStyle = lin(ctx, -4, 0, 4, 0, [0, '#6a7078', 0.45, '#e4eaf0', 0.55, '#9aa2aa', 1, '#4a5058']);
      ctx.beginPath(); ctx.moveTo(0, -L); ctx.quadraticCurveTo(4.5, -L + 7, 0, -L + 13); ctx.quadraticCurveTo(-4.5, -L + 7, 0, -L); ctx.fill();
      ctx.restore();
    }
    function sword(ctx, x, yTop, len) {
      // hung by its hilt with a downswept guard
      ctx.fillStyle = '#c8a050'; ell(ctx, x, yTop, 2.4, 2.4);
      ctx.fillStyle = '#3a2214'; ctx.fillRect(x - 1.4, yTop + 2, 2.8, 9);
      ctx.strokeStyle = '#a8803a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 7, yTop + 15); ctx.quadraticCurveTo(x, yTop + 9, x + 7, yTop + 15); ctx.stroke();
      ctx.fillStyle = lin(ctx, x - 3, 0, x + 3, 0, [0, '#5a6068', 0.5, '#eef2f6', 0.55, '#a0a8b0', 1, '#50565e']);
      ctx.beginPath(); ctx.moveTo(x - 2.8, yTop + 12); ctx.lineTo(x + 2.8, yTop + 12); ctx.lineTo(x + 2.4, yTop + len - 6); ctx.lineTo(x, yTop + len); ctx.lineTo(x - 2.4, yTop + len - 6); ctx.closePath(); ctx.fill();
      line(ctx, x, yTop + 14, x, yTop + len - 6, 'rgba(60,66,74,0.7)', 0.6);
    }
    function roundShield(ctx, x, y, r, field) {
      ell(ctx, x + 2, y + 2, r, r, 'rgba(0,0,0,0.45)');
      ell(ctx, x, y, r, r, '#3a2a1c');
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
      g.addColorStop(0, A.shade(field, 1.5)); g.addColorStop(1, A.shade(field, 0.6));
      ell(ctx, x, y, r - 2.5, r - 2.5, g);
      for (let k = 0; k < 5; k++) line(ctx, x - r + 3 + k * (r * 2 - 6) / 5, y - r + 4, x - r + 3 + k * (r * 2 - 6) / 5, y + r - 4, 'rgba(0,0,0,0.18)', 0.7);
      ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r - 1, 0, TAU); ctx.stroke();
      const b = ctx.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, r * 0.3);
      b.addColorStop(0, '#f0f0f0'); b.addColorStop(1, '#4a4a4a'); ell(ctx, x, y, r * 0.28, r * 0.28, b);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ell(ctx, x + Math.cos(a) * (r - 4.5), y + Math.sin(a) * (r - 4.5), 0.9, 0.9, '#d0d0d0'); }
    }
    {
      const [c, ctx] = mk();
      // rails
      for (const y of [28, 92]) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, y + 2, 108, 7);
        ctx.fillStyle = lin(ctx, 0, y, 0, y + 6, [0, '#8a6038', 0.4, '#6a4424', 1, '#3a2412']); ctx.fillRect(8, y, 112, 6);
        for (const x of [12, 116]) ell(ctx, x, y + 3, 1.3, 1.3, '#1e1a18');
      }
      for (const [x, a] of [[22, -0.05], [32, 0], [42, 0.05]]) spear(ctx, x, 6, 120, a);
      sword(ctx, 58, 22, 72); sword(ctx, 70, 24, 66);
      roundShield(ctx, 98, 62, 19, '#5a3a24');
      A.symbol.dawn(ctx, 98, 62, 10, 'rgba(220,180,80,0.7)');
      grain(ctx, 10);
      A.grab('dc_weaponrack', c);
    }
    // guardsman's shield with the Dawn sun, frosted
    {
      const [c, ctx] = mk();
      const shape = () => { ctx.beginPath(); ctx.moveTo(34, 26); ctx.lineTo(94, 26); ctx.lineTo(94, 60); ctx.quadraticCurveTo(92, 92, 64, 112); ctx.quadraticCurveTo(36, 92, 34, 60); ctx.closePath(); };
      ctx.save(); ctx.translate(3, 3); shape(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill(); ctx.restore();
      shape(); ctx.fillStyle = lin(ctx, 30, 20, 98, 110, [0, '#d0d6de', 0.5, '#7a828c', 1, '#3a4048']); ctx.fill();
      ctx.save(); ctx.translate(64, 66); ctx.scale(0.88, 0.9); ctx.translate(-64, -66); shape();
      ctx.fillStyle = lin(ctx, 30, 20, 98, 110, [0, '#2e4c8a', 0.5, '#1c3266', 1, '#0e1a3a']); ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(255,200,90,0.6)'; ctx.shadowBlur = 4;
      ell(ctx, 64, 60, 8, 8, '#e8b850');
      A.symbol.dawn(ctx, 64, 60, 20, '#e8c060'); ctx.restore();
      ell(ctx, 61.5, 57.5, 2.5, 2.5, '#fff0b0');
      // rivets
      for (const [x, y] of [[38, 30], [90, 30], [38, 58], [90, 58], [64, 106]]) { ell(ctx, x, y, 1.6, 1.6, '#2a2e34'); ell(ctx, x - 0.5, y - 0.5, 0.7, 0.7, '#f0f4f8'); }
      // frost over the top and rim
      ctx.save(); shape(); ctx.clip();
      pix(ctx, (x, y, d, i) => {
        if (!d[i + 3]) return;
        const f = fbm(x, y, 31) * 1.2 - (y - 26) / 70 + (Math.abs(x - 64) > 24 ? 0.25 : 0);
        if (f > 0.35) { const t = Math.min(0.85, (f - 0.35) * 3); d[i] += (230 - d[i]) * t; d[i + 1] += (242 - d[i + 1]) * t; d[i + 2] += (255 - d[i + 2]) * t; }
      });
      ctx.restore();
      for (let k = 0; k < 7; k++) icicle(ctx, 40 + k * 8 + rnd(-2, 2), 26, 1.4, rnd(4, 10));
      // the peg
      ell(ctx, 64, 22, 3, 2, '#2a2420');
      A.grab('dc_shield', c);
    }
    // ice-glazed lancet window
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 60, 60, '190,225,255', 0.28);
      const lancet = (x0, x1, top, bot) => { const m = (x0 + x1) / 2; ctx.beginPath(); ctx.moveTo(x0, bot); ctx.lineTo(x0, top + 16); ctx.quadraticCurveTo(x0, top + 4, m, top); ctx.quadraticCurveTo(x1, top + 4, x1, top + 16); ctx.lineTo(x1, bot); ctx.closePath(); };
      // stone surround
      lancet(44, 84, 10, 110); ctx.fillStyle = '#5c5a5e'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      for (let y = 30; y < 110; y += 14) { line(ctx, 44, y, 54, y, 'rgba(0,0,0,0.5)', 1); line(ctx, 74, y + 7, 84, y + 7, 'rgba(0,0,0,0.5)', 1); }
      lancet(44, 84, 10, 110); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
      lancet(53, 75, 20, 104); ctx.fillStyle = '#111018'; ctx.fill();
      // ice glazing
      lancet(55, 73, 23, 102); ctx.fillStyle = lin(ctx, 55, 23, 73, 102, [0, '#f4fbff', 0.35, '#b4dcf4', 0.7, '#7eb4dc', 1, '#a8d4f0']); ctx.fill();
      ctx.save(); lancet(55, 73, 23, 102); ctx.clip();
      for (let k = 0; k < 8; k++) { const x = rnd(55, 73), y = rnd(25, 100); line(ctx, x, y, x + rnd(-8, 8), y + rnd(-10, 10), 'rgba(255,255,255,0.85)', 0.7); }
      for (let k = 0; k < 4; k++) line(ctx, 55, 40 + k * 18, 73, 30 + k * 18, 'rgba(255,255,255,0.4)', 1.4);
      pix(ctx, (x, y, d, i) => { if (d[i + 3] && x > 54 && x < 74 && y > 22 && y < 103 && fbm(x, y, 41) > 0.62) { d[i] = 250; d[i + 1] = 253; d[i + 2] = 255; } });
      ctx.restore();
      // lead came
      line(ctx, 64, 24, 64, 102, 'rgba(60,70,80,0.7)', 1);
      // snow on the sill
      ctx.fillStyle = '#4a484c'; ctx.fillRect(48, 104, 32, 6); ctx.fillStyle = '#f0f6fc'; ctx.beginPath(); ctx.ellipse(64, 104, 15, 2.6, 0, PI, TAU); ctx.fill();
      grain(ctx, 8);
      A.grab('dc_window_ice', c);
    }
    // Dawn sun disc cased in ice, with a Pale hourglass hung before it
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 56, 60, '200,230,255', 0.2);
      // plinth
      ctx.fillStyle = '#4a4650'; ctx.fillRect(22, 104, 84, 12); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(22, 104, 84, 1.2);
      // the sun behind the ice
      const sg = ctx.createRadialGradient(60, 52, 2, 64, 56, 24);
      sg.addColorStop(0, '#fff4c0'); sg.addColorStop(0.5, '#f0c050'); sg.addColorStop(1, '#a87020');
      ell(ctx, 64, 56, 12, 12, sg);
      A.symbol.dawn(ctx, 64, 56, 28, '#e8b848');
      // ice block (translucent cold overlay with bevelled faces)
      ctx.fillStyle = 'rgba(170,215,245,0.5)'; ctx.fillRect(26, 18, 76, 86);
      poly(ctx, [26, 18, 102, 18, 96, 24, 32, 24], 'rgba(240,250,255,0.75)');
      poly(ctx, [26, 18, 32, 24, 32, 98, 26, 104], 'rgba(220,240,255,0.55)');
      poly(ctx, [102, 18, 96, 24, 96, 98, 102, 104], 'rgba(110,160,200,0.6)');
      poly(ctx, [26, 104, 32, 98, 96, 98, 102, 104], 'rgba(90,140,180,0.6)');
      for (let k = 0; k < 5; k++) line(ctx, 34 + k * 12, 92, 52 + k * 12, 28, 'rgba(255,255,255,' + rnd(0.15, 0.35) + ')', rnd(1, 3));
      for (let k = 0; k < 6; k++) { const x = rnd(34, 94), y = rnd(26, 96); line(ctx, x, y, x + rnd(-10, 10), y + rnd(-8, 8), 'rgba(255,255,255,0.7)', 0.6); }
      // the Pale hourglass hung in front, on a silver chain
      chain(ctx, [[64, 0], [64, 58]], 4, '#5a6470', '#e0ecf8');
      hourglass(ctx, 64, 72, 13, '#c8d4e2', 'rgba(220,240,255,0.55)');
      ell(ctx, 64, 72, 1, 1, '#ffffff');
      A.grab('dc_chapel_ice', c);
    }
    // stopped clocks
    {
      const [c, ctx] = mk();
      const nail = (x, y) => { line(ctx, x, y - 6, x, y, 'rgba(30,24,20,0.8)', 0.8); ell(ctx, x, y - 6, 1, 1, '#1a1612'); };
      const shadowed = (f) => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; f(); ctx.restore(); };
      // square case with pendulum
      shadowed(() => { ctx.fillStyle = lin(ctx, 76, 0, 108, 0, [0, '#4a2814', 0.5, '#7a4a28', 1, '#3a1e0c']); ctx.fillRect(76, 56, 32, 54); });
      ctx.fillStyle = '#1a100a'; ctx.fillRect(84, 84, 16, 22); line(ctx, 92, 84, 92, 100, '#c8a050', 1); ell(ctx, 92, 101, 3, 3, '#e0b860');
      clockFace(ctx, 92, 70, 11, '#b08a3a');
      nail(92, 56);
      // big round
      shadowed(() => ell(ctx, 34, 38, 21, 21, '#3a2214'));
      clockFace(ctx, 34, 38, 17, '#5a3820'); nail(34, 17);
      // small brass
      shadowed(() => ell(ctx, 92, 26, 12, 12, '#7a5a20'));
      clockFace(ctx, 92, 26, 9.5, '#c8a040'); nail(92, 14);
      // octagonal
      shadowed(() => { ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + PI / 8; ctx[k ? 'lineTo' : 'moveTo'](36 + Math.cos(a) * 19, 90 + Math.sin(a) * 19); } ctx.closePath(); ctx.fillStyle = '#2c2a30'; ctx.fill(); });
      clockFace(ctx, 36, 90, 13, '#8a8c94'); nail(36, 71);
      // tiny
      shadowed(() => ell(ctx, 64, 62, 8, 8, '#5a3a20'));
      clockFace(ctx, 64, 62, 6, '#9a7030'); nail(64, 54);
      // frost on the glass
      for (let k = 0; k < 50; k++) ell(ctx, rnd(14, 110), rnd(10, 108), 0.6, 0.6, 'rgba(240,248,255,0.6)');
      A.grab('dc_clocks', c);
    }
    // cyan arcane rune circle
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 62, 64, '80,230,255', 0.3);
      ctx.save(); ctx.shadowColor = '#40e0ff'; ctx.shadowBlur = 8; ctx.strokeStyle = '#9ff4ff'; ctx.lineCap = 'round';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(64, 62, 48, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(64, 62, 37, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(64, 62, 16, 0, TAU); ctx.stroke();
      // five orbiting circles joined by arcs (no stars, no triangles)
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU - PI / 2, x = 64 + Math.cos(a) * 27, y = 62 + Math.sin(a) * 27;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * 16, 62 + Math.sin(a) * 16); ctx.lineTo(64 + Math.cos(a) * 20, 62 + Math.sin(a) * 20); ctx.stroke();
      }
      ctx.restore();
      for (let k = 0; k < 14; k++) {
        const a = k / 14 * TAU, x = 64 + Math.cos(a) * 42.5, y = 62 + Math.sin(a) * 42.5;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + PI / 2); ctx.shadowColor = '#40e0ff'; ctx.shadowBlur = 5; ctx.strokeStyle = '#c8faff'; ctx.lineWidth = 1.1; rune(ctx, 0, 0, 3.4, runeSpec()); ctx.restore();
      }
      glow(ctx, 64, 62, 14, '160,250,255', 0.6); ell(ctx, 64, 62, 3, 3, '#e8ffff');
      A.grab('dc_runes', c);
    }
    // blue crystal cluster growing out of the wall
    function crystalCluster(ctx, x, y, s, spread) {
      glow(ctx, x, y - s * 30, s * 62, '120,190,255', 0.4);
      const list = [];
      for (let k = 0; k < 9; k++) list.push([(k / 8 - 0.5) * 2 * spread + rnd(-0.12, 0.12), rnd(20, 46) * s * (k === 4 ? 1.4 : 1) * (1 - Math.abs(k / 8 - 0.5) * 0.6), rnd(4, 7) * s]);
      list.sort((a, b) => b[1] - a[1]);
      for (const [a, len, w] of list) crystalPrism(ctx, x + a * 18 * s, y, len, a, w, '#d8f2ff', '#5aa8f0', '#1e4c9a');
      ell(ctx, x, y, 20 * s, 5 * s, 'rgba(30,40,60,0.85)');
      for (let k = 0; k < 10; k++) ell(ctx, x + rnd(-30, 30) * s, y - rnd(0, 50) * s, 0.8, 0.8, '#ffffff');
    }
    {
      const [c, ctx] = mk();
      crystalCluster(ctx, 64, 96, 1.15, 0.6);
      A.grab('dc_crystal', c);
    }
    // golden sun relief
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 60, 62, '255,200,90', 0.35);
      const gold = (r) => { const g = ctx.createRadialGradient(64 - r * 0.35, 60 - r * 0.4, r * 0.05, 64, 60, r); g.addColorStop(0, '#fff2b8'); g.addColorStop(0.45, '#e6b444'); g.addColorStop(1, '#8a5a14'); return g; };
      ctx.strokeStyle = '#6a4410'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(65, 61.5, 46, 0, TAU); ctx.stroke();
      ctx.strokeStyle = gold(48); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(64, 60, 46, 0, TAU); ctx.stroke();
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
        const pts = [64 + ca * 24 + px * 5, 60 + sa * 24 + py * 5, 64 + ca * 40, 60 + sa * 40, 64 + ca * 24 - px * 5, 60 + sa * 24 - py * 5];
        ctx.save(); ctx.translate(1.2, 1.6); poly(ctx, pts, 'rgba(60,30,0,0.6)'); ctx.restore();
        poly(ctx, pts, gold(40));
        poly(ctx, [pts[0], pts[1], pts[2], pts[3], 64 + ca * 24, 60 + sa * 24], 'rgba(255,250,220,0.35)');
      }
      ell(ctx, 65.5, 61.5, 20, 20, 'rgba(60,30,0,0.6)'); ell(ctx, 64, 60, 20, 20, gold(22));
      ctx.strokeStyle = 'rgba(120,70,10,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(64, 60, 15, 0, TAU); ctx.stroke();
      ell(ctx, 58, 53, 5, 3.5, 'rgba(255,255,240,0.7)', -0.6);
      A.grab('dc_sunrelief', c);
    }
    // candle shelf
    function candle(ctx, x, yb, h, w, lit) {
      ctx.fillStyle = lin(ctx, x - w, 0, x + w, 0, [0, '#b8a888', 0.4, '#f4ecd8', 1, '#a8987a']); ctx.fillRect(x - w, yb - h, w * 2, h);
      ell(ctx, x, yb - h, w, w * 0.35, '#fffaea');
      for (let k = 0; k < 2; k++) { const dx = rnd(-w, w), l = rnd(3, h * 0.6); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(x + dx - 0.8, yb - h, 1.6, l); ell(ctx, x + dx, yb - h + l, 1.1, 1.4, '#f0e6cc'); }
      line(ctx, x, yb - h, x, yb - h - 2.5, '#2a1a10', 0.8);
      if (lit) candleFlame(ctx, x, yb - h - 1.5, Math.max(2, w * 0.95));
    }
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 60, 60, '255,180,80', 0.3);
      // brackets
      for (const x of [26, 102]) poly(ctx, [x - 2, 82, x + 2, 82, x + 2, 98, x - 2, 86], '#2a1c12');
      // shelf with wax spilling over
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(16, 84, 98, 4);
      ctx.fillStyle = lin(ctx, 0, 76, 0, 84, [0, '#8a5e36', 0.3, '#6a4426', 1, '#3a2412']); ctx.fillRect(14, 76, 100, 8);
      const cs = [[24, 22, 3.4], [36, 34, 3.8], [50, 16, 3], [62, 40, 4.4], [76, 26, 3.4], [90, 30, 3.8], [103, 14, 3]];
      for (const [x, h, w] of cs) candle(ctx, x, 77, h, w, x !== 50);
      for (let k = 0; k < 9; k++) { const x = rnd(18, 110), l = rnd(4, 16); ctx.fillStyle = '#efe4c8'; ctx.fillRect(x - 1, 82, 2, l); ell(ctx, x, 82 + l, 1.5, 1.8, '#efe4c8'); }
      A.grab('dc_candles', c);
    }
    // amber Root lantern on a hook
    function rootLantern(ctx, x, y, s) {
      glow(ctx, x, y + 12 * s, 48 * s, '255,165,50', 0.5);
      // cap
      poly(ctx, [x - 9 * s, y, x + 9 * s, y, x + 5 * s, y - 7 * s, x - 5 * s, y - 7 * s], '#3a2614');
      ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.arc(x, y - 9 * s, 3 * s, 0, TAU); ctx.stroke();
      // amber glass body
      const g = ctx.createRadialGradient(x, y + 12 * s, 1, x, y + 12 * s, 13 * s);
      g.addColorStop(0, '#fff2b0'); g.addColorStop(0.35, '#ffb83a'); g.addColorStop(1, '#a8501a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 8 * s, y); ctx.lineTo(x + 8 * s, y); ctx.lineTo(x + 10 * s, y + 18 * s); ctx.lineTo(x + 7 * s, y + 25 * s); ctx.lineTo(x - 7 * s, y + 25 * s); ctx.lineTo(x - 10 * s, y + 18 * s); ctx.closePath(); ctx.fill();
      // bent-root frame
      ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * 8 * s, y); ctx.quadraticCurveTo(x + sx * 12 * s, y + 12 * s, x + sx * 7 * s, y + 25 * s); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 25 * s); ctx.stroke();
      A.symbol.root(ctx, x, y + 12 * s, 4.5 * s, 'rgba(90,40,10,0.8)');
      poly(ctx, [x - 8 * s, y + 25 * s, x + 8 * s, y + 25 * s, x + 4 * s, y + 29 * s, x - 4 * s, y + 29 * s], '#3a2614');
      ell(ctx, x - 4 * s, y + 6 * s, 1.5 * s, 4 * s, 'rgba(255,255,230,0.6)');
    }
    {
      const [c, ctx] = mk();
      // wall hook
      ctx.fillStyle = '#2a2420'; ctx.fillRect(58, 18, 12, 6); ctx.fillStyle = '#6a5e54'; ctx.fillRect(58, 18, 12, 1);
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(64, 22); ctx.lineTo(64, 26); ctx.quadraticCurveTo(76, 28, 78, 34); ctx.stroke();
      chain(ctx, [[78, 34], [78, 50]], 4, '#2a2420', '#8a7a6a');
      rootLantern(ctx, 78, 60, 1.25);
      A.grab('dc_lantern_amber', c);
    }
    // crystal lamp sconce
    {
      const [c, ctx] = mk();
      glow(ctx, 64, 44, 56, '160,210,255', 0.4);
      ctx.fillStyle = lin(ctx, 56, 0, 72, 0, [0, '#3a3e48', 0.5, '#8a909c', 1, '#2a2e36']);
      poly(ctx, [58, 70, 70, 70, 72, 86, 64, 94, 56, 86]);
      ctx.strokeStyle = '#4a505c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(64, 74); ctx.lineTo(64, 64); ctx.stroke();
      // claw cradle
      ctx.strokeStyle = '#8a909c'; ctx.lineWidth = 2;
      for (const sx of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(64, 64); ctx.quadraticCurveTo(64 + sx * 10, 62, 64 + sx * 8, 50); ctx.stroke(); }
      crystalPrism(ctx, 64, 62, 34, 0, 7, '#f4fbff', '#a8d8ff', '#4a88d0');
      crystalPrism(ctx, 58, 62, 16, -0.4, 3.5, '#f4fbff', '#a8d8ff', '#4a88d0');
      crystalPrism(ctx, 70, 62, 18, 0.35, 3.5, '#f4fbff', '#a8d8ff', '#4a88d0');
      ctx.strokeStyle = '#8a909c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(64, 62, 9, 3, 0, 0, PI); ctx.stroke();
      glow(ctx, 64, 44, 14, '230,245,255', 0.6);
      A.grab('dc_crystal_lamp', c);
    }
    // tide marks
    {
      const [c, ctx] = mk();
      pix(ctx, (x, y, d, i) => {
        if (y < 56) return;
        const n = fbm(x, y, 51), t = Math.min(1, (y - 56) / 60);
        d[i] = 14; d[i + 1] = 20 + n * 16; d[i + 2] = 18; d[i + 3] = 255 * (0.18 + t * 0.32) * (0.7 + n * 0.6);
      });
      for (const [y0, a, col] of [[58, 0.9, '150,138,100'], [63, 0.7, '170,160,125'], [69, 0.55, '120,130,95'], [79, 0.4, '130,130,105']]) {
        for (let x = 0; x < TS; x++) {
          const y = y0 + Math.sin(x * 0.05 + y0) * 1.5 + vn(x, y0, 32, y0) * 2.5;
          ctx.fillStyle = 'rgba(' + col + ',' + a + ')'; ctx.fillRect(x, y, 1, 1.4 + vn(x, y0, 16, 3));
          ctx.fillStyle = 'rgba(0,0,0,' + a * 0.4 + ')'; ctx.fillRect(x, y + 1.5, 1, 1);
        }
      }
      for (let k = 0; k < 40; k++) ell(ctx, rnd(0, TS), rnd(57, 62), rnd(0.5, 1.5), 0.6, 'rgba(225,225,205,0.7)');
      A.grab('dc_waterline', c);
    }
    // gnawed rat holes
    {
      const [c, ctx] = mk();
      const hole = (cx, w, h) => {
        const pts = [];
        for (let k = 0; k <= 18; k++) { const a = PI + k / 18 * PI, rr = 1 + rnd(-0.12, 0.08); pts.push(cx + Math.cos(a) * w * rr, 128 + Math.sin(a) * h * rr); }
        ctx.save(); ctx.translate(1, -1); poly(ctx, pts, 'rgba(255,240,220,0.18)'); ctx.restore();
        poly(ctx, pts, '#060404');
        const g = ctx.createRadialGradient(cx, 128, 1, cx, 128, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,30,25,0.6)');
        poly(ctx, pts, g);
        // gnaw marks
        for (let k = 0; k < 10; k++) { const a = PI + rnd(0.1, PI - 0.1), x = cx + Math.cos(a) * w * 1.05, y = 128 + Math.sin(a) * h * 1.05; line(ctx, x, y, x + Math.cos(a) * 3, y + Math.sin(a) * 3, 'rgba(0,0,0,0.6)', 1); }
      };
      hole(30, 16, 17); hole(92, 24, 30);
      // glinting eyes
      for (const x of [87, 97]) { glow(ctx, x, 114, 6, '255,60,40', 0.6); ell(ctx, x, 114, 2, 1.6, '#ff4a2a'); ell(ctx, x - 0.6, 113.4, 0.7, 0.7, '#fff'); }
      // droppings and crumbs
      for (let k = 0; k < 18; k++) ell(ctx, rnd(6, 122), rnd(123, 127), rnd(0.6, 1.4), 0.6, pick(['#2a2018', '#5a5048', '#3a3028']));
      ctx.fillStyle = '#c8b070'; for (let k = 0; k < 5; k++) ctx.fillRect(rnd(40, 70), rnd(121, 126), rnd(2, 4), 0.8);
      A.grab('dc_ratholes', c);
    }

    // =====================================================================
    // FULL WALLS (opaque, tile horizontally)
    // =====================================================================
    // anisotropic tileable value noise: fx cells across, fy cells down (each <= 64)
    function vnA(x, y, fx, fy, o) {
      o = o || 0;
      const gx = x * fx / TS, gy = y * fy / TS, ix = Math.floor(gx), iy = Math.floor(gy);
      let tx = gx - ix, ty = gy - iy;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const x0 = ((ix % fx) + fx) % fx, y0 = ((iy % fy) + fy) % fy, x1 = (x0 + 1) % fx, y1 = (y0 + 1) % fy;
      const ox = o % NG, oy = (o * 7) % NG, g = (a, b) => ngrid[(a + ox) % NG + ((b + oy) % NG) * NG];
      const a = g(x0, y0), b = g(x1, y0), c = g(x0, y1), d = g(x1, y1);
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    }
    function iceBase(ctx, o) {
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, o), t = y / TS;
        d[i] = 150 + n * 60 - t * 40; d[i + 1] = 180 + n * 50 - t * 35; d[i + 2] = 210 + n * 40 - t * 25; d[i + 3] = 255;
      });
    }
    function silverBar(ctx, x, y, w, h, vert) {
      ctx.fillStyle = vert ? lin(ctx, x, 0, x + w, 0, [0, '#5a6270', 0.3, '#eef4fa', 0.55, '#a8b4c2', 1, '#3e4652'])
        : lin(ctx, 0, y, 0, y + h, [0, '#5a6270', 0.3, '#eef4fa', 0.55, '#a8b4c2', 1, '#3e4652']);
      ctx.fillRect(x, y, w, h);
    }
    function lancetPath(ctx, x0, x1, top, bot) { const m = (x0 + x1) / 2; ctx.beginPath(); ctx.moveTo(x0, bot); ctx.lineTo(x0, top + (x1 - x0) * 0.45); ctx.quadraticCurveTo(x0, top + 4, m, top); ctx.quadraticCurveTo(x1, top + 4, x1, top + (x1 - x0) * 0.45); ctx.lineTo(x1, bot); ctx.closePath(); }
    function mirrorGlass(ctx, x0, x1, top, bot, ghost) {
      lancetPath(ctx, x0 - 4, x1 + 4, top - 4, bot + 3); ctx.fillStyle = lin(ctx, x0, top, x1, bot, [0, '#f2f8ff', 0.4, '#9aa8b8', 0.7, '#e0e8f2', 1, '#5a6472']); ctx.fill();
      lancetPath(ctx, x0, x1, top, bot); ctx.fillStyle = lin(ctx, 0, top, 0, bot, [0, '#e4f2ff', 0.45, '#a4c4e0', 1, '#5c7c9c']); ctx.fill();
      ctx.save(); lancetPath(ctx, x0, x1, top, bot); ctx.clip();
      const m = (x0 + x1) / 2, w = x1 - x0;
      // a reflected corridor receding
      ctx.fillStyle = 'rgba(40,60,90,0.25)'; poly(ctx, [x0, bot, m - w * 0.12, bot - (bot - top) * 0.35, m + w * 0.12, bot - (bot - top) * 0.35, x1, bot]);
      ctx.fillStyle = 'rgba(60,80,110,0.2)'; ctx.fillRect(m - w * 0.12, top + (bot - top) * 0.35, w * 0.24, (bot - top) * 0.3);
      if (ghost) {
        // a pale girl's figure, barely there
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ell(ctx, m + w * 0.12, top + (bot - top) * 0.36, w * 0.06, w * 0.075);
        ctx.beginPath(); ctx.moveTo(m + w * 0.12 - w * 0.07, top + (bot - top) * 0.42); ctx.quadraticCurveTo(m + w * 0.12 - w * 0.13, top + (bot - top) * 0.8, m + w * 0.12 - w * 0.12, top + (bot - top) * 0.88);
        ctx.lineTo(m + w * 0.12 + w * 0.12, top + (bot - top) * 0.88); ctx.quadraticCurveTo(m + w * 0.12 + w * 0.13, top + (bot - top) * 0.8, m + w * 0.12 + w * 0.07, top + (bot - top) * 0.42); ctx.closePath(); ctx.fill();
        glow(ctx, m + w * 0.12, top + (bot - top) * 0.5, w * 0.3, '230,245,255', 0.18);
      }
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x0 + w * (0.15 + k * 0.3), top + (bot - top) * 0.5); ctx.rotate(0.5); ctx.fillStyle = 'rgba(255,255,255,' + (0.18 - k * 0.04) + ')'; ctx.fillRect(-w * 0.06, -bot, w * 0.07 + k, bot * 2); ctx.restore(); }
      pix(ctx, (x, y, d, i) => { if (x >= x0 && x <= x1 && y >= top && y <= bot && fbm(x, y, 61) > 0.66) { d[i] += 20; d[i + 1] += 20; d[i + 2] += 15; } });
      ctx.restore();
    }
    function iceSkirting(ctx) {
      silverBar(ctx, 0, 118, TS, 3); ctx.fillStyle = lin(ctx, 0, 121, 0, 128, [0, '#4a5a70', 1, '#24303e']); ctx.fillRect(0, 121, TS, 7);
      silverBar(ctx, 0, 0, TS, 3);
    }
    {
      const [c, ctx] = mk(); iceBase(ctx, 70);
      silverBar(ctx, 0, 0, 6, TS, true); silverBar(ctx, 122, 0, 6, TS, true);
      mirrorGlass(ctx, 18, 110, 10, 114, true);
      iceSkirting(ctx);
      for (let k = 0; k < 6; k++) icicle(ctx, rnd(10, 118), 3, 1.2, rnd(4, 10));
      grain(ctx, 8); A.grab('mirror', c);
    }
    {
      const [c, ctx] = mk(); iceBase(ctx, 71);
      silverBar(ctx, 0, 0, 4, TS, true); silverBar(ctx, 124, 0, 4, TS, true); silverBar(ctx, 62, 0, 4, TS, true);
      mirrorGlass(ctx, 12, 54, 14, 114, false); mirrorGlass(ctx, 74, 116, 14, 114, false);
      // a ghostly handprint on the right glass
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ell(ctx, 96, 70, 5, 6);
      for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * 0.35 + (k === 0 ? -0.5 : 0); ctx.save(); ctx.translate(96 + Math.cos(a) * 6, 70 + Math.sin(a) * 6); ctx.rotate(a + PI / 2); ell(ctx, 0, -4, 1.4, k === 0 ? 3.5 : 4.5); ctx.restore(); }
      iceSkirting(ctx);
      grain(ctx, 8); A.grab('mirror2', c);
    }
    {
      const [c, ctx] = mk(); iceBase(ctx, 72);
      lancetPath(ctx, 24, 104, 6, 128); ctx.fillStyle = lin(ctx, 24, 0, 104, 0, [0, '#4a5462', 0.25, '#e8f0f8', 0.6, '#8a96a6', 1, '#3a4250']); ctx.fill();
      lancetPath(ctx, 30, 98, 12, 128); ctx.fillStyle = '#1a2230'; ctx.fill();
      for (const [x0, x1] of [[32, 63], [65, 96]]) {
        ctx.fillStyle = lin(ctx, x0, 0, x1, 0, [0, '#7a8696', 0.5, '#d4dee8', 1, '#6a7686']); ctx.fillRect(x0, 14, x1 - x0, 114);
        ctx.save(); lancetPath(ctx, 30, 98, 12, 128); ctx.clip();
        for (const [py, ph] of [[24, 40], [70, 46]]) {
          ctx.fillStyle = lin(ctx, 0, py, 0, py + ph, [0, '#e8f4ff', 1, '#86aed0']); ctx.fillRect(x0 + 4, py, x1 - x0 - 8, ph);
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; poly(ctx, [x0 + 4, py + ph * 0.7, x0 + 4, py + ph * 0.45, x1 - 4, py + 2, x1 - 4, py + ph * 0.25]);
        }
        ctx.restore();
      }
      ctx.fillStyle = '#3a4250'; ctx.fillRect(63, 12, 2, 116);
      A.symbol.pale(ctx, 64, 30, 9, '#f4faff');
      for (const x of [58, 70]) { ell(ctx, x, 76, 2.4, 2.4, '#e8eef6'); ell(ctx, x - 0.6, 75.4, 0.8, 0.8, '#ffffff'); }
      for (let k = 0; k < 8; k++) icicle(ctx, 34 + k * 8.5, 12 + Math.abs(k - 3.5) * 1.5, 1, rnd(3, 8));
      grain(ctx, 8); A.grab('door_mirror', c);
    }
    // the folded cellar
    function cellarBrick(ctx) {
      A.bricks(ctx, { bw: 32, bh: 12, base: '#6e4434', mortar: '#2e2622', vary: 0.35, bevel: true });
      mottle(ctx, 0.3, 80);
    }
    function wallpaper(ctx, x, y, w, h, base, motif, torn) {
      const pts = [];
      const N = 26;
      for (let k = 0; k < N; k++) {
        const t = k / N, side = Math.floor(t * 4), f = (t * 4) % 1, j = torn ? rnd(-5, 5) : 0;
        if (side === 0) pts.push(x + w * f, y + j); else if (side === 1) pts.push(x + w + j, y + h * f);
        else if (side === 2) pts.push(x + w * (1 - f), y + h + j); else pts.push(x + j, y + h * (1 - f));
      }
      ctx.save(); ctx.translate(1.5, 1.5); poly(ctx, pts, 'rgba(0,0,0,0.4)'); ctx.restore();
      poly(ctx, pts, base);
      ctx.save(); poly(ctx, pts, 'rgba(0,0,0,0)'); ctx.clip();
      // vertical stripes and little roses
      for (let sx = x - 6; sx < x + w + 6; sx += 12) { ctx.fillStyle = 'rgba(120,90,70,0.15)'; ctx.fillRect(sx, y - 6, 2, h + 12); }
      for (let sy = y; sy < y + h + 8; sy += 12) for (let sx = x + ((sy / 12) % 2 ? 6 : 0); sx < x + w + 8; sx += 12) {
        for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ell(ctx, sx + Math.cos(a) * 1.6, sy + Math.sin(a) * 1.6, 1.4, 1.4, motif); }
        ell(ctx, sx, sy, 1, 1, '#e8d080');
        ell(ctx, sx + 2.5, sy + 2.5, 1.3, 0.6, '#5a7a40', 0.6);
      }
      // water damage
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [0, 'rgba(90,70,40,0)', 1, 'rgba(90,70,40,0.4)']); ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
      ctx.restore();
      // curled torn edge highlight
      ctx.strokeStyle = 'rgba(250,240,220,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); ctx.stroke();
    }
    function cellarFrost(ctx, o) {
      frostEdge(ctx, (x, y) => { const n = fbm(x, y, o); return Math.max((n * 1.3 - y / 40) * 1.5, (n * 1.3 - (127 - y) / 26) * 1.2) - 0.1; }, 0.8);
    }
    {
      const [c, ctx] = mk(); cellarBrick(ctx);
      wallpaper(ctx, 14, 18, 70, 74, '#d8c8a8', '#b86870', true);
      // empty picture-frame outline (the picture is gone, a paler rectangle stays)
      ctx.fillStyle = 'rgba(240,230,200,0.45)'; ctx.fillRect(36, 32, 28, 34);
      ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 4; ctx.strokeRect(34, 30, 32, 38);
      ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 1.2; ctx.strokeRect(33, 29, 34, 40);
      line(ctx, 50, 18, 36, 30, 'rgba(40,30,20,0.8)', 0.7); line(ctx, 50, 18, 64, 30, 'rgba(40,30,20,0.8)', 0.7); ell(ctx, 50, 18, 1.2, 1.2, '#2a2018');
      // a sliver of wainscot rail that runs into the brick
      ctx.fillStyle = lin(ctx, 0, 92, 0, 98, [0, '#f0ece0', 1, '#a8a090']); ctx.fillRect(4, 92, 98, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(4, 97, 98, 1.5);
      cellarFrost(ctx, 81);
      grain(ctx, 10); A.grab('folded', c);
    }
    {
      const [c, ctx] = mk(); cellarBrick(ctx);
      wallpaper(ctx, 6, 30, 24, 50, '#b8c8b0', '#7a5a8a', true);
      wallpaper(ctx, 98, 10, 24, 40, '#d8c8a8', '#b86870', true);
      // a painted doorframe set into solid brick: it leads nowhere
      const cas = lin(ctx, 0, 0, 10, 0, [0, '#c8c4b8', 0.5, '#f4f0e6', 1, '#a8a498']);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(40, 22, 50, 106);
      ctx.fillStyle = '#ece8dc'; ctx.fillRect(38, 18, 52, 8); ctx.fillRect(38, 18, 8, 110); ctx.fillRect(82, 18, 8, 110);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(38, 18, 52, 1.5); ctx.fillRect(38, 18, 1.5, 110);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(44, 26, 2, 102); ctx.fillRect(82, 26, 2, 102);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(46, 26, 36, 4);
      // hinges and a strike plate with nothing to strike
      for (const y of [40, 96]) { ctx.fillStyle = '#b89048'; ctx.fillRect(44, y, 2, 7); }
      ctx.fillStyle = '#b89048'; ctx.fillRect(82, 70, 2, 8);
      // peeling paint
      for (let k = 0; k < 14; k++) ell(ctx, pick([42, 86]) + rnd(-3, 3), rnd(20, 126), rnd(0.8, 2), rnd(1, 3), 'rgba(110,90,70,0.7)');
      cellarFrost(ctx, 82);
      grain(ctx, 10); A.grab('folded2', c);
    }
    {
      const [c, ctx] = mk(); cellarBrick(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(30, 14, 70, 114);
      ctx.fillStyle = '#ece8dc'; ctx.fillRect(28, 12, 72, 7); ctx.fillRect(28, 12, 7, 116); ctx.fillRect(93, 12, 7, 116);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(28, 12, 72, 1.2);
      // the door: painted sage blue, four raised panels, brass knob
      ctx.fillStyle = lin(ctx, 35, 0, 93, 0, [0, '#4a6a72', 0.5, '#6a8c94', 1, '#40585e']); ctx.fillRect(35, 19, 58, 109);
      for (const [px, py, pw, ph] of [[41, 26, 20, 40], [67, 26, 20, 40], [41, 74, 20, 46], [67, 74, 20, 46]]) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#638690'; ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px + 2, py + 2, pw - 4, 1.2);
      }
      ell(ctx, 86, 72, 3, 3, '#b8902e'); ell(ctx, 85, 71, 1.1, 1.1, '#fff0b0');
      ctx.fillStyle = '#8a6a22'; ctx.fillRect(84, 77, 4, 6); ell(ctx, 86, 80, 0.8, 1.4, '#1a120a');
      // a house number
      ctx.fillStyle = '#d8c070'; ctx.font = 'bold 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('7', 64, 24 + 1);
      
      // frost rim around the door
      frostEdge(ctx, (x, y) => {
        const dx = Math.min(Math.abs(x - 35), Math.abs(x - 93)), dy = Math.abs(y - 19);
        const ed = Math.min(dx, (x > 35 && x < 93) ? dy : 99);
        return (1 - ed / (5 + fbm(x, y, 83) * 12)) * 1.1 + (fbm(x, y, 84) - 0.75) * 2;
      }, 0.85);
      grain(ctx, 10); A.grab('door_folded', c);
    }

    // =====================================================================
    // FLOORS (opaque, tile both ways)
    // =====================================================================
    function waterPix(ctx, deep, x0, x1) {
      x0 = x0 || 0; x1 = x1 || TS;
      pix(ctx, (x, y, d, i) => {
        if (x < x0 || x >= x1) return;
        const v = vnA(x, y, 16, 4, 3) * 0.45 + vnA(x, y, 32, 8, 5) * 0.3 + vn(x, y, 32, 6) * 0.25;
        const rp = Math.sin((y / TS) * TAU * 8 + fbm(x, y, 9) * 14 + (x / TS) * TAU) * (0.55 + vn(x, y, 8, 12) * 0.6);
        let r, g, b;
        if (deep) { r = 6 + v * 16; g = 16 + v * 30; b = 34 + v * 46; } else { r = 10 + v * 18; g = 24 + v * 34; b = 22 + v * 26; }
        if (rp > 0.8) { const h = Math.min(1, (rp - 0.8) / 0.2) * v * 1.2; r += h * (deep ? 110 : 90); g += h * (deep ? 150 : 130); b += h * (deep ? 190 : 110); }
        else if (rp < -0.8) { r *= 0.75; g *= 0.75; b *= 0.75; }
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      });
    }
    {
      const [c, ctx] = mk(); waterPix(ctx, false);
      // floating scum and bubbles
      wrap(ctx, () => {});
      const bits = []; for (let k = 0; k < 18; k++) bits.push([rnd(0, TS), rnd(0, TS), rnd(0.6, 1.8)]);
      wrap(ctx, () => { for (const [x, y, r] of bits) { ell(ctx, x, y, r * 1.6, r * 0.9, 'rgba(90,110,70,0.5)'); ell(ctx, x - r * 0.3, y - r * 0.2, r * 0.4, r * 0.3, 'rgba(200,230,200,0.5)'); } });
      A.grab('water', c);
    }
    {
      const [c, ctx] = mk(); waterPix(ctx, true);
      const floes = [];
      for (let k = 0; k < 6; k++) { const cx = rnd(0, TS), cy = rnd(0, TS), r = rnd(5, 16), pts = []; for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + rnd(-0.3, 0.3), rr = r * rnd(0.45, 1.15); pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9); } floes.push(pts); }
      wrap(ctx, () => {
        for (const pts of floes) {
          ctx.save(); ctx.translate(1.5, 2); poly(ctx, pts, 'rgba(120,170,210,0.45)'); ctx.restore();
          poly(ctx, pts, '#a8c6de');
          ctx.save(); ctx.translate(-0.8, -0.8); ctx.scale(1, 1); poly(ctx, pts.map((v, j) => v + (j % 2 ? -0.6 : -0.4)), 'rgba(240,250,255,0.6)'); ctx.restore();
          poly(ctx, pts.map((v, j) => { const cx = (pts[0] + pts[4]) / 2, cy = (pts[1] + pts[5]) / 2; return j % 2 ? cy + (v - cy) * 0.55 - 1 : cx + (v - cx) * 0.55 - 1; }), 'rgba(250,253,255,0.3)');
          ctx.strokeStyle = 'rgba(80,120,160,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo((pts[0] + pts[6]) / 2 + 2, (pts[1] + pts[7]) / 2); ctx.lineTo(pts[8], pts[9]); ctx.stroke();
        }
      });
      for (let k = 0; k < 40; k++) ell(ctx, rnd(0, TS), rnd(0, TS), 0.6, 0.6, 'rgba(220,240,255,0.7)');
      A.grab('water_deep', c);
    }
    {
      const [c, ctx] = mk();
      flags(ctx, '#5c5e54', 32, 0.35);
      waterPix(ctx, false, 44, 84);
      // curbs along the channel
      for (const x of [36, 84]) {
        for (let y = 0; y < TS; y += 16) stoneRect(ctx, x, y, 8, 16, A.shade('#74766a', 0.85 + R() * 0.3));
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(44, 0, 3, TS); ctx.fillRect(81, 0, 3, TS);
      // algae on the waterline edges
      pix(ctx, (x, y, d, i) => {
        const e = Math.min(Math.abs(x - 44), Math.abs(x - 84));
        if (e > 7) return;
        const n = fbm(x, y, 91); if (n < 0.45 + e * 0.04) return;
        const t = 0.75 - e * 0.08; d[i] += (30 - d[i]) * t; d[i + 1] += (90 + n * 40 - d[i + 1]) * t; d[i + 2] += (60 - d[i + 2]) * t;
      });
      grain(ctx, 10); A.grab('sewer_channel', c);
      A.data.sewer_channel.flow = [47, 81]; // only these texture columns are water and flow; the curbs stay put
    }
    {
      const [c, ctx] = mk(); flags(ctx, '#62605a', 32, 0.4);
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, 101); if (n < 0.56) return;
        const t = Math.min(0.95, (n - 0.56) * 8);
        const rf = vnA(x, y, 8, 32, 7);
        d[i] += (22 + rf * 70 - d[i]) * t; d[i + 1] += (28 + rf * 76 - d[i + 1]) * t; d[i + 2] += (36 + rf * 84 - d[i + 2]) * t;

      });
      grain(ctx, 8); A.grab('puddles', c);
    }
    {
      const [c, ctx] = mk(); flags(ctx, '#5a5a50', 32, 0.35);
      pix(ctx, (x, y, d, i) => {
        const lum = d[i] + d[i + 1] + d[i + 2], n = fbm(x, y, 111), groutMoss = lum < 150 ? 0.5 : 0;
        const v = n + groutMoss - 0.55; if (v <= 0) return;
        const t = Math.min(0.92, v * 3), h = vn(x, y, 32, 3);
        d[i] += (40 + h * 40 - d[i]) * t; d[i + 1] += (85 + h * 60 - d[i + 1]) * t; d[i + 2] += (30 - d[i + 2]) * t;
      });
      for (let k = 0; k < 60; k++) ell(ctx, rnd(0, TS), rnd(0, TS), 0.7, 0.7, 'rgba(170,220,110,0.6)');
      grain(ctx, 12); A.grab('moss_floor', c);
    }
    {
      const [c, ctx] = mk(); flags(ctx, '#5e5a52', 32, 0.35);
      const bc = ['#d8ccae', '#c8b994', '#bfae88', '#e0d6bc'], items = [];
      for (let k = 0; k < 16; k++) items.push([rnd(0, TS), rnd(0, TS), rnd(8, 18), rnd(0, PI), rnd(1.8, 3), pick(bc)]);
      const sk = [rnd(0, TS), rnd(0, TS)];
      wrap(ctx, () => {
        for (const [x, y, l, a, w, col] of items) bone(ctx, x, y, l, a, w, col);
        skull(ctx, sk[0], sk[1], 6, '#d0c4a4');
      });
      // bone chips
      for (let k = 0; k < 40; k++) ell(ctx, rnd(0, TS), rnd(0, TS), rnd(0.5, 1.4), rnd(0.4, 1), 'rgba(220,210,180,0.75)');
      grain(ctx, 10); A.grab('bones_floor', c);
    }
    function earth(ctx, o, base) {
      pix(ctx, (x, y, d, i) => {
        const n = fbm(x, y, o), h = vn(x, y, 32, o + 1);
        d[i] = base[0] * (0.6 + n * 0.8) + h * 10; d[i + 1] = base[1] * (0.6 + n * 0.8) + h * 6; d[i + 2] = base[2] * (0.6 + n * 0.8); d[i + 3] = 255;
      });
      for (let k = 0; k < 50; k++) { const x = rnd(0, TS), y = rnd(0, TS), r = rnd(0.8, 2.2); ell(ctx, x + 0.5, y + 0.6, r, r * 0.8, 'rgba(0,0,0,0.4)'); ell(ctx, x, y, r, r * 0.8, pick(['#6a6058', '#7a7066', '#544a40'])); ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.3, 'rgba(255,255,255,0.25)'); }
    }
    function rootMesh(ctx, n, wmax, col, hi) {
      const rs = [];
      for (let k = 0; k < n; k++) { const x = rnd(0, TS), y = rnd(0, TS), a = rnd(0, TAU), L = rnd(40, 90); rs.push([x, y, x + Math.cos(a + 0.4) * L * 0.35, y + Math.sin(a + 0.4) * L * 0.35, x + Math.cos(a - 0.3) * L * 0.7, y + Math.sin(a - 0.3) * L * 0.7, x + Math.cos(a) * L, y + Math.sin(a) * L, rnd(2, wmax)]); }
      wrap(ctx, () => { for (const r of rs) taper(ctx, r.slice(0, 8), r[8], 0.8, col, hi, 'rgba(0,0,0,0.45)'); });
    }
    {
      const [c, ctx] = mk(); earth(ctx, 121, [74, 52, 34]);
      rootMesh(ctx, 7, 6, '#5a3a20', '#a07850');
      grain(ctx, 12); A.grab('roots_floor', c);
    }
    function iceTiles(ctx, o) {
      for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
        const x = tx * 64, y = ty * 64;
        ctx.fillStyle = lin(ctx, x, y, x + 64, y + 64, [0, '#e2f0fc', 0.5, '#a8c8e4', 1, '#7ea4c8']); ctx.fillRect(x, y, 64, 64);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; poly(ctx, [x + 8, y + 64, x + 20, y + 64, x + 64, y + 20, x + 64, y + 8]);
        ctx.fillStyle = 'rgba(40,70,110,0.18)'; poly(ctx, [x, y + 40, x, y + 64, x + 24, y + 64]);
      }
      pix(ctx, (x, y, d, i) => { const n = fbm(x, y, o); d[i] += (n - 0.5) * 30; d[i + 1] += (n - 0.5) * 30; d[i + 2] += (n - 0.5) * 20; });
    }
    {
      const [c, ctx] = mk(); iceTiles(ctx, 131);
      // silver seams
      for (const p of [0, 64]) { silverBar(ctx, p - 1.5, 0, 3, TS, true); silverBar(ctx, 0, p - 1.5, TS, 3); }
      silverBar(ctx, 126.5, 0, 3, TS, true); silverBar(ctx, 0, 126.5, TS, 3);
      for (let k = 0; k < 12; k++) { const x = rnd(4, 124), y = rnd(4, 124); glow(ctx, x, y, 4, '255,255,255', 0.8); ell(ctx, x, y, 0.8, 0.8, '#fff'); }
      A.grab('mirror_floor', c);
    }
    {
      const [c, ctx] = mk();
      flags(ctx, '#5a5650', 32, 0.35);
      const img = ctx.getImageData(0, 0, TS, TS);
      pix(ctx, (x, y, d, i) => {
        const u = x + Math.sin(y / TS * TAU) * 7 + Math.sin(y / TS * TAU * 3) * 2, v = y + Math.sin(x / TS * TAU * 2) * 6;
        const chk = ((Math.floor(u / 16) + Math.floor(v / 16)) & 1) ? 228 : 26;
        const m = fbm(x, y, 141), t = Math.max(0, Math.min(1, (m - 0.42) * 6));
        const s = img.data;
        d[i] = s[i] + (chk - s[i]) * t; d[i + 1] = s[i + 1] + (chk - 4 - s[i + 1]) * t; d[i + 2] = s[i + 2] + (chk - 10 - s[i + 2]) * t;
      });
      frostEdge(ctx, (x, y) => (fbm(x, y, 142) - 0.6) * 4, 0.7);
      grain(ctx, 10); A.grab('folded_floor', c);
    }
    function cracksTile(ctx, n, col, w) {
      const cs = [];
      for (let k = 0; k < n; k++) { let x = rnd(0, TS), y = rnd(0, TS), a = rnd(0, TAU); const pts = [[x, y]]; for (let s = 0; s < ri(6, 14); s++) { a += rnd(-0.6, 0.6); x += Math.cos(a) * 5; y += Math.sin(a) * 5; pts.push([x, y]); } cs.push(pts); }
      wrap(ctx, () => { for (const pts of cs) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, j) => ctx[j ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.6; ctx.beginPath(); pts.forEach((p, j) => ctx[j ? 'lineTo' : 'moveTo'](p[0] + 0.8, p[1] + 0.8)); ctx.stroke(); } });
    }
    {
      const [c, ctx] = mk(); flags(ctx, '#3e4048', 32, 0.3);
      ctx.fillStyle = 'rgba(160,205,235,0.55)'; ctx.fillRect(0, 0, TS, TS);
      pix(ctx, (x, y, d, i) => { const n = fbm(x, y, 151); const t = n * 0.6; d[i] += (235 - d[i]) * t * 0.6; d[i + 1] += (248 - d[i + 1]) * t * 0.6; d[i + 2] += (255 - d[i + 2]) * t * 0.5; });
      cracksTile(ctx, 9, 'rgba(30,60,90,0.75)', 1);
      for (let k = 0; k < 30; k++) ell(ctx, rnd(0, TS), rnd(0, TS), rnd(0.5, 1.4), rnd(0.5, 1.4), 'rgba(255,255,255,0.6)');
      A.grab('ice_floor', c);
    }
    function rubbleChunk(ctx, x, y, r, base) {
      const pts = []; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + rnd(-0.3, 0.3), rr = r * rnd(0.65, 1.1); pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
      ctx.save(); ctx.translate(r * 0.25, r * 0.35); poly(ctx, pts, 'rgba(0,0,0,0.5)'); ctx.restore();
      poly(ctx, pts, A.shade(base, 0.75 + R() * 0.45));
      poly(ctx, [pts[6], pts[7], pts[8], pts[9], pts[10], pts[11], x, y], 'rgba(255,255,255,0.14)');
      poly(ctx, [pts[0], pts[1], pts[2], pts[3], x, y], 'rgba(0,0,0,0.22)');
    }
    {
      const [c, ctx] = mk(); flags(ctx, '#56524c', 32, 0.4);
      const ch = []; for (let k = 0; k < 40; k++) ch.push([rnd(0, TS), rnd(0, TS), rnd(2, 9), pick(['#7a7468', '#6a665e', '#8a8478', '#5e584e'])]);
      ch.sort((a, b) => b[2] - a[2]);
      for (let k = 0; k < 60; k++) ell(ctx, rnd(0, TS), rnd(0, TS), rnd(4, 10), rnd(2, 5), 'rgba(140,130,115,0.25)');
      wrap(ctx, () => { A.seed(777001); for (const [x, y, r, col] of ch) rubbleChunk(ctx, x, y, r, col); });
      grain(ctx, 14); A.grab('rubble_floor', c);
    }

    // =====================================================================
    // CEILINGS (opaque, tile both ways)
    // =====================================================================
    function stoneBase(ctx, o, rgb, amt) {
      pix(ctx, (x, y, d, i) => { const n = fbm(x, y, o), h = vn(x, y, 32, o + 2); const f = 0.55 + n * 0.8 + (h - 0.5) * (amt || 0.2); d[i] = rgb[0] * f; d[i + 1] = rgb[1] * f; d[i + 2] = rgb[2] * f; d[i + 3] = 255; });
    }
    {
      const [c, ctx] = mk(); stoneBase(ctx, 161, [62, 64, 62], 0.3);
      // wet sheen streaks
      pix(ctx, (x, y, d, i) => { const w = vnA(x, y, 32, 8, 4); if (w > 0.65) { const t = (w - 0.65) * 2; d[i] += 60 * t; d[i + 1] += 70 * t; d[i + 2] += 75 * t; } });
      const st = []; for (let k = 0; k < 14; k++) st.push([rnd(0, TS), rnd(0, TS), rnd(3, 7)]);
      wrap(ctx, () => {
        for (const [x, y, r] of st) {
          ell(ctx, x + 1, y + 1.5, r * 1.3, r * 1.3, 'rgba(0,0,0,0.4)');
          const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r); g.addColorStop(0, '#c8c4b4'); g.addColorStop(0.5, '#7a786e'); g.addColorStop(1, '#3a3a36');
          ell(ctx, x, y, r, r, g);
          ell(ctx, x, y, r * 0.3, r * 0.3, 'rgba(180,220,230,0.9)'); ell(ctx, x - 0.4, y - 0.4, 0.6, 0.6, '#fff');
        }
      });
      for (let k = 0; k < 30; k++) ell(ctx, rnd(0, TS), rnd(0, TS), 0.7, 0.7, 'rgba(200,235,245,0.7)');
      A.grab('ceil_drip', c);
    }
    {
      const [c, ctx] = mk(); earth(ctx, 171, [58, 42, 30]);
      rootMesh(ctx, 9, 7, '#4a3018', '#8a6440');
      const ends = []; for (let k = 0; k < 18; k++) ends.push([rnd(0, TS), rnd(0, TS), rnd(1.5, 3.5)]);
      wrap(ctx, () => { for (const [x, y, r] of ends) { ell(ctx, x + 1, y + 1.5, r * 1.4, r * 1.4, 'rgba(0,0,0,0.5)'); ell(ctx, x, y, r, r, '#6a4628'); ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, '#b08858'); } });
      grain(ctx, 12); A.grab('ceil_roots', c);
    }
    {
      const [c, ctx] = mk(); stoneBase(ctx, 181, [52, 50, 48], 0.25);
      for (const y of [18, 82]) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, y + 22, TS, 5);
        ctx.fillStyle = lin(ctx, 0, y, 0, y + 22, [0, '#3a2616', 0.3, '#5a3c22', 0.7, '#4a301a', 1, '#24160c']); ctx.fillRect(0, y, TS, 22);
        pix(ctx, (x, yy, d, i) => { if (yy >= y && yy < y + 22) { const g = vnA(x, yy, 4, 64, 2); d[i] *= 0.8 + g * 0.4; d[i + 1] *= 0.8 + g * 0.4; d[i + 2] *= 0.8 + g * 0.4; } });
        for (const x of [20, 84]) { ell(ctx, x, y + 11, 1.6, 1.6, '#1a1210'); ell(ctx, x - 0.5, y + 10.5, 0.6, 0.6, '#8a7a6a'); }
      }
      // cobweb sheets sagging between the beams
      for (let k = 0; k < 4; k++) {
        const w = rnd(24, 50), x0 = rnd(4, 124 - w), yA = k % 2 ? 40 : 104, yB = k % 2 ? 82 : 146;
        const g = ctx.createRadialGradient(x0 + w / 2, (yA + yB) / 2, 2, x0 + w / 2, (yA + yB) / 2, w * 0.7);
        g.addColorStop(0, 'rgba(215,215,210,0.45)'); g.addColorStop(1, 'rgba(215,215,210,0)');
        for (const dy of [0, -TS]) {
          ctx.save(); ctx.translate(0, dy); ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x0 + w, yA); ctx.lineTo(x0 + w * 0.8, yB); ctx.lineTo(x0 + w * 0.15, yB); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(230,230,225,0.55)'; ctx.lineWidth = 0.6;
          for (let j = 0; j < 7; j++) { const xa = x0 + rnd(0, w), xb = x0 + rnd(0, w); ctx.beginPath(); ctx.moveTo(xa, yA); ctx.quadraticCurveTo((xa + xb) / 2 + rnd(-6, 6), (yA + yB) / 2 + rnd(0, 10), xb, yB); ctx.stroke(); }
          ctx.restore();
        }
      }
      for (let k = 0; k < 6; k++) { const x = rnd(0, TS), y = pick([40, 104]); ctx.strokeStyle = 'rgba(230,230,225,0.55)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 12, x + 22, y + 2); ctx.stroke(); }
      for (let k = 0; k < 5; k++) { const x = rnd(0, TS), y = pick([4, 120]); ctx.strokeStyle = 'rgba(230,230,225,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 8, x + 18, y); ctx.stroke(); }
      grain(ctx, 10); A.grab('ceil_cobweb', c);
    }
    {
      const [c, ctx] = mk(); cellarBrick(ctx);
      wallpaper(ctx, 4, 6, 30, 26, '#d8c8a8', '#b86870', true);
      wallpaper(ctx, 94, 92, 28, 30, '#b8c8b0', '#7a5a8a', true);
      // plaster ceiling rose
      ell(ctx, 66, 66, 30, 30, 'rgba(0,0,0,0.45)');
      const g = ctx.createRadialGradient(58, 56, 2, 64, 64, 30); g.addColorStop(0, '#fbf8ee'); g.addColorStop(1, '#a8a294');
      ell(ctx, 64, 64, 28, 28, g);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.save(); ctx.translate(64 + Math.cos(a) * 17, 64 + Math.sin(a) * 17); ctx.rotate(a); ell(ctx, 0, 0, 6, 3, '#ece8dc'); ell(ctx, 1, 1, 5, 1.5, 'rgba(0,0,0,0.15)'); ctx.restore(); }
      ctx.strokeStyle = 'rgba(120,110,95,0.6)'; ctx.lineWidth = 1; for (const r of [26, 10]) { ctx.beginPath(); ctx.arc(64, 64, r, 0, TAU); ctx.stroke(); }
      ell(ctx, 64, 64, 8, 8, '#f4f0e4');
      // bare cord and empty bulb socket seen from below
      ell(ctx, 64, 64, 3.5, 3.5, '#3a3430'); ell(ctx, 64, 64, 1.6, 1.6, '#1a1612'); ell(ctx, 63, 63, 0.8, 0.8, '#c8b890');
      cellarFrost(ctx, 191);
      grain(ctx, 10); A.grab('ceil_folded', c);
    }
    {
      const [c, ctx] = mk();
      pix(ctx, (x, y, d, i) => { const n = fbm(x, y, 201), h = vn(x, y, 16, 202); d[i] = 120 + n * 70; d[i + 1] = 150 + n * 70; d[i + 2] = 190 + n * 55 + h * 10; d[i + 3] = 255; });
      // faint vault ribs
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
      wrap(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(64, 30, 128, 0); ctx.moveTo(0, 64); ctx.quadraticCurveTo(64, 94, 128, 64); ctx.stroke(); });
      const stars = []; for (let k = 0; k < 26; k++) stars.push([rnd(0, TS), rnd(0, TS), rnd(0.5, 1.4)]);
      wrap(ctx, () => { for (const [x, y, r] of stars) { glow(ctx, x, y, r * 4, '255,255,255', 0.7); ell(ctx, x, y, r * 0.6, r * 0.6, '#ffffff'); } });
      A.grab('ceil_mirror', c);
    }
    {
      const [c, ctx] = mk(); stoneBase(ctx, 211, [70, 74, 84], 0.25);
      frostEdge(ctx, (x, y) => (fbm(x, y, 212) - 0.5) * 3.5, 0.75);
      const ic = []; for (let k = 0; k < 22; k++) ic.push([rnd(0, TS), rnd(0, TS), rnd(1.5, 4)]);
      wrap(ctx, () => {
        for (const [x, y, r] of ic) {
          ell(ctx, x + 1, y + 1.5, r * 1.3, r * 1.3, 'rgba(20,40,70,0.45)');
          const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.3, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#c8e4f8'); g.addColorStop(1, '#6a9cc8');
          ell(ctx, x, y, r, r, g);
        }
      });
      A.grab('ceil_ice', c);
    }

    // =====================================================================
    // PROPS (transparent billboards; solid parts fully opaque)
    // =====================================================================
    function shadowEl(ctx, x, w, y) { ell(ctx, x, y || 125, w, 3.2, 'rgba(0,0,0,0.5)'); }
    function stoneGrad(ctx, x0, x1, base) { return lin(ctx, x0, 0, x1, 0, [0, A.shade(base, 1.25), 0.35, A.shade(base, 1.05), 0.8, A.shade(base, 0.6), 1, A.shade(base, 0.4)]); }
    function prop(name, f) { const [c, ctx] = mk(); f(ctx); A.grab(name, c); }

    prop('pr_brazier', (ctx) => {
      shadowEl(ctx, 64, 34);
      // three legs
      ctx.lineCap = 'round';
      for (const [x0, x1] of [[40, 50], [88, 78], [64, 64]]) { line(ctx, x1, 92, x0, 125, '#1a1614', 4); line(ctx, x1 - 0.8, 92, x0 - 0.8, 125, '#5a524c', 1); }
      ell(ctx, 40, 125, 3, 1.6, '#1a1614'); ell(ctx, 88, 125, 3, 1.6, '#1a1614');
      // bowl
      ctx.fillStyle = lin(ctx, 28, 0, 100, 0, [0, '#2a2420', 0.3, '#6a605a', 0.6, '#3a3430', 1, '#141210']);
      ctx.beginPath(); ctx.moveTo(26, 78); ctx.lineTo(102, 78); ctx.quadraticCurveTo(98, 96, 64, 98); ctx.quadraticCurveTo(30, 96, 26, 78); ctx.fill();
      ell(ctx, 64, 78, 38, 6, '#1a1210');
      // coals
      for (let k = 0; k < 26; k++) { const x = rnd(32, 96), y = rnd(74, 80); ell(ctx, x, y, rnd(2, 4), rnd(1.5, 2.5), pick(['#ff5a10', '#ffa030', '#c82a08', '#ffd060', '#3a1a10'])); }
      ctx.fillStyle = '#8a7a6a'; ctx.fillRect(26, 77, 76, 1.4);
      for (const x of [36, 64, 92]) { ell(ctx, x, 88, 2, 2, '#4a4038'); }
      flame(ctx, 52, 78, 12, 44); flame(ctx, 76, 78, 11, 38); flame(ctx, 64, 79, 15, 62);
      for (let k = 0; k < 10; k++) ell(ctx, rnd(40, 88), rnd(4, 30), 1, 1, '#ffd070');
    });
    prop('pr_torchstand', (ctx) => {
      shadowEl(ctx, 64, 20);
      for (const [x0] of [[50], [78]]) line(ctx, 64, 104, x0, 126, '#1c1816', 3);
      ctx.fillStyle = lin(ctx, 61, 0, 67, 0, [0, '#141210', 0.4, '#6a625a', 1, '#100e0c']); ctx.fillRect(61.5, 44, 5, 82);
      for (const y of [60, 84, 104]) { ctx.fillStyle = '#2a2420'; ctx.fillRect(59.5, y, 9, 3); ctx.fillStyle = '#7a7066'; ctx.fillRect(59.5, y, 9, 1); }
      ctx.fillStyle = lin(ctx, 54, 0, 74, 0, [0, '#141110', 0.4, '#6a605a', 1, '#100d0c']);
      ctx.beginPath(); ctx.moveTo(53, 36); ctx.lineTo(75, 36); ctx.lineTo(69, 48); ctx.lineTo(59, 48); ctx.closePath(); ctx.fill();
      ell(ctx, 64, 36, 11, 2.5, '#2a1208');
      for (let k = 0; k < 10; k++) ell(ctx, rnd(56, 72), rnd(34, 38), 1.5, 1, pick(['#ff7a20', '#ffcf60', '#c82a08']));
      flame(ctx, 64, 37, 11, 36);
    });
    prop('pr_bones', (ctx) => {
      shadowEl(ctx, 64, 40);
      const bc = ['#d8ccae', '#c8b994', '#bfae88', '#e0d6bc'];
      // ribcage
      ctx.strokeStyle = '#cfc2a2'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      line(ctx, 46, 112, 80, 108, '#bfae88', 3);
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(50 + k * 6.5, 111 - k * 0.6); ctx.quadraticCurveTo(44 + k * 6, 94, 54 + k * 7, 92 + k); ctx.stroke(); }
      bone(ctx, 30, 120, 34, 0.15, 3.6, pick(bc)); bone(ctx, 94, 118, 30, -0.4, 3.4, pick(bc)); bone(ctx, 70, 122, 26, 0.05, 3, pick(bc));
      bone(ctx, 104, 108, 20, 1.2, 2.6, pick(bc));
      skull(ctx, 26, 104, 9, '#d8ccae', 1.5);
      // pelvis-ish lump and vertebrae
      for (let k = 0; k < 5; k++) ell(ctx, 84 + k * 4, 112 - k, 2, 1.6, '#c8b994');
    });
    prop('pr_skullpile', (ctx) => {
      shadowEl(ctx, 64, 50);
      const rows = [[6, 116, 10], [5, 100, 10], [4, 85, 10], [3, 70, 10], [2, 56, 9.5], [1, 43, 9]];
      for (const [n, y, s] of rows) for (let k = 0; k < n; k++) {
        const x = 64 + (k - (n - 1) / 2) * s * 1.85 + rnd(-1.5, 1.5);
        skull(ctx, x, y + rnd(-1, 1), s, pick(['#d8ccae', '#c8b994', '#e0d6bc', '#bfae88']), rnd(-1.5, 1.5));
      }
      for (let k = 0; k < 4; k++) bone(ctx, rnd(30, 98), rnd(118, 124), rnd(18, 28), rnd(-0.3, 0.3), 3, '#c8b994');
    });
    prop('pr_barrel', (ctx) => {
      shadowEl(ctx, 64, 36);
      const shape = () => { ctx.beginPath(); ctx.moveTo(36, 44); ctx.quadraticCurveTo(26, 84, 36, 124); ctx.lineTo(92, 124); ctx.quadraticCurveTo(102, 84, 92, 44); ctx.closePath(); };
      shape(); ctx.fillStyle = lin(ctx, 28, 0, 100, 0, [0, '#3a2210', 0.25, '#8a5a32', 0.45, '#a06c3e', 0.75, '#5a3818', 1, '#24140a']); ctx.fill();
      ctx.save(); shape(); ctx.clip();
      for (let x = 30; x < 100; x += 9) { line(ctx, x, 40, 64 + (x - 64) * 0.85, 128, 'rgba(20,10,4,0.55)', 1); }
      for (const y of [52, 70, 98, 116]) { ctx.fillStyle = lin(ctx, 0, y, 0, y + 5, [0, '#7a7470', 0.4, '#3a3634', 1, '#1a1816']); ctx.fillRect(20, y, 90, 5); }
      ctx.restore();
      ell(ctx, 64, 44, 28, 7, '#5a3818'); ell(ctx, 64, 44, 24, 5.4, '#7a4e2a');
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(64, 44, 28, 7, 0, 0, TAU); ctx.stroke();
      for (let k = -2; k <= 2; k++) line(ctx, 64 + k * 9, 39.5 + Math.abs(k) * 0.6, 64 + k * 9, 48.5 - Math.abs(k) * 0.6, 'rgba(30,16,6,0.6)', 0.8);
      // frost on top
      for (let k = 0; k < 40; k++) ell(ctx, 64 + rnd(-24, 24), 44 + rnd(-4, 4), rnd(0.8, 2), 0.8, 'rgba(235,245,255,0.85)');
      grain(ctx, 12);
    });
    prop('pr_crate', (ctx) => {
      shadowEl(ctx, 64, 44);
      // top face
      poly(ctx, [24, 52, 40, 40, 108, 40, 94, 52], '#9a7244');
      // side face
      poly(ctx, [94, 52, 108, 40, 108, 112, 94, 125], '#4a3018');
      ctx.fillStyle = lin(ctx, 24, 0, 94, 0, [0, '#8a6034', 1, '#6a4422']); ctx.fillRect(24, 52, 70, 73);
      for (let y = 52; y < 125; y += 12) { line(ctx, 24, y, 94, y, 'rgba(20,10,4,0.55)', 1); }
      // frame boards and one diagonal brace
      ctx.fillStyle = '#5a3a1c'; ctx.fillRect(24, 52, 6, 73); ctx.fillRect(88, 52, 6, 73); ctx.fillRect(24, 52, 70, 6); ctx.fillRect(24, 119, 70, 6);
      ctx.save(); ctx.beginPath(); ctx.rect(30, 58, 58, 61); ctx.clip(); ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(30, 119); ctx.lineTo(88, 58); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(24, 52, 70, 1.2);
      for (const [x, y] of [[27, 55], [91, 55], [27, 122], [91, 122]]) ell(ctx, x, y, 1, 1, '#1a1410');
      // stencil mark
      ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('VLM', 72, 100);
      grain(ctx, 14);
    });
    prop('pr_rubble', (ctx) => {
      shadowEl(ctx, 64, 52, 124);
      const ch = []; for (let k = 0; k < 26; k++) { const x = 64 + rnd(-46, 46), h = 1 - Math.abs(x - 64) / 50; ch.push([x, 126 - R() * 40 * h, rnd(4, 11) * (0.6 + h * 0.6)]); }
      ch.sort((a, b) => a[1] - b[1]);
      for (const [x, y, r] of ch) rubbleChunk(ctx, x, y, r, pick(['#7a7468', '#6a665e', '#8a8478', '#5e584e']));
      for (let k = 0; k < 30; k++) ell(ctx, rnd(14, 114), rnd(118, 126), rnd(0.8, 2), 0.9, pick(['#8a8478', '#5e584e']));
      // a broken dressed block
      poly(ctx, [70, 96, 98, 92, 102, 110, 74, 116], '#8e887c'); poly(ctx, [70, 96, 98, 92, 96, 88, 72, 91], '#a8a294');
      grain(ctx, 12);
    });
    prop('pr_pillar', (ctx) => {
      ctx.fillStyle = stoneGrad(ctx, 40, 88, '#7a766e'); ctx.fillRect(42, 14, 44, 100);
      for (let y = 26; y < 112; y += 18) line(ctx, 42, y, 86, y, 'rgba(0,0,0,0.45)', 1);
      for (let x = 50; x < 84; x += 8) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, 14, 2, 100); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 2, 14, 1, 100); }
      // capital and base
      ctx.fillStyle = stoneGrad(ctx, 32, 96, '#8a867c'); ctx.fillRect(32, 0, 64, 8); ctx.fillRect(36, 8, 56, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(36, 14, 56, 3);
      ctx.fillStyle = stoneGrad(ctx, 34, 94, '#8a867c'); ctx.fillRect(36, 112, 56, 6); ctx.fillRect(32, 118, 64, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(32, 118, 64, 1); ctx.fillRect(36, 112, 56, 1);
      mottle(ctx, 0.3, 221); grain(ctx, 14);
    });
    prop('pr_stalagmite', (ctx) => {
      shadowEl(ctx, 64, 30);
      const sh = (x, w, top, col) => { ctx.fillStyle = stoneGrad(ctx, x - w, x + w, col); ctx.beginPath(); ctx.moveTo(x - w, 126); ctx.bezierCurveTo(x - w * 0.6, 90, x - w * 0.2, top + 20, x, top); ctx.bezierCurveTo(x + w * 0.25, top + 20, x + w * 0.6, 90, x + w, 126); ctx.closePath(); ctx.fill(); };
      sh(44, 12, 74, '#8a7e6c'); sh(86, 14, 64, '#857a68'); sh(64, 22, 16, '#948a78');
      // ridged flowstone and wet sheen
      for (let k = 0; k < 7; k++) { const y = 40 + k * 12, w = 4 + k * 2.6; ctx.strokeStyle = 'rgba(40,32,22,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(64, y, w, 2, 0, 0, PI); ctx.stroke(); }
      line(ctx, 60, 30, 54, 118, 'rgba(255,255,240,0.35)', 1.5);
      ell(ctx, 64, 17, 1.4, 2, 'rgba(200,230,240,0.9)');
      mottle(ctx, 0.25, 231); grain(ctx, 10);
    });
    prop('pr_mushrooms', (ctx) => {
      glow(ctx, 64, 96, 64, '90,220,210', 0.3);
      const ms = [[40, 34, 16, 'teal'], [72, 50, 20, 'violet'], [92, 30, 12, 'teal'], [56, 20, 10, 'violet'], [24, 18, 9, 'violet'], [104, 16, 8, 'teal'], [80, 14, 7, 'teal']];
      ms.sort((a, b) => b[1] - a[1]);
      for (const [x, h, r, kind] of ms) {
        const cap = kind === 'teal' ? ['#bffcf2', '#3ad8c8', '#0e6a72'] : ['#f2d0ff', '#b060f0', '#4a1a7a'];
        ctx.fillStyle = lin(ctx, x - r * 0.25, 0, x + r * 0.25, 0, [0, '#c8c0b0', 0.5, '#f0ece0', 1, '#9a9080']);
        ctx.beginPath(); ctx.moveTo(x - r * 0.2, 126); ctx.quadraticCurveTo(x - r * 0.3, 126 - h * 0.5, x - r * 0.15, 126 - h); ctx.lineTo(x + r * 0.15, 126 - h); ctx.quadraticCurveTo(x + r * 0.3, 126 - h * 0.5, x + r * 0.2, 126); ctx.fill();
        glow(ctx, x, 126 - h, r * 2.2, kind === 'teal' ? '80,240,220' : '190,110,255', 0.45);
        const g = ctx.createRadialGradient(x - r * 0.3, 126 - h - r * 0.4, 0.5, x, 126 - h, r);
        g.addColorStop(0, cap[0]); g.addColorStop(0.5, cap[1]); g.addColorStop(1, cap[2]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, 126 - h, r, r * 0.6, 0, PI, TAU); ctx.quadraticCurveTo(x, 126 - h + r * 0.25, x - r, 126 - h); ctx.fill();
        for (let k = 0; k < 4; k++) ell(ctx, x + rnd(-r * 0.6, r * 0.6), 126 - h - rnd(r * 0.1, r * 0.45), r * 0.08 + 0.6, r * 0.06 + 0.5, cap[0]);
      }
      for (let k = 0; k < 14; k++) ell(ctx, rnd(14, 114), rnd(40, 110), 0.9, 0.9, pick(['#bffcf2', '#f2d0ff']));
      ell(ctx, 64, 125, 50, 3, '#2a3a30');
    });
    prop('pr_cobweb_hang', (ctx) => {
      ctx.strokeStyle = 'rgba(225,225,220,0.85)'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
      // tattered sheets hanging from the ceiling
      for (let k = 0; k < 3; k++) {
        const x0 = 20 + k * 30 + rnd(-5, 5), w = rnd(26, 40), len = rnd(50, 100);
        ctx.fillStyle = 'rgba(215,215,210,0.62)';
        ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + w, 0);
        let px = x0 + w; for (let j = 0; j <= 6; j++) { const x = x0 + w - j * w / 6, y = len * (0.55 + R() * 0.45) * (1 - Math.abs(j - 3) / 8); ctx.lineTo(x, y); px = x; }
        ctx.closePath(); ctx.fill();
        for (let j = 0; j < 7; j++) { const x = x0 + rnd(0, w); ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + rnd(-4, 4), len * 0.5, x + rnd(-6, 6), len * rnd(0.6, 1.1)); ctx.stroke(); }
      }
      for (let k = 0; k < 6; k++) { const x = rnd(10, 118); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + rnd(-4, 4), rnd(60, 118)); ctx.stroke(); }
      ell(ctx, 70, 92, 3, 3.6, '#120c0a'); ell(ctx, 70, 88, 2, 2, '#120c0a');
      ctx.strokeStyle = '#120c0a'; ctx.lineWidth = 1;
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(70, 91 + k); ctx.quadraticCurveTo(70 + sd * 6, 86 + k * 3, 70 + sd * 7, 92 + k * 3); ctx.stroke(); }
    });
    prop('pr_chain_hang', (ctx) => {
      chain(ctx, [[64, 0], [64, 92]], 8, '#1c1a1a', '#9a948e');
      chain(ctx, [[50, 0], [52, 50]], 7, '#1c1a1a', '#8a847e');
      chain(ctx, [[80, 0], [77, 64]], 7, '#1c1a1a', '#8a847e');
      // hook
      ctx.strokeStyle = '#1c1a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(64, 94); ctx.lineTo(64, 104); ctx.arc(56, 104, 8, 0, PI * 0.9); ctx.stroke();
      ctx.strokeStyle = '#a8a29a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(63, 95); ctx.lineTo(63, 104); ctx.arc(56, 104, 7, 0, PI * 0.7); ctx.stroke();
      ctx.fillStyle = 'rgba(110,30,20,0.9)'; ell(ctx, 50, 110, 2, 1.4);
    });
    prop('pr_icicles_hang', (ctx) => {
      ctx.fillStyle = '#e8f4fc'; ctx.beginPath(); ctx.moveTo(8, 0); for (let x = 8; x <= 120; x += 8) ctx.lineTo(x, 4 + rnd(0, 6)); ctx.lineTo(120, 0); ctx.fill();
      const ics = []; for (let k = 0; k < 14; k++) ics.push([12 + k * 7.6 + rnd(-2, 2), rnd(2.5, 6), rnd(20, 110) * (1 - Math.abs(k - 6.5) / 14)]);
      for (const [x, w, l] of ics) {
        const g = lin(ctx, x - w, 0, x + w, 0, [0, '#8ab8dc', 0.4, '#f4fbff', 1, '#6a9cc8']);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, 2); ctx.quadraticCurveTo(x - w * 0.5, l * 0.5, x, l); ctx.quadraticCurveTo(x + w * 0.5, l * 0.5, x + w, 2); ctx.closePath(); ctx.fill();
        line(ctx, x - w * 0.35, 4, x - w * 0.05, l * 0.7, '#ffffff', 0.8);
        for (let j = 1; j < 4; j++) line(ctx, x - w * (1 - j / 4) * 0.9, l * j / 4 * 0.9, x + w * (1 - j / 4) * 0.9, l * j / 4 * 0.9 + 1, 'rgba(90,140,190,0.5)', 0.6);
      }
    });
    prop('pr_sarcophagus', (ctx) => {
      shadowEl(ctx, 64, 56);
      // perspective box: front face and right side, lid on top
      poly(ctx, [10, 84, 94, 84, 94, 124, 10, 124], '#7a766c');
      poly(ctx, [94, 84, 118, 70, 118, 108, 94, 124], '#4e4a44');
      // lid
      poly(ctx, [6, 82, 32, 64, 122, 64, 98, 82], '#a09a8c');
      poly(ctx, [6, 82, 98, 82, 98, 88, 6, 88], '#8a857a');
      poly(ctx, [98, 82, 122, 64, 122, 70, 98, 88], '#5e5a52');
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(6, 82, 92, 1);
      // panels on the front
      for (const x of [16, 40, 66]) { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.2; ctx.strokeRect(x, 94, 20, 24); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(x + 1, 95, 20, 24); }
      // Root sigil on the lid (foreshortened)
      ctx.save(); ctx.translate(64, 73); ctx.scale(1.4, 0.45); carve(ctx, 'root', 0, 0, 12); ctx.restore();
      carve(ctx, 'root', 50, 106, 8);
      // frost on lid
      for (let k = 0; k < 40; k++) ell(ctx, rnd(20, 116), rnd(65, 82), rnd(0.6, 1.6), 0.6, 'rgba(235,245,255,0.7)');
      mottle(ctx, 0.25, 241); grain(ctx, 12);
    });
    prop('pr_coffin', (ctx) => {
      shadowEl(ctx, 64, 56);
      const body = [6, 98, 24, 86, 108, 86, 122, 96, 108, 108, 24, 108];
      // box sides
      poly(ctx, [6, 98, 24, 108, 108, 108, 122, 96, 122, 110, 108, 124, 24, 124, 6, 112], '#4a2c16');
      poly(ctx, [24, 108, 108, 108, 108, 124, 24, 124], '#5e3a1e');
      // dark interior with a glimpse of linen
      poly(ctx, body, '#120a06');
      ell(ctx, 40, 98, 10, 4, '#cfc6b0'); ell(ctx, 40, 97, 6, 2, '#e8e0cc');
      // lid shoved half off, tilted
      // lid shoved aside, lying askew across the right half
      const lid = [50, 84, 64, 72, 116, 70, 126, 78, 116, 90, 64, 94];
      poly(ctx, lid.map((v, j) => j % 2 ? v + 5 : v), '#2a180a');
      poly(ctx, lid, lin(ctx, 0, 70, 0, 94, [0, '#9a6a3a', 1, '#6a4220']));
      ctx.strokeStyle = 'rgba(255,220,170,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(52, 84); ctx.lineTo(65, 73); ctx.lineTo(116, 71); ctx.stroke();
      for (let k = 0; k < 4; k++) line(ctx, 70 + k * 12, 73, 68 + k * 12, 93, 'rgba(40,20,8,0.4)', 0.7);
      for (let k = 0; k < 6; k++) line(ctx, 28 + k * 14, 110, 28 + k * 14, 122, 'rgba(20,10,4,0.5)', 0.8);
      grain(ctx, 12);
    });
    prop('pr_cot', (ctx) => {
      shadowEl(ctx, 64, 58);
      // legs and frame
      for (const x of [12, 116]) { ctx.fillStyle = '#3a2412'; ctx.fillRect(x - 2, 104, 4, 22); }
      ctx.fillStyle = lin(ctx, 0, 100, 0, 108, [0, '#7a5230', 1, '#3a2412']); ctx.fillRect(8, 100, 112, 8);
      // straw mattress
      ctx.fillStyle = '#8a7a50'; ctx.fillRect(10, 94, 108, 8);
      // frozen blanket with stiff folds
      ctx.fillStyle = lin(ctx, 0, 80, 0, 104, [0, '#c8dcea', 0.4, '#8aa2b8', 1, '#4a5e74']);
      ctx.beginPath(); ctx.moveTo(30, 96); ctx.quadraticCurveTo(34, 82, 52, 84); ctx.quadraticCurveTo(76, 78, 100, 84); ctx.quadraticCurveTo(118, 86, 118, 96); ctx.lineTo(120, 108); ctx.lineTo(28, 108); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 6; k++) { const x = 40 + k * 13; line(ctx, x, 86, x + 4, 106, 'rgba(40,60,90,0.4)', 1.2); line(ctx, x + 1.5, 86, x + 5.5, 106, 'rgba(255,255,255,0.4)', 0.7); }
      // pillow
      ell(ctx, 20, 92, 12, 5, '#b8c4cc'); ell(ctx, 18, 90.5, 6, 2, 'rgba(255,255,255,0.5)');
      // rime and tiny icicles on the blanket edge
      for (let k = 0; k < 60; k++) ell(ctx, rnd(30, 118), rnd(80, 104), rnd(0.5, 1.4), 0.6, 'rgba(240,250,255,0.85)');
      for (let k = 0; k < 10; k++) icicle(ctx, 32 + k * 9, 107, 1.1, rnd(3, 8));
      grain(ctx, 10);
    });
    prop('pr_weaponrack', (ctx) => {
      shadowEl(ctx, 64, 50);
      // A-frame stand with two rails
      ctx.lineCap = 'round';
      for (const [x0, x1] of [[16, 26], [112, 102]]) { line(ctx, x1, 30, x0, 125, '#3a2412', 5); line(ctx, x1 - 1, 30, x0 - 1, 125, '#8a6038', 1.2); }
      ctx.fillStyle = lin(ctx, 0, 0, 0, 6, [0, '#8a6038', 1, '#3a2412']);
      for (const y of [34, 100]) { ctx.fillStyle = lin(ctx, 0, y, 0, y + 6, [0, '#9a7044', 1, '#3a2412']); ctx.fillRect(18, y, 92, 6); }
      for (let k = 0; k < 4; k++) spear(ctx, 32 + k * 9, 4 + (k % 2) * 6, 122, (k - 1.5) * 0.03);
      // a halberd
      ctx.fillStyle = lin(ctx, 0, 0, 3, 0, [0, '#3a2412', 0.5, '#8a6038', 1, '#2a180a']); ctx.fillRect(74, 14, 3, 110);
      ctx.fillStyle = lin(ctx, 66, 0, 92, 0, [0, '#5a6068', 0.5, '#e8eef4', 1, '#5a6068']);
      ctx.beginPath(); ctx.moveTo(77, 18); ctx.quadraticCurveTo(94, 22, 92, 36); ctx.lineTo(77, 32); ctx.closePath(); ctx.fill();
      poly(ctx, [77, 22, 68, 26, 77, 30]); poly(ctx, [74, 14, 75.5, 4, 77, 14]);
      for (let k = 0; k < 2; k++) spear(ctx, 88 + k * 9, 10 + k * 5, 122, 0.02);
      grain(ctx, 8);
    });
    prop('pr_table_long', (ctx) => {
      shadowEl(ctx, 64, 62);
      // legs
      for (const x of [10, 112]) { ctx.fillStyle = lin(ctx, x, 0, x + 7, 0, [0, '#4a2c16', 0.5, '#7a5230', 1, '#2a180a']); ctx.fillRect(x, 86, 7, 40); }
      ctx.fillStyle = '#3a2412'; ctx.fillRect(14, 112, 100, 4);
      // top with a frosted edge
      poly(ctx, [2, 84, 14, 74, 114, 74, 126, 84], '#8a6038');
      ctx.fillStyle = lin(ctx, 0, 84, 0, 90, [0, '#6a4424', 1, '#3a2412']); ctx.fillRect(2, 84, 124, 6);
      for (let x = 16; x < 116; x += 14) line(ctx, x, 75, x - 3, 84, 'rgba(30,16,6,0.4)', 0.8);
      for (let k = 0; k < 7; k++) icicle(ctx, 8 + k * 18 + rnd(-3, 3), 90, 1.2, rnd(3, 9));
      for (let k = 0; k < 40; k++) ell(ctx, rnd(6, 122), rnd(75, 84), rnd(0.5, 1.4), 0.6, 'rgba(240,250,255,0.75)');
      // frozen tankards and a plate
      ell(ctx, 52, 80, 9, 2.4, '#8a8a90'); ell(ctx, 52, 79.5, 6, 1.5, '#c8ccd4');
      for (const [x, h] of [[26, 16], [74, 14], [98, 17]]) {
        ctx.fillStyle = lin(ctx, x - 6, 0, x + 6, 0, [0, '#4a3420', 0.4, '#8a6a42', 1, '#2a1a0c']); ctx.fillRect(x - 6, 80 - h, 12, h);
        ctx.fillStyle = '#7a7a80'; ctx.fillRect(x - 6.5, 80 - h, 13, 2); ctx.fillRect(x - 6.5, 78, 13, 2);
        ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x + 7, 80 - h / 2, 4, -PI / 2, PI / 2); ctx.stroke();
        ell(ctx, x, 80 - h, 6, 1.6, '#d8ecfa'); ell(ctx, x, 80 - h - 1.5, 4, 2, '#eef8ff');
        icicle(ctx, x - 4, 80 - h + 1, 1, 5);
      }
      grain(ctx, 10);
    });
    prop('pr_icepillar', (ctx) => {
      glow(ctx, 64, 60, 64, '170,220,255', 0.25);
      ctx.fillStyle = lin(ctx, 40, 0, 88, 0, [0, '#4a7ca8', 0.2, '#a8d4f2', 0.45, '#eaf6ff', 0.6, '#9ccaee', 1, '#3a6a98']);
      ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(86, 0); ctx.lineTo(84, 40); ctx.lineTo(88, 80); ctx.lineTo(86, 126); ctx.lineTo(42, 126); ctx.lineTo(40, 86); ctx.lineTo(44, 42); ctx.closePath(); ctx.fill();
      // facets, trapped bubbles and cracks
      for (let k = 0; k < 6; k++) { const y = rnd(4, 120); poly(ctx, [44, y, 84, y + rnd(-10, 10), 84, y + 10, 44, y + rnd(4, 14)], 'rgba(255,255,255,' + rnd(0.08, 0.2) + ')'); }
      for (let k = 0; k < 20; k++) ell(ctx, rnd(46, 82), rnd(4, 120), rnd(0.6, 1.6), rnd(0.6, 1.6), 'rgba(255,255,255,0.75)');
      for (let k = 0; k < 5; k++) { const x = rnd(48, 80), y = rnd(10, 110); line(ctx, x, y, x + rnd(-8, 8), y + rnd(8, 20), 'rgba(40,90,140,0.6)', 0.8); }
      line(ctx, 52, 0, 50, 126, 'rgba(255,255,255,0.75)', 1.5);
      // snowdrift at the base
      ctx.fillStyle = '#eef6fc'; ctx.beginPath(); ctx.ellipse(64, 126, 34, 6, 0, PI, TAU); ctx.fill();
    });
    prop('pr_crystals', (ctx) => {
      ctx.save(); crystalCluster(ctx, 64, 124, 2.1, 0.55); ctx.restore();
      // the clamped glow at the base reads as solid ground
      ell(ctx, 64, 124, 44, 4, '#1a2234');
    });
    prop('pr_clock_tall', (ctx) => {
      shadowEl(ctx, 64, 26);
      const wood = (x0, x1) => lin(ctx, x0, 0, x1, 0, [0, '#2a160a', 0.3, '#6a3e1e', 0.55, '#8a5430', 1, '#24120a']);
      // hood with a rounded crest
      ctx.fillStyle = wood(40, 88); ctx.beginPath(); ctx.moveTo(40, 52); ctx.lineTo(40, 18); ctx.quadraticCurveTo(64, 0, 88, 18); ctx.lineTo(88, 52); ctx.closePath(); ctx.fill();
      ell(ctx, 64, 6, 3, 3, '#c8a050');
      clockFace(ctx, 64, 32, 15, '#b08a3a');
      // trunk with a pendulum window
      ctx.fillStyle = wood(46, 82); ctx.fillRect(46, 52, 36, 58);
      ctx.fillStyle = '#120a06'; ctx.fillRect(54, 58, 20, 40);
      line(ctx, 64, 58, 64, 88, '#b8903a', 1.2); ell(ctx, 64, 90, 5, 5, '#e0b860'); ell(ctx, 62.5, 88.5, 1.6, 1.6, '#fff0c0');
      ctx.fillStyle = 'rgba(200,220,240,0.15)'; poly(ctx, [54, 58, 62, 58, 54, 74]);
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1; ctx.strokeRect(54, 58, 20, 40);
      // plinth
      ctx.fillStyle = wood(38, 90); ctx.fillRect(40, 110, 48, 16); ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(40, 110, 48, 1.2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(40, 52, 48, 2); ctx.fillRect(46, 108, 36, 2);
      // frost on the glass
      for (let k = 0; k < 16; k++) ell(ctx, rnd(50, 78), rnd(20, 46), 0.6, 0.6, 'rgba(240,250,255,0.7)');
      grain(ctx, 10);
    });
    prop('pr_ratnest', (ctx) => {
      shadowEl(ctx, 64, 58, 124);
      // straw mound
      ctx.fillStyle = '#6a5428'; ctx.beginPath(); ctx.moveTo(6, 126); ctx.quadraticCurveTo(20, 84, 64, 72); ctx.quadraticCurveTo(108, 84, 122, 126); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'round';
      for (let k = 0; k < 160; k++) { const x = rnd(10, 118), top = 126 - (1 - Math.abs(x - 64) / 58) * 52, y = rnd(top, 126), a = rnd(-0.8, 0.8); line(ctx, x, y, x + Math.cos(a) * rnd(5, 12), y + Math.sin(a) * rnd(2, 5), pick(['#c8a858', '#a88a40', '#8a6e30', '#e0c070']), 0.9); }
      // junk: rags, tin cup, a candlestick, a boot, coins and bones
      poly(ctx, [30, 100, 50, 92, 56, 104, 36, 110], '#7a2a24'); poly(ctx, [74, 86, 96, 92, 90, 102, 70, 98], '#3a4a6a');
      ctx.fillStyle = lin(ctx, 84, 0, 98, 0, [0, '#6a6a70', 0.4, '#d8d8e0', 1, '#5a5a60']); ctx.fillRect(84, 100, 14, 14); ell(ctx, 91, 100, 7, 2, '#3a3a40');
      ctx.fillStyle = '#c8a040'; ctx.fillRect(48, 70, 3, 28); ell(ctx, 49.5, 98, 6, 2, '#a8802a'); ell(ctx, 49.5, 70, 4, 1.5, '#e0c060');
      poly(ctx, [16, 118, 18, 100, 26, 100, 26, 112, 36, 114, 36, 120], '#3a2414');
      bone(ctx, 66, 112, 26, -0.3, 3, '#d8ccae'); skull(ctx, 104, 112, 6, '#d0c4a4', -1);
      for (let k = 0; k < 18; k++) { const x = rnd(30, 100), y = rnd(96, 124); ell(ctx, x, y, 2.2, 1.2, '#e0b840'); ell(ctx, x - 0.6, y - 0.4, 0.8, 0.4, '#fff4c0'); }
      // the bronze key glinting on top
      ctx.strokeStyle = '#b07a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(62, 74, 3, 0, TAU); ctx.stroke(); line(ctx, 65, 74, 76, 76, '#b07a30', 2); line(ctx, 74, 76, 74, 79, '#b07a30', 1.6);
      grain(ctx, 12);
    });
    prop('pr_roots', (ctx) => {
      shadowEl(ctx, 64, 48);
      ell(ctx, 64, 124, 46, 5, '#2a1c10');
      const rs = [];
      for (let k = 0; k < 9; k++) { const x0 = 64 + rnd(-40, 40), x1 = 64 + rnd(-30, 30); rs.push([x0, 126, x0 + rnd(-20, 20), 90, x1 + rnd(-30, 30), 50, x1 + rnd(-10, 10), rnd(6, 50), rnd(4, 9)]); }
      rs.sort((a, b) => a[8] - b[8]);
      for (const r of rs) taper(ctx, r.slice(0, 8), r[8], 1, '#5a3a20', '#a07850', 'rgba(0,0,0,0.45)');
      for (let k = 0; k < 10; k++) { const x = rnd(20, 108), y = rnd(30, 110); taper(ctx, [x, y, x + rnd(-8, 8), y - 6, x + rnd(-12, 12), y - 10, x + rnd(-16, 16), y - rnd(12, 20)], 2, 0.5, '#5a3a20', null, null); }
      grain(ctx, 12);
    });
    prop('pr_amber_lantern', (ctx) => {
      shadowEl(ctx, 50, 18);
      // crooked post and arm
      taper(ctx, [48, 126, 44, 96, 54, 60, 48, 18], 7, 5, '#4a3018', '#8a6440', 'rgba(0,0,0,0.4)');
      taper(ctx, [48, 22, 60, 16, 74, 14, 84, 22], 4.5, 3, '#4a3018', '#8a6440', null);
      for (let k = 0; k < 3; k++) { const y = 40 + k * 28; taper(ctx, [49, y, 40, y + 4, 36, y + 10, 34, y + 16], 2, 0.6, '#4a3018', null, null); }
      line(ctx, 84, 22, 84, 32, '#2a1a0c', 1.4);
      rootLantern(ctx, 84, 42, 1.25);
      grain(ctx, 8);
    });
    prop('pr_candles', (ctx) => {
      glow(ctx, 64, 60, 64, '255,180,80', 0.25);
      ell(ctx, 64, 122, 44, 6, '#e8dcc0'); ell(ctx, 64, 121, 38, 4, '#f4ecd8');
      const cs = [[30, 40, 4], [44, 66, 5], [58, 50, 4.5], [72, 82, 5.5], [86, 56, 4.5], [98, 34, 4], [64, 28, 3.5], [38, 22, 3]];
      cs.sort((a, b) => a[1] < b[1] ? 1 : -1);
      for (const [x, h, w] of cs) candle(ctx, x, 122, h, w, true);
    });
    prop('pr_mirror_stand', (ctx) => {
      shadowEl(ctx, 64, 34);
      // feet and posts
      ctx.fillStyle = lin(ctx, 0, 118, 0, 126, [0, '#e8f0f8', 1, '#5a6472']); ctx.fillRect(30, 118, 68, 7);
      silverBar(ctx, 30, 30, 5, 90, true); silverBar(ctx, 93, 30, 5, 90, true);
      // oval glass in a silver frame
      ell(ctx, 64, 60, 30, 56, lin(ctx, 34, 4, 94, 116, [0, '#f4f8fc', 0.4, '#8a96a6', 0.7, '#e0e8f2', 1, '#4a5462']));
      const g = lin(ctx, 0, 8, 0, 112, [0, '#e8f6ff', 0.5, '#a4c8e8', 1, '#5c80a4']);
      ell(ctx, 64, 60, 25, 51, g);
      ctx.save(); ctx.beginPath(); ctx.ellipse(64, 60, 25, 51, 0, 0, TAU); ctx.clip();
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(52 + k * 12, 60); ctx.rotate(0.45); ctx.fillStyle = 'rgba(255,255,255,' + (0.3 - k * 0.08) + ')'; ctx.fillRect(-3, -80, 5 + k, 160); ctx.restore(); }
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ell(ctx, 70, 44, 5, 6); ctx.beginPath(); ctx.moveTo(63, 50); ctx.quadraticCurveTo(60, 90, 61, 100); ctx.lineTo(79, 100); ctx.quadraticCurveTo(80, 90, 77, 50); ctx.closePath(); ctx.fill();
      ctx.restore();
      A.symbol.pale(ctx, 64, 6, 5, '#f4faff');
      for (let k = 0; k < 6; k++) icicle(ctx, 46 + k * 7, 108, 1, rnd(3, 7));
    });
    prop('pr_sun_statue', (ctx) => {
      glow(ctx, 64, 20, 50, '255,210,110', 0.45);
      shadowEl(ctx, 64, 36);
      const gold = (x0, x1) => lin(ctx, x0, 0, x1, 0, [0, '#6a4410', 0.3, '#f4d070', 0.5, '#d8a840', 1, '#5a3a0c']);
      // plinth
      ctx.fillStyle = stoneGrad(ctx, 34, 94, '#8a867c'); ctx.fillRect(34, 108, 60, 18); ctx.fillRect(30, 104, 68, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(30, 104, 68, 1);
      // robed figure
      ctx.fillStyle = gold(42, 86); ctx.beginPath(); ctx.moveTo(56, 50); ctx.lineTo(72, 50); ctx.quadraticCurveTo(78, 80, 86, 104); ctx.lineTo(42, 104); ctx.quadraticCurveTo(50, 80, 56, 50); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 5; k++) line(ctx, 54 + k * 5, 60, 48 + k * 8, 104, 'rgba(90,50,10,0.45)', 1);
      // raised arms
      ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { line(ctx, 64 + sd * 7, 54, 64 + sd * 15, 32, '#a87a26', 6); line(ctx, 64 + sd * 7 - 1, 54, 64 + sd * 15 - 1, 32, '#f0c860', 2.2); }
      ell(ctx, 64, 44, 7, 8, gold(57, 71)); ell(ctx, 62, 42, 2, 2.5, 'rgba(255,250,220,0.6)');
      // the sun disc held aloft
      const sg = ctx.createRadialGradient(60, 14, 1, 64, 18, 16); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.5, '#f6c850'); sg.addColorStop(1, '#a86a10');
      ell(ctx, 64, 18, 15, 15, sg);
      A.symbol.dawn(ctx, 64, 18, 15, '#8a5a10');
      ell(ctx, 59, 13, 3, 2, 'rgba(255,255,255,0.7)');
      grain(ctx, 8);
    });
    prop('pr_statue_king', (ctx) => {
      shadowEl(ctx, 64, 36);
      const st = (x0, x1) => stoneGrad(ctx, x0, x1, '#8e8a80');
      ctx.fillStyle = st(32, 96); ctx.fillRect(34, 110, 60, 16); ctx.fillRect(30, 106, 68, 5);
      // robe and cloak
      ctx.fillStyle = st(36, 92); ctx.beginPath(); ctx.moveTo(52, 40); ctx.lineTo(76, 40); ctx.quadraticCurveTo(88, 70, 90, 106); ctx.lineTo(38, 106); ctx.quadraticCurveTo(40, 70, 52, 40); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 6; k++) line(ctx, 52 + k * 5, 52, 44 + k * 9, 106, 'rgba(30,28,24,0.4)', 1);
      // belt
      ctx.fillStyle = '#6a665e'; ctx.fillRect(48, 66, 32, 4);
      // root staff in the right hand
      taper(ctx, [86, 108, 87, 80, 85, 50, 86, 22], 3.6, 3, '#6a5a44', '#a89878', null);
      ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(86, 22); ctx.quadraticCurveTo(86 + sd * 8, 14, 86 + sd * 4, 8); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(86, 16, 6, 0, TAU); ctx.stroke();
      ell(ctx, 82, 58, 5, 4, '#a09a8e');
      // left hand at the chest
      ell(ctx, 56, 56, 4.5, 3.8, '#a09a8e');
      // head, beard and crown
      ell(ctx, 64, 30, 8.5, 9.5, st(55, 73));
      ctx.fillStyle = '#9e988c'; ctx.beginPath(); ctx.moveTo(56, 32); ctx.quadraticCurveTo(64, 60, 72, 32); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 5; k++) line(ctx, 59 + k * 2.5, 36, 61 + k * 1.4, 50, 'rgba(40,36,30,0.45)', 0.7);
      line(ctx, 60, 28, 63, 28, 'rgba(30,28,24,0.7)', 1); line(ctx, 65, 28, 68, 28, 'rgba(30,28,24,0.7)', 1);
      poly(ctx, [55, 24, 55, 14, 58, 19, 61, 11, 64, 18, 67, 11, 70, 19, 73, 14, 73, 24], st(55, 73));
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(55, 22, 18, 1);
      // frost on shoulders and crown
      for (let k = 0; k < 40; k++) ell(ctx, rnd(46, 82), rnd(12, 48), rnd(0.5, 1.3), 0.6, 'rgba(235,245,255,0.75)');
      mottle(ctx, 0.25, 251); grain(ctx, 12);
    });
    prop('pr_gold_pile', (ctx) => {
      shadowEl(ctx, 64, 50);
      glow(ctx, 64, 104, 56, '255,200,90', 0.2);
      ctx.fillStyle = lin(ctx, 0, 84, 0, 126, [0, '#f4c850', 0.5, '#c89028', 1, '#7a5010']);
      ctx.beginPath(); ctx.moveTo(12, 126); ctx.quadraticCurveTo(34, 94, 64, 86); ctx.quadraticCurveTo(96, 94, 116, 126); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 110; k++) {
        const x = rnd(16, 112), top = 126 - (1 - Math.abs(x - 64) / 52) * 38, y = rnd(top, 126);
        ell(ctx, x, y, rnd(2, 3.2), rnd(1, 1.8), pick(['#f8d860', '#e0b040', '#b88020']));
        ell(ctx, x - 0.6, y - 0.4, 0.9, 0.4, '#fff6c8');
      }
      // goblets and a jewelled crown-less chalice
      for (const [x, y, s] of [[40, 96, 1], [90, 100, 0.85]]) {
        ctx.fillStyle = lin(ctx, x - 7 * s, 0, x + 7 * s, 0, [0, '#8a5a10', 0.4, '#ffe080', 1, '#7a4a08']);
        ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 18 * s); ctx.quadraticCurveTo(x - 7 * s, y - 8 * s, x - 1.5 * s, y - 6 * s); ctx.lineTo(x - 1.5 * s, y); ctx.lineTo(x - 5 * s, y + 2 * s); ctx.lineTo(x + 5 * s, y + 2 * s); ctx.lineTo(x + 1.5 * s, y); ctx.lineTo(x + 1.5 * s, y - 6 * s); ctx.quadraticCurveTo(x + 7 * s, y - 8 * s, x + 7 * s, y - 18 * s); ctx.closePath(); ctx.fill();
        ell(ctx, x, y - 18 * s, 7 * s, 1.8 * s, '#5a3a08'); ell(ctx, x, y - 12 * s, 1.6 * s, 1.6 * s, '#d02040');
      }
      // frost over everything
      for (let k = 0; k < 60; k++) ell(ctx, rnd(16, 112), rnd(84, 124), rnd(0.6, 1.6), 0.7, 'rgba(235,245,255,0.8)');
    });
    prop('pr_frozen_guard', (ctx) => {
      shadowEl(ctx, 64, 40);
      // the block (opaque base, figure inside, then the ice over it)
      const blk = [28, 126, 26, 20, 34, 8, 96, 10, 102, 24, 100, 126];
      poly(ctx, blk, lin(ctx, 26, 0, 102, 0, [0, '#3a6890', 0.5, '#5a8cb4', 1, '#2a5478']));
      ctx.save(); poly(ctx, blk, 'rgba(0,0,0,0)'); ctx.clip();
      // guardsman: helm, mail, tabard with the sun, spear
      ctx.fillStyle = '#2a3440'; ctx.beginPath(); ctx.moveTo(52, 44); ctx.lineTo(76, 44); ctx.lineTo(82, 80); ctx.lineTo(76, 120); ctx.lineTo(52, 120); ctx.lineTo(46, 80); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2c4a7a'; ctx.fillRect(54, 54, 20, 46);
      A.symbol.dawn(ctx, 64, 68, 7, '#c8a050');
      ell(ctx, 64, 34, 8, 9, '#c8a890'); ctx.fillStyle = '#5a646e'; ctx.beginPath(); ctx.arc(64, 32, 9, PI, TAU); ctx.fill(); ctx.fillRect(55, 31, 18, 3);
      ctx.fillStyle = '#1a1e24'; ctx.fillRect(59, 34, 3, 1.5); ctx.fillRect(66, 34, 3, 1.5);
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(84, 120); ctx.lineTo(86, 16); ctx.stroke();
      poly(ctx, [86, 6, 89, 16, 83, 16], '#9aa4ae');
      ell(ctx, 82, 64, 4, 4, '#b89880'); ell(ctx, 46, 74, 4, 4, '#b89880');
      // the ice over him
      ctx.fillStyle = 'rgba(160,210,245,0.55)'; ctx.fillRect(0, 0, TS, TS);
      for (let k = 0; k < 6; k++) { const x = rnd(30, 96); poly(ctx, [x, 0, x + 8, 0, x - 20, 128, x - 28, 128], 'rgba(255,255,255,' + rnd(0.08, 0.2) + ')'); }
      for (let k = 0; k < 7; k++) { const x = rnd(30, 96), y = rnd(14, 120); line(ctx, x, y, x + rnd(-10, 10), y + rnd(-12, 12), 'rgba(255,255,255,0.75)', 0.7); }
      for (let k = 0; k < 24; k++) ell(ctx, rnd(30, 98), rnd(12, 124), rnd(0.5, 1.4), rnd(0.5, 1.4), 'rgba(255,255,255,0.7)');
      ctx.restore();
      ctx.strokeStyle = 'rgba(240,250,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(26, 20); ctx.lineTo(34, 8); ctx.lineTo(96, 10); ctx.lineTo(102, 24); ctx.stroke();
      line(ctx, 30, 24, 32, 122, 'rgba(255,255,255,0.6)', 1.2);
      ctx.fillStyle = '#eef6fc'; ctx.beginPath(); ctx.ellipse(64, 126, 40, 5, 0, PI, TAU); ctx.fill();
    });
    prop('pr_altar_ice', (ctx) => {
      glow(ctx, 64, 60, 60, '180,220,255', 0.3);
      shadowEl(ctx, 64, 36);
      // altar block of ice
      poly(ctx, [30, 78, 98, 78, 92, 126, 36, 126], lin(ctx, 30, 0, 98, 0, [0, '#5a8cb8', 0.3, '#cfe8fa', 0.6, '#8ab8e0', 1, '#3a6a98']));
      poly(ctx, [26, 72, 102, 72, 98, 80, 30, 80], '#e8f6ff');
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; poly(ctx, [40, 126, 46, 80, 52, 80, 46, 126]);
      A.symbol.pale(ctx, 64, 102, 12, 'rgba(40,80,130,0.85)');
      for (let k = 0; k < 6; k++) icicle(ctx, 32 + k * 12.5, 80, 1.2, rnd(4, 10));
      // the empty hourglass on top
      hourglass(ctx, 64, 54, 15, '#c8d4e2', 'rgba(220,240,255,0.92)');
      ctx.fillStyle = '#c8d4e2'; ctx.fillRect(54, 68, 20, 4);
      for (let k = 0; k < 10; k++) ell(ctx, rnd(34, 94), rnd(20, 70), 0.8, 0.8, '#ffffff');
    });
  });
})();
