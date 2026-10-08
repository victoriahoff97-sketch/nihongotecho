/* Nihongo Techō – Schrift auswählen, verschieben und skalieren: Lasso-Auswahl, Rahmen, Versatz mit Randbegrenzung, Eck-Anfasser. Browser: App.inkSelect, Node: module.exports */
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
  const PAD = 0.008;
  const bounds = (strokes, pad = PAD) => {
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

  // ---------- Skalieren: an einer Ecke ziehen, die Gegenecke bleibt fest, Proportionen bleiben ----------
  const CORNERS = { nw: [0, 0], ne: [1, 0], sw: [0, 1], se: [1, 1] };
  const handleAt = (b, pt, tol) => {
    for (const k of Object.keys(CORNERS)) {
      const [cx, cy] = CORNERS[k];
      if (Math.abs(pt[0] - (b.x + cx * b.w)) <= tol && Math.abs(pt[1] - (b.y + cy * b.h)) <= tol) return k;
    }
    return null;
  };
  // Faktor k und Festpunkt (fx, fy); die längere Seite bleibt mindestens minSize, der Rahmen im Bereich area
  const scaleAt = (b, handle, pt, area, minSize = 0.02) => {
    const [cx, cy] = CORNERS[handle];
    const fx = b.x + (1 - cx) * b.w, fy = b.y + (1 - cy) * b.h;
    const sx = cx ? 1 : -1, sy = cy ? 1 : -1;
    // ein einzelner Punkt hat keine Größe; bei einem waagrechten/senkrechten Strich zählt nur dessen Richtung
    if (!(b.w > 0) && !(b.h > 0)) return { k: 1, fx: r4(fx), fy: r4(fy) };
    const k = (sx * (pt[0] - fx) * b.w + sy * (pt[1] - fy) * b.h) / (b.w * b.w + b.h * b.h);
    const lo = Math.min(1, minSize / Math.max(b.w, b.h));
    const room = (size, free) => (size > 0 ? free / size : Infinity);
    const hi = Math.max(1, Math.min(room(b.w, sx > 0 ? area.x1 - fx : fx - area.x0), room(b.h, sy > 0 ? area.y1 - fy : fy - area.y0)));
    return { k: r4(Math.max(lo, Math.min(hi, k))), fx: r4(fx), fy: r4(fy) };
  };
  // An Ort und Stelle skalieren; die Strichstärke geht mit, sonst verklumpt verkleinerte Schrift
  const scale = (strokes, k, fx, fy) => strokes.forEach((s) => {
    s.pts = s.pts.map((q) => [r4(fx + (q[0] - fx) * k), r4(fy + (q[1] - fy) * k), q[2]]);
    s.w = +(s.w * k).toFixed(5);
  });
  const scaleBoxes = (boxes, k, fx, fy) => boxes.forEach((b) => { b.x = r4(fx + (b.x - fx) * k); b.y = r4(fy + (b.y - fy) * k); b.w = r4(b.w * k); b.h = r4(b.h * k); });
  // Skalieren rundet – Rückgängig merkt sich deshalb den Stand, statt zurückzurechnen
  const snap = (strokes, links) => ({ s: strokes.map((s) => ({ pts: s.pts, w: s.w })), l: links.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h })) });
  const restore = (strokes, links, sn) => {
    strokes.forEach((s, i) => { s.pts = sn.s[i].pts; s.w = sn.s[i].w; });
    links.forEach((l, i) => Object.assign(l, sn.l[i]));
  };

  const P = { PAD, pick, pickLinks, bounds, inBox, clampDelta, overOther, shift, shiftBoxes, handleAt, scaleAt, scale, scaleBoxes, snap, restore };
  if (node) module.exports = P; else root.App.inkSelect = P;
})(this);
