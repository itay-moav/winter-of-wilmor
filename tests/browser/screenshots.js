// Visual review: renders the key screens to $SHOTS (default /tmp/velmoor-shots). Look at them with the Read tool.
const { open, finish, SHOTS } = require('./_common');
(async () => {
  const T = await open();
  await T.snap('01-title');
  await T.key('n', 700); await T.snap('02-intro');
  await T.key('s', 900); await T.key('c', 900); await T.snap('03-create'); await T.key('Escape', 400);
  await T.key('h', 450); await T.key('l', 700);
  const at = async (name, x, y, d) => { await T.eval(`BT.G.x=${x}; BT.G.y=${y}; BT.G.d=${d}; BT.R.snap(); BT.UI.updateHud(); 1`); await T.sleep(400); await T.snap(name); };
  await at('10-street', 1, 4, 1);
  await at('11-plaza-statue', 10, 7, 0);
  await at('12-dawn-temple', 7, 5, 3);
  await at('13-pale-hall', 10, 8, 3);
  await at('14-root-barrow', 7, 11, 3);
  await at('15-graves', 4, 13, 0);
  await at('16-clockmaker', 13, 8, 3);
  await T.eval('BT.G.time = 22 * 25; BT.R.invalidate(); 1'); await at('17-night', 1, 4, 1); await T.eval('BT.G.time = 8 * 25; 1');
  await T.key('1', 700); await T.snap('20-sheet'); await T.key('Escape', 300);
  await T.eval("BT.EX.guard(() => BT.TW.enter('pale')); 1"); await T.sleep(900); await T.snap('21-npc-figure'); await T.key('l', 400);
  for (const [id, n] of [['sewers1', '30-sewer'], ['crypt1', '31-crypt'], ['keep1', '32-keep'], ['tower1', '33-tower'], ['q1', '34-house'], ['sunvault', '35-sunvault'], ['roothollow', '36-roothollow']]) {
    await T.eval(`BT.EX.guard(() => BT.EX.changeMap('${id}')); 1`); await T.sleep(2400);
    await T.eval('BT.G.fx.light = { r: 4, steps: 99 }; BT.R.invalidate(); 1'); await T.sleep(300);
    await T.snap(n);
  }
  await T.eval("BT.EX.guard(() => BT.CB.fight([['siren', 2], ['wolf', 3]], {})); 1"); await T.sleep(1500); await T.snap('40-combat');
  console.log('screenshots written to ' + SHOTS);
  finish(T);
})();
