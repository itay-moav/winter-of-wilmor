// Game over -> new game from the game-over screen; and the ending sequence -> thawed city.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  await T.newGame();
  await T.eval("BT.EX.guard(async () => { BT.G.party.forEach(c => { c.hp = 0; c.status = 'dead'; }); await BT.EX.gameOver(); }); 1");
  await T.sleep(1200);
  check(/Game Over/.test(await T.menu()), 'game over screen shows its menu');
  await T.key('n', 800); await T.key('s', 900);
  check(/Guild/.test(await T.menu()), 'new game from game over opens the guild');
  await T.key('h', 400); await T.key('l', 600);
  check(await T.eval('BT.EX.locked()') === false && await T.eval('BT.G.party.length') === 6, 'new party is free to move');

  await T.eval("BT.G.faith = 'pale'; BT.G.flags.malthor = true; BT.EX.guard(() => BT.EX.ending()); 1");
  await T.sleep(600);
  // the final screen has a single option, which Space would select - so stop as soon as it appears
  for (let i = 0; i < 12 && !/The End/.test(await T.menu()); i++) await T.key(' ', 300);
  check(/The End/.test(await T.menu()), 'ending reaches the final screen');
  await T.key('c', 2600);
  check(await T.eval("document.body.classList.contains('thawed')"), 'city returns thawed (UI frost melted)');
  finish(T);
})();
