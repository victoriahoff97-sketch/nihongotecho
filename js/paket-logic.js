/* Nihongo Techō – Paket oder Backup öffnen: Art erkennen und ZIP-Verzeichnis lesen. Nur Logik, kein DOM. */
'use strict';
(function (App) {
  const fail = (code) => Object.assign(new Error(code), { code });

  // Art der Datei am Anfang erkennen (nicht an der Endung)
  const kind = (head) => {
    const b = head || new Uint8Array(0);
    const is = (s) => b.length >= s.length && Array.from(s).every((c, i) => b[i] === c.charCodeAt(0));
    if (is('NTPK1')) return 'ntpaket';
    if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4) return 'zip';
    let i = b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 3 : 0;
    while (i < b.length && (b[i] === 0x20 || b[i] === 0x09 || b[i] === 0x0a || b[i] === 0x0d)) i++;
    return b[i] === 0x7b ? 'json' : 'unknown';
  };

  // Zentralverzeichnis lesen; dataStart kommt aus dem lokalen Header
  const zipEntries = (bytes) => {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = (p) => dv.getUint16(p, true), u32 = (p) => dv.getUint32(p, true);
    let eocd = -1;
    for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 22 - 65535); p--) {
      if (u32(p) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) throw fail('PAKET_ZIP');
    const count = u16(eocd + 10), cdSize = u32(eocd + 12), cdOff = u32(eocd + 16);
    if (count === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) throw fail('PAKET_ZIP');
    if (cdOff + cdSize > eocd) throw fail('PAKET_ZIP');
    const out = [];
    let p = cdOff;
    for (let i = 0; i < count; i++) {
      if (p + 46 > bytes.length || u32(p) !== 0x02014b50) throw fail('PAKET_ZIP');
      const flags = u16(p + 8), method = u16(p + 10), compSize = u32(p + 20), size = u32(p + 24);
      const nl = u16(p + 28), el = u16(p + 30), cl = u16(p + 32), lho = u32(p + 42);
      if ((flags & 1) || compSize === 0xffffffff || size === 0xffffffff || lho === 0xffffffff) throw fail('PAKET_ZIP');
      if (p + 46 + nl > bytes.length) throw fail('PAKET_ZIP');
      const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nl));
      if (lho + 30 > bytes.length || u32(lho) !== 0x04034b50) throw fail('PAKET_ZIP');
      const dataStart = lho + 30 + u16(lho + 26) + u16(lho + 28);
      if (dataStart + compSize > bytes.length) throw fail('PAKET_ZIP');
      out.push({ name, method, compSize, size, dataStart });
      p += 46 + nl + el + cl;
    }
    return out;
  };

  // Genau eine Datei .json oder .ntpaket muss übrig bleiben
  const pick = (entries) => {
    const hits = entries.filter((e) => {
      if (e.name.endsWith('/') || /^__MACOSX\//i.test(e.name)) return false;
      const base = e.name.split('/').pop();
      return !base.startsWith('.') && /\.(json|ntpaket)$/i.test(base);
    });
    if (hits.length !== 1) throw fail('PAKET_INHALT');
    if (hits[0].method !== 0 && hits[0].method !== 8) throw fail('PAKET_ZIP');
    return hits[0];
  };

  // Grobe Form einer Backup-/Paket-Datei (Export: items, optional files, settings.sources) – vor dem ersten Schreiben prüfen
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const backupShape = (data) => {
    if (!isObj(data)) return false;
    if (!Array.isArray(data.items) || !data.items.every((it) => isObj(it) && typeof it.id === 'string' && typeof it.type === 'string')) return false;
    if (data.files !== undefined && (!Array.isArray(data.files) || !data.files.every((f) => isObj(f) && isObj(f.meta) && f.meta.id !== undefined && f.meta.id !== null))) return false;
    if (data.settings !== undefined && data.settings !== null && isObj(data.settings) && data.settings.sources !== undefined && !Array.isArray(data.settings.sources)) return false;
    return true;
  };

  App.paketLogic = { kind, zipEntries, pick, backupShape };
})(window.App);
