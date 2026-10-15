// Shared helpers for the headless-Chrome browser tests.
const path = require('path');
const fs = require('fs');
const cdp = require('../cdp');

const URL = 'file://' + path.resolve(__dirname, '../../index.html');
const SHOTS = process.env.SHOTS || '/tmp/velmoor-shots';

async function open() {
  const T = await cdp(URL);
  fs.mkdirSync(SHOTS, { recursive: true });
  T.menu = () => T.eval("document.getElementById('menu').innerText.replace(/\\n+/g,' | ')");
  T.snap = (name) => T.shot(path.join(SHOTS, name + '.png'));
  T.errors = () => T.logs.filter((l) => /EXCEPTION|error/i.test(l));
  // New game -> skip intro -> hire the ready-made party -> leave the guild.
  T.newGame = async () => {
    await T.key('n', 700); await T.key('s', 900); await T.key('h', 450); await T.key('l', 700);
  };
  return T;
}

let failures = 0;
function check(cond, msg) {
  console.log((cond ? '  ok   ' : '  FAIL ') + msg);
  if (!cond) failures++;
}
function finish(T) {
  const errs = T.errors();
  check(errs.length === 0, 'no JS errors' + (errs.length ? ': ' + errs.join(' / ') : ''));
  T.close();
  process.exit(failures ? 1 : 0);
}

module.exports = { open, check, finish, SHOTS };
