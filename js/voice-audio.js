/* Nihongo Techō – vertonte Tondateien abspielen (VOICEVOX): Prüfungsdialoge und Genki-Beispielsätze.
   Dateien werden ganz geladen und als Blob abgespielt – so kommen sie aus dem Offline-Speicher (Service Worker „nt-audio“),
   ohne Teil-Anfragen. Verschlüsselte Dateien (Web-Version, Genki) = 12 Byte iv + AES-GCM, Schlüssel aus der Genki-Freischaltung.
   Im Tablet-ZIP (file://) wird die Datei direkt abgespielt. Klappt etwas nicht, ruft play() onFail (→ Browser-Stimme). */
'use strict';
(function (App) {
  const V = App.voiceAudio = {};
  const isFile = () => location.protocol === 'file:';
  let playing = null;
  const blobs = new Map(), ready = new Map();

  const decrypt = async (buf) => {
    const key = App.genki && App.genki.key ? await App.genki.key() : null;
    if (!key) return null;
    const bytes = new Uint8Array(buf);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
  };
  // → Promise<blob:-URL oder null>; enc = Datei ist verschlüsselt
  const blobOf = (url, enc) => {
    if (!blobs.has(url)) {
      blobs.set(url, fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((buf) => (buf && enc ? decrypt(buf) : buf))
        .then((buf) => (buf ? URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' })) : null))
        .catch(() => null)
        .then((u) => { if (u) ready.set(url, u); else blobs.delete(url); return u; }));
    }
    return blobs.get(url);
  };

  V.stop = () => {
    if (playing) { playing.pause(); playing = null; }
  };
  V.isPlaying = () => !!playing && !playing.paused;
  V.preload = (url, enc) => { if (url && !isFile()) blobOf(url, enc); };
  // Vorgeladenes startet sofort (iPad-Safari lässt Ton nur direkt nach dem Tippen zu), sonst nach dem Laden
  // rate: Tempo (0.7 = langsamer, gleiche Tonhöhe) · onEnd: nach dem letzten Ton (Mitsprechen: nächste Runde)
  V.play = (url, { enc = false, onFail = () => {}, rate = 1, onEnd } = {}) => {
    V.stop();
    if (window.speechSynthesis) speechSynthesis.cancel();
    const a = new Audio();
    playing = a;
    let failed = false;
    const fail = () => { if (playing === a && !failed) { failed = true; playing = null; onFail(); } };
    a.onerror = fail;
    a.onended = () => { if (playing === a) playing = null; if (onEnd) onEnd(); };
    const start = (src) => {
      if (playing !== a) return;
      if (!src) return fail();
      a.src = src;
      a.playbackRate = rate;
      a.play().catch((e) => { if (!e || e.name !== 'NotAllowedError') fail(); });
    };
    if (isFile()) start(url);
    else if (ready.has(url)) start(ready.get(url));
    else blobOf(url, enc).then(start);
  };
  window.addEventListener('hashchange', () => V.stop());
})(window.App);
