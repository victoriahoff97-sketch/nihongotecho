/* Nihongo Techō – Skript-Lader, Paket-Status in meta.packs, Wörterbuch-Import (Store „dict“) */
'use strict';
(function (App) {
  // ---------- Skripte nachladen (funktioniert auch unter file://) ----------
  const scripts = new Map(); // src -> {promise, el}
  App.loadScript = (src) => {
    const known = scripts.get(src);
    if (known) return known.promise; // bereits geladen oder unterwegs
    const el = document.createElement('script');
    const entry = { el };
    entry.promise = new Promise((res, rej) => {
      el.onload = () => res();
      el.onerror = () => { el.remove(); scripts.delete(src); rej(new Error('Datei konnte nicht geladen werden: ' + src)); };
    });
    scripts.set(src, entry);
    el.src = src;
    document.head.appendChild(el);
    return entry.promise;
  };
  // Skript-Element entfernen (Speicher freigeben); ein späteres loadScript lädt die Datei erneut
  App.unloadScript = (src) => {
    const e = scripts.get(src);
    if (e) { e.el.remove(); scripts.delete(src); }
  };

  // ---------- Paket-Status (meta.packs) ----------
  let localCache = {};
  const setCache = (v) => { if (App.store) App.store.packs = v; else localCache = v; };
  const getCache = () => (App.store ? App.store.packs || {} : localCache);
  let queue = Promise.resolve(); // Schreibzugriffe nacheinander (Lesen-Ändern-Schreiben)
  App.packMeta = {
    read: async () => {
      const m = await App.db.get('meta', 'packs');
      const v = (m && m.value) || {};
      setCache(v);
      return v;
    },
    // val = null löscht den Eintrag
    set: (id, val) => {
      const run = async () => {
        const v = await App.packMeta.read();
        if (val == null) delete v[id]; else v[id] = JSON.parse(JSON.stringify(val));
        await App.db.put('meta', { key: 'packs', value: v });
        setCache(v);
        return v;
      };
      queue = queue.then(run, run);
      return queue;
    },
    cached: () => getCache(),
  };

  App.packById = (id) => (window.PACKS || []).find((p) => p.id === id);
  App.packDataKey = (file) => file.replace(/\.js$/, '');

  // ---------- Wörterbuch ----------
  // Speicher-voll-Fehler (IndexedDB) in eine verständliche Meldung übersetzen; andere Fehler unverändert
  const isQuota = (e) => e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''));
  App.storageError = (e) => (isQuota(e) ? new Error('Speicher voll – siehe Speicheranzeige') : e);

  async function writeChunk(packId, rows) {
    const cur = await App.db.getMany('dict', rows.map((r) => r[0]));
    const out = rows.map((row, i) => {
      const [id, k, r, p, en, de, c] = row;
      const old = cur[i];
      const pk = old && Array.isArray(old.pk) ? old.pk.slice() : [];
      if (!pk.includes(packId)) pk.push(packId);
      return { id, k, r, p, en, de, c, pk };
    });
    await App.db.putMany('dict', out); // ein Stück = eine Schreib-Transaktion
  }

  App.dict = {
    // Lädt die Stücke nacheinander; bereits importierte Stücke (chunksDone) werden übersprungen
    install: async (id, onProgress = () => {}) => {
      const pack = App.packById(id);
      if (!pack || pack.kind !== 'dict') throw new Error('Unbekanntes Wörterbuch-Paket: ' + id);
      let m = (await App.packMeta.read())[id];
      if (m && m.version !== pack.version) { await App.dict.remove(id); m = null; } // neue Version: sauber neu importieren
      if (m && m.complete) { onProgress(1, 'Fertig'); return m; }
      m = m ? { ...m, chunksDone: (m.chunksDone || []).slice() } : { version: pack.version, chunksDone: [], complete: false, started: Date.now() };
      await App.packMeta.set(id, m);
      const n = pack.files.length;
      for (let i = 0; i < n; i++) {
        if (m.chunksDone.includes(i)) continue;
        onProgress(m.chunksDone.length / n, `Teil ${m.chunksDone.length + 1} von ${n} wird importiert …`);
        const file = pack.files[i];
        const src = 'packs/' + file;
        const key = App.packDataKey(file);
        try {
          await App.loadScript(src);
          const rows = (window.PACK_DATA || {})[key];
          if (!Array.isArray(rows)) throw new Error('Paketdatei ohne Inhalt: ' + file);
          await writeChunk(id, rows);
        } catch (e) {
          throw App.storageError(e);
        } finally {
          if (window.PACK_DATA) delete window.PACK_DATA[key];
          App.unloadScript(src);
        }
        m.chunksDone.push(i);
        await App.packMeta.set(id, m);
      }
      m.complete = true;
      m.installed = Date.now();
      await App.packMeta.set(id, m);
      onProgress(1, 'Fertig');
      return m;
    },

    // Paket-Kennung aus allen Datensätzen entfernen; Datensätze ohne Paket werden gelöscht
    remove: async (id) => {
      await App.db.update('dict', (v) => {
        if (!Array.isArray(v.pk) || !v.pk.includes(id)) return undefined;
        const pk = v.pk.filter((x) => x !== id);
        if (!pk.length) return null;
        v.pk = pk;
        return v;
      });
      await App.packMeta.set(id, null);
    },

    // Map form -> Einträge (Suche in Schreibungen k und Lesungen r)
    lookup: async (forms) => {
      const uniq = [...new Set((forms || []).filter(Boolean))];
      if (!uniq.length) return new Map();
      return App.db.byIndex('dict', ['k', 'r'], uniq);
    },

    installed: () => Object.entries(App.packMeta.cached()).some(([pid, m]) => m && m.complete && (App.packById(pid) || {}).kind === 'dict'),
  };
})(window.App);
