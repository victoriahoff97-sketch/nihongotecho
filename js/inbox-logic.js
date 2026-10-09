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

  // Nur NHK bekommt automatisch eine Quelle (Regel wie extension/selection-logic.js); kaputte Adresse → ''
  const quelleFor = (ref) => {
    try {
      const u = new URL(str(ref).trim());
      return /^https?:$/.test(u.protocol) && /(^|\.)nhk\.or\.jp$|(^|\.)web\.nhk$/i.test(u.hostname) ? 'NHK Easy' : '';
    } catch (e) { return ''; }
  };

  // Eingefügter Text vor der Übernahme prüfen: 'leer' | 'kein-jp' | 'ok' (nicht Japanisches kommt nie in die Adresse)
  const checkPaste = (text) => {
    const t = str(text).trim();
    return !t ? 'leer' : isJp(t) ? 'ok' : 'kein-jp';
  };

  // Suchteil einer Adresse → Objekt (ohne URLSearchParams, damit die Tests ohne Browser-Globals laufen)
  const queryOf = (search) => {
    const dec = (t) => { try { return decodeURIComponent(t.replace(/\+/g, ' ')); } catch (e) { return t; } };
    const out = {};
    for (const part of str(search).replace(/^\?/, '').split('&')) {
      if (!part) continue;
      const i = part.indexOf('=');
      out[dec(i < 0 ? part : part.slice(0, i))] = i < 0 ? '' : dec(part.slice(i + 1));
    }
    return out;
  };

  // Teilen-Menü (Web Share Target, GET): titel/text/url aus dem Suchteil; null, wenn nichts geteilt wurde
  const fromShare = (search) => {
    const q = queryOf(search);
    if (!['titel', 'text', 'url'].some((k) => Object.prototype.hasOwnProperty.call(q, k))) return null;
    let text = str(q.text).trim();
    let ref = str(q.url).trim();
    if (!ref) {
      const found = text.match(/https?:\/\/\S+/g);
      if (found) {
        ref = found[found.length - 1];
        const at = text.lastIndexOf(ref);
        text = (text.slice(0, at) + text.slice(at + ref.length)).trim();
      }
    }
    if (!text) text = str(q.titel).trim();
    return { text, ref };
  };

  // Wie parse, aber ohne Ziel: Auswahlseite „Text übernehmen“
  const parseOpen = (query) => {
    const q = query || {};
    const raw = str(q.text).trim();
    const ref = str(q.ref).trim();
    return {
      ok: isJp(raw),
      text: raw.slice(0, LIMIT),
      ref: /^https?:\/\//i.test(ref) ? ref.slice(0, 2000) : '',
      quelle: quelleFor(ref),
      gekuerzt: raw.length > LIMIT,
    };
  };

  // Sieht der Text nach einem einzelnen Wort aus (→ Knopf „Vokabel speichern“)?
  const wordLike = (text) => { const t = str(text).trim(); return t.length > 0 && t.length <= 20 && !/[\r\n。！？!?]/.test(t); };

  App.inboxLogic = { LIMIT, parse, sentences, vocabDefaults, findExisting, extSource, quelleFor, checkPaste, fromShare, parseOpen, wordLike };
})(window.App);
