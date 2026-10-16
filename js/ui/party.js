// The party bar (cards, HP/SP/voice bars, floating numbers), the HUD and the bard-song music sync.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI;
  const $ = (id) => document.getElementById(id);

  // ---------- party bar ----------
  UI.renderPartyPickable = function (filter) {
    UI.renderParty();
    document.querySelectorAll('.pcard').forEach((c) => {
      const ch = c._ch;
      if (!ch) return;
      if (!filter || filter(ch)) c.classList.add('pickable');
    });
  };
  UI.renderParty = function () {
    const G = BT.G;
    const el = $('party');
    if (!G) { el.innerHTML = ''; return; }
    const list = G.party.slice();
    if (G.summon) list.push(G.summon);
    el.innerHTML = '';
    list.forEach((ch, i) => {
      const c = document.createElement('div');
      const status = ch.status || 'ok';
      c.className = 'pcard st-' + status + (i < 3 ? ' front' : '');
      c._ch = ch;
      const maxSp = ch.summon ? 0 : ST.maxSp(ch);
      const hpPct = ch.maxhp ? Math.max(0, ch.hp / ch.maxhp * 100) : 0;
      const spPct = maxSp ? Math.max(0, ch.sp / maxSp * 100) : 0;
      const clsName = ch.summon ? 'Summoned' : D.CLASSES[ch.cls].name + ' ' + ch.level;
      c.innerHTML = '<div class="pnum">' + (i + 1) + '</div>' +
        '<div class="pport">' + UI.portrait(ch) + '</div>' +
        '<div class="pinfo"><div class="pname">' + U.esc(ch.name) + '</div>' +
        '<div class="pcls">' + clsName + (ST.canLevel(ch) ? ' <span class="lvlup" title="Can advance at the Hall of Review">▲</span>' : '') + '</div>' +
        '<div class="bar hp"><i style="width:' + hpPct + '%"></i><span>' + Math.max(0, ch.hp) + '/' + ch.maxhp + '</span></div>' +
        (maxSp ? '<div class="bar sp"><i style="width:' + spPct + '%"></i><span>' + ch.sp + '/' + maxSp + '</span></div>' : (ch.cls === 'bard' ? '<div class="bar voice"><i style="width:' + (ch.voice / ST.maxVoice(ch) * 100) + '%"></i><span>Voice ' + ch.voice + '</span></div>' : '<div class="bar none"></div>')) +
        '<div class="pac">AC ' + ST.acStr(ST.ac(ch)) + (status !== 'ok' ? ' <span class="pstat">' + D.STATUS[status].name + '</span>' : '') + '</div></div>';
      c.onclick = () => {
        if (UI.pickingMember && UI.busy()) { UI.chooseValue(ch); return; }
        if (!UI.busy() && UI.onCardClick) UI.onCardClick(ch);
      };
      el.appendChild(c);
      // only the first three can melee: mark the line between the ranks
      if (i === 2 && list.length > 3) {
        const dv = document.createElement('div');
        dv.className = 'rankdiv';
        dv.title = 'Members 1-3 fight in melee; members behind this line can only cast, sing, shoot or use items.';
        dv.innerHTML = '<span>Back rank</span>';
        el.appendChild(dv);
      }
    });
  };
  UI.floatText = function (ch, text, cls) {
    const G = BT.G;
    const list = G.party.slice();
    if (G.summon) list.push(G.summon);
    const i = list.indexOf(ch);
    const card = $('party').children[i];
    if (!card) return;
    const f = document.createElement('div');
    f.className = 'float ' + (cls || '');
    f.textContent = text;
    card.appendChild(f);
    if (cls === 'dmg') { card.classList.remove('hurt'); void card.offsetWidth; card.classList.add('hurt'); }
    setTimeout(() => f.remove(), 1200);
  };

  // ---------- HUD ----------
  UI.updateHud = function () {
    const G = BT.G;
    if (!G) return;
    document.body.classList.toggle('thawed', !!G.flags.malthor);
    const m = BT.MAPS[G.map];
    const fx = G.fx;
    let loc = '<b>' + U.esc(m.name) + '</b>';
    if (m.style === 'town') loc += ' &middot; ' + ST.timeStr();
    let comp = '';
    if (m.style === 'town' || fx.compass > 0) comp = U.DIRNAME[G.d];
    if (fx.compass > 0) comp += ' (' + G.x + ',' + G.y + ')';
    const icons = [];
    if (fx.light && fx.light.steps > 0) icons.push('<span title="Light">☀</span>');
    if (fx.compass > 0) icons.push('<span title="Compass">🧭</span>');
    if (fx.levitate > 0) icons.push('<span title="Levitation">🪶</span>');
    if (fx.trapsense > 0) icons.push('<span title="Trap Sense">⚠</span>');
    if (fx.song) icons.push('<span title="' + U.esc(D.SONGS.find((s) => s.id === fx.song.id).name) + '">♫</span>');
    if (G.faith) {
      const F = D.FAITHS[G.faith];
      const sym = BT.art && BT.art.symbol ? '<span class="fsym">' + BT.art.symbol(G.faith, 18) + '</span>' : '';
      icons.unshift('<span title="' + U.esc(F.name + ' - ' + F.blessing) + '">' + sym + '</span>');
    }
    const cell = m.fl[G.y][G.x];
    if (cell & BT.MG.F_DARK) icons.push('<span title="Magical darkness" class="bad">●</span>');
    if (cell & BT.MG.F_ANTI) icons.push('<span title="Anti-magic zone" class="bad">⊘</span>');
    $('hud').innerHTML = '<div class="loc">' + loc + '</div><div class="comp">' + comp + '</div><div class="icons">' + icons.join('') + '</div>';
    const mm = $('minimap');
    if (mm) BT.R.drawMap(mm);
    UI.syncSong();
  };
})();
