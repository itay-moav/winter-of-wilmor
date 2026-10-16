// The automap: the minimap and the full map screen, drawn from explored cells.
(function () {
  const MG = BT.MG, R = BT.R;

  // ---------- automap ----------
  R.drawMap = function (cv, opts) {
    opts = opts || {};
    const G = BT.G, m = BT.MAPS[G.map];
    const c = cv.getContext('2d');
    const cw = cv.width, chh = cv.height;
    const cs = Math.floor(Math.min(cw / m.w, chh / m.h));
    const ox = Math.floor((cw - cs * m.w) / 2), oy = Math.floor((chh - cs * m.h) / 2);
    c.fillStyle = '#0b0d16';
    c.fillRect(0, 0, cw, chh);
    const all = opts.all || m.style === 'town';
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const seen = all || BT.ST.isExplored(G.map, x, y);
        const solid = m.fl[y][x] & MG.F_SOLID;
        const X = ox + x * cs, Y = oy + y * cs;
        if (solid) {
          if (m.style === 'town') {
            const ct = m.cellType[y][x];
            c.fillStyle = BT.BUILDINGS[ct] ? '#6b4f2a' : '#2a2f40';
            c.fillRect(X + 1, Y + 1, cs - 2, cs - 2);
            if (BT.BUILDINGS[ct] && cs >= 10) {
              c.fillStyle = '#ffd98a'; c.font = 'bold ' + Math.floor(cs * 0.6) + 'px Georgia';
              c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText(ct, X + cs / 2, Y + cs / 2 + 1);
            }
          }
          continue;
        }
        if (!seen) continue;
        const f = m.fl[y][x];
        c.fillStyle = f & MG.F_DARK ? '#1d1a2a' : f & MG.F_ANTI ? '#2c2240' : f & MG.F_WATER ? '#1b3346' : '#2b3550';
        c.fillRect(X, Y, cs, cs);
        const ev = m.ev[y][x];
        if (ev && cs >= 6) {
          let mark = null, col = '#fff';
          if (ev.t === 'stairs') { mark = ev.dir === 'up' ? '▲' : '▼'; col = '#ffe08a'; if (ev.label === 'up') mark = '▲'; }
          else if (ev.t === 'fountain' || ev.t === 'shrine') { mark = '◆'; col = '#7fd7ff'; }
          else if (ev.t === 'riddle') { mark = '?'; col = '#ff9de0'; }
          else if (ev.t === 'boss' && !G.flags[ev.flag]) { mark = '☠'; col = '#ff6060'; }
          if (mark) {
            c.fillStyle = col; c.font = Math.floor(cs * 0.7) + 'px sans-serif';
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(mark, X + cs / 2, Y + cs / 2 + 1);
          }
        }
      }
    }
    // edges
    c.lineCap = 'square';
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (!(all || BT.ST.isExplored(G.map, x, y))) continue;
        const X = ox + x * cs, Y = oy + y * cs;
        for (let d = 0; d < 4; d++) {
          const v = MG.edge(m, x, y, d);
          if (v === 0) continue;
          let col = '#c8d2ee', lw = Math.max(1.5, cs / 8);
          if (v === 2) { col = '#e0a050'; }
          if (v === 3) { if (!all) col = '#c8d2ee'; else col = '#a070ff'; }
          c.strokeStyle = col; c.lineWidth = lw;
          c.beginPath();
          if (d === 0) { c.moveTo(X, Y); c.lineTo(X + cs, Y); }
          if (d === 2) { c.moveTo(X, Y + cs); c.lineTo(X + cs, Y + cs); }
          if (d === 3) { c.moveTo(X, Y); c.lineTo(X, Y + cs); }
          if (d === 1) { c.moveTo(X + cs, Y); c.lineTo(X + cs, Y + cs); }
          c.stroke();
          if (v === 2 && cs >= 8) {
            c.fillStyle = '#e0a050';
            const mxp = d === 1 ? X + cs : d === 3 ? X : X + cs / 2;
            const myp = d === 2 ? Y + cs : d === 0 ? Y : Y + cs / 2;
            c.fillRect(mxp - 2, myp - 2, 4, 4);
          }
        }
      }
    }
    // player
    const X = ox + G.x * cs + cs / 2, Y = oy + G.y * cs + cs / 2;
    c.save();
    c.translate(X, Y);
    c.rotate(G.d * Math.PI / 2);
    c.fillStyle = '#ff5a5a';
    c.shadowColor = '#f00'; c.shadowBlur = 6;
    c.beginPath();
    c.moveTo(0, -cs * 0.4); c.lineTo(cs * 0.3, cs * 0.3); c.lineTo(-cs * 0.3, cs * 0.3);
    c.closePath(); c.fill();
    c.restore();
  };
})();
