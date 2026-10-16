// What happens on a map cell: stairs, warps, notes, Lyra, fights, chests, traps, riddles, fountains, shrines, bosses; random encounters.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG, CB = BT.CB, EX = BT.EX;
  const map = () => BT.MAPS[BT.G.map];
  const evKey = (x, y) => BT.G.map + ':' + x + ':' + y;

  EX.handleEvent = async function (ev) {
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
        if (r === 'win') {
          G.flags[k] = true;
          if (ev.setFlag) G.flags[ev.setFlag] = true;
          if (ev.after) await UI.pause(ev.after);
          ST.save('auto');
        }
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
        if (ev.final && ST.hasItem('stilllily')) {
          UI.sfx('quest');
          await UI.pause('Then you show him the still-lily pin. "Irena\'s," Malthor whispers. "Where did you...?" You tell him what she said in the cellar: that she was never in the ice. The archmage closes his eyes, and for a long moment the storm around him is silent.');
          stun += 1;
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
  };

  EX.randomEncounter = async function () {
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
  };
})();
