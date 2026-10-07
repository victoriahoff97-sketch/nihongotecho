/* Nihongo Techō – Genki-Freischaltung: Code → Schlüssel (PBKDF2), Seed-Daten entschlüsseln (AES-GCM + gzip), Zustandslogik */
'use strict';
(function (App) {
  // Format (identisch zu tools/build/lib/genki.mjs): window.GENKI_ENC = { v, iter, salt, iv, data }, alle drei Base64.
  // Klartext = gzip(JSON von { items, merged }). Reine Logik: kein DOM, kein IndexedDB.
  const G = App.genkiLogic = {};

  // Großbuchstaben, alles außer A–Z und 0–9 fliegt raus (wie auf der Build-Seite)
  G.normalizeCode = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Ohne SubtleCrypto oder DecompressionStream lässt sich nichts entschlüsseln (z. B. alte Browser, unsicherer Kontext)
  G.supported = (g = globalThis) => !!(g && g.crypto && g.crypto.subtle && g.DecompressionStream);

  const codeError = (msg) => Object.assign(new Error(msg), { code: 'GENKI_CODE' });

  const fromB64 = (s) => {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  // Schlüssel aus Code + Salt/Iterationen der Datei; nicht exportierbar, nur zum Entschlüsseln
  G.deriveKey = async (code, enc) => {
    const norm = G.normalizeCode(code);
    if (!norm) throw codeError('Code fehlt');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(enc.salt), iterations: enc.iter },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
    );
  };

  // → { items, merged }; falscher Code = GCM-Tag passt nicht → GENKI_CODE
  G.decrypt = async (enc, key) => {
    let packed;
    try {
      packed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(enc.iv) }, key, fromB64(enc.data));
    } catch (e) {
      throw codeError('Code stimmt nicht');
    }
    const text = await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    const out = JSON.parse(text);
    return { items: out.items || [], merged: out.merged || {} };
  };

  // none: keine verschlüsselten Daten (Dev-Build) · locked: noch nie freigeschaltet
  // stale: gespeicherter Schlüssel gehört zu altem Salt (neuer Code nötig) · open: freigeschaltet
  G.stateOf = (enc, stored) => {
    if (!enc) return 'none';
    if (!stored) return 'locked';
    return stored.salt !== enc.salt ? 'stale' : 'open';
  };
})(window.App);
