// Texture core: canvas helpers, the pack registry and lazy decal compositing, plus the base stone set
// (dungeon walls, doors, floors, ceilings, interiors and realms) and the event billboards (stairs, chests, shrines...).
(function () {
  const TS = 128; // texture size
  const TX = { size: TS, data: {} };
  let rng = BT.U.seeded(777);

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w || TS;
    c.height = h || TS;
    c.getContext('2d', { willReadFrequently: true });
    return c;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function noise(ctx, amount, alpha, w, h) {
    w = w || TS; h = h || TS;
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng() - 0.5) * amount;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }
  function bricks(ctx, o) {
    const { bw, bh, base, mortar, vary, bevel } = o;
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, TS, TS);
    for (let row = 0; row * bh < TS; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = -bw; x < TS + bw; x += bw) {
        const f = 1 - vary / 2 + rng() * vary;
        ctx.fillStyle = shade(base, f);
        const bx = x + off + 1, by = row * bh + 1, w = bw - 2, h = bh - 2;
        ctx.fillRect(bx, by, w, h);
        if (bevel) {
          ctx.fillStyle = 'rgba(255,255,255,0.09)';
          ctx.fillRect(bx, by, w, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(bx, by + h - 2, w, 2);
        }
      }
    }
  }
  function grab(name, c) {
    const ctx = c.getContext('2d');
    const img = ctx.getImageData(0, 0, c.width, c.height);
    TX.data[name] = { w: c.width, h: c.height, px: new Uint32Array(img.data.buffer.slice(0)) };
    TX.data[name].canvas = c;
  }

  function plankDoor(ctx, wood, metal, arch) {
    const x0 = 30, x1 = 98, top = 26;
    ctx.save();
    ctx.beginPath();
    if (arch) {
      ctx.moveTo(x0, TS);
      ctx.lineTo(x0, top + 20);
      ctx.quadraticCurveTo(64, top - 14, x1, top + 20);
      ctx.lineTo(x1, TS);
    } else ctx.rect(x0, top, x1 - x0, TS - top);
    ctx.closePath();
    ctx.fillStyle = '#120a06';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1b130c';
    ctx.stroke();
    ctx.clip();
    for (let x = x0; x < x1; x += 11) {
      ctx.fillStyle = shade(wood, 0.8 + rng() * 0.35);
      ctx.fillRect(x, 0, 10, TS);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 10, 0, 1, TS);
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 1 + rng() * 8, rng() * TS, 1, 10 + rng() * 20);
      }
    }
    ctx.fillStyle = metal;
    ctx.fillRect(x0, top + 22, x1 - x0, 6);
    ctx.fillRect(x0, TS - 30, x1 - x0, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x0, top + 22, x1 - x0, 1);
    ctx.fillRect(x0, TS - 30, x1 - x0, 1);
    ctx.restore();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(84, 80, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---------- faith symbols (canvas) ----------
  function symSun(ctx, x, y, r, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fill();
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); ctx.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); ctx.stroke();
    }
    ctx.restore();
  }
  function symPale(ctx, x, y, r, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, r * 0.07);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 - Math.PI / 2;
      const ex = x + Math.cos(a) * r * 0.85, ey = y + Math.sin(a) * r * 0.85;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3); ctx.lineTo(ex, ey); ctx.stroke();
      const mx = x + Math.cos(a) * r * 0.6, my = y + Math.sin(a) * r * 0.6;
      for (const s of [-1, 1]) {
        const b = a + s * 0.7;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(b) * r * 0.2, my + Math.sin(b) * r * 0.2); ctx.stroke();
      }
    }
    // empty hourglass in the centre
    const h = r * 0.26;
    ctx.beginPath(); ctx.moveTo(x - h * 0.7, y - h); ctx.lineTo(x + h * 0.7, y - h); ctx.lineTo(x, y); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.7, y + h); ctx.lineTo(x + h * 0.7, y + h); ctx.lineTo(x, y); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  function symRoot(ctx, x, y, r, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    // trunk
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.35); ctx.lineTo(x, y - r * 0.25); ctx.stroke();
    // branches
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x, y - r * 0.1); ctx.quadraticCurveTo(x + s * r * 0.3, y - r * 0.35, x + s * r * 0.45, y - r * 0.6); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.25); ctx.lineTo(x, y - r * 0.7); ctx.stroke();
    // roots curling down into the ring
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x, y + r * 0.3); ctx.quadraticCurveTo(x + s * r * 0.25, y + r * 0.75, x + s * r * 0.72, y + r * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + r * 0.35); ctx.quadraticCurveTo(x + s * r * 0.1, y + r * 0.8, x + s * r * 0.3, y + r * 0.95); ctx.stroke();
    }
    ctx.restore();
  }
  TX.symbol = { dawn: symSun, pale: symPale, root: symRoot };

  // ---------- interiors & hidden realms ----------
  function makeInteriorTextures() {
    rng = BT.U.seeded(4242);
    let c, ctx;
    const tex = (name, f) => { c = canvas(); ctx = c.getContext('2d'); f(ctx); grab(name, c); };
    tex('woodwall', (ctx) => {
      for (let x = 0; x < TS; x += 16) { ctx.fillStyle = shade('#6a4a2c', 0.8 + rng() * 0.35); ctx.fillRect(x, 0, 16, TS); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 15, 0, 1, TS); }
      ctx.fillStyle = '#3d2716'; ctx.fillRect(0, 0, TS, 10); ctx.fillRect(0, 84, TS, 6);
      ctx.fillStyle = '#4a3020'; ctx.fillRect(0, 90, TS, 38);
      noise(ctx, 14);
    });
    tex('woodwall2', (ctx) => {
      ctx.drawImage(TX.data.woodwall.canvas, 0, 0);
      // shelf with books and a candle
      ctx.fillStyle = '#3d2716'; ctx.fillRect(14, 40, 100, 5); ctx.fillRect(14, 66, 100, 5);
      for (let x = 16; x < 110; x += 7) { ctx.fillStyle = ['#7a2a24', '#2b4a78', '#2f5d3a', '#6b5a20', '#5a3070'][rng.int(5)]; ctx.fillRect(x, 22 + rng.int(6), 6, 18 - rng.int(4)); ctx.fillRect(x, 49 + rng.int(4), 6, 17 - rng.int(4)); }
      ctx.fillStyle = '#f0e8d0'; ctx.fillRect(104, 28, 4, 12); ctx.fillStyle = '#ffcf6a'; ctx.fillRect(105, 24, 2, 4);
    });
    tex('planks', (ctx) => {
      for (let y = 0; y < TS; y += 16) for (let x = (y / 16) % 2 ? -32 : 0; x < TS; x += 64) { ctx.fillStyle = shade('#7a5634', 0.8 + rng() * 0.3); ctx.fillRect(x, y, 63, 15); }
      noise(ctx, 12);
    });
    tex('beams', (ctx) => {
      ctx.fillStyle = '#2e2014'; ctx.fillRect(0, 0, TS, TS);
      for (let x = 0; x < TS; x += 42) { ctx.fillStyle = '#4a3020'; ctx.fillRect(x, 0, 16, TS); }
      noise(ctx, 10);
    });
    tex('door_interior', (ctx) => { ctx.drawImage(TX.data.woodwall.canvas, 0, 0); plankDoor(ctx, '#5a3a20', '#2a2a2a', false); });
    tex('vault', (ctx) => {
      bricks(ctx, { bw: 42, bh: 21, base: '#c9a24a', mortar: '#6a4a10', vary: 0.25, bevel: true });
      for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,250,200,' + rng() * 0.7 + ')'; ctx.fillRect(rng() * TS, rng() * TS, 2, 2); }
      noise(ctx, 12);
    });
    tex('vault2', (ctx) => { ctx.drawImage(TX.data.vault.canvas, 0, 0); symSun(ctx, 64, 60, 26, '#fff3c0'); });
    tex('vaultfloor', (ctx) => { bricks(ctx, { bw: 64, bh: 64, base: '#e8dcc0', mortar: '#a08040', vary: 0.1 }); noise(ctx, 8); });
    tex('vaultceil', (ctx) => { ctx.fillStyle = '#5a4210'; ctx.fillRect(0, 0, TS, TS); symSun(ctx, 64, 64, 40, 'rgba(255,220,120,0.5)'); noise(ctx, 8); });
    tex('door_vault', (ctx) => { ctx.drawImage(TX.data.vault.canvas, 0, 0); plankDoor(ctx, '#b8862a', '#fff3c0', true); });
    tex('hollow', (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#3a2c1c'); g.addColorStop(1, '#241a10'); ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
      for (let i = 0; i < 25; i++) { ctx.fillStyle = shade('#5a4a34', 0.7 + rng() * 0.5); ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 4 + rng() * 8, 3 + rng() * 5, rng() * 3, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) { let x = rng() * TS, y = 0; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rng() - 0.5) * 14; y += 16; ctx.lineTo(x, y); } ctx.stroke(); }
      noise(ctx, 14);
    });
    tex('hollow2', (ctx) => {
      ctx.drawImage(TX.data.hollow.canvas, 0, 0);
      const g = ctx.createRadialGradient(64, 60, 2, 64, 60, 40); g.addColorStop(0, 'rgba(255,190,80,0.6)'); g.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS); symRoot(ctx, 64, 60, 22, '#ffcf6a');
    });
    tex('hollowfloor', (ctx) => { ctx.fillStyle = '#2a2014'; ctx.fillRect(0, 0, TS, TS); for (let i = 0; i < 60; i++) { ctx.fillStyle = shade('#4a3a24', 0.7 + rng() * 0.6); ctx.fillRect(rng() * TS, rng() * TS, 3 + rng() * 6, 2); } noise(ctx, 12); });
    tex('hollowceil', (ctx) => { ctx.fillStyle = '#1c140c'; ctx.fillRect(0, 0, TS, TS); ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(rng() * TS, rng() * TS); ctx.quadraticCurveTo(rng() * TS, rng() * TS, rng() * TS, rng() * TS); ctx.stroke(); } });
    tex('door_hollow', (ctx) => {
      ctx.drawImage(TX.data.hollow.canvas, 0, 0);
      ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.arc(64, 84, 40, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(64, 84, 35, 0, 7); ctx.fill();
      symRoot(ctx, 64, 80, 18, '#e8c060');
    });
  }

  function makeAll() {
    rng = BT.U.seeded(777);
    let c, ctx;

    // ---- sewer ----
    c = canvas(); ctx = c.getContext('2d');
    bricks(ctx, { bw: 32, bh: 16, base: '#4f5a46', mortar: '#1d241a', vary: 0.35, bevel: true });
    const slime = ctx.createLinearGradient(0, 80, 0, TS);
    slime.addColorStop(0, 'rgba(60,110,40,0)');
    slime.addColorStop(1, 'rgba(60,120,40,0.65)');
    ctx.fillStyle = slime; ctx.fillRect(0, 80, TS, 48);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(80,140,50,0.4)'; ctx.fillRect(rng() * TS, 60 + rng() * 40, 2, 20 + rng() * 40); }
    noise(ctx, 24); grab('sewer', c);

    // ---- crypt ----
    c = canvas(); ctx = c.getContext('2d');
    bricks(ctx, { bw: 42, bh: 26, base: '#5e5a66', mortar: '#1c1a22', vary: 0.25, bevel: true });
    noise(ctx, 26); grab('crypt', c);
    // crypt niche variant
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.crypt.canvas, 0, 0);
    ctx.fillStyle = '#0d0b12';
    ctx.beginPath(); ctx.moveTo(36, 110); ctx.lineTo(36, 46); ctx.quadraticCurveTo(64, 18, 92, 46); ctx.lineTo(92, 110); ctx.fill();
    ctx.fillStyle = '#d8d2c4';
    ctx.beginPath(); ctx.ellipse(64, 66, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d0b12';
    ctx.beginPath(); ctx.ellipse(59, 65, 3.5, 4, 0, 0, Math.PI * 2); ctx.ellipse(69, 65, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(62, 72, 4, 4);
    ctx.fillStyle = '#bdb6a6'; ctx.fillRect(56, 78, 16, 5);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#a7a090'; ctx.fillRect(44 + i * 8, 96 + (i % 2) * 3, 7, 4); }
    noise(ctx, 16); grab('crypt2', c);

    // ---- keep ----
    c = canvas(); ctx = c.getContext('2d');
    bricks(ctx, { bw: 64, bh: 32, base: '#4a4446', mortar: '#151214', vary: 0.22, bevel: true });
    noise(ctx, 22); grab('keep', c);
    // keep banner variant
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.keep.canvas, 0, 0);
    ctx.fillStyle = '#6b1414';
    ctx.beginPath(); ctx.moveTo(44, 10); ctx.lineTo(84, 10); ctx.lineTo(84, 100); ctx.lineTo(64, 86); ctx.lineTo(44, 100); ctx.fill();
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(42, 8, 44, 4);
    ctx.fillStyle = '#d8d8e8';
    ctx.font = 'bold 30px serif'; ctx.textAlign = 'center'; ctx.fillText('❄', 64, 58);
    noise(ctx, 12); grab('keep2', c);

    // ---- tower: crystal ----
    c = canvas(); ctx = c.getContext('2d');
    let g = ctx.createLinearGradient(0, 0, TS, TS);
    g.addColorStop(0, '#2b3f78'); g.addColorStop(0.5, '#4f6fb8'); g.addColorStop(1, '#22305e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = 'rgba(200,230,255,' + (0.1 + rng() * 0.3) + ')';
      ctx.lineWidth = 1 + rng() * 2;
      ctx.beginPath();
      const x = rng() * TS, y = rng() * TS;
      ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 80, y + (rng() - 0.5) * 80); ctx.stroke();
    }
    for (let y = 0; y < TS; y += 32) { ctx.fillStyle = 'rgba(10,20,50,0.6)'; ctx.fillRect(0, y, TS, 2); }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,' + rng() * 0.8 + ')'; ctx.fillRect(rng() * TS, rng() * TS, 1.5, 1.5); }
    noise(ctx, 10); grab('tower', c);
    // tower rune variant
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.tower.canvas, 0, 0);
    ctx.strokeStyle = 'rgba(150,220,255,0.9)'; ctx.lineWidth = 2;
    ctx.shadowColor = '#8ff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(64, 60, 26, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(64, 60); ctx.lineTo(64 + Math.cos(a) * 26, 60 + Math.sin(a) * 26); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    grab('tower2', c);

    // ---- doors ----
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.sewer.canvas, 0, 0); plankDoor(ctx, '#5b4a35', '#3a3a3a', false); grab('door_sewer', c);
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.crypt.canvas, 0, 0); plankDoor(ctx, '#3b2e2a', '#5c5c66', true); grab('door_crypt', c);
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.keep.canvas, 0, 0); plankDoor(ctx, '#463326', '#1a1a1a', true);
    ctx.fillStyle = '#111'; for (let y = 30; y < TS; y += 14) for (let x = 36; x < 96; x += 14) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
    grab('door_keep', c);
    c = canvas(); ctx = c.getContext('2d');
    ctx.drawImage(TX.data.tower.canvas, 0, 0);
    g = ctx.createLinearGradient(30, 0, 98, 0);
    g.addColorStop(0, '#7fb4ff'); g.addColorStop(0.5, '#d8f2ff'); g.addColorStop(1, '#7fb4ff');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(30, TS); ctx.lineTo(30, 46); ctx.lineTo(64, 14); ctx.lineTo(98, 46); ctx.lineTo(98, TS); ctx.fill();
    ctx.strokeStyle = '#1f3d7a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 20); ctx.lineTo(64, TS); ctx.stroke();
    grab('door_tower', c);

    makeInteriorTextures();
    // ---- floors & ceilings ----
    const flat = (name, base, f) => {
      c = canvas(); ctx = c.getContext('2d');
      ctx.fillStyle = base; ctx.fillRect(0, 0, TS, TS);
      f(ctx);
      grab(name, c);
    };
    flat('sewerfloor', '#2a3328', (ctx) => {
      bricks(ctx, { bw: 32, bh: 32, base: '#3c4636', mortar: '#151b13', vary: 0.3 });
      ctx.fillStyle = 'rgba(40,90,70,0.35)'; ctx.fillRect(40, 0, 48, TS);
      noise(ctx, 20);
    });
    flat('cryptfloor', '#3a3842', (ctx) => { bricks(ctx, { bw: 64, bh: 64, base: '#46434f', mortar: '#18171d', vary: 0.2 }); noise(ctx, 18); });
    flat('keepfloor', '#3a3030', (ctx) => {
      for (let y = 0; y < TS; y += 32) for (let x = 0; x < TS; x += 32) {
        ctx.fillStyle = (x + y) % 64 ? '#4d4040' : '#3a3232';
        ctx.fillRect(x, y, 32, 32);
      }
      ctx.fillStyle = 'rgba(110,20,20,0.3)'; ctx.fillRect(48, 0, 32, TS);
      noise(ctx, 18);
    });
    flat('towerfloor', '#1c2850', (ctx) => {
      ctx.strokeStyle = 'rgba(140,200,255,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i <= TS; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, TS); ctx.moveTo(0, i); ctx.lineTo(TS, i); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(64, 64, 30, 0, 7); ctx.stroke();
      noise(ctx, 10);
    });
    flat('sewerceil', '#1a2018', (ctx) => { bricks(ctx, { bw: 32, bh: 16, base: '#2c3428', mortar: '#0f130e', vary: 0.3 }); noise(ctx, 16); });
    flat('cryptceil', '#1c1b22', (ctx) => { bricks(ctx, { bw: 64, bh: 32, base: '#2a2832', mortar: '#0e0d12', vary: 0.2 }); noise(ctx, 14); });
    flat('keepceil', '#1d1515', (ctx) => {
      ctx.fillStyle = '#2b1e16'; for (let x = 0; x < TS; x += 32) ctx.fillRect(x, 0, 14, TS);
      noise(ctx, 14);
    });
    flat('towerceil', '#0d1430', (ctx) => {
      for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(180,220,255,' + rng() * 0.8 + ')'; ctx.fillRect(rng() * TS, rng() * TS, 1.5, 1.5); }
    });
  }

  // ---- billboard sprites (with alpha) ----
  function sprite(name, draw) {
    const c = canvas();
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, TS, TS);
    draw(ctx);
    grab(name, c);
  }
  function makeSprites() {
    sprite('sp_stairs_down', (ctx) => {
      // a dark opening in the floor with steps descending
      ctx.fillStyle = '#0a0a0e';
      ctx.beginPath(); ctx.moveTo(14, 128); ctx.lineTo(34, 92); ctx.lineTo(94, 92); ctx.lineTo(114, 128); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const y = 96 + i * 7, inset = 30 - i * 4;
        ctx.fillStyle = 'rgb(' + (90 - i * 14) + ',' + (84 - i * 13) + ',' + (78 - i * 12) + ')';
        ctx.fillRect(14 + inset, y, 100 - inset * 2, 4);
      }
      ctx.strokeStyle = '#b8a070'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(14, 128); ctx.lineTo(34, 92); ctx.lineTo(94, 92); ctx.lineTo(114, 128); ctx.stroke();
    });
    sprite('sp_stairs_up', (ctx) => {
      for (let i = 0; i < 7; i++) {
        const y = 128 - (i + 1) * 13, w = 92 - i * 6;
        ctx.fillStyle = shade('#8a8070', 1.15 - i * 0.08);
        ctx.fillRect(64 - w / 2, y, w, 13);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(64 - w / 2, y + 10, w, 3);
      }
      ctx.fillStyle = '#5a4a32';
      ctx.fillRect(14, 30, 6, 98); ctx.fillRect(108, 30, 6, 98);
    });
    sprite('sp_fountain', (ctx) => {
      const g = ctx.createRadialGradient(64, 80, 4, 64, 80, 60);
      g.addColorStop(0, 'rgba(140,220,255,0.55)'); g.addColorStop(1, 'rgba(140,220,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 20, 128, 108);
      ctx.fillStyle = '#7d7a86'; ctx.beginPath(); ctx.ellipse(64, 112, 46, 14, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5f5c68'; ctx.fillRect(18, 100, 92, 14);
      ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(64, 101, 40, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6d6a76'; ctx.fillRect(58, 58, 12, 44);
      ctx.fillStyle = '#7d7a86'; ctx.beginPath(); ctx.ellipse(64, 58, 20, 6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 2;
      for (const dx of [-14, -6, 6, 14]) { ctx.beginPath(); ctx.moveTo(64, 50); ctx.quadraticCurveTo(64 + dx, 40, 64 + dx * 1.6, 98); ctx.stroke(); }
    });
    sprite('sp_frozen_fountain', (ctx) => {
      ctx.fillStyle = '#8d93a6'; ctx.fillRect(14, 96, 100, 22);
      ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(64, 96, 50, 10, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#9aa3b8'; ctx.fillRect(56, 40, 16, 58);
      ctx.fillStyle = '#d6ecff';
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(50 + i * 3.5, 44); ctx.lineTo(52 + i * 3.5, 70 + (i % 3) * 8); ctx.lineTo(54 + i * 3.5, 44); ctx.fill(); }
      ctx.fillStyle = '#f4faff'; ctx.beginPath(); ctx.ellipse(64, 40, 22, 7, 0, 0, 7); ctx.fill();
    });
    sprite('sp_shrine', (ctx) => {
      const g = ctx.createRadialGradient(64, 50, 4, 64, 50, 64);
      g.addColorStop(0, 'rgba(255,230,140,0.75)'); g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#d8d0bc'; ctx.fillRect(34, 84, 60, 44);
      ctx.fillStyle = '#b8ae98'; ctx.fillRect(28, 80, 72, 8);
      ctx.fillStyle = '#ffe9a0';
      ctx.beginPath(); ctx.arc(64, 50, 14, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 3;
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * 18, 50 + Math.sin(a) * 18); ctx.lineTo(64 + Math.cos(a) * 28, 50 + Math.sin(a) * 28); ctx.stroke(); }
    });
    sprite('sp_chest', (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(64, 124, 44, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b4220'; ctx.fillRect(24, 88, 80, 36);
      ctx.fillStyle = '#7d5028'; ctx.beginPath(); ctx.moveTo(24, 90); ctx.quadraticCurveTo(64, 56, 104, 90); ctx.fill();
      ctx.fillStyle = '#d6aa48'; ctx.fillRect(22, 86, 84, 5); ctx.fillRect(40, 70, 6, 54); ctx.fillRect(82, 70, 6, 54);
      ctx.fillStyle = '#e8c860'; ctx.fillRect(58, 92, 12, 14);
    });
    const grave = (name, stone, sym, col) => sprite(name, (ctx) => {
      ctx.fillStyle = stone;
      ctx.beginPath(); ctx.moveTo(38, 128); ctx.lineTo(40, 70); ctx.quadraticCurveTo(64, 40, 88, 70); ctx.lineTo(90, 128); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(80, 66, 8, 62);
      sym(ctx, 64, 86, 13, col);
      ctx.fillStyle = '#eef4ff'; ctx.beginPath(); ctx.moveTo(40, 72); ctx.quadraticCurveTo(64, 40, 88, 72); ctx.quadraticCurveTo(64, 58, 40, 72); ctx.fill();
      ctx.fillStyle = '#eef4ff'; ctx.fillRect(28, 120, 72, 8);
    });
    grave('sp_grave_root', '#6f7566', symRoot, '#3a4a2a');
    grave('sp_grave_dawn', '#9a9688', symSun, '#5a4a2a');
    sprite('sp_shrine_root', (ctx) => {
      const g = ctx.createRadialGradient(64, 60, 4, 64, 60, 60);
      g.addColorStop(0, 'rgba(255,190,90,0.6)'); g.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(56, 50, 16, 78);
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 4;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(64, 118); ctx.quadraticCurveTo(64 + s * 20, 122, 64 + s * 34, 128); ctx.stroke(); }
      ctx.fillStyle = '#3a2a14'; ctx.beginPath(); ctx.arc(64, 44, 22, 0, 7); ctx.fill();
      symRoot(ctx, 64, 44, 18, '#ffcf6a');
      for (const x of [30, 98]) { ctx.fillStyle = '#ffb030'; ctx.fillRect(x - 4, 96, 8, 10); }
    });
    sprite('sp_shrine_pale', (ctx) => {
      const g = ctx.createRadialGradient(64, 50, 4, 64, 50, 64);
      g.addColorStop(0, 'rgba(220,240,255,0.75)'); g.addColorStop(1, 'rgba(160,210,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#bcd8f4'; ctx.beginPath(); ctx.moveTo(46, 128); ctx.lineTo(52, 70); ctx.lineTo(64, 58); ctx.lineTo(76, 70); ctx.lineTo(82, 128); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(56, 72, 4, 56);
      symPale(ctx, 64, 36, 20, '#ffffff');
    });
    sprite('sp_statue', (ctx) => {
      // stone gargoyle on a plinth (replaced by the SVG statue art when available)
      ctx.fillStyle = '#6e7078'; ctx.fillRect(34, 100, 60, 28);
      ctx.fillStyle = '#82848c'; ctx.fillRect(30, 96, 68, 8);
      ctx.fillStyle = '#eef4ff'; ctx.fillRect(30, 94, 68, 4);
      ctx.fillStyle = '#7a7c84';
      ctx.beginPath(); ctx.moveTo(40, 96); ctx.lineTo(10, 40); ctx.lineTo(36, 58); ctx.lineTo(30, 30); ctx.lineTo(52, 64); ctx.lineTo(64, 60); ctx.lineTo(76, 64); ctx.lineTo(98, 30); ctx.lineTo(92, 58); ctx.lineTo(118, 40); ctx.lineTo(88, 96); ctx.fill();
      ctx.fillStyle = '#8a8c94'; ctx.beginPath(); ctx.ellipse(64, 80, 18, 18, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(64, 54, 12, 11, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(55, 46); ctx.lineTo(50, 32); ctx.lineTo(59, 44); ctx.moveTo(73, 46); ctx.lineTo(78, 32); ctx.lineTo(69, 44); ctx.fill();
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(58, 52, 4, 3); ctx.fillRect(66, 52, 4, 3);
      ctx.fillStyle = '#eef4ff'; ctx.beginPath(); ctx.ellipse(64, 44, 10, 3, 0, 0, 7); ctx.fill();
    });
    sprite('sp_rubble', (ctx) => {
      ctx.fillStyle = '#6e7078'; ctx.fillRect(34, 100, 60, 28);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = shade('#7a7c84', 0.8 + rng() * 0.3); ctx.beginPath(); ctx.ellipse(30 + rng() * 68, 92 + rng() * 10, 6 + rng() * 6, 4 + rng() * 3, rng(), 0, 7); ctx.fill(); }
    });
    sprite('sp_mouth', (ctx) => {
      const g = ctx.createRadialGradient(64, 60, 4, 64, 60, 50);
      g.addColorStop(0, 'rgba(255,140,200,0.5)'); g.addColorStop(1, 'rgba(255,140,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      ctx.font = 'bold 54px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd0ea';
      ctx.fillText('?', 64, 80);
    });
    for (const on of [true, false]) sprite(on ? 'sp_portal_on' : 'sp_portal_off', (ctx) => {
      if (on) {
        const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 56);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(180,140,255,0.8)'); g.addColorStop(1, 'rgba(90,40,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, 66, 34, 56, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(64, 66, 10 + i * 6, 18 + i * 9, i * 0.4, 0, 5); ctx.stroke(); }
      }
      ctx.strokeStyle = on ? '#e8d8ff' : '#6a6070'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(64, 66, 36, 58, 0, 0, 7); ctx.stroke();
    });
    sprite('sp_glow', (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 60);
      g.addColorStop(0, 'rgba(230,240,255,0.7)'); g.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    });
  }

  // Upgrade the statue billboard with the SVG statue art (async). Falls back silently if the
  // browser refuses to read back pixels from an SVG image.
  function loadStatueArt() {
    if (!BT.art || !BT.art.monsterKeys || BT.art.monsterKeys.indexOf('statue') < 0) return;
    const img = new Image();
    img.onload = () => {
      try {
        const c = canvas(), ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, TS, TS);
        grab('sp_statue', c);
        if (BT.R) BT.R.invalidate();
      } catch (e) { /* tainted canvas: keep procedural statue */ }
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(BT.art.monster('statue', {}).replace('<svg', '<svg width="256" height="256"'));
  }

  // Texture packs in other files (js/tex-*.js) register a builder here; each runs once at init
  // with the shared drawing helpers.
  TX.packs = [];
  TX.addPack = function (fn) { TX.packs.push(fn); };
  TX.api = function () {
    return { TS, canvas, shade, noise, bricks, grab, plankDoor, symbol: TX.symbol, rng: () => rng(), seed: (s) => { rng = BT.U.seeded(s); }, data: TX.data };
  };

  // A wall decal (transparent) drawn over a base texture, built on first use: name 'base|decal'.
  TX.get = function (name) {
    let t = TX.data[name];
    if (t || !name || name.indexOf('|') < 0) return t;
    const parts = name.split('|'), base = TX.data[parts[0]];
    if (!base || !base.canvas) return base;
    const c = canvas(), ctx = c.getContext('2d');
    ctx.drawImage(base.canvas, 0, 0);
    for (let i = 1; i < parts.length; i++) { const d = TX.data[parts[i]]; if (d && d.canvas) ctx.drawImage(d.canvas, 0, 0); }
    grab(name, c);
    t = TX.data[name];
    t.mode = base.mode;
    return t;
  };

  TX.init = function () {
    if (TX.ready) return;
    makeAll();
    makeSprites();
    for (const fn of TX.packs) { try { fn(TX.api()); } catch (e) { console.error('texture pack failed', e); } }
    loadStatueArt();
    TX.ready = true;
  };

  BT.TX = TX;
})();
