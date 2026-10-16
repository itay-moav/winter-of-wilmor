// The interface core: the message log, promise-based menus, text input, picking a party member and keyboard routing.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST;
  const UI = BT.UI = {};
  const $ = (id) => document.getElementById(id);
  let menuState = null; // {options, idx, resolve, cancel}

  UI.init = function () {
    document.addEventListener('keydown', onKey);
  };

  UI.sfx = function (n, o) { if (BT.audio) BT.audio.sfx(n, o); };

  // The bard's song takes over the music while it lasts: the battle's song in combat,
  // otherwise the song still carried from exploration. Idempotent; safe to call often.
  UI.syncSong = function () {
    const G = BT.G;
    let id = null;
    if (G && BT.main && BT.main.playing !== false) id = BT.CB && BT.CB.active() ? BT.CB.songId() : (G.fx && G.fx.song ? G.fx.song.id : null);
    if (BT.audio && BT.audio.song) BT.audio.song(id);
  };

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
  // Choose the open menu's option whose value is v (clicking a party card in "pick a member").
  UI.chooseValue = function (v) {
    if (!menuState) return false;
    const i = menuState.opts.findIndex((op) => op.value === v);
    if (i >= 0) choose(i);
    return i >= 0;
  };

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
    UI.renderPartyPickable(filter);
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
})();
