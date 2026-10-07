/* Nihongo Techō – Pitch Accent (Tonhöhenakzent): Moren, Hoch/Tief-Muster, Nachschlagen, Kurve */
'use strict';
(function (App) {
  const SMALL = 'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ';

  // Zerlegt eine Lesung in Moren: kleine Kana hängen an der vorherigen, っ ん ー zählen einzeln
  App.morae = (kana) => {
    const out = [];
    for (const c of String(kana ?? '').replace(/[\s〜～~・]/g, '')) {
      if (SMALL.includes(c) && out.length) out[out.length - 1] += c;
      else out.push(c);
    }
    return out;
  };

  // Hoch (true) / tief (false) je More, letzter Wert = angehängte Partikel.
  // accent: 0 = kein Abfall (heiban), n = Abfall nach der n-ten More
  App.pitchPattern = (count, accent) => {
    const out = [];
    for (let i = 0; i <= count; i++) out.push(accent === 0 ? i > 0 : accent === 1 ? i === 0 : i > 0 && i < accent);
    return out;
  };

  // Wortart der App -> Kürzel in den Akzentdaten
  const POS_TAG = { noun: '名', time: '名', adverb: '副', 'na-adj': '形動', pronoun: '代', question: '代' };

  // Liest einen Rohwert wie "0,2" oder "(副)0,(名)3,4" -> { main, alt } (null, wenn leer).
  // Gibt es Gruppen je Wortart, zählt die zur Wortart passende; sonst alle Werte der Reihe nach.
  App.parseAccent = (raw, pos) => {
    const groups = [];
    let cur = null;
    for (const tok of String(raw ?? '').split(',')) {
      const m = /^\s*(?:[(（]([^)）]*)[)）])?\s*(\d+)\s*$/.exec(tok);
      if (!m) continue;
      if (m[1] !== undefined || !cur) { cur = { tags: m[1] ? m[1].split(/[;；]/) : [], nums: [] }; groups.push(cur); }
      cur.nums.push(+m[2]);
    }
    if (!groups.length) return null;
    const tag = POS_TAG[pos];
    const hit = tag && groups.find((g) => g.tags.includes(tag));
    const nums = [...new Set(hit ? hit.nums : groups.flatMap((g) => g.nums))];
    return { main: nums[0], alt: nums.slice(1) };
  };

  // Akzent einer Vokabel: eigener Wert (it.accent) vor dem Index (window.ACCENT_INDEX); null = unbekannt
  App.accentOf = (it) => {
    if (!it || it.type !== 'vocab' || !it.kana) return null;
    const count = App.morae(it.kana).length;
    let a = null;
    if (it.accent !== undefined && it.accent !== null && it.accent !== '') a = App.parseAccent(it.accent);
    else {
      const v = (window.ACCENT_INDEX && window.ACCENT_INDEX.v) || {};
      let raw = v[App.vocabKey(it)];
      // 〜する-Verben stehen nicht in den Daten; sie behalten den Akzent des Nomens
      const w = it.kanji || it.kana;
      if (raw === undefined && w.length > 2 && w.endsWith('する') && it.kana.endsWith('する')) {
        raw = v[App.vocabKey({ kanji: it.kanji && it.kanji.slice(0, -2), kana: it.kana.slice(0, -2) })];
        if (raw !== undefined) a = App.parseAccent(raw, 'noun');
      } else a = App.parseAccent(raw, it.pos);
    }
    if (!a || a.main > count) return null;
    return { main: a.main, alt: a.alt.filter((n) => n <= count) };
  };

  // Eingabe aus dem Editor: leer = automatisch (undefined), sonst 0 … Morenzahl
  App.readAccent = (text, kana) => {
    const s = String(text ?? '').trim();
    if (!s) return undefined;
    const max = App.morae(kana).length;
    if (!/^\d+$/.test(s) || +s > max) throw new Error(`Pitch Accent: bitte eine Zahl von 0 bis ${max} eingeben (oder leer lassen).`);
    return +s;
  };

  // Kurve: ein Punkt je More, Linie dazwischen, hohler Punkt für die Partikel (が)
  App.accentHtml = (it) => {
    const a = App.accentOf(it);
    if (!a) return '';
    const morae = App.morae(it.kana);
    const pat = App.pitchPattern(morae.length, a.main);
    const step = 30, x0 = 16, yH = 8, yL = 24;
    const pts = pat.map((h, i) => [x0 + i * step, h ? yH : yL]);
    const last = pts.length - 1;
    const svg = `<svg class="pitch-svg" width="${x0 * 2 + last * step}" height="50" role="img" aria-label="Pitch Accent ${a.main}">`
      + `<polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>`
      + pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4"${i === last ? ' class="part"' : ''}/>`).join('')
      + pts.map((p, i) => `<text x="${p[0]}" y="46"${i === last ? ' class="part"' : ''}>${i === last ? 'が' : App.esc(morae[i])}</text>`).join('')
      + '</svg>';
    return `<span class="pitch" lang="ja">${svg}${a.alt.length ? `<span class="pitch-alt" lang="de">auch: ${a.alt.join(', ')}</span>` : ''}</span>`;
  };
})(window.App);
