/* Nihongo Techō – Eingang: von außen übergebener Text (z. B. Markierung aus NHK Easy). Nur Logik, kein DOM. */
'use strict';
(function (App) {
  const JP = App.jp;
  const LIMIT = 20000;
  const isJp = (s) => /[぀-ヿ㐀-鿿豈-﫿々]/.test(s || '');
  const str = (v) => (typeof v === 'string' ? v : '');

  // Parameter aus der Adresse prüfen; alles sind Nutzereingaben
  const parse = (query) => {
    const q = query || {};
    const ziel = q.ziel === 'saetze' || q.ziel === 'vokabel' ? q.ziel : '';
    const raw = str(q.text).trim();
    if (!ziel || !isJp(raw)) return { ok: false };
    const rawSatz = ziel === 'vokabel' ? str(q.satz).trim() : '';
    const ref = str(q.ref).trim();
    return {
      ok: true, ziel,
      text: raw.slice(0, LIMIT),
      satz: rawSatz.slice(0, LIMIT),
      quelle: str(q.quelle).trim().slice(0, 60),
      ref: /^https?:\/\//i.test(ref) ? ref.slice(0, 2000) : '',   // nie javascript:, file: o. Ä. als Fundstelle
      gekuerzt: raw.length > LIMIT || rawSatz.length > LIMIT,
    };
  };

  // Text in Furigana-Schreibweise → Sätze mit getrennter Lesung
  const sentences = (notated) => {
    const out = [];
    for (const line of str(notated).split(/\r?\n/)) {
      for (const part of line.match(/[^。！？!?]+[。！？!?]*[」』）)]*/g) || []) {
        const s = part.trim();
        if (!isJp(s)) continue;
        // Lesung nur, wenn sie vollständig ist (kein Kanji ohne Furigana übrig)
        const kana = JP.hasNotation(s) ? JP.kana(s) : '';
        out.push({ jp: JP.plain(s), kana: JP.hasKanji(kana) ? '' : kana });
      }
    }
    return out;
  };

  // Vorbelegung für das Vokabel-Formular
  const vocabDefaults = (p) => {
    const word = JP.plain(p.text), kana = JP.kana(p.text);
    const hasKanji = JP.hasKanji(word);
    return {
      kanji: hasKanji ? word : '',
      kana: hasKanji ? (JP.hasKanji(kana) ? '' : kana) : word,
      examples: p.satz ? [{ jp: p.satz, src: [p.quelle, p.ref].filter(Boolean).join(' – ') }] : [],
      source: p.quelle || '',
      sourceRef: p.ref || '',
    };
  };

  const findExisting = (items, word) => {
    if (!word) return null;
    for (const it of items) if (it.type === 'vocab' && (it.kanji === word || it.kana === word)) return it;
    return null;
  };

  // Woher bekommt man die Browser-Erweiterung? Die Web-Version liefert sie als ZIP mit, lokal liegt der Ordner neben der App.
  const extSource = (protocol) => (protocol === 'https:' ? 'download' : 'folder');

  App.inboxLogic = { LIMIT, parse, sentences, vocabDefaults, findExisting, extSource };
})(window.App);
