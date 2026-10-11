/* Nihongo Techō – Sicherung von Hand: Logik ohne DOM (ungesicherte Änderungen merken, Zeittext, Abstand der Hinweise) */
'use strict';
(function (App) {
  const R = App.remindLogic = {};
  R.NUDGE_GAP = 10 * 60000;
  const num = (v) => { const n = +v; return n > 0 ? n : 0; };
  const p2 = (n) => String(n).padStart(2, '0');
  // Merker `hand-saved` (letzte Sicherung von Hand) und `hand-dirty` (erste Änderung seitdem; 0 = alles gesichert)
  R.read = (lsGet) => ({ saved: num(lsGet('hand-saved')), dirty: num(lsGet('hand-dirty')) });
  // Änderung vermerken → true, wenn der Stand dadurch erst ungesichert wurde; sonst wird nichts geschrieben
  R.touch = (lsGet, lsSet, now) => {
    if (num(lsGet('hand-dirty'))) return false;
    lsSet('hand-dirty', String(now));
    return true;
  };
  R.saved = (lsSet, now) => { lsSet('hand-saved', String(now)); lsSet('hand-dirty', ''); };
  // „Gesichert · 14:32“ (heute) bzw. „Gesichert · 09.10.“ (früher); nie gesichert = leer
  R.savedText = (saved, now) => {
    if (!saved) return '';
    const d = new Date(saved), n = new Date(now);
    const today = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    return 'Gesichert · ' + (today ? `${p2(d.getHours())}:${p2(d.getMinutes())}` : `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.`);
  };
  // Hinweis an Endpunkten (Runde fertig, Schreibblatt verlassen) höchstens alle NUDGE_GAP
  R.nudgeDue = (last, now) => !last || now - last >= R.NUDGE_GAP;
})(window.App);
