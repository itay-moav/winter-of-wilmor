// Exploration: the action lock, map changes, movement, per-step upkeep, arriving on a cell, party menus and keys.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG, MA = BT.MA, CB = BT.CB;
  const EX = {};
  let lock = 0; // >0 while an async action runs

  const map = () => BT.MAPS[BT.G.map];
  const evKey = (x, y) => BT.G.map + ':' + x + ':' + y;

  async function guard(fn) {
    if (lock) return;
    lock++;
    try { await fn(); } catch (e) { console.error(e); UI.log('Error: ' + U.esc(e.message), 'bad'); }
    finally { lock--; UI.updateHud(); UI.renderParty(); }
  }
  EX.guard = guard;
  EX.locked = () => lock > 0;

  // ---------- map changes ----------
  EX.changeMap = async function (id, x, y, d) {
    const G = BT.G, m = BT.MAPS[id];
    if (id !== 'town' && !G.party.length) { UI.log('You should gather a party at the Guild first.', 'bad'); return; }
    const prevStyle = BT.MAPS[G.map].style;
    G.map = id;
    G.x = x != null ? x : m.start.x;
    G.y = y != null ? y : m.start.y;
    G.d = d != null ? d : m.start.d;
    // face an open direction if we arrived facing a wall
    if (MG.edge(m, G.x, G.y, G.d) === 1) for (let k = 0; k < 4; k++) if (MG.passable(MG.edge(m, G.x, G.y, k))) { G.d = k; break; }
    BT.R.snap();
    ST.markExplored(id, G.x, G.y);
    UI.hideOverlay();
    if (BT.audio) BT.audio.music(BT.STYLES[m.style].music);
    UI.sfx('stairs');
    if (prevStyle !== m.style || id !== 'town') await EX.transition(m);
    UI.log('<span class="area">' + U.esc(m.name) + '</span>', 'info');
    if (!G.seen[id] || id === 'town') {
      G.seen[id] = true;
      ST.save('auto');
    }
    UI.updateHud();
  };

  EX.transition = function (m) {
    const key = BT.STYLES[m.style].scene || { town: 'town', sewer: 'sewers', crypt: 'crypt', keep: 'keep', tower: 'tower' }[m.style];
    const t = document.getElementById('transition');
    t.innerHTML = '<div class="tscene">' + UI.art('scene', key) + '</div><div class="tname">' + U.esc(m.name) + '</div>';
    t.className = 'show';
    return new Promise((res) => setTimeout(() => { t.className = 'show out'; setTimeout(() => { t.className = ''; t.innerHTML = ''; }, 700); res(); }, 1300));
  };

  // ---------- movement ----------
  EX.forward = async function () {
    const G = BT.G, m = map();
    const v = MG.edge(m, G.x, G.y, G.d);
    const nx = G.x + U.DX[G.d], ny = G.y + U.DY[G.d];
    if (m.style === 'town' && v === 2) {
      const b = BT.BUILDINGS[m.cellType[ny][nx]];
      if (b && b.map) {
        UI.sfx('door');
        const sym = BT.art && BT.art.symbol ? '<span class="isym">' + BT.art.symbol(b.faith, 22) + '</span> ' : '';
        if (await UI.confirm(sym + '<b>' + U.esc(b.name) + '</b>. The door is not locked. Go inside?')) await EX.changeMap(b.map);
        return;
      }
      if (b) { await BT.TW.enter(b.id); return; }
    }
    if (v === 1 || !MG.inside(m, nx, ny) || (m.fl[ny][nx] & MG.F_SOLID)) {
      UI.sfx('bump');
      await BT.R.bump();
      return;
    }
    // barrier events block entry
    const ev = m.ev[ny][nx];
    if (v === 2) UI.sfx('door');
    else UI.sfx('step');
    G.x = nx; G.y = ny;
    await BT.R.animate(170);
    const gen = BT.main.gen;
    await EX.tick();
    if (BT.main.gen !== gen) return; // game was reloaded
    await EX.arrive(false, ev);
  };
  EX.turn = async function (k) {
    const G = BT.G;
    G.d = (G.d + k + 4) % 4;
    await BT.R.animate(k === 2 ? 260 : 150);
    UI.updateHud();
  };
  EX.back = async function () {
    // step backwards without turning
    const G = BT.G, m = map();
    const bd = (G.d + 2) % 4;
    const v = MG.edge(m, G.x, G.y, bd);
    const nx = G.x + U.DX[bd], ny = G.y + U.DY[bd];
    if (v === 1 || !MG.inside(m, nx, ny) || (m.fl[ny][nx] & MG.F_SOLID)) { UI.sfx('bump'); return; }
    if (m.style === 'town' && v === 2) return;
    UI.sfx(v === 2 ? 'door' : 'step');
    G.x = nx; G.y = ny;
    await BT.R.animate(200);
    const gen = BT.main.gen;
    await EX.tick();
    if (BT.main.gen !== gen) return;
    await EX.arrive(false);
  };

  // Per-step upkeep.
  EX.tick = async function () {
    const G = BT.G, fx = G.fx, m = map();
    G.time++;
    G.stats.steps++;
    if (fx.light && fx.light.steps > 0) { fx.light.steps--; if (!fx.light.steps) { fx.light = null; UI.log('Your light fades.'); BT.R.invalidate(); } }
    if (fx.compass > 0) fx.compass--;
    if (fx.levitate > 0) { fx.levitate--; if (!fx.levitate) UI.log('Your feet touch the ground again.'); }
    if (fx.trapsense > 0) fx.trapsense--;
    if (fx.song) {
      fx.song.steps--;
      if (fx.song.id === 'hearth' && G.time % 4 === 0) for (const c of G.party) if (ST.alive(c)) c.hp = Math.min(c.maxhp, c.hp + Math.round(2 * fx.song.power));
      if (fx.song.steps <= 0) { UI.log('The song fades away.'); fx.song = null; BT.R.invalidate(); }
    }
    // sunlight restores magic in the city by day
    const sunRate = G.faith === 'dawn' ? 2 : 4;
    if (m.style === 'town' && !ST.isNight() && G.time % sunRate === 0) for (const c of G.party) if (ST.alive(c) && c.sp < ST.maxSp(c)) c.sp++;
    // Embrace of the Deep Root: the earth feeds the faithful below ground
    if (G.faith === 'root' && m.style !== 'town' && G.time % 4 === 0) for (const c of G.party) if (ST.alive(c) && c.hp < c.maxhp) c.hp++;
    // poison
    if (G.time % 5 === 0) for (const c of G.party) {
      if (c.status !== 'poisoned') continue;
      c.hp -= 1;
      if (c.hp <= 0) { c.hp = 0; c.status = 'dead'; UI.log('<b>' + U.esc(c.name) + '</b> succumbs to poison!', 'bad'); UI.sfx('death'); }
    }
    if (m.style === 'town') { const h = ST.hour(); if (G.time % ST.HOUR === 0 && (h === 20 || h === 6)) { UI.log(h === 20 ? 'Night falls over Velmoor.' : 'A grey dawn rises over Velmoor.', 'info'); BT.R.invalidate(); } }
    if (G.party.length && !G.party.some(ST.canAct)) await EX.gameOver();
  };

  // ---------- arriving on a cell ----------
  EX.arrive = async function (teleported) {
    const G = BT.G, m = map();
    ST.markExplored(G.map, G.x, G.y);
    UI.updateHud();
    const f = m.fl[G.y][G.x];
    if (f & MG.F_WATER) {
      if (G.fx.levitate > 0) UI.log('You float above freezing black water.');
      else {
        UI.sfx('party_hurt');
        UI.log('You wade through freezing water!', 'bad');
        for (const c of G.party) if (ST.alive(c)) { const d = U.roll(1, 3 + m.depth * 2); c.hp -= d; UI.floatText(c, '-' + d, 'dmg'); if (c.hp <= 0) { c.hp = 0; c.status = 'dead'; UI.log('<b>' + U.esc(c.name) + '</b> freezes to death!', 'bad'); } }
        UI.renderParty();
        if (!G.party.some(ST.canAct)) return EX.gameOver();
      }
    }
    const ev = m.ev[G.y][G.x];
    let fought = false;
    if (ev) fought = await EX.handleEvent(ev);
    if (BT.G.map !== m.id) return; // changed map
    if (!fought && !teleported && !(ev && (ev.t === 'stairs'))) await EX.randomEncounter();
  };

  // ---------- party actions ----------
  EX.castMenu = async function () {
    const casters = BT.G.party.filter((c) => ST.isMage(c) && ST.canAct(c));
    if (!casters.length) { UI.log('No one in the party can cast spells.'); return; }
    const ch = casters.length === 1 ? casters[0] : await UI.pickMember('Who casts?', (c) => ST.isMage(c) && ST.canAct(c));
    if (ch) await MA.castOutside(ch);
  };
  EX.songMenu = async function () {
    const G = BT.G;
    const bards = G.party.filter((c) => c.cls === 'bard' && ST.canAct(c));
    if (!bards.length) { UI.log('There is no bard in the party to sing.'); return; }
    const ch = bards.length === 1 ? bards[0] : await UI.pickMember('Who sings?', (c) => c.cls === 'bard' && ST.canAct(c));
    if (!ch) return;
    if (!ST.equipped(ch, 'instrument')) { UI.log(U.esc(ch.name) + ' needs an instrument equipped.'); return; }
    if (ch.voice <= 0) { UI.log(U.esc(ch.name) + '\'s voice is gone. A drink at the tavern will help.', 'bad'); return; }
    const song = await UI.menu({ title: U.esc(ch.name) + ' sings (voice ' + ch.voice + ')', options: D.SONGS.map((s) => ({ label: s.name, hint: s.desc, value: s })), cancel: null });
    if (!song) return;
    ch.voice--;
    const inst = BT.ITEMS[ST.equipped(ch, 'instrument').id];
    G.fx.song = { id: song.id, steps: 250 + ch.level * 20, power: (inst.songPower || 1) * (1 + ch.level / 12) };
    UI.sfx('song');
    UI.log('<b>' + U.esc(ch.name) + '</b> plays the ' + song.name + '. The music will carry into your next battles.', 'good');
    BT.R.invalidate();
    UI.renderParty();
  };
  EX.useMenu = async function () {
    const ch = await UI.pickMember('Whose item?', (c) => ST.canAct(c) && MA.usableItems(c, false).length > 0);
    if (!ch) return;
    const items = MA.usableItems(ch, false);
    const it = await UI.menu({ title: 'Use which item?', options: items.map((it) => ({ label: BT.ITEMS[it.id].name + (it.ch != null ? ' (' + it.ch + ')' : ''), value: it })), cancel: null });
    if (it) await MA.useOutside(ch, it);
  };

  EX.partyMenu = async function () {
    for (;;) {
      const c = await UI.menu({
        title: 'Party',
        options: [
          { label: 'Inspect character', key: 'i', value: 'inspect' },
          { label: 'Cast a spell', key: 'c', value: 'cast' },
          { label: 'Bard song', key: 'b', value: 'song' },
          { label: 'Use an item', key: 'u', value: 'use' },
          { label: 'Reorder party', key: 'o', value: 'order' },
          { label: 'Map', key: 'm', value: 'map' },
          { label: 'Save game', key: 's', value: 'save' },
          { label: 'Load game', key: 'l', value: 'load' },
          { label: 'Settings', key: 't', value: 'settings' },
          { label: 'Help', key: 'h', value: 'help' },
          { label: 'Quit to title', key: 'q', value: 'quit' },
        ],
        cancel: null,
      });
      if (!c) return;
      if (c === 'inspect') { const ch = await UI.pickMember('Inspect who?', null, true); if (ch) await UI.charSheet(ch); }
      if (c === 'cast') { await EX.castMenu(); return; }
      if (c === 'song') { await EX.songMenu(); return; }
      if (c === 'use') { await EX.useMenu(); return; }
      if (c === 'order') await BT.TW.reorder();
      if (c === 'map') await UI.fullMap();
      if (c === 'save') await BT.TW.saveMenu();
      if (c === 'load') { if (await BT.main.loadMenu()) return; }
      if (c === 'settings') await BT.main.settings();
      if (c === 'help') await BT.main.help();
      if (c === 'quit') { if (await UI.confirm('Quit to the title screen? Unsaved progress will be lost.')) { await BT.main.toTitle(); return; } }
    }
  };

  // ---------- input ----------
  UI.onExploreKey = function (e) {
    if (!BT.G || !BT.main.playing || lock || CB.active()) return;
    const k = e.key;
    const kl = k.toLowerCase();
    const act = {
      arrowup: () => EX.forward(), w: () => EX.forward(),
      arrowleft: () => EX.turn(-1), a: () => EX.turn(-1),
      arrowright: () => EX.turn(1), d: () => EX.turn(1),
      arrowdown: () => EX.turn(2), s: () => EX.turn(2),
      x: () => EX.back(),
      m: () => UI.fullMap(),
      c: () => EX.castMenu(),
      b: () => EX.songMenu(),
      u: () => EX.useMenu(),
      p: () => EX.partyMenu(), escape: () => EX.partyMenu(),
      o: () => BT.TW.reorder(),
      '?': () => BT.main.help(), h: () => BT.main.help(),
    }[kl];
    if (act) { e.preventDefault(); guard(act); return; }
    if (/^[1-7]$/.test(k)) {
      const list = BT.G.party.slice();
      if (BT.G.summon) list.push(BT.G.summon);
      const ch = list[+k - 1];
      if (ch) guard(() => UI.charSheet(ch));
    }
  };
  UI.onCardClick = function (ch) { if (!lock && !CB.active() && BT.main.playing) guard(() => UI.charSheet(ch)); };
  UI.onUseItem = async function (ch, it) { await MA.useOutside(ch, it); };

  BT.EX = EX;
})();
