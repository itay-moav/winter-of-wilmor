// Title -> new game -> town walk -> tavern -> character sheet -> map -> a fight with spells and a song.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  check(/New Game/.test(await T.menu()), 'title menu offers New Game');
  await T.newGame();
  check(await T.eval('BT.G.party.length') === 6, 'ready-made party hired');
  // walk 3 east, face south into the tavern door
  await T.key('w', 350); await T.key('w', 350); await T.key('w', 350); await T.key('d', 300); await T.key('w', 900);
  check(/Frostbitten Flagon/.test(await T.menu()), 'walking into the tavern door opens the tavern');
  await T.key('l', 500);
  await T.key('1', 600);
  check(await T.eval("document.querySelector('.sheet') !== null"), 'character sheet opens with key 1');
  await T.key('Escape', 300);
  await T.key('m', 500);
  check(await T.eval("document.getElementById('bigmap') !== null"), 'full map opens with M');
  await T.key('Escape', 300);
  // pin the starting distance to 10' (U.rand -> 0 while the groups are created) so every key below is valid
  await T.eval("BT.CB.delay = 40; const r = BT.U.rand; BT.U.rand = () => 0; BT.EX.guard(() => BT.CB.fight([['rat', 3], ['kobold', 2]], {})); BT.U.rand = r; 1");
  await T.sleep(600);
  await T.key('f', 300);
  for (let i = 0; i < 3; i++) { await T.key('a', 150); await T.key('1', 150); }
  await T.key('s', 200); await T.key('2', 200);           // bard sings
  await T.key('c', 200); await T.key('1', 200); await T.key('1', 200); // conjurer: Spark Bolt at group 1
  await T.key('c', 200); await T.key('1', 200); await T.key('1', 200); // magician: Voltaic Touch
  await T.sleep(3000);
  const log = await T.eval("document.getElementById('log').innerText");
  if (!(/casts/.test(log) && /plays the/.test(log))) console.log(log.slice(-800));
  check(/casts/.test(log) && /plays the/.test(log), 'spells and a song resolve in combat');
  finish(T);
})();
