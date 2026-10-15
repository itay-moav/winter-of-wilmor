// Town buildings and character creation.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI;
  const TW = {};
  const $ = (id) => document.getElementById(id);

  // ---------- party gold ----------
  TW.gold = () => BT.G.party.reduce((a, c) => a + c.gold, 0);
  TW.pay = function (amount) {
    if (TW.gold() < amount) return false;
    let left = amount;
    const P = BT.G.party.slice().sort((a, b) => b.gold - a.gold);
    for (const c of P) {
      const t = Math.min(c.gold, left);
      c.gold -= t;
      left -= t;
      if (!left) break;
    }
    UI.sfx('coin');
    return true;
  };
  TW.earn = function (amount) {
    const P = BT.G.party.filter(ST.alive);
    const list = P.length ? P : BT.G.party;
    const each = Math.floor(amount / list.length);
    list.forEach((c, i) => { c.gold += each + (i === 0 ? amount - each * list.length : 0); });
  };
  const goldStr = () => '<span class="gold">' + TW.gold() + ' gold</span>';

  function progress() {
    const F = BT.G.flags;
    if (F.malthor) return 4;
    if (ST.hasItem('moonkey') || F.kargath) return 3;
    if (ST.hasItem('ironsigil') || F.morvane) return 2;
    if (ST.hasItem('bronzekey') || F.ratking) return 1;
    return 0;
  }

  TW.enter = async function (bid) {
    const music = { tavern: 'tavern', temple: 'temple', pale: 'temple', root: 'crypt', inn: 'tavern' }[bid];
    if (music && BT.audio) BT.audio.music(music);
    UI.sfx('door');
    try {
      switch (bid) {
        case 'guild': await guild(); break;
        case 'tavern': await tavern(); break;
        case 'shop': await shop(); break;
        case 'inn': await inn(); break;
        case 'temple': await temple(); break;
        case 'pale': await paleHall(); break;
        case 'root': await rootBarrow(); break;
        case 'review': await review(); break;
        case 'mystic': await mystic(); break;
        case 'crypt': await gate('bronzekey', 'crypt1', 'The iron gate of the crypt is locked with a heavy bronze lock.', 'The bronze key turns with a groan. Stone steps lead down into the dark.'); break;
        case 'keep': await gate('ironsigil', 'keep1', 'The gate of the Iron Keep is shut. In its center is a hollow shaped like a sigil.', 'You press the Iron Sigil into the gate. Chains rattle, and the gate rises.'); break;
        case 'tower': await gate('moonkey', 'tower1', 'The door of Malthor\'s tower has no handle - only a keyhole that glows like moonlight.', 'The Moonstone Key slides into the lock. The door of the tower dissolves into mist.'); break;
        case 'gate':
          await UI.pause(BT.G.flags.malthor ? 'The city gates stand open. Beyond them, green fields steam in the sunshine. Your adventure in Velmoor is complete - but the city may still need you.' : 'The great gates of Velmoor are frozen shut, buried under a wall of blue ice. No one leaves the city while the winter lasts.');
          break;
      }
    } finally {
      UI.hideOverlay();
      UI.renderParty();
      if (BT.MAPS[BT.G.map].style === 'town' && BT.audio) BT.audio.music('town');
      UI.updateHud();
    }
  };

  async function gate(item, mapId, locked, opened) {
    if (!ST.hasItem(item)) { UI.sfx('error'); await UI.pause(locked); return; }
    if (!(await UI.confirm(opened + '<br><br>Enter?'))) return;
    await BT.EX.changeMap(mapId);
  }

  // ---------- Guild ----------
  async function guild() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('guildmaster', BT.BUILDINGS.A.name);
      const c = await UI.menu({
        title: BT.BUILDINGS.A.name,
        text: G.party.length ? '"Welcome back, adventurers."' : '"So you want to be heroes? Put together a party - up to six."',
        options: [
          { label: 'Create a character', key: 'c', value: 'create', disabled: G.party.length + G.roster.length >= 20 },
          { label: 'Add member to party', key: 'a', value: 'add', disabled: !G.roster.length || G.party.length >= 6 },
          { label: 'Remove member', key: 'r', value: 'remove', disabled: !G.party.length },
          { label: 'Reorder party', key: 'o', value: 'order', disabled: G.party.length < 2 },
          { label: 'Delete a character', key: 'd', value: 'delete', disabled: !G.roster.length },
          { label: 'Hire a ready-made party', key: 'h', value: 'quick', disabled: G.party.length > 0 },
          { label: 'Save game', key: 's', value: 'save', disabled: !G.party.length },
          { label: 'Leave the Guild', key: 'l', value: 'leave', disabled: !G.party.length },
        ],
        cancel: G.party.length ? 'leave' : undefined,
      });
      if (c === 'leave') return;
      if (c === 'create') {
        const ch = await TW.createChar();
        if (ch) {
          if (G.party.length < 6) { G.party.push(ch); UI.log(U.esc(ch.name) + ' joins the party.', 'good'); }
          else { G.roster.push(ch); UI.log(U.esc(ch.name) + ' waits in the Guild hall.'); }
        }
      } else if (c === 'add') {
        const pick = await UI.menu({ title: 'Add who?', options: G.roster.map((ch) => ({ label: U.esc(ch.name), hint: D.CLASSES[ch.cls].name + ' ' + ch.level, value: ch })), cancel: null });
        if (pick) { G.roster.splice(G.roster.indexOf(pick), 1); G.party.push(pick); }
      } else if (c === 'remove') {
        const pick = await UI.pickMember('Remove who?');
        if (pick) {
          if (pick.inv.some((it) => BT.ITEMS[it.id].quest)) { UI.log(U.esc(pick.name) + ' carries a quest item. Give it to someone else first.', 'bad'); continue; }
          G.party.splice(G.party.indexOf(pick), 1); G.roster.push(pick);
        }
      } else if (c === 'order') {
        await TW.reorder();
      } else if (c === 'delete') {
        const pick = await UI.menu({ title: 'Delete who? (permanent)', options: G.roster.map((ch) => ({ label: U.esc(ch.name), hint: D.CLASSES[ch.cls].name + ' ' + ch.level, value: ch })), cancel: null });
        if (pick && (await UI.confirm('Really delete ' + U.esc(pick.name) + ' forever?'))) G.roster.splice(G.roster.indexOf(pick), 1);
      } else if (c === 'quick') {
        G.party = ST.defaultParty();
        UI.log('Six seasoned adventurers step forward: Torvald, Seraphine, Mei, Lark, Elowen and Nyx.', 'good');
      } else if (c === 'save') {
        await TW.saveMenu();
      }
      UI.renderParty();
    }
  }

  TW.reorder = async function () {
    const G = BT.G;
    const a = await UI.pickMember('Move who?');
    if (!a) return;
    const b = await UI.pickMember('Swap places with who?');
    if (!b || a === b) return;
    const i = G.party.indexOf(a), j = G.party.indexOf(b);
    G.party[i] = b; G.party[j] = a;
    UI.renderParty();
  };

  TW.saveMenu = async function () {
    const opts = ['1', '2', '3'].map((s) => {
      const info = ST.saveInfo(s);
      return { label: 'Slot ' + s, hint: info ? info.lead + ' - ' + info.where + ' - ' + new Date(info.when).toLocaleString() : 'empty', value: s };
    });
    const slot = await UI.menu({ title: 'Save game', options: opts, cancel: null });
    if (!slot) return;
    if (ST.saveInfo(slot) && !(await UI.confirm('Overwrite slot ' + slot + '?'))) return;
    if (ST.save(slot)) { UI.log('Game saved to slot ' + slot + '.', 'good'); UI.sfx('page'); }
    else UI.log('Could not save the game.', 'bad');
  };

  // ---------- Tavern ----------
  async function tavern() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('barkeep', BT.BUILDINGS.T.name);
      const c = await UI.menu({
        title: BT.BUILDINGS.T.name,
        text: 'A fire roars in the hearth - the only warm place in Velmoor. The barkeep polishes a mug. ' + goldStr(),
        options: [
          { label: 'Order an ale', hint: '2g', key: 'a', value: 'ale' },
          { label: 'Order mulled wine', hint: '5g', key: 'w', value: 'wine' },
          { label: 'Order dwarven spirits', hint: '12g', key: 's', value: 'spirits' },
          { label: 'Talk to the barkeep', key: 't', value: 'talk' },
          { label: 'Go down to the cellar', key: 'c', value: 'cellar' },
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'talk') {
        const r = D.STORY.rumors[progress()];
        UI.sfx('page');
        for (const line of r) await UI.pause('"' + line + '"');
      } else if (c === 'cellar') {
        if (await UI.confirm('The barkeep nods at a trapdoor. "Down there the cellar connects to the sewers. Mind the rats." Go down?')) {
          await BT.EX.changeMap('sewers1');
          return;
        }
      } else {
        const price = { ale: 2, wine: 5, spirits: 12 }[c];
        const who = await UI.pickMember('Who drinks?', ST.alive);
        if (!who) continue;
        if (!TW.pay(price)) { UI.log('"No coin, no drink."', 'bad'); continue; }
        UI.sfx('drink');
        if (who.cls === 'bard') {
          const before = who.voice;
          who.voice = c === 'ale' ? Math.min(ST.maxVoice(who), who.voice + 1) : ST.maxVoice(who);
          UI.log(U.esc(who.name) + ' wets the throat. ' + (who.voice > before ? 'Their voice is restored!' : 'Their voice is already strong.'), 'good');
        } else {
          const lines = {
            ale: ['The ale is warm and bitter. Good.', 'You feel a bit braver.', 'Someone at the bar starts an off-key song about the Rat King.'],
            wine: ['Hot spiced wine. For a moment you forget the snow.', 'A warmth spreads through your bones.'],
            spirits: ['The spirits burn like dragonfire! You see two barkeeps.', 'You cough, and the dwarves at the next table cheer.'],
          }[c];
          UI.log(U.esc(who.name) + ': ' + U.pick(lines));
          if (c === 'spirits' && who.hp < who.maxhp) { who.hp = Math.min(who.maxhp, who.hp + 3); }
        }
        UI.renderParty();
      }
    }
  }

  // ---------- Shop ----------
  function stock() {
    const G = BT.G;
    const list = BT.SHOP_STOCK.slice();
    for (const id in G.shop) if (G.shop[id] > 0 && list.indexOf(id) < 0) list.push(id);
    return list;
  }
  async function shop() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('merchant', BT.BUILDINGS.S.name);
      const c = await UI.menu({
        title: BT.BUILDINGS.S.name,
        text: '"Swords, armor, potions - all honest goods. And anything rare you care to sell." ' + goldStr(),
        options: [
          { label: 'Buy', key: 'b', value: 'buy' },
          { label: 'Sell', key: 's', value: 'sell' },
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'buy') {
        const who = await UI.pickMember('Who is buying? (party gold is pooled)', (ch) => ch.status !== 'dead');
        if (!who) continue;
        const cats = [['Weapons', 'weapon'], ['Armor', 'armor'], ['Shields', 'shield'], ['Helms', 'helm'], ['Gloves & rings', 'gloves,ring'], ['Instruments', 'instrument'], ['Supplies & potions', 'use']];
        for (;;) {
          const cat = await UI.menu({ title: 'Buy for ' + U.esc(who.name) + ' - ' + goldStr(), options: cats.map(([n, v]) => ({ label: n, value: v })), cancel: null });
          if (!cat) break;
          const slots = cat.split(',');
          for (;;) {
            const items = stock().filter((id) => slots.indexOf(BT.ITEMS[id].slot) >= 0);
            const pick = await UI.menu({
              title: U.esc(who.name) + ' - ' + goldStr(),
              options: items.map((id) => {
                const d = BT.ITEMS[id];
                const can = BT.canUse(who, d);
                let info = '';
                if (d.dmg && d.dmg[0]) info = U.diceStr(d.dmg);
                if (d.ac) info += ' AC' + d.ac;
                return { label: (can ? '' : '<s>') + U.esc(d.name) + (can ? '' : '</s>') + (G.shop[id] ? ' <span class="magic">★</span>' : ''), hint: info + ' &middot; ' + d.price + 'g', value: id, key: null };
              }).map((o, i) => Object.assign(o, { key: i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9) })),
              cancel: null,
            });
            if (!pick) break;
            const d = BT.ITEMS[pick];
            if (who.inv.length >= ST.MAX_INV) { UI.log(U.esc(who.name) + ' cannot carry any more.', 'bad'); continue; }
            if (!TW.pay(d.price)) { UI.log('"You can\'t afford that, friend."', 'bad'); UI.sfx('error'); continue; }
            ST.give(who, pick);
            if (G.shop[pick]) G.shop[pick]--;
            const it = who.inv[who.inv.length - 1];
            let msg = U.esc(who.name) + ' buys the ' + U.esc(d.name) + '.';
            if (d.slot !== 'use' && BT.canUse(who, d) && !ST.equipped(who, d.slot)) { ST.equip(who, it); msg += ' (equipped)'; }
            else if (d.slot !== 'use' && BT.canUse(who, d) && (await UI.confirm('Equip the ' + U.esc(d.name) + ' now?'))) { ST.equip(who, it); msg += ' (equipped)'; }
            UI.log(msg, 'good');
            UI.renderParty();
          }
        }
      } else if (c === 'sell') {
        const who = await UI.pickMember('Who is selling?', (ch) => ch.inv.length > 0);
        if (!who) continue;
        for (;;) {
          const sellable = who.inv.filter((it) => !BT.ITEMS[it.id].quest);
          if (!sellable.length) break;
          const it = await UI.menu({
            title: U.esc(who.name) + ' sells - ' + goldStr(),
            options: sellable.map((it, i) => ({ label: (it.eq ? '◆ ' : '') + U.esc(BT.ITEMS[it.id].name), hint: Math.floor(BT.ITEMS[it.id].price / 2) + 'g', value: it, key: i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9) })),
            cancel: null,
          });
          if (!it) break;
          const d = BT.ITEMS[it.id];
          const val = Math.floor(d.price / 2);
          who.inv.splice(who.inv.indexOf(it), 1);
          who.gold += val;
          UI.sfx('coin');
          if (BT.SHOP_STOCK.indexOf(it.id) < 0) G.shop[it.id] = (G.shop[it.id] || 0) + 1;
          UI.log(U.esc(who.name) + ' sells the ' + U.esc(d.name) + ' for ' + val + ' gold.');
          UI.renderParty();
        }
      }
    }
  }

  // ---------- Inn ----------
  async function inn() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('innkeeper', BT.BUILDINGS.I.name);
      const living = G.party.filter(ST.alive);
      const cost = living.reduce((a, c) => a + 5 + c.level * 5, 0);
      const c = await UI.menu({
        title: BT.BUILDINGS.I.name,
        text: '"Come in out of the cold, loves! Warm beds, hot stew. A night\'s rest restores body and mind." ' + goldStr(),
        options: [
          { label: 'Rest for the night', hint: cost + 'g', key: 'r', value: 'rest' },
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (!TW.pay(cost)) { UI.log('"Oh dear, you\'re a little short."', 'bad'); continue; }
      for (const ch of living) {
        ch.hp = ch.maxhp;
        ch.sp = ST.maxSp(ch);
        if (ch.cls === 'bard') ch.voice = ST.maxVoice(ch);
      }
      const h = ST.hour();
      G.time += ((24 - h + 7) % 24 || 24) * ST.HOUR;
      G.fx.song = null;
      UI.renderParty();
      BT.R.invalidate();
      await UI.pause('You sleep deeply under thick quilts. In the morning you wake refreshed. (Hit points and spell points restored.)');
    }
  }

  // ---------- Temple ----------
  async function temple() {
    const G = BT.G;
    const costOf = (ch) => {
      if (ch.status === 'dead') return 150 * ch.level + 100;
      if (ch.status === 'stoned') return 120 * ch.level + 100;
      if (ch.status === 'paralyzed') return 60 * ch.level + 40;
      let c = 0;
      if (ch.status === 'poisoned') c += 20 * ch.level;
      c += (ch.maxhp - ch.hp) * 1;
      return c;
    };
    const mult = G.faith === 'dawn' ? 0.5 : G.faith === 'pale' ? 2 : 1;
    const baseCost = costOf;
    const cost2 = (ch) => Math.ceil(baseCost(ch) * mult);
    for (;;) {
      UI.showNpc(G.faith === 'pale' ? 'dawnpriest' : 'priestess', BT.BUILDINGS.P.name);
      const greet = G.faith === 'pale' ? 'Brother Caddoc blocks the aisle, glaring at your snowflake pendants. "Pale Hour heretics pay double for the Dawn\'s mercy."'
        : G.faith === 'dawn' ? '"Welcome, children of the Dawn. The Kindled Sun heals its own at half the offering."'
          : '"The Dawn has not forgotten Velmoor, even in this endless night. Who needs healing?"';
      const c = await UI.menu({
        title: BT.BUILDINGS.P.name,
        text: greet + ' ' + goldStr(),
        options: G.party.map((ch, i) => ({ label: U.esc(ch.name), hint: cost2(ch) ? D.STATUS[ch.status].name + ' - ' + cost2(ch) + 'g' : 'healthy', value: ch, disabled: !cost2(ch), key: String(i + 1) }))
          .concat([{ label: 'Heal everyone', key: 'h', value: 'all', hint: G.party.reduce((a, ch) => a + cost2(ch), 0) + 'g' },
            { label: 'Speak with the priests', key: 's', value: 'talk' },
            faithOption('dawn'),
            { label: 'Leave', key: 'l', value: 'leave' }]),
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'talk') { await faithTalk('dawn'); continue; }
      if (c === 'pledge') { await pledge('dawn'); continue; }
      const list = c === 'all' ? G.party.filter((ch) => cost2(ch) > 0) : [c];
      for (const ch of list) {
        const cost = cost2(ch);
        if (!TW.pay(cost)) { UI.log('"An offering of ' + cost + ' gold is needed for ' + U.esc(ch.name) + '."', 'bad'); break; }
        const was = ch.status;
        ch.status = 'ok';
        ch.hp = ch.maxhp;
        UI.sfx('spell_holy');
        UI.spellFx('holy');
        UI.log(was === 'dead' ? U.esc(ch.name) + ' gasps and opens their eyes. Alive!' : U.esc(ch.name) + ' is restored to health.', 'good');
      }
      UI.renderParty();
    }
  }

  // ---------- Faiths ----------
  function faithOption(f) {
    const G = BT.G;
    if (G.faith === f) return { label: 'You are sworn to ' + D.FAITHS[f].name, key: 'p', value: 'pledge', disabled: true };
    return { label: 'Swear the party to ' + D.FAITHS[f].name, key: 'p', value: 'pledge', hint: D.FAITHS[f].blessing };
  }
  async function faithTalk(f) {
    UI.sfx('page');
    await UI.pause(D.STORY.faithTalk[f][progress()]);
  }
  async function pledge(f) {
    const G = BT.G, F = D.FAITHS[f];
    let text = '<b>' + F.name + '</b> - ' + F.god + '. <i>"' + F.creed + '"</i><br><br><b>' + F.blessing + ':</b> ' + F.bdesc;
    if (G.faith && G.faith !== f) text += '<br><br>You are sworn to ' + D.FAITHS[G.faith].name + '. Its priests will not forget a broken oath.';
    if (!(await UI.confirm(text + '<br><br>Swear the whole party to ' + F.name + '?'))) return;
    G.faith = f;
    UI.sfx('levelup');
    UI.spellFx(f === 'dawn' ? 'holy' : f === 'pale' ? 'ice' : 'heal');
    UI.log('The party swears itself to <b style="color:' + F.color + '">' + F.name + '</b>. ' + F.blessing + ' is upon you.', 'good');
    UI.updateHud();
  }
  TW.faithOption = faithOption;

  async function paleHall() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('matron', BT.BUILDINGS.H.name);
      const lvl = (ch) => Math.max(1, ch.level);
      const needy = G.party.filter((ch) => ch.status === 'paralyzed' || ch.status === 'stoned');
      const price = needy.reduce((a, ch) => a + 30 * lvl(ch), 0);
      const c = await UI.menu({
        title: BT.BUILDINGS.H.name,
        text: (G.faith === 'dawn' ? 'Pale-robed acolytes eye your sun pendants coldly. "Sun-worshippers. The Mother\'s rites are not for you."' :
          'Candles burn without flickering. Nothing moves, not even the smoke. "Be still," whispers an acolyte. "The Mother is listening."') + ' ' + goldStr(),
        options: [
          { label: 'Speak with Matron Sevrine', key: 's', value: 'talk' },
          { label: 'Rite of Stillwater', hint: needy.length ? 'cures paralysis & stone - ' + price + 'g' : 'no one needs it', key: 'r', value: 'rite', disabled: !needy.length },
          { label: 'Receive the Mother\'s kiss', hint: 'heals 25% HP - 15g each', key: 'k', value: 'kiss' },
          faithOption('pale'),
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'talk') { await faithTalk('pale'); continue; }
      if (c === 'pledge') { await pledge('pale'); continue; }
      if (G.faith === 'dawn') { UI.sfx('error'); UI.log('"The Still Mother keeps her gifts for her own," says the acolyte, and turns away.', 'bad'); continue; }
      if (c === 'rite') {
        if (!TW.pay(price)) { UI.log('"The Mother asks an offering of ' + price + ' gold."', 'bad'); continue; }
        for (const ch of needy) { ch.status = 'ok'; ch.hp = Math.max(1, ch.hp); }
        UI.sfx('spell_ice'); UI.spellFx('ice');
        UI.log('Cold water is poured over ' + needy.map((ch) => U.esc(ch.name)).join(', ') + '. Stone and stiffness melt away.', 'good');
      }
      if (c === 'kiss') {
        const list = G.party.filter((ch) => ST.alive(ch) && ch.hp < ch.maxhp);
        if (!list.length) { UI.log('No one is wounded.'); continue; }
        if (!TW.pay(15 * list.length)) { UI.log('"An offering, please."', 'bad'); continue; }
        for (const ch of list) ch.hp = Math.min(ch.maxhp, ch.hp + Math.ceil(ch.maxhp / 4));
        UI.sfx('spell_heal');
        UI.log('A cold kiss on the brow. Wounds stop hurting - they simply stop.', 'good');
      }
      UI.renderParty();
    }
  }

  async function rootBarrow() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('rootwarden', BT.BUILDINGS.O.name);
      const sick = G.party.filter((ch) => ST.alive(ch) && (ch.hp < ch.maxhp || ch.status === 'poisoned'));
      const price = sick.reduce((a, ch) => a + Math.ceil((ch.maxhp - ch.hp) / 2) + (ch.status === 'poisoned' ? 10 * ch.level : 0), 0);
      const c = await UI.menu({
        title: BT.BUILDINGS.O.name,
        text: 'Roots hang from the earthen ceiling, and amber lanterns glow between them. It smells of soil and woodsmoke. Old Thessaly looks up from her mortar. "All are welcome under the Root. Even the Dawn\'s children." ' + goldStr(),
        options: [
          { label: 'Speak with Old Thessaly', key: 's', value: 'talk' },
          { label: 'Poultice of the Deep Earth', hint: sick.length ? 'heals & cures poison - ' + price + 'g' : 'no one needs it', key: 'h', value: 'heal', disabled: !sick.length },
          { label: 'Commune with the ancestors', hint: G.faith === 'root' ? 'free' : '10g', key: 'c', value: 'commune' },
          { label: 'Buy root-water (harms undead)', hint: '60g', key: 'w', value: 'water' },
          faithOption('root'),
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'talk') { await faithTalk('root'); continue; }
      if (c === 'pledge') { await pledge('root'); continue; }
      if (c === 'heal') {
        if (!TW.pay(price)) { UI.log('"Bring me ' + price + ' gold for the herbs, dear."', 'bad'); continue; }
        for (const ch of sick) { ch.hp = ch.maxhp; if (ch.status === 'poisoned') ch.status = 'ok'; }
        UI.sfx('spell_heal'); UI.spellFx('heal');
        UI.log('Thessaly packs your wounds with warm, dark earth. The pain sinks into the ground.', 'good');
        UI.renderParty();
      }
      if (c === 'commune') {
        if (G.faith !== 'root' && !TW.pay(10)) { UI.log('"The ancestors ask a small offering."', 'bad'); continue; }
        const hints = [
          'Voices rise from the roots: "The crowned rat... beneath the tavern... wears our gate-key round his neck."',
          'Voices from below: "Morvane is chained. He weeps. Answer the stone mouth: what do you leave behind with every step?"',
          'The roots murmur: "The iron knight waits for a day that never comes. Tell the mouth so."',
          'The roots whisper: "The girl\'s name is Lyra. Her father wants to stop the one thing that cannot be stopped."',
          'The roots are quiet and content. Somewhere far below, something is growing.',
        ];
        UI.sfx('magic_mouth');
        await UI.pause(hints[progress()]);
      }
      if (c === 'water') {
        const who = await UI.pickMember('Who carries it?', (ch) => ch.inv.length < ST.MAX_INV);
        if (!who) continue;
        if (!TW.pay(60)) { UI.log('"Sixty gold, dear."', 'bad'); continue; }
        ST.give(who, 'holywater');
        UI.log(U.esc(who.name) + ' takes a flask of root-water.', 'good');
      }
    }
  }

  // ---------- Hall of Review ----------
  async function review() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('sage', BT.BUILDINGS.R.name);
      const c = await UI.menu({
        title: BT.BUILDINGS.R.name,
        text: '"The Review Board judges the worthy. Who seeks advancement?" ' + goldStr(),
        options: [
          { label: 'Advance a level', key: 'a', value: 'adv' },
          { label: 'Learn new spells', key: 's', value: 'spells' },
          { label: 'Change class (mages)', key: 'c', value: 'cls' },
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'adv') {
        const who = await UI.pickMember('Who seeks advancement?', (ch) => ST.alive(ch));
        if (!who) continue;
        if (!ST.canLevel(who)) {
          UI.log('"' + U.esc(who.name) + ', you need ' + (D.xpFor(who.level + 1) - who.xp) + ' more experience."');
          continue;
        }
        let msg = '';
        while (ST.canLevel(who)) {
          const r = ST.levelUp(who);
          msg += U.esc(who.name) + ' reaches level ' + who.level + '! +' + r.hpGain + ' HP' + (r.spGain ? ', +' + r.spGain + ' SP' : '') + (r.statUp ? ', +1 ' + D.STATNAME[r.statUp] : '') + '. ';
        }
        delete who._notified;
        UI.sfx('levelup');
        UI.spellFx('holy');
        UI.log(msg, 'good');
        const cls = D.CLASSES[who.cls];
        if (cls.school && D.maxSpellLevel(who.level) > (who.spells[cls.school] || 0)) UI.log('"You may now learn new ' + D.SCHOOLS[cls.school] + ' spells here."', 'info');
        UI.renderParty();
      } else if (c === 'spells') {
        const who = await UI.pickMember('Who wishes to learn?', (ch) => !!D.CLASSES[ch.cls].school && ST.alive(ch));
        if (!who) continue;
        const sch = D.CLASSES[who.cls].school;
        const known = who.spells[sch] || 0;
        const next = known + 1;
        if (next > 7) { UI.log('"You have mastered every ' + D.SCHOOLS[sch] + ' spell."'); continue; }
        if (D.maxSpellLevel(who.level) < next) { UI.log('"Spell level ' + next + ' requires character level ' + (next * 2 - 1) + '."'); continue; }
        const cost = D.spellLevelCost(next);
        const names = BT.SPELL_LIST.filter((s) => s.school === sch && s.lvl === next).map((s) => s.code + ' ' + s.name).join(', ');
        if (!(await UI.confirm('Learn ' + D.SCHOOLS[sch] + ' spell level ' + next + ' (' + names + ') for ' + cost + ' gold?'))) continue;
        if (!TW.pay(cost)) { UI.log('"Knowledge is not free. Come back with ' + cost + ' gold."', 'bad'); continue; }
        who.spells[sch] = next;
        UI.sfx('levelup');
        UI.log(U.esc(who.name) + ' learns: ' + names + '.', 'good');
      } else if (c === 'cls') {
        const who = await UI.pickMember('Who wishes to change class?', (ch) => ST.isMage(ch) && ST.alive(ch));
        if (!who) continue;
        const opts = D.MAGES.filter((k) => k !== who.cls).map((k) => {
          const sch = D.CLASSES[k].school;
          let ok = !(who.spells[sch]);
          const s = who.spells;
          if (k === 'sorcerer') ok = ok && ((s.con || 0) >= 3 || (s.mag || 0) >= 3);
          if (k === 'wizard') ok = ok && (s.sor || 0) >= 3 && ((s.con || 0) >= 3 || (s.mag || 0) >= 3);
          if (k === 'conjurer' || k === 'magician') ok = ok && Object.values(s).some((v) => v >= 3);
          return { label: D.CLASSES[k].name, hint: who.spells[sch] ? 'already studied' : D.CLASSES[k].desc, value: k, disabled: !ok };
        });
        const k = await UI.menu({ title: 'Change ' + U.esc(who.name) + '\'s class', text: 'A mage who has mastered 3 spell levels may study a new school, starting again at level 1 but keeping all spells, hit points and spell points.', options: opts, cancel: null });
        if (!k) continue;
        if (!(await UI.confirm('Become a level 1 ' + D.CLASSES[k].name + '?'))) continue;
        who.cls = k;
        who.level = 1;
        who.xp = 0;
        who.spells[D.CLASSES[k].school] = 1;
        UI.sfx('levelup');
        UI.log(U.esc(who.name) + ' is now a ' + D.CLASSES[k].name + '!', 'good');
        UI.renderParty();
      }
    }
  }

  // ---------- Mystic ----------
  async function mystic() {
    const G = BT.G;
    for (;;) {
      UI.showNpc('mystic', BT.BUILDINGS.M.name);
      const mages = G.party.filter((ch) => ST.maxSp(ch) > 0 && ST.alive(ch));
      const need = mages.reduce((a, ch) => a + (ST.maxSp(ch) - ch.sp), 0);
      const c = await UI.menu({
        title: BT.BUILDINGS.M.name,
        text: '"Ahh, tired minds, empty of magic. Zeyla can fill them again... for a price. Three gold for each spell point." ' + goldStr(),
        options: [
          { label: 'Restore all spell points', hint: need * 3 + 'g', key: 'r', value: 'all', disabled: !need },
          { label: 'Restore one mage', key: 'o', value: 'one', disabled: !need },
          { label: 'Have your fortune told', hint: '20g', key: 'f', value: 'fortune' },
          { label: 'Ask about the Concord of Velmoor', key: 'a', value: 'concord' },
          { label: 'Leave', key: 'l', value: 'leave' },
        ],
        cancel: 'leave',
      });
      if (c === 'leave') return;
      if (c === 'concord') {
        UI.sfx('magic_mouth');
        if (G.flags.concord) { await UI.pause('"The fountain runs, the faiths share a bench now and then. Zeyla is very pleased with herself," says Zeyla.'); continue; }
        await UI.pause('"Long before the Dawn\'s crusade, the three faiths swore a peace at the great fountain in the plaza - the Concord of Velmoor. Each left a relic in its basin: the Dawn\'s Sun Shard, the Pale Hour\'s Still Hourglass, the Root\'s Heartwood Seed."');
        await UI.pause('"When the crusade came, three families hid the relics so no zealot could break them: Orrin the clockmaker\'s line, the widow Ysolde\'s, and old Bramwick the miller\'s. Their houses still stand. Climb them. Look behind the walls. Answer what you are asked."');
        await UI.pause('"Bring all three back to the fountain, and perhaps the faiths will remember they once stood together. Zeyla sees it! Probably."');
        continue;
      }
      if (c === 'fortune') {
        if (!TW.pay(20)) { UI.log('"No gold, no future."', 'bad'); continue; }
        const f = [
          'I see a tin crown in the dark, beneath the tavern floor... and a bronze key around a thick, furry neck.',
          'I see bones and a crown of ice. An old king who longs to sleep. Speak to the stone mouth: what you leave behind with every step.',
          'I see a knight weeping inside black iron. He waits for tomorrow, though tomorrow never comes.',
          'I see a girl asleep in crystal... and a father who cannot let go. Remember her name. Remember what cannot be stopped.',
          'I see sunshine. I see you famous. I see Zeyla with a bigger shop!',
        ][progress()];
        UI.sfx('magic_mouth');
        await UI.pause('Zeyla stares into her crystal ball. "' + f + '"');
      } else {
        const list = c === 'all' ? mages : [await UI.pickMember('Restore whom?', (ch) => ST.maxSp(ch) > ch.sp)];
        for (const ch of list) {
          if (!ch) continue;
          const n = ST.maxSp(ch) - ch.sp;
          if (!n) continue;
          if (!TW.pay(n * 3)) { UI.log('"You cannot afford it, dear."', 'bad'); break; }
          ch.sp = ST.maxSp(ch);
          UI.sfx('spell_heal');
          UI.log(U.esc(ch.name) + ' feels magic surge back.', 'good');
        }
        UI.renderParty();
      }
    }
  }

  // ---------- Character creation ----------
  TW.createChar = function () {
    return new Promise((res) => {
      const lo = (BT.art && BT.art.lookOptions) || { hair: 8, hairColor: 10, skin: 6, eyes: 8 };
      const st = {
        name: '', race: 'human', gender: U.chance(0.5) ? 'f' : 'm', cls: 'warrior',
        look: { hair: U.rand(lo.hair), hairColor: U.rand(lo.hairColor), skin: U.rand(lo.skin), eyes: U.rand(lo.eyes) },
        seed: U.rand(100000),
      };
      st.base = ST.rollStats(st.race);
      const NAMES = { m: ['Aldric', 'Bran', 'Corin', 'Daven', 'Eamon', 'Falk', 'Garrick', 'Hale', 'Ivo', 'Jorah', 'Kell', 'Rurik', 'Soren', 'Theo'], f: ['Aria', 'Brynn', 'Cass', 'Dahlia', 'Elara', 'Freya', 'Gwen', 'Isra', 'Kaela', 'Lyss', 'Mira', 'Nessa', 'Rhea', 'Sable', 'Tamsin', 'Vela'] };
      const render = () => {
        const total = D.STATS.reduce((a, k) => a + st.base[k], 0);
        const lookOpts = { race: st.race, cls: st.cls, gender: st.gender, look: st.look, seed: st.seed };
        const ck = 'create' + JSON.stringify(st.look) + st.race + st.cls + st.gender + st.seed;
        const fig = BT.art && BT.art.figure ? '<div class="figwrap">' + BT.UI.art('figure', ck, lookOpts) + '</div>' : BT.UI.art('portrait', ck, lookOpts);
        let h = '<div class="create"><div class="cport">' + fig + '</div><div class="cbody">';
        h += '<h2>Create a Character</h2>';
        h += '<div class="crow"><label>Name</label><input id="cName" maxlength="14" value="' + U.esc(st.name) + '" placeholder="Name"><button data-a="randname">🎲</button></div>';
        h += '<div class="crow"><label>Gender</label>' + ['m', 'f'].map((g) => '<button class="opt' + (st.gender === g ? ' on' : '') + '" data-g="' + g + '">' + (g === 'm' ? 'Male' : 'Female') + '</button>').join('') + '</div>';
        h += '<div class="crow wrap"><label>Race</label>' + Object.keys(D.RACES).map((r) => '<button class="opt' + (st.race === r ? ' on' : '') + '" data-r="' + r + '">' + D.RACES[r].name + '</button>').join('') + '</div>';
        h += '<div class="crow wrap"><label>Class</label>' + Object.keys(D.CLASSES).filter((k) => D.CLASSES[k].start).map((k) => '<button class="opt' + (st.cls === k ? ' on' : '') + '" data-c="' + k + '">' + D.CLASSES[k].name + '</button>').join('') + '</div>';
        h += '<div class="cdesc">' + D.CLASSES[st.cls].desc + '</div>';
        h += '<div class="crow look">' + [['hair', 'Hair'], ['hairColor', 'Color'], ['skin', 'Skin'], ['eyes', 'Eyes']].map(([k, n]) => '<span class="lk"><button data-l="' + k + '" data-dv="-1">◀</button>' + n + '<button data-l="' + k + '" data-dv="1">▶</button></span>').join('') + '</div>';
        h += '<div class="cstats">' + D.STATS.map((k) => '<div><span>' + D.STATNAME[k] + '</span><b>' + st.base[k] + '</b></div>').join('') + '<div class="tot"><span>Total</span><b>' + total + '</b></div></div>';
        h += '<div class="cbtns"><button data-a="roll">🎲 Reroll stats</button><button data-a="ok" class="primary">Create</button><button data-a="cancel">Cancel</button></div></div></div>';
        UI.modal(h, 'createbox');
        const nameEl = $('cName');
        nameEl.oninput = () => { st.name = nameEl.value; };
        nameEl.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') done(); };
        document.querySelectorAll('.create button').forEach((b) => {
          b.onclick = () => {
            UI.sfx('menu_move');
            if (b.dataset.g) st.gender = b.dataset.g;
            if (b.dataset.r) { st.race = b.dataset.r; st.base = ST.rollStats(st.race); }
            if (b.dataset.c) st.cls = b.dataset.c;
            if (b.dataset.l) { const k = b.dataset.l; st.look[k] = (st.look[k] + +b.dataset.dv + lo[k]) % lo[k]; }
            const a = b.dataset.a;
            if (a === 'roll') { st.base = ST.rollStats(st.race); UI.sfx('coin'); }
            if (a === 'randname') st.name = U.pick(NAMES[st.gender]);
            if (a === 'cancel') { UI.closeModal(); res(null); return; }
            if (a === 'ok') { done(); return; }
            render();
          };
        });
        UI.modalKey = (e) => { if (e.key === 'Escape') { UI.closeModal(); res(null); } return true; };
      };
      const done = () => {
        if (!st.name.trim()) { st.name = U.pick(NAMES[st.gender]); }
        const ch = ST.makeChar({ name: st.name.trim().slice(0, 14), race: st.race, cls: st.cls, gender: st.gender, look: st.look, base: st.base, seed: st.seed });
        UI.closeModal();
        UI.sfx('levelup');
        res(ch);
      };
      render();
    });
  };

  BT.TW = TW;
})();
