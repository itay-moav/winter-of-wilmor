// Loads game scripts into a Node vm context (no DOM) for tests.
//   load(files)             run the given files in order
//   load.scripts()          every script path, in index.html order (the single source of truth)
//   load.select(prefixes)   the scripts under the given folders/files, in index.html order
//                           e.g. load.select(['js/core/util.js', 'js/data/', 'js/maps/'])
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
function load(files, ctx) {
  if (!ctx) {
    ctx = { console, Math, JSON, setTimeout, clearTimeout, Promise, Date };
    ctx.window = ctx;
    ctx.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
    vm.createContext(ctx);
  }
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
load.scripts = function () {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
};
const match = (f, p) => f === p || (p.endsWith('/') && f.startsWith(p));
load.select = function (prefixes, except) {
  return load.scripts().filter((f) => prefixes.some((p) => match(f, p)) && !(except || []).some((p) => match(f, p)));
};
// The data and maps every headless test needs (no DOM): util, data, maps (generated and dressed), state.
load.WORLD = ['js/core/util.js', 'js/data/', 'js/maps/', 'js/core/state.js'];
// Combat rules without the battle view (tests stub BT.UI and BT.R first; these files capture UI at load).
load.COMBAT = ['js/combat/hex.js', 'js/world/magic.js', 'js/combat/'];
load.NO_VIEW = ['js/combat/view.js'];
module.exports = load;
