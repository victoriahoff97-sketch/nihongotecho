/* Nihongo Techō – Ordner-Sicherung: Logik ohne DOM (arbeitet gegen ein übergebenes Ordner-Handle, in Node getestet) */
'use strict';
(function (App) {
  const B = App.backupLogic = {};
  B.APP = 'nihongo-techo';
  B.FORMAT = 1;
  B.SUBDIR = 'NihongoTecho-Sicherung';
  B.KEEP_DAYS = 14;
  B.KEEP_PRE = 3;
  B.META_KEYS = ['settings', 'packs', 'deletedPackItems', 'deletedSeeds'];
  const DIR_FILES = 'anlagen', DIR_INK = 'stiftnotizen', DIR_VER = 'versionen';

  // ---------- Namen ----------
  // Anlage im Ordner: <ID>_<Name>. Die ID davor macht den Namen eindeutig und nie zu einem in Windows reservierten.
  B.fileName = (file) => {
    // eslint-disable-next-line no-control-regex
    let n = String(file.name || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '');
    if (!n) n = 'Datei';
    const cp = Array.from(n);
    if (cp.length > 80) {
      const m = n.match(/\.[^.\s]{1,9}$/);
      const ext = m ? Array.from(m[0]) : [];
      // nach dem Kürzen darf wieder kein Punkt oder Leerzeichen am Ende stehen (Windows schneidet sie ab)
      n = (cp.slice(0, 80 - ext.length).join('').replace(/[. ]+$/, '') || 'Datei') + ext.join('');
    }
    return file.id + '_' + n;
  };
  B.idOfName = (name) => {
    const i = String(name).indexOf('_');
    if (i < 1) return null;
    const id = name.slice(0, i);
    return /^[\w-]+$/.test(id) ? id : null;
  };
  // Stiftnotiz-Schlüssel „dateiId:seite“ → dateiId
  B.inkFileId = (key) => { const s = String(key); const i = s.lastIndexOf(':'); return i < 0 ? s : s.slice(0, i); };

  const p2 = (n) => String(n).padStart(2, '0');
  const day = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  B.dayName = (ms) => `daten-${day(ms)}.json`;
  B.preName = (ms) => { const d = new Date(ms); return `daten-${day(ms)}-${p2(d.getHours())}${p2(d.getMinutes())}-vor-wiederherstellung.json`; };
  const RE_DAY = /^daten-(\d{4})-(\d{2})-(\d{2})\.json$/;
  const RE_PRE = /^daten-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})-vor-wiederherstellung\.json$/;
  // Namen in versionen/, die gelöscht werden: alles außer den jüngsten Tagesständen bzw. Vorher-Ständen; Fremdes nie
  B.prune = (names) => {
    const old = (re, keep) => names.filter((n) => re.test(n)).sort().reverse().slice(keep);
    return old(RE_DAY, B.KEEP_DAYS).concat(old(RE_PRE, B.KEEP_PRE));
  };

  // ---------- Merkliste ----------
  const cleanDirty = () => ({ daten: false, ink: [], blobs: [], full: false });
  B.newState = () => ({ rev: 0, saved: 0, seen: null, dirty: Object.assign(cleanDirty(), { full: true }) });
  B.isDirty = (state) => { const d = state.dirty; return !!(d.daten || d.full || d.ink.length || d.blobs.length); };
  // Schreibzugriff auf die Datenbank eintragen; true nur, wenn sich die Merkliste dadurch geändert hat
  B.touch = (state, store, keys) => {
    const d = state.dirty;
    let ch = false;
    const set = (k) => { if (!d[k]) { d[k] = true; ch = true; } };
    const add = (list, id) => { if (!list.includes(id)) { list.push(id); ch = true; } };
    if (store === 'items' || store === 'srs' || store === 'files') set('daten');
    else if (store === 'meta') { if (!keys || keys.some((k) => B.META_KEYS.includes(k))) set('daten'); }
    else if (store === 'ink') { if (!keys) set('full'); else keys.forEach((k) => add(d.ink, B.inkFileId(k))); }
    else if (store === 'blobs') { if (!keys) set('full'); else keys.forEach((k) => add(d.blobs, k)); }
    return ch;
  };

  // ---------- Inhalt ----------
  B.buildDaten = (snap) => ({
    app: B.APP, format: B.FORMAT,
    items: snap.items.map((i) => { const c = Object.assign({}, i); delete c._st; return c; }),
    srs: snap.srs, settings: snap.settings, packs: snap.packs || {},
    deletedPackItems: snap.deletedPackItems || [], deletedSeeds: snap.deletedSeeds || [], files: snap.files,
  });

  // Liegt im Ordner ein Stand eines anderen Geräts, den dieses Gerät weder geschrieben noch übernommen hat?
  B.foreign = (stand, state, deviceId) => {
    if (!stand || !stand.device || stand.device.id === deviceId) return false;
    const s = state.seen;
    return !(s && s.device === stand.device.id && s.rev === stand.rev);
  };

  B.errorKind = (e) => {
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'permission';
    if (n === 'NotFoundError') return 'gone';
    if (n === 'QuotaExceededError') return 'full';
    return 'other';
  };

  // ---------- Ordnerzugriff (kleine Helfer; „nicht vorhanden“ ist kein Fehler) ----------
  const missing = (e) => !!e && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError');
  const fail = (code, msg) => Object.assign(new Error(msg), { code });
  const subDir = (dir, name) => dir.getDirectoryHandle(name, { create: true });
  const fileOf = async (dir, name) => {
    try { return await (await dir.getFileHandle(name)).getFile(); } catch (e) { if (missing(e)) return null; throw e; }
  };
  const readText = async (dir, name) => { const f = await fileOf(dir, name); return f ? f.text() : null; };
  const writeFile = async (dir, name, data) => {
    const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
    try { await w.write(data); } catch (e) { try { if (w.abort) await w.abort(); } catch (e2) { /* egal */ } throw e; }
    await w.close();
  };
  const remove = async (dir, name) => { try { await dir.removeEntry(name); } catch (e) { if (!missing(e)) throw e; } };
  // Namen der Dateien (nicht der Unterordner) in einem Ordner
  const list = async (dir) => { const out = []; for await (const [n, h] of dir.entries()) if (h.kind === 'file') out.push(n); return out; };
  const isEmpty = async (dir) => { for await (const e of dir.entries()) { if (e) return false; } return true; };

  const checkHead = (o) => !!o && !Array.isArray(o) && typeof o === 'object' && o.app === B.APP && o.format === B.FORMAT;
  // stand.json lesen: null, wenn sie fehlt; BACKUP_CORRUPT, wenn sie unlesbar ist oder nicht zu dieser App/diesem Format gehört
  B.readStand = async (dir) => {
    const t = await readText(dir, 'stand.json');
    if (t === null) return null;
    let o = null;
    try { o = JSON.parse(t); } catch (e) { /* unten */ }
    if (!checkHead(o) || typeof o.rev !== 'number' || !o.device || !o.device.id) throw fail('BACKUP_CORRUPT', 'stand.json ist nicht lesbar');
    return o;
  };

  // Gewählten Ordner auflösen: leer oder schon eine Sicherung → direkt benutzen; liegt anderes darin → eigener Unterordner
  B.resolveDir = async (picked) => {
    const probe = async (dir) => {
      try { return { dir, stand: await B.readStand(dir) }; } catch (e) { if (e.code !== 'BACKUP_CORRUPT') throw e; return { dir, stand: null, corrupt: true }; }
    };
    if ((await fileOf(picked, 'stand.json')) || (await fileOf(picked, 'daten.json')) || await isEmpty(picked)) return probe(picked);
    return probe(await subDir(picked, B.SUBDIR));
  };

  const mergeDirty = (into, job) => {
    into.daten = into.daten || job.daten; into.full = into.full || job.full;
    job.ink.forEach((x) => { if (!into.ink.includes(x)) into.ink.push(x); });
    job.blobs.forEach((x) => { if (!into.blobs.includes(x)) into.blobs.push(x); });
  };

  // Ein Durchlauf: Gemerktes (oder bei full alles) in den Ordner schreiben. Reihenfolge: Anlagen, Stiftnotizen, daten.json, stand.json.
  // opts = { device: { id, name }, now, full?, force?, onProgress?(fertig, gesamt) }
  B.run = async (dir, src, state, opts) => {
    if (!B.isDirty(state) && !opts.full) return { status: 'clean' };
    let old = null;
    try { old = await B.readStand(dir); } catch (e) {
      if (e.code !== 'BACKUP_CORRUPT') throw e;
      if (!opts.force) return { status: 'corrupt' };
    }
    if (!opts.force && B.foreign(old, state, opts.device.id)) return { status: 'foreign', stand: old };
    // daten.json ohne stand.json (z. B. erst halb synchronisiert): nicht ungefragt überschreiben
    if (!opts.force && !old && await fileOf(dir, 'daten.json')) return { status: 'foreign', stand: null };

    // Merkliste entnehmen: was während des Durchlaufs dazukommt, landet in der neuen Liste
    const job = state.dirty;
    state.dirty = cleanDirty();
    try {
      const full = !!(job.full || opts.full);
      const snap = await src.snapshot();
      const byId = new Map(snap.files.map((f) => [f.id, f]));
      const dFiles = await subDir(dir, DIR_FILES), dInk = await subDir(dir, DIR_INK), dVer = await subDir(dir, DIR_VER);
      const ops = []; // Schreibvorgänge (für den Fortschritt gezählt)
      const failed = { ink: [], blobs: [] };
      // Lässt sich eine einzelne Datei nicht schreiben, bleibt nur sie gemerkt – Einträge und Lernstand werden trotzdem gesichert.
      // Fehlende Erlaubnis oder ein voller Datenträger betreffen dagegen alles und brechen den Durchlauf ab.
      const single = (list, id, fn) => async () => {
        try { await fn(); } catch (e) {
          const kind = B.errorKind(e);
          if (kind === 'permission' || kind === 'full') throw e;
          list.push(id);
        }
      };
      const blobOp = (f) => single(failed.blobs, f.id, async () => { const b = await src.blobOf(f.id); if (b) await writeFile(dFiles, B.fileName(f), b); });
      const inkOp = (id, pages) => single(failed.ink, id, () => writeFile(dInk, id + '.json', JSON.stringify({ fileId: id, pages })));

      if (full || job.blobs.length) {
        const have = await list(dFiles);
        const want = full ? snap.files : job.blobs.map((id) => byId.get(id)).filter(Boolean);
        const ids = full ? null : new Set(job.blobs);
        // weg mit allem, was unser Namensmuster trägt, aber zu keiner (so benannten) Datei mehr gehört
        for (const n of have) {
          const id = B.idOfName(n);
          if (id === null || (ids && !ids.has(id))) continue;
          const f = byId.get(id);
          if (!f || B.fileName(f) !== n) await remove(dFiles, n);
        }
        for (const f of want) if (!full || !have.includes(B.fileName(f))) ops.push(blobOp(f));
      }
      if (full) {
        const ids = await src.inkIds();
        for (const n of await list(dInk)) if (/\.json$/.test(n) && !ids.includes(n.slice(0, -5))) await remove(dInk, n);
        for (const id of ids) { const pages = await src.inkOf(id); if (pages.length) ops.push(inkOp(id, pages)); else await remove(dInk, id + '.json'); }
      } else {
        for (const id of job.ink) { const pages = await src.inkOf(id); if (pages.length) ops.push(inkOp(id, pages)); else await remove(dInk, id + '.json'); }
      }
      let done = 0;
      for (const op of ops) { await op(); done++; if (opts.onProgress) opts.onProgress(done, ops.length); }

      // Tagesstand: beim ersten Schreiben eines neuen Tages die bisherige daten.json aufheben
      const prev = await fileOf(dir, 'daten.json');
      if (prev) {
        const ms = old ? old.saved : prev.lastModified;
        if (opts.force && (!old || old.device.id !== opts.device.id)) {
          // ausdrücklich überschrieben wird der Stand eines anderen Geräts (oder ein unlesbarer): vorher aufheben
          await writeFile(dVer, B.preName(opts.now), await prev.text());
        } else if (B.dayName(ms) !== B.dayName(opts.now)) await writeFile(dVer, B.dayName(ms), await prev.text());
      }
      for (const n of B.prune(await list(dVer))) await remove(dVer, n);

      await writeFile(dir, 'daten.json', JSON.stringify(B.buildDaten(snap)));
      const stand = { app: B.APP, format: B.FORMAT, rev: Math.max(state.rev || 0, (old && old.rev) || 0) + 1, saved: opts.now, device: { id: opts.device.id, name: opts.device.name } };
      await writeFile(dir, 'stand.json', JSON.stringify(stand));
      state.rev = stand.rev; state.saved = stand.saved; state.seen = { device: stand.device.id, rev: stand.rev };
      mergeDirty(state.dirty, { daten: false, full: false, ink: failed.ink, blobs: failed.blobs });
      return { status: 'ok', stand, failed: failed.ink.length + failed.blobs.length };
    } catch (e) {
      mergeDirty(state.dirty, job);
      throw e;
    }
  };

  // ---------- Wiederherstellen ----------
  const parseDaten = (text) => {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { /* unten */ }
    const ids = (list, key) => Array.isArray(list) && list.every((x) => x && typeof x === 'object' && x[key] !== undefined && x[key] !== null && x[key] !== '');
    const ok = checkHead(o) && ids(o.items, 'id') && (o.srs === undefined || ids(o.srs, 'id')) && (o.files === undefined || ids(o.files, 'id'));
    if (!ok) throw fail('BACKUP_CORRUPT', 'Die Sicherung ist nicht lesbar');
    return o;
  };
  // Vorhandenen Unterordner holen, ohne ihn anzulegen (null, wenn es ihn nicht gibt)
  const subDirIf = async (dir, name) => { try { return await dir.getDirectoryHandle(name); } catch (e) { if (missing(e)) return null; throw e; } };

  // Sicherung lesen und prüfen: BACKUP_NONE ohne daten.json, BACKUP_CORRUPT bei unlesbarem Inhalt; fehlende stand.json ist kein Fehler
  B.readBackup = async (dir) => {
    const t = await readText(dir, 'daten.json');
    if (t === null) throw fail('BACKUP_NONE', 'In diesem Ordner liegt keine Sicherung');
    const daten = parseDaten(t);
    let stand = null;
    try { stand = await B.readStand(dir); } catch (e) { if (e.code !== 'BACKUP_CORRUPT') throw e; }
    return { stand, daten };
  };

  // Ganzen Stand aus dem Ordner holen. Die Senke wird erst berührt, wenn alles gelesen und geprüft ist.
  // opts = { now, local? } – local: bisheriger lokaler Stand (B.buildDaten), wird vorher in versionen/ abgelegt
  B.restore = async (dir, sink, state, opts) => {
    const { stand, daten } = await B.readBackup(dir);
    const dFiles = await subDirIf(dir, DIR_FILES), dInk = await subDirIf(dir, DIR_INK);
    const have = dFiles ? await list(dFiles) : [];
    const entries = [];
    let miss = 0;
    for (const f of daten.files || []) {
      const exact = B.fileName(f);
      const name = have.includes(exact) ? exact : have.find((n) => B.idOfName(n) === f.id);
      const blob = name ? await fileOf(dFiles, name) : null;
      // Versuche zu Buchaufgaben und Buchseiten haben nie eine eigene Datei (der Inhalt kommt aus dem Buchaufgaben-Paket) – nichts fehlt
      if (!blob && !f.exerciseId && !f.packFile) miss++;
      entries.push({ id: f.id, blob });
    }
    const inks = [];
    for (const n of dInk ? await list(dInk) : []) {
      if (!/\.json$/.test(n)) continue;
      try {
        const o = JSON.parse(await readText(dInk, n));
        if (o && o.fileId && Array.isArray(o.pages)) inks.push({ fileId: o.fileId, pages: o.pages });
      } catch (e) { /* halb synchronisierte Datei: wie fehlend */ }
    }
    if (opts.local) await writeFile(await subDir(dir, DIR_VER), B.preName(opts.now), JSON.stringify(opts.local));

    // ein einziger Schritt: entweder ist danach alles ersetzt oder nichts
    await sink.replaceAll(daten, entries, inks);
    state.rev = stand ? stand.rev : 0;
    state.saved = stand ? stand.saved : 0;
    state.seen = stand ? { device: stand.device.id, rev: stand.rev } : null;
    state.dirty = Object.assign(cleanDirty(), { full: !stand || miss > 0 });
    return { missing: miss, stand };
  };

  const label = (name) => {
    let m = name.match(RE_DAY);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    m = name.match(RE_PRE);
    return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]} (vor Wiederherstellung)` : null;
  };
  // Frühere Stände, jüngste zuerst (am selben Tag der Tagesstand vor den Vorher-Ständen)
  B.listVersions = async (dir) => {
    const d = await subDirIf(dir, DIR_VER);
    const names = d ? (await list(d)).filter((n) => label(n)) : [];
    const key = (n) => n.slice(6, 16) + (RE_DAY.test(n) ? '~' : n.slice(16));
    return names.sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0)).map((name) => ({ name, label: label(name) }));
  };

  // Früheren Stand zurückholen: nur Einträge, Lernstand, Einstellungen – Anlagen und Stiftnotizen bleiben, wie sie sind
  B.restoreVersion = async (dir, name, sink, state, opts) => {
    const d = label(name) ? await subDirIf(dir, DIR_VER) : null;
    const t = d ? await readText(d, name) : null;
    if (t === null) throw fail('BACKUP_NONE', 'Diesen Stand gibt es nicht');
    const daten = parseDaten(t);
    if (opts.local) await writeFile(d, B.preName(opts.now), JSON.stringify(opts.local));
    await sink.replaceData(daten, { files: false });
    state.dirty.daten = true; // der zurückgeholte Stand wird beim nächsten Durchlauf der aktuelle
  };
})(window.App);
