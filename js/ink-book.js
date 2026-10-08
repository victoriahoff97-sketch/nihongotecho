/* Nihongo Techō – Buchlayout: Seiten ↔ Doppelseiten, Einpassen, Wisch-Blättern. Browser: App.inkBook, Node: module.exports */
'use strict';
(function (root) {
  // Rand um das aufgeschlagene Buch (Einband + Schatten), in CSS-Pixeln
  const PAD_X = 44, PAD_Y = 36, MIN_W = 120;

  const spreadCount = (n) => Math.max(1, Math.ceil((n || 0) / 2));
  const spreadOf = (pageIdx) => Math.floor(pageIdx / 2);
  // Seiten einer Doppelseite (0-basiert); r = null, wenn die rechte Seite noch fehlt
  const pagesOf = (s, n) => ({ l: 2 * s, r: 2 * s + 1 < n ? 2 * s + 1 : null });
  const clampSpread = (s, n) => Math.min(Math.max(0, s | 0), spreadCount(n) - 1);
  // Breite einer Seite, damit die ganze Doppelseite (2 Seiten, Höhe = Breite × ratio) in die Fläche passt
  const fitWidth = (cw, ch, ratio) => Math.max(MIN_W, Math.min((cw - 2 * PAD_X) / 2, (ch - 2 * PAD_Y) / ratio));
  // Fingerwisch: 1 = weiter, -1 = zurück, 0 = kein Blättern
  const swipeDir = (dx, dy, ms) => (ms < 600 && Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0);

  const P = { PAD_X, PAD_Y, MIN_W, spreadCount, spreadOf, pagesOf, clampSpread, fitWidth, swipeDir };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkBook = P;
})(this);
