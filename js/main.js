// Boot, title screen, new game, load/settings/help.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI;
  const main = { playing: false, gen: 0 };
  const $ = (id) => document.getElementById(id);
  let audioStarted = false;
  let wantMusic = 'title';

  function startAudio() {
    if (!BT.audio) return;
    BT.audio.init();
    if (!audioStarted) { audioStarted = true; BT.audio.music(wantMusic); }
  }
  function music(track) {
    wantMusic = track;
    if (BT.audio && audioStarted) BT.audio.music(track);
  }

  main.boot = function () {
    BT.TX.init();
    BT.buildMaps();
    BT.R.init($('view'));
    UI.init();
    new MutationObserver(() => document.body.classList.toggle('titlemode', $('title').classList.contains('show'))).observe($('title'), { attributes: true });
    document.addEventListener('pointerdown', startAudio);
    document.addEventListener('keydown', startAudio);
    // patch audio music calls made before init to remember the wanted track
    if (BT.audio) {
      const orig = BT.audio.music.bind(BT.audio);
      BT.audio.music = function (t) { wantMusic = t; if (audioStarted) orig(t); };
    }
    $('btnMenu').onclick = () => { if (main.playing && !UI.busy() && !BT.EX.locked()) BT.EX.guard(() => BT.EX.partyMenu()); };
    $('btnMap').onclick = () => { if (main.playing && !UI.busy() && !BT.EX.locked()) BT.EX.guard(() => UI.fullMap()); };
    $('btnMute').onclick = () => { if (BT.audio) { startAudio(); BT.audio.toggleMute(); $('btnMute').textContent = BT.audio.isMuted() ? '🔇' : '🔊'; } };
    document.querySelectorAll('#pad button').forEach((b) => {
      b.onclick = () => {
        if (!main.playing || UI.busy()) return;
        const ev = new KeyboardEvent('keydown', { key: b.dataset.k });
        UI.onExploreKey(ev);
      };
    });
    main.toTitle();
  };

  main.toTitle = async function () {
    main.playing = false;
    BT.G = null;
    UI.closeModal();
    UI.hideOverlay();
    UI.clearLog();
    UI.renderParty();
    music('title');
    const t = $('title');
    t.innerHTML = '<div class="tbg">' + UI.art('scene', 'title') + '</div><div class="tcontent"><div class="snowfall"></div><h1>' + D.STORY.title + '</h1><p class="tsub">' + D.STORY.subtitle + '</p><div id="tmenu"></div><p class="tfoot">Arrow keys / WASD to move &middot; Enter to choose &middot; Esc for menu</p></div>';
    t.className = 'show';
    await main.titleMenu(false);
  };

  // Title menu (also used on game over). Resolves once a game is running.
  main.titleMenu = async function (gameOver) {
    main.playing = false;
    for (;;) {
      const latest = ST.SLOTS.map((s) => ({ s, i: ST.saveInfo(s) })).filter((x) => x.i).sort((a, b) => b.i.when - a.i.when)[0];
      const c = await UI.menu({
        title: gameOver ? 'Game Over' : D.STORY.title,
        options: [
          latest ? { label: 'Continue', hint: latest.i.lead + ' - ' + latest.i.where, key: 'c', value: 'cont' } : null,
          { label: 'New Game', key: 'n', value: 'new' },
          ST.anySave() ? { label: 'Load Game', key: 'l', value: 'load' } : null,
          { label: 'Settings', key: 's', value: 'settings' },
          { label: 'How to play', key: 'h', value: 'help' },
        ],
      });
      startAudio();
      if (c === 'cont') { if (loadSlot(latest.s)) return; }
      if (c === 'new') { await newGame(); return; }
      if (c === 'load') { if (await main.loadMenu()) return; }
      if (c === 'settings') await main.settings();
      if (c === 'help') await main.help();
    }
  };

  function loadSlot(slot) {
    if (!ST.load(slot)) return false;
    main.gen++;
    $('title').className = '';
    BT.STYLES.town.snow = !BT.G.flags.malthor;
    main.playing = true;
    UI.clearLog();
    BT.R.snap();
    UI.renderParty();
    UI.updateHud();
    UI.hideOverlay();
    music(BT.STYLES[BT.MAPS[BT.G.map].style].music);
    UI.log('Game loaded. You are in <b>' + U.esc(BT.MAPS[BT.G.map].name) + '</b>.', 'info');
    return true;
  }

  main.loadMenu = async function () {
    const opts = ST.SLOTS.map((s) => {
      const i = ST.saveInfo(s);
      return { label: s === 'auto' ? 'Autosave' : 'Slot ' + s, hint: i ? i.lead + ' - ' + i.where + ' - ' + new Date(i.when).toLocaleString() : 'empty', value: s, disabled: !i };
    });
    const s = await UI.menu({ title: 'Load game', options: opts, cancel: null });
    if (!s) return false;
    return loadSlot(s);
  };

  async function newGame() {
    main.gen++;
    ST.newGame();
    BT.STYLES.town.snow = true;
    const t = $('title');
    t.innerHTML = '<div class="tbg">' + UI.art('scene', 'town') + '</div><div class="tcontent story"><div id="storytext"></div></div>';
    t.className = 'show';
    for (const p of D.STORY.intro) {
      $('storytext').innerHTML = '<p>' + p + '</p>';
      const r = await UI.menu({ options: [{ label: 'Continue', key: ' ', value: 'c', cls: 'cont' }, { label: 'Skip intro', key: 's', value: 's' }] });
      if (r === 's') break;
    }
    t.className = '';
    main.playing = true;
    UI.clearLog();
    BT.R.snap();
    ST.markExplored('town', BT.G.x, BT.G.y);
    UI.renderParty();
    UI.updateHud();
    music('town');
    UI.log('<span class="area">Velmoor</span>', 'info');
    UI.log('You stand in the snow before the Adventurers\' Guild. Gather a party inside.', 'info');
    const run = async () => {
      await BT.TW.enter('guild');
      if (BT.G.party.length) ST.save('auto');
      UI.log('Tip: the Tavern (east) has rumors - and a cellar. Press <b>H</b> for help.', 'info');
    };
    // after a game over we are still inside the previous action's guard
    if (BT.EX.locked()) await run(); else await BT.EX.guard(run);
  }

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

  try { const sp = +localStorage.getItem('velmoor_speed'); if (sp) BT.CB.delay = sp; } catch (e) { /* ignore */ }

  BT.main = main;
  window.addEventListener('load', main.boot);
})();
