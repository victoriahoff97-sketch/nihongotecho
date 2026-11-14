/* Nihongo Techō – Lernstufen: reine Logik (Hover-Fenster über „Deine Sammlung“ auf der Startseite)
   Die Lernschlange wird nach dem Wiederholungsabstand in Stufen geteilt – wie eine Pflanze, die wächst:
   Ungeprüft → Neu → Keimt (< 1 Woche) → Wächst (1–3 Wochen) → Blüht (3 Wochen bis 2 Monate) → Kann ich (ab 2 Monaten).
   Die Reihenfolge geht immer vom Schwächsten zum Stärksten (oben bzw. links = schwächste Stufe). */
'use strict';
(function (App) {
  const L = App.stufenLogic = {};

  L.ORDER = ['open', 'neu', 'keimt', 'waechst', 'blueht', 'known'];
  L.INFO = {
    open: { label: 'Ungeprüft', hint: 'noch nicht dran', color: 'var(--line-2)' },
    neu: { label: 'Neu', hint: 'noch nie gewusst', color: 'color-mix(in srgb, var(--ai) 25%, transparent)' },
    keimt: { label: 'Keimt', hint: 'unter 1 Woche', color: 'color-mix(in srgb, var(--ai) 45%, transparent)' },
    waechst: { label: 'Wächst', hint: '1–3 Wochen', color: 'color-mix(in srgb, var(--ai) 70%, transparent)' },
    blueht: { label: 'Blüht', hint: '3–8 Wochen', color: 'var(--ai)' },
    known: { label: 'Kann ich', hint: 'ab 2 Monaten', color: 'var(--matcha)' },
  };

  // Stufe einer Karte, die in der Lernschlange steckt (also noch nicht „kann ich“)
  L.queueStage = (s) => {
    if (!s || !(s.reps > 0)) return 'neu';
    const ivl = +s.ivl || 0;
    return ivl < 7 ? 'keimt' : ivl < 21 ? 'waechst' : 'blueht';
  };

  // Zählt Stufen aus einer Liste von Stufen-Namen; total = Länge
  L.count = (stages) => {
    const c = { total: stages.length };
    L.ORDER.forEach((k) => { c[k] = 0; });
    stages.forEach((k) => { if (k in c) c[k]++; });
    return c;
  };

  // Balken-Abschnitte in Prozent, links = schwächste Stufe; leere Stufen fallen weg
  L.segments = (c) => (c.total ? L.ORDER.filter((k) => c[k]).map((k) => ({ k, pct: Math.round((c[k] / c.total) * 1000) / 10 })) : []);
})(window.App);
