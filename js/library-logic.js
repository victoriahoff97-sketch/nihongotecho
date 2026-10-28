/* Nihongo Techō – Bibliothek: Sortieren und Ordner (reine Logik) */
'use strict';
(function (App) {
  // Sortierung gemerkt pro Gerät (localStorage „nt-libSort“); Ordner stehen in den Einstellungen (settings.libFolders),
  // jede Datei merkt sich höchstens einen Ordner (f.folder = Ordner-ID)
  const L = App.libraryLogic = {};

  L.SORTS = [
    { key: 'own', label: 'Eigene Reihenfolge' },
    { key: 'new', label: 'Neueste zuerst' },
    { key: 'old', label: 'Älteste zuerst' },
    { key: 'src', label: 'Nach Quelle' },
    { key: 'lesson', label: 'Nach Lektion' },
    { key: 'name', label: 'Name A–Z' },
  ];
  L.sortKey = (raw) => (L.SORTS.some((s) => s.key === raw) ? raw : 'own');

  const lessonNum = (f) => {
    const n = parseFloat(f.lesson);
    return f.lesson === '' || f.lesson == null || isNaN(n) ? Infinity : n;
  };
  const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'de', { numeric: true, sensitivity: 'base' });

  // own = die bisherige Reihenfolge (selbst gezogen, sonst neueste zuerst); sources = Quellen-Namen in der Reihenfolge der Einstellungen.
  // Gleichstand fällt immer auf die eigene Reihenfolge zurück, damit nichts springt.
  L.sort = (files, key, { own, sources = [] } = {}) => {
    const srcIdx = (f) => { const i = f.source ? sources.indexOf(f.source) : -1; return i < 0 ? (f.source ? sources.length : Infinity) : i; };
    const cmp = {
      own: () => 0,
      new: (a, b) => (b.created || 0) - (a.created || 0),
      old: (a, b) => (a.created || 0) - (b.created || 0),
      src: (a, b) => (srcIdx(a) - srcIdx(b)) || (a.source && b.source && a.source !== b.source ? a.source.localeCompare(b.source, 'de') : 0) || (lessonNum(a) - lessonNum(b) || 0),
      lesson: (a, b) => (lessonNum(a) - lessonNum(b) || 0) || (srcIdx(a) - srcIdx(b) || 0),
      name: byName,
    }[L.sortKey(key)];
    return files.slice().sort((a, b) => cmp(a, b) || (own ? own(a, b) : 0));
  };

  // Ordner, den es noch gibt (geteilte Pakete können IDs fremder Ordner mitbringen – die zählen als „kein Ordner“)
  L.folderOf = (f, folders) => (f.folder && (folders || []).some((x) => x.id === f.folder) ? f.folder : '');

  // Welche Dateien die Liste zeigt: im Ordner nur dessen Dateien; in der Gesamtansicht ohne Filter nur Dateien ohne Ordner,
  // sobald ein Filter gesetzt ist, alle passenden (auch aus Ordnern) – so findet das Filtern weiter alles
  L.visible = (files, { folder = '', filtered = false, folders = [] } = {}) => {
    if (folder) return files.filter((f) => L.folderOf(f, folders) === folder);
    if (filtered) return files.slice();
    return files.filter((f) => !L.folderOf(f, folders));
  };

  L.counts = (files, folders) => {
    const out = {};
    (folders || []).forEach((x) => { out[x.id] = 0; });
    files.forEach((f) => { const id = L.folderOf(f, folders); if (id) out[id]++; });
    return out;
  };

  L.cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  L.addFolder = (folders, name, id) => {
    const n = L.cleanName(name);
    if (!n) return null;
    return (folders || []).concat([{ id, name: n }]);
  };
  L.renameFolder = (folders, id, name) => {
    const n = L.cleanName(name);
    if (!n) return null;
    return (folders || []).map((x) => (x.id === id ? Object.assign({}, x, { name: n }) : x));
  };
  L.removeFolder = (folders, id) => (folders || []).filter((x) => x.id !== id);
  L.byFolderName = (folders) => (folders || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true, sensitivity: 'base' }));
})(window.App = window.App || {});
