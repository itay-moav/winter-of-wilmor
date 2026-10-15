// Every town service: shop buy/sell, temple, review board, inn, mystic, faith temples, party menu save.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  await T.newGame();
  const enter = (b) => T.eval(`BT.EX.guard(() => BT.TW.enter('${b}')); 1`).then(() => T.sleep(400));
  await T.eval("BT.G.party.forEach(c => { c.xp = 5000; c.gold = 3000; c.hp = Math.ceil(c.maxhp / 2); }); BT.G.party[2].status = 'poisoned'; BT.G.party[5].status = 'dead'; BT.G.party[5].hp = 0; BT.UI.renderParty(); 1");

  await enter('shop');
  await T.key('b', 200); await T.key('1', 200); await T.key('2', 300); await T.key('4', 300); // Torvald buys chain mail
  check(/Equip the Chain Mail/.test(await T.menu()), 'shop: buying armour offers to equip it');
  await T.key('y', 200); await T.key('Escape', 200); await T.key('Escape', 200);
  check(await T.eval("BT.G.party[0].inv.some(i => i.id === 'chain' && i.eq)"), 'shop: chain mail bought and equipped');
  await T.key('l', 300);

  await enter('temple');
  await T.key('h', 700); await T.key('l', 300);
  check(await T.eval("BT.G.party.every(c => c.status === 'ok' && c.hp === c.maxhp)"), 'temple: heal everyone cures, heals and resurrects');

  await enter('review');
  await T.key('a', 200); await T.key('1', 500); await T.key('l', 300);
  check(await T.eval('BT.G.party[0].level') > 1, 'review board: level up');

  await enter('inn'); await T.key('r', 300); await T.key(' ', 300); await T.key('l', 300);
  await enter('mystic'); await T.key('a', 300); await T.key(' ', 200); await T.key(' ', 200); await T.key(' ', 200); await T.key('l', 300);

  await enter('root');
  await T.key('p', 300); await T.key('y', 500); await T.key('l', 300);
  check(await T.eval('BT.G.faith') === 'root', 'barrow: party can swear to the Deep Root');
  await enter('pale');
  check(/Hall of the Still Mother/.test(await T.menu()), 'pale hall opens');
  await T.key('l', 300);

  await T.key('Escape', 300); await T.key('s', 300); await T.key('1', 400);
  check(await T.eval("!!localStorage.getItem('velmoor_save_1')"), 'party menu: save to slot 1');
  await T.key('Escape', 300);
  finish(T);
})();
