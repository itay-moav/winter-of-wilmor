// Procedural textures rendered to canvases, then read back as pixel arrays for the raycaster.
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

  // ---------- houses ----------
  const ROOFS = ['#5d6b7e', '#8e3b2c', '#6b5032', '#3f6b62', '#4b4558', '#7a4a3a'];
  const PLASTER = ['#d8c8a6', '#c9a86f', '#a9b89a', '#c99b93', '#a7b6c9', '#e2ddd0', '#b58f6b'];
  const SHUTTERS = ['#2f5d3a', '#7a2a24', '#2b4a78', '#5b3a22', '#6b5a20', '#3d3d48'];

  function snowTop(ctx, y, h) {
    ctx.fillStyle = '#eef3fa';
    for (let x = 0; x < TS; x += 3) ctx.fillRect(x, y, 3, h * 0.5 + rng() * h * 0.5);
  }
  function window1(ctx, x, y, w, h, o) {
    // frame
    ctx.fillStyle = o.frame || '#2a1d12';
    if (o.arch) {
      ctx.beginPath(); ctx.moveTo(x - 2, y + h + 2); ctx.lineTo(x - 2, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2 + 2, Math.PI, 0); ctx.lineTo(x + w + 2, y + h + 2); ctx.fill();
    } else if (o.round) {
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + 2, 0, 7); ctx.fill();
    } else ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    if (o.lit) { g.addColorStop(0, '#ffe39a'); g.addColorStop(1, '#d9862e'); }
    else { g.addColorStop(0, '#3a5272'); g.addColorStop(1, '#141c2b'); }
    ctx.fillStyle = g;
    ctx.save();
    ctx.beginPath();
    if (o.arch) { ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); }
    else if (o.round) ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 7);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.clip();
    // mullions
    ctx.fillStyle = o.frame || '#2a1d12';
    if (o.leaded) {
      ctx.strokeStyle = 'rgba(40,25,10,0.8)'; ctx.lineWidth = 1;
      for (let i = -h; i < w + h; i += 6) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.moveTo(x + i + h, y); ctx.lineTo(x + i, y + h); ctx.stroke(); }
    } else {
      ctx.fillRect(x + w / 2 - 1, y, 2, h);
      ctx.fillRect(x, y + h / 2 - 1, w, 2);
    }
    if (!o.lit) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 2, y + 2, w / 3, h / 3); }
    ctx.restore();
    if (o.shutter) {
      ctx.fillStyle = o.shutter;
      ctx.fillRect(x - 2 - w / 2.4, y - 2, w / 2.4 - 1, h + 4);
      ctx.fillRect(x + w + 3, y - 2, w / 2.4 - 1, h + 4);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let k = y; k < y + h; k += 4) { ctx.fillRect(x - 2 - w / 2.4, k, w / 2.4 - 1, 1); ctx.fillRect(x + w + 3, k, w / 2.4 - 1, 1); }
    }
    // sill with snow
    ctx.fillStyle = '#8a8478'; ctx.fillRect(x - 4, y + h + 2, w + 8, 3);
    ctx.fillStyle = '#f4f8ff'; ctx.fillRect(x - 4, y + h, w + 8, 2.5);
    if (o.flowers) {
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x - 2, y + h + 5, w + 4, 6);
      ctx.fillStyle = '#f0f6ff'; ctx.fillRect(x - 2, y + h + 4, w + 4, 2);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(200,220,255,0.8)'; ctx.fillRect(x + i * (w / 4) + 2, y + h + 1, 2, 3); }
    }
  }

  function houseTex(v) {
    rng = BT.U.seeded(9000 + v * 131);
    const c = canvas(), ctx = c.getContext('2d');
    const kind = ['plaster', 'timber', 'stone', 'brick', 'planks', 'timber', 'plaster', 'stone', 'brick', 'planks', 'timber', 'plaster', 'stone', 'timber'][v % 14];
    const roofH = 12 + rng.int(10);
    const body = PLASTER[rng.int(PLASTER.length)];
    if (kind === 'stone') bricks(ctx, { bw: 22 + rng.int(18), bh: 12 + rng.int(8), base: ['#8b8a86', '#9a8e78', '#7d8590', '#a39a88'][rng.int(4)], mortar: '#3e3c3a', vary: 0.3, bevel: true });
    else if (kind === 'brick') bricks(ctx, { bw: 16, bh: 8, base: ['#8a4a36', '#7a5040', '#955f45', '#6e3a30'][rng.int(4)], mortar: '#4a3c36', vary: 0.25, bevel: false });
    else if (kind === 'planks') {
      const pc = ['#3f5a46', '#4a5f7a', '#7a3b33', '#6b5a3a', '#556070'][rng.int(5)];
      for (let y = 0; y < TS; y += 8) { ctx.fillStyle = shade(pc, 0.85 + rng() * 0.3); ctx.fillRect(0, y, TS, 8); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y + 7, TS, 1); }
    } else { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); }
    noise(ctx, 16);
    if (kind === 'timber') {
      ctx.fillStyle = '#3d2716';
      ctx.fillRect(0, roofH, 6, TS); ctx.fillRect(TS - 6, roofH, 6, TS); ctx.fillRect(0, 64, TS, 6); ctx.fillRect(TS / 2 - 3, roofH, 6, TS);
      ctx.save(); ctx.strokeStyle = '#3d2716'; ctx.lineWidth = 5;
      const pat = rng.int(3);
      ctx.beginPath();
      if (pat === 0) { ctx.moveTo(6, 70); ctx.lineTo(TS / 2 - 3, TS); ctx.moveTo(TS - 6, 70); ctx.lineTo(TS / 2 + 3, TS); }
      if (pat === 1) { ctx.moveTo(6, TS); ctx.lineTo(TS / 2 - 3, 70); ctx.moveTo(TS - 6, TS); ctx.lineTo(TS / 2 + 3, 70); }
      if (pat === 2) { ctx.moveTo(6, 70); ctx.lineTo(TS / 2 - 3, TS); ctx.moveTo(TS / 2 + 3, 70); ctx.lineTo(TS - 6, TS); }
      ctx.stroke(); ctx.restore();
    }
    // roof eave with tiles
    const roof = ROOFS[rng.int(ROOFS.length)];
    ctx.fillStyle = roof; ctx.fillRect(0, 0, TS, roofH);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let x = (rng.int(2) ? 0 : 4); x < TS; x += 8) ctx.fillRect(x, 0, 1, roofH);
    for (let y = 4; y < roofH; y += 5) ctx.fillRect(0, y, TS, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, roofH, TS, 4);
    snowTop(ctx, 0, roofH * 0.7);
    // icicles
    if (rng() < 0.6) for (let x = 4; x < TS; x += 6 + rng.int(6)) { ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.beginPath(); ctx.moveTo(x, roofH); ctx.lineTo(x + 2, roofH + 4 + rng.int(10)); ctx.lineTo(x + 4, roofH); ctx.fill(); }
    // chimney
    if (rng() < 0.35) { const cx = 10 + rng.int(90); ctx.fillStyle = '#6a5a52'; ctx.fillRect(cx, 0, 14, roofH + 2); ctx.fillStyle = '#eef3fa'; ctx.fillRect(cx - 1, 0, 16, 3); }
    // windows
    const shutter = rng() < 0.5 ? SHUTTERS[rng.int(SHUTTERS.length)] : null;
    const style = { arch: rng() < 0.3, leaded: rng() < 0.3, flowers: rng() < 0.4, shutter };
    const layout = rng.int(4);
    const upperY = roofH + 10;
    const lit = () => rng() < 0.35;
    if (layout === 0) { for (const x of [20, 82]) window1(ctx, x, upperY, 26, 30, Object.assign({}, style, { lit: lit() })); }
    else if (layout === 1) { for (const x of [14, 54, 94]) window1(ctx, x, upperY, 20, 28, Object.assign({}, style, { lit: lit(), shutter: null })); }
    else if (layout === 2) { window1(ctx, 50, upperY, 28, 28, Object.assign({}, style, { round: true, arch: false, lit: lit(), shutter: null, flowers: false })); }
    else { window1(ctx, 18, upperY, 24, 30, Object.assign({}, style, { lit: lit() })); window1(ctx, 86, upperY, 24, 30, Object.assign({}, style, { lit: lit() })); }
    // ground floor: closed shutters, boarded door, or shop-front windows
    const ground = rng.int(4);
    if (ground === 0) {
      // boarded-up door
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(48, 82, 32, 46);
      ctx.fillStyle = '#7a6040'; ctx.save(); ctx.translate(64, 104); ctx.rotate(0.5); ctx.fillRect(-24, -3, 48, 6); ctx.rotate(-1); ctx.fillRect(-24, -3, 48, 6); ctx.restore();
    } else if (ground === 1) {
      for (const x of [16, 88]) window1(ctx, x, 86, 24, 22, { lit: lit(), shutter: SHUTTERS[rng.int(SHUTTERS.length)] });
    } else if (ground === 2) {
      ctx.fillStyle = 'rgba(30,30,40,0.5)'; ctx.fillRect(0, TS - 26, TS, 26);
      for (let x = 6; x < TS; x += 30) { ctx.fillStyle = '#5a554e'; ctx.fillRect(x, TS - 22, 24, 18); }
    } else {
      window1(ctx, 40, 84, 48, 22, { lit: lit(), leaded: true });
    }
    // extras
    if (rng() < 0.3) { // lantern
      const lx = rng() < 0.5 ? 10 : TS - 16;
      ctx.fillStyle = '#222'; ctx.fillRect(lx + 2, 70, 2, 8);
      ctx.fillStyle = '#ffcf6a'; ctx.fillRect(lx, 78, 7, 9);
      const lg = ctx.createRadialGradient(lx + 3, 82, 1, lx + 3, 82, 16); lg.addColorStop(0, 'rgba(255,210,120,0.6)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - 14, 66, 34, 32);
    }
    if (rng() < 0.25) { // frosted ivy
      ctx.strokeStyle = 'rgba(90,110,80,0.8)'; ctx.lineWidth = 1.5;
      let x = rng() < 0.5 ? 4 : TS - 10, y = TS;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 16; i++) { x += (rng() - 0.5) * 8; y -= 5; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    if (rng() < 0.2) { // crest
      ctx.fillStyle = ['#7a2a24', '#2b4a78', '#2f5d3a'][rng.int(3)];
      ctx.beginPath(); ctx.moveTo(56, 66); ctx.lineTo(72, 66); ctx.lineTo(72, 76); ctx.lineTo(64, 82); ctx.lineTo(56, 76); ctx.fill();
      ctx.strokeStyle = '#d6aa48'; ctx.lineWidth = 1; ctx.stroke();
    }
    // stone base and snow drift
    ctx.fillStyle = 'rgba(40,40,50,0.35)'; ctx.fillRect(0, TS - 12, TS, 12);
    ctx.fillStyle = '#eef3fa';
    for (let x = 0; x < TS; x += 4) ctx.fillRect(x, TS - 4 - rng() * 5, 4, 10);
    return c;
  }
  TX.HOUSES = 14;

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

  // ---------- special building facades ----------
  function signBoard(ctx, text) {
    ctx.fillStyle = 'rgba(25,15,8,0.92)'; ctx.fillRect(14, 4, 100, 20);
    ctx.strokeStyle = '#d0a85a'; ctx.lineWidth = 1.5; ctx.strokeRect(15, 5, 98, 18);
    ctx.fillStyle = '#ffd98a'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 14.5);
  }
  function banner(ctx, x, y, col, emblem) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 16, y + 44); ctx.lineTo(x + 8, y + 37); ctx.lineTo(x, y + 44); ctx.fill();
    ctx.fillStyle = '#d6aa48'; ctx.fillRect(x - 2, y - 2, 20, 3);
    if (emblem) emblem(x + 8, y + 18);
  }
  function facadeSpecial(k) {
    rng = BT.U.seeded(500 + k.charCodeAt(0));
    const c = canvas(), ctx = c.getContext('2d');
    if (k === 'A') {
      bricks(ctx, { bw: 32, bh: 16, base: '#8d8a82', mortar: '#3e3c3a', vary: 0.25, bevel: true }); noise(ctx, 14);
      const swords = (x, y) => { ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x + 5, y + 6); ctx.moveTo(x + 5, y - 6); ctx.lineTo(x - 5, y + 6); ctx.stroke(); };
      banner(ctx, 8, 28, '#8a2020', swords); banner(ctx, 104, 28, '#8a2020', swords);
      plankDoor(ctx, '#5d4128', '#2a2a2a', true);
    } else if (k === 'T') {
      ctx.fillStyle = '#c9b48a'; ctx.fillRect(0, 0, TS, TS); noise(ctx, 16);
      ctx.fillStyle = '#3d2716'; ctx.fillRect(0, 28, TS, 5); ctx.fillRect(0, 0, 5, TS); ctx.fillRect(TS - 5, 0, 5, TS);
      window1(ctx, 8, 40, 18, 30, { lit: true, leaded: true }); window1(ctx, 102, 40, 18, 30, { lit: true, leaded: true });
      plankDoor(ctx, '#6b4a2a', '#2a2a2a', false);
      // hanging mug sign
      ctx.fillStyle = '#222'; ctx.fillRect(98, 30, 24, 2);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(104, 32, 16, 14);
      ctx.fillStyle = '#e8c860'; ctx.fillRect(108, 35, 7, 8); ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(116, 39, 2.5, -1.5, 1.5); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(108, 34, 7, 2);
      // barrel
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(6, 104, 18, 22); ctx.fillStyle = '#333'; ctx.fillRect(6, 108, 18, 2); ctx.fillRect(6, 119, 18, 2);
    } else if (k === 'S') {
      bricks(ctx, { bw: 16, bh: 8, base: '#7a4a36', mortar: '#4a3c36', vary: 0.25, bevel: false }); noise(ctx, 12);
      // striped awning
      for (let x = 0; x < TS; x += 12) { ctx.fillStyle = (x / 12) % 2 ? '#e8e0d0' : '#a02a2a'; ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x + 12, 28); ctx.lineTo(x + 12, 40); ctx.lineTo(x + 6, 44); ctx.lineTo(x, 40); ctx.fill(); }
      // display windows with goods
      for (const wx of [6, 94]) {
        ctx.fillStyle = '#2a1d12'; ctx.fillRect(wx - 2, 52, 32, 44);
        ctx.fillStyle = '#e8c070'; ctx.fillRect(wx, 54, 28, 40);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx + 8, 90); ctx.lineTo(wx + 8, 60); ctx.stroke(); ctx.fillStyle = '#777'; ctx.fillRect(wx + 4, 82, 8, 2);
        ctx.fillStyle = '#8a3020'; ctx.beginPath(); ctx.arc(wx + 20, 76, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#d6aa48'; ctx.beginPath(); ctx.arc(wx + 20, 76, 2, 0, 7); ctx.fill();
      }
      plankDoor(ctx, '#4a3020', '#2a2a2a', false);
    } else if (k === 'I') {
      ctx.fillStyle = '#e2d6b8'; ctx.fillRect(0, 0, TS, TS); noise(ctx, 14);
      ctx.fillStyle = '#7a3a2a'; ctx.fillRect(0, 0, TS, 26); snowTop(ctx, 0, 10);
      window1(ctx, 8, 40, 16, 26, { lit: true, flowers: true, shutter: '#2f5d3a' });
      window1(ctx, 104, 40, 16, 26, { lit: true, flowers: true, shutter: '#2f5d3a' });
      plankDoor(ctx, '#7a5030', '#2a2a2a', true);
      ctx.fillStyle = '#ffcf6a'; ctx.fillRect(24, 50, 6, 8);
      const lg = ctx.createRadialGradient(27, 54, 1, 27, 54, 18); lg.addColorStop(0, 'rgba(255,210,120,0.7)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = lg; ctx.fillRect(8, 36, 40, 40);
    } else if (k === 'R') {
      ctx.fillStyle = '#9a96a6'; ctx.fillRect(0, 0, TS, TS); noise(ctx, 14);
      for (let y = 0; y < TS; y += 20) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, y, TS, 1); }
      for (const x of [8, 110]) { ctx.fillStyle = '#c8c4d2'; ctx.fillRect(x, 30, 10, TS - 30); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 7, 30, 3, TS - 30); ctx.fillStyle = '#ddd'; ctx.fillRect(x - 2, 28, 14, 4); }
      banner(ctx, 22, 30, '#2b4a78', (x, y) => { ctx.fillStyle = '#eee'; ctx.fillRect(x - 5, y - 4, 10, 8); });
      banner(ctx, 90, 30, '#2b4a78', (x, y) => { ctx.fillStyle = '#eee'; ctx.fillRect(x - 5, y - 4, 10, 8); });
      plankDoor(ctx, '#4a3a2a', '#888', true);
    } else if (k === 'M') {
      for (let x = 0; x < TS; x += 8) { ctx.fillStyle = shade('#5a3070', 0.85 + rng() * 0.3); ctx.fillRect(x, 0, 8, TS); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 7, 0, 1, TS); }
      noise(ctx, 10);
      ctx.fillStyle = '#ffe9a0';
      for (let i = 0; i < 14; i++) { const x = rng() * TS, y = 28 + rng() * 50; ctx.fillRect(x, y, 2, 2); }
      ctx.beginPath(); ctx.arc(20, 44, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#5a3070'; ctx.beginPath(); ctx.arc(24, 42, 8, 0, 7); ctx.fill();
      const cg = ctx.createRadialGradient(108, 50, 2, 108, 50, 14); cg.addColorStop(0, '#e0c0ff'); cg.addColorStop(1, 'rgba(160,80,255,0)');
      ctx.fillStyle = cg; ctx.fillRect(90, 32, 36, 36);
      plankDoor(ctx, '#3a2050', '#c9a24a', true);
    } else if (k === 'Q') {
      // clockmaker: dark timber, a great clock face
      ctx.fillStyle = '#b8a07a'; ctx.fillRect(0, 0, TS, TS); noise(ctx, 14);
      ctx.fillStyle = '#3d2716'; ctx.fillRect(0, 26, TS, 5); ctx.fillRect(0, 0, 5, TS); ctx.fillRect(TS - 5, 0, 5, TS); ctx.fillRect(0, 76, TS, 4);
      ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(64, 50, 17, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillStyle = '#3a2a10'; ctx.fillRect(64 + Math.cos(a) * 13 - 1, 50 + Math.sin(a) * 13 - 1, 2, 2); }
      ctx.beginPath(); ctx.moveTo(64, 50); ctx.lineTo(64, 39); ctx.moveTo(64, 50); ctx.lineTo(72, 53); ctx.stroke();
      symSun(ctx, 64, 50, 4, '#c9a24a');
      window1(ctx, 10, 40, 16, 26, { lit: false, leaded: true }); window1(ctx, 102, 40, 16, 26, { lit: false, leaded: true });
      plankDoor(ctx, '#5a3a20', '#c9a24a', false);
    } else if (k === 'Y') {
      ctx.fillStyle = '#c4d2e2'; ctx.fillRect(0, 0, TS, TS); noise(ctx, 12);
      for (let y = 0; y < TS; y += 16) { ctx.fillStyle = 'rgba(40,60,100,0.12)'; ctx.fillRect(0, y, TS, 1); }
      window1(ctx, 10, 36, 18, 30, { lit: false, arch: true, frame: '#5a6a8a' }); window1(ctx, 100, 36, 18, 30, { lit: false, arch: true, frame: '#5a6a8a' });
      // frost wreath with the Still Mother's sign on the door
      plankDoor(ctx, '#6a7a90', '#c8d8f0', true);
      ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(64, 60, 13, 0, 7); ctx.stroke();
      symPale(ctx, 64, 60, 9, '#ffffff');
    } else if (k === 'U') {
      for (let x = 0; x < TS; x += 10) { ctx.fillStyle = shade('#6a5236', 0.8 + rng() * 0.35); ctx.fillRect(x, 0, 10, TS); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 9, 0, 1, TS); }
      noise(ctx, 14);
      // millstone wheel and roots
      ctx.fillStyle = '#7a7466'; ctx.beginPath(); ctx.arc(20, 54, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a5446'; ctx.beginPath(); ctx.arc(20, 54, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4a3a20'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(110, TS); ctx.quadraticCurveTo(100 - i * 6, 90 - i * 10, 116 - i * 4, 40 + i * 6); ctx.stroke(); }
      symRoot(ctx, 108, 34, 9, '#b8d27a');
      plankDoor(ctx, '#4a3420', '#2a2a2a', false);
    } else {
      // C, K, G, W gates
      if (k === 'W') ctx.drawImage(TX.data.tower.canvas, 0, 0);
      else ctx.drawImage(TX.data[k === 'C' ? 'crypt' : k === 'K' ? 'keep' : 'citywall'].canvas, 0, 0);
      if (k === 'W') {
        ctx.fillStyle = '#0a1230'; ctx.beginPath(); ctx.moveTo(32, TS); ctx.lineTo(32, 50); ctx.quadraticCurveTo(64, 20, 96, 50); ctx.lineTo(96, TS); ctx.fill();
        ctx.fillStyle = '#9fd4ff'; ctx.beginPath(); ctx.arc(64, 60, 8, 0, 7); ctx.fill();
        ctx.strokeStyle = '#6fa8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(64, 60, 14, 0, 7); ctx.stroke();
      } else {
        ctx.fillStyle = '#0b0b10'; ctx.fillRect(28, 34, 72, TS - 34);
        ctx.fillStyle = '#4b4b56';
        for (let x = 30; x < 100; x += 9) ctx.fillRect(x, 34, 3, TS - 34);
        ctx.fillRect(28, 34, 72, 4); ctx.fillRect(28, 80, 72, 3);
        ctx.fillStyle = k === 'C' ? '#b07b3a' : '#888'; ctx.fillRect(58, 74, 12, 14);
        if (k === 'C') symRoot(ctx, 64, 52, 11, '#b8d27a');
      }
    }
    signBoard(ctx, { A: 'GUILD', T: 'TAVERN', S: 'SHOP', I: 'INN', R: 'REVIEW', M: 'MYSTIC', C: 'CRYPT', K: 'KEEP', W: 'TOWER', G: 'GATE', Q: 'CLOCKMAKER', Y: 'YSOLDE', U: 'OLD MILL' }[k]);
    return c;
  }

  // Wide (2-cell) temple fronts, returned as [leftHalf, rightHalf].
  function templeTex(faith) {
    rng = BT.U.seeded(faith.length * 97 + 3);
    const W2 = TS * 2;
    const c = canvas(W2, TS), ctx = c.getContext('2d');
    if (faith === 'dawn') {
      ctx.fillStyle = '#e8e2d4'; ctx.fillRect(0, 0, W2, TS);
      for (let y = 0; y < TS; y += 12) for (let x = (y / 12) % 2 ? 0 : 16; x < W2; x += 32) { ctx.fillStyle = 'rgba(120,110,90,0.18)'; ctx.fillRect(x, y, 1, 12); ctx.fillRect(0, y, W2, 1); }
      // pediment
      ctx.fillStyle = '#f2ecdf'; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(W2 / 2, 0); ctx.lineTo(W2, 30); ctx.fill();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(W2 / 2, 2); ctx.lineTo(W2, 30); ctx.lineTo(0, 30); ctx.stroke();
      symSun(ctx, W2 / 2, 18, 10, '#e0b030');
      // columns
      for (const x of [14, 54, 190, 230]) {
        ctx.fillStyle = '#faf6ec'; ctx.fillRect(x - 7, 34, 14, 84);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 3, 34, 4, 84); ctx.fillRect(x - 3, 34, 1, 84); ctx.fillRect(x + 1, 34, 1, 84);
        ctx.fillStyle = '#e0d8c4'; ctx.fillRect(x - 10, 32, 20, 5); ctx.fillRect(x - 10, 114, 20, 5);
      }
      // golden doors
      ctx.fillStyle = '#3a2a10'; ctx.beginPath(); ctx.moveTo(92, TS); ctx.lineTo(92, 64); ctx.arc(128, 64, 36, Math.PI, 0); ctx.lineTo(164, TS); ctx.fill();
      const dg = ctx.createLinearGradient(96, 0, 160, 0); dg.addColorStop(0, '#b8862a'); dg.addColorStop(0.5, '#f0cc60'); dg.addColorStop(1, '#b8862a');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(96, TS); ctx.lineTo(96, 66); ctx.arc(128, 66, 32, Math.PI, 0); ctx.lineTo(160, TS); ctx.fill();
      ctx.fillStyle = '#6a4a10'; ctx.fillRect(127, 40, 2, 88);
      symSun(ctx, 128, 70, 14, '#fff3c0');
      // candle windows
      for (const x of [34, 210]) window1(ctx, x - 7, 50, 14, 30, { lit: true, arch: true, frame: '#c9a24a' });
      ctx.fillStyle = '#d8d0bc'; ctx.fillRect(0, TS - 8, W2, 8); ctx.fillStyle = '#eef3fa'; ctx.fillRect(0, TS - 4, W2, 4);
      snowTop(ctx, 28, 4);
    } else if (faith === 'pale') {
      const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#c8dcf0'); g.addColorStop(1, '#8aa4c4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W2, TS);
      for (let y = 0; y < TS; y += 16) for (let x = (y / 16) % 2 ? 0 : 20; x < W2; x += 40) { ctx.fillStyle = 'rgba(40,60,100,0.2)'; ctx.fillRect(x, y, 1, 16); ctx.fillRect(0, y, W2, 1); }
      // spires along the top
      for (let x = 0; x < W2; x += 32) { ctx.fillStyle = '#dfeeff'; ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + 16, 0); ctx.lineTo(x + 32, 18); ctx.fill(); }
      // lancet windows glowing blue
      for (const x of [22, 58, 186, 222]) {
        ctx.fillStyle = '#4a6a9a'; ctx.beginPath(); ctx.moveTo(x - 9, 100); ctx.lineTo(x - 9, 40); ctx.lineTo(x, 26); ctx.lineTo(x + 9, 40); ctx.lineTo(x + 9, 100); ctx.fill();
        const wg = ctx.createLinearGradient(0, 30, 0, 100); wg.addColorStop(0, '#e8f6ff'); wg.addColorStop(1, '#6ab0ff');
        ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(x - 6, 98); ctx.lineTo(x - 6, 42); ctx.lineTo(x, 31); ctx.lineTo(x + 6, 42); ctx.lineTo(x + 6, 98); ctx.fill();
        symPale(ctx, x, 60, 5, '#ffffff');
      }
      // great emblem above the door
      const eg = ctx.createRadialGradient(128, 34, 2, 128, 34, 30); eg.addColorStop(0, 'rgba(255,255,255,0.8)'); eg.addColorStop(1, 'rgba(180,220,255,0)');
      ctx.fillStyle = eg; ctx.fillRect(96, 2, 64, 64);
      symPale(ctx, 128, 34, 20, '#ffffff');
      // silver pointed doors
      ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.moveTo(98, TS); ctx.lineTo(98, 80); ctx.lineTo(128, 58); ctx.lineTo(158, 80); ctx.lineTo(158, TS); ctx.fill();
      const dg = ctx.createLinearGradient(100, 0, 156, 0); dg.addColorStop(0, '#9aaac0'); dg.addColorStop(0.5, '#f0f6ff'); dg.addColorStop(1, '#9aaac0');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(102, TS); ctx.lineTo(102, 82); ctx.lineTo(128, 63); ctx.lineTo(154, 82); ctx.lineTo(154, TS); ctx.fill();
      ctx.fillStyle = '#5a6a8a'; ctx.fillRect(127, 64, 2, 64);
      // icicles
      for (let x = 2; x < W2; x += 5 + rng.int(6)) { ctx.fillStyle = 'rgba(235,248,255,0.95)'; ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + 2, 22 + rng.int(14)); ctx.lineTo(x + 4, 18); ctx.fill(); }
      ctx.fillStyle = '#eef6ff'; ctx.fillRect(0, TS - 6, W2, 6);
    } else {
      // root: an earthen barrow with a round door, roots and moss
      const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#4a3a28'); g.addColorStop(1, '#2e2418');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W2, TS);
      // stacked fieldstones
      for (let y = 30; y < TS; y += 14) for (let x = (y / 14) % 2 ? -10 : 0; x < W2; x += 26) {
        ctx.fillStyle = shade('#6a6250', 0.75 + rng() * 0.4);
        ctx.beginPath(); ctx.ellipse(x + 13, y + 7, 12, 6, 0, 0, 7); ctx.fill();
      }
      // turf roof with snow
      ctx.fillStyle = '#3f5a2a'; ctx.fillRect(0, 0, W2, 30);
      for (let x = 0; x < W2; x += 3) { ctx.fillStyle = shade('#4a6a30', 0.8 + rng() * 0.4); ctx.fillRect(x, 26 + rng() * 6, 2, 6); }
      snowTop(ctx, 0, 12);
      // hanging roots
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
      for (let x = 6; x < W2; x += 10 + rng.int(10)) { ctx.beginPath(); ctx.moveTo(x, 30); let yy = 30; let xx = x; for (let i = 0; i < 5; i++) { xx += (rng() - 0.5) * 6; yy += 4 + rng() * 4; ctx.lineTo(xx, yy); } ctx.stroke(); }
      // round door with carved ring
      ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.arc(128, 92, 36, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(128, 92, 31, 0, 7); ctx.fill();
      for (let k = 0; k < 8; k++) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(128, 92); ctx.lineTo(128 + Math.cos(k * 0.785) * 31, 92 + Math.sin(k * 0.785) * 31); ctx.stroke(); }
      symRoot(ctx, 128, 88, 16, '#e8c060');
      ctx.fillStyle = '#2e2418'; ctx.fillRect(80, TS - 6, 96, 6);
      // amber lanterns
      for (const x of [70, 186]) {
        ctx.fillStyle = '#222'; ctx.fillRect(x - 1, 40, 2, 30);
        ctx.fillStyle = '#ffb030'; ctx.fillRect(x - 4, 70, 8, 10);
        const lg = ctx.createRadialGradient(x, 75, 1, x, 75, 22); lg.addColorStop(0, 'rgba(255,180,60,0.7)'); lg.addColorStop(1, 'rgba(255,180,60,0)');
        ctx.fillStyle = lg; ctx.fillRect(x - 24, 52, 48, 48);
      }
      // carved standing stones with the symbol
      for (const x of [24, 232]) {
        ctx.fillStyle = '#7a7466'; ctx.beginPath(); ctx.moveTo(x - 12, TS); ctx.lineTo(x - 10, 50); ctx.quadraticCurveTo(x, 40, x + 10, 50); ctx.lineTo(x + 12, TS); ctx.fill();
        symRoot(ctx, x, 70, 8, '#b8d27a');
        ctx.fillStyle = '#eef3fa'; ctx.beginPath(); ctx.ellipse(x, 48, 10, 4, 0, 0, 7); ctx.fill();
      }
    }
    noise(ctx, 10, 0, W2, TS);
    // name banner across the middle top
    const names = { dawn: 'TEMPLE OF THE DAWN', pale: 'HALL OF THE STILL MOTHER', root: 'BARROW OF THE DEEP ROOT' };
    ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(names[faith]).width + 16;
    ctx.fillStyle = 'rgba(20,14,8,0.85)'; ctx.fillRect(128 - tw / 2, 40, tw, 16);
    ctx.fillStyle = { dawn: '#ffd98a', pale: '#dff2ff', root: '#d8f0a0' }[faith];
    ctx.fillText(names[faith], 128, 48.5);
    const halves = [];
    for (let h = 0; h < 2; h++) {
      const hc = canvas(), hx = hc.getContext('2d');
      hx.drawImage(c, h * TS, 0, TS, TS, 0, 0, TS, TS);
      halves.push(hc);
    }
    return halves;
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

    // ---- town houses ----
    for (let v = 0; v < TX.HOUSES; v++) grab('house' + v, houseTex(v));
    rng = BT.U.seeded(778);
    // city wall
    c = canvas(); ctx = c.getContext('2d');
    bricks(ctx, { bw: 40, bh: 20, base: '#7d7f8c', mortar: '#2e2f38', vary: 0.25, bevel: true });
    ctx.fillStyle = '#eef3fa';
    for (let x = 0; x < TS; x += 4) ctx.fillRect(x, 0, 4, 6 + rng() * 6);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(230,240,255,0.6)'; ctx.fillRect(rng() * TS, rng() * TS, 6, 2); }
    noise(ctx, 16); grab('citywall', c);

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

    // ---- town facades for special buildings ----
    for (const k of ['A', 'T', 'S', 'I', 'R', 'M', 'C', 'K', 'W', 'G', 'Q', 'Y', 'U']) grab('facade_' + k, facadeSpecial(k));
    makeInteriorTextures();
    for (const f of ['dawn', 'pale', 'root']) {
      const [l, r] = templeTex(f);
      grab('temple_' + f + '_L', l);
      grab('temple_' + f + '_R', r);
    }
    rng = BT.U.seeded(779);
    for (const f of ['dawn', 'pale', 'root']) { TX.data['temple_' + f + '_L'].mode = 'stretch'; TX.data['temple_' + f + '_R'].mode = 'stretch'; }
    for (const k of ['W', 'C', 'K', 'G']) TX.data['facade_' + k].mode = 'tile';
    TX.data.citywall.mode = 'tile';

    // ---- floors & ceilings ----
    const flat = (name, base, f) => {
      c = canvas(); ctx = c.getContext('2d');
      ctx.fillStyle = base; ctx.fillRect(0, 0, TS, TS);
      f(ctx);
      grab(name, c);
    };
    flat('cobble', '#c9d2de', (ctx) => {
      for (let y = 0; y < TS; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < TS; x += 16) {
        ctx.fillStyle = shade('#8d96a6', 0.85 + rng() * 0.3);
        ctx.beginPath(); ctx.ellipse(x + 8, y + 8, 6.5, 6, 0, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(240,245,255,0.55)'; ctx.fillRect(0, 0, TS, TS);
      noise(ctx, 18);
    });
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

  TX.init = function () {
    if (TX.ready) return;
    makeAll();
    makeSprites();
    loadStatueArt();
    TX.ready = true;
  };

  BT.TX = TX;
})();
