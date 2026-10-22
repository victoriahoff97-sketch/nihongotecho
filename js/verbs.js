/* Nihongo Techō – eigene Verben bekommen Partikel-Muster und Verbklasse aus dem Verb-Index der JLPT-Pakete (offline) */
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

  // Neues eigenes Verb: fehlende Muster/Klasse aus dem Index (aufgerufen von App.saveItem); true = eingetragen
  App.verbFill = async (it) => L.needs(it) && own(it) && L.fill(await App.verbIndex(), it);

  // Bestand: eigene Verben einmal je Index-Version auffüllen (settings.verbIndex)
  App.verbBackfill = async () => {
    const idx = await App.verbIndex();
    if (!idx || App.store.settings.verbIndex === idx.version) return 0;
    const now = Date.now();
    const puts = App.itemsOf('vocab').filter((it) => own(it) && L.fill(idx, it));
    puts.forEach((it) => { it.updated = now; });
    if (puts.length) await App.db.putMany('items', puts);
    await App.saveSettings({ verbIndex: idx.version });
    if (puts.length) {
      App.emit('items');
      App.toast(puts.length === 1 ? '1 eigenes Verb hat jetzt Partikeln und Verbklasse' : `${puts.length} eigene Verben haben jetzt Partikeln und Verbklasse`);
    }
    return puts.length;
  };
})(window.App);
