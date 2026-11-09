/* Nihongo Techō – eigene Verben bekommen Partikel-Muster und Verbklasse: aus dem Verb-Index der JLPT-Pakete (offline),
 * sonst Klasse geraten und Muster aus dem eigenen Beispielsatz (js/verb-logic.js) */
'use strict';
(function (App) {
  const L = App.verbLogic;

  // packs/verb-index.js, erst bei Bedarf geladen; null, wenn die Datei gerade nicht zu haben ist (nächster Aufruf versucht es wieder)
  let index = null;
  App.verbIndex = async () => {
    if (!index) {
      try { await App.loadScript('packs/verb-index.js'); index = window.VERB_INDEX || null; }
      catch (e) { console.error(e); }
    }
    return index;
  };

  // Eigene Einträge: Paket- und Seed-Verben führen ihre Muster selbst
  const own = (it) => !it._pack && !it._seed;
  const opts = () => ({ notate: App.jp.notate });

  // Eigenes Verb (aufgerufen von App.saveItem): fehlende Muster/Klasse ergänzen; true = geändert
  App.verbFill = async (it) => own(it) && L.fill(await App.verbIndex(), it, opts());

  // Viele auf einmal, vor dem Speichern (Wortlisten-Import, Teilen-Paket): ändert die Einträge selbst, liefert die Zahl
  App.verbFillMany = async (items) => {
    const idx = await App.verbIndex();
    let n = 0;
    for (const it of items || []) if (it && it.type === 'vocab' && own(it) && L.fill(idx, it, opts())) n++;
    return n;
  };

  // Bestand bei jedem Start: eigene Verben ohne Muster/Klasse auffüllen, falsch geratene Klassen berichtigen.
  // Läuft schnell (nur Nachschlagen); was schon stimmt, wird nicht angefasst.
  App.verbBackfill = async () => {
    const idx = await App.verbIndex();
    const now = Date.now();
    const puts = App.itemsOf('vocab').filter((it) => own(it) && L.fill(idx, it, opts()));
    puts.forEach((it) => { it.updated = now; });
    if (puts.length) await App.db.putMany('items', puts);
    if (idx && App.store.settings.verbIndex !== idx.version) await App.saveSettings({ verbIndex: idx.version }, { silent: true });
    if (puts.length) {
      App.emit('items');
      App.toast(puts.length === 1 ? '1 eigenes Verb hat jetzt Partikeln und Verbklasse' : `${puts.length} eigene Verben haben jetzt Partikeln und Verbklasse`);
    }
    return puts.length;
  };
})(window.App);
