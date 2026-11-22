/* Nihongo Techō – Zählen einer Kartenrunde: Wörter statt Durchgänge (Logik ohne DOM)
   Ein nicht gewusstes Wort kommt in derselben Runde noch einmal – das zählt als Wiederholung, nicht als weiteres Wort. */
'use strict';
(function (App) {
  const R = App.roundCount = {};
  // n = Wörter der Runde · seen = davon schon einmal dran · first = beim ersten Mal gewusst · missed = beim ersten Mal nicht gewusst
  R.start = (n) => ({ n, seen: 0, first: 0, missed: [] });
  R.copy = (c) => Object.assign({}, c, { missed: c.missed.slice() });
  // Bewertung einer Karte; ent.rep = wie oft sie in dieser Runde schon zurückgelegt wurde
  R.grade = (c, ent, knew) => {
    if (!ent.rep) { c.seen++; if (knew) c.first++; else c.missed.push(ent); }
    if (!knew) ent.rep = (ent.rep || 0) + 1;
    return c;
  };
  // Wiederholungen, die noch offen sind (die gerade gezeigte mitgezählt)
  R.open = (cur, queue) => (cur && cur.rep ? 1 : 0) + queue.filter((e) => e !== cur && e.rep).length;
  // Kopfzeile: neue Wörter zählen hoch, eine Wiederholung lässt die Zahl stehen
  R.head = (c, cur) => (cur && cur.rep ? `Karte ${Math.max(1, c.seen)} von ${c.n}` : `Karte ${Math.min(c.seen + 1, c.n)} von ${c.n}`);
  R.progress = (c) => (c.n ? Math.min(1, c.seen / c.n) : 0);
  // Abschluss: alle Wörter = auf Anhieb + mit Wiederholung
  R.summary = (c) => ({ words: c.seen, first: c.first, later: c.missed.length });
  // Fortsetzen nach „Eintrag öffnen“: inzwischen gelöschte Wörter fallen auch aus der Zählung
  R.drop = (c, gone) => Object.assign(R.copy(c), { n: Math.max(c.seen, c.n - gone) });
})(window.App);
