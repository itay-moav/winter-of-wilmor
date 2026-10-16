// The settings menu (volumes, combat speed, mute) and the help screen.
(function () {
  const U = BT.U, UI = BT.UI, main = BT.main;
  const $ = (id) => document.getElementById(id);

  main.settings = async function () {
    for (;;) {
      const a = BT.audio;
      const mv = a ? Math.round(a.getMusicVolume() * 10) : 0, sv = a ? Math.round(a.getSfxVolume() * 10) : 0;
      const sp = { 650: 'Slow', 420: 'Normal', 220: 'Fast', 80: 'Instant' }[BT.CB.delay] || 'Normal';
      const c = await UI.menu({
        title: 'Settings',
        options: [
          { label: 'Music volume', hint: '■'.repeat(mv) + '□'.repeat(10 - mv) + ' (←/→: 1/2)', key: '1', value: 'mv' },
          { label: 'Music louder', key: '2', value: 'mv+' },
          { label: 'Effects volume', hint: '■'.repeat(sv) + '□'.repeat(10 - sv), key: '3', value: 'sv' },
          { label: 'Effects louder', key: '4', value: 'sv+' },
          { label: 'Combat speed', hint: sp, key: '5', value: 'speed' },
          { label: a && a.isMuted() ? 'Unmute' : 'Mute all', key: 'm', value: 'mute' },
          { label: 'Back', key: 'b', value: null },
        ],
        cancel: null,
      });
      if (!c) return;
      if (!a && c !== 'speed') continue;
      if (c === 'mv') a.setMusicVolume(Math.max(0, a.getMusicVolume() - 0.1));
      if (c === 'mv+') a.setMusicVolume(Math.min(1, a.getMusicVolume() + 0.1));
      if (c === 'sv') { a.setSfxVolume(Math.max(0, a.getSfxVolume() - 0.1)); UI.sfx('coin'); }
      if (c === 'sv+') { a.setSfxVolume(Math.min(1, a.getSfxVolume() + 0.1)); UI.sfx('coin'); }
      if (c === 'mute') { a.toggleMute(); $('btnMute').textContent = a.isMuted() ? '🔇' : '🔊'; }
      if (c === 'speed') {
        const order = [650, 420, 220, 80];
        BT.CB.delay = order[(order.indexOf(BT.CB.delay) + 1) % order.length];
        try { localStorage.setItem('velmoor_speed', BT.CB.delay); } catch (e) { /* ignore */ }
      }
    }
  };

  main.help = function () {
    return new Promise((res) => {
      const box = UI.modal('<div class="help"><h2>How to play</h2>' +
        '<div class="hcols"><div><h3>Movement</h3><p><b>↑ / W</b> step forward (walk into doors to open them)<br><b>← → / A D</b> turn<br><b>↓ / S</b> turn around<br><b>X</b> step backward<br><b>M</b> full map</p>' +
        '<h3>Party</h3><p><b>1-6</b> character sheet (equip, use, give items)<br><b>C</b> cast a spell<br><b>B</b> bard song<br><b>U</b> use an item<br><b>O</b> reorder party<br><b>Esc / P</b> party menu: save, load, settings</p></div>' +
        '<div><h3>The city</h3><p>Walk into a building\'s door to enter. <b>Guild</b>: party &amp; saving. <b>Tavern</b>: rumors, drinks (restore a bard\'s voice) and the sewer cellar. <b>Shop</b>: gear. <b>Inn</b>: rest. <b>Temple</b>: healing and resurrection. <b>Review</b>: level up and learn spells. <b>Mystic</b>: restore spell points.</p>' +
        '<h3>Combat</h3><p>Only the first three party members can melee (bows reach from anywhere). Foes start at a distance and close in. Mages cast at any range. A Bard\'s song lasts the whole fight. Rogues can hide, then strike for triple damage.</p>' +
        '<h3>Tips</h3><p>Dungeons are dark: cast a light spell or light a torch. Gold is pooled for shopping. The Hall of Review must approve every new level. Read the walls - and listen to rumors.</p></div></div>' +
        '<div class="mfoot">Any key to close</div></div>', 'helpbox');
      const close = () => { UI.closeModal(); res(); };
      box.onclick = close;
      UI.modalKey = () => { close(); return true; };
    });
  };
})();
