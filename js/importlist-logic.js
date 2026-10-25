/* Nihongo Techō – Wortlisten-Import: PDF-Seiten in Zeilen und Spalten legen (Furigana an ihr Kanji, Überschriften erkennen),
   Wort-Zellen zerlegen. Browser: App.importLogic, Node: module.exports */
'use strict';
(function (root) {
  const KJ = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKj = new RegExp('[' + KJ + ']');
  const reFuri = new RegExp('\\{([^}]+)\\}\\[([^\\]]+)\\]|([' + KJ + ']+)\\[([^\\]]+)\\]', 'g');
  const plain = (s) => String(s ?? '').replace(reFuri, (m, g1, r1, k2) => g1 || k2);
  const reading = (s) => String(s ?? '').replace(reFuri, (m, g1, r1, k2, r2) => r1 || r2);
  // japanische Schrift samt Vollbreiten-Satzzeichen: dazwischen gehört kein Leerzeichen
  const isCjk = (c) => /[　-ヿ㐀-鿿豈-﫿！-｠々〆]/.test(c);
  const isKana = (s) => /^[ぁ-ヿー・]+$/.test(String(s).replace(/\s/g, ''));
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

  // Spaltenköpfe von Wortlisten (auf Japanisch oder Deutsch) → Feld des Imports
  const HEADS = [
    [/^(ドイツ語|意味|訳|deutsch|bedeutung|übersetzung)$/i, 'de'],
    [/^(例|例文|れい|れいぶん|beispiel|beispielsatz|beispielsätze)$/i, 'exjp'],
    [/^(読み|読み方|よみ|よみかた|ひらがな|lesung|kana)$/i, 'kana'],
    [/^(漢字|かんじ|kanji|schreibung)$/i, 'kanji'],
    [/^(言葉|ことば|単語|たんご|語彙|ごい|wort|wörter|vokabel|vokabeln|japanisch)$/i, 'jp'],
    [/^(lektion|lesson|kapitel|課)$/i, 'lesson'],
    [/^(nr\.?|no\.?|番号|#)$/i, 'skip'],
  ];
  const headField = (cell) => { const t = plain(cell).replace(/\s/g, ''); const h = HEADS.find(([re]) => re.test(t)); return h ? h[1] : null; };
  const isHeadRow = (cells) => cells.length >= 2 && cells.every((c) => headField(c));

  // ---------- eine PDF-Seite → Zeilen ----------
  // items: Textstücke { s, x, y, w, h } (PDF-Koordinaten: y wächst nach oben).
  // Ergebnis: { lines, split } – lines sind Tab-getrennte Zellen; Überschriften und Spaltenköpfe als „# …“ (der Import überspringt sie).
  // Furigana (kleine Kana direkt über Kanji) werden als Notation 練習[れんしゅう] an ihr Kanji gehängt, statt eigene Zeilen zu bilden.
  const pageLines = (items, { twoCols = 'auto' } = {}) => {
    items = items.filter((i) => i.s && i.s.trim());
    if (!items.length) return { lines: [], split: false };
    const body = median(items.flatMap((i) => Array(Math.min(20, Array.from(i.s.trim()).length)).fill(i.h)));
    const rubyCand = items.filter((i) => i.h <= body * 0.8 && isKana(i.s));
    const group = (list) => {
      const rows = [];
      list.slice().sort((a, b) => b.y - a.y || a.x - b.x).forEach((it) => {
        const r = rows.find((row) => Math.abs(row.y - it.y) < Math.max(3, Math.min(row.h, it.h) * 0.5));
        if (r) { r.items.push(it); r.hMax = Math.max(r.hMax, it.h); } else rows.push({ y: it.y, h: it.h, hMax: it.h, items: [it] });
      });
      rows.forEach((r) => {
        r.items.sort((a, b) => a.x - b.x);
        r.chars = [];
        r.items.forEach((it) => {
          const cs = Array.from(it.s), cw = (it.w || it.h * cs.length) / cs.length;
          // mehrere Leerzeichen in einem Textstück trennen Spalten (manche PDFs liefern eine ganze Zeile als ein Stück)
          let sp = 0;
          cs.forEach((c, k) => { if (!c.trim()) { sp++; return; } r.chars.push({ c, x: it.x + k * cw, w: cw, h: it.h, brk: sp >= 2 }); sp = 0; });
        });
        r.groups = [];
      });
      return rows;
    };
    const rows = group(items.filter((i) => !rubyCand.includes(i)));

    // Furigana an die Kanji darunter hängen
    const left = [];
    rubyCand.slice().sort((a, b) => a.x - b.x).forEach((rb) => {
      const row = rows.filter((r) => { const d = rb.y - r.y; return d > r.hMax * 0.3 && d < r.hMax * 1.9; }).sort((a, b) => (rb.y - a.y) - (rb.y - b.y))[0];
      const kj = row ? row.chars.map((ch, i) => ({ ch, i })).filter(({ ch }) => reKj.test(ch.c)) : [];
      const mid = (ch) => ch.x + ch.w / 2;
      let hit = kj.filter(({ ch }) => mid(ch) >= rb.x - ch.w * 0.3 && mid(ch) <= rb.x + rb.w + ch.w * 0.3);
      if (!hit.length) {
        const c = rb.x + rb.w / 2;
        const near = kj.filter(({ ch }) => Math.abs(mid(ch) - c) < Math.max(rb.w, ch.w)).sort((a, b) => Math.abs(mid(a.ch) - c) - Math.abs(mid(b.ch) - c))[0];
        if (near) hit = [near];
      }
      if (!hit.length) { left.push(rb); return; }
      // nur zusammenhängende Kanji; liegt Kana dazwischen, zählt die Gruppe um die Mitte
      let a = hit[0].i, b = hit[hit.length - 1].i;
      if (row.chars.slice(a, b + 1).some((ch) => !reKj.test(ch.c))) { a = b = hit[hit.length >> 1].i; while (a > hit[0].i && reKj.test(row.chars[a - 1].c)) a--; while (b < hit[hit.length - 1].i && reKj.test(row.chars[b + 1].c)) b++; }
      const text = rb.s.replace(/\s/g, '');
      const old = row.groups.find((g) => g.a <= b && a <= g.b);
      if (old) { old.parts.push({ x: rb.x, text }); old.a = Math.min(old.a, a); old.b = Math.max(old.b, b); } else row.groups.push({ a, b, parts: [{ x: rb.x, text }] });
    });
    if (left.length) rows.push(...group(left));
    rows.sort((a, b) => b.y - a.y);

    // Zeichen → Zellen (großer Abstand = neue Spalte)
    rows.forEach((r) => {
      const start = new Map(r.groups.map((g) => [g.a, g])), end = new Map(r.groups.map((g) => [g.b, g]));
      r.cells = [];
      let cell = null, prev = null;
      r.chars.forEach((ch, i) => {
        if (prev) {
          const gap = ch.x - (prev.x + prev.w);
          if (ch.brk || gap > Math.max(prev.h, ch.h) * 1.1) cell = null;
          else if (cell && !(isCjk(prev.c) && isCjk(ch.c)) && gap > Math.min(prev.h, ch.h) * (isCjk(prev.c) || isCjk(ch.c) ? 0.5 : 0.12)) { cell.text += ' '; cell.plain += ' '; }
        }
        if (!cell) { cell = { x: ch.x, text: '', plain: '', row: r }; r.cells.push(cell); }
        const g = start.get(i);
        if (g && reKj.test(cell.text.slice(-1))) cell.text += '{'; // Kanji davor ohne diese Lesung: Gruppe klammern
        if (g) g.brace = cell.text.endsWith('{');
        cell.text += ch.c;
        cell.plain += ch.c;
        const e = end.get(i);
        if (e) cell.text += (e.brace ? '}' : '') + '[' + e.parts.sort((p, q) => p.x - q.x).map((p) => p.text).join('') + ']';
        prev = ch;
      });
      r.cells.forEach((c) => { c.text = c.text.trim(); c.plain = c.plain.trim(); });
      r.head = r.chars.some((ch) => ch.h > body * 1.12) || isHeadRow(r.cells.map((c) => c.plain));
    });

    // Spalten aus der Lage auf der Seite: Zellen, die an derselben Stelle beginnen, und links davor ist in (fast) keiner
    // Zeile Text – so bleibt eine leere Spalte (z. B. „ドイツ語“ noch nicht ausgefüllt) leer, statt dass die Zellen nachrutschen.
    // Lücken mitten im Satz (Word schiebt Wörter mit Furigana auseinander) sind keine Spalte: in anderen Zeilen läuft dort Text durch.
    const data = rows.filter((r) => !r.head && r.cells.length);
    const xs = data.flatMap((r) => r.cells).sort((a, b) => a.x - b.x);
    const clusters = [];
    xs.forEach((c) => { const last = clusters[clusters.length - 1]; if (last && c.x - last.max <= body * 0.6) { last.max = c.x; } else clusters.push({ min: c.x, max: c.x }); });
    const crossed = (p) => data.filter((r) => r.chars.some((ch) => ch.x < p && ch.x + ch.w > p)).length;
    const cols = clusters.filter((k, i) => !i || crossed(k.min - body * 0.3) <= data.length * 0.1).map((k) => k.min);
    const colOf = (x) => { let j = 0; cols.forEach((m, i) => { if (m <= x + body) j = i; }); return j; };
    const join = (a, b) => (!a ? b : isCjk(a.replace(/\}?\[[^\]]*\]$/, '').slice(-1)) && isCjk(b.replace(/^\{/, '')[0]) ? a + b : a + ' ' + b);
    const out = [];
    let prevData = null;
    rows.forEach((r) => {
      if (!r.cells.length) return;
      if (r.head) { out.push({ head: r.cells.map((c) => c.plain).join('  ') }); prevData = null; return; }
      const cells = Array(Math.max(1, cols.length)).fill('');
      r.cells.forEach((c) => { const j = colOf(c.x); cells[j] = join(cells[j], c.text); });
      // umbrochene Zelle: Folgezeile ohne erste Spalte dicht darunter → an die Zeile davor hängen
      const first = cells.findIndex(Boolean);
      if (prevData && first > 0 && prevData.y - r.y < body * 1.6) {
        cells.forEach((t, j) => { if (t) prevData.cells[j] = join(prevData.cells[j], t); });
        prevData.y = r.y;
        return;
      }
      prevData = { y: r.y, cells };
      out.push(prevData);
    });

    // Zwei Wortlisten nebeneinander? (Muster wiederholt sich: 日本語 | かな | Deutsch | 日本語 | かな | Deutsch)
    const kind = (c) => (/[぀-ヿ㐀-鿿]/.test(c) ? 'j' : /[A-Za-zÄÖÜäöüß]/.test(c) ? 'l' : 'o');
    const isDouble = (cells) => {
      if (cells.length < 4 || cells.length % 2) return false;
      const h = cells.length / 2;
      return cells.slice(0, h).map(kind).join('') === cells.slice(h).map(kind).join('') && cells.slice(0, h).some((c) => kind(c) === 'j');
    };
    const rowsOut = out.filter((o) => o.cells);
    const multi = rowsOut.filter((o) => o.cells.filter(Boolean).length >= 4);
    const split = twoCols === true || (twoCols === 'auto' && multi.length >= 2 && multi.filter((o) => isDouble(o.cells)).length >= multi.length * 0.6);
    const line = (o) => (o.head ? '# ' + o.head : o.cells.join('\t').replace(/\t+$/, ''));
    if (!split) return { lines: out.map(line).filter((l) => l.trim()), split: false };
    const L = [], R = [];
    out.forEach((o) => {
      if (o.head) { L.push(line(o)); return; }
      const n = o.cells.length;
      if (n >= 4 && n % 2 === 0) { L.push(o.cells.slice(0, n / 2).join('\t')); R.push(o.cells.slice(n / 2).join('\t')); } else L.push(line(o));
    });
    return { lines: L.concat(R).map((l) => l.replace(/\t+$/, '')).filter((l) => l.trim()), split: true };
  };

  // ---------- Zahlen in Kanji (10,000 → 一万) ----------
  const DIG = '〇一二三四五六七八九';
  const numKanji = (n) => {
    if (!Number.isInteger(n) || n < 0 || n >= 1e16) return '';
    if (n === 0) return '〇';
    const four = (m) => [[1000, '千'], [100, '百'], [10, '十']].reduce((s, [u, k]) => { const d = Math.floor(m / u) % 10; return s + (d ? (d > 1 ? DIG[d] : '') + k : ''); }, '') + (m % 10 ? DIG[m % 10] : '');
    return [[1e12, '兆'], [1e8, '億'], [1e4, '万'], [1, '']].reduce((s, [u, k]) => { const m = Math.floor(n / u) % 10000; return s + (m ? four(m) + k : ''); }, '');
  };

  // ---------- Wort-Zelle → { kanji, kana, na } ----------
  // 練習[れんしゅう] · 新聞 (しんぶん) · 新聞 しんぶん · 10,000 いちまん · 嫌い(な) · ひさしぶり！
  const splitWord = (raw) => {
    let s = String(raw ?? '').trim();
    let na = false;
    s = s.replace(/\s*[(（]\s*な\s*[)）]\s*$/, () => { na = true; return ''; });
    s = s.replace(/[\s！!？?。、]+$/, '');
    if (!s) return { kanji: '', kana: '', na };
    if (/\[[^\]]+\]/.test(s)) {
      s = s.replace(/\s+(?=[㐀-鿿々]+\[)/g, '').replace(/^\s+/, ''); // Anki: „ 日本[にほん]語[ご]“
      const kanji = plain(s).replace(/\s/g, '');
      return { kanji: reKj.test(kanji) ? kanji : '', kana: reading(s).replace(/\s/g, ''), na };
    }
    const m = s.match(/^(.+?)\s*[（(【]\s*([぀-ヿー・\s]+)\s*[）)】]$/);
    if (m) return { kanji: m[1].trim(), kana: m[2].replace(/\s/g, ''), na };
    const num = s.match(/^([0-9][0-9,.]*)\s*([぀-ヿー]+)$/);
    if (num) { const k = numKanji(+num[1].replace(/[,.]/g, '')); return { kanji: k || num[1], kana: num[2], na }; }
    const m2 = s.match(/^([^\s]+)\s+([぀-ヿー]+)$/);
    if (m2 && reKj.test(m2[1])) return { kanji: m2[1], kana: m2[2], na };
    return reKj.test(s) ? { kanji: s.replace(/\s/g, ''), kana: '', na } : { kanji: '', kana: s, na };
  };

  const api = { pageLines, splitWord, numKanji, headField, isHeadRow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.App.importLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
