// Texture pack: interior set dressing. Registered with BT.TX.addPack; see js/render/textures/core.js.
// House interiors: full walls (wall_*), transparent wall decals (dc_*), floors (floor_*, rug_*),
// ceilings (ceil_*) and transparent billboard props (pr_*). All 128x128.
// No crosses anywhere: doors, windows, frames and furniture avoid "+"-shaped joints on purpose.
(function () {
  BT.TX.addPack(function (A) {
    A.seed(90210);
    const TS = A.TS, R = A.rng;
    // shade a colour (hex or rgb()) and return hex, so results can be shaded again
    function sh(col, f) {
      let r, g, b;
      if (col[0] === '#') { const n = parseInt(col.slice(1), 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
      else { const m = col.match(/[\d.]+/g); r = +m[0]; g = +m[1]; b = +m[2]; }
      const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
      return '#' + c(r) + c(g) + c(b);
    }
    const rr = (a, b) => a + R() * (b - a), ri = (n) => Math.floor(R() * n), pick = (a) => a[ri(a.length)];
    const TAU = Math.PI * 2;

    // ---------- helpers ----------
    function tex(name, f) {
      const c = A.canvas(), ctx = c.getContext('2d');
      ctx.save(); f(ctx, c); ctx.restore();
      A.grab(name, c);
      return c;
    }
    function rgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function lin(ctx, x0, y0, x1, y1, stops) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const s of stops) g.addColorStop(s[0], s[1]);
      return g;
    }
    function rad(ctx, x, y, r0, r1, stops) {
      const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
      for (const s of stops) g.addColorStop(s[0], s[1]);
      return g;
    }
    // noise that leaves transparent pixels alone
    function grain(ctx, amt) {
      const img = ctx.getImageData(0, 0, TS, TS), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const n = (R() - 0.5) * amt;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
    }
    function bev(ctx, x, y, w, h, hi, lo, t) {
      t = t || 1;
      ctx.fillStyle = hi; ctx.fillRect(x, y, w, t); ctx.fillRect(x, y, t, h);
      ctx.fillStyle = lo; ctx.fillRect(x, y + h - t, w, t); ctx.fillRect(x + w - t, y, t, h);
    }
    // a piece of wood with grain (grain lines start and end at the same offset so strips tile)
    function wood(ctx, x, y, w, h, base, o) {
      o = o || {};
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = o.vert ? lin(ctx, x, 0, x + w, 0, [[0, sh(base, 1.12)], [0.5, base], [1, sh(base, 0.8)]])
        : lin(ctx, 0, y, 0, y + h, [[0, sh(base, 1.15)], [0.45, base], [1, sh(base, 0.78)]]);
      ctx.fillRect(x, y, w, h);
      const n = o.grain != null ? o.grain : Math.ceil((o.vert ? w : h) * 0.7);
      ctx.lineWidth = o.lw || 0.7;
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = R() < 0.25 ? 'rgba(255,225,180,' + rr(0.05, 0.14) + ')' : 'rgba(25,12,4,' + rr(0.1, 0.32) + ')';
        ctx.beginPath();
        if (o.vert) {
          const gx = x + R() * w, a = rr(-2, 2), b = rr(-2, 2);
          ctx.moveTo(gx, y); ctx.bezierCurveTo(gx + a, y + h / 3, gx + b, y + 2 * h / 3, gx, y + h);
        } else {
          const gy = y + R() * h, a = rr(-1.6, 1.6), b = rr(-1.6, 1.6);
          ctx.moveTo(x, gy); ctx.bezierCurveTo(x + w / 3, gy + a, x + 2 * w / 3, gy + b, x + w, gy);
        }
        ctx.stroke();
      }
      if (o.knots) for (let k = 0; k < o.knots; k++) {
        const kx = x + rr(4, w - 4), ky = y + rr(4, h - 4);
        ctx.strokeStyle = 'rgba(30,15,5,0.4)'; ctx.lineWidth = 0.8;
        for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.ellipse(kx, ky, o.vert ? r * 0.8 : r * 1.6, o.vert ? r * 1.6 : r * 0.8, 0, 0, TAU); ctx.stroke(); }
      }
      ctx.restore();
      if (o.bevel !== false) bev(ctx, x, y, w, h, 'rgba(255,230,190,0.22)', 'rgba(0,0,0,0.38)');
    }
    // a raised, bevelled panel
    function panel(ctx, x, y, w, h, base) {
      ctx.fillStyle = sh(base, 0.6); ctx.fillRect(x, y, w, h);
      bev(ctx, x, y, w, h, 'rgba(0,0,0,0.45)', 'rgba(255,230,190,0.18)', 1.5);
      wood(ctx, x + 3, y + 3, w - 6, h - 6, base, { grain: Math.ceil(h / 3) });
      ctx.fillStyle = 'rgba(255,230,190,0.08)'; ctx.fillRect(x + 4, y + 4, w - 8, 2);
    }
    function glow(ctx, x, y, r, rgb, a) {
      ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, 'rgba(' + rgb + ',' + a + ')'], [0.4, 'rgba(' + rgb + ',' + a * 0.45 + ')'], [1, 'rgba(' + rgb + ',0)']]);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function flame(ctx, x, y, h, noGlow) {
      if (!noGlow) glow(ctx, x, y - h * 0.5, h * 2.6, '255,190,90', 0.5);
      ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, '#fff2a8'], [0.5, '#ffb43a'], [1, '#d8501a']]);
      ctx.beginPath(); ctx.moveTo(x, y - h);
      ctx.bezierCurveTo(x + h * 0.42, y - h * 0.45, x + h * 0.36, y, x, y);
      ctx.bezierCurveTo(x - h * 0.36, y, x - h * 0.42, y - h * 0.45, x, y - h); ctx.fill();
      ctx.fillStyle = '#fffbe6';
      ctx.beginPath(); ctx.ellipse(x, y - h * 0.32, h * 0.12, h * 0.26, 0, 0, TAU); ctx.fill();
    }
    // a bed of fire: layered tongues, red outside to white-hot inside
    function fire(ctx, cx, base, w, h) {
      glow(ctx, cx, base - h * 0.4, h * 1.4, '255,140,40', 0.55);
      const layers = [['#b8281a', 1], ['#f06a18', 0.82], ['#ffb030', 0.6], ['#fff0b0', 0.36]];
      for (const [col, k] of layers) {
        ctx.fillStyle = col;
        const n = Math.round(4 + 5 * k);
        for (let i = 0; i < n; i++) {
          const x = cx + (i / (n - 1) - 0.5) * w * k + rr(-1.5, 1.5), d = Math.abs(i / (n - 1) - 0.5) * 2;
          const th = h * k * (1 - d * 0.55) * rr(0.65, 1), wd = rr(2.5, 4.5) * (0.6 + k * 0.6), tip = rr(-3, 3);
          ctx.beginPath(); ctx.moveTo(x - wd, base);
          ctx.bezierCurveTo(x - wd * 1.1, base - th * 0.45, x + tip * 0.3 - wd * 0.3, base - th * 0.7, x + tip, base - th);
          ctx.bezierCurveTo(x + tip * 0.3 + wd * 0.5, base - th * 0.6, x + wd * 1.1, base - th * 0.4, x + wd, base);
          ctx.fill();
        }
      }
    }
    function candle(ctx, x, yb, h, w, lit, col) {
      col = col || '#f1e8d2';
      ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, sh(col, 0.72)], [0.35, col], [1, sh(col, 0.6)]]);
      ctx.fillRect(x - w / 2, yb - h, w, h);
      ctx.fillStyle = sh(col, 1.05); ctx.beginPath(); ctx.ellipse(x, yb - h, w / 2, w / 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(x - w / 2 + 0.5, yb - h, 1.2, h * 0.35); // drip
      ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, yb - h); ctx.lineTo(x + 0.3, yb - h - 2.5); ctx.stroke();
      if (lit) flame(ctx, x, yb - h - 1.5, Math.max(4, w * 1.6));
    }
    // a gilt or wooden frame; returns the inner rect
    function frame(ctx, x, y, w, h, t, col, shadow) {
      if (shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y + 3, w, h); }
      const hi = sh(col, 1.35), lo = sh(col, 0.55);
      ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = hi;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - t, y + t); ctx.lineTo(x + t, y + t); ctx.lineTo(x + t, y + h - t); ctx.lineTo(x, y + h); ctx.fill();
      ctx.fillStyle = lo;
      ctx.beginPath(); ctx.moveTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.lineTo(x + w - t, y + t); ctx.lineTo(x + w - t, y + h - t); ctx.lineTo(x + t, y + h - t); ctx.lineTo(x, y + h); ctx.fill();
      ctx.strokeStyle = sh(col, 1.6); ctx.lineWidth = 0.6; ctx.strokeRect(x + t * 0.5, y + t * 0.5, w - t, h - t);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + t - 0.5, y + t - 0.5, w - 2 * t + 1, h - 2 * t + 1);
      return { x: x + t, y: y + t, w: w - 2 * t, h: h - 2 * t };
    }
    function clockFace(ctx, x, y, r, o) {
      o = o || {};
      const rim = o.rim || '#b08a3a';
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x + 1.5, y + 2, r + 1, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.4, [[0, sh(rim, 1.5)], [0.6, rim], [1, sh(rim, 0.55)]]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      const fr = r * (o.rimW || 0.8);
      ctx.fillStyle = rad(ctx, x - fr * 0.3, y - fr * 0.3, 0, fr * 1.3, [[0, o.face ? sh(o.face, 1.1) : '#fbf4de'], [1, o.face || '#d8ccaa']]);
      ctx.beginPath(); ctx.arc(x, y, fr, 0, TAU); ctx.fill();
      const ink = o.ink || '#2a1e14';
      ctx.strokeStyle = ink; ctx.fillStyle = ink;
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * TAU, big = k % 3 === 0;
        ctx.lineWidth = big ? Math.max(1, r * 0.08) : Math.max(0.6, r * 0.04);
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * fr * (big ? 0.72 : 0.8), y + Math.sin(a) * fr * (big ? 0.72 : 0.8));
        ctx.lineTo(x + Math.cos(a) * fr * 0.92, y + Math.sin(a) * fr * 0.92); ctx.stroke();
      }
      if (o.inner) o.inner(x, y, fr);
      const hh = o.h != null ? o.h : rr(0, 12), mm = o.m != null ? o.m : rr(0, 60);
      const ha = (hh / 12 + mm / 720) * TAU - Math.PI / 2, ma = mm / 60 * TAU - Math.PI / 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.hand || ink;
      ctx.lineWidth = Math.max(1, r * 0.1); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ha) * fr * 0.5, y + Math.sin(ha) * fr * 0.5); ctx.stroke();
      ctx.lineWidth = Math.max(0.8, r * 0.06); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ma) * fr * 0.78, y + Math.sin(ma) * fr * 0.78); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, Math.max(1, r * 0.08), 0, TAU); ctx.fill();
      // glass glint
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(0.8, r * 0.07);
      ctx.beginPath(); ctx.arc(x, y, fr * 0.82, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    }
    function gearPath(ctx, x, y, r, teeth, depth) {
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a0 = i / teeth * TAU, s = TAU / teeth;
        const pts = [[a0, r - depth], [a0 + s * 0.15, r], [a0 + s * 0.45, r], [a0 + s * 0.6, r - depth]];
        for (const p of pts) ctx.lineTo(x + Math.cos(p[0]) * p[1], y + Math.sin(p[0]) * p[1]);
      }
      ctx.closePath();
    }
    // a spoked gear; holes are cut out (transparent) unless holeCol is given
    function gear(ctx, x, y, r, teeth, col, o) {
      o = o || {};
      const depth = o.depth || Math.max(2, r * 0.14), spokes = o.spokes != null ? o.spokes : 5;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; gearPath(ctx, x + 2, y + 2.5, r, teeth, depth); ctx.fill();
      ctx.fillStyle = rad(ctx, x - r * 0.35, y - r * 0.35, 0, r * 1.5, [[0, sh(col, 1.45)], [0.55, col], [1, sh(col, 0.55)]]);
      gearPath(ctx, x, y, r, teeth, depth); ctx.fill();
      ctx.strokeStyle = sh(col, 0.45); ctx.lineWidth = 0.8; ctx.stroke();
      if (spokes > 0) {
        const ri0 = r * 0.25, ro = r - depth - Math.max(2, r * 0.13);
        for (let i = 0; i < spokes; i++) {
          const a0 = i / spokes * TAU + (o.rot || 0), s = TAU / spokes, pad = Math.min(0.32, (r * 0.12) / ro + 0.12);
          ctx.beginPath();
          ctx.arc(x, y, ro, a0 + pad, a0 + s - pad);
          ctx.arc(x, y, ri0 + r * 0.1, a0 + s - pad * 1.6, a0 + pad * 1.6, true);
          ctx.closePath();
          if (o.holeCol) { ctx.fillStyle = o.holeCol; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke(); }
          else { ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = sh(col, 0.5); ctx.lineWidth = 0.8; ctx.stroke(); }
        }
      }
      ctx.fillStyle = sh(col, 0.7); ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(x, y, r * 0.08 + 0.6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // six-armed snowflake, arms start pointing up (no horizontal arm, so never a cross)
    function flake(ctx, x, y, r, col, lw) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw || Math.max(0.8, r * 0.16); ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU - Math.PI / 2, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        if (r > 3) {
          const mx = x + Math.cos(a) * r * 0.6, my = y + Math.sin(a) * r * 0.6;
          for (const s of [-1, 1]) { const b = a + s * 0.75; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(b) * r * 0.3, my + Math.sin(b) * r * 0.3); ctx.stroke(); }
        }
      }
      ctx.restore();
    }
    // a child-style sun: disc and 12 short rays
    function kidSun(ctx, x, y, r, col, ray) {
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = ray || col; ctx.lineWidth = Math.max(0.8, r * 0.28); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * TAU + 0.13;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); ctx.lineTo(x + Math.cos(a) * r * 1.9, y + Math.sin(a) * r * 1.9); ctx.stroke();
      }
      ctx.restore();
    }
    function book(ctx, x, yb, w, h, col, lean) {
      ctx.save();
      if (lean) { ctx.translate(x + (lean > 0 ? 0 : w), yb); ctx.rotate(lean); ctx.translate(-(x + (lean > 0 ? 0 : w)), -yb); }
      ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, sh(col, 0.6)], [0.35, sh(col, 1.25)], [1, sh(col, 0.55)]]);
      ctx.fillRect(x, yb - h, w, h);
      if (w >= 3) {
        ctx.fillStyle = R() < 0.6 ? 'rgba(230,190,90,0.85)' : 'rgba(20,10,5,0.5)';
        ctx.fillRect(x, yb - h + 2, w, 1); ctx.fillRect(x, yb - 3, w, 1);
        if (R() < 0.5) { ctx.fillStyle = 'rgba(240,215,150,0.7)'; ctx.fillRect(x + 1, yb - h * 0.62, w - 2, Math.max(1.5, h * 0.12)); }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + w - 0.6, yb - h, 0.6, h);
      ctx.restore();
    }
    const BOOKS = ['#7a2a24', '#2b4a78', '#2f5d3a', '#6b5a20', '#5a3070', '#8a5a2a', '#3a3a44', '#a0703a', '#5a1a20', '#244a4a', '#6a2a44'];
    // fill a shelf bay with books
    function shelfBooks(ctx, x0, x1, yb, hmax, o) {
      o = o || {};
      let x = x0 + rr(0, 2);
      while (x < x1 - 3) {
        if (o.objects && R() < 0.08 && x < x1 - 10) { // a little object instead of books
          const t = ri(3);
          if (t === 0) { ctx.fillStyle = 'rgba(160,190,200,0.75)'; ctx.fillRect(x + 1, yb - 8, 6, 8); ctx.fillStyle = '#7a5a30'; ctx.fillRect(x + 1, yb - 10, 6, 2); }
          else if (t === 1) { ctx.fillStyle = '#cdbf9e'; ctx.beginPath(); ctx.ellipse(x + 4, yb - 3, 4, 3, 0, 0, TAU); ctx.fill(); }
          else { for (let k = 0; k < 3; k++) { ctx.fillStyle = sh(pick(BOOKS), 0.9); ctx.fillRect(x, yb - 2 - k * 2.2, 9 - k, 2); } }
          x += 10; continue;
        }
        const w = 2 + ri(4), h = hmax * rr(0.62, 0.98);
        const lean = (x > x1 - 12 && R() < 0.4) ? 0.25 : 0;
        book(ctx, x, yb, w, h, sh(pick(BOOKS), rr(0.8, 1.1)), lean);
        x += w + (R() < 0.12 ? rr(1, 3) : 0.4);
        if (lean) break;
      }
    }
    function shadowBelow(ctx, x, y, w) {
      ctx.fillStyle = rad(ctx, x, y, 0, w, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]);
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.12); ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.restore(); ctx.fill();
    }
    // vertical shading from the ceiling down and into the floor line, for walls
    function wallLight(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, 40, [[0, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, TS, 40);
      ctx.fillStyle = lin(ctx, 0, 112, 0, 128, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(0, 112, TS, 16);
    }
    // crown moulding at the top, skirting at the bottom
    function cornice(ctx, col, h) {
      h = h || 8;
      wood(ctx, 0, 0, TS, h, col, { grain: 4 });
      ctx.fillStyle = sh(col, 1.3); ctx.fillRect(0, h - 3, TS, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, h, TS, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, h + 2, TS, 2);
    }
    function skirting(ctx, col, y) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y - 2, TS, 2);
      wood(ctx, 0, y, TS, TS - y, col, { grain: 4 });
      ctx.fillStyle = sh(col, 1.35); ctx.fillRect(0, y + 1, TS, 1);
    }
    function wrapX(f) { f(0); f(-TS); f(TS); }
    function wrapXY(f) { for (const dx of [-TS, 0, TS]) for (const dy of [-TS, 0, TS]) f(dx, dy); }

    // ================= FULL WALLS =================
    tex('wall_rose', (ctx) => {
      ctx.fillStyle = lin(ctx, 0, 8, 0, 82, [[0, '#a4707a'], [1, '#8c5862']]); ctx.fillRect(0, 0, TS, 84);
      for (let x = 0; x < TS; x += 16) { ctx.fillStyle = 'rgba(255,225,225,0.06)'; ctx.fillRect(x + 5, 0, 6, 84); ctx.fillStyle = 'rgba(120,40,60,0.08)'; ctx.fillRect(x + 4, 0, 1, 84); }
      const rose = (x, y) => {
        ctx.strokeStyle = 'rgba(96,110,78,0.75)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(x - 9, y + 6); ctx.quadraticCurveTo(x - 3, y + 1, x, y); ctx.quadraticCurveTo(x + 4, y + 5, x + 9, y + 3); ctx.stroke();
        ctx.fillStyle = '#7a8a64';
        ctx.beginPath(); ctx.ellipse(x - 6, y + 4, 3.4, 1.5, -0.6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 3.4, 1.5, 0.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6a2c3c'; ctx.beginPath(); ctx.arc(x, y - 0.5, 4.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c4808e'; ctx.beginPath(); ctx.arc(x - 0.6, y - 1, 3.8, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e2aab2'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.8, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8a3c4c'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x - 0.4, y - 0.8, 2.2, 0.3, 4.2); ctx.stroke();
        ctx.fillStyle = '#d89aa4'; ctx.beginPath(); ctx.arc(x + 10, y - 7, 1.4, 0, TAU); ctx.fill();
      };
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 32 + (r % 2 ? 16 : 0) + 8, y = 20 + r * 20; wrapX((d) => rose(x + d, y)); }
      cornice(ctx, '#3a2416', 9);
      ctx.fillStyle = '#4a2e1a'; ctx.fillRect(0, 13, TS, 2); ctx.fillStyle = 'rgba(255,220,180,0.25)'; ctx.fillRect(0, 13, TS, 1);
      // chair rail and dark oak wainscot
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 82, TS, 2);
      wood(ctx, 0, 84, TS, 36, '#3e2616', { grain: 12 });
      wood(ctx, 0, 80, TS, 5, '#5a3820', { grain: 2 });
      for (let x = 0; x < TS; x += 32) panel(ctx, x + 4, 89, 24, 25, '#4c2f1c');
      skirting(ctx, '#2e1c10', 119);
      wallLight(ctx);
      grain(ctx, 9);
    });

    tex('wall_blue', (ctx) => {
      ctx.fillStyle = lin(ctx, 0, 10, 0, 84, [[0, '#b4c8d8'], [1, '#9fb6c8']]); ctx.fillRect(0, 0, TS, 86);
      const dam = (x, y) => {
        ctx.fillStyle = 'rgba(232,242,250,0.55)';
        ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.bezierCurveTo(x + 8, y - 4, x + 7, y + 7, x, y + 11); ctx.bezierCurveTo(x - 7, y + 7, x - 8, y - 4, x, y - 11); ctx.fill();
        ctx.fillStyle = 'rgba(120,150,175,0.55)';
        ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.bezierCurveTo(x + 4, y - 2, x + 4, y + 4, x, y + 7); ctx.bezierCurveTo(x - 4, y + 4, x - 4, y - 2, x, y - 6); ctx.fill();
        ctx.strokeStyle = 'rgba(240,248,255,0.6)'; ctx.lineWidth = 0.8;
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(x + s * 3, y + 9); ctx.bezierCurveTo(x + s * 12, y + 10, x + s * 12, y - 2, x + s * 8, y - 3); ctx.arc(x + s * 8.6, y - 1.2, 1.6, -Math.PI / 2, s > 0 ? Math.PI : 0, s < 0); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(240,248,255,0.7)'; ctx.beginPath(); ctx.arc(x, y - 13, 1.2, 0, TAU); ctx.fill();
      };
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = c * 32 + (r % 2 ? 16 : 0) + 8, y = 26 + r * 24; wrapX((d) => dam(x + d, y)); }
      // ogee lattice lines
      ctx.strokeStyle = 'rgba(225,238,248,0.3)'; ctx.lineWidth = 0.7;
      for (let c = -1; c < 5; c++) { const x = c * 32 + 24; ctx.beginPath(); ctx.moveTo(x, 14); for (let y = 14; y < 84; y += 24) ctx.bezierCurveTo(x + 6, y + 6, x - 6, y + 18, x, y + 24); ctx.stroke(); }
      // silver cornice
      ctx.fillStyle = lin(ctx, 0, 0, 0, 10, [[0, '#8a96a2'], [0.4, '#eef3f7'], [0.7, '#b8c4ce'], [1, '#6a7682']]); ctx.fillRect(0, 0, TS, 10);
      for (let x = 2; x < TS; x += 8) { ctx.fillStyle = 'rgba(80,95,110,0.55)'; ctx.fillRect(x, 3, 4, 3); }
      ctx.fillStyle = 'rgba(40,60,80,0.35)'; ctx.fillRect(0, 10, TS, 2);
      // white wainscot with silver beading
      ctx.fillStyle = 'rgba(40,60,80,0.35)'; ctx.fillRect(0, 84, TS, 2);
      ctx.fillStyle = lin(ctx, 0, 86, 0, 120, [[0, '#eef0f2'], [1, '#cfd4da']]); ctx.fillRect(0, 86, TS, 34);
      ctx.fillStyle = lin(ctx, 0, 81, 0, 87, [[0, '#ffffff'], [0.5, '#d6dee6'], [1, '#9aa8b4']]); ctx.fillRect(0, 81, TS, 6);
      for (let x = 0; x < TS; x += 32) {
        ctx.fillStyle = '#dde2e8'; ctx.fillRect(x + 4, 91, 24, 24);
        bev(ctx, x + 4, 91, 24, 24, 'rgba(90,105,120,0.5)', 'rgba(255,255,255,0.9)', 1.5);
        ctx.strokeStyle = 'rgba(160,175,190,0.9)'; ctx.lineWidth = 0.8; ctx.strokeRect(x + 7.5, 94.5, 17, 17);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + 8, 95, 16, 1);
      }
      ctx.fillStyle = 'rgba(60,80,100,0.3)'; ctx.fillRect(0, 118, TS, 2);
      ctx.fillStyle = lin(ctx, 0, 120, 0, 128, [[0, '#f4f6f8'], [1, '#b0bac4']]); ctx.fillRect(0, 120, TS, 8);
      ctx.fillStyle = '#c8d2dc'; ctx.fillRect(0, 121, TS, 1);
      wallLight(ctx);
      grain(ctx, 6);
    });

    tex('wall_plaster', (ctx) => {
      ctx.fillStyle = '#e2d9c6'; ctx.fillRect(0, 0, TS, TS);
      for (let i = 0; i < 60; i++) {
        const x = R() * TS, y = R() * TS, r = rr(4, 16);
        wrapX((d) => { ctx.fillStyle = rad(ctx, x + d, y, 0, r, [[0, R() < 0.5 ? 'rgba(255,250,240,0.35)' : 'rgba(150,130,100,0.16)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x + d - r, y - r, 2 * r, 2 * r); });
      }
      ctx.strokeStyle = 'rgba(110,90,70,0.35)'; ctx.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) { let x = rr(20, 108), y = rr(20, 100); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rr(-4, 4); y += rr(2, 6); ctx.lineTo(x, y); } ctx.stroke(); }
      const T = '#3a2617';
      // braces (drawn first, posts cover their ends)
      const brace = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
        ctx.fillStyle = 'rgba(60,40,20,0.35)'; ctx.fillRect(0, -6, len, 12);
        wood(ctx, 0, -4.5, len, 9, T, { grain: 6 }); ctx.restore();
      };
      brace(8, 60, 50, 118); brace(120, 60, 78, 118);
      const post = (x, w) => { ctx.fillStyle = 'rgba(60,40,20,0.3)'; ctx.fillRect(x - 2, 0, w + 4, TS); wood(ctx, x, 0, w, TS, T, { vert: true, grain: 6, knots: 1 }); };
      post(-6, 12); post(TS - 6, 12); post(58, 12);
      // pegs
      for (const [x, y] of [[0, 20], [64, 20], [0, 100], [64, 100]]) { ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(60,40,20,0.3)'; ctx.fillRect(0, 0, TS, 12);
      wood(ctx, 0, 0, TS, 10, '#33210f', { grain: 5 });
      ctx.fillStyle = 'rgba(60,40,20,0.3)'; ctx.fillRect(0, 114, TS, 2);
      wood(ctx, 0, 116, TS, 12, '#33210f', { grain: 5 });
      wallLight(ctx);
      grain(ctx, 8);
    });

    tex('wall_stone', (ctx) => {
      ctx.fillStyle = '#231e1a'; ctx.fillRect(0, 0, TS, TS);
      let y = 0;
      while (y < TS) {
        const h = rr(13, 20);
        let x = rr(-20, 0);
        while (x < TS + rr(-20, 0) && x < TS) {
          const w = rr(16, 30), sx = x, sw = Math.min(w, TS - x - 0) - 2, f = rr(0.7, 1.15), tone = pick(['#625a50', '#5a5048', '#6a6258', '#585450', '#665a4c']);
          wrapX((d) => {
            ctx.fillStyle = sh(tone, f);
            ctx.beginPath(); ctx.roundRect(sx + d + 1, y + 1, sw, h - 2, 4); ctx.fill();
            ctx.fillStyle = 'rgba(255,240,220,0.12)'; ctx.beginPath(); ctx.roundRect(sx + d + 2, y + 1.5, sw - 3, 3, 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(sx + d + 2, y + h - 5, sw - 2, 3, 2); ctx.fill();
          });
          for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; const px = sx + rr(2, sw - 2), py = y + rr(3, h - 4); wrapX((d) => ctx.fillRect(px + d, py, rr(1, 3), 1)); }
          x += w;
        }
        y += h;
      }
      // soot from the top and damp at the base
      ctx.fillStyle = lin(ctx, 0, 0, 0, 70, [[0, 'rgba(10,6,4,0.75)'], [1, 'rgba(10,6,4,0)']]); ctx.fillRect(0, 0, TS, 70);
      for (let i = 0; i < 6; i++) { const x = R() * TS; wrapX((d) => { ctx.fillStyle = lin(ctx, 0, 0, 0, 60, [[0, 'rgba(8,5,3,0.45)'], [1, 'rgba(8,5,3,0)']]); ctx.fillRect(x + d - 6, 0, 12, rr(30, 60)); }); }
      ctx.fillStyle = lin(ctx, 0, 100, 0, 128, [[0, 'rgba(40,50,40,0)'], [1, 'rgba(30,40,30,0.4)']]); ctx.fillRect(0, 100, TS, 28);
      grain(ctx, 16);
    });

    tex('wall_mill', (ctx) => {
      let x = 0;
      const ws = []; while (x < TS) { const w = Math.min(TS - x, ri(3) === 0 ? 12 : 16 + ri(2) * 4); ws.push([x, w]); x += w; }
      for (const [bx, bw] of ws) {
        wood(ctx, bx, 0, bw, TS, sh('#6e5c44', rr(0.78, 1.1)), { vert: true, grain: 9, knots: R() < 0.5 ? 1 : 0 });
        ctx.fillStyle = 'rgba(10,6,2,0.75)'; ctx.fillRect(bx + bw - 1, 0, 1, TS);
        for (const ny of [6, 120]) { ctx.fillStyle = '#2a2420'; ctx.fillRect(bx + 3, ny, 1.6, 1.6); ctx.fillRect(bx + bw - 5, ny, 1.6, 1.6); }
      }
      // heavy beam
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 46, TS, 5);
      wood(ctx, 0, 32, TS, 14, '#4a3624', { grain: 10, knots: 2 });
      // flour: on the beam, drifting down the boards, piled at the base
      ctx.fillStyle = 'rgba(240,236,226,0.85)'; ctx.fillRect(0, 31, TS, 2);
      for (let i = 0; i < 70; i++) { const fx = R() * TS; ctx.fillStyle = 'rgba(240,236,226,' + rr(0.1, 0.5) + ')'; ctx.fillRect(fx, 30 + rr(-1, 1), rr(2, 8), 1.5); }
      for (let i = 0; i < 900; i++) { const fy = 128 - Math.pow(R(), 2.2) * 128, fx = R() * TS; ctx.fillStyle = 'rgba(238,232,220,' + rr(0.08, 0.45) * (fy / 128) + ')'; ctx.fillRect(fx, fy, 1, 1); }
      ctx.fillStyle = lin(ctx, 0, 96, 0, 128, [[0, 'rgba(236,230,218,0)'], [1, 'rgba(236,230,218,0.6)']]); ctx.fillRect(0, 96, TS, 32);
      ctx.fillStyle = 'rgba(236,230,218,0.25)'; ctx.fillRect(0, 0, TS, 128);
      ctx.fillStyle = lin(ctx, 0, 0, 0, 30, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, TS, 30);
      grain(ctx, 12);
    });

    tex('wall_attic', (ctx) => {
      // sloped roof underside above, knee wall below
      for (let y = 0; y < 52; y += 8) wood(ctx, 0, y, TS, 8, sh('#4a3828', rr(0.75, 1.05)), { grain: 3 });
      ctx.fillStyle = lin(ctx, 0, 0, 0, 52, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0.1)']]); ctx.fillRect(0, 0, TS, 52);
      // rafters, narrowing as they recede upward
      for (const rx of [22, 86]) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.moveTo(rx - 7, 52); ctx.lineTo(rx + 13, 52); ctx.lineTo(rx + 8, 0); ctx.lineTo(rx - 2, 0); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.moveTo(rx - 9, 52); ctx.lineTo(rx + 9, 52); ctx.lineTo(rx + 4, 0); ctx.lineTo(rx - 4, 0); ctx.closePath(); ctx.clip();
        wood(ctx, rx - 9, 0, 18, 52, '#5a4230', { vert: true, grain: 6, bevel: false }); ctx.restore();
        ctx.fillStyle = 'rgba(255,230,190,0.15)'; ctx.beginPath(); ctx.moveTo(rx - 9, 52); ctx.lineTo(rx - 6, 52); ctx.lineTo(rx - 3, 0); ctx.lineTo(rx - 4, 0); ctx.fill();
      }
      // cobwebs between rafter and roof
      ctx.strokeStyle = 'rgba(220,220,220,0.3)'; ctx.lineWidth = 0.5;
      for (const cx of [31, 95]) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - 1, 4 + k * 4); ctx.quadraticCurveTo(cx + 6, 8 + k * 3, cx + 14 - k * 2, 2); ctx.stroke(); }
      // wall plate
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 60, TS, 4);
      wood(ctx, 0, 50, TS, 10, '#4e3a28', { grain: 6, knots: 1 });
      // bare vertical boards
      for (let x = 0; x < TS; x += 16) {
        wood(ctx, x, 60, 16, 68, sh('#7a6450', rr(0.75, 1.05)), { vert: true, grain: 7, knots: R() < 0.4 ? 1 : 0 });
        ctx.fillStyle = 'rgba(10,6,2,0.7)'; ctx.fillRect(x + 15, 60, 1, 68);
        ctx.fillStyle = '#2a2420'; ctx.fillRect(x + 7, 66, 1.6, 1.6); ctx.fillRect(x + 7, 122, 1.6, 1.6);
      }
      ctx.fillStyle = 'rgba(140,130,120,0.18)'; ctx.fillRect(0, 60, TS, 68);
      ctx.fillStyle = lin(ctx, 0, 108, 0, 128, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(0, 108, TS, 20);
      grain(ctx, 12);
    });

    tex('wall_books', (ctx) => {
      ctx.fillStyle = '#1a100a'; ctx.fillRect(0, 0, TS, TS);
      const shelves = [8, 34, 60, 86, 112];
      for (let i = 0; i < shelves.length - 1; i++) {
        const y0 = shelves[i] + 4, y1 = shelves[i + 1];
        ctx.fillStyle = lin(ctx, 0, y0, 0, y1, [[0, '#120a06'], [1, '#2a1a10']]); ctx.fillRect(0, y0, TS, y1 - y0);
        shelfBooks(ctx, 4, 62, y1, y1 - y0 - 3, { objects: true });
        shelfBooks(ctx, 66, 124, y1, y1 - y0 - 3, { objects: true });
        ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + 8, [[0, 'rgba(0,0,0,0.7)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, y0, TS, 8);
      }
      for (const y of shelves) { wood(ctx, 0, y, TS, 4, '#5a3820', { grain: 2 }); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, y + 4, TS, 1); }
      wood(ctx, 0, 0, TS, 8, '#3e2616', { grain: 3 }); ctx.fillStyle = sh('#3e2616', 1.4); ctx.fillRect(0, 5, TS, 1);
      for (const [x, w] of [[-3, 7], [TS - 4, 7], [62, 4]]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + w, 0, 2, TS); wood(ctx, x, 0, w, TS, '#4a2e1a', { vert: true, grain: 3 }); }
      wood(ctx, 0, 116, TS, 12, '#3a2414', { grain: 4 });
      ctx.fillStyle = sh('#3a2414', 1.4); ctx.fillRect(0, 117, TS, 1);
      grain(ctx, 8);
    });

    tex('wall_child', (ctx) => {
      ctx.fillStyle = lin(ctx, 0, 0, 0, 86, [[0, '#f0dc94'], [1, '#e6cc7c']]); ctx.fillRect(0, 0, TS, 86);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const x = c * 32 + (r % 2 ? 16 : 0) + 8, y = 22 + r * 22;
        wrapX((d) => ((r + c) % 2 ? flake(ctx, x + d, y, 5, 'rgba(110,160,210,0.85)', 1.2) : kidSun(ctx, x + d, y, 3.2, '#f0a030', '#e89028')));
      }
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(c * 32 + (r % 2 ? 0 : 16) + 8, 33 + r * 22, 1, 0, TAU); ctx.fill(); }
      // painted frieze
      ctx.fillStyle = '#f6eed8'; ctx.fillRect(0, 0, TS, 8); ctx.fillStyle = '#9ac0e0'; ctx.fillRect(0, 8, TS, 2);
      for (let x = 0; x < TS; x += 16) { ctx.fillStyle = '#e8a050'; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 8, 15); ctx.lineTo(x + 16, 10); ctx.fill(); }
      // cream tongue-and-groove wainscot
      ctx.fillStyle = 'rgba(80,60,20,0.3)'; ctx.fillRect(0, 86, TS, 2);
      for (let x = 0; x < TS; x += 8) { ctx.fillStyle = lin(ctx, x, 0, x + 8, 0, [[0, '#f4ecd6'], [1, '#d8ccb0']]); ctx.fillRect(x, 88, 8, 32); ctx.fillStyle = 'rgba(120,100,70,0.5)'; ctx.fillRect(x + 7, 88, 1, 32); }
      ctx.fillStyle = lin(ctx, 0, 84, 0, 90, [[0, '#fff8e6'], [1, '#b8a888']]); ctx.fillRect(0, 84, TS, 5);
      ctx.fillStyle = lin(ctx, 0, 120, 0, 128, [[0, '#a0c0d8'], [1, '#6a88a0']]); ctx.fillRect(0, 120, TS, 8);
      // height chart: a painted wooden ruler with pencil marks
      const hx = 100;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(hx + 1, 22, 12, 98);
      wood(ctx, hx, 20, 11, 98, '#c89a5a', { vert: true, grain: 4 });
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(hx + 1, 20, 9, 98);
      for (let y = 24, k = 0; y < 118; y += 4, k++) { ctx.fillStyle = '#5a4430'; ctx.fillRect(hx + 1, y, k % 5 === 0 ? 5 : 3, 0.8); }
      ctx.fillStyle = '#c84a3a'; ctx.fillRect(hx + 1, 20, 9, 3); ctx.fillStyle = '#4a7ab0'; ctx.fillRect(hx + 1, 115, 9, 3);
      ctx.strokeStyle = 'rgba(50,50,60,0.9)'; ctx.lineWidth = 1;
      for (const my of [98, 90, 83, 77, 72, 68]) {
        ctx.beginPath(); ctx.moveTo(hx - 9, my + rr(-0.4, 0.4)); ctx.lineTo(hx + 4, my); ctx.stroke();
        ctx.fillStyle = 'rgba(50,50,60,0.85)'; ctx.fillRect(hx - 14, my - 3, 1, 3); ctx.fillRect(hx - 14, my - 0.8, 2.5, 0.8); // a little "L"
      }
      ctx.strokeStyle = 'rgba(200,60,60,0.9)'; ctx.beginPath(); ctx.moveTo(hx - 10, 64); ctx.lineTo(hx + 4, 64); ctx.stroke();
      wallLight(ctx);
      grain(ctx, 6);
    });

    tex('wall_clocks', (ctx) => {
      // walnut panelling
      for (let x = 0; x < TS; x += 32) {
        wood(ctx, x, 0, 32, TS, '#4a2c18', { vert: true, grain: 10 });
        panel(ctx, x + 4, 12, 24, 56, '#5a3620');
        panel(ctx, x + 4, 74, 24, 18, '#5a3620');
      }
      cornice(ctx, '#2e1a0e', 7);
      // shelf of clock parts
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 104, TS, 4);
      wood(ctx, 0, 100, TS, 5, '#6a4224', { grain: 2 });
      for (let x = 4; x < TS - 6; x += rr(7, 13)) {
        const t = ri(4);
        if (t === 0) gear(ctx, x + 4, 94, rr(4, 6), 10, '#c09440', { spokes: 0 });
        else if (t === 1) { ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let a = 0; a < 18; a += 0.3) ctx.lineTo(x + 4 + Math.cos(a) * a * 0.25, 95 + Math.sin(a) * a * 0.25); ctx.stroke(); }
        else if (t === 2) { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x, 90, 8, 10); ctx.fillStyle = '#d8c8a0'; ctx.beginPath(); ctx.arc(x + 4, 94, 2.6, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = 'rgba(180,200,210,0.6)'; ctx.fillRect(x, 92, 6, 8); ctx.fillStyle = '#c09440'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 1 + R() * 4, 95 + R() * 4, 1, 1); }
      }
      // many stopped clocks
      clockFace(ctx, 22, 34, 13, { rim: '#9a6a30', h: 3, m: 40 });
      clockFace(ctx, 60, 22, 8, { rim: '#c0a050', h: 7, m: 5 });
      clockFace(ctx, 96, 40, 15, { rim: '#6a4020', face: '#e8dcc0', h: 11, m: 55 });
      clockFace(ctx, 56, 56, 10, { rim: '#b08a3a', h: 6, m: 30 });
      clockFace(ctx, 22, 70, 7, { rim: '#808890', face: '#f0f0ea', h: 2, m: 15 });
      clockFace(ctx, 116, 74, 6, { rim: '#c0a050', h: 9, m: 0 });
      // a square bracket clock
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(78, 66, 22, 26);
      wood(ctx, 76, 64, 22, 26, '#3a2010', { grain: 6 });
      clockFace(ctx, 87, 74, 7, { rim: '#c8a050', h: 12, m: 0 });
      ctx.fillStyle = '#c8a050'; ctx.fillRect(84, 84, 6, 4);
      clockFace(ctx, 40, 82, 5, { rim: '#a07a3a', h: 4, m: 20 });
      grain(ctx, 7);
    });
    // ================= WALL DECALS (transparent) =================
    tex('dc_door', (ctx) => {
      // architrave
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(22, 12, 86, 116);
      wood(ctx, 23, 11, 82, 8, '#4a2e1a', { grain: 4 });
      wood(ctx, 23, 15, 7, 113, '#4a2e1a', { vert: true, grain: 4 });
      wood(ctx, 98, 15, 7, 113, '#4a2e1a', { vert: true, grain: 4 });
      ctx.fillStyle = sh('#4a2e1a', 1.5); ctx.fillRect(23, 11, 82, 1);
      // door leaf: a wide top panel over two tall panels (no rail crosses a stile)
      wood(ctx, 30, 19, 68, 109, '#6a4226', { vert: true, grain: 14 });
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(30, 19, 68, 3);
      panel(ctx, 37, 26, 54, 22, '#7a4c2c');
      panel(ctx, 37, 55, 23, 64, '#7a4c2c');
      panel(ctx, 68, 55, 23, 64, '#7a4c2c');
      // brass knob, rose and keyhole
      ctx.fillStyle = rad(ctx, 85, 85, 0, 6, [[0, '#7a5a20'], [1, 'rgba(60,40,10,0)']]); ctx.fillRect(78, 78, 14, 14);
      ctx.fillStyle = '#8a6a28'; ctx.beginPath(); ctx.arc(87, 86, 4.2, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 86, 85, 0, 3.6, [[0, '#fff2b0'], [0.4, '#e0b040'], [1, '#7a5418']]); ctx.beginPath(); ctx.arc(87, 86, 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.arc(87, 94, 1.1, 0, TAU); ctx.fill(); ctx.fillRect(86.5, 94, 1, 2.4);
      // hinges
      ctx.fillStyle = '#3a3028'; ctx.fillRect(30, 30, 4, 8); ctx.fillRect(30, 104, 4, 8);
      // light under the door
      ctx.fillStyle = 'rgba(255,200,120,0.45)'; ctx.fillRect(31, 126, 66, 2);
    });

    tex('dc_door_cellar', (ctx) => {
      const x0 = 30, x1 = 98, top = 24;
      // stone surround
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.moveTo(x0 - 8, 128); ctx.lineTo(x0 - 8, top + 16); ctx.quadraticCurveTo(64, top - 22, x1 + 8, top + 16); ctx.lineTo(x1 + 8, 128); ctx.fill();
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + i / 8 * Math.PI;
        const cx = 64 + Math.cos(a) * 38, cy = top + 22 + Math.sin(a) * 30;
        ctx.fillStyle = sh('#6a6670', rr(0.8, 1.1)); ctx.beginPath(); ctx.roundRect(cx - 6, cy - 5, 12, 10, 2); ctx.fill();
      }
      for (let y = top + 22; y < 128; y += 12) for (const x of [x0 - 8, x1 + 1]) { ctx.fillStyle = sh('#6a6670', rr(0.75, 1.1)); ctx.beginPath(); ctx.roundRect(x, y, 7, 11, 2); ctx.fill(); }
      // heavy planks, clipped to the arch
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x0, 128); ctx.lineTo(x0, top + 20); ctx.quadraticCurveTo(64, top - 12, x1, top + 20); ctx.lineTo(x1, 128); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#05080c'; ctx.fillRect(x0, 0, x1 - x0, 128);
      for (let x = x0; x < x1; x += 13.6) {
        wood(ctx, x, 0, 12.6, 128, sh('#4a3826', rr(0.8, 1.1)), { vert: true, grain: 8, knots: R() < 0.5 ? 1 : 0 });
        // cold blue light through the cracks
        ctx.fillStyle = 'rgba(150,215,255,0.85)'; ctx.fillRect(x + 12.6, 20, 1, 108);
      }
      // iron straps
      for (const y of [44, 98]) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x0, y + 7, x1 - x0, 2);
        ctx.fillStyle = lin(ctx, 0, y, 0, y + 7, [[0, '#6a6e78'], [0.5, '#3a3c44'], [1, '#22242a']]); ctx.fillRect(x0, y, x1 - x0, 7);
        for (let x = x0 + 4; x < x1; x += 10) { ctx.fillStyle = '#8a8e98'; ctx.beginPath(); ctx.arc(x, y + 3.5, 1.3, 0, TAU); ctx.fill(); }
      }
      // frost creeping up from the bottom
      ctx.fillStyle = lin(ctx, 0, 90, 0, 128, [[0, 'rgba(210,235,255,0)'], [1, 'rgba(215,238,255,0.75)']]); ctx.fillRect(x0, 90, x1 - x0, 38);
      for (let i = 0; i < 40; i++) flake(ctx, rr(x0, x1), rr(104, 126), rr(1, 2.5), 'rgba(235,248,255,0.7)', 0.5);
      ctx.restore();
      // ring pull
      ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(86, 80, 6, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#7a7e88'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(86, 80, 6, 3.6, 5.2); ctx.stroke();
      // frost seeping out underneath, and the blue glow
      glow(ctx, 64, 128, 50, '120,200,255', 0.55);
      ctx.fillStyle = 'rgba(200,240,255,0.95)'; ctx.fillRect(x0 + 2, 125, x1 - x0 - 4, 3);
      for (let i = 0; i < 14; i++) { const fx = rr(x0 - 14, x1 + 14); ctx.fillStyle = 'rgba(225,245,255,' + rr(0.4, 0.8) + ')'; ctx.beginPath(); ctx.ellipse(fx, 127, rr(3, 9), rr(1, 3), 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(220,245,255,0.6)'; ctx.lineWidth = 0.7;
      for (let i = 0; i < 8; i++) { let x = rr(x0 - 10, x1 + 10), y = 127; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rr(-4, 4); y -= rr(2, 5); ctx.lineTo(x, y); } ctx.stroke(); }
    });

    tex('dc_window', (ctx) => {
      const x0 = 38, x1 = 90, y0 = 22, y1 = 86;
      // deep reveal
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
      // night street: sky, falling snow, the houses across the way
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, y0, 0, y1, [[0, '#0c1630'], [0.6, '#22385e'], [1, '#4a5e80']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = '#e8eef8'; ctx.beginPath(); ctx.arc(80, 32, 4, 0, TAU); ctx.fill(); glow(ctx, 80, 32, 12, '200,220,255', 0.4);
      const house = (hx, hw, hy) => {
        ctx.fillStyle = '#141a2a'; ctx.fillRect(hx, hy, hw, y1 - hy);
        ctx.beginPath(); ctx.moveTo(hx - 2, hy); ctx.lineTo(hx + hw / 2, hy - hw * 0.45); ctx.lineTo(hx + hw + 2, hy); ctx.fill();
        ctx.fillStyle = '#e8f0fa'; ctx.beginPath(); ctx.moveTo(hx - 2, hy); ctx.lineTo(hx + hw / 2, hy - hw * 0.45); ctx.lineTo(hx + hw + 2, hy); ctx.lineTo(hx + hw / 2, hy - hw * 0.45 + 3); ctx.fill();
        for (let wy = hy + 5; wy < y1 - 10; wy += 11) for (let wx = hx + 3; wx < hx + hw - 5; wx += 9) if (R() < 0.6) {
          glow(ctx, wx + 2, wy + 3, 7, '255,180,80', 0.35); ctx.fillStyle = '#ffc870'; ctx.fillRect(wx, wy, 4, 5);
        }
      };
      house(34, 22, 54); house(58, 18, 60); house(78, 20, 50);
      ctx.fillStyle = lin(ctx, 0, 74, 0, 86, [[0, '#9aaccc'], [1, '#e0e8f4']]); ctx.fillRect(x0, 76, x1 - x0, 10);
      glow(ctx, 50, 70, 9, '255,190,100', 0.5); ctx.fillStyle = '#2a2a30'; ctx.fillRect(49.5, 66, 1, 14); ctx.fillStyle = '#ffd890'; ctx.fillRect(48, 64, 4, 4);
      for (let i = 0; i < 45; i++) { ctx.fillStyle = 'rgba(255,255,255,' + rr(0.5, 1) + ')'; ctx.fillRect(rr(x0, x1), rr(y0, y1), rr(0.8, 1.6), rr(0.8, 1.6)); }
      // frost in the pane corners
      for (const [cx, cy] of [[x0, y1], [x1, y1], [x0, y0], [x1, y0]]) glow(ctx, cx, cy, 14, '225,240,255', 0.55);
      ctx.restore();
      // three lights: two mullions, staggered glazing bars (no crossing joints)
      ctx.fillStyle = '#3a2416';
      ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, 3); ctx.fillRect(x0 - 2, y1 - 1, x1 - x0 + 4, 3); ctx.fillRect(x0 - 2, y0, 3, y1 - y0); ctx.fillRect(x1 - 1, y0, 3, y1 - y0);
      const m1 = x0 + (x1 - x0) / 3, m2 = x0 + 2 * (x1 - x0) / 3;
      ctx.fillRect(m1 - 1.5, y0, 3, y1 - y0); ctx.fillRect(m2 - 1.5, y0, 3, y1 - y0);
      ctx.fillStyle = 'rgba(40,28,18,0.9)';
      for (const [a, b, ys] of [[x0, m1, [38, 58]], [m1, m2, [46, 68]], [m2, x1, [38, 58]]]) for (const y of ys) ctx.fillRect(a, y, b - a, 1.2);
      ctx.fillStyle = 'rgba(255,230,190,0.25)'; ctx.fillRect(m1 - 1.5, y0, 1, y1 - y0); ctx.fillRect(m2 - 1.5, y0, 1, y1 - y0);
      // sill
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(32, 92, 64, 3);
      wood(ctx, 30, 86, 68, 6, '#6a4428', { grain: 3 });
      candle(ctx, 76, 86, 10, 4, true);
      ctx.fillStyle = '#a07a3a'; ctx.beginPath(); ctx.ellipse(76, 86, 4.5, 1.4, 0, 0, TAU); ctx.fill();
      // curtains, swagged and tied
      const curtain = (x, dir) => {
        const col = '#7a2030';
        ctx.fillStyle = lin(ctx, x, 0, x + 16 * dir, 0, [[0, sh(col, 1.2)], [0.3, sh(col, 0.7)], [0.6, sh(col, 1.1)], [1, sh(col, 0.6)]]);
        ctx.beginPath(); ctx.moveTo(x - 3 * dir, 14); ctx.lineTo(x + 16 * dir, 14);
        ctx.quadraticCurveTo(x + 8 * dir, 46, x + 6 * dir, 58);
        ctx.quadraticCurveTo(x + 10 * dir, 80, x + 12 * dir, 100);
        ctx.lineTo(x - 3 * dir, 100); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
        for (const k of [3, 7]) { ctx.beginPath(); ctx.moveTo(x + k * dir, 16); ctx.quadraticCurveTo(x + (k - 2) * dir, 50, x + 3 * dir, 58); ctx.stroke(); }
        ctx.fillStyle = '#d0a040'; ctx.fillRect(Math.min(x, x + 9 * dir) - 1, 56, 10, 3);
      };
      curtain(30, 1); curtain(98, -1);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(24, 13, 80, 2);
      ctx.fillStyle = lin(ctx, 0, 10, 0, 14, [[0, '#d8b060'], [1, '#6a4a18']]); ctx.fillRect(24, 10, 80, 3);
      ctx.fillStyle = '#d8b060'; ctx.beginPath(); ctx.arc(24, 11.5, 2.5, 0, TAU); ctx.arc(104, 11.5, 2.5, 0, TAU); ctx.fill();
    });

    function hearth(ctx, lit) {
      // stone surround
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(20, 46, 92, 82);
      ctx.fillStyle = '#4a4440'; ctx.fillRect(18, 44, 92, 84);
      let y = 48;
      for (let row = 0; y < 128; row++) {
        const h = 9 + ri(3);
        let x = 18 + (row % 2 ? -6 : 0);
        while (x < 110) {
          const w = rr(12, 20), sx = Math.max(18, x), ex = Math.min(110, x + w);
          ctx.fillStyle = sh(lit ? '#8a7e72' : '#7a7a80', rr(0.8, 1.12));
          ctx.beginPath(); ctx.roundRect(sx + 0.8, y + 0.8, ex - sx - 1.6, h - 1.6, 2.5); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,220,0.12)'; ctx.fillRect(sx + 1.5, y + 1, ex - sx - 3, 1.5);
          x += w;
        }
        y += h;
      }
      // firebox opening with an arched top
      const ox0 = 36, ox1 = 92, oy = 74;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(ox0, 128); ctx.lineTo(ox0, oy + 8); ctx.quadraticCurveTo(64, oy - 8, ox1, oy + 8); ctx.lineTo(ox1, 128); ctx.closePath();
      ctx.fillStyle = '#0c0806'; ctx.fill(); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, oy, 0, 128, [[0, '#050302'], [1, lit ? '#3a1a0a' : '#1a1a1c']]); ctx.fillRect(ox0, oy - 10, ox1 - ox0, 60);
      for (let yy = oy, k = 0; yy < 128; yy += 6, k++) for (let xx = ox0 - (k % 2 ? 0 : 5); xx < ox1; xx += 10) { ctx.fillStyle = 'rgba(80,60,50,0.25)'; ctx.fillRect(xx, yy, 9, 5); }
      if (lit) {
        glow(ctx, 64, 118, 40, '255,140,40', 0.8);
        // logs
        ctx.fillStyle = '#3a2214'; ctx.save(); ctx.translate(64, 120); ctx.rotate(-0.12); ctx.fillRect(-22, -4, 44, 7); ctx.restore();
        ctx.save(); ctx.translate(64, 123); ctx.rotate(0.15); ctx.fillStyle = '#4a2c18'; ctx.fillRect(-20, -3, 40, 6); ctx.restore();
        ctx.fillStyle = '#ff7a20'; ctx.fillRect(46, 124, 36, 2);
        // flames
        fire(ctx, 64, 121, 34, 36);
        for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(255,' + ri(160) + 60 + ',40,' + rr(0.5, 1) + ')'; ctx.fillRect(rr(48, 82), rr(84, 118), 1, 1); }
      } else {
        ctx.fillStyle = '#5a5654'; ctx.beginPath(); ctx.ellipse(64, 126, 24, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a8684'; for (let i = 0; i < 60; i++) ctx.fillRect(rr(42, 86), rr(122, 127), 1.5, 1);
        ctx.fillStyle = '#1a1614'; ctx.save(); ctx.translate(64, 121); ctx.rotate(-0.1); ctx.fillRect(-16, -3, 32, 5); ctx.restore();
        ctx.fillStyle = 'rgba(120,120,125,0.8)'; ctx.fillRect(50, 117, 26, 1.5);
      }
      ctx.restore();
      if (lit) { glow(ctx, 64, 110, 64, '255,150,60', 0.35); }
      // mantel
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(12, 46, 104, 4);
      wood(ctx, 12, 39, 104, 7, '#4a2c18', { grain: 4 });
      ctx.fillStyle = sh('#4a2c18', 1.5); ctx.fillRect(12, 39, 104, 1);
      // mantel things
      if (lit) {
        // small brass clock, candlesticks, a jar
        ctx.fillStyle = '#5a3a20'; ctx.beginPath(); ctx.moveTo(56, 39); ctx.lineTo(56, 27); ctx.quadraticCurveTo(64, 20, 72, 27); ctx.lineTo(72, 39); ctx.fill();
        clockFace(ctx, 64, 30, 5.5, { rim: '#c8a050', h: 8, m: 50 });
        for (const cx of [24, 104]) { ctx.fillStyle = '#c8a050'; ctx.fillRect(cx - 1, 32, 2, 7); ctx.fillRect(cx - 3, 37, 6, 2); candle(ctx, cx, 32, 8, 3.5, true); }
        ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.ellipse(40, 34, 4, 5, 0, 0, TAU); ctx.fill(); ctx.fillRect(38, 27, 4, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(38, 31, 1, 5);
        ctx.fillStyle = '#7a3a2a'; ctx.fillRect(84, 33, 10, 6); ctx.fillStyle = '#d8c090'; ctx.fillRect(84, 31, 10, 2);
      } else {
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(30, 34, 3, 5); candle(ctx, 31.5, 34, 7, 3, false, '#e8e8ea');
        ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.ellipse(60, 35, 5, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6a6a70'; ctx.fillRect(84, 30, 8, 9);
        // frost on the stones and icicles from the mantel
        for (let i = 0; i < 140; i++) { ctx.fillStyle = 'rgba(225,240,255,' + rr(0.2, 0.7) + ')'; const fx = rr(18, 110), fy = rr(46, 128); if (fx > 36 && fx < 92 && fy > 72) continue; ctx.fillRect(fx, fy, rr(1, 3), 1); }
        ctx.fillStyle = 'rgba(230,245,255,0.9)'; ctx.fillRect(12, 38, 104, 1.5);
        for (let x = 14; x < 114; x += rr(4, 8)) { const l = rr(3, 10); ctx.fillStyle = 'rgba(220,240,255,0.85)'; ctx.beginPath(); ctx.moveTo(x, 46); ctx.lineTo(x + 2.4, 46); ctx.lineTo(x + 1.2, 46 + l); ctx.fill(); }
        for (const [cx, cy] of [[22, 52], [104, 60], [28, 110], [100, 112], [64, 52]]) flake(ctx, cx, cy, rr(3, 5), 'rgba(235,248,255,0.85)', 0.8);
      }
    }
    tex('dc_fireplace', (ctx) => hearth(ctx, true));
    tex('dc_fireplace_cold', (ctx) => hearth(ctx, false));

    tex('dc_painting', (ctx) => {
      const r = frame(ctx, 24, 22, 80, 58, 6, '#b8892e');
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + r.h, [[0, '#f0c890'], [0.45, '#e8a870'], [0.7, '#c08a60'], [1, '#6a7a40']]); ctx.fillRect(r.x, r.y, r.w, r.h);
      glow(ctx, 80, 44, 18, '255,230,160', 0.8);
      ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.moveTo(r.x, 56); ctx.lineTo(44, 36); ctx.lineTo(56, 48); ctx.lineTo(70, 32); ctx.lineTo(90, 52); ctx.lineTo(r.x + r.w, 50); ctx.lineTo(r.x + r.w, 70); ctx.lineTo(r.x, 70); ctx.fill();
      ctx.fillStyle = '#f0f0f4'; ctx.beginPath(); ctx.moveTo(41, 39); ctx.lineTo(44, 36); ctx.lineTo(48, 40); ctx.fill(); ctx.beginPath(); ctx.moveTo(66, 36); ctx.lineTo(70, 32); ctx.lineTo(75, 37); ctx.fill();
      ctx.fillStyle = '#5a6a3a'; ctx.beginPath(); ctx.moveTo(r.x, 58); ctx.quadraticCurveTo(50, 50, 70, 58); ctx.quadraticCurveTo(86, 62, r.x + r.w, 56); ctx.lineTo(r.x + r.w, 80); ctx.lineTo(r.x, 80); ctx.fill();
      ctx.fillStyle = '#7aa0b8'; ctx.beginPath(); ctx.ellipse(64, 64, 22, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.fillRect(56, 63, 16, 1);
      ctx.fillStyle = '#3a4a24'; ctx.beginPath(); ctx.moveTo(r.x, 74); ctx.quadraticCurveTo(64, 66, r.x + r.w, 72); ctx.lineTo(r.x + r.w, 80); ctx.lineTo(r.x, 80); ctx.fill();
      for (const tx of [36, 40, 92]) { ctx.fillStyle = '#2a3a1c'; ctx.beginPath(); ctx.moveTo(tx, 52); ctx.lineTo(tx + 4, 66); ctx.lineTo(tx - 4, 66); ctx.fill(); }
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(58, 70, 5, 3); ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(57, 70); ctx.lineTo(60.5, 67.5); ctx.lineTo(64, 70); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(r.x, r.y, r.w, r.h / 2);
      ctx.restore();
      ctx.fillStyle = '#d8b060'; ctx.fillRect(58, 81, 12, 3);
    });

    // a bust inside a frame; o: {skin, hair, dress, ...}
    // long hair parted in the middle, swept down past the temples
    function hairParted(ctx, x, y, s, low) {
      ctx.beginPath(); ctx.moveTo(x - 7 * s, y + low * s);
      ctx.bezierCurveTo(x - 7.8 * s, y - 10.5 * s, x + 7.8 * s, y - 10.5 * s, x + 7 * s, y + low * s);
      ctx.lineTo(x + 5.6 * s, y + low * s);
      ctx.quadraticCurveTo(x + 5.4 * s, y - 4.6 * s, x, y - 5.6 * s);
      ctx.quadraticCurveTo(x - 5.4 * s, y - 4.6 * s, x - 5.6 * s, y + low * s); ctx.closePath(); ctx.fill();
    }
    // short hair with a side parting
    function hairShort(ctx, x, y, s) {
      ctx.beginPath(); ctx.moveTo(x - 6.8 * s, y - 0.5 * s);
      ctx.bezierCurveTo(x - 7.6 * s, y - 11 * s, x + 7.6 * s, y - 11 * s, x + 6.8 * s, y - 0.5 * s);
      ctx.lineTo(x + 6 * s, y - 1 * s);
      ctx.quadraticCurveTo(x + 5 * s, y - 5.8 * s, x - 2 * s, y - 5.4 * s);
      ctx.quadraticCurveTo(x - 5.6 * s, y - 5 * s, x - 6 * s, y - 1 * s); ctx.closePath(); ctx.fill();
    }
    function bust(ctx, x, y, s, o) {
      if (o.hairBack) { ctx.fillStyle = o.hair; o.hairBack(x, y, s); }
      // shoulders / dress
      ctx.fillStyle = lin(ctx, x - 14 * s, 0, x + 14 * s, 0, [[0, sh(o.dress, 0.6)], [0.4, sh(o.dress, 1.2)], [1, sh(o.dress, 0.55)]]);
      const bw = o.broad || 1;
      ctx.beginPath(); ctx.moveTo(x - 16 * s * bw, y + 30 * s); ctx.quadraticCurveTo(x - 15 * s * bw, y + 13 * s, x - 5 * s, y + 11 * s); ctx.lineTo(x + 5 * s, y + 11 * s); ctx.quadraticCurveTo(x + 15 * s * bw, y + 13 * s, x + 16 * s * bw, y + 30 * s); ctx.fill();
      if (o.collar) { ctx.fillStyle = o.collar; ctx.beginPath(); ctx.moveTo(x - 5 * s, y + 10 * s); ctx.lineTo(x, y + 16 * s); ctx.lineTo(x + 5 * s, y + 10 * s); ctx.lineTo(x + 6 * s, y + 13 * s); ctx.lineTo(x, y + 19 * s); ctx.lineTo(x - 6 * s, y + 13 * s); ctx.fill(); }
      // neck
      ctx.fillStyle = sh(o.skin, 0.85); ctx.fillRect(x - 2.6 * s, y + 5 * s, 5.2 * s, 7 * s);
      // face
      ctx.fillStyle = rad(ctx, x - 2 * s, y - 2 * s, 0, 10 * s, [[0, sh(o.skin, 1.1)], [1, sh(o.skin, 0.82)]]);
      const cw = o.chin || 3.2;
      ctx.beginPath(); ctx.moveTo(x, y - 7.8 * s);
      ctx.bezierCurveTo(x + 6.6 * s, y - 7.8 * s, x + 6.4 * s, y + 2 * s, x + cw * s, y + 6 * s);
      ctx.quadraticCurveTo(x, y + 8.6 * s, x - cw * s, y + 6 * s);
      ctx.bezierCurveTo(x - 6.4 * s, y + 2 * s, x - 6.6 * s, y - 7.8 * s, x, y - 7.8 * s); ctx.fill();
      // hair on top
      ctx.fillStyle = o.hair; o.hairTop(x, y, s);
      // features
      ctx.fillStyle = '#2a1e1a';
      const ey = y - 0.5 * s;
      if (o.laugh) {
        ctx.strokeStyle = '#2a1e1a'; ctx.lineWidth = Math.max(0.6, 0.7 * s);
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 2.4 * s, ey + 0.6 * s, 1.3 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
        ctx.fillStyle = '#6a2020'; ctx.beginPath(); ctx.arc(x, y + 3.2 * s, 2.2 * s, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#f8f0e8'; ctx.fillRect(x - 1.8 * s, y + 3.2 * s, 3.6 * s, 0.7 * s);
        ctx.fillStyle = 'rgba(220,110,110,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 3.6 * s, y + 2 * s, 1.4 * s, 0, TAU); ctx.fill(); }
      } else {
        for (const d of [-1, 1]) {
          ctx.fillStyle = '#f0eee8'; ctx.beginPath(); ctx.ellipse(x + d * 2.4 * s, ey, 1.3 * s, 0.7 * s, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = o.eye || '#4a5a6a'; ctx.beginPath(); ctx.arc(x + d * 2.4 * s, ey, 0.6 * s, 0, TAU); ctx.fill();
          ctx.strokeStyle = sh(o.hair, 0.7); ctx.lineWidth = Math.max(0.6, 0.6 * s);
          ctx.beginPath(); ctx.moveTo(x + d * 0.9 * s, ey - 1.6 * s); ctx.lineTo(x + d * 3.8 * s, ey - 2.4 * s); ctx.stroke(); // stern, straight brows
        }
        ctx.strokeStyle = o.lips || '#7a4a44'; ctx.lineWidth = Math.max(0.8, 0.8 * s);
        ctx.beginPath(); ctx.moveTo(x - 1.8 * s, y + 3.8 * s); ctx.quadraticCurveTo(x, y + 3.3 * s, x + 1.8 * s, y + 3.8 * s); ctx.stroke();
        ctx.strokeStyle = 'rgba(80,50,40,0.4)'; ctx.beginPath(); ctx.moveTo(x - 2.8 * s, y + 2.4 * s); ctx.lineTo(x - 2.2 * s, y + 4.4 * s); ctx.moveTo(x + 2.8 * s, y + 2.4 * s); ctx.lineTo(x + 2.2 * s, y + 4.4 * s); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(80,50,40,0.45)'; ctx.lineWidth = Math.max(0.5, 0.5 * s); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 0.6 * s, y + 2 * s); ctx.lineTo(x + 0.4 * s, y + 2 * s); ctx.stroke();
      if (o.extra) o.extra(x, y, s);
    }

    tex('dc_portrait_ysolde', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(66, 55, 30, 40, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 58, 40, 0, 50, [[0, '#e8eef4'], [0.5, '#9aa6b4'], [1, '#4a5260']]); ctx.beginPath(); ctx.ellipse(64, 52, 30, 40, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(64, 52, 25, 35, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = rad(ctx, 64, 40, 0, 40, [[0, '#3a4658'], [1, '#141a24']]); ctx.fillRect(30, 10, 70, 90);
      bust(ctx, 64, 42, 2.1, {
        skin: '#ead6c8', hair: '#7a7880', dress: '#a8b4c0', collar: '#e8eef4', eye: '#6a7a8a', lips: '#9a4a50', chin: 2.6,
        hairBack: (x, y, s) => { ctx.beginPath(); ctx.arc(x, y - 9.4 * s, 3.6 * s, 0, TAU); ctx.fill(); },
        hairTop: (x, y, s) => {
          hairParted(ctx, x, y, s, 2.5);
          ctx.strokeStyle = 'rgba(235,235,240,0.6)'; ctx.lineWidth = 0.7;
          for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 0.5 * s, y - 6.4 * s); ctx.quadraticCurveTo(x + d * 5.6 * s, y - 6.4 * s, x + d * 6.4 * s, y + 1.5 * s); ctx.stroke(); }
          ctx.fillStyle = 'rgba(60,40,50,0.25)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 2.4 * s, y - 1 * s, 1.8 * s, 0.9 * s, 0, 0, TAU); ctx.fill(); }
        },
        extra: (x, y, s) => {
          // Pale Hour snowflake brooch at the collar
          glow(ctx, x, y + 17 * s, 5 * s, '200,230,255', 0.6);
          flake(ctx, x, y + 17 * s, 2.6 * s, '#f4faff', 1.1);
          ctx.fillStyle = '#c8e0f0'; ctx.beginPath(); ctx.arc(x, y + 17 * s, 0.8 * s, 0, TAU); ctx.fill();
        },
      });
      ctx.restore();
      ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(64, 52, 28, 38, 0, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      ctx.strokeStyle = '#3a4250'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(64, 52, 25, 35, 0, 0, TAU); ctx.stroke();
      flake(ctx, 64, 13, 3.5, '#f0f6ff', 1);
      ctx.fillStyle = '#c8d0d8'; ctx.fillRect(56, 89, 16, 4); ctx.fillStyle = '#5a6270'; ctx.fillRect(58, 90.5, 12, 1);
    });

    tex('dc_portrait_family', (ctx) => {
      const r = frame(ctx, 16, 20, 96, 66, 6, '#a88a4a');
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + r.h, [[0, '#d8c8a0'], [1, '#8a7a5a']]); ctx.fillRect(r.x, r.y, r.w, r.h);
      glow(ctx, 64, 44, 40, '255,240,200', 0.5);
      ctx.fillStyle = 'rgba(120,140,110,0.35)'; ctx.fillRect(r.x, r.y + 40, r.w, 20);
      // father: tall, silver-haired
      bust(ctx, 40, 37, 1.5, {
        skin: '#dcbc9c', hair: '#b4bac6', dress: '#2e3e60', collar: '#c8ccd4', laugh: true, broad: 1.25, chin: 4,
        hairTop: (x, y, s) => { hairShort(ctx, x, y, s); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; for (let k = -2; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2 * s, y - 7.4 * s); ctx.quadraticCurveTo(x + (k * 2 + 2) * s, y - 6.6 * s, x + (k * 2 + 3) * s, y - 4.8 * s); ctx.stroke(); } },
      });
      // mother: dark-haired, grey-eyed, silver dress, lily pin
      bust(ctx, 86, 45, 1.35, {
        skin: '#ecd4c0', hair: '#2a1c18', dress: '#b8c4d0', collar: '#eef2f6', laugh: true, chin: 2.6,
        hairBack: (x, y, s) => { ctx.beginPath(); ctx.roundRect(x - 7.6 * s, y - 6 * s, 15.2 * s, 20 * s, 4 * s); ctx.fill(); },
        hairTop: (x, y, s) => hairParted(ctx, x, y, s, 3),
        extra: (x, y, s) => {
          // still-lily pin
          const px = x - 6 * s, py = y + 15 * s;
          ctx.fillStyle = '#ffffff';
          for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(px + Math.sin(a) * 1.6 * s, py - Math.cos(a) * 1.6 * s, 0.9 * s, 1.9 * s, a, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#7aa070'; ctx.fillRect(px - 0.3, py, 0.8, 2.6 * s);
        },
      });
      // the little girl in front: silver hair
      bust(ctx, 64, 58, 1.1, {
        skin: '#f0d8c4', hair: '#e4e8f0', dress: '#7a9ac0', collar: '#f4f4f4', laugh: true, chin: 3,
        hairBack: (x, y, s) => { ctx.beginPath(); ctx.roundRect(x - 7.8 * s, y - 6 * s, 15.6 * s, 14 * s, 4 * s); ctx.fill(); },
        hairTop: (x, y, s) => { hairParted(ctx, x, y, s, 3); ctx.fillStyle = '#8ab0e0'; ctx.beginPath(); ctx.arc(x + 5 * s, y - 6 * s, 1.6 * s, 0, TAU); ctx.fill(); },
      });
      ctx.fillStyle = 'rgba(255,240,210,0.1)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    });

    tex('dc_clockface', (ctx) => {
      // a long-case wall regulator
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(44, 14, 44, 104);
      wood(ctx, 42, 40, 44, 74, '#4a2814', { vert: true, grain: 8 });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(42, 112, 44, 2);
      wood(ctx, 38, 112, 52, 6, '#3a200e', { grain: 3 });
      ctx.fillStyle = '#3a200e'; ctx.beginPath(); ctx.moveTo(44, 118); ctx.lineTo(84, 118); ctx.lineTo(64, 126); ctx.fill();
      // pendulum window
      ctx.fillStyle = '#120a06'; ctx.fillRect(50, 66, 28, 42);
      ctx.fillStyle = 'rgba(180,200,220,0.15)'; ctx.fillRect(50, 66, 28, 42);
      ctx.fillStyle = '#c8a050'; ctx.fillRect(63.3, 66, 1.4, 30);
      ctx.fillStyle = rad(ctx, 62, 98, 0, 7, [[0, '#fff0a0'], [0.5, '#d0a040'], [1, '#6a4a10']]); ctx.beginPath(); ctx.arc(64, 98, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(53, 70); ctx.lineTo(60, 104); ctx.stroke();
      ctx.strokeStyle = '#c8a050'; ctx.strokeRect(50.5, 66.5, 27, 41);
      // round head with a big dial
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(66, 38, 27, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 56, 28, 0, 34, [[0, '#7a4a28'], [1, '#2e180a']]); ctx.beginPath(); ctx.arc(64, 36, 27, 0, TAU); ctx.fill();
      clockFace(ctx, 64, 36, 22, { rim: '#c8a050', rimW: 0.86, h: 10, m: 10 });
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(64, 8, 3, 0, TAU); ctx.fill();
    });

    tex('dc_clockwall', (ctx) => {
      const rims = ['#b08a3a', '#c8a050', '#7a4a28', '#5a3a20', '#9aa0a8', '#a06a30', '#d0b060'];
      const faces = ['#fbf4de', '#efe6cc', '#f4f0e8', '#e8dcc0', '#1e1a18'];
      const spots = [[18, 18, 14], [50, 14, 10], [80, 22, 16], [112, 14, 11], [32, 46, 12], [62, 44, 9], [100, 52, 15], [14, 74, 10], [44, 76, 15], [76, 70, 11], [112, 84, 10], [24, 102, 9], [60, 100, 12], [90, 100, 8], [76, 44, 5], [8, 44, 5], [118, 38, 5], [92, 82, 6], [40, 120, 5]];
      for (const [x, y, r] of spots) {
        if (r >= 14 && R() < 0.5) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - r - 2, y - r - 2, 2 * r + 6, 2 * r + 7); wood(ctx, x - r - 3, y - r - 3, 2 * r + 6, 2 * r + 6, pick(['#4a2814', '#6a3a1a']), { grain: 6 }); }
        const face = r < 7 ? '#fbf4de' : pick(faces);
        clockFace(ctx, x, y, r, { rim: pick(rims), face, ink: face === '#1e1a18' ? '#e8d8a0' : '#2a1e14', h: 12, m: 0 });
      }
      // the odd one, low by the floor: a gilt clock with a sun at its heart, its hands set differently
      const ox = 100, oy = 116;
      glow(ctx, ox, oy, 16, '255,210,110', 0.55);
      clockFace(ctx, ox, oy, 8, {
        rim: '#e8c060', face: '#2a1a0a', ink: '#ffd870', hand: '#fff0b0', h: 6, m: 15,
        inner: (x, y, fr) => A.symbol.dawn(ctx, x, y, fr * 0.5, 'rgba(255,210,110,0.9)'),
      });
      ctx.strokeStyle = 'rgba(255,230,150,0.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(ox, oy, 9.5, 0, TAU); ctx.stroke();
    });

    tex('dc_sun_disc', (ctx) => {
      glow(ctx, 64, 52, 50, '255,200,90', 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(66, 55, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 54, 42, 0, 40, [[0, '#fff2b0'], [0.4, '#e8b840'], [0.8, '#b07a18'], [1, '#6a4408']]); ctx.beginPath(); ctx.arc(64, 52, 30, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(64, 52, 28.5, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
      ctx.fillStyle = rad(ctx, 64, 52, 0, 26, [[0, '#a87018'], [1, '#7a4c0c']]); ctx.beginPath(); ctx.arc(64, 52, 25, 0, TAU); ctx.fill();
      A.symbol.dawn(ctx, 64.8, 52.8, 21, 'rgba(60,30,0,0.7)');
      A.symbol.dawn(ctx, 64, 52, 21, '#ffe58a');
      ctx.fillStyle = 'rgba(255,255,230,0.7)'; ctx.beginPath(); ctx.arc(61, 49, 3, 0, TAU); ctx.fill();
      // hanging cord
      ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(52, 24); ctx.lineTo(64, 12); ctx.lineTo(76, 24); ctx.stroke();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(64, 12, 1.6, 0, TAU); ctx.fill();
    });

    tex('dc_pale_altar', (ctx) => {
      glow(ctx, 64, 46, 40, '190,220,255', 0.4);
      // emblem plaque
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(66, 46, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 58, 38, 0, 30, [[0, '#f4f8fc'], [0.6, '#c0ccd8'], [1, '#7a8898']]); ctx.beginPath(); ctx.arc(64, 44, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#dce8f2'; ctx.beginPath(); ctx.arc(64, 44, 19, 0, TAU); ctx.fill();
      A.symbol.pale(ctx, 64.6, 44.6, 16, 'rgba(40,60,90,0.5)');
      A.symbol.pale(ctx, 64, 44, 16, '#5a7aa0');
      // shelf with a pale cloth, brackets
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(34, 84, 60, 4);
      for (const bx of [40, 84]) { ctx.fillStyle = '#c8d0d8'; ctx.beginPath(); ctx.moveTo(bx, 84); ctx.lineTo(bx + 4, 84); ctx.lineTo(bx + 4, 96); ctx.fill(); }
      ctx.fillStyle = lin(ctx, 0, 78, 0, 84, [[0, '#f0f4f8'], [1, '#9aa6b4']]); ctx.fillRect(32, 78, 64, 6);
      ctx.fillStyle = '#c8daea'; ctx.beginPath(); ctx.moveTo(40, 78); ctx.lineTo(88, 78); ctx.lineTo(86, 92); ctx.lineTo(76, 88); ctx.lineTo(64, 93); ctx.lineTo(52, 88); ctx.lineTo(42, 92); ctx.fill();
      ctx.strokeStyle = '#8aa8c8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(42, 90); ctx.lineTo(52, 86); ctx.lineTo(64, 91); ctx.lineTo(76, 86); ctx.lineTo(86, 90); ctx.stroke();
      // a single white candle, unlit, in a silver dish
      ctx.fillStyle = '#b8c4d0'; ctx.beginPath(); ctx.ellipse(64, 78, 7, 2, 0, 0, TAU); ctx.fill();
      candle(ctx, 64, 77, 16, 5, false, '#f8f8fa');
      // tiny frost crystals
      for (let i = 0; i < 12; i++) flake(ctx, rr(36, 92), rr(72, 82), 1.5, 'rgba(240,250,255,0.8)', 0.5);
    });

    tex('dc_root_carving', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(40, 0, 52, 128);
      wood(ctx, 40, 0, 48, 128, '#5a3e24', { vert: true, grain: 14, knots: 2 });
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(40, 0, 4, 128); ctx.fillRect(84, 0, 4, 128);
      glow(ctx, 64, 54, 26, '255,180,70', 0.35);
      A.symbol.root(ctx, 64.8, 55, 18, 'rgba(255,220,160,0.4)');
      A.symbol.root(ctx, 64, 54, 18, '#1e1008');
      A.symbol.root(ctx, 64, 54, 18, 'rgba(230,150,50,0.35)');
      // little roots creeping down the beam
      ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const [x, d] of [[44, 1], [86, -1]]) { ctx.beginPath(); ctx.moveTo(x, 128); ctx.bezierCurveTo(x + d * 6, 110, x - d * 2, 96, x + d * 5, 84); ctx.stroke(); }
      ctx.lineCap = 'butt';
      // an amber lantern bead
      ctx.fillStyle = '#ffb84a'; ctx.beginPath(); ctx.arc(64, 84, 2, 0, TAU); ctx.fill(); glow(ctx, 64, 84, 8, '255,180,70', 0.5);
    });

    tex('dc_tapestry', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(24, 16, 84, 90);
      const x0 = 22, x1 = 106, y0 = 14, y1 = 100;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      ctx.fillStyle = '#3a2a3a'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const ix0 = x0 + 6, ix1 = x1 - 6, iy0 = y0 + 6, iy1 = y1 - 6;
      ctx.fillStyle = lin(ctx, 0, iy0, 0, 60, [[0, '#6a7aa0'], [1, '#c0c8d8']]); ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
      ctx.fillStyle = '#e8eef0'; ctx.beginPath(); ctx.arc(88, 30, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7a84a0'; ctx.beginPath(); ctx.moveTo(ix0, 56); ctx.lineTo(42, 34); ctx.lineTo(56, 48); ctx.lineTo(70, 30); ctx.lineTo(ix1, 56); ctx.fill();
      ctx.fillStyle = '#eef2f8'; ctx.beginPath(); ctx.moveTo(38, 38); ctx.lineTo(42, 34); ctx.lineTo(46, 39); ctx.fill(); ctx.beginPath(); ctx.moveTo(65, 36); ctx.lineTo(70, 30); ctx.lineTo(76, 37); ctx.fill();
      // frozen lake
      ctx.fillStyle = lin(ctx, 0, 56, 0, iy1, [[0, '#a8d0e0'], [1, '#e0f0f4']]); ctx.fillRect(ix0, 56, ix1 - ix0, iy1 - 56);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(rr(ix0, ix1), rr(60, 90)); ctx.lineTo(rr(ix0, ix1), rr(60, 90)); ctx.stroke(); }
      // pines on the shores
      const pine = (px, py, h) => { ctx.fillStyle = '#1e3a2a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(px, py - h + k * h * 0.25); ctx.lineTo(px + h * 0.3, py - h * 0.35 + k * h * 0.25); ctx.lineTo(px - h * 0.3, py - h * 0.35 + k * h * 0.25); ctx.fill(); } ctx.fillStyle = '#f0f4f8'; ctx.beginPath(); ctx.moveTo(px, py - h); ctx.lineTo(px + 2, py - h + 4); ctx.lineTo(px - 2, py - h + 4); ctx.fill(); };
      for (const [px, h] of [[32, 26], [38, 20], [44, 16], [90, 28], [96, 22], [84, 18]]) pine(px, 64, h);
      ctx.fillStyle = '#f2f6f8'; ctx.fillRect(ix0, 62, 22, 3); ctx.fillRect(ix1 - 24, 62, 24, 3);
      // a skater on the ice
      ctx.fillStyle = '#7a2a2a'; ctx.fillRect(62, 72, 3, 6); ctx.fillStyle = '#e8c8a8'; ctx.beginPath(); ctx.arc(63.5, 70.5, 1.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(63, 78); ctx.lineTo(60, 82); ctx.moveTo(64.5, 78); ctx.lineTo(67, 81); ctx.stroke();
      // woven border with a running wave
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.2; ctx.strokeRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6);
      ctx.strokeStyle = '#8a3a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = x0; x < x1; x += 4) { ctx.moveTo(x, y0 + 1); ctx.lineTo(x + 2, y0 + 4); ctx.moveTo(x, y1 - 1); ctx.lineTo(x + 2, y1 - 4); } ctx.stroke();
      // weave texture
      for (let y = y0; y < y1; y += 2) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y, x1 - x0, 1); }
      for (let x = x0; x < x1; x += 3) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x, y0, 1, y1 - y0); }
      ctx.fillStyle = lin(ctx, x0, 0, x1, 0, [[0, 'rgba(0,0,0,0.25)'], [0.15, 'rgba(0,0,0,0)'], [0.5, 'rgba(255,255,255,0.05)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
      // fringe and rod
      for (let x = x0 + 1; x < x1; x += 2) { ctx.fillStyle = x % 4 ? '#c8a050' : '#8a3a3a'; ctx.fillRect(x, y1, 1, rr(5, 8)); }
      ctx.fillStyle = lin(ctx, 0, 10, 0, 15, [[0, '#8a6a3a'], [1, '#3a2410']]); ctx.fillRect(16, 10, 96, 5);
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(16, 12.5, 3, 0, TAU); ctx.arc(112, 12.5, 3, 0, TAU); ctx.fill();
    });

    tex('dc_pots', (ctx) => {
      // iron rail with hooks
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, 24, 108, 3);
      ctx.fillStyle = lin(ctx, 0, 19, 0, 24, [[0, '#6a6a70'], [1, '#2a2a30']]); ctx.fillRect(8, 19, 112, 5);
      for (const x of [8, 120]) { ctx.fillStyle = '#2a2a30'; ctx.fillRect(x - 2, 14, 4, 14); }
      const hook = (x, y) => { ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, y - 2); ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 0.8); ctx.stroke(); };
      const pot = (x, y, r, deep) => {
        hook(x, y - r * 0.3 - 2);
        ctx.strokeStyle = '#7a4020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - r * 0.3, r * 0.75, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 2, y + deep / 2 + 2, r, deep / 2 + 2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = lin(ctx, x - r, 0, x + r, 0, [[0, '#6a2e14'], [0.3, '#f0a070'], [0.45, '#d07040'], [1, '#5a2410']]);
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.9, y + deep); ctx.quadraticCurveTo(x, y + deep + 4, x + r * 0.9, y + deep); ctx.lineTo(x + r, y); ctx.fill();
        ctx.fillStyle = '#a85a30'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.25, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a1808'; ctx.beginPath(); ctx.ellipse(x, y, r - 1.5, r * 0.25 - 1, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,180,0.6)'; ctx.fillRect(x - r * 0.45, y + 2, 1.5, deep - 3);
      };
      pot(24, 50, 11, 14); pot(56, 62, 14, 16); pot(96, 54, 9, 11);
      // a frying pan hanging by its handle
      hook(80, 34); ctx.fillStyle = '#2a2a2e'; ctx.fillRect(78.5, 34, 3, 20);
      ctx.fillStyle = rad(ctx, 77, 64, 0, 14, [[0, '#4a4a50'], [1, '#18181c']]); ctx.beginPath(); ctx.arc(80, 66, 12, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(80, 66, 10, 3.6, 5); ctx.stroke();
      // ladles
      for (const [x, l] of [[40, 30], [112, 26]]) { hook(x, 30); ctx.fillStyle = '#9a9aa2'; ctx.fillRect(x - 0.8, 30, 1.6, l); ctx.fillStyle = lin(ctx, x - 4, 0, x + 4, 0, [[0, '#6a6a72'], [0.4, '#e0e0e8'], [1, '#5a5a62']]); ctx.beginPath(); ctx.arc(x, 30 + l, 4, 0, Math.PI); ctx.fill(); }
      // drying herbs, hung upside down
      const herb = (x, col) => {
        ctx.strokeStyle = '#c8b080'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, 30); ctx.stroke();
        ctx.fillStyle = '#d8c090'; ctx.fillRect(x - 2, 29, 4, 3);
        for (let k = 0; k < 14; k++) { const a = rr(-0.5, 0.5), l = rr(10, 20); ctx.strokeStyle = sh(col, rr(0.7, 1.2)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, 31); ctx.quadraticCurveTo(x + Math.sin(a) * l * 0.5, 31 + l * 0.6, x + Math.sin(a) * l, 31 + l); ctx.stroke(); }
        if (col === '#7a6aa0') for (let k = 0; k < 8; k++) { ctx.fillStyle = '#9a80c8'; ctx.fillRect(x + rr(-6, 6), rr(42, 52), 1.5, 1.5); }
      };
      herb(10, '#6a8a4a'); herb(68, '#7a6aa0'); herb(118, '#8a9a5a');
    });

    tex('dc_gears', (ctx) => {
      // a backing board
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(14, 18, 104, 92);
      wood(ctx, 12, 16, 104, 92, '#3e2614', { grain: 20 });
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeRect(12.5, 16.5, 103, 91);
      gear(ctx, 46, 64, 32, 16, '#8a5a30', { spokes: 6, holeCol: '#24140a' });
      gear(ctx, 90, 40, 19, 12, '#c09440', { spokes: 5, holeCol: '#24140a', rot: 0.3 });
      gear(ctx, 92, 86, 14, 10, '#b08a40', { spokes: 4, holeCol: '#24140a', rot: 0.4 });
      gear(ctx, 26, 30, 9, 8, '#a0a4aa', { spokes: 0 });
      for (const [x, y] of [[18, 22], [110, 22], [18, 102], [110, 102]]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
    });

    tex('dc_tools', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(20, 24, 92, 74);
      ctx.fillStyle = lin(ctx, 0, 22, 0, 96, [[0, '#a07a4a'], [1, '#7a5a34']]); ctx.fillRect(18, 22, 92, 74);
      for (let y = 27; y < 94; y += 6) for (let x = 23; x < 108; x += 6) { ctx.fillStyle = 'rgba(40,24,10,0.7)'; ctx.fillRect(x, y, 1.4, 1.4); }
      ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 2; ctx.strokeRect(19, 23, 90, 72);
      // hammer (a T, never a cross)
      ctx.fillStyle = '#7a5030'; ctx.fillRect(29, 34, 3, 32); ctx.fillStyle = '#5a5a62'; ctx.fillRect(24, 30, 13, 6); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(24, 30, 13, 1);
      // saw
      ctx.fillStyle = lin(ctx, 42, 0, 54, 0, [[0, '#8a8e96'], [0.5, '#dfe2e8'], [1, '#7a7e86']]);
      ctx.beginPath(); ctx.moveTo(42, 40); ctx.lineTo(54, 40); ctx.lineTo(52, 84); ctx.lineTo(44, 84); ctx.fill();
      ctx.fillStyle = '#5a5e66'; for (let y = 44; y < 84; y += 2.5) { ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(42.5, y + 1.2); ctx.lineTo(44, y + 2.5); ctx.fill(); }
      ctx.fillStyle = '#8a4a20'; ctx.beginPath(); ctx.roundRect(41, 28, 14, 13, 3); ctx.fill(); ctx.fillStyle = '#a07a4a'; ctx.fillRect(45, 31, 6, 5);
      // screwdrivers
      for (const [x, c] of [[62, '#b83a2a'], [68, '#2a6a3a'], [74, '#3a5aa0']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x - 2, 30, 4, 12, 1.5); ctx.fill(); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 0.6, 42, 1.2, 14); }
      // pliers
      ctx.strokeStyle = '#6a6e76'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(84, 30); ctx.lineTo(87, 46); ctx.lineTo(84, 64); ctx.moveTo(90, 30); ctx.lineTo(87, 46); ctx.lineTo(90, 64); ctx.stroke();
      ctx.fillStyle = '#a03a2a'; ctx.fillRect(82.5, 52, 3, 12); ctx.fillRect(88.5, 52, 3, 12);
      // calipers
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(100, 30); ctx.lineTo(98, 60); ctx.moveTo(100, 30); ctx.lineTo(104, 60); ctx.stroke();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(100, 30, 2.4, 0, TAU); ctx.fill();
      // files and tweezers along the bottom
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#7a7e86'; ctx.fillRect(62 + i * 7, 66, 2, 20); ctx.fillStyle = '#5a3a20'; ctx.fillRect(61.5 + i * 7, 62, 3, 6); }
      ctx.strokeStyle = '#b8bcc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(96, 68); ctx.lineTo(94, 88); ctx.moveTo(96, 68); ctx.lineTo(98, 88); ctx.stroke();
      // a loupe
      ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.arc(30, 80, 6, 0, TAU); ctx.fill(); ctx.fillStyle = rad(ctx, 28, 78, 0, 5, [[0, '#e8f4ff'], [1, '#6a8aa8']]); ctx.beginPath(); ctx.arc(30, 80, 4, 0, TAU); ctx.fill();
    });

    tex('dc_shelf', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(22, 70, 88, 4);
      for (const bx of [30, 94]) { ctx.fillStyle = '#3a2414'; ctx.beginPath(); ctx.moveTo(bx, 70); ctx.lineTo(bx + 5, 70); ctx.lineTo(bx + 5, 84); ctx.quadraticCurveTo(bx + 2, 76, bx, 76); ctx.fill(); }
      // books standing and lying
      let x = 26;
      for (let i = 0; i < 6; i++) { const w = 3 + ri(3); book(ctx, x, 64, w, rr(15, 22), pick(BOOKS)); x += w + 0.4; }
      book(ctx, x + 1, 64, 4, 20, pick(BOOKS), 0.3);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = sh(pick(BOOKS), 1); ctx.fillRect(84 - k, 61 - k * 3.2, 18 + k * 2, 3); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(84 - k, 61.7 - k * 3.2, 1, 1.6); }
      // jars
      const jar = (jx, h, col) => {
        ctx.fillStyle = 'rgba(200,220,230,0.55)'; ctx.beginPath(); ctx.roundRect(jx - 4, 64 - h, 8, h, 2); ctx.fill();
        ctx.fillStyle = col; ctx.fillRect(jx - 3, 64 - h * 0.65, 6, h * 0.65 - 1);
        ctx.fillStyle = '#8a6a3a'; ctx.fillRect(jx - 4, 64 - h - 2, 8, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(jx - 3, 64 - h + 2, 1, h - 4);
      };
      jar(60, 12, '#a04a20'); jar(70, 9, '#c8a040');
      candle(ctx, 78, 64, 9, 3.5, true);
      ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(78, 64, 4, 1.2, 0, 0, TAU); ctx.fill();
      wood(ctx, 22, 64, 86, 6, '#6a4224', { grain: 3 });
    });

    tex('dc_drawings', (ctx) => {
      const paper = (x, y, w, h, rot, draw) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
        ctx.fillStyle = '#f6f0e0'; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = 'rgba(180,160,120,0.25)'; ctx.fillRect(-w / 2, h / 2 - 3, w, 3);
        draw(w, h);
        ctx.fillStyle = '#c83a3a'; ctx.beginPath(); ctx.arc(0, -h / 2 + 2, 1.6, 0, TAU); ctx.fill();
        ctx.restore();
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      paper(36, 36, 30, 26, -0.1, () => { kidSun(ctx, 0, 1, 5, '#f0c020', '#f08a20'); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, 0, 1, 1); ctx.fillRect(1.5, 0, 1, 1); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(0, 2, 2, 0.3, 2.8); ctx.stroke(); });
      paper(90, 32, 26, 26, 0.12, () => { flake(ctx, 0, 1, 8, '#4a8ad0', 1.4); });
      paper(30, 78, 26, 30, 0.08, () => {
        ctx.fillStyle = '#7a4a20'; ctx.fillRect(-1.5, 2, 3, 9);
        ctx.fillStyle = '#3a9a3a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 4); ctx.lineTo(-9, 4); ctx.fill();
        ctx.fillStyle = '#5ab04a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, -2); ctx.lineTo(-5, -2); ctx.fill();
        ctx.fillStyle = '#6a8a3a'; ctx.fillRect(-12, 11, 24, 2);
      });
      paper(80, 76, 40, 32, -0.06, () => {
        // a stick-figure family of three, holding hands (arms angled, never a cross)
        const fig = (fx, top, h, col, hair) => {
          ctx.strokeStyle = col; ctx.lineWidth = 1.1;
          const hr = h * 0.13, neck = top + hr * 2, hip = top + h * 0.62;
          ctx.beginPath(); ctx.arc(fx, top + hr, hr, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx, neck); ctx.lineTo(fx, hip); ctx.lineTo(fx - h * 0.15, top + h); ctx.moveTo(fx, hip); ctx.lineTo(fx + h * 0.15, top + h); ctx.stroke();
          if (hair) { ctx.strokeStyle = hair; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(fx, top + hr, hr + 0.8, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
          ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(fx, top + hr + 0.4, hr * 0.5, 0.4, 2.7); ctx.stroke();
          return { sx: fx, sy: neck + h * 0.12 };
        };
        const a = fig(-12, -12, 22, '#2a4a8a', '#b8c0c8'), c = fig(0, -2, 13, '#c83a6a', '#c8ccd8'), b = fig(12, -11, 21, '#7a3a8a', '#2a1a14');
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(-6, 4); ctx.lineTo(c.sx, c.sy); ctx.lineTo(6, 4); ctx.lineTo(b.sx, b.sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(-17, -6); ctx.moveTo(b.sx, b.sy); ctx.lineTo(17, -5); ctx.stroke();
        kidSun(ctx, 15, -12, 2, '#f0c020');
      });
    });

    tex('dc_mirror_wall', (ctx) => {
      const x0 = 38, x1 = 90, top = 10;
      const shape = (pad) => { ctx.beginPath(); ctx.moveTo(x0 - pad, 120 + pad); ctx.lineTo(x0 - pad, top + 26); ctx.bezierCurveTo(x0 - pad, top - pad, x1 + pad, top - pad, x1 + pad, top + 26); ctx.lineTo(x1 + pad, 120 + pad); ctx.closePath(); };
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.save(); ctx.translate(2, 3); shape(6); ctx.fill(); ctx.restore();
      ctx.fillStyle = lin(ctx, x0 - 6, 0, x1 + 6, 0, [[0, '#6a7480'], [0.3, '#e8eef4'], [0.6, '#9aa4b0'], [1, '#4a525e']]); shape(6); ctx.fill();
      ctx.save(); shape(0); ctx.clip();
      // the reflection: a long pale hall that is not this room
      ctx.fillStyle = lin(ctx, 0, top, 0, 120, [[0, '#c8d8e8'], [0.5, '#e8f0f8'], [1, '#9ab0c8']]); ctx.fillRect(x0, 0, x1 - x0, 128);
      const vx = 64, vy = 62;
      ctx.fillStyle = '#f4faff'; ctx.fillRect(vx - 4, vy - 10, 8, 16); glow(ctx, vx, vy - 2, 16, '255,255,255', 0.8);
      ctx.fillStyle = 'rgba(150,175,200,0.5)'; ctx.beginPath(); ctx.moveTo(x0, 120); ctx.lineTo(vx - 4, vy + 6); ctx.lineTo(vx + 4, vy + 6); ctx.lineTo(x1, 120); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const t = 1 - i * 0.24, pw = 3 * t + 0.5;
        for (const s of [-1, 1]) {
          const px = vx + s * (6 + 22 * t), ph = 6 + 50 * t;
          ctx.fillStyle = lin(ctx, px - pw, 0, px + pw, 0, [[0, '#a8bcd0'], [0.5, '#ffffff'], [1, '#8aa0b8']]);
          ctx.fillRect(px - pw, vy - ph * 0.55, pw * 2, ph);
        }
      }
      ctx.strokeStyle = 'rgba(170,195,220,0.6)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x0, top + 10); ctx.lineTo(vx - 4, vy - 10); ctx.moveTo(x1, top + 10); ctx.lineTo(vx + 4, vy - 10); ctx.stroke();
      // a distant pale figure
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(vx, vy + 2, 1.6, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(vx, vy - 3, 1.1, 0, TAU); ctx.fill();
      // rime creeping over the glass
      for (const [cx, cy, r] of [[x0, 120, 30], [x1, 116, 26], [x0, top + 14, 18], [x1, top + 20, 20]]) glow(ctx, cx, cy, r, '235,245,255', 0.85);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.6;
      for (let i = 0; i < 22; i++) { let x = R() < 0.5 ? x0 : x1, y = rr(top + 10, 120); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (x < 64 ? 1 : -1) * rr(2, 5); y += rr(-3, 3); ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x0 + 4, 100); ctx.lineTo(x0 + 12, 100); ctx.lineTo(x0 + 26, 30); ctx.lineTo(x0 + 18, 30); ctx.fill();
      ctx.restore();
      // frosted frame
      for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(245,250,255,' + rr(0.4, 0.9) + ')'; const s = R() < 0.5; ctx.fillRect(s ? rr(x0 - 6, x0) : rr(x1, x1 + 6), rr(top + 10, 126), rr(1, 2.5), rr(1, 2.5)); }
      flake(ctx, 64, top + 1, 4, '#ffffff', 1);
    });

    tex('dc_axle_roots', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(42, 0, 50, 128);
      // round axle shaft
      ctx.fillStyle = lin(ctx, 44, 0, 84, 0, [[0, '#2a1a0e'], [0.3, '#7a5634'], [0.45, '#8a6640'], [1, '#2a180a']]); ctx.fillRect(44, 0, 40, 128);
      for (let i = 0; i < 26; i++) { const gx = rr(46, 82); ctx.strokeStyle = 'rgba(25,12,4,' + rr(0.15, 0.4) + ')'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.bezierCurveTo(gx + rr(-2, 2), 40, gx + rr(-2, 2), 90, gx, 128); ctx.stroke(); }
      for (const y of [8, 112]) { ctx.fillStyle = lin(ctx, 44, 0, 84, 0, [[0, '#1a1a1e'], [0.35, '#6a6e78'], [1, '#141418']]); ctx.fillRect(43, y, 42, 7); }
      // carved root sigil
      A.symbol.root(ctx, 64.8, 51, 13, 'rgba(255,220,160,0.35)');
      A.symbol.root(ctx, 64, 50, 13, '#1a0c04');
      glow(ctx, 64, 50, 14, '255,170,60', 0.35);
      // roots twining around the shaft (front strands drawn over, back strands dimmer)
      ctx.lineCap = 'round';
      for (let s = 0; s < 3; s++) {
        const ph = s * 2.1, w = 3.5 - s * 0.6;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath(); let started = false;
          for (let y = 128; y > 10 + s * 18; y -= 1.5) {
            const a = y / 16 + ph, x = 64 + Math.sin(a) * 24, front = Math.cos(a) > 0;
            if (front === !!pass) { if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); } else started = false, ctx.stroke(), ctx.beginPath();
          }
          ctx.strokeStyle = pass ? '#5a3a1c' : '#24160a'; ctx.lineWidth = pass ? w : w * 0.8; ctx.stroke();
          if (pass) { ctx.strokeStyle = 'rgba(255,220,170,0.2)'; ctx.lineWidth = 0.8; ctx.stroke(); }
        }
      }
      // root hairs and frost
      ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const y = rr(20, 126), x = R() < 0.5 ? 41 : 87; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (x < 64 ? -4 : 4), y + 3, x + (x < 64 ? -6 : 6), y + 8); ctx.stroke(); }
      for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(230,240,255,' + rr(0.3, 0.7) + ')'; ctx.fillRect(rr(44, 84), rr(0, 128), 1.2, 1); }
      ctx.lineCap = 'butt';
    });

    tex('dc_sail_window', (ctx) => {
      const cx = 64, cy = 52, r = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r + 8, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, cy - r, 0, cy + r, [[0, '#4a5878'], [0.7, '#8a98b4'], [1, '#c0c8d8']]); ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,255,255,' + rr(0.4, 0.9) + ')'; ctx.fillRect(rr(cx - r, cx + r), rr(cy - r, cy + r), 1.2, 1.2); }
      // one great sail sweeping past, latticed and locked in ice
      ctx.save(); ctx.translate(cx - 30, cy + 34); ctx.rotate(-0.9);
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(0, -3.5, 110, 7);
      ctx.fillStyle = 'rgba(220,235,250,0.8)'; ctx.fillRect(0, -3.5, 110, 2);
      ctx.fillStyle = '#4a3624'; ctx.fillRect(14, -24, 96, 3);
      for (let x = 16; x < 110; x += 9) { ctx.fillStyle = '#4a3624'; ctx.fillRect(x, -22, 2.4, 19); ctx.fillStyle = 'rgba(225,240,255,0.85)'; ctx.fillRect(x, -22, 1, 19); }
      ctx.fillStyle = 'rgba(210,230,250,0.35)'; ctx.fillRect(14, -22, 96, 19);
      for (let x = 2; x < 110; x += rr(3, 6)) { ctx.fillStyle = 'rgba(230,245,255,0.9)'; ctx.beginPath(); ctx.moveTo(x, 3.5); ctx.lineTo(x + 2, 3.5); ctx.lineTo(x + 1, 3.5 + rr(3, 9)); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(230,240,255,0.5)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0.2, Math.PI - 0.2); ctx.fill();
      glow(ctx, cx - r, cy + r, 24, '235,245,255', 0.7); glow(ctx, cx + r, cy + r, 20, '235,245,255', 0.6);
      ctx.restore();
      // thick wooden ring frame with pegs
      ctx.lineWidth = 8; ctx.strokeStyle = '#4a3220'; ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(cx, cy, r + 6.5, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
      ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.39; ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4), 1.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(240,248,255,0.9)'; ctx.beginPath(); ctx.ellipse(cx, cy + r + 4, 20, 2.5, 0, 0, Math.PI); ctx.fill();
    });
    // ================= FLOORS (tile both ways) =================
    // boards running along y; each board has one or two butt joints, wrapping vertically
    function boards(ctx, o) {
      const bw = o.bw || 16;
      ctx.fillStyle = sh(o.base, 0.6); ctx.fillRect(0, 0, TS, TS);
      for (let x = 0; x < TS; x += bw) {
        const tone = sh(o.base, rr(o.lo || 0.82, o.hi || 1.12));
        ctx.fillStyle = lin(ctx, x, 0, x + bw, 0, [[0, sh(tone, 1.1)], [0.5, tone], [1, sh(tone, 0.85)]]); ctx.fillRect(x, 0, bw, TS);
        for (let i = 0; i < (o.grain || 8); i++) {
          const gx = x + rr(1, bw - 1), amp = rr(0.3, 1.4), k = 1 + ri(2), ph = rr(0, TAU);
          ctx.strokeStyle = R() < 0.25 ? 'rgba(255,225,180,0.1)' : 'rgba(25,12,4,' + rr(0.12, 0.3) + ')'; ctx.lineWidth = 0.7;
          ctx.beginPath(); for (let y = 0; y <= TS; y += 4) ctx.lineTo(gx + Math.sin(y / TS * TAU * k + ph) * amp, y); ctx.stroke();
        }
        ctx.fillStyle = o.gap || 'rgba(15,8,3,0.8)'; ctx.fillRect(x + bw - 1, 0, 1, TS);
        ctx.fillStyle = 'rgba(255,230,190,0.14)'; ctx.fillRect(x, 0, 1, TS);
        const j = rr(0, TS), joints = R() < 0.5 ? [j] : [j, (j + 64) % TS];
        for (const jy of joints) {
          ctx.fillStyle = o.gap || 'rgba(15,8,3,0.8)'; ctx.fillRect(x, jy, bw, 1);
          ctx.fillStyle = '#1a1410'; ctx.fillRect(x + 3, (jy + 3) % TS, 1.5, 1.5); ctx.fillRect(x + bw - 5, (jy + 3) % TS, 1.5, 1.5);
          ctx.fillRect(x + 3, (jy - 4 + TS) % TS, 1.5, 1.5); ctx.fillRect(x + bw - 5, (jy - 4 + TS) % TS, 1.5, 1.5);
        }
      }
    }
    const oakFloor = tex('floor_oak', (ctx) => {
      boards(ctx, { base: '#8a5a32', grain: 9 });
      // polish: a soft varnish sheen per board
      for (let x = 0; x < TS; x += 16) { ctx.fillStyle = 'rgba(255,220,170,0.07)'; ctx.fillRect(x + 4, 0, 4, TS); }
      grain(ctx, 6);
    });
    function rug(ctx, o) {
      ctx.drawImage(oakFloor, 0, 0);
      const x0 = 8, x1 = 120, y0 = 10, y1 = 118;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x0 + 1, y0 + 2, x1 - x0, y1 - y0);
      // fringe at the two ends
      for (let x = x0 + 1; x < x1; x += 2) { ctx.fillStyle = o.fringe; ctx.fillRect(x, y0 - 5, 1, 5); ctx.fillRect(x, y1, 1, 5); }
      ctx.fillStyle = o.border; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = o.line; ctx.fillRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6);
      ctx.fillStyle = o.band; ctx.fillRect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8);
      // running motif in the band
      ctx.fillStyle = o.motif;
      for (let x = x0 + 8; x < x1 - 6; x += 8) for (const y of [y0 + 8, y1 - 8]) { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.fill(); }
      for (let y = y0 + 16; y < y1 - 10; y += 8) for (const x of [x0 + 8, x1 - 8]) { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.fill(); }
      ctx.fillStyle = o.line; ctx.fillRect(x0 + 12, y0 + 12, x1 - x0 - 24, y1 - y0 - 24);
      const fx0 = x0 + 13, fy0 = y0 + 13, fw = x1 - x0 - 26, fh = y1 - y0 - 26;
      ctx.fillStyle = rad(ctx, 64, 64, 0, 60, [[0, sh(o.field, 1.15)], [1, sh(o.field, 0.85)]]); ctx.fillRect(fx0, fy0, fw, fh);
      // small scattered flowers in the field
      for (let i = 0; i < 26; i++) { const px = rr(fx0 + 3, fx0 + fw - 3), py = rr(fy0 + 3, fy0 + fh - 3); if (Math.abs(px - 64) + Math.abs(py - 64) < 40) continue; ctx.fillStyle = rgba(o.motif.length === 7 ? o.motif : '#e0c080', 0.6); ctx.beginPath(); ctx.arc(px, py, 1.3, 0, TAU); ctx.fill(); }
      // corner spandrels
      for (const [cx, cy, sx, sy] of [[fx0, fy0, 1, 1], [fx0 + fw, fy0, -1, 1], [fx0, fy0 + fh, 1, -1], [fx0 + fw, fy0 + fh, -1, -1]]) {
        ctx.fillStyle = o.border; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * 18, cy); ctx.quadraticCurveTo(cx + sx * 8, cy + sy * 8, cx, cy + sy * 18); ctx.fill();
      }
      // central lozenge medallion
      const lz = (r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(64, 64 - r * 1.25); ctx.lineTo(64 + r, 64); ctx.lineTo(64, 64 + r * 1.25); ctx.lineTo(64 - r, 64); ctx.fill(); };
      lz(30, o.border); lz(27, o.line); lz(25, o.medal); lz(16, o.band); lz(13, o.field);
      ctx.fillStyle = o.line; ctx.beginPath(); ctx.arc(64, 64, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = o.border; ctx.beginPath(); ctx.arc(64, 64, 3.5, 0, TAU); ctx.fill();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.39; ctx.fillStyle = o.line; ctx.beginPath(); ctx.arc(64 + Math.cos(a) * 10, 64 + Math.sin(a) * 12, 1.4, 0, TAU); ctx.fill(); }
      // pile texture
      for (let i = 0; i < 1400; i++) { ctx.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(rr(x0, x1), rr(y0, y1), 1, 1); }
    }
    tex('rug_red', (ctx) => { rug(ctx, { border: '#2a2238', line: '#d8b060', band: '#6a1a20', motif: '#e8c878', field: '#9a2a2c', medal: '#2a3a5a', fringe: '#e8dcc0' }); grain(ctx, 6); });
    tex('rug_blue', (ctx) => { rug(ctx, { border: '#3a5070', line: '#eef2f6', band: '#c8d8e6', motif: '#5a7aa0', field: '#8eaec8', medal: '#e8eef4', fringe: '#f4f6f8' }); grain(ctx, 5); });

    tex('floor_kitchen', (ctx) => {
      ctx.fillStyle = '#4a3a30'; ctx.fillRect(0, 0, TS, TS);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const x = c * 32 + (r % 2 ? 16 : 0), y = r * 32, tone = sh(pick(['#a5553a', '#b0603e', '#9a4e36', '#a85c3c', '#8e4a34']), rr(0.88, 1.08));
        wrapX((d) => {
          ctx.fillStyle = rad(ctx, x + d + 14, y + 14, 2, 24, [[0, sh(tone, 1.12)], [1, sh(tone, 0.86)]]);
          ctx.beginPath(); ctx.roundRect(x + d + 1.2, y + 1.2, 29.6, 29.6, 2.5); ctx.fill();
          ctx.fillStyle = 'rgba(255,230,200,0.14)'; ctx.fillRect(x + d + 2, y + 2, 27, 1.5);
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + d + 2, y + 28.5, 27, 1.5);
        });
        if (R() < 0.3) { ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.lineWidth = 0.6; let px = x + rr(6, 24), py = y + 2; ctx.beginPath(); ctx.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rr(-4, 4); py += rr(4, 8); ctx.lineTo(px, py); } ctx.stroke(); }
      }
      for (let i = 0; i < 30; i++) { const x = R() * TS, y = R() * TS; ctx.fillStyle = 'rgba(30,15,8,0.15)'; ctx.beginPath(); ctx.arc(x, y, rr(1, 3), 0, TAU); ctx.fill(); }
      grain(ctx, 12);
    });

    tex('floor_mill', (ctx) => {
      boards(ctx, { base: '#6a5640', bw: 16, grain: 10, lo: 0.72, hi: 1.05 });
      // spilled flour, with wrap so drifts cross the seams
      for (let i = 0; i < 9; i++) {
        const x = R() * TS, y = R() * TS, r = rr(8, 22), a = rr(0.3, 0.7);
        wrapXY((dx, dy) => { ctx.fillStyle = rad(ctx, x + dx, y + dy, 0, r, [[0, 'rgba(240,236,226,' + a + ')'], [0.6, 'rgba(240,236,226,' + a * 0.5 + ')'], [1, 'rgba(240,236,226,0)']]); ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); });
      }
      for (let i = 0; i < 500; i++) { ctx.fillStyle = 'rgba(240,236,226,' + rr(0.2, 0.6) + ')'; ctx.fillRect(R() * TS, R() * TS, 1, 1); }
      for (let i = 0; i < 25; i++) { ctx.fillStyle = 'rgba(200,170,90,0.8)'; ctx.fillRect(R() * TS, R() * TS, 1.5, 1); }
      ctx.fillStyle = 'rgba(230,226,216,0.15)'; ctx.fillRect(0, 0, TS, TS);
      grain(ctx, 10);
    });

    tex('floor_attic', (ctx) => {
      boards(ctx, { base: '#6e5c48', bw: 21.33, grain: 10, lo: 0.75, hi: 1.08 });
      // dust settles thickest away from the walked path
      ctx.fillStyle = 'rgba(150,140,128,0.28)'; ctx.fillRect(0, 0, TS, TS);
      for (let i = 0; i < 10; i++) {
        const x = R() * TS, y = R() * TS, r = rr(10, 26);
        wrapXY((dx, dy) => { ctx.fillStyle = rad(ctx, x + dx, y + dy, 0, r, [[0, 'rgba(170,160,150,0.25)'], [1, 'rgba(170,160,150,0)']]); ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); });
      }
      for (let i = 0; i < 700; i++) { ctx.fillStyle = 'rgba(190,180,170,' + rr(0.1, 0.35) + ')'; ctx.fillRect(R() * TS, R() * TS, 1, 1); }
      grain(ctx, 12);
    });

    tex('floor_child', (ctx) => {
      ctx.drawImage(oakFloor, 0, 0);
      ctx.fillStyle = 'rgba(255,240,210,0.06)'; ctx.fillRect(0, 0, TS, TS);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(65, 66, 54, 0, TAU); ctx.fill();
      const cols = ['#a85a5a', '#d8cbb0', '#6a8aa8', '#c8a060', '#8a9a70', '#d8cbb0', '#9a6a8a'];
      for (let r = 53, i = 0; r > 2; r -= 3.4, i++) {
        const col = cols[i % cols.length];
        ctx.strokeStyle = col; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.arc(64, 64, r, 0, TAU); ctx.stroke();
        // braid: alternating slanted strands
        const n = Math.max(6, Math.round(r * 1.6));
        for (let k = 0; k < n; k++) {
          const a = k / n * TAU, c = Math.cos(a), s = Math.sin(a);
          ctx.strokeStyle = k % 2 ? sh(col, 0.72) : sh(col, 1.15); ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(64 + c * (r - 1.6), 64 + s * (r - 1.6)); ctx.lineTo(64 + Math.cos(a + 1.5 / r) * (r + 1.6), 64 + Math.sin(a + 1.5 / r) * (r + 1.6)); ctx.stroke();
        }
      }
      grain(ctx, 6);
    });

    // ================= CEILINGS =================
    tex('ceil_plaster', (ctx) => {
      ctx.fillStyle = '#d8d0c0'; ctx.fillRect(0, 0, TS, TS);
      for (let i = 0; i < 40; i++) {
        const x = R() * TS, y = R() * TS, r = rr(6, 18);
        wrapXY((dx, dy) => { ctx.fillStyle = rad(ctx, x + dx, y + dy, 0, r, [[0, R() < 0.5 ? 'rgba(255,250,240,0.3)' : 'rgba(120,100,80,0.12)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); });
      }
      for (const bx of [-9, TS - 9, 55]) {
        ctx.fillStyle = 'rgba(40,25,10,0.35)'; ctx.fillRect(bx - 3, 0, 24, TS);
        wood(ctx, bx, 0, 18, TS, '#3e2818', { vert: true, grain: 9, knots: 1 });
        ctx.fillStyle = 'rgba(255,230,190,0.12)'; ctx.fillRect(bx + 3, 0, 3, TS);
      }
      grain(ctx, 8);
    });

    tex('ceil_attic', (ctx) => {
      for (let y = 0; y < TS; y += 16) wood(ctx, 0, y, TS, 16, sh('#4e3e2e', rr(0.75, 1.05)), { grain: 7 });
      // a gap in the roof boards: cold snow-light
      ctx.fillStyle = '#0a0806'; ctx.fillRect(12, 62, 40, 4);
      ctx.fillStyle = '#dceaff'; ctx.fillRect(16, 63, 30, 2.2);
      glow(ctx, 32, 64, 24, '200,225,255', 0.55);
      for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(245,250,255,0.9)'; ctx.fillRect(rr(14, 50), rr(56, 74), 1.2, 1.2); }
      ctx.fillStyle = 'rgba(240,248,255,0.85)'; ctx.fillRect(16, 66, 24, 1.5);
      // rafters
      for (const bx of [-10, TS - 10, 54]) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 3, 0, 26, TS);
        wood(ctx, bx, 0, 20, TS, '#5a4430', { vert: true, grain: 9, knots: 1 });
      }
      // cobweb between a rafter and the boards
      ctx.strokeStyle = 'rgba(220,220,220,0.35)'; ctx.lineWidth = 0.5;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(74, 20 + k * 4); ctx.quadraticCurveTo(84, 26 + k * 3, 96 - k * 3, 12); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, 0, TS, TS);
      grain(ctx, 12);
    });

    tex('ceil_mill', (ctx) => {
      for (let y = 0; y < TS; y += 16) wood(ctx, 0, y, TS, 16, sh('#5a4834', rr(0.7, 1)), { grain: 7 });
      ctx.fillStyle = 'rgba(230,226,216,0.15)'; ctx.fillRect(0, 0, TS, TS);
      // heavy beams at the seams
      for (const bx of [-12, TS - 12]) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 3, 0, 30, TS); wood(ctx, bx, 0, 24, TS, '#3e2c1c', { vert: true, grain: 10, knots: 2 }); }
      // the great turning shaft
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(40, 0, 48, TS);
      ctx.fillStyle = lin(ctx, 44, 0, 84, 0, [[0, '#1e140a'], [0.3, '#7a5a38'], [0.45, '#8a6a46'], [1, '#1e1408']]); ctx.fillRect(44, 0, 40, TS);
      for (let i = 0; i < 24; i++) { const gx = rr(46, 82); ctx.strokeStyle = 'rgba(25,12,4,' + rr(0.15, 0.4) + ')'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + Math.sin(i) * 0.6, TS); ctx.stroke(); }
      // iron bands and cogs on the shaft
      for (const y of [18, 82]) {
        ctx.fillStyle = lin(ctx, 44, 0, 84, 0, [[0, '#121216'], [0.35, '#70747e'], [1, '#101014']]); ctx.fillRect(43, y, 42, 8);
        for (let x = 46; x < 84; x += 6) { ctx.fillStyle = '#9aa0aa'; ctx.beginPath(); ctx.arc(x, y + 4, 1, 0, TAU); ctx.fill(); }
      }
      // flour dust caught on everything
      for (let i = 0; i < 300; i++) { ctx.fillStyle = 'rgba(235,230,220,' + rr(0.1, 0.4) + ')'; ctx.fillRect(R() * TS, R() * TS, 1, 1); }
      grain(ctx, 10);
    });
    // ================= PROPS (transparent billboards standing on the bottom edge) =================
    const prop = (name, f) => tex(name, (ctx) => { f(ctx); grain(ctx, 6); });
    function legs(ctx, xs, y0, y1, w, col) { for (const x of xs) wood(ctx, x, y0, w, y1 - y0, col, { vert: true, grain: 2 }); }
    // a table top seen slightly from above: front edge at y, depth d
    function top(ctx, x0, x1, y, d, col, inset) {
      inset = inset || 6;
      ctx.fillStyle = lin(ctx, 0, y - d, 0, y, [[0, sh(col, 0.85)], [1, sh(col, 1.2)]]);
      ctx.beginPath(); ctx.moveTo(x0 + inset, y - d); ctx.lineTo(x1 - inset, y - d); ctx.lineTo(x1, y); ctx.lineTo(x0, y); ctx.fill();
      ctx.strokeStyle = 'rgba(30,15,5,0.25)'; ctx.lineWidth = 0.6;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + inset * (1 - i / 4), y - d * (1 - i / 4)); ctx.lineTo(x1 - inset * (1 - i / 4), y - d * (1 - i / 4)); ctx.stroke(); }
      wood(ctx, x0, y, x1 - x0, 4, sh(col, 0.85), { grain: 2 });
    }

    prop('pr_bed', (ctx) => {
      // headboard behind
      wood(ctx, 18, 46, 92, 46, '#4a2c18', { vert: true, grain: 14 });
      ctx.fillStyle = '#4a2c18'; ctx.beginPath(); ctx.moveTo(18, 48); ctx.quadraticCurveTo(64, 30, 110, 48); ctx.fill();
      panel(ctx, 30, 50, 30, 30, '#5a3820'); panel(ctx, 68, 50, 30, 30, '#5a3820');
      // pillows
      for (const px of [42, 86]) { ctx.fillStyle = rad(ctx, px - 4, 74, 0, 20, [[0, '#ffffff'], [1, '#c8c4bc']]); ctx.beginPath(); ctx.ellipse(px, 78, 19, 8, 0, 0, TAU); ctx.fill(); }
      // quilt, receding top and front fall
      ctx.fillStyle = lin(ctx, 0, 82, 0, 100, [[0, '#7a2a30'], [1, '#a83a40']]);
      ctx.beginPath(); ctx.moveTo(22, 84); ctx.lineTo(106, 84); ctx.lineTo(114, 100); ctx.lineTo(14, 100); ctx.fill();
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(22, 84); ctx.lineTo(106, 84); ctx.lineTo(107, 88); ctx.lineTo(21, 88); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 100, 0, 118, [[0, '#a03840'], [1, '#6a2028']]); ctx.beginPath(); ctx.moveTo(14, 100); ctx.lineTo(114, 100); ctx.lineTo(116, 116); ctx.quadraticCurveTo(64, 120, 12, 116); ctx.fill();
      ctx.fillStyle = 'rgba(232,200,120,0.7)'; for (let x = 20; x < 110; x += 12) for (let y = 104; y < 116; y += 6) { ctx.beginPath(); ctx.arc(x + (y % 12 ? 6 : 0), y, 1.4, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(40,10,10,0.35)'; ctx.lineWidth = 0.7; for (let x = 26; x < 106; x += 14) { ctx.beginPath(); ctx.moveTo(x, 86); ctx.lineTo(x - 4, 100); ctx.stroke(); }
      // footboard and posts
      wood(ctx, 10, 110, 108, 12, '#3e2414', { grain: 4 });
      for (const x of [8, 114]) { wood(ctx, x, 84, 7, 44, '#3e2414', { vert: true, grain: 3 }); ctx.fillStyle = rad(ctx, x + 2.5, 82, 0, 5, [[0, '#8a5a30'], [1, '#2e1a0c']]); ctx.beginPath(); ctx.arc(x + 3.5, 83, 4.5, 0, TAU); ctx.fill(); }
      for (const x of [16, 108]) wood(ctx, x, 40, 6, 52, '#3e2414', { vert: true, grain: 3 });
    });

    prop('pr_bed_child', (ctx) => {
      wood(ctx, 34, 70, 60, 26, '#e8dcc0', { vert: true, grain: 3 });
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(64, 72, 30, Math.PI, TAU); ctx.fill();
      kidSun(ctx, 64, 62, 4, '#e8a030');
      ctx.fillStyle = rad(ctx, 58, 84, 0, 18, [[0, '#ffffff'], [1, '#c8c4bc']]); ctx.beginPath(); ctx.ellipse(64, 88, 18, 6, 0, 0, TAU); ctx.fill();
      // stuffed bear on the pillow
      const bx = 74, by = 82;
      ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.ellipse(bx, by + 4, 6, 6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by - 4, 5, 0, TAU); ctx.fill();
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(bx + d * 4, by - 8, 2, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#d8b080'; ctx.beginPath(); ctx.ellipse(bx, by - 2.5, 2.2, 1.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1008'; ctx.fillRect(bx - 2.2, by - 5.5, 1.2, 1.2); ctx.fillRect(bx + 1, by - 5.5, 1.2, 1.2); ctx.fillRect(bx - 0.5, by - 3.2, 1, 0.8);
      ctx.fillStyle = '#4a7ab0'; ctx.fillRect(bx - 4, by, 8, 1.5);
      // patchwork quilt
      const pcs = ['#e88a8a', '#8ab8e0', '#f0d070', '#a8d0a0', '#d8a8d8', '#f0f0e0'];
      ctx.save(); ctx.beginPath(); ctx.moveTo(36, 90); ctx.lineTo(92, 90); ctx.lineTo(98, 100); ctx.lineTo(99, 116); ctx.quadraticCurveTo(64, 119, 29, 116); ctx.lineTo(30, 100); ctx.closePath(); ctx.clip();
      for (let y = 88, r = 0; y < 120; y += 7, r++) for (let x = 26 + (r % 2) * 4; x < 102; x += 8) { ctx.fillStyle = pick(pcs); ctx.fillRect(x, y, 8, 7); ctx.strokeStyle = 'rgba(80,50,30,0.45)'; ctx.setLineDash([1, 1]); ctx.strokeRect(x + 0.5, y + 0.5, 7, 6); ctx.setLineDash([]); }
      ctx.fillStyle = lin(ctx, 0, 90, 0, 118, [[0, 'rgba(255,255,255,0.15)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(26, 88, 76, 32);
      ctx.restore();
      wood(ctx, 30, 114, 68, 8, '#e0d2b4', { grain: 3 });
      for (const x of [28, 96]) wood(ctx, x, 92, 5, 36, '#d8c8a8', { vert: true, grain: 2 });
      for (const x of [33, 90]) wood(ctx, x, 56, 5, 40, '#d8c8a8', { vert: true, grain: 2 });
    });

    prop('pr_table', (ctx) => {
      legs(ctx, [22, 100], 92, 128, 6, '#4a2e1a');
      legs(ctx, [30, 92], 92, 122, 5, '#3a2212');
      wood(ctx, 20, 92, 88, 6, '#4a2e1a', { grain: 2 });
      top(ctx, 12, 116, 88, 8, '#7a4c2c');
      ctx.fillStyle = '#b08a3a'; ctx.beginPath(); ctx.ellipse(64, 84, 6, 1.8, 0, 0, TAU); ctx.fill(); ctx.fillRect(62.5, 76, 3, 8);
      candle(ctx, 64, 77, 12, 4, true);
      ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.ellipse(38, 85, 7, 1.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(88, 85); ctx.lineTo(96, 85); ctx.lineTo(95, 76); ctx.lineTo(89, 76); ctx.fill();
    });

    prop('pr_chair', (ctx) => {
      wood(ctx, 42, 54, 5, 74, '#5a3820', { vert: true, grain: 2 }); wood(ctx, 81, 54, 5, 74, '#5a3820', { vert: true, grain: 2 });
      wood(ctx, 40, 52, 48, 8, '#6a4224', { grain: 3 });
      for (const x of [52, 61, 70]) wood(ctx, x, 60, 5, 30, '#6a4224', { vert: true, grain: 2 });
      top(ctx, 36, 92, 98, 7, '#7a4c2c', 4);
      legs(ctx, [37, 86], 102, 128, 5, '#5a3820');
      wood(ctx, 40, 116, 48, 3, '#4a2e1a', { grain: 1 });
    });

    prop('pr_armchair', (ctx) => {
      const v = '#6a2a3a';
      const vel = (x0, y0, x1, y1) => lin(ctx, x0, y0, x1, y1, [[0, sh(v, 1.3)], [0.5, v], [1, sh(v, 0.6)]]);
      // back and wings
      ctx.fillStyle = vel(30, 0, 98, 0); ctx.beginPath(); ctx.moveTo(32, 100); ctx.lineTo(32, 50); ctx.quadraticCurveTo(64, 32, 96, 50); ctx.lineTo(96, 100); ctx.fill();
      for (const d of [-1, 1]) { const x = 64 + d * 38; ctx.fillStyle = vel(x - 8, 0, x + 8, 0); ctx.beginPath(); ctx.moveTo(x - d * 6, 54); ctx.quadraticCurveTo(x + d * 8, 56, x + d * 8, 72); ctx.lineTo(x + d * 6, 96); ctx.lineTo(x - d * 6, 96); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; for (const x of [48, 64, 80]) { ctx.beginPath(); ctx.moveTo(x, 46 + Math.abs(x - 64) * 0.2); ctx.lineTo(x, 88); ctx.stroke(); }
      for (const [x, y] of [[48, 62], [64, 58], [80, 62], [56, 74], [72, 74]]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, y, 1, 0, TAU); ctx.fill(); }
      // seat cushion
      ctx.fillStyle = lin(ctx, 0, 92, 0, 104, [[0, sh(v, 1.4)], [1, sh(v, 0.8)]]); ctx.beginPath(); ctx.roundRect(34, 92, 60, 12, 4); ctx.fill();
      ctx.fillStyle = vel(0, 104, 0, 120); ctx.fillRect(30, 102, 68, 16);
      // rolled arms
      for (const x of [22, 92]) {
        ctx.fillStyle = vel(x, 0, x + 14, 0); ctx.beginPath(); ctx.roundRect(x, 84, 14, 34, 4); ctx.fill();
        ctx.fillStyle = rad(ctx, x + 5, 85, 0, 9, [[0, sh(v, 1.5)], [1, sh(v, 0.7)]]); ctx.beginPath(); ctx.ellipse(x + 7, 86, 8, 5, 0, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#c8a050'; for (let x = 24; x < 106; x += 4) { ctx.beginPath(); ctx.arc(x, 117, 0.9, 0, TAU); ctx.fill(); }
      for (const x of [26, 98]) { ctx.fillStyle = '#2e1a0c'; ctx.beginPath(); ctx.moveTo(x, 118); ctx.lineTo(x + 5, 118); ctx.lineTo(x + 3.5, 128); ctx.lineTo(x + 1.5, 128); ctx.fill(); }
    });

    prop('pr_bookcase', (ctx) => {
      wood(ctx, 22, 12, 84, 116, '#3e2616', { vert: true, grain: 10 });
      ctx.fillStyle = '#140a06'; ctx.fillRect(28, 18, 72, 98);
      for (const yb of [40, 64, 88, 112]) { shelfBooks(ctx, 29, 99, yb, 20, { objects: true }); ctx.fillStyle = lin(ctx, 0, yb - 22, 0, yb - 14, [[0, 'rgba(0,0,0,0.65)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(28, yb - 22, 72, 8); }
      for (const y of [40, 64, 88, 112]) wood(ctx, 28, y, 72, 4, '#5a3820', { grain: 2 });
      wood(ctx, 18, 6, 92, 8, '#4a2e1a', { grain: 3 }); ctx.fillStyle = sh('#4a2e1a', 1.5); ctx.fillRect(18, 6, 92, 1);
      wood(ctx, 20, 116, 88, 12, '#4a2e1a', { grain: 3 });
    });

    prop('pr_wardrobe', (ctx) => {
      wood(ctx, 22, 14, 84, 108, '#4a2c18', { vert: true, grain: 12 });
      for (const x of [27, 66]) { panel(ctx, x, 22, 35, 90, '#5a3820'); }
      ctx.fillStyle = '#1a0e06'; ctx.fillRect(63.5, 18, 1, 98);
      for (const x of [60, 68]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, 66, 1.8, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#1a0e06'; ctx.fillRect(61, 70, 1, 3);
      // cornice
      wood(ctx, 16, 6, 96, 9, '#3a2010', { grain: 3 }); ctx.fillStyle = sh('#3a2010', 1.6); ctx.fillRect(16, 6, 96, 1);
      ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.moveTo(40, 6); ctx.quadraticCurveTo(64, -2, 88, 6); ctx.fill();
      wood(ctx, 20, 116, 88, 6, '#3a2010', { grain: 2 });
      for (const x of [22, 98]) { ctx.fillStyle = '#2a160a'; ctx.beginPath(); ctx.moveTo(x, 122); ctx.lineTo(x + 8, 122); ctx.quadraticCurveTo(x + 4, 124, x + 6, 128); ctx.lineTo(x + 2, 128); ctx.quadraticCurveTo(x + 4, 124, x, 122); ctx.fill(); }
    });

    prop('pr_dresser', (ctx) => {
      wood(ctx, 26, 78, 76, 46, '#5a3820', { vert: true, grain: 8 });
      for (const y of [82, 96, 110]) { panel(ctx, 30, y, 68, 12, '#6a4428'); for (const x of [46, 82]) { ctx.fillStyle = rad(ctx, x - 0.5, y + 5.5, 0, 2.4, [[0, '#fff0b0'], [1, '#8a6a20']]); ctx.beginPath(); ctx.arc(x, y + 6, 2, 0, TAU); ctx.fill(); } }
      top(ctx, 22, 106, 78, 5, '#6a4428', 3);
      for (const x of [28, 94]) { ctx.fillStyle = '#3a2010'; ctx.fillRect(x, 124, 6, 4); }
      // basin and jug
      ctx.fillStyle = lin(ctx, 46, 0, 76, 0, [[0, '#b8bcc4'], [0.4, '#ffffff'], [1, '#a0a4ac']]); ctx.beginPath(); ctx.moveTo(44, 68); ctx.quadraticCurveTo(60, 82, 76, 68); ctx.fill();
      ctx.fillStyle = '#4a6a9a'; ctx.beginPath(); ctx.ellipse(60, 68, 16, 2.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.ellipse(60, 68, 14.5, 1.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = lin(ctx, 78, 0, 92, 0, [[0, '#b8bcc4'], [0.4, '#ffffff'], [1, '#a0a4ac']]); ctx.beginPath(); ctx.moveTo(81, 76); ctx.quadraticCurveTo(76, 66, 82, 56); ctx.lineTo(88, 56); ctx.lineTo(92, 53); ctx.lineTo(90, 58); ctx.quadraticCurveTo(95, 66, 90, 76); ctx.fill();
      ctx.fillStyle = '#4a6a9a'; ctx.fillRect(80, 64, 11, 2);
      ctx.strokeStyle = '#d8dce4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(80, 64, 4, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(30, 74, 10, 2);
    });

    prop('pr_counter', (ctx) => {
      wood(ctx, 6, 80, 116, 46, '#5a3820', { grain: 14 });
      for (let x = 10; x < 118; x += 27) panel(ctx, x, 86, 23, 34, '#6a4428');
      top(ctx, 2, 126, 80, 6, '#7a4c2c', 3);
      wood(ctx, 4, 124, 120, 4, '#3a2010', { grain: 1 });
      // service bell
      ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(30, 77, 8, 2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rad(ctx, 28, 70, 0, 9, [[0, '#fff2b0'], [0.5, '#d0a040'], [1, '#6a4a10']]); ctx.beginPath(); ctx.arc(30, 76, 7, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(29, 67, 2, 2.5);
      // small clock
      wood(ctx, 84, 60, 18, 18, '#3a2010', { grain: 3 }); ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.moveTo(84, 60); ctx.quadraticCurveTo(93, 52, 102, 60); ctx.fill();
      clockFace(ctx, 93, 66, 6.5, { rim: '#c8a050', h: 4, m: 50 });
      // ledger
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(46, 78); ctx.lineTo(72, 78); ctx.lineTo(70, 74); ctx.lineTo(48, 74); ctx.fill();
      ctx.fillStyle = '#5a1a20'; ctx.fillRect(46, 78, 26, 1.5);
    });

    prop('pr_workbench', (ctx) => {
      legs(ctx, [10, 112], 86, 128, 6, '#4a3020');
      wood(ctx, 8, 112, 112, 4, '#4a3020', { grain: 1 });
      wood(ctx, 14, 92, 100, 18, '#5a3a22', { grain: 4 }); ctx.fillStyle = '#c8a050'; for (const x of [40, 88]) { ctx.beginPath(); ctx.arc(x, 101, 1.6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#1a0e06'; ctx.fillRect(14, 100.5, 100, 0.8);
      top(ctx, 4, 124, 88, 7, '#7a5634', 4);
      // gears and parts
      gear(ctx, 42, 82, 6, 10, '#c09440', { spokes: 4 });
      gear(ctx, 54, 84, 4, 8, '#b0b4bc', { spokes: 0 });
      ctx.fillStyle = '#8a8e96'; ctx.fillRect(60, 84, 8, 1); ctx.fillRect(70, 83, 1.2, 4);
      ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.arc(80, 84, 3.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b08a3a'; ctx.stroke();
      // vise
      ctx.fillStyle = '#4a4e56'; ctx.fillRect(104, 76, 12, 10); ctx.fillStyle = '#6a6e78'; ctx.fillRect(104, 76, 12, 2); ctx.fillStyle = '#8a8e98'; ctx.fillRect(116, 80, 8, 1.5);
      // magnifier lamp on an arm
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(18, 84); ctx.lineTo(22, 50); ctx.lineTo(40, 40); ctx.stroke();
      ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(18, 84, 6, 2, 0, 0, TAU); ctx.fill();
      glow(ctx, 44, 52, 24, '255,210,120', 0.55);
      ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.moveTo(34, 36); ctx.lineTo(48, 36); ctx.lineTo(52, 44); ctx.lineTo(30, 44); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(32, 44, 18, 1.5);
      ctx.strokeStyle = '#b08a3a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(44, 58, 8, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(210,235,255,0.6)'; ctx.beginPath(); ctx.arc(44, 58, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(44, 58, 5, 3.6, 4.6); ctx.stroke();
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(40, 44); ctx.lineTo(42, 50); ctx.stroke();
    });

    prop('pr_cupboard', (ctx) => {
      // upper rack with plates
      wood(ctx, 22, 22, 84, 62, '#4a2e1a', { vert: true, grain: 8 });
      ctx.fillStyle = '#2a180c'; ctx.fillRect(27, 26, 74, 56);
      for (const y of [44, 64]) wood(ctx, 27, y, 74, 3, '#5a3820', { grain: 1 });
      const plate = (x, y, r, col) => { ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r - 1.4, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(x + 1, y + 1, r * 0.5, 0, TAU); ctx.fill(); };
      for (let x = 34; x < 100; x += 13) plate(x, 36, 7, '#3a5a9a');
      for (let x = 36; x < 96; x += 15) plate(x, 56, 6, '#9a3a3a');
      for (let x = 32; x < 98; x += 10) { ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.roundRect(x, 72, 7, 8, 1.5); ctx.fill(); ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 7.5, 76, 2, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = '#3a5a9a'; ctx.fillRect(x, 74, 7, 1); }
      // pediment
      wood(ctx, 18, 14, 92, 8, '#3a2010', { grain: 3 }); ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.moveTo(30, 14); ctx.quadraticCurveTo(64, 2, 98, 14); ctx.fill();
      // lower cabinet
      top(ctx, 16, 112, 88, 4, '#6a4428', 3);
      wood(ctx, 18, 92, 92, 34, '#4a2e1a', { vert: true, grain: 8 });
      panel(ctx, 22, 96, 40, 26, '#5a3820'); panel(ctx, 66, 96, 40, 26, '#5a3820');
      for (const x of [58, 70]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, 108, 1.6, 0, TAU); ctx.fill(); }
      wood(ctx, 16, 124, 96, 4, '#3a2010', { grain: 1 });
    });

    prop('pr_stove', (ctx) => {
      // stovepipe up to the ceiling
      ctx.fillStyle = lin(ctx, 56, 0, 72, 0, [[0, '#141416'], [0.4, '#4a4a52'], [1, '#101012']]); ctx.fillRect(57, 0, 14, 60);
      for (const y of [16, 40]) { ctx.fillStyle = '#5a5a62'; ctx.fillRect(55, y, 18, 3); }
      glow(ctx, 64, 104, 56, '255,130,40', 0.45);
      // body
      ctx.fillStyle = lin(ctx, 18, 0, 110, 0, [[0, '#18181c'], [0.3, '#3a3a42'], [0.7, '#2a2a30'], [1, '#121214']]); ctx.beginPath(); ctx.roundRect(20, 62, 88, 60, 3); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 56, 0, 64, [[0, '#5a5a64'], [1, '#2a2a30']]); ctx.fillRect(16, 58, 96, 6);
      ctx.fillStyle = '#7a7a84'; ctx.fillRect(16, 58, 96, 1);
      // firebox door with a glowing grate
      ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.roundRect(30, 76, 36, 30, 3); ctx.fill();
      ctx.fillStyle = rad(ctx, 48, 96, 0, 22, [[0, '#fff0a0'], [0.4, '#ff9a30'], [1, '#a02a08']]); ctx.beginPath(); ctx.roundRect(33, 79, 30, 24, 2); ctx.fill();
      fire(ctx, 48, 102, 22, 18);
      ctx.fillStyle = '#1a1a1e'; for (let x = 35; x < 63; x += 5) ctx.fillRect(x, 79, 1.6, 24);
      ctx.strokeStyle = '#6a6a74'; ctx.lineWidth = 1.5; ctx.strokeRect(30.5, 76.5, 35, 29);
      // oven door
      ctx.fillStyle = lin(ctx, 0, 76, 0, 106, [[0, '#4a4a54'], [1, '#222228']]); ctx.beginPath(); ctx.roundRect(72, 76, 30, 30, 3); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(80, 80, 14, 2.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(74.5, 84.5, 25, 19);
      // feet and ash tray
      ctx.fillStyle = '#18181c'; for (const x of [22, 100]) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x + 8, 120); ctx.lineTo(x + 6, 128); ctx.lineTo(x + 2, 128); ctx.fill(); }
      ctx.fillStyle = '#ff8a30'; ctx.fillRect(36, 110, 24, 2);
      // kettle
      ctx.fillStyle = lin(ctx, 78, 0, 102, 0, [[0, '#6a2e14'], [0.35, '#f0a070'], [1, '#5a2410']]); ctx.beginPath(); ctx.moveTo(80, 58); ctx.quadraticCurveTo(78, 44, 90, 44); ctx.quadraticCurveTo(102, 44, 100, 58); ctx.fill();
      ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(90, 44, 7, Math.PI, TAU); ctx.stroke();
      ctx.fillStyle = '#b06030'; ctx.beginPath(); ctx.moveTo(80, 52); ctx.lineTo(72, 46); ctx.lineTo(74, 45); ctx.lineTo(81, 49); ctx.fill();
      ctx.strokeStyle = 'rgba(240,240,240,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(72, 44); ctx.quadraticCurveTo(68, 38, 72, 32); ctx.quadraticCurveTo(76, 26, 72, 20); ctx.stroke();
    });

    prop('pr_millstone', (ctx) => {
      // bed stone (wide, low) with the runner stone on top, seen a little from above
      const stone = (y, h, rx, ry, base) => {
        ctx.fillStyle = lin(ctx, 64 - rx, 0, 64 + rx, 0, [[0, sh(base, 0.5)], [0.35, sh(base, 1.1)], [1, sh(base, 0.45)]]);
        ctx.fillRect(64 - rx, y, 2 * rx, h);
        ctx.beginPath(); ctx.ellipse(64, y + h, rx, ry, 0, 0, Math.PI); ctx.fill();
        for (let i = 0; i < 40; i++) { ctx.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)'; ctx.fillRect(rr(64 - rx + 2, 64 + rx - 2), rr(y, y + h + ry * 0.6), 1.5, 1.5); }
        ctx.fillStyle = rad(ctx, 54, y - 2, 0, rx, [[0, sh(base, 1.25)], [1, sh(base, 0.9)]]); ctx.beginPath(); ctx.ellipse(64, y, rx, ry, 0, 0, TAU); ctx.fill();
      };
      stone(104, 12, 60, 7, '#6a645c');
      stone(78, 20, 50, 12, '#7a7468');
      // dressing grooves (harps) on the runner, curved, never crossing
      ctx.strokeStyle = 'rgba(30,26,22,0.55)'; ctx.lineWidth = 0.9;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * 10, 78 + Math.sin(a) * 2.4); ctx.quadraticCurveTo(64 + Math.cos(a + 0.35) * 30, 78 + Math.sin(a + 0.35) * 7, 64 + Math.cos(a + 0.5) * 47, 78 + Math.sin(a + 0.5) * 11); ctx.stroke(); }
      ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.ellipse(64, 78, 8, 2.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a3a40'; ctx.fillRect(62, 56, 4, 22); ctx.fillStyle = '#5a5a62'; ctx.fillRect(56, 56, 16, 3);
      // ice: rime patches on the face, icicles from the runner's edge
      for (const [x, y, r] of [[40, 76, 14], [84, 80, 16], [64, 84, 10]]) { ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, 'rgba(230,242,255,0.85)'], [1, 'rgba(230,242,255,0)']]); ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.25); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.restore(); ctx.fill(); }
      for (let x = 16; x < 112; x += rr(4, 8)) { const l = rr(4, 11) * (1.1 - Math.abs(x - 64) / 64); ctx.fillStyle = 'rgba(220,240,255,0.95)'; const yb = 98 + Math.sqrt(Math.max(0, 1 - ((x - 64) / 50) ** 2)) * 12; ctx.beginPath(); ctx.moveTo(x, yb - 1); ctx.lineTo(x + 2.6, yb - 1); ctx.lineTo(x + 1.3, yb + l); ctx.fill(); }
      for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(235,245,255,' + rr(0.4, 0.9) + ')'; ctx.fillRect(rr(10, 118), rr(80, 122), 1.5, 1); }
      // roots hugging the stones, rising from the floor
      ctx.lineCap = 'round';
      for (const [x0, dir, len] of [[8, 1, 1], [120, -1, 1], [34, 1, 0.6], [96, -1, 0.7]]) {
        ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(x0, 128); ctx.bezierCurveTo(x0 + dir * 3, 120, x0 + dir * 1, 112, x0 + dir * 6, 106);
        ctx.bezierCurveTo(x0 + dir * 10, 100, x0 + dir * 8 * len, 94, x0 + dir * 16 * len, 88); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,220,170,0.25)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + dir * 6, 106); ctx.quadraticCurveTo(x0 + dir * 16, 110, x0 + dir * 22, 104); ctx.stroke();
      }
      ctx.lineCap = 'butt';
      ctx.fillStyle = 'rgba(230,226,216,0.85)'; ctx.beginPath(); ctx.ellipse(64, 126.5, 54, 2, 0, 0, TAU); ctx.fill();
    });

    prop('pr_sacks', (ctx) => {
      const sack = (x, y, w, h, tone, burst) => {
        const c = sh('#b09a6a', tone);
        ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, sh(c, 0.6)], [0.4, sh(c, 1.15)], [1, sh(c, 0.55)]]);
        ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h);
        ctx.quadraticCurveTo(x - w * 0.55, y - h * 0.6, x - w / 2, y - h * 0.2); ctx.quadraticCurveTo(x - w / 2, y, x, y); ctx.quadraticCurveTo(x + w / 2, y, x + w / 2, y - h * 0.2);
        ctx.quadraticCurveTo(x + w * 0.55, y - h * 0.6, x + w * 0.3, y - h); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,20,0.25)'; ctx.lineWidth = 0.5; for (let yy = y - h + 3; yy < y; yy += 2) { ctx.beginPath(); ctx.moveTo(x - w * 0.45, yy); ctx.lineTo(x + w * 0.45, yy); ctx.stroke(); }
        // tied neck
        ctx.fillStyle = sh(c, 0.9); ctx.beginPath(); ctx.moveTo(x - 4, y - h); ctx.lineTo(x - 6, y - h - 7); ctx.lineTo(x + 6, y - h - 7); ctx.lineTo(x + 4, y - h); ctx.fill();
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 5, y - h - 1.5, 10, 2);
        ctx.fillStyle = 'rgba(120,40,30,0.6)'; ctx.font = 'bold 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('B', x, y - h * 0.45);
        if (burst) {
          ctx.fillStyle = '#2a1e10'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, y - h * 0.35); ctx.lineTo(x + w * 0.3, y - h * 0.45); ctx.lineTo(x + w * 0.42, y - h * 0.25); ctx.lineTo(x + w * 0.2, y - h * 0.2); ctx.fill();
          ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - h * 0.3); ctx.quadraticCurveTo(x + w * 0.6, y - 4, x + w * 0.9, y); ctx.lineTo(x + w * 0.1, y); ctx.fill();
        }
      };
      sack(30, 128, 34, 40, 0.9); sack(98, 128, 34, 38, 1.0, true); sack(64, 128, 36, 44, 1.08);
      sack(46, 92, 30, 34, 0.95); sack(82, 94, 30, 32, 0.85);
      ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.ellipse(116, 126, 12, 2.5, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 30; i++) { ctx.fillStyle = '#c8a050'; ctx.fillRect(rr(100, 126), rr(120, 127), 1.4, 1); }
    });

    prop('pr_gearwheel', (ctx) => {
      // timber stand
      wood(ctx, 56, 70, 16, 58, '#3a2614', { vert: true, grain: 4 });
      wood(ctx, 16, 118, 96, 10, '#3a2614', { grain: 3 });
      // big wooden cog wheel: rim with pegged cogs, six spokes
      const cx = 64, cy = 64, r = 52;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, TAU); ctx.fill();
      for (let k = 0; k < 24; k++) {
        const a = k / 24 * TAU; ctx.save(); ctx.translate(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2)); ctx.rotate(a);
        wood(ctx, 0, -3, 8, 6, '#8a6a40', { grain: 1 }); ctx.restore();
      }
      ctx.strokeStyle = '#5a3c20'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,170,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r - 2, Math.PI * 1.0, Math.PI * 1.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r - 11, 0, TAU); ctx.stroke();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); wood(ctx, 0, -3.5, r - 10, 7, '#5a3c20', { grain: 2 }); ctx.restore(); }
      ctx.fillStyle = rad(ctx, cx - 3, cy - 3, 0, 12, [[0, '#7a5a38'], [1, '#2a1a0c']]); ctx.beginPath(); ctx.arc(cx, cy, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a3a40'; ctx.fillRect(cx - 5, cy - 5, 10, 10);
      // frost on the upper rim
      ctx.strokeStyle = 'rgba(230,242,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 1, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    });

    prop('pr_trunk', (ctx) => {
      wood(ctx, 22, 92, 84, 34, '#5a3a20', { grain: 8 });
      ctx.fillStyle = lin(ctx, 0, 74, 0, 92, [[0, '#7a5030'], [1, '#4a2e18']]); ctx.beginPath(); ctx.moveTo(22, 92); ctx.quadraticCurveTo(22, 74, 40, 74); ctx.lineTo(88, 74); ctx.quadraticCurveTo(106, 74, 106, 92); ctx.fill();
      ctx.fillStyle = '#1a0e06'; ctx.fillRect(22, 91, 84, 1.5);
      for (const x of [36, 88]) { ctx.fillStyle = lin(ctx, x, 0, x + 6, 0, [[0, '#2a1a10'], [0.5, '#5a3a24'], [1, '#2a1a10']]); ctx.beginPath(); ctx.moveTo(x, 126); ctx.lineTo(x, 80); ctx.quadraticCurveTo(x, 75, x + 3, 74.5); ctx.lineTo(x + 6, 74.5); ctx.lineTo(x + 6, 126); ctx.fill(); ctx.fillStyle = '#c8a050'; ctx.fillRect(x + 1, 100, 4, 3); }
      for (const [x, y] of [[22, 92], [100, 92], [22, 120], [100, 120]]) { ctx.fillStyle = '#b08a3a'; ctx.fillRect(x, y, 6, 6); ctx.fillStyle = '#e8c870'; ctx.fillRect(x, y, 6, 1); }
      ctx.fillStyle = rad(ctx, 63, 94, 0, 6, [[0, '#fff0b0'], [1, '#8a6a20']]); ctx.beginPath(); ctx.roundRect(58, 88, 12, 12, 2); ctx.fill();
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.arc(64, 93, 1.3, 0, TAU); ctx.fill(); ctx.fillRect(63.4, 93, 1.2, 3);
      ctx.fillStyle = 'rgba(170,160,150,0.35)'; ctx.beginPath(); ctx.moveTo(30, 76); ctx.lineTo(98, 76); ctx.lineTo(96, 80); ctx.lineTo(32, 80); ctx.fill();
      wood(ctx, 20, 124, 88, 4, '#3a2010', { grain: 1 });
    });

    prop('pr_spinning_wheel', (ctx) => {
      // slanted bench on three legs
      ctx.save(); ctx.translate(60, 98); ctx.rotate(-0.12); wood(ctx, -42, -4, 80, 8, '#6a4428', { grain: 3 }); ctx.restore();
      ctx.lineCap = 'round'; ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(24, 102); ctx.lineTo(16, 127); ctx.moveTo(30, 102); ctx.lineTo(34, 127); ctx.moveTo(92, 92); ctx.lineTo(100, 127); ctx.stroke();
      // uprights holding the wheel
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(78, 94); ctx.lineTo(78, 52); ctx.moveTo(86, 92); ctx.lineTo(86, 52); ctx.stroke();
      // the wheel (ten spokes)
      const wx = 82, wy = 54, r = 28;
      ctx.strokeStyle = '#6a4428'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(wx, wy, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,170,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(wx, wy, r + 1, Math.PI, Math.PI * 1.6); ctx.stroke();
      ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 1.6;
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + 0.16; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 4, wy + Math.sin(a) * 4); ctx.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r); ctx.stroke(); }
      ctx.fillStyle = '#4a2e18'; ctx.beginPath(); ctx.arc(wx, wy, 5, 0, TAU); ctx.fill();
      // drive band to the flyer
      ctx.strokeStyle = 'rgba(230,220,200,0.8)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(wx - r, wy); ctx.lineTo(32, 78); ctx.moveTo(wx - 2, wy - r); ctx.lineTo(32, 74); ctx.stroke();
      // flyer and bobbin, maiden posts
      ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, 98); ctx.lineTo(26, 70); ctx.moveTo(42, 96); ctx.lineTo(42, 70); ctx.stroke();
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(34, 76, 7, 4, 0, 0, TAU); ctx.fill();
      // distaff with fluffy wool
      ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 98); ctx.lineTo(18, 44); ctx.stroke();
      for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(245,240,230,0.95)'; ctx.beginPath(); ctx.arc(18 + rr(-5, 5), 48 + rr(-6, 8), rr(4, 6), 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(245,240,230,0.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(20, 56); ctx.quadraticCurveTo(26, 68, 32, 76); ctx.stroke();
      // treadle
      ctx.fillStyle = '#4a2e18'; ctx.beginPath(); ctx.moveTo(44, 124); ctx.lineTo(76, 124); ctx.lineTo(74, 127); ctx.lineTo(46, 127); ctx.fill();
      ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(70, 124); ctx.lineTo(wx + 2, wy + 4); ctx.stroke();
      ctx.lineCap = 'butt';
    });

    prop('pr_harp', (ctx) => {
      glow(ctx, 64, 64, 56, '200,225,255', 0.3);
      const sil = (x0, x1) => lin(ctx, x0, 0, x1, 0, [[0, '#7a8494'], [0.4, '#f4f8fc'], [0.7, '#b8c2ce'], [1, '#5a6474']]);
      // base
      ctx.fillStyle = sil(40, 92); ctx.beginPath(); ctx.ellipse(66, 122, 24, 4, 0, 0, TAU); ctx.fill(); ctx.fillRect(46, 118, 40, 5);
      // soundbox, diagonal from the base up to the right
      ctx.fillStyle = sil(60, 96); ctx.beginPath(); ctx.moveTo(56, 120); ctx.lineTo(70, 120); ctx.lineTo(96, 34); ctx.lineTo(90, 30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#c8d4e0'; ctx.lineWidth = 0.7; for (let t = 0.15; t < 1; t += 0.2) { ctx.beginPath(); ctx.arc(63 + t * 30, 120 - t * 88, 1.4, 0, TAU); ctx.stroke(); }
      // pillar on the left, slender and fluted
      ctx.fillStyle = sil(34, 42); ctx.fillRect(34, 30, 6, 90);
      ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.arc(37, 28, 5, 0, TAU); ctx.fill();
      flake(ctx, 37, 28, 3, '#8aa0b8', 0.8);
      // curved neck
      ctx.strokeStyle = sil(34, 96); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(37, 30); ctx.bezierCurveTo(52, 10, 66, 44, 94, 30); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(38, 27); ctx.bezierCurveTo(52, 7, 66, 41, 93, 27); ctx.stroke();
      ctx.lineCap = 'butt';
      // strings
      for (let i = 1; i < 12; i++) {
        const t = i / 12, sx = 40 + t * 52;
        const ny = (() => { const u = t; return 30 * (1 - u) * (1 - u) * (1 - u) + 3 * 18 * u * (1 - u) * (1 - u) + 3 * 40 * u * u * (1 - u) + 30 * u * u * u; })();
        const by = 120 - ((sx - 60) / 30) * 88;
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(200,80,80,0.9)' : 'rgba(240,248,255,0.9)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(sx, ny + 3); ctx.lineTo(sx, Math.min(by, 118)); ctx.stroke();
      }
    });

    prop('pr_dollhouse', (ctx) => {
      // low stand
      wood(ctx, 22, 112, 84, 6, '#5a3820', { grain: 2 });
      legs(ctx, [24, 98], 118, 128, 6, '#4a2e18');
      // the little house: blue walls, open front with two floors (dividers offset, never crossing)
      const x0 = 30, x1 = 98, y0 = 56, y1 = 112;
      ctx.fillStyle = '#9ab4c8'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = '#d8b0b4'; ctx.fillRect(x0 + 3, y0 + 3, x1 - x0 - 6, 23); ctx.fillStyle = '#f0dc94'; ctx.fillRect(x0 + 3, y0 + 30, x1 - x0 - 6, 23);
      ctx.fillStyle = '#e8eef4'; ctx.fillRect(x0, y0 + 26, x1 - x0, 4);
      ctx.fillStyle = '#7a94a8'; ctx.fillRect(78, y0 + 3, 2.5, 23); ctx.fillRect(52, y0 + 30, 2.5, 23);
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(x0 + 3, y0 + 24, x1 - x0 - 6, 2); ctx.fillRect(x0 + 3, y1 - 3, x1 - x0 - 6, 2);
      // tiny furniture and a tiny family
      ctx.fillStyle = '#7a2a30'; ctx.fillRect(84, y0 + 16, 10, 5); ctx.fillStyle = '#f0f0f0'; ctx.fillRect(84, y0 + 14, 3, 2);
      ctx.fillStyle = '#5a3820'; ctx.fillRect(36, y0 + 18, 12, 2); ctx.fillRect(37, y0 + 20, 1, 4); ctx.fillRect(46, y0 + 20, 1, 4);
      ctx.fillStyle = '#e8a030'; ctx.beginPath(); ctx.arc(62, y0 + 10, 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a5a60'; ctx.fillRect(34, y0 + 40, 12, 12); ctx.fillStyle = '#ff9a40'; ctx.fillRect(37, y0 + 45, 6, 5);
      for (const [fx, h, c, hair] of [[64, 11, '#2e3e60', '#d8dce4'], [70, 7, '#7a9ac0', '#e8ecf0'], [76, 10, '#b8c4d0', '#2a1c18']]) {
        ctx.fillStyle = c; ctx.fillRect(fx - 1.5, y1 - 3 - h + 3, 3, h - 3); ctx.fillStyle = '#ecd4c0'; ctx.beginPath(); ctx.arc(fx, y1 - 3 - h + 1.5, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = hair; ctx.fillRect(fx - 1.6, y1 - 3 - h, 3.2, 1);
      }
      // gable roof with snow and a chimney
      ctx.fillStyle = '#7a3a3a'; ctx.beginPath(); ctx.moveTo(x0 - 6, y0 + 1); ctx.lineTo(64, 22); ctx.lineTo(x1 + 6, y0 + 1); ctx.fill();
      ctx.fillStyle = '#9ab4c8'; ctx.beginPath(); ctx.moveTo(x0 + 6, y0); ctx.lineTo(64, 30); ctx.lineTo(x1 - 6, y0); ctx.fill();
      ctx.fillStyle = '#f0dc94'; ctx.beginPath(); ctx.arc(64, 46, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#f4f8fc'; ctx.beginPath(); ctx.moveTo(x0 - 6, y0 + 1); ctx.lineTo(64, 22); ctx.lineTo(x1 + 6, y0 + 1); ctx.lineTo(x1 + 4, y0 - 1); ctx.lineTo(64, 25); ctx.lineTo(x0 - 4, y0 - 1); ctx.fill();
      ctx.fillStyle = '#6a4a40'; ctx.fillRect(80, 24, 6, 14); ctx.fillStyle = '#f4f8fc'; ctx.fillRect(79, 23, 8, 2);
      ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    });

    prop('pr_rockinghorse', (ctx) => {
      // rockers
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, 110); ctx.quadraticCurveTo(64, 134, 114, 110); ctx.stroke();
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(16, 108.5); ctx.quadraticCurveTo(64, 131, 112, 108.5); ctx.stroke();
      // legs splayed to the rockers
      ctx.strokeStyle = '#d8d4cc'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(44, 82); ctx.lineTo(30, 116); ctx.moveTo(50, 82); ctx.lineTo(44, 120); ctx.moveTo(82, 82); ctx.lineTo(86, 120); ctx.moveTo(88, 80); ctx.lineTo(100, 116); ctx.stroke();
      ctx.lineCap = 'butt';
      // body, neck, head (dappled grey)
      ctx.fillStyle = lin(ctx, 0, 62, 0, 90, [[0, '#f4f0ea'], [1, '#b8b4ac']]);
      ctx.beginPath(); ctx.ellipse(66, 76, 28, 11, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(84, 72); ctx.quadraticCurveTo(92, 52, 96, 42); ctx.lineTo(106, 46); ctx.quadraticCurveTo(100, 62, 94, 76); ctx.fill();
      ctx.beginPath(); ctx.ellipse(106, 48, 11, 6, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(120,120,130,0.4)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(rr(44, 90), rr(70, 84), rr(1.5, 3), 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#1a1414'; ctx.beginPath(); ctx.arc(104, 45, 1.4, 0, TAU); ctx.fill(); ctx.fillRect(113, 50, 1.6, 1.4);
      ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.moveTo(98, 40); ctx.lineTo(100, 32); ctx.lineTo(103, 40); ctx.fill();
      // yarn mane and tail
      ctx.strokeStyle = '#8a4a20'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const t = i / 8, mx = 98 - t * 12, my = 40 + t * 30; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx - 6, my + 2, mx - 7, my + 7); ctx.stroke(); }
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(39, 72); ctx.quadraticCurveTo(30, 74 + i, 28 + i, 92 + i * 2); ctx.stroke(); }
      ctx.lineCap = 'butt';
      // red saddle and bridle
      ctx.fillStyle = '#a82a2a'; ctx.beginPath(); ctx.ellipse(66, 66, 12, 4, 0, 0, TAU); ctx.fill(); ctx.fillRect(58, 66, 16, 10);
      ctx.fillStyle = '#d8b060'; ctx.fillRect(58, 75, 16, 1.5);
      ctx.strokeStyle = '#a82a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(100, 43); ctx.quadraticCurveTo(108, 47, 114, 52); ctx.stroke();
    });

    prop('pr_lamp', (ctx) => {
      // tripod base and stem
      const brass = (x0, x1) => lin(ctx, x0, 0, x1, 0, [[0, '#6a4a18'], [0.4, '#f0d080'], [1, '#5a3a10']]);
      ctx.fillStyle = brass(44, 84); ctx.beginPath(); ctx.moveTo(64, 108); ctx.quadraticCurveTo(52, 118, 44, 127); ctx.lineTo(50, 127); ctx.quadraticCurveTo(58, 120, 64, 114); ctx.quadraticCurveTo(70, 120, 78, 127); ctx.lineTo(84, 127); ctx.quadraticCurveTo(76, 118, 64, 108); ctx.fill();
      ctx.fillStyle = brass(61, 67); ctx.fillRect(62, 40, 4, 72);
      for (const y of [60, 84, 106]) { ctx.fillStyle = brass(58, 70); ctx.beginPath(); ctx.ellipse(64, y, 4.5, 2.4, 0, 0, TAU); ctx.fill(); }
      // two curved arms rising in a U to the side candles (no horizontal bar)
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(42, 34); ctx.bezierCurveTo(42, 52, 52, 56, 64, 56); ctx.bezierCurveTo(76, 56, 86, 52, 86, 34); ctx.stroke();
      ctx.lineCap = 'butt';
      for (const [x, y] of [[42, 34], [64, 22], [86, 34]]) {
        ctx.fillStyle = brass(x - 6, x + 6); ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 2, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 3, y, 6, 4);
        candle(ctx, x, y, 12, 4, true);
      }
      ctx.fillStyle = brass(61, 67); ctx.fillRect(62, 22, 4, 20);
    });

    prop('pr_plant_frozen', (ctx) => {
      // terracotta pot
      ctx.fillStyle = lin(ctx, 42, 0, 86, 0, [[0, '#6a2e18'], [0.35, '#c06a40'], [1, '#5a2410']]); ctx.beginPath(); ctx.moveTo(44, 96); ctx.lineTo(84, 96); ctx.lineTo(78, 127); ctx.lineTo(50, 127); ctx.fill();
      ctx.fillStyle = lin(ctx, 40, 0, 88, 0, [[0, '#7a3a1e'], [0.35, '#d07a4a'], [1, '#6a2e14']]); ctx.fillRect(40, 92, 48, 7);
      ctx.fillStyle = 'rgba(230,240,255,0.8)'; ctx.fillRect(40, 91, 48, 2);
      // frozen leaves: pale, glassy, edged with rime
      const leaf = (x, y, a, l) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = lin(ctx, 0, -4, 0, 4, [[0, '#d8ecf4'], [0.5, '#7aa0a8'], [1, '#4a7078']]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * 0.5, -l * 0.28, l, 0); ctx.quadraticCurveTo(l * 0.5, l * 0.28, 0, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(245,250,255,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(l * 0.9, 0); ctx.stroke();
        ctx.restore();
      };
      ctx.strokeStyle = '#4a6a5a'; ctx.lineWidth = 1.8;
      const stems = [[-1.9, 70], [-1.6, 60], [-1.3, 66], [-1.1, 50], [-2.1, 52], [-1.45, 40], [-1.75, 46]];
      for (const [a, l] of stems) {
        const ex = 64 + Math.cos(a) * l * 0.8, ey = 94 + Math.sin(a) * l * 0.8;
        ctx.beginPath(); ctx.moveTo(64, 94); ctx.quadraticCurveTo(64 + Math.cos(a) * l * 0.3, 94 + Math.sin(a) * l * 0.5, ex, ey); ctx.stroke();
        leaf(ex, ey, a + rr(-0.6, 0.6), rr(14, 22));
        leaf(64 + Math.cos(a) * l * 0.5, 94 + Math.sin(a) * l * 0.5, a + (R() < 0.5 ? 0.9 : -0.9), rr(10, 16));
      }
      for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(245,250,255,' + rr(0.5, 1) + ')'; ctx.fillRect(rr(30, 98), rr(20, 94), 1.2, 1.2); }
      for (const x of [48, 58, 70, 80]) { ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.beginPath(); ctx.moveTo(x, 99); ctx.lineTo(x + 2.5, 99); ctx.lineTo(x + 1.2, 99 + rr(4, 8)); ctx.fill(); }
    });

    prop('pr_desk', (ctx) => {
      // pigeonhole hutch behind
      wood(ctx, 28, 52, 72, 30, '#4a2e1a', { grain: 6 });
      ctx.fillStyle = '#1a0e06'; for (let i = 0; i < 4; i++) ctx.fillRect(32 + i * 17, 56, 14, 22);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#e8dcc0' : '#d8c8a0'; ctx.fillRect(34 + i * 17, 68, 10, 10); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(34 + i * 17, 70, 10, 0.6); }
      // desk body with drawers
      wood(ctx, 14, 90, 100, 14, '#5a3820', { grain: 4 });
      for (const x of [18, 86]) { panel(ctx, x, 92, 24, 10, '#6a4428'); ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x + 12, 97, 1.4, 0, TAU); ctx.fill(); }
      legs(ctx, [16, 106], 104, 128, 6, '#4a2e1a');
      top(ctx, 10, 118, 88, 8, '#6a4428', 4);
      // open journal
      ctx.fillStyle = '#5a1a20'; ctx.beginPath(); ctx.moveTo(40, 86); ctx.lineTo(80, 86); ctx.lineTo(78, 80); ctx.lineTo(42, 80); ctx.fill();
      ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(42, 85); ctx.quadraticCurveTo(51, 82, 60, 84.5); ctx.lineTo(60, 79); ctx.quadraticCurveTo(51, 77, 44, 79.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(78, 85); ctx.quadraticCurveTo(69, 82, 60, 84.5); ctx.lineTo(60, 79); ctx.quadraticCurveTo(69, 77, 76, 79.5); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,40,0.6)'; for (let k = 0; k < 3; k++) { ctx.fillRect(46, 80 + k * 1.4, 11, 0.5); ctx.fillRect(63, 80 + k * 1.4, 11, 0.5); }
      // inkwell and quill
      ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.roundRect(88, 78, 8, 7, 2); ctx.fill(); ctx.fillStyle = '#c8a050'; ctx.fillRect(89.5, 76.5, 5, 2);
      ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(92, 77); ctx.quadraticCurveTo(98, 66, 104, 58); ctx.stroke();
      ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(93, 75); ctx.quadraticCurveTo(99, 66, 104, 58); ctx.stroke(); ctx.lineCap = 'butt';
      candle(ctx, 24, 84, 9, 3.5, true); ctx.fillStyle = '#b08a3a'; ctx.beginPath(); ctx.ellipse(24, 84, 4, 1.2, 0, 0, TAU); ctx.fill();
    });

    prop('pr_dining', (ctx) => {
      // three chair backs: left, centre-back, right
      for (const [x, w] of [[12, 22], [53, 22], [94, 22]]) { wood(ctx, x, 62, w, 6, '#4a2e1a', { grain: 2 }); for (const sx of [x + 2, x + w - 6, x + w / 2 - 2]) wood(ctx, sx, 66, 4, 22, '#4a2e1a', { vert: true, grain: 1 }); }
      // table under a white cloth
      ctx.fillStyle = lin(ctx, 0, 76, 0, 88, [[0, '#c8ccd0'], [1, '#f4f6f8']]); ctx.beginPath(); ctx.moveTo(14, 78); ctx.lineTo(114, 78); ctx.lineTo(124, 90); ctx.lineTo(4, 90); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 90, 0, 112, [[0, '#f0f2f4'], [1, '#b8bec6']]); ctx.beginPath(); ctx.moveTo(4, 90); ctx.lineTo(124, 90); ctx.lineTo(124, 108); ctx.quadraticCurveTo(110, 112, 96, 108); ctx.quadraticCurveTo(80, 112, 64, 108); ctx.quadraticCurveTo(48, 112, 32, 108); ctx.quadraticCurveTo(18, 112, 4, 108); ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,140,0.4)'; ctx.lineWidth = 0.8; for (const x of [32, 64, 96]) { ctx.beginPath(); ctx.moveTo(x, 92); ctx.lineTo(x, 108); ctx.stroke(); }
      legs(ctx, [8, 114], 108, 128, 6, '#4a2e1a');
      // three place settings, frosted
      const plate = (x, y) => {
        ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.ellipse(x, y, 9, 2.6, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#6a8ab0'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(x, y, 7, 1.9, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(245,250,255,0.9)'; for (let i = 0; i < 6; i++) ctx.fillRect(x + rr(-7, 7), y + rr(-1.5, 1.5), 1.2, 0.8);
        ctx.fillStyle = '#b8bcc4'; ctx.fillRect(x - 12, y - 2, 1, 4); ctx.fillRect(x + 11, y - 2, 1, 4);
        ctx.fillStyle = 'rgba(210,225,240,0.8)'; ctx.beginPath(); ctx.moveTo(x + 13, y - 9); ctx.lineTo(x + 18, y - 9); ctx.lineTo(x + 16, y - 4); ctx.lineTo(x + 15, y - 4); ctx.fill(); ctx.fillRect(x + 15, y - 4, 1, 3); ctx.fillRect(x + 13.5, y - 1.5, 4, 1);
      };
      plate(24, 85); plate(64, 81); plate(102, 85);
      // a cold candle, frosted
      ctx.fillStyle = '#b8bcc4'; ctx.beginPath(); ctx.ellipse(44, 83, 3.5, 1, 0, 0, TAU); ctx.fill();
      candle(ctx, 44, 83, 11, 3.5, false, '#eef2f6');
      ctx.fillStyle = 'rgba(235,245,255,0.8)'; ctx.fillRect(4, 89, 120, 1.2);
      for (let x = 6; x < 124; x += rr(5, 10)) { ctx.fillStyle = 'rgba(225,240,255,0.85)'; ctx.beginPath(); ctx.moveTo(x, 108); ctx.lineTo(x + 2, 108); ctx.lineTo(x + 1, 108 + rr(2, 6)); ctx.fill(); }
    });

    prop('pr_vanity', (ctx) => {
      // oval mirror on a stand
      ctx.fillStyle = '#4a2e1a'; ctx.fillRect(38, 70, 4, 18); ctx.fillRect(86, 70, 4, 18);
      ctx.fillStyle = lin(ctx, 38, 0, 90, 0, [[0, '#6a4a18'], [0.4, '#e8c870'], [1, '#5a3a10']]); ctx.beginPath(); ctx.ellipse(64, 50, 25, 32, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 20, 0, 80, [[0, '#8a9aaa'], [1, '#3a4450']]); ctx.beginPath(); ctx.ellipse(64, 50, 21, 28, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(50, 60); ctx.lineTo(55, 60); ctx.lineTo(66, 28); ctx.lineTo(61, 28); ctx.fill();
      ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.arc(64, 17, 3, 0, TAU); ctx.fill();
      // table with curved legs and a drawer
      top(ctx, 18, 110, 90, 6, '#6a4428', 4);
      wood(ctx, 22, 94, 84, 12, '#5a3820', { grain: 3 }); panel(ctx, 46, 95, 36, 9, '#6a4428');
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(64, 99.5, 1.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#4a2e1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(26, 106); ctx.quadraticCurveTo(20, 116, 26, 126); ctx.moveTo(102, 106); ctx.quadraticCurveTo(108, 116, 102, 126); ctx.stroke(); ctx.lineCap = 'butt';
      // bottles, brush, jewel box
      ctx.fillStyle = 'rgba(180,120,200,0.85)'; ctx.beginPath(); ctx.arc(30, 84, 4, 0, TAU); ctx.fill(); ctx.fillRect(29, 78, 2, 3);
      ctx.fillStyle = 'rgba(120,200,220,0.85)'; ctx.fillRect(36, 80, 5, 7); ctx.fillStyle = '#e8c870'; ctx.fillRect(37, 78, 3, 2);
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(94, 86, 6, 1.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3820'; ctx.fillRect(98, 85, 6, 1.4);
      ctx.fillStyle = '#7a2a3a'; ctx.fillRect(78, 82, 8, 5); ctx.fillStyle = '#e8c870'; ctx.fillRect(78, 82, 8, 1);
    });

    prop('pr_coatrack', (ctx) => {
      const pole = lin(ctx, 60, 0, 68, 0, [[0, '#2e1a0c'], [0.4, '#7a5030'], [1, '#2a160a']]);
      // tripod feet
      ctx.strokeStyle = '#3a2210'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(64, 112); ctx.quadraticCurveTo(52, 120, 42, 126); ctx.moveTo(64, 112); ctx.quadraticCurveTo(76, 120, 86, 126); ctx.moveTo(64, 112); ctx.lineTo(64, 127); ctx.stroke();
      ctx.fillStyle = pole; ctx.fillRect(61, 14, 6, 100);
      ctx.fillStyle = '#7a5030'; ctx.beginPath(); ctx.arc(64, 12, 4, 0, TAU); ctx.fill();
      // hooks curve upward at staggered heights (never a level bar across the pole)
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(61, 22); ctx.quadraticCurveTo(52, 24, 50, 16); ctx.moveTo(67, 30); ctx.quadraticCurveTo(76, 32, 78, 24); ctx.stroke();
      ctx.lineCap = 'butt';
      // a long dark cloak hanging from the left hook
      ctx.fillStyle = lin(ctx, 28, 0, 64, 0, [[0, '#1e2a3a'], [0.4, '#3a4e68'], [0.7, '#2a3a50'], [1, '#18202c']]);
      ctx.beginPath(); ctx.moveTo(50, 18); ctx.quadraticCurveTo(38, 24, 36, 40); ctx.quadraticCurveTo(30, 80, 28, 106); ctx.quadraticCurveTo(46, 110, 62, 104); ctx.quadraticCurveTo(60, 60, 58, 30); ctx.quadraticCurveTo(56, 20, 50, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; for (const x of [40, 48, 54]) { ctx.beginPath(); ctx.moveTo(x + 2, 34); ctx.quadraticCurveTo(x, 70, x - 2, 104); ctx.stroke(); }
      ctx.fillStyle = '#4a5e78'; ctx.beginPath(); ctx.moveTo(42, 22); ctx.quadraticCurveTo(50, 34, 60, 26); ctx.lineTo(58, 32); ctx.quadraticCurveTo(50, 40, 40, 30); ctx.fill();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(50, 33, 1.6, 0, TAU); ctx.fill();
      // the small child's coat on the lower right hook
      ctx.fillStyle = lin(ctx, 66, 0, 94, 0, [[0, '#8a1a20'], [0.4, '#d04a40'], [1, '#7a1418']]);
      ctx.beginPath(); ctx.moveTo(78, 26); ctx.quadraticCurveTo(70, 28, 68, 36); ctx.lineTo(66, 66); ctx.lineTo(92, 66); ctx.lineTo(90, 36); ctx.quadraticCurveTo(86, 28, 78, 26); ctx.fill();
      ctx.fillStyle = '#7a1418'; ctx.fillRect(66, 38, 4, 20); ctx.fillRect(88, 38, 4, 20);
      ctx.fillStyle = '#f0ece4'; ctx.fillRect(66, 64, 26, 3);
      for (const y of [40, 48, 56]) { ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.arc(79, y, 1.3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#f0ece4'; ctx.beginPath(); ctx.ellipse(78, 30, 6, 2.5, 0, 0, TAU); ctx.fill();
    });

    prop('pr_flourbin', (ctx) => {
      // a coopered bin with iron hoops
      ctx.fillStyle = lin(ctx, 30, 0, 98, 0, [[0, '#3a2814'], [0.35, '#8a6a44'], [1, '#2a1c0c']]);
      ctx.beginPath(); ctx.moveTo(34, 76); ctx.quadraticCurveTo(28, 100, 36, 126); ctx.lineTo(92, 126); ctx.quadraticCurveTo(100, 100, 94, 76); ctx.fill();
      ctx.strokeStyle = 'rgba(20,10,4,0.5)'; ctx.lineWidth = 0.8; for (let x = 40; x < 92; x += 7) { ctx.beginPath(); ctx.moveTo(x, 76); ctx.quadraticCurveTo(x + (x - 64) * 0.1, 100, x, 126); ctx.stroke(); }
      for (const y of [84, 116]) { ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(32, y); ctx.quadraticCurveTo(64, y + 3, 96, y); ctx.stroke(); }
      // full of flour, lid propped open
      ctx.fillStyle = '#2a1c0c'; ctx.beginPath(); ctx.ellipse(64, 76, 30, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.ellipse(64, 75, 27, 4.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f8f6f0'; ctx.beginPath(); ctx.ellipse(60, 73, 14, 3, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(94, 74); ctx.rotate(-1.2); wood(ctx, -4, -2, 36, 5, '#6a4a2a', { grain: 2 }); ctx.restore();
      // scoop
      ctx.fillStyle = lin(ctx, 50, 0, 66, 0, [[0, '#8a8e96'], [0.4, '#e8eaee'], [1, '#6a6e76']]); ctx.beginPath(); ctx.moveTo(48, 72); ctx.lineTo(62, 70); ctx.lineTo(60, 76); ctx.lineTo(50, 77); ctx.fill();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(38, 70, 11, 2.5);
      // flour dusting down the side and on the floor
      for (let i = 0; i < 160; i++) { ctx.fillStyle = 'rgba(242,238,228,' + rr(0.3, 0.8) + ')'; ctx.fillRect(rr(34, 94), 76 + Math.pow(R(), 1.5) * 50, 1, 1); }
      ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.ellipse(64, 126.5, 40, 2, 0, 0, TAU); ctx.fill();
    });
  });
})();
