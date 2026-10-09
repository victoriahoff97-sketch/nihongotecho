/* Nihongo Techō – Paket oder Backup öffnen: eine Eingabe für Backup (.json), Paket (.ntpaket) und ZIP mit genau einer davon.
   Erst erkennen, dann importieren – bei jeder Unklarheit wird nichts importiert. */
'use strict';
(function (App) {
  const L = App.paketLogic;
  const MSG = {
    PAKET_INHALT: 'In der ZIP-Datei wurde kein Paket und kein Backup gefunden. Erwartet wird genau eine Datei mit der Endung .json oder .ntpaket.',
    PAKET_ZIP: 'Diese ZIP-Datei kann die App nicht lesen. Bitte entpacke sie und wähle die Datei darin.',
    FREMD: 'Das ist keine Nihongo-Techō-Datei.',
    BACKUP: 'Import fehlgeschlagen – die Backup-Datei ist beschädigt.',
    VOLL: 'Der Speicher dieses Geräts ist voll. Es ist nichts verloren gegangen – schaffe Platz und öffne die Datei noch einmal.',
    KAPUTT: 'Diese Paket-Datei ist beschädigt oder zu alt.',
  };
  const fail = (code) => Object.assign(new Error(MSG[code] || MSG.FREMD), { code });

  const inflate = async (bytes, entry) => {
    const raw = bytes.subarray(entry.dataStart, entry.dataStart + entry.compSize);
    let out;
    if (entry.method === 0) out = raw;
    else {
      if (typeof DecompressionStream !== 'function') throw fail('PAKET_ZIP');
      try { out = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); } catch (e) { throw fail('PAKET_ZIP'); }
    }
    if (out.length !== entry.size) throw fail('PAKET_ZIP');
    return out;
  };

  const stripExt = (n) => String(n || '').replace(/\.[^.]*$/, '');

  // Speicher voll: Browser-Fehler oder die Meldung aus App.storageError (dict.js)
  const isQuota = (e) => !!e && (e.name === 'QuotaExceededError' || /^Speicher voll/.test(e.message || ''));
  // Größtes ZIP-Mitglied, das noch im Speicher entpackt wird
  const MAX_ZIP_ENTRY = 2 ** 30;

  const importBackup = async (file) => {
    let r;
    try { r = await App.importData(file); } catch (e) {
      if (e && e.message === MSG.FREMD) throw fail('FREMD');
      if (isQuota(e)) throw fail('VOLL');
      console.error(e);
      throw fail('BACKUP');
    }
    return { art: 'backup', text: `Importiert: ${r.n} Einträge, ${r.nf} Dateien` };
  };

  const importAufgaben = async (file) => {
    const name = file.name || '';
    let n;
    try {
      if (!App.exercises || typeof App.exercises.load !== 'function') throw fail('KAPUTT');
      n = await App.exercises.load(file);
    } catch (e) {
      if (e && e.code && e.message) throw e;
      throw fail('KAPUTT');
    }
    const d = App.exercises.dir && App.exercises.dir();
    const titel = d && d.pack === 'genki1-aufgaben' ? 'Genki I Aufgaben' : stripExt(name);
    return { art: 'aufgaben', text: `Paket ‚${titel}‘ eingelesen – ${n} Aufgaben` };
  };

  const open = async (file) => {
    // Nur den Anfang lesen; große Backups werden nicht vorab kopiert (nur ZIP muss ganz in den Speicher)
    let k = L.kind(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
    let target = file;
    if (k === 'zip') {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let e;
      try { e = L.pick(L.zipEntries(bytes)); } catch (er) { throw fail(er.code); }
      if (e.size > MAX_ZIP_ENTRY) throw fail('PAKET_ZIP');
      const inner = await inflate(bytes, e);
      k = L.kind(inner.subarray(0, 64));
      if (k !== 'json' && k !== 'ntpaket') throw fail('PAKET_INHALT');
      target = new File([inner], e.name.split('/').pop(), k === 'json' ? { type: 'application/json' } : {});
    }
    if (k === 'json') return importBackup(target);
    if (k === 'ntpaket') return importAufgaben(target);
    throw fail('FREMD');
  };

  App.paket = { open };
})(window.App);
