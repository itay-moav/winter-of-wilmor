// Pictures in the interface: generated SVG art (cached), custom images from assets/manifest.js, NPC overlays, spell flashes.
(function () {
  const U = BT.U, UI = BT.UI;
  const $ = (id) => document.getElementById(id);
  const artCache = {};

  // ---------- art ----------
  // Custom image from assets/manifest.js, if one is listed for this art.
  function assetFor(kind, key, opts) {
    const A = window.BT_ASSETS && window.BT_ASSETS[kind];
    if (!A) return null;
    let file = null;
    if ((kind === 'portrait' || kind === 'figure') && opts) file = A[opts.race + '_' + opts.cls + '_' + opts.gender] || A[opts.cls + '_' + opts.gender];
    else file = A[key];
    if (!file) return null;
    const fit = kind === 'portrait' || kind === 'npc' || kind === 'scene' ? 'cover' : 'contain';
    return '<img class="asset" src="assets/' + U.esc(file) + '" style="width:100%;height:100%;object-fit:' + fit + ';' + (opts && opts.hue ? 'filter:hue-rotate(' + opts.hue + 'deg)' : '') + '" draggable="false">';
  }

  UI.art = function (kind, key, opts) {
    const asset = assetFor(kind, key, opts);
    if (asset) return asset;
    if (!BT.art) return '';
    const ck = kind + ':' + key + ':' + JSON.stringify(opts || {});
    if (artCache[ck]) return artCache[ck];
    let s = '';
    try {
      if (kind === 'monster') s = BT.art.monster(key, opts || {});
      else if (kind === 'npc') s = BT.art.npc(key);
      else if (kind === 'scene') s = BT.art.scene(key);
      else if (kind === 'portrait') s = BT.art.portrait(opts);
      else if (kind === 'figure') s = BT.art.figure ? BT.art.figure(opts) : BT.art.portrait(opts);
      else if (kind === 'npcFigure') s = BT.art.npcFigure && BT.art.npcFigureKeys && BT.art.npcFigureKeys.indexOf(key) >= 0 ? BT.art.npcFigure(key) : '';
    } catch (err) { console.error(err); s = ''; }
    artCache[ck] = s;
    return s;
  };
  // Full-body art for the character sheet; falls back to the bust portrait.
  UI.figure = function (ch) {
    if (ch.summon) return UI.portrait(ch);
    const opts = { race: ch.race, cls: ch.cls, gender: ch.gender, look: ch.look, seed: ch.seed };
    const f = UI.art('figure', 'fig' + ch.id + ch.cls, opts);
    return f ? '<div class="figwrap">' + f + '</div>' : UI.portrait(ch);
  };
  UI.portrait = function (ch) {
    if (ch.summon) {
      const md = BT.MONSTERS[ch.mid];
      return UI.art('monster', md.art, { hue: md.hue || 0 });
    }
    return UI.art('portrait', ch.id + ch.cls, { race: ch.race, cls: ch.cls, gender: ch.gender, look: ch.look, seed: ch.seed });
  };

  // Show an NPC or scene over the 3D view.
  UI.showNpc = function (key, caption) {
    const ov = $('overlay');
    const fig = UI.art('npcFigure', key);
    if (fig) {
      ov.innerHTML = '<div class="npcfig">' + fig + '</div>' + (caption ? '<div class="npccap">' + caption + '</div>' : '');
      ov.className = 'show npc fig';
    } else {
      ov.innerHTML = '<div class="npcframe">' + UI.art('npc', key) + '</div>' + (caption ? '<div class="npccap">' + caption + '</div>' : '');
      ov.className = 'show npc';
    }
  };
  UI.hideOverlay = function () { const ov = $('overlay'); ov.className = ''; ov.innerHTML = ''; };

  UI.spellFx = function (kind) {
    const colors = { fire: '#ff7a1a', ice: '#7fd6ff', lightning: '#fff27a', holy: '#fff6c0', dark: '#8a3cff', heal: '#7dffb0', generic: '#c58bff' };
    BT.R.flash(colors[kind] || colors.generic, 400);
    const ov = $('fx');
    ov.className = 'fx ' + kind;
    void ov.offsetWidth;
    ov.className = 'fx ' + kind + ' play';
  };
})();
