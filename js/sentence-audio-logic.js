/* Nihongo Techō – vertonte Beispielsätze: Satz → Schlüssel → Tondatei (reine Logik, ohne DOM).
   Wird gleich verwendet von der App (JP.speak) und von tools/build/build-sentence-audio.mjs.
   Die Liste js/sentence-audio.js enthält nur Prüfsummen der Sätze, nie den Text – so verrät sie keine Genki-Inhalte. */
'use strict';
(function (App) {
  const S = App.sentenceAudioLogic = {};
  const KANJI = '\\u3005\\u3006\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u30f5\\u30f6';
  const BRACE = /\{([^}]+)\}\[([^\]]+)\]/g;           // {５０}[ごじゅう]
  const RUN = new RegExp(`([${KANJI}]+)\\[([^\\]]+)\\]`, 'g'); // 学生[がくせい]
  // Zeichen, die für das Vorlesen nichts ändern: Leerzeichen, Satzzeichen, Klammern
  const NOISE = /[\s　「」『』（）()、。，．,.・！？!?…‥〜～：:;；"'“”„]/g;

  // Schreibung ohne Lesungen: 私[わたし]は → 私は
  S.plain = (s) => String(s ?? '').replace(BRACE, '$1').replace(RUN, '$1').replace(/\[[^\]]*\]/g, '').replace(NOISE, '');
  // nur Lesung: 私[わたし]は → わたしは (für Aufrufe, die schon Kana übergeben)
  S.kana = (s) => String(s ?? '').replace(BRACE, '$2').replace(RUN, '$2').replace(NOISE, '');

  // FNV-1a (32 bit) → 8 Hex-Zeichen
  S.hash = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  };
  // Schlüssel eines Satzes: einmal nach Schreibung, einmal nach Lesung (so passt auch ein Aufruf mit reinen Kana)
  S.keys = (s) => {
    const p = S.plain(s), k = S.kana(s);
    return [...new Set([p, k].filter(Boolean).map((x) => S.hash(x)))];
  };
  // Datei-ID zu einem Text (oder null); map = window.SENTENCE_AUDIO
  S.lookup = (map, text) => {
    if (!map || !text) return null;
    const p = S.plain(text);
    if (!p) return null;
    return map[S.hash(p)] || map[S.hash(S.kana(text))] || null;
  };
  S.url = (id) => `audio/saetze/${id}.mp3`;
})(window.App);
