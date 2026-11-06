/* Nihongo Techō – Lückensätze: Partikeln in Beispielsätzen und Partikel-Mustern finden, Blatt zusammenstellen, Wortbank, Prüfung.
   Browser: App.gapLogic, Node: module.exports */
'use strict';
(function (root) {
  // Reihenfolge = Vorrang beim Auswählen der Lücken (は/も am wenigsten, weil oft mehrere passen)
  const PRT = ['を', 'に', 'で', 'が', 'へ', 'と', 'から', 'まで', 'も', 'は'];
  const MAX_GAPS = 2;
  const LONG = 24; // Zeichen ohne Lesung – länger gilt als „langer Satz“ (z. B. aus Artikeln)

  const KANJI = /[㐀-鿿豈-﫿々〆ヵヶ]/;
  const KATA = /[ァ-ヺー]/;
  const NUM = /[0-9０-９]/;
  // Lesung entfernen: {５０}[ごじゅう] → ５０, 食[た]べる → 食べる
  const plain = (s) => String(s ?? '').replace(/\{([^}]+)\}\[[^\]]+\]/g, '$1').replace(/\[[^\]]+\]/g, '');

  // Sichtbares Zeichen direkt vor Position i (Lesung in [..] übersprungen): 'k' Kanji/Ruby, 'a' Katakana, 'n' Zahl, 'h' sonst, '' Satzanfang
  const kindBefore = (s, i) => {
    const c = s[i - 1];
    if (!c) return '';
    if (c === ']' || c === '}') return 'k';
    if (KANJI.test(c)) return 'k';
    if (KATA.test(c)) return 'a';
    if (NUM.test(c)) return 'n';
    return 'h';
  };
  const charBefore = (s, i) => { // Kanji vor einer Lesung, z. B. 死[し] → 死
    if (s[i - 1] !== ']') return s[i - 1] || '';
    const o = s.lastIndexOf('[', i - 1);
    return o > 0 ? s[o - 1] : '';
  };

  // Ist an Position i eine Partikel p? Nur direkt nach Kanji, Katakana oder Zahl (dann ist es kein Teil eines Kana-Wortes);
  // を immer. Ausnahmen: Okurigana (上[あ]がる, 死[し]にます) und です/でした/では.
  const isParticle = (s, i, p) => {
    const k = kindBefore(s, i);
    if (!k) return false;
    if (p !== 'を' && k === 'h') return false;
    const next = s[i + p.length] || '';
    if (p === 'が' && /[るりらっれろ]/.test(next)) return false;
    if (p === 'で' && /[すしはき]/.test(next)) return false; // です, でした, では, できる
    if (p === 'と' && /[っさしすせそ]/.test(next)) return false; // 取って, 落とす
    if (p === 'も' && next === 'う') return false; // もう
    if (p === 'に' && charBefore(s, i) === '死') return false;
    if (!next || /[。、？！?!」]/.test(next) && p !== 'を') return false; // Satzende: eher Wortteil (何[なに]も。 bleibt ohne Lücke)
    return true;
  };

  // Satz → Teile: { t: Text } oder { g: Partikel }
  const fromSentence = (jp) => {
    const s = String(jp ?? '');
    const out = [];
    let buf = '', i = 0, depth = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '[') depth++;
      if (c === ']') depth--;
      if (!depth && c !== ']') {
        const p = PRT.find((x) => s.startsWith(x, i) && isParticle(s, i, x));
        if (p) { if (buf) out.push({ t: buf }); buf = ''; out.push({ g: p }); i += p.length; continue; }
      }
      buf += c; i++;
    }
    if (buf) out.push({ t: buf });
    return out;
  };
  // Partikel-Muster „人[ひと]|に|会[あ]う“ → Teile (ungerade Stücke sind Partikeln)
  const fromPattern = (jp) => String(jp ?? '').split('|').map((x, i) => (i % 2 ? { g: x } : { t: x })).filter((x) => x.g || x.t);

  // Andere Partikel, die hier ebenso stimmt: へ ⇔ に vor 行く/来る/帰る/戻る
  const MOVE = /^(行|来|帰|戻|いき|いく|いっ|くる|きま|きて|かえ)/;
  const altsOf = (segs, i) => {
    const g = segs[i].g;
    if (g !== 'へ' && g !== 'に') return [g];
    const after = plain(segs.slice(i + 1).map((x) => x.t || x.g || '').join(''));
    return MOVE.test(after) ? ['へ', 'に'] : [g];
  };

  // Höchstens MAX_GAPS Lücken je Satz (nach Vorrang), übrige Partikeln werden wieder Text
  const pick = (segs) => {
    const idx = segs.map((x, i) => (x.g ? i : -1)).filter((i) => i >= 0);
    const keep = new Set(idx.slice().sort((a, b) => PRT.indexOf(segs[a].g) - PRT.indexOf(segs[b].g) || a - b).slice(0, MAX_GAPS));
    const out = [];
    segs.forEach((x, i) => {
      if (x.g && keep.has(i)) out.push({ g: x.g, ok: altsOf(segs, i) });
      else { const t = x.g || x.t; if (out.length && out[out.length - 1].t != null) out[out.length - 1].t += t; else out.push({ t }); }
    });
    return out;
  };

  // Alle möglichen Aufgaben aus den Vokabeln: Beispielsätze und Partikel-Muster
  // opts: { status(it) → 'unchecked'|'learn'|'known', all: auch ungeprüfte Wörter, lesson: '3' o. ä., long: auch lange Sätze }
  const pool = (items, opts = {}) => {
    const out = [], seen = new Set();
    for (const it of items) {
      if (!it || it.type !== 'vocab') continue;
      if (opts.lesson && String(it.lesson) !== String(opts.lesson)) continue;
      if (!opts.all && opts.status && opts.status(it) === 'unchecked') continue;
      const add = (kind, jp, de, segs) => {
        const key = plain(jp).replace(/[|。．.！？?!\s]/g, '');
        if (!key || seen.has(key) || !segs.some((x) => x.g)) return;
        if (kind === 'satz' && !opts.long && plain(jp).length > LONG) return;
        seen.add(key);
        out.push({ kind, jp, de: de || '', id: it.id, segs: pick(segs) });
      };
      for (const ex of Array.isArray(it.examples) ? it.examples : []) if (ex && ex.jp) add('satz', ex.jp, ex.de, fromSentence(ex.jp));
      for (const u of Array.isArray(it.use) ? it.use : []) if (u && u.jp && u.jp.includes('|')) add('muster', u.jp, u.de, fromPattern(u.jp));
    }
    return out;
  };

  // Ein Blatt: n Aufgaben, höchstens die Hälfte Muster (Muster sind kurz, Sätze zeigen den Zusammenhang)
  const sheet = (all, n, shuffle) => {
    const s = shuffle(all.filter((x) => x.kind === 'satz'));
    const m = shuffle(all.filter((x) => x.kind === 'muster'));
    const nm = Math.min(m.length, Math.max(Math.floor(n / 2), n - s.length));
    return shuffle(s.slice(0, n - nm).concat(m.slice(0, nm)));
  };

  // Wortbank: je Lücke ihre Partikel + zwei, die nicht vorkommen – sortiert, damit Gleiches nebeneinander liegt
  const bank = (tasks, shuffle) => {
    const need = tasks.flatMap((t) => t.segs.filter((x) => x.g).map((x) => x.g));
    const extra = shuffle(PRT.slice(0, 7).filter((p) => !need.includes(p))).slice(0, 2);
    return need.concat(extra).sort((a, b) => PRT.indexOf(a) - PRT.indexOf(b));
  };

  const right = (gap, val) => !!val && gap.ok.includes(val);
  const lessons = (all, items) => {
    const by = new Map(items.map((it) => [it.id, it]));
    const n = new Map();
    for (const x of all) { const l = by.get(x.id) && by.get(x.id).lesson; if (l !== '' && l != null && !isNaN(+l)) n.set(+l, (n.get(+l) || 0) + 1); }
    return [...n.entries()].filter(([, c]) => c >= 3).map(([l]) => l).sort((a, b) => a - b);
  };

  const api = { PRT, LONG, plain, fromSentence, fromPattern, pick, pool, sheet, bank, right, lessons };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.gapLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
