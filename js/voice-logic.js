/* Nihongo Techō – Sprachausgabe: welche japanische Stimme vorliest (reine Logik) */
'use strict';
(function (App) {
  // Die Wahl wird pro Gerät gemerkt (localStorage „ttsVoice“), nicht in den Einstellungen: Surface, Tablet und Handy haben verschiedene Stimmen.
  const V = App.voiceLogic = {};

  V.isJa = (v) => !!v && /^ja([-_]|$)/i.test(v.lang || '');

  // Je höher, desto natürlicher. Gleich gute behalten die Reihenfolge des Browsers.
  V.score = (v) => {
    const n = String(v.name || '');
    if (/natural/i.test(n)) return /nanami/i.test(n) ? 101 : 100;   // Edge: Nanami, Keita … (Online, Natural)
    if (/premium|enhanced|erweitert|optimiert/i.test(n)) return 80;  // iPad/Mac: verbesserte Kyoko, Otoya …
    if (/google/i.test(n)) return 70;                                 // Chrome: „Google 日本語“
    if (/online/i.test(n)) return 65;
    if (/kyoko|otoya|o-ren|hattori/i.test(n)) return 60;
    if (/desktop/i.test(n)) return 5;                                 // alte Windows-Stimmen (Haruka, Ayumi, Ichiro)
    return 10;
  };

  // Japanische Stimmen, die beste zuerst
  V.rank = (voices) => (voices || []).filter(V.isJa)
    .map((v, i) => ({ v, i, s: V.score(v) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v);

  // Gemerkte Stimme (voiceURI), wenn es sie auf diesem Gerät noch gibt – sonst die beste
  V.pick = (voices, saved) => {
    const ja = V.rank(voices);
    return (saved && ja.find((v) => v.voiceURI === saved)) || ja[0] || null;
  };

  V.label = (v) => String(v.name || v.voiceURI || '').replace(/\s*-\s*Japanese \(Japan\)\s*$/i, '') + (v.localService === false ? ' · online' : '');
})(window.App = window.App || {});
