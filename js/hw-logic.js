/* Nihongo Techō – Handschrift erkennen: Lasso-Auswahl, Anfrage an den Google-Handschrift-Dienst, Antwort lesen. Browser: App.hwLogic, Node: module.exports */
'use strict';
(function (root) {
  const MAX_STROKES = 150;
  const HW_URL = (lang) => `https://inputtools.google.com/request?itc=${lang}-t-i0-handwrit&app=translate`;

  // Strahl-Test
  const pointInPoly = (pt, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  // Striche, deren Punkte mehrheitlich im Lasso liegen (Marker zählt nicht als Schrift)
  const strokesInLasso = (strokes, poly) => {
    if (!poly || poly.length < 3) return [];
    return strokes.filter((s) => {
      if (s.t === 'marker' || !s.pts || !s.pts.length) return false;
      let n = 0;
      s.pts.forEach((q) => { if (pointInPoly(q, poly)) n++; });
      return n * 2 > s.pts.length;
    });
  };

  // Punkte (Anteil der Seitenbreite) → ganze Zahlen relativ zum Rahmen der Auswahl
  const inkPayload = (strokes, lang) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((s) => s.pts.forEach((q) => { minX = Math.min(minX, q[0]); minY = Math.min(minY, q[1]); maxX = Math.max(maxX, q[0]); maxY = Math.max(maxY, q[1]); }));
    const X = (v) => Math.round((v - minX) * 1000), Y = (v) => Math.round((v - minY) * 1000);
    return {
      options: 'enable_pre_space',
      requests: [{
        writing_guide: { writing_area_width: Math.max(1, X(maxX)), writing_area_height: Math.max(1, Y(maxY)) },
        ink: strokes.map((s) => [s.pts.map((q) => X(q[0])), s.pts.map((q) => Y(q[1]))]),
        language: lang,
        max_num_results: 10,
      }],
    };
  };

  // Antwort: ["SUCCESS", [[id, [Vorschläge …], …]]]
  const parseCandidates = (json, max) => {
    if (!Array.isArray(json) || json[0] !== 'SUCCESS' || !Array.isArray(json[1]) || !Array.isArray(json[1][0]) || !Array.isArray(json[1][0][1])) return [];
    const out = [];
    for (const c of json[1][0][1]) { if (typeof c === 'string' && c && !out.includes(c)) out.push(c); if (out.length >= max) break; }
    return out;
  };

  // ---------- Wort-Verknüpfungen auf dem Blatt: { id, itemId, x, y, w, h } (Anteile der Seitenbreite, wie die Striche) ----------
  const r4 = (v) => +v.toFixed(4);
  // Rahmen um die Striche eines Wortes, mit etwas Rand; null ohne Punkte.
  // Mindestgröße, damit auch ein flaches 一 mit dem Stift zu treffen ist
  const MIN_BOX = 0.02;
  const wordBox = (strokes, pad = 0.004) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach((s) => (s.pts || []).forEach((q) => { minX = Math.min(minX, q[0]); minY = Math.min(minY, q[1]); maxX = Math.max(maxX, q[0]); maxY = Math.max(maxY, q[1]); }));
    if (minX === Infinity) return null;
    const span = (a, b) => { a -= pad; b += pad; if (b - a < MIN_BOX) { const c = (a + b) / 2; a = c - MIN_BOX / 2; b = c + MIN_BOX / 2; } a = Math.max(0, a); return [a, b - a]; };
    const [x, w] = span(minX, maxX), [y, h] = span(minY, maxY);
    return { x: r4(x), y: r4(y), w: r4(w), h: r4(h) };
  };
  // Verknüpfung unter dem Punkt; bei Überlappung die kleinste (das genauer eingekreiste Wort)
  const linkAt = (links, pt, pad = 0) => {
    let best = null;
    (links || []).forEach((l) => {
      if (pt[0] < l.x - pad || pt[0] > l.x + l.w + pad || pt[1] < l.y - pad || pt[1] > l.y + l.h + pad) return;
      if (!best || l.w * l.h < best.w * best.h) best = l;
    });
    return best;
  };
  // Neue Verknüpfung; eine vorhandene an (fast) derselben Stelle wird ersetzt (Wort neu erkannt/korrigiert)
  const addLink = (links, link) => {
    const same = (l) => Math.abs(l.x - link.x) < 0.01 && Math.abs(l.y - link.y) < 0.01 && Math.abs(l.w - link.w) < 0.02 && Math.abs(l.h - link.h) < 0.02;
    return (links || []).filter((l) => !same(l)).concat(link);
  };

  const P = { MAX_STROKES, HW_URL, pointInPoly, strokesInLasso, inkPayload, parseCandidates, wordBox, linkAt, addLink };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.hwLogic = P;
})(this);
