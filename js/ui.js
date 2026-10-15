// DOM UI: message log, promise-based menus, party bar, art overlay, modals, character sheet.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST;
  const UI = {};
  const $ = (id) => document.getElementById(id);
  let menuState = null; // {options, idx, resolve, cancel}
  const artCache = {};

  UI.init = function () {
    document.addEventListener('keydown', onKey);
  };

  UI.sfx = function (n, o) { if (BT.audio) BT.audio.sfx(n, o); };

  // ---------- log ----------
  UI.log = function (html, cls) {
    const log = $('log');
    const p = document.createElement('div');
    p.className = 'msg' + (cls ? ' ' + cls : '');
    p.innerHTML = html;
    log.appendChild(p);
    while (log.children.length > 80) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  };
  UI.clearLog = function () { $('log').innerHTML = ''; };

  // ---------- menus ----------
  UI.busy = () => !!menuState;

  UI.menu = function (o) {
    return new Promise((resolve) => {
      const opts = (o.options || []).filter(Boolean);
      let auto = 1;
      const used = {};
      for (const op of opts) if (op.key) used[op.key.toLowerCase()] = 1;
      for (const op of opts) {
        if (!op.key) {
          while (used[String(auto)] && auto < 10) auto++;
          if (auto < 10) { op.key = String(auto); used[op.key] = 1; auto++; }
        }
      }
      const el = $('menu');
      let html = '';
      if (o.title) html += '<div class="mtitle">' + o.title + '</div>';
      if (o.text) html += '<div class="mtext">' + o.text + '</div>';
      html += '<div class="mopts">';
      opts.forEach((op, i) => {
        html += '<button class="mopt' + (op.disabled ? ' disabled' : '') + (op.cls ? ' ' + op.cls : '') + '" data-i="' + i + '">' +
          (op.key ? '<span class="mkey">' + (op.key === ' ' ? '&#9251;' : U.esc(op.key.toUpperCase())) + '</span>' : '') +
          '<span class="mlabel">' + op.label + '</span>' + (op.hint ? '<span class="mhint">' + op.hint + '</span>' : '') + '</button>';
      });
      html += '</div>';
      if (o.cancel !== undefined) html += '<div class="mcancel">Esc - ' + (o.cancelLabel || 'Back') + '</div>';
      el.innerHTML = html;
      el.classList.add('active');
      el.scrollTop = 0;
      const first = opts.findIndex((op) => !op.disabled);
      menuState = { opts, idx: first, resolve, cancel: o.cancel, kind: 'menu' };
      highlight();
      el.querySelectorAll('.mopt').forEach((b) => {
        b.onclick = () => choose(+b.dataset.i);
        b.onmouseenter = () => { if (menuState) { menuState.idx = +b.dataset.i; highlight(); } };
      });
    });
  };

  function highlight() {
    const btns = $('menu').querySelectorAll('.mopt');
    btns.forEach((b, i) => b.classList.toggle('sel', menuState && i === menuState.idx));
    const sel = btns[menuState ? menuState.idx : -1];
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }

  function choose(i) {
    if (!menuState) return;
    const op = menuState.opts[i];
    if (!op || op.disabled) { UI.sfx('error'); return; }
    UI.sfx('menu_select');
    finish(op.value !== undefined ? op.value : i);
  }
  function finish(v) {
    const r = menuState.resolve;
    menuState = null;
    const el = $('menu');
    el.innerHTML = '';
    el.classList.remove('active');
    r(v);
  }
  UI.cancelMenu = function () { if (menuState) finish(menuState.cancel); };

  UI.pause = function (text, label) {
    return UI.menu({ text, options: [{ label: label || 'Continue', key: ' ', value: true, cls: 'cont' }] });
  };
  UI.confirm = async function (text) {
    return UI.menu({ text, options: [{ label: 'Yes', key: 'y', value: true }, { label: 'No', key: 'n', value: false }], cancel: false });
  };
  UI.input = function (text, ph) {
    return new Promise((resolve) => {
      const el = $('menu');
      el.innerHTML = '<div class="mtext">' + text + '</div><input id="uiInput" class="uiinput" maxlength="24" autocomplete="off" placeholder="' + (ph || '') + '"><div class="mopts"><button class="mopt" id="uiOk"><span class="mkey">↵</span><span class="mlabel">OK</span></button><button class="mopt" id="uiCancel"><span class="mkey">Esc</span><span class="mlabel">Cancel</span></button></div>';
      el.classList.add('active');
      const inp = $('uiInput');
      menuState = { kind: 'input', resolve, opts: [], cancel: null };
      setTimeout(() => inp.focus(), 30);
      const done = (v) => { menuState = null; el.innerHTML = ''; el.classList.remove('active'); resolve(v); };
      inp.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') done(inp.value.trim());
        if (e.key === 'Escape') done(null);
      };
      $('uiOk').onclick = () => done(inp.value.trim());
      $('uiCancel').onclick = () => done(null);
    });
  };

  // Pick a party member. filter(ch) -> bool
  UI.pickMember = function (title, filter, allowSummon) {
    const G = BT.G;
    const list = G.party.slice();
    if (allowSummon && G.summon) list.push(G.summon);
    const options = list.map((ch, i) => ({
      label: U.esc(ch.name), key: String(i + 1), value: ch,
      hint: ch.summon ? 'summoned' : D.CLASSES[ch.cls].abbr + ' ' + ch.hp + '/' + ch.maxhp,
      disabled: filter ? !filter(ch) : false,
    }));
    menuState && UI.cancelMenu();
    UI.pickingMember = true;
    renderPartyPickable(filter);
    return UI.menu({ title, options, cancel: null }).then((v) => { UI.pickingMember = false; UI.renderParty(); return v; });
  };

  function onKey(e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (BT.audio) BT.audio.init();
    if (UI.modalKey && UI.modalKey(e)) { e.preventDefault(); return; }
    if (menuState && menuState.kind === 'menu') {
      const k = e.key.toLowerCase();
      if (k === 'arrowdown' || k === 'arrowup') {
        e.preventDefault();
        const n = menuState.opts.length;
        let i = menuState.idx;
        for (let s = 0; s < n; s++) {
          i = (i + (k === 'arrowdown' ? 1 : -1) + n) % n;
          if (!menuState.opts[i].disabled) break;
        }
        menuState.idx = i;
        UI.sfx('menu_move');
        highlight();
        return;
      }
      if (k === 'enter') { e.preventDefault(); if (menuState.idx >= 0) choose(menuState.idx); return; }
      if (k === 'escape') {
        e.preventDefault();
        if (menuState.cancel !== undefined) { UI.sfx('menu_move'); finish(menuState.cancel); }
        return;
      }
      const i = menuState.opts.findIndex((op) => op.key && op.key.toLowerCase() === k);
      if (i >= 0) { e.preventDefault(); choose(i); return; }
      if (k === ' ' && menuState.opts.length === 1) { e.preventDefault(); choose(0); }
      return;
    }
    if (menuState) return;
    if (UI.onExploreKey) UI.onExploreKey(e);
  }

  // ---------- art ----------
  // Custom image from assets/manifest.js, if one is listed for this art.
  function assetFor(kind, key, opts) {
    const A = window.BT_ASSETS && window.BT_ASSETS[kind];
    if (!A) return null;
    let file = null;
    if ((kind === 'portrait' || kind === 'figure') && opts) file = A[opts.race + '_' + opts.cls + '_' + opts.gender] || A[opts.cls + '_' + opts.gender];
    else file = A[key];
    if (!file) return null;
    const fit = kind === 'portrait' || kind === 'npc' || kind === 'scene' ? 'cover' : 'contain';
    return '<img class="asset" src="assets/' + U.esc(file) + '" style="width:100%;height:100%;object-fit:' + fit + ';' + (opts && opts.hue ? 'filter:hue-rotate(' + opts.hue + 'deg)' : '') + '" draggable="false">';
  }

  UI.art = function (kind, key, opts) {
    const asset = assetFor(kind, key, opts);
    if (asset) return asset;
    if (!BT.art) return '';
    const ck = kind + ':' + key + ':' + JSON.stringify(opts || {});
    if (artCache[ck]) return artCache[ck];
    let s = '';
    try {
      if (kind === 'monster') s = BT.art.monster(key, opts || {});
      else if (kind === 'npc') s = BT.art.npc(key);
      else if (kind === 'scene') s = BT.art.scene(key);
      else if (kind === 'portrait') s = BT.art.portrait(opts);
      else if (kind === 'figure') s = BT.art.figure ? BT.art.figure(opts) : BT.art.portrait(opts);
      else if (kind === 'npcFigure') s = BT.art.npcFigure && BT.art.npcFigureKeys && BT.art.npcFigureKeys.indexOf(key) >= 0 ? BT.art.npcFigure(key) : '';
    } catch (err) { console.error(err); s = ''; }
    artCache[ck] = s;
    return s;
  };
  // Full-body art for the character sheet; falls back to the bust portrait.
  UI.figure = function (ch) {
    if (ch.summon) return UI.portrait(ch);
    const opts = { race: ch.race, cls: ch.cls, gender: ch.gender, look: ch.look, seed: ch.seed };
    const f = UI.art('figure', 'fig' + ch.id + ch.cls, opts);
    return f ? '<div class="figwrap">' + f + '</div>' : UI.portrait(ch);
  };
  UI.portrait = function (ch) {
    if (ch.summon) {
      const md = BT.MONSTERS[ch.mid];
      return UI.art('monster', md.art, { hue: md.hue || 0 });
    }
    return UI.art('portrait', ch.id + ch.cls, { race: ch.race, cls: ch.cls, gender: ch.gender, look: ch.look, seed: ch.seed });
  };

  // Show an NPC or scene over the 3D view.
  UI.showNpc = function (key, caption) {
    const ov = $('overlay');
    const fig = UI.art('npcFigure', key);
    if (fig) {
      ov.innerHTML = '<div class="npcfig">' + fig + '</div>' + (caption ? '<div class="npccap">' + caption + '</div>' : '');
      ov.className = 'show npc fig';
    } else {
      ov.innerHTML = '<div class="npcframe">' + UI.art('npc', key) + '</div>' + (caption ? '<div class="npccap">' + caption + '</div>' : '');
      ov.className = 'show npc';
    }
  };
  UI.hideOverlay = function () { const ov = $('overlay'); ov.className = ''; ov.innerHTML = ''; };

  // groups: [{def, members:[...], dist}]
  UI.showMonsters = function (groups) {
    const ov = $('overlay');
    const live = groups.filter((g) => g.members.some((m) => m.hp > 0));
    if (!live.length) { UI.hideOverlay(); return; }
    let html = '<div class="mons n' + live.length + '">';
    live.forEach((g, gi) => {
      const alive = g.members.filter((m) => m.hp > 0).length;
      const scale = Math.max(0.55, 1 - (g.dist - 10) / 100);
      html += '<div class="mon' + (g.def.boss ? ' boss' : '') + '" data-g="' + groups.indexOf(g) + '" style="--s:' + scale + '">' +
        '<div class="monart">' + UI.art('monster', g.def.art, { hue: g.def.hue || 0 }) + '</div>' +
        '<div class="moncap"><b>' + (groups.indexOf(g) + 1) + '.</b> ' + (g.def.boss ? '' : alive + ' ') + U.esc(alive > 1 ? g.def.pl : g.def.name) + ' <span class="dist">' + g.dist + "'</span>" +
        (g.sleep ? ' <span class="st">zZ</span>' : '') + (g.held ? ' <span class="st">held</span>' : '') + '</div></div>';
    });
    html += '</div>';
    ov.innerHTML = html;
    ov.className = 'show combat';
  };
  UI.hitMonster = function (gi) {
    const el = document.querySelector('.mon[data-g="' + gi + '"] .monart');
    if (!el) return;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  };
  UI.spellFx = function (kind) {
    const colors = { fire: '#ff7a1a', ice: '#7fd6ff', lightning: '#fff27a', holy: '#fff6c0', dark: '#8a3cff', heal: '#7dffb0', generic: '#c58bff' };
    BT.R.flash(colors[kind] || colors.generic, 400);
    const ov = $('fx');
    ov.className = 'fx ' + kind;
    void ov.offsetWidth;
    ov.className = 'fx ' + kind + ' play';
  };

  // ---------- party bar ----------
  function renderPartyPickable(filter) {
    UI.renderParty();
    document.querySelectorAll('.pcard').forEach((c) => {
      const ch = c._ch;
      if (!ch) return;
      if (!filter || filter(ch)) c.classList.add('pickable');
    });
  }
  UI.renderParty = function () {
    const G = BT.G;
    const el = $('party');
    if (!G) { el.innerHTML = ''; return; }
    const list = G.party.slice();
    if (G.summon) list.push(G.summon);
    el.innerHTML = '';
    list.forEach((ch, i) => {
      const c = document.createElement('div');
      const status = ch.status || 'ok';
      c.className = 'pcard st-' + status + (i < 3 ? ' front' : '');
      c._ch = ch;
      const maxSp = ch.summon ? 0 : ST.maxSp(ch);
      const hpPct = ch.maxhp ? Math.max(0, ch.hp / ch.maxhp * 100) : 0;
      const spPct = maxSp ? Math.max(0, ch.sp / maxSp * 100) : 0;
      const clsName = ch.summon ? 'Summoned' : D.CLASSES[ch.cls].name + ' ' + ch.level;
      c.innerHTML = '<div class="pnum">' + (i + 1) + '</div>' +
        '<div class="pport">' + UI.portrait(ch) + '</div>' +
        '<div class="pinfo"><div class="pname">' + U.esc(ch.name) + '</div>' +
        '<div class="pcls">' + clsName + (ST.canLevel(ch) ? ' <span class="lvlup" title="Can advance at the Hall of Review">▲</span>' : '') + '</div>' +
        '<div class="bar hp"><i style="width:' + hpPct + '%"></i><span>' + Math.max(0, ch.hp) + '/' + ch.maxhp + '</span></div>' +
        (maxSp ? '<div class="bar sp"><i style="width:' + spPct + '%"></i><span>' + ch.sp + '/' + maxSp + '</span></div>' : (ch.cls === 'bard' ? '<div class="bar voice"><i style="width:' + (ch.voice / ST.maxVoice(ch) * 100) + '%"></i><span>Voice ' + ch.voice + '</span></div>' : '<div class="bar none"></div>')) +
        '<div class="pac">AC ' + ST.acStr(ST.ac(ch)) + (status !== 'ok' ? ' <span class="pstat">' + D.STATUS[status].name + '</span>' : '') + '</div></div>';
      c.onclick = () => {
        if (UI.pickingMember && menuState) {
          const idx = menuState.opts.findIndex((op) => op.value === ch);
          if (idx >= 0) choose(idx);
          return;
        }
        if (!menuState && UI.onCardClick) UI.onCardClick(ch);
      };
      el.appendChild(c);
      // only the first three can melee: mark the line between the ranks
      if (i === 2 && list.length > 3) {
        const dv = document.createElement('div');
        dv.className = 'rankdiv';
        dv.title = 'Members 1-3 fight in melee; members behind this line can only cast, sing, shoot or use items.';
        dv.innerHTML = '<span>Back rank</span>';
        el.appendChild(dv);
      }
    });
  };
  UI.floatText = function (ch, text, cls) {
    const G = BT.G;
    const list = G.party.slice();
    if (G.summon) list.push(G.summon);
    const i = list.indexOf(ch);
    const card = $('party').children[i];
    if (!card) return;
    const f = document.createElement('div');
    f.className = 'float ' + (cls || '');
    f.textContent = text;
    card.appendChild(f);
    if (cls === 'dmg') { card.classList.remove('hurt'); void card.offsetWidth; card.classList.add('hurt'); }
    setTimeout(() => f.remove(), 1200);
  };

  // ---------- HUD ----------
  UI.updateHud = function () {
    const G = BT.G;
    if (!G) return;
    document.body.classList.toggle('thawed', !!G.flags.malthor);
    const m = BT.MAPS[G.map];
    const fx = G.fx;
    let loc = '<b>' + U.esc(m.name) + '</b>';
    if (m.style === 'town') loc += ' &middot; ' + ST.timeStr();
    let comp = '';
    if (m.style === 'town' || fx.compass > 0) comp = U.DIRNAME[G.d];
    if (fx.compass > 0) comp += ' (' + G.x + ',' + G.y + ')';
    const icons = [];
    if (fx.light && fx.light.steps > 0) icons.push('<span title="Light">☀</span>');
    if (fx.compass > 0) icons.push('<span title="Compass">🧭</span>');
    if (fx.levitate > 0) icons.push('<span title="Levitation">🪶</span>');
    if (fx.trapsense > 0) icons.push('<span title="Trap Sense">⚠</span>');
    if (fx.song) icons.push('<span title="' + U.esc(D.SONGS.find((s) => s.id === fx.song.id).name) + '">♫</span>');
    if (G.faith) {
      const F = D.FAITHS[G.faith];
      const sym = BT.art && BT.art.symbol ? '<span class="fsym">' + BT.art.symbol(G.faith, 18) + '</span>' : '';
      icons.unshift('<span title="' + U.esc(F.name + ' - ' + F.blessing) + '">' + sym + '</span>');
    }
    const cell = m.fl[G.y][G.x];
    if (cell & BT.MG.F_DARK) icons.push('<span title="Magical darkness" class="bad">●</span>');
    if (cell & BT.MG.F_ANTI) icons.push('<span title="Anti-magic zone" class="bad">⊘</span>');
    $('hud').innerHTML = '<div class="loc">' + loc + '</div><div class="comp">' + comp + '</div><div class="icons">' + icons.join('') + '</div>';
    const mm = $('minimap');
    if (mm) BT.R.drawMap(mm);
  };

  // ---------- modal ----------
  UI.modal = function (html, cls) {
    const m = $('modal');
    m.innerHTML = '<div class="mbox ' + (cls || '') + '">' + html + '</div>';
    m.className = 'show';
    return m.firstChild;
  };
  UI.closeModal = function () { const m = $('modal'); m.className = ''; m.innerHTML = ''; UI.modalKey = null; };

  UI.fullMap = function () {
    return new Promise((res) => {
      const box = UI.modal('<div class="mhead">' + U.esc(BT.MAPS[BT.G.map].name) + '</div><canvas id="bigmap" width="640" height="640"></canvas><div class="mfoot">Any key to close</div>', 'mapbox');
      BT.R.drawMap($('bigmap'), { all: BT.G.flags['reveal_' + BT.G.map] });
      const close = () => { UI.closeModal(); res(); };
      box.onclick = close;
      UI.modalKey = () => { close(); return true; };
    });
  };

  // ---------- character sheet ----------
  UI.charSheet = function (ch, opts) {
    opts = opts || {};
    return new Promise((res) => {
      let sel = -1;
      const render = (msg) => {
        if (ch.summon) {
          UI.modal('<div class="sheet"><div class="sport">' + UI.portrait(ch) + '</div><div class="sbody"><h2>' + U.esc(ch.name) + '</h2><p>A summoned ally. It fights on its own until slain or dismissed.</p><p>HP ' + ch.hp + '/' + ch.maxhp + ' &middot; AC ' + ch.ac + '</p><div class="sbtns"><button id="sDismiss">Dismiss</button><button id="sClose">Close (Esc)</button></div></div></div>', 'sheetbox');
          $('sDismiss').onclick = () => { BT.G.summon = null; UI.closeModal(); UI.renderParty(); res(); };
          $('sClose').onclick = () => { UI.closeModal(); res(); };
          UI.modalKey = (e) => { if (e.key === 'Escape' || e.key === ' ') { UI.closeModal(); res(); } return true; };
          return;
        }
        const c = D.CLASSES[ch.cls];
        let stats = '';
        for (const k of D.STATS) {
          const v = ST.stat(ch, k), b = ch.base[k];
          stats += '<div class="srow"><span>' + D.STATNAME[k] + '</span><b>' + v + (v !== b ? ' <i>(' + b + ')</i>' : '') + '</b></div>';
        }
        const nx = D.xpFor(ch.level + 1);
        let spells = '';
        for (const sch in ch.spells) spells += '<div class="srow"><span>' + D.SCHOOLS[sch] + ' spells</span><b>Lvl ' + ch.spells[sch] + '</b></div>';
        let inv = '';
        ch.inv.forEach((it, i) => {
          const d = BT.ITEMS[it.id];
          const usable = BT.canUse(ch, d);
          let info = '';
          if (d.dmg && d.slot === 'weapon') info += d.dmg[0] ? U.diceStr(d.dmg) : 'unarmed+';
          if (d.ac) info += ' AC-' + d.ac;
          if (d.hit) info += ' +' + d.hit + 'hit';
          if (it.ch != null) info += ' (' + it.ch + ')';
          inv += '<div class="inv' + (i === sel ? ' sel' : '') + (it.eq ? ' eq' : '') + (!usable ? ' nouse' : '') + (d.magic ? ' magic' : '') + (d.quest ? ' quest' : '') + '" data-i="' + i + '">' +
            '<span class="ieq">' + (it.eq ? '◆' : '') + '</span><span class="iname">' + U.esc(d.name) + '</span><span class="iinfo">' + info + '</span></div>';
        });
        for (let i = ch.inv.length; i < ST.MAX_INV; i++) inv += '<div class="inv empty">-</div>';
        let btns = '';
        if (sel >= 0) {
          const it = ch.inv[sel], d = BT.ITEMS[it.id];
          if (d.slot !== 'use' && d.slot !== 'quest') btns += '<button data-a="eq">' + (it.eq ? 'Unequip' : 'Equip') + '</button>';
          if (d.use && !opts.noUse) btns += '<button data-a="use">Use</button>';
          if (!opts.noTrade) btns += '<button data-a="give">Give</button>';
          if (!d.quest && !opts.noTrade) btns += '<button data-a="drop">Discard</button>';
        }
        UI.modal(
          '<div class="sheet"><div class="sport cls-' + ch.cls + '">' + UI.figure(ch) + '</div><div class="sbody">' +
          '<h2>' + U.esc(ch.name) + '</h2><div class="ssub">' + (ch.gender === 'f' ? 'Female' : 'Male') + ' ' + D.RACES[ch.race].name + ' ' + c.name + ' &middot; Level ' + ch.level + '</div>' +
          '<div class="scols"><div class="scol">' + stats +
          '<div class="srow"><span>Hit Points</span><b>' + ch.hp + '/' + ch.maxhp + '</b></div>' +
          (ST.maxSp(ch) ? '<div class="srow"><span>Spell Points</span><b>' + ch.sp + '/' + ST.maxSp(ch) + '</b></div>' : '') +
          '<div class="srow"><span>Armor Class</span><b>' + ST.acStr(ST.ac(ch)) + '</b></div>' +
          '<div class="srow"><span>Experience</span><b>' + ch.xp + '</b></div>' +
          '<div class="srow"><span>Next level</span><b>' + (nx - ch.xp > 0 ? nx - ch.xp : 'Ready!') + '</b></div>' +
          '<div class="srow"><span>Gold</span><b>' + ch.gold + '</b></div>' +
          '<div class="srow"><span>Faith</span><b>' + (BT.G.faith ? D.FAITHS[BT.G.faith].name : 'None') + '</b></div>' +
          '<div class="srow"><span>Status</span><b style="color:' + D.STATUS[ch.status].color + '">' + D.STATUS[ch.status].name + '</b></div>' +
          (ch.cls === 'bard' ? '<div class="srow"><span>Voice</span><b>' + ch.voice + '/' + ST.maxVoice(ch) + '</b></div>' : '') +
          spells + '</div>' +
          '<div class="scol"><div class="sinvh">Inventory</div>' + inv + '<div class="sbtns">' + btns + '</div><div class="smsg">' + (msg || (sel >= 0 ? U.esc(itemDesc(BT.ITEMS[ch.inv[sel].id], ch)) : 'Click an item.')) + '</div></div></div>' +
          '<div class="sfoot"><button id="sPrev">◀</button><button id="sClose">Close (Esc)</button><button id="sNext">▶</button></div></div></div>', 'sheetbox');
        document.querySelectorAll('.inv[data-i]').forEach((el) => { el.onclick = () => { sel = +el.dataset.i; UI.sfx('menu_move'); render(); }; });
        document.querySelectorAll('.sbtns button').forEach((b) => { b.onclick = () => act(b.dataset.a); });
        $('sClose').onclick = () => { UI.closeModal(); res(); };
        const cycle = (k) => {
          const P = BT.G.party, i = P.indexOf(ch);
          if (i < 0) return;
          ch = P[(i + k + P.length) % P.length]; sel = -1; render();
        };
        $('sPrev').onclick = () => cycle(-1);
        $('sNext').onclick = () => cycle(1);
        UI.modalKey = (e) => {
          if (e.key === 'Escape') { UI.closeModal(); res(); }
          else if (e.key === 'ArrowLeft') cycle(-1);
          else if (e.key === 'ArrowRight') cycle(1);
          else if (e.key === 'ArrowDown') { sel = Math.min(ch.inv.length - 1, sel + 1); render(); }
          else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); }
          else if (e.key.toLowerCase() === 'e' && sel >= 0) act('eq');
          else if (e.key.toLowerCase() === 'u' && sel >= 0) act('use');
          return true;
        };
      };
      const act = async (a) => {
        const it = ch.inv[sel];
        if (!it) return;
        const d = BT.ITEMS[it.id];
        if (a === 'eq') {
          if (it.eq) { ST.unequip(ch, it); UI.sfx('menu_select'); render(); }
          else { const err = ST.equip(ch, it); UI.sfx(err ? 'error' : 'menu_select'); render(err); }
          UI.renderParty();
        } else if (a === 'drop') {
          ch.inv.splice(sel, 1); sel = -1; render('Discarded ' + d.name + '.'); UI.renderParty();
        } else if (a === 'give') {
          const others = BT.G.party.filter((o) => o !== ch);
          let h = '<div class="givebox"><div>Give ' + U.esc(d.name) + ' to:</div>';
          others.forEach((o, i) => { h += '<button data-o="' + i + '"' + (o.inv.length >= ST.MAX_INV ? ' disabled' : '') + '>' + U.esc(o.name) + '</button>'; });
          h += '<button data-o="-1">Cancel</button></div>';
          document.querySelector('.smsg').innerHTML = h;
          document.querySelectorAll('.givebox button').forEach((b) => {
            b.onclick = () => {
              const oi = +b.dataset.o;
              if (oi >= 0) {
                const o = others[oi];
                it.eq = false;
                ch.inv.splice(sel, 1);
                o.inv.push(it);
                sel = -1;
                render('Gave ' + d.name + ' to ' + o.name + '.');
                UI.renderParty();
              } else render();
            };
          });
        } else if (a === 'use') {
          UI.closeModal();
          if (UI.onUseItem) await UI.onUseItem(ch, it);
          res();
        }
      };
      render();
    });
  };

  function itemDesc(d, ch) {
    let s = d.name + '. ';
    if (d.desc) s += d.desc + ' ';
    if (d.slot === 'weapon' && d.dmg[0]) s += 'Damage ' + U.diceStr(d.dmg) + '. ';
    if (d.two) s += 'Two-handed. ';
    if (d.ranged) s += 'Can strike from the back rank and at range. ';
    if (d.el) s += 'Deals ' + d.el + ' damage. ';
    if (d.slay) s += 'Bane of the ' + d.slay + '. ';
    if (d.resist) s += 'Resists ' + d.resist + '. ';
    if (d.spBonus) s += '+' + d.spBonus + ' spell points. ';
    if (d.stat) for (const k in d.stat) s += '+' + d.stat[k] + ' ' + D.STATNAME[k] + '. ';
    if (d.songPower) s += 'Songs are ' + d.songPower + 'x as strong. ';
    if (d.use && d.use.spell) s += 'Use: ' + BT.SPELLS[d.use.spell].name + '. ';
    if (!BT.canUse(ch, d)) s += '(Your class cannot use this.) ';
    s += d.quest ? '' : 'Worth ' + Math.floor(d.price / 2) + ' gold.';
    return s;
  }
  UI.itemDesc = itemDesc;

  UI.toast = function (text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = text;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2800);
  };

  BT.UI = UI;
})();
