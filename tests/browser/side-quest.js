// The Concord side quest path: enter Orrin's house, attic secret wall, riddle, portal into the Sun Vault.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  await T.newGame();
  await T.eval('BT.G.x = 13; BT.G.y = 8; BT.G.d = 3; BT.R.snap(); 1');
  await T.key('w', 600);
  check(/Clockmaker/.test(await T.menu()), 'walking into the house door offers to go inside');
  await T.key('y', 2500);
  check(await T.eval('BT.G.map') === 'q1', 'entered the ground floor (q1)');
  // attic: the clock wall at x=3 hides a secret door into the riddle nook (x=4..5, y=0..1)
  await T.eval("BT.EX.guard(() => BT.EX.changeMap('q3', 2, 0, 1)); 1"); await T.sleep(2500);
  await T.key('w', 700);
  check(/clock faces/.test(await T.menu()), 'the note by the clock wall gives the hint');
  await T.key(' ', 300);
  await T.key('w', 700);
  check(await T.eval("BT.G.x + ',' + BT.G.y") === '4,0', 'walked through the secret clock wall');
  await T.key('w', 900);
  check(/face but no eyes/.test(await T.menu()), 'riddle mouth asks the clock riddle');
  await T.key(' ', 400); await T.type('clock'); await T.key('Enter', 600); await T.key(' ', 400);
  check(await T.eval('BT.G.flags.riddle_clock') === true, 'riddle solved');
  await T.key('d', 300); await T.key('w', 800);
  check(/portal/.test(await T.menu()), 'portal offers to step through');
  await T.key('y', 2500);
  check(await T.eval('BT.G.map') === 'sunvault', 'arrived in the Sun Vault');
  // Fountain with all relics completes the quest
  await T.eval("BT.EX.guard(async () => { await BT.EX.changeMap('town', 8, 6, 0); ['sunshard','stillglass','heartseed'].forEach(r => BT.ST.giveParty(r)); }); 1");
  await T.sleep(2500);
  await T.eval("BT.EX.guard(() => BT.EX.concordFountain()); 1"); await T.sleep(400);
  await T.key('y', 400); for (let i = 0; i < 3; i++) await T.key(' ', 300);
  check(await T.eval('BT.G.flags.concord') === true && await T.eval("BT.ST.hasItem('concordring')"), 'fountain ceremony grants the Ring of Concord');
  finish(T);
})();
