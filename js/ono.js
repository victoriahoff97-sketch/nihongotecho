/* Nihongo Techō – Lautmalerei (オノマトペ): Vokabeln wie ごろごろ, わくわく, ドキドキ bekommen von selbst das
 * Schlagwort „lautmalerei“ – neue beim Speichern, der Bestand bei jedem Start und nach dem Laden von Paketen
 * (Logik: js/ono-logic.js, Liste: js/ono-data.js) */
'use strict';
(function (App) {
  const O = App.ono;
  let idx = null;
  const index = () => idx || (idx = O.index(App.ONO_DATA));

  // Eine Vokabel vor dem Speichern (App.saveItem); true = geändert
  App.onoFill = (it) => O.fill(index(), it);

  // Bestand: alle Vokabeln (eigene, Pakete, Genki) einmal prüfen; schnell, nur Nachschlagen.
  // Still, ohne Meldung – wer nachsehen will, filtert unter Vokabeln nach Wortart „Lautmalerei“.
  let running = false;
  App.onoBackfill = async () => {
    if (running) return 0;
    running = true;
    try {
      const now = Date.now();
      const puts = App.itemsOf('vocab').filter((it) => O.fill(index(), it));
      puts.forEach((it) => { it.updated = now; });
      if (puts.length) { await App.db.putMany('items', puts); App.emit('items'); }
      return puts.length;
    } finally { running = false; }
  };

  // Neu dazugekommene Wörter (Paket geladen, Wortliste importiert): kurz danach ebenfalls markieren
  let timer = 0;
  App.onChange((w) => {
    if (w !== 'items' || running) return;
    clearTimeout(timer);
    timer = setTimeout(() => App.onoBackfill().catch((e) => console.error(e)), 800);
  });
})(window.App);
