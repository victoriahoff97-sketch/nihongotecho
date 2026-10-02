/* Nihongo Techō – Satz-Scan: findet in einem Satz Woerter, die noch nicht als Vokabel abgedeckt sind */
'use strict';
(function (App) {
  // Unicode-Bereiche fuer Kanji sowie Hiragana/Katakana (inkl. Verlaengerungsstrich ー)
  const KANJI_RANGE = '㐀-鿿豈-﫿々〆ヵヶ';
  const KANA_RANGE = '぀-ヿー';
  const reJpChar = new RegExp('[' + KANJI_RANGE + KANA_RANGE + ']');
  const reHiraganaChar = /^[ぁ-んー]$/;

  // Formen, die trotz Woerterbucheintrag nie als eigenstaendiger Treffer zaehlen sollen
  const STOP = ['です', 'でした', 'ます', 'ました', 'だ', 'だった', 'ではありません', 'じゃない', 'でしょう', 'という', 'の', 'こと'];
  const FUNC_POS = new Set(['prt', 'aux', 'aux-v', 'cop']);
  const MAX_LEN = 12;
  // auch fürs Nachschlagen (lookup-logic.surfaceEntries)
  App.posMatches = (tags, type) => posMatches(tags, type);

  // Prueft, ob die Wortarten-Tags eines Eintrags zum Kandidaten-Typ aus App.deinflect passen
  function posMatches(tags, type) {
    if (type === 'any') return true;
    if (type === 'v1') return tags.includes('v1');
    if (type === 'v5') return tags.some((t) => t.startsWith('v5'));
    if (type === 'vs') return tags.some((t) => t === 'vs' || t === 'vs-i' || t === 'vs-s');
    if (type === 'vk') return tags.includes('vk');
    if (type === 'adj-i') return tags.some((t) => t === 'adj-i' || t === 'adj-ix');
    return false;
  }

  // Eintraege, die ausschliesslich aus Partikeln/Hilfsverben/Kopula bestehen, sind keine "Vokabel"
  const isFuncOnly = (tags) => Array.isArray(tags) && tags.length > 0 && tags.every((t) => FUNC_POS.has(t));

  // Kompositum aus Kanji/Katakana (ohne Hiragana): darf kuerzere eigene Vokabeln einschliessen (東 in 東京)
  const reCompound = new RegExp('^[' + KANJI_RANGE + '゠-ヿー]+$');

  // Sucht von links nach rechts Woerter, die noch nicht abgedeckt sind; ein Lookup pro Startposition.
  // isKnown(entry) (optional): Eintraege, die es schon als Vokabel gibt. Ist ein bekannter Eintrag fuer eine Stelle
  // bestbewertet (bei Gleichstand gewinnt der bekannte), gilt die Stelle als bekannt; sonst wird der beste
  // unbekannte Eintrag vorgeschlagen (ein Vorschlag pro Stelle).
  // own (optional): die eigenen Vokabel-Treffer [{start, end}]. Dann darf ein ungebeugtes Kompositum eine Stelle
  // abdecken, in der kuerzere eigene Treffer komplett stecken (東京 statt 東 + 京); der Treffer nennt sie in
  // over (Indizes in own). Ohne own gelten abgedeckte Stellen (covered) wie bisher als erledigt.
  App.scanUnknown = async (sentence, covered, lookup, isKnown, own) => {
    const s = String(sentence || '');
    const cov = covered || [];
    const spans = own || null;
    const results = [];
    const usedIds = new Set();
    let i = 0;

    // Eigene Treffer, die [a, b) beruehren, mit ihrem Index in own
    const ownIn = (a, b) => (spans ? spans.map((m, k) => ({ m, k })).filter(({ m }) => m.start < b && m.end > a) : []);

    while (i < s.length) {
      if (!reJpChar.test(s[i])) { i++; continue; }
      // Abgedeckt: nur am Anfang eines eigenen Treffers (und nicht mitten in einem anderen) weitersuchen
      if (cov[i] && (!spans || !spans.some((m) => m.start === i) || spans.some((m) => m.start < i && m.end > i))) { i++; continue; }

      // Reichweite: bis zur naechsten nicht-japanischen Stelle (ohne own auch bis zur naechsten abgedeckten), max. MAX_LEN
      let maxLen = 0;
      while (maxLen < MAX_LEN && i + maxLen < s.length && reJpChar.test(s[i + maxLen]) && (spans || !cov[i + maxLen])) maxLen++;

      // Alle Deinflektions-Kandidaten je Laenge sammeln, alle Formen fuer EINEN Lookup-Aufruf buendeln
      const byLen = [];
      const forms = new Set();
      for (let len = 1; len <= maxLen; len++) {
        const surface = s.slice(i, i + len);
        const cands = App.deinflect(surface);
        byLen[len] = { surface, cands };
        cands.forEach((c) => forms.add(c.base));
      }

      const lookupMap = (await lookup(Array.from(forms))) || new Map();

      // Laengsten Treffer suchen, der zum Kandidaten-Typ passt und nicht verworfen wird
      let hit = null;
      for (let len = maxLen; len >= 1 && !hit; len--) {
        const { surface, cands } = byLen[len];
        if (STOP.includes(surface)) continue;
        if (len === 1 && reHiraganaChar.test(surface)) continue;

        // Beruehrt die Stelle eigene Treffer, zaehlt nur ein ungebeugtes Kompositum, das sie komplett und laenger umfasst
        const inner = ownIn(i, i + len);
        if (inner.length && !(reCompound.test(surface) && inner.every(({ m }) => m.start >= i && m.end <= i + len && m.end - m.start < len))) continue;

        let best = null, bestNew = null;
        for (const cand of cands) {
          if (inner.length && cand.base !== surface) continue;
          const entries = lookupMap.get(cand.base) || [];
          for (const entry of entries) {
            if (usedIds.has(entry.id)) continue;
            if (isFuncOnly(entry.p)) continue;
            if (!posMatches(entry.p, cand.type)) continue;
            const kanjiMatch = Array.isArray(entry.k) && entry.k.includes(surface);
            const rank = (entry.c === 1 ? 2 : 0) + (kanjiMatch ? 1 : 0);
            const known = !!(isKnown && isKnown(entry));
            if (!best || rank > best.rank || (rank === best.rank && known && !best.known)) best = { cand, entry, rank, known };
            if (!known && (!bestNew || rank > bestNew.rank)) bestNew = { cand, entry, rank };
          }
        }
        if (best && best.known) hit = { len, known: true };
        else if (bestNew) hit = { len, surface, base: bestNew.cand.base, entry: bestNew.entry, over: inner.map(({ k }) => k) };
      }

      if (hit && hit.known) {
        i += hit.len; // Stelle ist schon eine eigene Vokabel
      } else if (hit) {
        const r = { start: i, end: i + hit.len, surface: hit.surface, base: hit.base, entry: hit.entry };
        if (hit.over.length) r.over = hit.over;
        results.push(r);
        usedIds.add(hit.entry.id);
        i += hit.len;
      } else if (cov[i]) {
        i = Math.max(i + 1, ...spans.filter((m) => m.start === i).map((m) => m.end)); // eigenen Treffer ueberspringen
      } else {
        i++;
      }
    }

    return results;
  };

  // ---------- Reine Helfer fuer die Satzerkennung und die Suche ----------

  // covered[i] = true fuer jede Stelle, die in einem Treffer der eigenen Vokabeln liegt (an, aus oder verschachtelt)
  App.coveredFromMatches = (length, matches) => {
    const cov = new Array(Math.max(0, length || 0)).fill(false);
    (matches || []).forEach((m) => { for (let i = Math.max(0, m.start); i < Math.min(cov.length, m.end); i++) cov[i] = true; });
    return cov;
  };

  // Maximale, nicht abgedeckte japanische Stellen (einzelne Hiragana wie で/が zaehlen nicht)
  App.uncoveredSpans = (sentence, covered) => {
    const s = String(sentence || '');
    const cov = covered || [];
    const out = [];
    let i = 0;
    while (i < s.length) {
      if (cov[i] || !reJpChar.test(s[i])) { i++; continue; }
      let j = i;
      while (j < s.length && !cov[j] && reJpChar.test(s[j])) j++;
      const text = s.slice(i, j);
      if (!(text.length === 1 && reHiraganaChar.test(text))) out.push({ start: i, end: j, text });
      i = j;
    }
    return out;
  };

  App.jishoUrl = (word) => 'https://jisho.org/search/' + encodeURIComponent(word || '');

  // Alle Vokabel-Schluessel (App.vocabKey), unter denen ein Woerterbucheintrag schon als Vokabel existieren koennte
  App.dictEntryKeys = (entry) => {
    // Nur-Kana-Schluessel nur fuer Eintraege ohne Kanji (sonst wuerde die Kana-Vokabel きる auch 切る verdecken)
    const ks = entry.k && entry.k.length ? entry.k : [''];
    const rs = entry.r && entry.r.length ? entry.r : [''];
    const keys = new Set();
    ks.forEach((kanji) => rs.forEach((kana) => { if (kanji || kana) keys.add(App.vocabKey({ kanji, kana })); }));
    return Array.from(keys);
  };

  // Liefert isKnown(entry) fuer scanUnknown: Eintrag entspricht einer vorhandenen Vokabel (vocabKey)
  App.entryKnownFn = (items) => {
    const keys = new Set((items || []).map(App.vocabKey));
    return (entry) => App.dictEntryKeys(entry).some((k) => keys.has(k));
  };

  // Erste Bedeutungsgruppe: bis zum ersten „;“ ausserhalb von Klammern
  App.firstGloss = (s) => {
    const str = String(s || '');
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '(' || c === '（') depth++;
      else if ((c === ')' || c === '）') && depth > 0) depth--;
      else if (c === ';' && depth === 0) return str.slice(0, i).trim();
    }
    return str.trim();
  };

  // Vorbelegung fuer den Vokabel-Editor aus einem Woerterbucheintrag; forms = gefundene Formen (Oberflaeche, Grundform)
  App.dictVocabDefaults = (entry, forms) => {
    const fs = (forms || []).filter(Boolean);
    const k = entry.k || [], r = entry.r || [];
    const kanji = k.find((x) => fs.includes(x)) || k[0] || '';
    const kana = r.find((x) => fs.includes(x)) || r[0] || '';
    const mp = App.mapPos(entry.p || [], kanji || kana);
    const d = { kanji, kana, de: App.firstGloss(entry.de), en: entry.en || '', pos: mp.pos };
    if (mp.cls) d.v = { cls: mp.cls };
    d.level = App.jlptOf({ type: 'vocab', kanji, kana });
    return d;
  };
})(window.App);
