/* Nihongo Techō – Schrift auswählen und verschieben: Lasso-Auswahl, Rahmen, Versatz mit Randbegrenzung. Browser: App.inkSelect, Node: module.exports */
'use strict';
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const { pointInPoly } = node ? require('./hw-logic.js') : root.App.hwLogic;
  const r4 = (v) => +v.toFixed(4);

  // Striche, deren Punkte mehrheitlich im Lasso liegen (anders als beim Erkennen zählt der Marker mit)
  const pick = (strokes, poly) => {
    if (!poly || poly.length < 3) return [];
    return strokes.filter((s) => {
      if (!s.pts || !s.pts.length) return false;
      let n = 0;
      s.pts.forEach((q) => { if (pointInPoly(q, poly)) n++; });
      return n * 2 > s.pts.length;
    });
  };
  // Wort-Verknüpfungen, deren Mitte im Lasso liegt
  const pickLinks = (links, poly) => (links || []).filter((l) => pointInPoly([l.x + l.w / 2, l.y + l.h / 2], poly));

  // Rahmen um die Auswahl (Anteile der Seitenbreite); null ohne Punkte
  const bounds = (strokes, pad = 0.008) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((s) => (s.pts || []).forEach((q) => { minX = Math.min(minX, q[0]); minY = Math.min(minY, q[1]); maxX = Math.max(maxX, q[0]); maxY = Math.max(maxY, q[1]); }));
    if (minX === Infinity) return null;
    return { x: r4(minX - pad), y: r4(minY - pad), w: r4(maxX - minX + 2 * pad), h: r4(maxY - minY + 2 * pad) };
  };
  const inBox = (b, pt, pad = 0) => pt[0] >= b.x - pad && pt[0] <= b.x + b.w + pad && pt[1] >= b.y - pad && pt[1] <= b.y + b.h + pad;

  // Versatz so begrenzen, dass der Rahmen im Bereich { x0, x1, y0, y1 } bleibt (eine Seite oder die Doppelseite)
  const clampDelta = (b, dx, dy, area) => {
    const lim = (v, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), v));
    return [r4(lim(b.x + dx, area.x0, area.x1 - b.w) - b.x), r4(lim(b.y + dy, area.y0, area.y1 - b.h) - b.y)];
  };
  // Doppelseite: liegt die Mitte des verschobenen Rahmens näher an der Nachbarseite? (offX = deren linker Rand, null = keine)
  const overOther = (b, dx, offX) => {
    if (offX == null) return false;
    const cx = b.x + dx + b.w / 2;
    return Math.abs(cx - (offX + 0.5)) < Math.abs(cx - 0.5);
  };

  // An Ort und Stelle verschieben: die Strich-Objekte bleiben dieselben (Rückgängig erkennt sie daran)
  const shift = (strokes, dx, dy) => strokes.forEach((s) => { s.pts = s.pts.map((q) => [r4(q[0] + dx), r4(q[1] + dy), q[2]]); });
  const shiftBoxes = (boxes, dx, dy) => boxes.forEach((b) => { b.x = r4(b.x + dx); b.y = r4(b.y + dy); });

  const P = { pick, pickLinks, bounds, inBox, clampDelta, overOther, shift, shiftBoxes };
  if (node) module.exports = P; else root.App.inkSelect = P;
})(this);
