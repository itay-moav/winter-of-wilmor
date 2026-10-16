// Boot, the title screen, new game and loading. The entry point: runs on window load.
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
    UI.syncSong(); // no bard song over the title or game-over screen
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

  try { const sp = +localStorage.getItem('velmoor_speed'); if (sp) BT.CB.delay = sp; } catch (e) { /* ignore */ }

  BT.main = main;
  window.addEventListener('load', main.boot);
})();
