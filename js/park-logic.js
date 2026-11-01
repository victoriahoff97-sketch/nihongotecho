/* Nihongo Techō – geparkte Kartenrunde: Logik ohne DOM (aus der Runde in einen Eintrag schauen und an derselben Karte weitermachen) */
'use strict';
(function (App) {
  const P = App.parkLogic = {};
  // Steht man auf der Seite der geparkten Runde? Dort wird fortgesetzt, überall sonst zeigt die Leiste den Weg zurück
  P.same = (parked, hash) => !!parked && parked.hash === hash;
  P.label = (parked) => `Karte ${parked.done + 1} / ${parked.total}`;
  // Fortsetzen: Einträge frisch aus dem Bestand holen (inzwischen bearbeitet oder gelöscht); entries[0] ist die offene Karte
  // known(e): steht die Karte jetzt auf „Kann ich“? Wer das im Eintrag gesetzt hat, will sie nicht mehr sehen.
  // Was schon beim Parken so stand (e.known), bleibt: freies Üben und Auffrischen fragen bewusst Gekonntes ab.
  P.revive = (parked, item, known = () => false) => {
    const fresh = parked.entries.map((e) => Object.assign({}, e, { it: item(e.it.id) }));
    const entries = fresh.filter((e) => e.it && (e.known || !known(e)));
    const curKept = entries[0] === fresh[0];
    return { entries, done: parked.done, right: parked.right, total: parked.total - (parked.entries.length - entries.length), open: curKept && !!parked.open };
  };
})(window.App);
