// Side-quest logic that is more than a cell event: the Fountain of Concord ceremony.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG, CB = BT.CB, EX = BT.EX;
  const map = () => BT.MAPS[BT.G.map];
  const evKey = (x, y) => BT.G.map + ':' + x + ':' + y;

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
})();
