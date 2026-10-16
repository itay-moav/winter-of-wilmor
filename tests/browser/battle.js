// The hex battle screen: board, turn order, the acting hero's full figure, moving with the
// keyboard, attacking with the mouse, numbered targets, auto-battle and its Esc, and the song music.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  await T.newGame();
  await T.eval("BT.EX.guard(() => BT.EX.changeMap('crypt1')); 1"); await T.sleep(2400);
  // pin randomness while the board is set up so the first hero to act is known and foes start close
  // sturdy heroes, so the scripted turns (defending, wandering) never lose the fight
  await T.eval("BT.G.party.forEach(c => { c.maxhp = c.hp = 250; }); 1");
  await T.eval("window.__r = null; BT.CB.delay = 60; const r = BT.U.rand; BT.U.rand = () => 0; BT.EX.guard(async () => { window.__r = await BT.CB.fight([['skeleton', 6], ['zombie', 2]], {}); }); BT.U.rand = r; 1");
  await T.sleep(1200);
  const waitHero = async () => { for (let i = 0; i < 40; i++) { const m = await T.menu(); if (/Defend/.test(m)) return m; await T.sleep(250); } return ''; };
  let m = await waitHero();
  check(await T.eval("document.querySelectorAll('#battle polygon.hx').length") === 77, 'an 11 x 7 hex board is drawn');
  check(await T.eval("document.querySelectorAll('#battle .btok.ally.pc').length") === 6, 'all six heroes stand on the board');
  check(await T.eval("Math.max(...['skeleton','zombie'].map(id => BT.CB.state().units.filter(u => u.g && u.g.def.id === id).length))") <= 4, 'at most four of a group on the board');
  check(await T.eval("document.querySelectorAll('#battle .bq .qc').length") >= 8, 'turn order strip lists the combatants');
  const name = await T.eval("document.querySelector('#battle .bfig .bfname').textContent");
  check(name && m.indexOf(name) === 0 && await T.eval("!!document.querySelector('#battle .bfig .bfart svg, #battle .bfig .bfart img')"), 'the acting hero full figure is shown (' + name + ')');
  check(await T.eval("document.querySelectorAll('#battle polygon.hx.reach').length") > 0, 'reachable hexes are highlighted');

  // move with the keyboard
  const before = await T.eval("JSON.stringify((u => [u.c, u.r])(BT.CB.state().units.find(u => u.ch && u.ch.name === '" + name + "')))");
  await T.key('m', 300);
  check(/Move where/.test(await T.menu()), 'Move asks for a hex');
  await T.key('ArrowRight', 150); await T.key('Enter', 700);
  const after = await T.eval("JSON.stringify((u => [u.c, u.r])(BT.CB.state().units.find(u => u.ch && u.ch.name === '" + name + "')))");
  check(before !== after, 'the hero moved on the board (' + before + ' -> ' + after + ')');
  m = await T.menu();
  check(/moved/.test(m) && /End turn/.test(m), 'after moving the hero may still act or end the turn');
  await T.key('e', 500);

  // numbered targets and attacking with the mouse
  for (let i = 0; i < 12; i++) {
    m = await waitHero();
    if (/Attack/.test(m) && !/no foe in reach/.test(m)) break;
    await T.key('p', 400);
  }
  if (/Attack/.test(m) && !/no foe in reach/.test(m)) {
    await T.key('a', 300);
    check(await T.eval("[...document.querySelectorAll('#battle .blab')].some(e => e.textContent === '1')"), 'targets are numbered on the board');
    await T.key('Escape', 300);
    const pos = await T.eval("(() => { const t = document.querySelector('#battle .btok.foe.tgt'); if (!t) return null; const r = t.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height * 0.6]; })()");
    if (pos) {
      const kills = await T.eval('BT.G.stats.kills'), logLen = await T.eval("document.getElementById('log').children.length");
      await T.click(pos[0], pos[1]); await T.sleep(800);
      const log = await T.eval("[...document.getElementById('log').children].slice(" + logLen + ").map(e => e.textContent).join(' | ')");
      check(/hits|misses|swings|shoots/.test(log), 'clicking a foe attacks it');
    } else check(false, 'a foe is highlighted as a target');
  } else check(false, 'some hero gets a foe in reach');

  // auto-battle, then take control back with Esc
  m = await waitHero();
  await T.key('z', 400);
  check(await T.eval("document.getElementById('battle') && document.getElementById('battle').classList.contains('auto')"), 'auto-battle banner shows');
  await T.key('Escape', 200);
  check(await T.eval("!BT.CB.state() || !BT.CB.state().autoAll"), 'Esc ends auto-battle');
  // finish the fight on auto, without animation delays (sturdy level-1 heroes take many rounds)
  await T.eval('BT.CB.delay = 0; 1');
  for (let i = 0; i < 200 && !(await T.eval('window.__r')); i++) {
    if (/Defend/.test(await T.menu())) await T.key('z', 300); else await T.sleep(300);
  }
  const res = await T.eval('window.__r');
  if (res !== 'win') console.log(await T.menu(), await T.eval("document.getElementById('log').innerText.slice(-600)"));
  check(res === 'win', 'the battle is won (' + res + ')');
  check(await T.eval("!document.getElementById('battle') && !document.body.classList.contains('inbattle')"), 'the battle screen is gone afterwards');

  // songs take over the music
  if (await T.eval('!!(BT.audio && BT.audio.song)')) {
    await T.eval("BT.G.party.forEach(c => { if (c.cls === 'bard') c.voice = 3; }); BT.EX.guard(() => BT.EX.songMenu()); 1"); await T.sleep(400);
    await T.key('4', 500);
    check(await T.eval('BT.audio.currentSong()') === 'lantern', 'singing the Lantern Song starts its music');
    await T.eval("BT.G.fx.song.steps = 1; BT.EX.guard(() => BT.EX.forward()); 1"); await T.sleep(800);
    await T.eval("BT.EX.guard(() => BT.EX.turn(2)); 1"); await T.sleep(400);
    await T.eval("BT.EX.guard(() => BT.EX.forward()); 1"); await T.sleep(800);
    check(await T.eval('BT.audio.currentSong()') === null, 'the music returns when the song fades');
  }
  finish(T);
})();
