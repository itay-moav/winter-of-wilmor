// The two ways a game ends: the party falls (game over) or Malthor lets go (the ending and the thawed city).
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG, CB = BT.CB, EX = BT.EX;
  const map = () => BT.MAPS[BT.G.map];
  const evKey = (x, y) => BT.G.map + ':' + x + ':' + y;

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
    if (G.flags.irena) await UI.pause('Before he leaves the tower, Malthor goes home for the first time in a year. He walks down his cellar stairs - twelve steps, no more - and lights a candle for Irena, and one for the Dawn.');
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
})();
