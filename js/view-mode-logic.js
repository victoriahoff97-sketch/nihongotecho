/* Nihongo Techō – Handy-Ansicht: reine Logik (Modus, Ring auf der Startseite, Leiste unten)
   Die Handy-Ansicht gilt nur bei schmalem Bildschirm (≤ 860 px, wie das ☰-Menü) und wenn auf dem Gerät nicht „Standard“ gewählt ist. */
'use strict';
(function (App) {
  const V = App.viewModeLogic = {};
  const NARROW = V.NARROW = 860;

  V.mode = (width, saved) => (width > NARROW || saved === 'standard' ? 'standard' : 'handy');

  // Ring: Anteil der heute schon wiederholten Karten. Ohne Fälliges und ohne Geschafftes gilt er als voll.
  const n = (x) => (Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
  V.ring = (done, due) => {
    const d = n(done), u = n(due);
    return { due: u, done: d, frac: d + u ? d / (d + u) : 1 };
  };

  // Heute bewertete Karten (Lernstand merkt sich „last“ beim Bewerten). Nicht dayLog.reviews: das hört beim Tagesziel auf zu zählen.
  V.doneToday = (cards, dayStart) => {
    let k = 0;
    for (const s of cards || []) if (s && s.last >= dayStart) k++;
    return k;
  };

  // Beim Wechsel Handy ⇄ Standard neu zeichnen nur auf der Startseite – sonst ginge eine laufende Runde oder ein Text verloren
  V.rerenderOnSwitch = (path) => path === '/';

  // Leiste unten weg, wo man Platz zum Antworten oder Schreiben braucht: Übungsrunden, Buchaufgaben, Schreibblätter
  V.barHidden = (path) => /^\/(ueben|aufgabe|anwenden\/(antwort|eintrag))\/./.test(path) || /^\/unterricht\/./.test(path);

  V.barActive = (path, base) => {
    if (base === '/') return path === '/';
    return path === base || path.startsWith(base + '/') || (base === '/vokabeln' && (path === '/gleichklang' || path === '/bedeutung'));
  };
})(window.App);
