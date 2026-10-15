// Prints markdown tables generated from game data, used by the velmoor-lore skill.
// node tools/lore-tables.js monsters|items|spells|maps
const load = require('../tests/load');
const ctx = load(['js/util.js', 'js/data.js', 'js/items.js', 'js/spells.js', 'js/monsters.js', 'js/mapgen.js', 'js/maps.js']);
const BT = ctx.BT;
BT.buildMaps();
const what = process.argv[2] || 'monsters';
const dice = (d) => (d ? d[0] + 'd' + d[1] + (d[2] ? '+' + d[2] : '') : '-');
if (what === 'monsters') {
  const where = {};
  for (const id in BT.MAPS) {
    const m = BT.MAPS[id];
    for (const [mid] of [...(m.monsters || []), ...(m.nightMonsters || [])]) (where[mid] = where[mid] || new Set()).add(id);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const e = m.ev[y][x]; if (e && e.groups) for (const [mid] of e.groups) (where[mid] = where[mid] || new Set()).add(id + (e.t === 'boss' ? ' (boss)' : ' (fixed)')); }
  }
  console.log('| id | Name | Lvl | HP | AC | Attacks | Traits | Art key | Found in |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const id in BT.MONSTERS) {
    const m = BT.MONSTERS[id];
    const t = [];
    if (m.boss) t.push('BOSS'); if (m.undead) t.push('undead'); if (m.poison) t.push('poison'); if (m.para) t.push('paralyze'); if (m.stone) t.push('petrify');
    if (m.drain) t.push('drain'); if (m.regen) t.push('regen ' + m.regen); if (m.breath) t.push('breath: ' + m.breath.name); if (m.spells) t.push('casts: ' + m.spells.map((s) => s.name).join(', '));
    if (m.resist) t.push('resist ' + Object.entries(m.resist).map(([k, v]) => k + ' x' + v).join(' '));
    console.log(`| ${id} | ${m.name} | ${m.lvl} | ${dice(m.hp)} | ${m.ac} | ${m.atk}x ${dice(m.dmg)} | ${t.join('; ')} | ${m.art}${m.hue ? ' (hue ' + m.hue + ')' : ''} | ${where[id] ? [...where[id]].join(', ') : (id.endsWith('_ally') || ['phantasm', 'salamander'].includes(id) ? 'summoned ally' : '-')} |`);
  }
}
if (what === 'items') {
  console.log('| id | Name | Slot | Stats | Price | Notes |');
  console.log('|---|---|---|---|---|---|');
  for (const id in BT.ITEMS) {
    const d = BT.ITEMS[id];
    const st = [];
    if (d.dmg && d.dmg[0]) st.push('dmg ' + dice(d.dmg)); if (d.ac) st.push('AC-' + d.ac); if (d.hit) st.push('+' + d.hit + ' hit');
    if (d.stat) st.push(Object.entries(d.stat).map(([k, v]) => '+' + v + ' ' + k).join(' ')); if (d.spBonus) st.push('+' + d.spBonus + ' SP');
    const notes = [];
    if (d.magic) notes.push('magic'); if (d.quest) notes.push('QUEST'); if (d.two) notes.push('two-handed'); if (d.ranged) notes.push('ranged'); if (d.el) notes.push(d.el);
    if (d.slay) notes.push('slays ' + d.slay); if (d.resist) notes.push('resist ' + d.resist); if (d.use) notes.push('use: ' + (d.use.spell || Object.keys(d.use).join('/')));
    if (d.allow) notes.push('only ' + d.allow.join('/')); if (d.desc) notes.push(d.desc);
    console.log(`| ${id} | ${d.name} | ${d.slot} | ${st.join(', ')} | ${d.price} | ${notes.join('; ')} |`);
  }
}
if (what === 'spells') {
  console.log('| Code | Name | School | Lvl | SP | When | Target | Effect |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const s of BT.SPELL_LIST) {
    const fx = [];
    if (s.dmg) fx.push(dice(s.dmg) + ' ' + (s.el || '') + (s.undead ? ' (undead only)' : '')); if (s.heal) fx.push('heal ' + (s.heal === 'full' ? 'full' : dice(s.heal)));
    for (const k of ['cure', 'raise', 'buff', 'light', 'compass', 'levitate', 'trapsense', 'scry', 'phase', 'recall', 'teleport', 'reveal', 'summon', 'sleep', 'hold', 'fear', 'death', 'timestop', 'drain'])
      if (s[k]) fx.push(k + (typeof s[k] === 'object' ? ' ' + JSON.stringify(s[k]) : s[k] === true ? '' : ' ' + s[k]));
    console.log(`| ${s.code} | ${s.name} | ${s.school} | ${s.lvl} | ${s.sp} | ${s.when} | ${s.target} | ${fx.join('; ')} |`);
  }
}
if (what === 'maps') {
  console.log('| Map id | Name | Style | Size | Depth | Entry | Key events |');
  console.log('|---|---|---|---|---|---|---|');
  for (const id in BT.MAPS) {
    const m = BT.MAPS[id];
    const ev = {};
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const e = m.ev[y][x]; if (e) ev[e.t] = (ev[e.t] || 0) + 1; }
    console.log(`| ${id} | ${m.name} | ${m.style} | ${m.w}x${m.h} | ${m.depth} | ${m.up ? 'from ' + m.up.map : '-'} | ${Object.entries(ev).map(([k, v]) => k + ' x' + v).join(', ')} |`);
  }
}
