// Treasure chests after battles: traps, inspecting, disarming, loot.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // Treasure chest with optional trap.
  CB.chest = async function (tier, fixedItems) {
    const G = BT.G;
    const traps = [null, null, { name: 'poison needle', dmg: [1, 6], status: 'poisoned', one: true }, { name: 'blade trap', dmg: [2, 8], one: true },
      { name: 'gas cloud', dmg: [1, 6], status: 'poisoned' }, { name: 'lightning rune', dmg: [3, 6] }, { name: 'stone curse', dmg: [0, 0], status: 'stoned', one: true }, { name: 'explosion', dmg: [4, 6] }];
    const trap = U.pick(traps.slice(0, 2 + tier + 1));
    let known = false;
    const ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="chest">' + chestSvg() + '</div>';
    ov.className = 'show chestov';
    for (;;) {
      const c = await UI.menu({
        title: 'A treasure chest!', text: known ? (trap ? 'It is trapped with a <b>' + trap.name + '</b>.' : 'It does not seem to be trapped.') : 'It may be trapped.',
        options: [
          { label: 'Open it', key: 'o', value: 'open' },
          { label: 'Inspect for traps', key: 'i', value: 'inspect' },
          { label: 'Disarm trap', key: 'd', value: 'disarm' },
          { label: 'Leave it', key: 'l', value: 'leave' },
        ], cancel: 'leave',
      });
      if (c === 'leave') break;
      const who = c === 'open' ? G.party.find(ST.canAct) : await UI.pickMember(c === 'inspect' ? 'Who inspects the chest?' : 'Who disarms it?', ST.canAct);
      if (!who) continue;
      const skill = who.cls === 'rogue' ? 0.5 + who.level * 0.05 : 0.15 + D.statBonus(ST.stat(who, 'dx')) * 0.05;
      if (c === 'inspect') {
        if (U.chance(skill + 0.2) || G.fx.trapsense > 0) { known = true; UI.log(U.esc(who.name) + (trap ? ' spots a ' + trap.name + '.' : ' finds no trap.')); }
        else UI.log(U.esc(who.name) + ' sees nothing unusual.');
        continue;
      }
      let disarmed = !trap;
      if (c === 'disarm' && trap) {
        if (U.chance(skill)) { disarmed = true; UI.log(U.esc(who.name) + ' disarms the ' + trap.name + '!', 'good'); }
        else UI.log(U.esc(who.name) + ' fumbles the trap...', 'bad');
      }
      if (!disarmed) {
        UI.sfx('trap');
        BT.R.shake(8);
        UI.log('The ' + trap.name + ' goes off!', 'bad');
        const victims = trap.one ? [who] : G.party.filter(ST.alive);
        for (const v of victims) {
          if (trap.dmg[0]) {
            const d = U.rollD(trap.dmg) * Math.max(1, tier);
            v.hp -= d; UI.floatText(v, '-' + d, 'dmg');
            if (v.hp <= 0) { v.hp = 0; v.status = 'dead'; UI.log(K.nm(v) + ' is killed!', 'bad'); }
          }
          if (trap.status && v.status === 'ok' && U.chance(0.6)) { v.status = trap.status; UI.log(K.nm(v) + ' is ' + trap.status + '!', 'bad'); }
        }
        UI.renderParty();
      }
      // loot
      UI.sfx('chest');
      const gold = U.roll(tier * 2, 30, tier * 20);
      const living = ST.living();
      for (const ch of living) ch.gold += Math.floor(gold / living.length);
      UI.log('Inside the chest: ' + gold + ' gold.', 'good');
      UI.sfx('coin');
      const items = fixedItems ? fixedItems.slice() : [];
      if (!fixedItems && U.chance(0.55)) items.push(U.pick(BT.LOOT[Math.min(BT.LOOT.length - 1, tier - 1)]));
      if (!fixedItems && U.chance(0.15) && tier < BT.LOOT.length) items.push(U.pick(BT.LOOT[tier]));
      for (const id of items) {
        const r = ST.giveParty(id);
        if (r) { UI.log(K.nm(r) + ' finds <span class="item">' + U.esc(BT.ITEMS[id].name) + '</span>!', 'good'); UI.sfx('quest'); }
        else UI.log('You find ' + U.esc(BT.ITEMS[id].name) + ' but no one can carry it.', 'bad');
      }
      UI.renderParty();
      break;
    }
    UI.hideOverlay();
  };

  function chestSvg() {
    return '<svg viewBox="0 0 200 160" width="100%" height="100%"><defs><linearGradient id="chw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2b"/><stop offset="1" stop-color="#4a2c12"/></linearGradient>' +
      '<radialGradient id="chg" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="70" rx="90" ry="60" fill="url(#chg)"/>' +
      '<rect x="30" y="70" width="140" height="70" rx="6" fill="url(#chw)" stroke="#2a1606" stroke-width="4"/>' +
      '<path d="M30 72 Q100 10 170 72 Z" fill="url(#chw)" stroke="#2a1606" stroke-width="4"/>' +
      '<rect x="26" y="66" width="148" height="10" fill="#c9a24a" stroke="#5a4214" stroke-width="2"/>' +
      '<rect x="60" y="40" width="10" height="100" fill="#c9a24a" opacity="0.9"/><rect x="130" y="40" width="10" height="100" fill="#c9a24a" opacity="0.9"/>' +
      '<rect x="88" y="70" width="24" height="28" rx="3" fill="#e8c860" stroke="#5a4214" stroke-width="2"/><circle cx="100" cy="82" r="4" fill="#3a2a08"/></svg>';
  }

  Object.assign(K, { chestSvg });
})();
