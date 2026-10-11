/* Nihongo Techō – Beispielsatz für eigene Vokabeln: aus dem Satz-Index der JLPT-Pakete (offline), sonst von Tatoeba */
'use strict';
(function (App) {
  const L = App.exampleLogic;

  // packs/example-index.js, erst bei Bedarf geladen; null, wenn die Datei gerade nicht zu haben ist (nächster Aufruf versucht es wieder)
  let index = null;
  App.exampleIndex = async () => {
    if (!index) {
      try { await App.loadScript('packs/example-index.js'); index = window.EXAMPLE_INDEX || null; }
      catch (e) { console.error(e); }
    }
    return index;
  };

  // Eigene Einträge: Paket- und Seed-Einträge führen ihren Satz selbst (oder bewusst keinen)
  const own = (it) => !it._pack && !it._seed;

  // Geprüfter Satz {jp, de} zum Wort oder null
  App.exampleFor = async (it) => L.find(await App.exampleIndex(), it);

  // Neue eigene Vokabel ohne Satz bekommt den aus dem Index (aufgerufen von App.saveItem); true = eingetragen
  App.exampleFill = async (it) => L.needs(it) && own(it) && L.fill(await App.exampleIndex(), it);

  // Nach dem Speichern: steht das Wort in keinem Paket, den kürzesten Tatoeba-Satz nachtragen (braucht Internet)
  App.exampleLater = async (id) => {
    const it = App.item(id);
    if (!L.needs(it) || !own(it) || navigator.onLine === false) return false;
    let ex = null;
    try { ex = (await App.tatoeba.search(it.kanji || it.kana, (u, o) => fetch(u, o)).more(1)).list[0]; }
    catch (e) { console.error(e); }
    const cur = App.item(id);
    if (!ex || !L.needs(cur)) return false;
    const row = { jp: ex.furi || ex.jp, src: ex.src };
    if (ex.de) row.de = ex.de; else row.en = ex.en;
    cur.examples = [row];
    await App.saveItem(cur);
    return true;
  };

  // Bestand: eigene Vokabeln ohne Satz aus dem Index auffüllen – einmal je Index-Version (settings.exampleIndex)
  App.exampleBackfill = async () => {
    const idx = await App.exampleIndex();
    if (!idx || App.store.settings.exampleIndex === idx.version) return 0;
    const now = Date.now();
    const puts = App.itemsOf('vocab').filter((it) => own(it) && L.fill(idx, it));
    puts.forEach((it) => { it.updated = now; });
    if (puts.length) await App.db.putMany('items', puts);
    await App.saveSettings({ exampleIndex: idx.version });
    if (puts.length) {
      App.emit('items');
      App.toast(puts.length === 1 ? '1 eigene Vokabel hat jetzt einen Beispielsatz' : `${puts.length} eigene Vokabeln haben jetzt einen Beispielsatz`);
    }
    return puts.length;
  };
})(window.App);
