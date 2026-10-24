/* Nihongo Techō – Antwort auf Japanisch prüfen (Karten Deutsch → Japanisch): Kanji, Kana und jede Mischung daraus */
'use strict';
(function (App) {
  const JP = App.jp;
  const A = App.answerLogic = {};
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKanji = new RegExp('[' + KANJI + ']');
  const reSegs = new RegExp('[' + KANJI + ']+|[^' + KANJI + ']+', 'g');
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Deutsche Seite einer Karte: das gesuchte Wort durch 〜 ersetzen, damit Hinweise wie „nein danke (結構です)“ die Lösung
  // nicht verraten. Bei Okurigana zählt auch der Kanji-Teil (対する: „(〜に対して)“ → „(〜に〜して)“); Kana erst ab 2 Zeichen.
  A.hideAnswer = (text, it) => {
    let s = String(text ?? '');
    if (!it) return s;
    const word = String(it.kanji || it.char || '').replace(/^[〜～]+|[〜～]+$/g, '');
    const stem = (word.match(new RegExp('^[' + KANJI + ']+')) || [''])[0];
    const kana = String(it.kana || '').replace(/^[〜～]+|[〜～]+$/g, '');
    const parts = [word, stem, kana.length >= 2 ? kana : ''].filter(Boolean).sort((a, b) => b.length - a.length);
    for (const p of parts) s = s.split(p).join('〜');
    return s.replace(/[〜～]{2,}/g, '〜');
  };

  // Leerzeichen und Satzzeichen zählen nicht; Romaji wird zu Kana
  A.clean = (s) => JP.romaji(String(s || '').trim()).replace(/[\s　。、．，,.!！?？「」『』・〜～〰∼~]/g, '');
  const hira = (s) => JP.toHira(s);

  // ---------- Lesungen eines Kanji-Blocks auf die einzelnen Zeichen verteilen ----------
  const VOICE = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ' };
  const HALF = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
  // alle Lesungen eines Zeichens, auch mit Rendaku (ほん → ぼん) und kleinem っ (がく → がっ)
  const variants = (k) => {
    const out = new Set();
    (k.on || []).concat(k.kun || []).forEach((r) => {
      const b = hira(String(r).split('.')[0].replace(/-/g, ''));
      if (!b) return;
      const firsts = [b, VOICE[b[0]] && VOICE[b[0]] + b.slice(1), HALF[b[0]] && HALF[b[0]] + b.slice(1)].filter(Boolean);
      firsts.forEach((v) => { out.add(v); if (/[つくちき]$/.test(v) && v.length > 1) out.add(v.slice(0, -1) + 'っ'); });
    });
    return Array.from(out);
  };
  // 勉強 + べんきょう → ['べん', 'きょう']; null, wenn sich die Lesung nicht aufteilen lässt (z. B. 一人 = ひとり)
  const splitRun = (run, reading, readingsOf) => {
    const chars = Array.from(run);
    const opts = chars.map((c) => { const k = readingsOf && readingsOf(c); return k ? variants(k) : null; });
    if (opts.some((o) => !o || !o.length)) return null;
    const go = (i, rest) => {
      if (i === chars.length) return rest ? null : [];
      for (const v of opts[i]) {
        if (!rest.startsWith(v)) continue;
        const tail = go(i + 1, rest.slice(v.length));
        if (tail) return [v].concat(tail);
      }
      return null;
    };
    return go(0, reading);
  };

  // ---------- Schreibweisen eines Eintrags ----------
  // Ergebnis je Schreibweise: { kanji, kana, segs: [{ k, r }] } – Kana-Stücke ohne r, Kanji (einzeln oder als Block) mit Lesung
  const form = (kanji, kana, readingsOf) => {
    kanji = A.clean(kanji); kana = A.clean(kana);
    if (!kanji) kanji = kana;
    if (!kana) kana = kanji;
    if (!reKanji.test(kanji)) return { kanji, kana, segs: [{ k: kanji }] };
    const parts = kanji.match(reSegs);
    const m = hira(kana).match(new RegExp('^' + parts.map((p) => (reKanji.test(p) ? '(.+?)' : '(' + reEsc(hira(p)) + ')')).join('') + '$'));
    if (!m) return { kanji, kana, segs: [{ k: kanji, r: hira(kana) }] };
    const segs = [];
    parts.forEach((p, i) => {
      if (!reKanji.test(p)) { segs.push({ k: p }); return; }
      const split = Array.from(p).length > 1 && splitRun(p, m[i + 1], readingsOf);
      if (split) Array.from(p).forEach((c, j) => segs.push({ k: c, r: split[j] }));
      else segs.push({ k: p, r: m[i + 1] });
    });
    return { kanji, kana, segs };
  };
  // readingsOf(Zeichen) → { on, kun } oder null (Kanji ohne Eintrag: nur ganz als Kanji oder ganz als Lesung)
  A.forms = (it, readingsOf) => {
    const list = it.type === 'phrase'
      ? [[JP.plain(it.jp || ''), JP.kana(it.jp || '')]].concat((it.also || []).map((x) => [x.kanji, x.kana]))
      : [[it.kanji, it.kana]];
    const na = it.type === 'vocab' && it.pos === 'na-adj';
    return list.filter(([k, r]) => k || r).map(([k, r]) => Object.assign(form(k, r, readingsOf), { na }));
  };

  // ---------- Vergleich ----------
  const matchForm = (ans, f) => {
    const re = new RegExp('^' + f.segs.map((s) => (s.r ? `(?:(${reEsc(s.k)})|(${reEsc(s.r)}))` : `(?:${reEsc(hira(s.k))})`)).join('') + (f.na ? '(?:な)?' : '') + '$');
    const m = hira(ans).match(re);
    if (!m) return null;
    const missing = [];
    let g = 1;
    f.segs.forEach((s) => { if (!s.r) return; if (m[g + 1] !== undefined && m[g] === undefined) missing.push(...Array.from(s.k)); g += 2; });
    return missing;
  };
  // Unterschied Zeichen für Zeichen (Katakana = Hiragana): same · del (zu viel / falsch) · add (fehlt)
  A.diff = (a, b) => {
    a = Array.from(a); b = Array.from(b);
    const eq = (x, y) => hira(x) === hira(y);
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = eq(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    const push = (t, s) => { const last = out[out.length - 1]; if (last && last.t === t) last.s += s; else out.push({ t, s }); };
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && eq(a[i], b[j])) { push('same', b[j]); i++; j++; }
      else if (i < a.length && (j >= b.length || L[i + 1][j] >= L[i][j + 1])) push('del', a[i++]);
      else push('add', b[j++]);
    }
    return out;
  };
  // null = nichts eingegeben · { ok, exact, missing: [Kanji, die als Kana geschrieben sind], answer } · falsch zusätzlich { target, diff }
  A.check = (raw, forms) => {
    const ans = A.clean(raw);
    if (!ans || !forms.length) return null;
    for (const f of forms) {
      const missing = matchForm(ans, f);
      if (missing) return { ok: true, exact: !missing.length, missing, answer: ans };
    }
    const f = forms[0];
    const target = reKanji.test(ans) ? f.kanji : f.kana;
    return { ok: false, exact: false, missing: [], answer: ans, target, diff: A.diff(ans, target) };
  };
  // Stift: Vorschläge der Erkennung, bester zuerst. Passt einer der ersten drei, gilt er – sonst zählt der beste
  A.CANDS = 3;
  A.checkAny = (cands, forms) => {
    const list = (cands || []).filter(Boolean);
    for (const c of list.slice(0, A.CANDS)) { const r = A.check(c, forms); if (r && r.ok) return r; }
    return list.length ? A.check(list[0], forms) : null;
  };
})(window.App);
