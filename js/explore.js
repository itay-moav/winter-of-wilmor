// Exploration: movement, cell events, random encounters, party menu, map changes.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG, MA = BT.MA, CB = BT.CB;
  const EX = {};
  let moving = false;
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
    if (m.style !== 'town') G.fx.song = G.fx.song && G.fx.song.id === 'lantern' ? G.fx.song : G.fx.song;
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
    if (ev) fought = await handleEvent(ev);
    if (BT.G.map !== m.id) return; // changed map
    if (!fought && !teleported && !(ev && (ev.t === 'stairs'))) await randomEncounter();
  };

  async function handleEvent(ev) {
    const G = BT.G, m = map();
    const k = evKey(G.x, G.y);
    switch (ev.t) {
      case 'stairs': {
        if (ev.dir === 'up') {
          const up = m.up;
          const label = m.style === 'tower' ? 'down' : 'up';
          const text = up.map === 'town' ? 'An exit leads back to the city.' : 'Stairs lead ' + label + '.';
          if (await UI.confirm(text + ' Take them?')) {
            await EX.changeMap(up.map, up.x, up.y, up.d);
            if (up.text) UI.log(up.text);
          }
        } else {
          const label = ev.label || 'down';
          if (ev.require && !(ev.require.flag ? G.flags[ev.require.flag] : ST.hasItem(ev.require.item))) {
            UI.sfx('error');
            await UI.pause(ev.locked || 'The way is sealed.');
            return false;
          }
          if (await UI.confirm('Stairs lead ' + label + '. Take them?')) await EX.changeMap(ev.to);
        }
        return true;
      }
      case 'warp': {
        if (ev.require && !G.flags[ev.require.flag]) { UI.sfx('error'); await UI.pause(ev.locked || 'The way is closed.'); return false; }
        const q = { up: 'A narrow staircase leads up. Climb it?', down: 'Stairs lead down. Take them?', out: 'The front door leads back out to the street. Leave?', portal: 'The portal shimmers with light. Step through?' }[ev.label] || 'Go on?';
        if (await UI.confirm(q)) {
          if (ev.label === 'portal') { UI.sfx('teleport'); UI.spellFx('generic'); }
          await EX.changeMap(ev.to, ev.x, ev.y, ev.d);
          if (ev.text) UI.log(ev.text);
        }
        return true;
      }
      case 'msg':
        if (!ev.repeat && G.flags[k]) return false;
        G.flags[k] = true;
        UI.sfx('page');
        await UI.pause(ev.text);
        return false;
      case 'lyra': {
        if (G.flags[k]) return false;
        G.flags[k] = true;
        UI.showNpc(ev.key === 'tower' ? 'lyra' : 'ghost_girl', ev.key === 'tower' ? 'Lyra' : 'A pale girl');
        if (BT.audio) BT.audio.sfx('magic_mouth');
        await UI.pause(D.STORY.lyra[ev.key]);
        if (ev.item) {
          const who = ST.giveParty(ev.item);
          if (who) { UI.sfx('quest'); await UI.pause('Lyra presses something cold into ' + U.esc(who.name) + '\'s hand: <span class="item">' + BT.ITEMS[ev.item].name + '</span>. "Show him this, when the time comes."'); }
        }
        UI.hideOverlay();
        return false;
      }
      case 'fight': {
        if (G.flags[k]) return false;
        const r = await CB.fight(ev.groups, { text: ev.text, chest: !ev.items, items: ev.items, gold: ev.gold });
        if (r === 'win') G.flags[k] = true;
        if (r === 'lose') await EX.gameOver();
        return true;
      }
      case 'chest':
        if (G.flags[k]) return false;
        G.flags[k] = true;
        await CB.chest(ev.tier || m.depth || 1);
        return true;
      case 'trap': {
        if (G.fx.levitate > 0) { UI.log('You float safely over a hidden pit.'); return false; }
        if (G.fx.trapsense > 0) { UI.log('You sense a trap here and carefully step around it.', 'good'); return false; }
        const rogue = G.party.find((c) => c.cls === 'rogue' && ST.canAct(c));
        if (rogue && U.chance(0.25 + rogue.level * 0.03)) { UI.log('<b>' + U.esc(rogue.name) + '</b> spots a trap just in time!', 'good'); return false; }
        UI.sfx('trap');
        BT.R.shake(10);
        UI.log(ev.text || 'A trap!', 'bad');
        for (const c of G.party) {
          if (!ST.alive(c) || U.chance(0.25)) continue;
          const d = U.rollD(ev.dmg);
          c.hp -= d;
          UI.floatText(c, '-' + d, 'dmg');
          if (c.hp <= 0) { c.hp = 0; c.status = 'dead'; UI.log('<b>' + U.esc(c.name) + '</b> is killed!', 'bad'); }
          else if (ev.poison && c.status === 'ok' && U.chance(0.4)) { c.status = 'poisoned'; UI.log('<b>' + U.esc(c.name) + '</b> is poisoned!', 'bad'); }
        }
        UI.renderParty();
        if (!G.party.some(ST.canAct)) await EX.gameOver();
        return false;
      }
      case 'spinner':
        G.d = U.rand(4);
        BT.R.snap();
        if (G.fx.compass > 0) UI.log('Your compass spins wildly: the floor here turned you around!');
        return false;
      case 'teleport': {
        if (G.flags[k]) return false;
        G.flags[k] = true; // the rift collapses after use
        const cells = [];
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (!m.ev[y][x] && m.dist[y][x] > 2) cells.push([x, y]);
        const [x, y] = U.pick(cells);
        UI.sfx('teleport');
        UI.spellFx('generic');
        G.x = x; G.y = y;
        BT.R.snap();
        UI.log('The air shimmers - and suddenly you are somewhere else! (Behind you, the rift collapses.)', 'bad');
        ST.markExplored(G.map, x, y);
        return true;
      }
      case 'statue': {
        if (G.flags[k] === 'broken') { UI.log('Shattered stone lies here, all that is left of a gargoyle.'); return false; }
        const avg = ST.living().reduce((a, c) => a + c.level, 0) / Math.max(1, ST.living().length);
        if (ST.isNight() && avg >= 3 && U.chance(0.4)) {
          UI.sfx('roar'); BT.R.shake(10);
          const r = await CB.fight([['statue_gargoyle', 1 + U.rand(2)]], { text: 'With a crack like breaking ice, the gargoyle statue tears itself off its plinth!' });
          if (r === 'win') { G.flags[k] = 'broken'; BT.R.invalidate(); }
          if (r === 'lose') await EX.gameOver();
          return true;
        }
        if (!G.flags[k]) {
          G.flags[k] = 'seen';
          UI.log('A stone gargoyle crouches on a plinth here, snow on its wings. They say Malthor\'s rite woke some of them at night. Its hollow eyes seem to follow you.');
        }
        return false;
      }
      case 'riddle': {
        if (G.flags[ev.flag]) { UI.log('A stone mouth in the wall is silent now.'); return false; }
        UI.showNpc('mouth', 'A Magic Mouth');
        UI.sfx('magic_mouth');
        await UI.pause('A mouth of stone opens in the wall and speaks: "' + ev.q + '"');
        const a = await UI.input('Your answer:', '');
        const norm = (s) => (s || '').toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/^(a|an|the) /, '');
        if (a && ev.a.some((x) => norm(x) === norm(a))) {
          G.flags[ev.flag] = true;
          UI.sfx('quest');
          await UI.pause(ev.right);
        } else {
          UI.sfx('error');
          await UI.pause('"Wrong," grinds the mouth, and it closes. (Return here when you know the answer.)');
        }
        UI.hideOverlay();
        return false;
      }
      case 'fountain': {
        if (ev.kind === 'town') { await EX.concordFountain(); return false; }
        if (await UI.confirm('A fountain of ' + (ev.kind === 'heal' ? 'clear, warm water' : 'shimmering blue water') + '. Drink?')) {
          UI.sfx('drink');
          for (const c of G.party) {
            if (!ST.alive(c)) continue;
            if (ev.kind === 'heal') { c.hp = c.maxhp; if (c.status === 'poisoned') c.status = 'ok'; }
            else c.sp = ST.maxSp(c);
          }
          UI.spellFx('heal');
          UI.log(ev.kind === 'heal' ? 'Warmth floods your bodies. You are healed!' : 'Magic tingles in your fingertips. Spell points restored!', 'good');
          UI.renderParty();
        }
        return false;
      }
      case 'shrine': {
        if (G.flags[k] === G.stats.battles) { UI.log('The shrine\'s glow is dim. Perhaps it will recover later.'); return false; }
        const sf = ev.faith || 'dawn';
        const desc = { dawn: 'A shrine to the Dawn glows softly here, its sun disc warm against the cold.',
          root: 'Roots have broken through the stones here and twined into a ring around an amber lantern - a shrine of the Deep Root.',
          pale: 'A pillar of perfectly clear ice holds the Still Mother\'s snowflake. The air around it does not move.' }[sf];
        const sworn = G.faith && G.faith !== sf ? ' (You are sworn to ' + D.FAITHS[G.faith].name + '; the blessing will be weaker.)' : '';
        if (await UI.confirm(desc + sworn + ' Pray?')) {
          G.flags[k] = G.stats.battles;
          UI.sfx('spell_holy');
          UI.spellFx('holy');
          const full = !G.faith || G.faith === sf;
          for (const c of G.party) {
            if (c.status === 'dead' || c.status === 'stoned') continue;
            c.hp = full ? c.maxhp : Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 2));
            c.sp = Math.max(c.sp, Math.floor(ST.maxSp(c) * (full ? 0.6 : 0.3)));
            if (c.status !== 'ok') c.status = 'ok';
          }
          UI.log({ dawn: 'Golden light fills you. Wounds close and minds clear.', root: 'Warmth rises from the earth through your boots. Wounds knit; minds settle.', pale: 'A perfect cold stillness. Your wounds simply stop - and are gone.' }[sf], 'good');
          UI.renderParty();
        }
        return false;
      }
      case 'boss': {
        if (G.flags[ev.flag]) return false;
        UI.showNpc(ev.npc, BT.MONSTERS[ev.groups[0][0]].name);
        if (BT.audio) BT.audio.music('boss');
        UI.sfx('roar');
        BT.R.shake(12);
        await UI.pause(ev.text, 'Fight!');
        let stun = 0;
        if (ev.final && ST.hasItem('locket')) {
          UI.sfx('quest');
          await UI.pause('You hold up Lyra\'s silver locket. Malthor sees the picture inside - a girl and her father, laughing - and his hands begin to shake. For a moment, his magic falters.');
          stun = 2;
        }
        UI.hideOverlay();
        const r = await CB.fight(ev.groups, { boss: true, noRun: true, items: ev.items, gold: ev.gold, noChest: true, timestop: stun });
        if (r === 'win') {
          G.flags[ev.flag] = true;
          ST.save('auto');
          if (ev.final) { await EX.ending(); return true; }
          UI.showNpc(ev.npc);
          await UI.pause(ev.after);
          UI.hideOverlay();
        } else if (r === 'lose') await EX.gameOver();
        return true;
      }
    }
    return false;
  }

  async function randomEncounter() {
    const G = BT.G, m = map();
    if (!ST.living().length) return;
    let chance = m.encounter || 0;
    let table = m.monsters;
    if (m.style === 'town') {
      if (G.flags.malthor) return;
      if (ST.isNight()) { chance *= 1.8; table = m.nightMonsters; }
    }
    if (!table || !U.chance(chance)) return;
    const n = 1 + (U.chance(0.5) ? U.rand(m.groupsMax || 1) : 0);
    const spec = [];
    const used = {};
    for (let i = 0; i < n; i++) {
      const id = U.weighted(table);
      if (used[id]) continue;
      used[id] = 1;
      const def = BT.MONSTERS[id];
      const lvl = ST.living().reduce((a, c) => a + c.level, 0) / Math.max(1, ST.living().length);
      const extra = Math.floor(Math.max(0, lvl - def.lvl * 1.5) / 3);
      const count = Math.min(12, def.grp[0] + U.rand(def.grp[1] - def.grp[0] + 1) + U.rand(extra + 1));
      spec.push([id, count]);
    }
    const r = await CB.fight(spec, {});
    if (r === 'lose') await EX.gameOver();
  }

  // ---------- side quest: the Concord of Velmoor ----------
  const RELICS = ['sunshard', 'stillglass', 'heartseed'];
  EX.concordFountain = async function () {
    const G = BT.G;
    if (G.flags.concord) {
      await UI.pause(G.flags.malthor ? 'The Fountain of Concord sparkles in the sunlight. In its basin the three relics glow side by side: sun, hourglass and seed.' : 'The Fountain of Concord is still frozen, but the three relics glow warmly in their niches, and the ice around them is beginning to weep.');
      return;
    }
    const have = RELICS.filter((r) => ST.hasItem(r));
    let text = 'The great fountain of Velmoor is frozen solid. Around its rim, half-buried in ice, are three empty niches: one carved with a sun, one with a snowflake around an hourglass, one with a tree whose roots form a ring. An old plaque reads: <i>"Here the three faiths swore the Concord of Velmoor. While the relics rest together, so shall we."</i>';
    if (!have.length) { await UI.pause(text); return; }
    if (have.length < 3) {
      await UI.pause(text + '<br><br>You carry ' + have.map((r) => '<span class="item">' + BT.ITEMS[r].name + '</span>').join(' and ') + '. The niches for the others stay dark. The Concord needs all three.');
      return;
    }
    if (!(await UI.confirm(text + '<br><br>You carry all three relics. Set them in their niches?'))) return;
    for (const ch of G.party) ch.inv = ch.inv.filter((it) => RELICS.indexOf(it.id) < 0);
    G.flags.concord = true;
    UI.sfx('levelup'); UI.spellFx('holy'); BT.R.shake(6);
    UI.showNpc('mystic', 'The Fountain of Concord');
    await UI.pause('Sun, hourglass and seed settle into the ice - and the ice around them melts. Water wells up in the frozen basin, just a little, warm as breath. Across the plaza, doors open. A Dawn priest, a Pale Hour sister and an old Root-folk gravedigger step out into the snow and stare at the fountain, and then at each other.');
    await UI.pause('Madame Zeyla appears at your elbow, grinning. "I told you I see the future. Here - the old Concord-keepers left this for whoever brought the relics home."');
    UI.hideOverlay();
    const who = ST.giveParty('concordring');
    if (who) UI.log('<b>' + U.esc(who.name) + '</b> receives the <span class="item">Ring of Concord</span>!', 'good');
    for (const c of ST.living()) c.xp += 4000;
    BT.TW.earn(1500);
    UI.log('Each hero gains 4000 experience, and the faiths reward you with 1500 gold.', 'good');
    UI.renderParty();
    ST.save('auto');
  };

  // ---------- game over & ending ----------
  EX.gameOver = async function () {
    const t = document.getElementById('title');
    if (BT.audio) BT.audio.music('gameover');
    UI.sfx('death');
    t.innerHTML = '<div class="tbg">' + UI.art('scene', 'gameover') + '</div><div class="tcontent"><h1 class="dead">Your party has fallen</h1><p class="tsub">The winter claims another band of heroes. The snow covers their names.</p><div id="tmenu"></div></div>';
    t.className = 'show';
    await U.sleep(400);
    await BT.main.titleMenu(true);
  };

  EX.ending = async function () {
    const G = BT.G;
    if (BT.audio) BT.audio.music('ending');
    UI.showNpc('lyra', 'Lyra');
    for (const line of D.STORY.ending) await UI.pause(line);
    await UI.pause(D.STORY.endingFaith[G.faith || 'none']);
    if (G.flags.concord) await UI.pause('And in the plaza, the Fountain of Concord runs again for the first time in three hundred years, the three relics shining in its basin. Each faith sends a priest to tend it. They take turns.');
    await UI.pause(D.STORY.endingLast);
    UI.hideOverlay();
    const t = document.getElementById('title');
    const P = G.party;
    t.innerHTML = '<div class="tbg">' + UI.art('scene', 'victory') + '</div><div class="tcontent ending"><h1>Spring returns to Velmoor</h1>' +
      '<p class="tsub">The heroes: ' + P.map((c) => U.esc(c.name) + ' the ' + D.CLASSES[c.cls].name).join(', ') + '</p>' +
      '<p class="tsub">' + G.stats.steps + ' steps &middot; ' + G.stats.battles + ' battles &middot; ' + G.stats.kills + ' foes vanquished</p>' +
      '<div id="tmenu"></div></div>';
    t.className = 'show';
    await UI.menu({ title: 'The End', options: [{ label: 'Return to the thawing city', key: 'c', value: 'c' }] });
    t.className = '';
    BT.STYLES.town.snow = false;
    await EX.changeMap('town', 2, 1, 1);
    if (BT.audio) BT.audio.music('town');
    ST.save('auto');
    UI.log('The snow has stopped. Velmoor is free. You may keep exploring, or rest on your laurels.', 'good');
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
