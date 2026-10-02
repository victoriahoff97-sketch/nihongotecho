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

  const P = { MAX_STROKES, HW_URL, pointInPoly, strokesInLasso, inkPayload, parseCandidates };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.hwLogic = P;
})(this);
