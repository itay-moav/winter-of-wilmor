// The battle screen: a hex board in perspective over the blurred 3D view, a turn-order strip,
// and the full figure of whoever is acting. Pure view: combat.js calls BT.BV.<fn>(cb, ...).
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, HX = BT.HX;
  const BV = {};
  const $ = (id) => document.getElementById(id);

  // ---- projection: board plane -> screen (viewBox 1000 x VBH) ----
  const VBW = 1000, VBH = 725;
  // camera derived from targets: the near edge at NEAR_Y and NEAR_HALF wide, the far edge at FAR_Y;
  // Z0 (distance to the near edge, in hex units) sets how strong the perspective is
  const Z0 = 34, NEAR_Y = 690, FAR_Y = 120, NEAR_HALF = 470;
  const BS0 = HX.boardSize();
  const FH = (NEAR_Y - FAR_Y) / (1 / Z0 - 1 / (Z0 + BS0.h)), CY = NEAR_Y - FH / Z0, F = NEAR_HALF * Z0 / (BS0.w / 2);
  const BS = HX.boardSize();
  function proj(x, y) {
    const z = Z0 + (BS.h - y);
    return { x: VBW / 2 + F * (x - BS.w / 2) / z, y: CY + FH / z, s: F / z };
  }
  const pct = (p) => ({ l: p.x / VBW * 100, t: p.y / VBH * 100 });
  function hexPoints(c, r, shrink) {
    const ctr = HX.center(c, r), pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (60 * i - 30) * Math.PI / 180;
      const p = proj(ctr.x + Math.cos(a) * shrink, ctr.y + Math.sin(a) * shrink);
      pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
    }
    return pts.join(' ');
  }
  function foot(c, r) { const ctr = HX.center(c, r); return proj(ctr.x, ctr.y + 0.35); }

  let root = null, clickRes = null, pick = null;
  const tokens = new Map(); // unit id -> element

  const OBSTACLE = {
    sewer: 'barrel', crypt: 'grave', keep: 'crate', tower: 'crystal', town: 'snowrock', interior: 'crate',
    vault: 'pillar', mirror: 'crystal', hollow: 'stump', folded: 'chair',
  };
  function obstacleSvg(kind) {
    const k = {
      barrel: '<ellipse cx="50" cy="92" rx="30" ry="6" fill="#0008"/><rect x="24" y="30" width="52" height="62" rx="10" fill="#6b4a2a"/><rect x="24" y="40" width="52" height="5" fill="#2a2a2a"/><rect x="24" y="76" width="52" height="5" fill="#2a2a2a"/><ellipse cx="50" cy="30" rx="26" ry="7" fill="#8a6440"/>',
      grave: '<ellipse cx="50" cy="94" rx="32" ry="6" fill="#0008"/><path d="M28 94 L30 40 Q50 14 70 40 L72 94Z" fill="#6c6876"/><circle cx="50" cy="52" r="9" fill="none" stroke="#3c3946" stroke-width="3"/>',
      crate: '<ellipse cx="50" cy="94" rx="34" ry="6" fill="#0008"/><rect x="20" y="40" width="60" height="54" fill="#7a5a34"/><path d="M20 40 L80 94 M80 40 L20 94" stroke="#4a3418" stroke-width="5"/><rect x="20" y="40" width="60" height="54" fill="none" stroke="#4a3418" stroke-width="5"/>',
      crystal: '<ellipse cx="50" cy="94" rx="30" ry="6" fill="#0008"/><path d="M50 8 L64 40 L58 94 L40 94 L36 44Z" fill="#7fc6ff" opacity="0.9"/><path d="M30 50 L40 64 L38 94 L24 94Z" fill="#a8dcff" opacity="0.85"/><path d="M70 46 L78 66 L74 94 L62 94Z" fill="#5aa8ee" opacity="0.85"/>',
      snowrock: '<ellipse cx="50" cy="94" rx="36" ry="6" fill="#0006"/><path d="M14 94 Q20 50 46 46 Q76 42 86 94Z" fill="#7b8292"/><path d="M22 66 Q40 44 60 46 Q78 50 82 70 Q60 60 22 66Z" fill="#eef4ff"/>',
      pillar: '<ellipse cx="50" cy="94" rx="30" ry="6" fill="#0008"/><rect x="34" y="6" width="32" height="88" fill="#e6c870"/><rect x="28" y="6" width="44" height="8" fill="#c9a44a"/><rect x="28" y="86" width="44" height="8" fill="#c9a44a"/>',
      stump: '<ellipse cx="50" cy="94" rx="34" ry="6" fill="#0008"/><path d="M28 94 L32 50 L68 50 L72 94Z" fill="#5a3e22"/><ellipse cx="50" cy="50" rx="18" ry="6" fill="#a07a48"/><path d="M28 94 Q14 92 10 98 M72 94 Q88 90 92 98" stroke="#5a3e22" stroke-width="6" fill="none"/>',
      chair: '<ellipse cx="50" cy="94" rx="28" ry="6" fill="#0008"/><rect x="30" y="20" width="40" height="42" rx="4" fill="#a8b8d8" opacity="0.8"/><rect x="26" y="58" width="48" height="10" fill="#c8d4ec"/><rect x="28" y="66" width="6" height="28" fill="#8898b8"/><rect x="66" y="66" width="6" height="28" fill="#8898b8"/>',
    }[kind] || '';
    return '<svg viewBox="0 0 100 100" width="100%" height="100%">' + k + '</svg>';
  }

  function unitArt(u) {
    if (u.kind === 'mon') return UI.art('monster', u.g.def.art, { hue: u.g.def.hue || 0 });
    if (u.kind === 'summon') { const md = BT.MONSTERS[u.ch.mid]; return UI.art('monster', md.art, { hue: md.hue || 0 }); }
    return UI.figure(u.ch);
  }
  function unitName(u) { return u.kind === 'mon' ? u.g.def.name : u.ch.name; }
  function unitHp(u) { return u.kind === 'mon' ? [u.m.hp, u.m.maxhp] : [Math.max(0, u.ch.hp), u.ch.maxhp]; }

  function place(el, u) {
    const p = foot(u.c, u.r), q = pct(p);
    let h = u.kind === 'pc' ? 3.4 : 2.5;
    if (u.kind === 'mon' && u.g.def.boss) h = 4;
    const hp = p.s * h / VBH * 100;
    el.style.left = q.l + '%';
    el.style.top = q.t + '%';
    el.style.height = hp + '%';
    el.style.zIndex = 10 + u.r * 2;
  }

  function makeToken(cb, u) {
    const el = document.createElement('div');
    el.className = 'btok ' + (u.kind === 'mon' ? 'foe' + (u.g.def.boss ? ' boss' : '') : 'ally ' + u.kind);
    el.dataset.u = u.id;
    el.innerHTML = '<div class="bart">' + unitArt(u) + '</div><div class="bhp"><i></i></div><div class="blab"></div><div class="bst"></div>';
    el.onclick = (e) => { e.stopPropagation(); clickHex(u.c, u.r); };
    root.querySelector('.btokens').appendChild(el);
    tokens.set(u.id, el);
    place(el, u);
    return el;
  }

  function syncToken(cb, u, el) {
    const [hp, max] = unitHp(u);
    el.querySelector('.bhp i').style.width = Math.max(0, hp / max * 100) + '%';
    const st = [];
    if (u.kind === 'mon') {
      if (u.g.sleep > 0) st.push('zZ');
      if (u.g.held > 0) st.push('held');
    } else if (u.kind === 'pc') {
      const s = u.ch.status;
      if (s !== 'ok' && s !== 'dead') st.push(D.STATUS[s].name); // the fallen figure says 'dead' by itself
      if (u.ch._parry) st.push('🛡');
      if (u.ch._hidden) st.push('hidden');
      el.classList.toggle('dead', s === 'dead');
      el.classList.toggle('stoned', s === 'stoned');
      el.classList.toggle('hidden', !!u.ch._hidden);
    }
    el.querySelector('.bst').textContent = st.join(' ');
    el.title = unitName(u) + ' ' + hp + '/' + max;
  }

  BV.open = function (cb) {
    BV.close();
    const wrap = $('viewWrap');
    root = document.createElement('div');
    root.id = 'battle';
    const style = BT.MAPS[BT.G.map].style;
    root.className = 'st-' + style;
    let poly = '';
    for (let r = 0; r < HX.ROWS; r++) for (let c = 0; c < HX.COLS; c++) {
      const k = HX.key(c, r);
      poly += '<polygon class="hx' + (cb.obstacles.has(k) ? ' obs' : '') + '" data-k="' + k + '" points="' + hexPoints(c, r, 0.96) + '"/>';
    }
    // ground under the board
    const g0 = proj(-1, BS.h + 0.6), g1 = proj(BS.w + 1, BS.h + 0.6), g2 = proj(BS.w + 1, -0.6), g3 = proj(-1, -0.6);
    root.innerHTML = '<div class="bboard"><svg class="bhex" viewBox="0 0 ' + VBW + ' ' + VBH + '" preserveAspectRatio="none">' +
      '<defs><radialGradient id="bvGround" cx="0.5" cy="0.6" r="0.7"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs>' +
      '<polygon class="bground" fill="url(#bvGround)" points="' + [g0, g1, g2, g3].map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ') + '"/>' +
      poly + '</svg><div class="btokens"></div></div>' +
      '<div class="bfig"></div><div class="bq"></div><div class="bround"></div><div class="bauto">Auto-battle &middot; press <b>Esc</b> to take control</div>';
    wrap.appendChild(root);
    root.querySelectorAll('polygon.hx').forEach((p) => {
      p.onclick = () => { const h = HX.unkey(+p.dataset.k); clickHex(h.c, h.r); };
      p.onmouseenter = () => { if (pick) { const h = HX.unkey(+p.dataset.k); if (pick.allowed.has(+p.dataset.k)) { pick.cur = h; drawCursor(); } } };
    });
    for (const k of cb.obstacles) {
      const h = HX.unkey(k);
      const el = document.createElement('div');
      el.className = 'btok obst';
      el.innerHTML = obstacleSvg(OBSTACLE[style] || 'snowrock');
      root.querySelector('.btokens').appendChild(el);
      place(el, { kind: 'obst', c: h.c, r: h.r });
      el.style.height = (foot(h.c, h.r).s * 1.1 / VBH * 100) + '%';
    }
    document.body.classList.add('inbattle');
    BV.build(cb);
  };

  BV.close = function () {
    if (root) root.remove();
    root = null; pick = null; clickRes = null;
    tokens.clear();
    document.body.classList.remove('inbattle');
    if (UI.modalKey && UI.modalKey._battle) UI.modalKey = null;
  };

  BV.build = function (cb) {
    if (!root) return;
    const ids = new Set(cb.units.map((u) => u.id));
    for (const [id, el] of tokens) if (!ids.has(id)) { el.remove(); tokens.delete(id); }
    for (const u of cb.units) if (!tokens.has(u.id)) makeToken(cb, u);
    BV.sync(cb);
  };
  BV.sync = function (cb) {
    if (!root) return;
    for (const u of cb.units) {
      const el = tokens.get(u.id) || makeToken(cb, u);
      syncToken(cb, u, el);
      if (!el.classList.contains('moving')) place(el, u);
    }
    if (BV._active) BV.setActive(cb, BV._active, true);
  };

  BV.move = async function (cb, u, path) {
    const el = tokens.get(u.id);
    if (!el || !root) return;
    const ms = Math.max(0, Math.min(220, BT.CB.delay * 0.4));
    el.classList.add('moving');
    el.style.transitionDuration = ms + 'ms';
    for (const h of path) {
      place(el, { kind: u.kind, g: u.g, c: h.c, r: h.r });
      if (ms) await U.sleep(ms);
    }
    el.classList.remove('moving');
    el.style.transitionDuration = '';
  };
  BV.lunge = function (cb, u, t) {
    const el = tokens.get(u.id);
    if (!el || !t) return;
    const a = pct(foot(u.c, u.r)), b = pct(foot(t.c, t.r));
    el.style.setProperty('--lx', ((b.l - a.l) * 0.35) + 'cqw');
    el.style.setProperty('--ly', ((b.t - a.t) * 0.35) + 'cqh');
    el.classList.remove('lunge'); void el.offsetWidth; el.classList.add('lunge');
  };
  BV.hit = function (cb, u) {
    const el = tokens.get(u.id);
    if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  };
  BV.float = function (cb, u, text, cls) {
    const el = tokens.get(u.id);
    if (!el) return;
    const f = document.createElement('div');
    f.className = 'bfloat ' + (cls || '');
    f.textContent = text;
    el.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  };
  BV.kill = function (cb, u) {
    const el = tokens.get(u.id);
    if (!el) return;
    if (u.kind === 'pc') { el.classList.add('dead'); return; }
    el.classList.add('dying');
    tokens.delete(u.id);
    setTimeout(() => el.remove(), 650);
  };
  BV.blast = function (cb, g, fx) {
    for (const u of cb.units) if (u.g === g) { const el = tokens.get(u.id); if (el) { el.classList.remove('blast', 'fx-' + fx); void el.offsetWidth; el.classList.add('blast', 'fx-' + fx); } }
  };

  BV.setActive = function (cb, u, quiet) {
    if (!root) return;
    BV._active = u;
    for (const [id, el] of tokens) el.classList.toggle('act', id === u.id);
    const fig = root.querySelector('.bfig');
    const [hp, max] = unitHp(u);
    let sub = '', bars = '<div class="bbar hp"><i style="width:' + Math.max(0, hp / max * 100) + '%"></i><span>' + hp + '/' + max + '</span></div>';
    if (u.kind === 'pc') {
      const ch = u.ch, mx = ST.maxSp(ch);
      sub = D.CLASSES[ch.cls].name + ' ' + ch.level;
      if (mx) bars += '<div class="bbar sp"><i style="width:' + (ch.sp / mx * 100) + '%"></i><span>' + ch.sp + '/' + mx + ' SP</span></div>';
      if (ch.cls === 'bard') bars += '<div class="bbar voice"><i style="width:' + (ch.voice / ST.maxVoice(ch) * 100) + '%"></i><span>Voice ' + ch.voice + '</span></div>';
    } else if (u.kind === 'summon') sub = 'Summoned ally';
    else {
      const left = u.g.members.filter((m) => m.hp > 0 && !m.unit).length;
      sub = 'Level ' + u.g.def.lvl + (left ? ' &middot; ' + left + ' more waiting' : '');
    }
    const key = u.kind + u.id;
    if (fig.dataset.k !== key) {
      fig.dataset.k = key;
      fig.className = 'bfig ' + (u.kind === 'mon' ? 'foe' : 'ally');
      fig.innerHTML = '<div class="bfart">' + unitArt(u) + '</div><div class="bfplate"><div class="bfname">' + U.esc(unitName(u)) + '</div><div class="bfsub"></div><div class="bfbars"></div></div>';
      if (!quiet) { fig.classList.remove('enter'); void fig.offsetWidth; fig.classList.add('enter'); }
    }
    fig.querySelector('.bfsub').innerHTML = sub;
    fig.querySelector('.bfbars').innerHTML = bars;
    root.querySelectorAll('.bq .qc').forEach((q) => q.classList.toggle('now', +q.dataset.u === u.id));
  };
  BV.turn = function (cb, u) { BV.setActive(cb, u); };

  BV.queue = function (cb, units) {
    if (!root) return;
    root.querySelector('.bq').innerHTML = units.map((u) => {
      const art = u.kind === 'pc' ? UI.portrait(u.ch) : unitArt(u);
      return '<div class="qc ' + (u.kind === 'mon' ? 'foe' : 'ally') + '" data-u="' + u.id + '" title="' + U.esc(unitName(u)) + '">' + art + '</div>';
    }).join('');
  };
  BV.round = function (cb, n) { if (root) root.querySelector('.bround').textContent = 'Round ' + n; };
  BV.autoBanner = function (cb, on) { if (root) root.classList.toggle('auto', !!on); };

  // ---- highlights, labels, picking ----
  BV.highlight = function (cb, o) {
    if (!root) return;
    root.querySelectorAll('polygon.hx').forEach((p) => p.classList.remove('reach', 'tgt', 'cur'));
    for (const [, el] of tokens) el.classList.remove('tgt');
    if (!o) return;
    if (o.reach) for (const [k, h] of o.reach) if (h.d > 0) { const p = root.querySelector('polygon[data-k="' + k + '"]'); if (p) p.classList.add('reach'); }
    for (const t of o.targets || []) {
      const p = root.querySelector('polygon[data-k="' + HX.key(t.c, t.r) + '"]');
      if (p) p.classList.add('tgt');
      const el = tokens.get(t.id);
      if (el) el.classList.add('tgt');
    }
  };
  BV.label = function (cb, units) {
    if (!root) return null;
    for (const [, el] of tokens) el.querySelector('.blab').textContent = '';
    if (!units) return null;
    const keys = units.map((u, i) => (i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9)));
    units.forEach((u, i) => { const el = tokens.get(u.id); if (el) el.querySelector('.blab').textContent = keys[i].toUpperCase(); });
    return keys;
  };

  function clickHex(c, r) {
    if (pick) {
      const k = HX.key(c, r);
      if (pick.allowed.has(k)) { const p = pick; pick = null; drawCursor(); p.res({ c, r }); }
      return;
    }
    if (clickRes) { const f = clickRes; clickRes = null; f({ hex: { c, r } }); }
  }
  BV.waitClick = function () {
    if (!root) return null;
    return new Promise((res) => { clickRes = res; });
  };
  BV.clearClick = function () { clickRes = null; };

  function drawCursor() {
    if (!root) return;
    root.querySelectorAll('polygon.hx.cur').forEach((p) => p.classList.remove('cur'));
    if (pick && pick.cur) { const p = root.querySelector('polygon[data-k="' + HX.key(pick.cur.c, pick.cur.r) + '"]'); if (p) p.classList.add('cur'); }
  }
  // Choose a hex from `cells` with arrows + Enter, or the mouse. Resolves {c, r} or null.
  BV.pickHex = function (cb, cells, from) {
    if (!root || !cells.length) return Promise.resolve(null);
    return new Promise((res) => {
      const allowed = new Map(cells.map((h) => [HX.key(h.c, h.r), h]));
      const start = cells.slice().sort((a, b) => HX.dist(a, { c: from.c + 1, r: from.r }) - HX.dist(b, { c: from.c + 1, r: from.r }))[0];
      const done = (v) => { pick = null; UI.modalKey = null; drawCursor(); const menu = $('menu'); menu.innerHTML = ''; menu.classList.remove('active'); res(v); };
      pick = { allowed, cur: { c: start.c, r: start.r }, res: (v) => done(v) };
      drawCursor();
      const menu = $('menu');
      menu.innerHTML = '<div class="mtitle">Move where?</div><div class="mtext">Arrow keys and <b>Enter</b>, or click a blue hex. <b>Esc</b> cancels.</div>';
      menu.classList.add('active');
      const mk = (e) => {
        const k = e.key;
        if (k === 'Escape') { done(null); return true; }
        if (k === 'Enter' || k === ' ') { done(pick.cur); return true; }
        const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], d: [1, 0], a: [-1, 0], w: [0, -1], s: [0, 1] }[k];
        if (!dir) return true;
        const cur = HX.center(pick.cur.c, pick.cur.r);
        let best = null, bs = 1e9;
        for (const h of cells) {
          const p = HX.center(h.c, h.r), dx = p.x - cur.x, dy = p.y - cur.y;
          const along = dx * dir[0] + dy * dir[1];
          if (along <= 0.1) continue;
          const side = Math.abs(dx * dir[1] - dy * dir[0]);
          const score = along + side * 2.2;
          if (score < bs) { bs = score; best = h; }
        }
        if (best) { pick.cur = { c: best.c, r: best.r }; drawCursor(); UI.sfx('menu_move'); }
        return true;
      };
      mk._battle = true;
      UI.modalKey = mk;
    });
  };

  // Esc ends auto-battle (combat checks cb.autoAll before each hero turn)
  document.addEventListener('keydown', (e) => {
    const cb = BT.CB && BT.CB.state && BT.CB.state();
    if (cb && cb.autoAll && e.key === 'Escape') { cb.autoAll = false; BV.autoBanner(cb, false); UI.log('You take back control.', 'info'); }
  });

  BT.BV = BV;
})();
