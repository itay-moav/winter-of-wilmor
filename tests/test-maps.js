const load = require('./load');
const ctx = load(load.select(load.WORLD));
const BT = ctx.BT; BT.buildMaps();
let fail = 0;
for (const id in BT.MAPS) {
  const m = BT.MAPS[id];
  const s = m.start; const dist = BT.MG.bfs(m, s.x, s.y);
  let open = 0, reach = 0, evs = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.fl[y][x] & BT.MG.F_SOLID) continue; open++; if (dist[y][x] >= 0) reach++;
    if (m.ev[y][x]) { evs++; if (dist[y][x] < 0) { console.log('UNREACHABLE EVENT', id, x, y); fail++; } }
  }
  const info = [id, m.w + 'x' + m.h, 'reach', reach + '/' + open, 'events', evs, 'down', JSON.stringify(m.downPos || null), 'boss', m.bossRoom ? m.bossRoom.cells.length : '-', 'up', JSON.stringify(m.up || null)];
  console.log(info.join(' '));
  if (reach !== open) fail++;
  for (const mon of (m.monsters || [])) if (!BT.MONSTERS[mon[0]]) { console.log('bad monster', mon[0]); fail++; }
}
// check items/spells referenced
for (const k in BT.ITEMS) { const u = BT.ITEMS[k].use; if (u && u.spell && !BT.SPELLS[u.spell]) { console.log('bad spell', k); fail++; } }
for (const s of BT.SPELL_LIST) if (s.summon && !BT.MONSTERS[s.summon]) { console.log('bad summon', s.code); fail++; }
// An old save that stands where a redesigned map has no floor is moved to the entrance.
const ST = BT.ST;
ST.newGame();
Object.assign(BT.G, { map: 'q1', x: 6, y: 6, d: 0 });
if (!ST.repairPosition() || BT.G.x !== BT.MAPS.q1.start.x || BT.G.y !== BT.MAPS.q1.start.y) { console.log('FAIL old house position not repaired'); fail++; }
Object.assign(BT.G, { map: 'gone_map', x: 1, y: 1 });
ST.repairPosition();
if (BT.G.map !== 'town') { console.log('FAIL unknown map not repaired'); fail++; }
Object.assign(BT.G, { map: 'q1', x: 2, y: 2, d: 1 });
if (ST.repairPosition()) { console.log('FAIL a valid position was moved'); fail++; }

// Seeded layouts must not drift: old saves store positions and map:x:y flags.
// After an intentional change, refresh the fingerprints with: node tests/test-maps.js --update
const crypto = require('crypto'), fs = require('fs'), FIX = __dirname + '/fixtures/layouts.json';
const prints = {};
for (const id in BT.MAPS) {
  const m = BT.MAPS[id];
  prints[id] = crypto.createHash('sha1').update(JSON.stringify([m.w, m.h, m.hw, m.vw, m.fl, m.ev.map((r) => r.map((e) => (e ? e.t : 0))), m.start])).digest('hex').slice(0, 16);
}
if (process.argv.includes('--update')) { fs.writeFileSync(FIX, JSON.stringify(prints, null, 1) + '\n'); console.log('layout fingerprints updated'); }
else if (fs.existsSync(FIX)) {
  const old = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  for (const id in old) if (prints[id] && prints[id] !== old[id]) { console.log('LAYOUT CHANGED', id, '(breaks old saves; if intended: node tests/test-maps.js --update)'); fail++; }
}
console.log(fail ? 'FAIL ' + fail : 'OK');
process.exit(fail ? 1 : 0);
