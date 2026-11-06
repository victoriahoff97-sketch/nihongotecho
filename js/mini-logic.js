/* Nihongo Techō – Mini-Fenster (Hören verkleinert): wo es auf dem Bildschirm liegt (reine Logik) */
'use strict';
(function (App) {
  const M = {};
  const GAP = 12; // Abstand zum Bildschirmrand
  M.GAP = GAP;
  // Breite des Mini-Fensters: 340 px, auf schmalen Bildschirmen weniger
  M.width = (vw) => Math.max(200, Math.min(340, vw - 2 * GAP));
  // Fenster ganz im sichtbaren Bereich halten
  M.clamp = (p, w, h, vw, vh) => ({
    x: Math.round(Math.min(Math.max(GAP, p.x), Math.max(GAP, vw - w - GAP))),
    y: Math.round(Math.min(Math.max(GAP, p.y), Math.max(GAP, vh - h - GAP))),
  });
  // Ohne gemerkte Stelle: unten rechts (wie bei YouTube), gemerkte Stelle nur, wenn sie gültig ist
  M.start = (saved, w, h, vw, vh) => {
    const ok = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y);
    return M.clamp(ok ? saved : { x: vw - w - GAP, y: vh - h - GAP }, w, h, vw, vh);
  };
  App.miniLogic = M;
})(window.App);
