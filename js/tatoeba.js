/* Nihongo Techō – Beispielsätze von Tatoeba vorschlagen: Anfrage bauen, Antwort ins App-Format bringen. Browser: App.tatoeba, Node: module.exports */
'use strict';
(function (root) {
  const API = 'https://api.tatoeba.org/v1/sentences';
  const MAX_LEN = 30;   // wie im JLPT-Paket: nur kurze Sätze
  const PAGE = 30;
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKanjiRun = new RegExp('^[' + KANJI + ']+$');
  const reHasKanji = new RegExp('[' + KANJI + ']');
  const toHira = (s) => String(s ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  // Kürzeste Sätze zuerst, nur solche mit Übersetzung in der gewünschten Sprache (deu / eng)
  const searchUrl = (word, lang) => API + '?' + new URLSearchParams({
    lang: 'jpn', q: word, 'trans:lang': lang, showtrans: 'matching', sort: 'words', include: 'transcriptions', limit: String(PAGE),
  });

  // Tatoeba "[漢字|かん|じ]" → "漢字[かんじ]"; Basis mit Nicht-Kanji ("[100|ひゃく]") → "{100}[ひゃく]"; leere Lesung → nur die Basis
  const reTr = /\[([^\]|]+)\|([^\]]*)\]/g;
  const toNotation = (s) => String(s ?? '').replace(reTr, (m, base, reading) => {
    const r = reading.split('|').join('');
    if (!r) return base;
    return reKanjiRun.test(base) ? `${base}[${r}]` : `{${base}}[${r}]`;
  });
  const toKana = (s) => String(s ?? '').replace(reTr, (m, base, reading) => reading.split('|').join('') || base);

  // Steht das Wort wirklich im Satz? Die Suche liefert auch Ähnliches (高い → 最高, 高校生).
  // Wörter mit Okurigana (高い, 行く, 食べる) gelten auch gebeugt: Stamm + mögliche Endung (高かった, 行きます),
  // nicht Stamm + etwas anderes (食べ物, 最高だ).
  const ENDINGS = {
    い: 'いくかけさ', う: 'うわいえおっ', く: 'くかきけこいっ', ぐ: 'ぐがぎげごい', す: 'すさしせそ', つ: 'つたちてとっ',
    ぬ: 'ぬなにねのん', ぶ: 'ぶばびべぼん', む: 'むまみめもん', る: 'るらりれろっまてたなよずちせさ',
  };
  const contains = (word, text, kana) => {
    if (!word) return false;
    if (text.includes(word)) return true;
    if (!reHasKanji.test(word)) return toHira(text).includes(toHira(word)) || (!!kana && toHira(kana).includes(toHira(word)));
    if (/.する$/.test(word)) return text.includes(word.slice(0, -2)); // 勉強する → 勉強します, 勉強を…
    const ends = ENDINGS[word.slice(-1)];
    if (!ends) return false;
    const stem = word.slice(0, -1);
    for (let i = text.indexOf(stem); i >= 0; i = text.indexOf(stem, i + 1)) {
      const nx = text[i + stem.length];
      if (nx && ends.includes(nx)) return true;
    }
    return false;
  };

  // Satz der Schnittstelle → { id, jp, kana, furi, de | en, src }; null ohne Übersetzung in der Sprache
  const toExample = (s, lang) => {
    const tr = (s.translations || []).flat().find((t) => t && t.lang === lang && t.text);
    if (!tr) return null;
    const hrkt = (s.transcriptions || []).find((t) => t.script === 'Hrkt' && !t.needsReview && t.text);
    const ex = { id: s.id, jp: s.text, kana: hrkt ? toKana(hrkt.text) : '', furi: hrkt ? toNotation(hrkt.text) : s.text };
    ex[lang === 'deu' ? 'de' : 'en'] = tr.text;
    ex.src = 'Tatoeba #' + s.id;
    return ex;
  };

  // Aus einer Antwortseite die brauchbaren Sätze; seen (IDs) wird fortgeschrieben
  const pick = (data, word, lang, seen) => {
    const out = [];
    for (const s of data || []) {
      if (!s || !s.text || seen.has(s.id) || s.text.length > MAX_LEN) continue;
      const ex = toExample(s, lang);
      if (!ex || !contains(word, s.text, ex.kana)) continue;
      seen.add(s.id);
      out.push(ex);
    }
    return out;
  };

  // Suche mit Nachladen: more(n) liefert die nächsten n Vorschläge (weniger, wenn es keine mehr gibt).
  // Deutsch zuerst; findet sich gar nichts, einmalig Englisch.
  const search = (word, fetchFn) => {
    const seen = new Set();
    let lang = 'deu', next = searchUrl(word, lang), pool = [], given = 0;
    const page = async () => {
      const r = await fetchFn(next, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('Tatoeba antwortet nicht (' + r.status + ')');
      const j = await r.json();
      next = (j.paging && j.paging.next) || '';
      pool.push(...pick(j.data, word, lang, seen));
    };
    const more = async (n) => {
      for (let tries = 0; pool.length < n && tries < 4; tries++) {
        if (next) { await page(); continue; }
        if (lang === 'deu' && !given && !pool.length) { lang = 'eng'; next = searchUrl(word, lang); continue; }
        break;
      }
      const out = pool.splice(0, n);
      given += out.length;
      return { list: out, lang, done: !pool.length && !next };
    };
    return { more };
  };

  const api = { MAX_LEN, searchUrl, toNotation, toKana, contains, toExample, pick, search };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.tatoeba = api;
})(typeof window !== 'undefined' ? window : globalThis);
