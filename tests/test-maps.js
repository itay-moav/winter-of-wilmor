const load = require('./load');
const ctx = load(['js/util.js','js/data.js','js/items.js','js/spells.js','js/monsters.js','js/mapgen.js','js/maps.js']);
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
console.log(fail ? 'FAIL ' + fail : 'OK');
process.exit(fail ? 1 : 0);
