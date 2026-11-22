/* Nihongo Techō – Prüfungen (試験): reine Logik, ohne Bildschirm
   Jede Lernstufe (Genki-Lektion, Genki gesamt, JLPT-Stufe) hat eine Prüfung im Stil des JLPT:
   語彙 Vokabeln → 文法 Grammatik → 聴解 Hören → 漢字 Kanji, jede Frage mit 4 Antworten.
   Freigeschaltet ab 85 % „kann ich“, bestanden ab 80 % gesamt und mindestens 60 % in jedem Teil. */
'use strict';
(function (App) {
  const L = App.examLogic = {};
  const JP = App.jp;

  L.PARTS = ['vocab', 'grammar', 'listening', 'kanji'];
  L.PART_INFO = {
    vocab: { jp: '語彙', label: 'Vokabeln' },
    grammar: { jp: '文法', label: 'Grammatik' },
    listening: { jp: '聴解', label: 'Hören' },
    kanji: { jp: '漢字', label: 'Kanji' },
  };
  L.UNLOCK = 85;
  L.PASS = 80;
  L.PART_MIN = 60;
  L.PER_PART = { mini: 5, big: 18 };

  // ---------- Stufen ----------
  const GENKI = 'Genki I', GENKI_LESSONS = 12;
  L.STAGES = [];
  for (let n = 1; n <= GENKI_LESSONS; n++) L.STAGES.push({ key: `genki1-L${n}`, kind: 'mini', label: `${GENKI} · Lektion ${n}`, src: GENKI, lesson: n });
  L.STAGES.push({ key: 'genki1', kind: 'big', label: `${GENKI} gesamt`, src: GENKI });
  ['N5', 'N4', 'N3'].forEach((lv) => L.STAGES.push({ key: lv.toLowerCase(), kind: 'big', label: `JLPT ${lv}`, level: lv }));
  L.stage = (key) => L.STAGES.find((s) => s.key === key);

  // Gehört ein Eintrag zu dieser Stufe? 々 ist kein eigenes Kanji und zählt nie.
  L.inStage = (stage, it) => {
    if (!stage || !it || it.char === '々') return false;
    if (stage.level) return it.level === stage.level;
    if (it.source !== stage.src) return false;
    const l = +it.lesson;
    return stage.lesson ? l === stage.lesson : l >= 1 && l <= GENKI_LESSONS;
  };

  L.unlocked = (pct) => pct >= L.UNLOCK;
  // Zustand einer Stufe: empty (gibt es hier nicht / Paket fehlt) · running · passed (Abzeichen bleibt, auch wenn
  // die Prozent später wieder unter 85 fallen) · open · locked
  L.state = ({ pct, run, best, available = true }) => {
    if (!available || pct == null) return 'empty';
    if (run) return 'running';
    if (best && best.passed) return 'passed';
    return L.unlocked(pct) ? 'open' : 'locked';
  };
  // Fehler zurück: was mit einem Eintrag passiert – [welche Karte, Lernstand, Zusatz] (active = Deutsch → Japanisch)
  L.backOps = (it, direct) => {
    if (it.type === 'grammar') return [['self', 'unchecked', null]]; // Grammatik kennt keine Lernschlange: wieder „offen“
    const q = ['self', 'learn', { queued: 1 }];
    return direct ? [q, ['active', 'learn', { queued: 1 }]] : [q];
  };

  // ---------- Zufall (fester Startwert = gleiche Prüfung, z. B. für Tests) ----------
  L.rng = (seed) => {
    let a = (seed >>> 0) || 1;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  L.shuffle = (rng, list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  L.pick = (rng, list, n) => L.shuffle(rng, list).slice(0, n);

  // ---------- Falsche Antworten (Ablenker) ----------
  // Kandidaten, deren Schlüssel (keyFn) weder der Antwort noch einander gleicht; die ähnlichsten zuerst (sim, höher = ähnlicher),
  // bei Gleichstand zufällig. Gibt weniger als n zurück, wenn der Vorrat nicht reicht.
  L.distractors = (answer, pool, n, keyFn, sim, rng) => {
    const key = (x) => String(keyFn(x) ?? '').trim();
    const seen = new Set([key(answer)]);
    const cands = [];
    pool.forEach((c) => { const k = key(c); if (k && !seen.has(k)) { seen.add(k); cands.push(c); } });
    const r = rng || L.rng(cands.length + 7);
    return cands.map((c) => ({ c, s: (sim ? sim(c) : 0) + r() * 0.5 })).sort((x, y) => y.s - x.s).slice(0, n).map((x) => x.c);
  };
  // Ähnlichkeit zweier Kana-Wörter: gleiche Länge, gleicher Anfang, gemeinsame Zeichen
  const kanaSim = (a, b) => {
    a = JP.toHira(a); b = JP.toHira(b);
    let s = 0;
    if (Math.abs(a.length - b.length) <= 1) s += 2;
    if (a[0] === b[0]) s += 1;
    s += [...new Set(a)].filter((c) => b.includes(c)).length * 0.5;
    return s;
  };

  // Frage aus Antwort + Ablenkern: Antworten mischen, Index der richtigen merken. Unter 4 Antworten → keine Frage.
  const make = (rng, base, answer, wrong) => {
    if (wrong.length < 3) return null;
    const opts = L.shuffle(rng, [answer].concat(wrong.slice(0, 3)));
    return Object.assign(base, { opts, a: opts.indexOf(answer) });
  };

  // ---------- Hilfen für Sätze in Furigana-Schreibweise (学生[がくせい]) ----------
  const reFuri = /([^\s\[\]{}]+?)\[([^\]]+)\]|\{([^}]+)\}\[([^\]]+)\]/g;
  const KANJI_RE = /[㐀-鿿豈-﫿々〆ヵヶ]/;
  // Teile eines Satzes: { base (Schreibung), ruby (Lesung oder '') }
  const segs = (s) => {
    const out = [];
    let last = 0;
    String(s || '').replace(reFuri, (m, g1, r1, k2, r2, idx) => {
      if (idx > last) out.push({ base: s.slice(last, idx), ruby: '' });
      let base = g1 || k2, ruby = r1 || r2;
      // „私[わたし]“: zur Gruppe gehören nur die Kanji am Ende; davorstehende Kana sind normaler Text
      if (g1) { const k = base.match(/[㐀-鿿豈-﫿々〆ヵヶ]+$/); if (k && k[0] !== base) { out.push({ base: base.slice(0, base.length - k[0].length), ruby: '' }); base = k[0]; } }
      out.push({ base, ruby });
      last = idx + m.length;
      return m;
    });
    if (last < String(s || '').length) out.push({ base: s.slice(last), ruby: '' });
    return out;
  };
  const notate = (sg) => sg.map((x) => (x.ruby ? `${KANJI_RE.test(x.base) && !/[^㐀-鿿豈-﫿々〆ヵヶ]/.test(x.base) ? x.base : `{${x.base}}`}[${x.ruby}]` : x.base)).join('');
  // Satz mit hervorgehobenem bzw. ausgelassenem Abschnitt (Position in der reinen Schreibung).
  // Gruppen, die den Abschnitt berühren, verlieren ihre Lesung – sonst stünde die Lösung darüber.
  // Alle Vorkommen von word werden markiert (sonst verriete ein zweites Vorkommen mit Lesung die Lösung).
  const markSpan = (s, word, inner) => {
    const plainS = JP.plain(s), spans = [];
    for (let i = plainS.indexOf(word); i >= 0; i = plainS.indexOf(word, i + word.length)) spans.push([i, i + word.length]);
    let pos = 0, out = '';
    segs(s).forEach((x) => {
      const a = pos, b = pos + x.base.length;
      pos = b;
      if (!spans.some(([st, en]) => b > st && a < en)) { out += notate([x]); return; }
      // Gruppe berührt einen Abschnitt: ohne Lesung, Abschnitte durch inner ersetzen
      for (let i = a; i < b;) {
        const sp = spans.find(([st, en]) => i >= st && i < en);
        if (sp) { if (i === sp[0]) out += inner; i = sp[1]; continue; }
        out += plainS[i]; i++;
      }
    });
    return out;
  };
  const firstMeaning = (de) => String(de || '').split(/[;；]/)[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
  const notationCache = new WeakMap(); // wird je Frage für alle Wörter gebraucht
  const wordNotation = (it) => {
    if (!notationCache.has(it)) notationCache.set(it, it.kanji ? JP.notate(it.kanji, it.kana) : it.kana);
    return notationCache.get(it);
  };
  const exOf = (it) => (it.examples || []).find((e) => e && e.jp) || null;
  // Schlüssel → Wortart des ersten Eintrags damit (wie list.find, aber einmal statt je Kandidat: sonst bei
  // Tausenden Wörtern Millionen Vergleiche je Frage und der Prüfungsstart hängt sekundenlang)
  const firstPos = (list, keyFn) => {
    const m = new Map();
    list.forEach((v) => { const k = keyFn(v); if (!m.has(k)) m.set(k, v.pos); });
    return m;
  };

  // ---------- Automatische Fragen je Teil ----------
  // Jede Art liefert für einen Eintrag höchstens eine Frage (oder null). Gemischt wird reihum über die Arten.
  const KINDS = {
    vocab: {
      // Unterstrichenes Wort im Beispielsatz → Lesung
      read: (it, pool, rng) => {
        if (!it.kanji || !JP.hasKanji(it.kanji)) return null;
        const ex = exOf(it), plainEx = ex ? JP.plain(ex.jp) : '';
        const at = plainEx.indexOf(it.kanji);
        const prompt = at >= 0 ? markSpan(ex.jp, it.kanji, `__${it.kanji}__`) : `__${it.kanji}__`;
        // gleich geschriebene Wörter (明日 あした / あす) liefern keine Ablenker – ihre Lesung wäre auch richtig
        const wrong = L.distractors(it.kana, pool.filter((v) => v.kana && v.kanji !== it.kanji).map((v) => v.kana), 3, (x) => JP.toHira(x), (x) => kanaSim(it.kana, x), rng);
        return make(rng, { prompt, de: ex && at >= 0 ? ex.de : '' }, it.kana, wrong);
      },
      // Lücke im Beispielsatz → passendes Wort (gleiche Wortart zuerst)
      fill: (it, pool, rng) => {
        const ex = exOf(it);
        if (!ex) return null;
        const w = it.kanji || it.kana, plainEx = JP.plain(ex.jp), at = plainEx.indexOf(w);
        if (at < 0) return null;
        const prompt = markSpan(ex.jp, w, '（　　）');
        const others = pool.filter((v) => v.id !== it.id && firstMeaning(v.de) !== firstMeaning(it.de));
        const posOf = firstPos(others, wordNotation);
        const wrong = L.distractors(wordNotation(it), others.map(wordNotation), 3, (x) => JP.plain(x), (x) => (posOf.get(x) === it.pos ? 2 : 0), rng);
        return make(rng, { prompt, de: ex.de }, wordNotation(it), wrong);
      },
      // Japanisches Wort → deutsche Bedeutung
      mean: (it, pool, rng) => {
        const ans = firstMeaning(it.de);
        if (!ans) return null;
        const others = pool.filter((v) => v.id !== it.id && JP.toHira(v.kana) !== JP.toHira(it.kana));
        const posOf = firstPos(others, (v) => firstMeaning(v.de));
        const wrong = L.distractors(ans, others.map((v) => firstMeaning(v.de)).filter(Boolean), 3, (x) => x.toLowerCase(), (x) => (posOf.get(x) === it.pos ? 2 : 0), rng);
        return make(rng, { prompt: wordNotation(it) }, ans, wrong);
      },
    },
    kanji: {
      // Kanji im Wort → Lesung des Wortes
      kread: (it, pool, rng) => {
        const w = (it.words || []).find((x) => x && x.jp && JP.plain(x.jp).includes(it.char) && JP.hasNotation(x.jp));
        if (!w) return null;
        const ans = JP.kana(w.jp), written = JP.plain(w.jp);
        // gleich geschriebene Wörter (一日 いちにち / ついたち) liefern keine Ablenker
        const all = pool.flatMap((k) => (k.words || []).filter((x) => x && x.jp && JP.hasNotation(x.jp) && JP.plain(x.jp) !== written).map((x) => JP.kana(x.jp)));
        const wrong = L.distractors(ans, all, 3, (x) => JP.toHira(x), (x) => kanaSim(ans, x), rng);
        return make(rng, { prompt: `__${JP.plain(w.jp)}__`, de: w.de || '' }, ans, wrong);
      },
      // Lesung → richtige Schreibung; gleich gelesene Wörter sind nie Ablenker
      kwrite: (it, pool, rng) => {
        const w = (it.words || []).find((x) => x && x.jp && JP.plain(x.jp).includes(it.char) && JP.hasNotation(x.jp));
        if (!w) return null;
        const ans = JP.plain(w.jp), read = JP.toHira(JP.kana(w.jp));
        const all = pool.flatMap((k) => (k.words || []).filter((x) => x && x.jp && JP.hasNotation(x.jp) && JP.toHira(JP.kana(x.jp)) !== read).map((x) => JP.plain(x.jp)));
        const wrong = L.distractors(ans, all, 3, (x) => x, (x) => (x.length === ans.length ? 2 : 0) + ([...ans].some((c) => x.includes(c)) ? 1 : 0), rng);
        return make(rng, { prompt: `__${JP.kana(w.jp)}__`, de: w.de || '' }, ans, wrong);
      },
    },
    listening: {
      // Satz hören → passende Bedeutung
      hear: (it, pool, rng) => {
        const ex = exOf(it);
        if (!ex || !ex.de) return null;
        const others = pool.map(exOf).filter((e) => e && e.de && e.jp !== ex.jp);
        const wrong = L.distractors(ex.de, others.map((e) => e.de), 3, (x) => x.toLowerCase().replace(/[.!?。]/g, '').trim(), null, rng);
        return make(rng, { prompt: '', say: ex.jp, text: ex.jp }, ex.de, wrong);
      },
    },
    grammar: {
      // Beispielsatz → welcher Grammatikpunkt? Punkte, deren Bestandteile alle im Satz stehen, sind keine Ablenker.
      gpick: (it, pool, rng) => {
        const ex = exOf(it);
        if (!ex || !it.jp) return null;
        const plainEx = JP.plain(ex.jp);
        const fits = (g) => { const parts = String(g.jp).split(/[^぀-ヿ㐀-鿿々]+/).filter(Boolean); return parts.length > 0 && parts.every((p) => plainEx.includes(p)); };
        const others = pool.filter((g) => g.id !== it.id && g.jp && !fits(g));
        const wrong = L.distractors(it.jp, others.map((g) => g.jp), 3, (x) => x, null, rng);
        return make(rng, { prompt: ex.jp, de: ex.de }, it.jp, wrong);
      },
    },
  };
  const TYPE_OF = { vocab: 'vocab', kanji: 'kanji', listening: 'vocab', grammar: 'grammar' };

  // isTarget (optional): nur diese Einträge werden abgefragt; Ablenker kommen aus allen items
  L.autoQuestions = (part, items, rng, n, isTarget) => {
    const kinds = KINDS[part];
    if (!kinds || n <= 0) return [];
    const pool = (items || []).filter((it) => it && it.type === TYPE_OF[part]);
    const order = L.shuffle(rng, isTarget ? pool.filter(isTarget) : pool);
    const names = Object.keys(kinds);
    const out = [], used = new Set();
    let k = Math.floor(rng() * names.length);
    for (const it of order) {
      if (out.length >= n) break;
      if (used.has(it.id)) continue;
      // Art reihum; passt sie nicht zum Eintrag, die nächste versuchen
      for (let t = 0; t < names.length; t++) {
        const kind = names[(k + t) % names.length];
        const q = kinds[kind](it, pool, rng);
        if (q) { out.push(Object.assign({ id: `${kind}:${it.id}`, part, kind, ref: it.id }, q)); used.add(it.id); k = (k + t + 1) % names.length; break; }
      }
    }
    return out;
  };

  // ---------- Handgeschriebene Fragen (js/exam-data.js) ----------
  // Lektion n: Fragen dieser Lektion · Genki gesamt: alle Genki-Fragen (auch ohne Lektion) · JLPT: Fragen der Stufe
  L.bankFor = (key, bank) => {
    const st = L.stage(key);
    if (!st) return [];
    return (bank || []).filter((q) => {
      if (st.level) return q.stage === key;
      if (q.stage !== 'genki1') return false;
      return st.lesson ? +q.lesson === st.lesson : q.lesson == null || (+q.lesson >= 1 && +q.lesson <= GENKI_LESSONS);
    });
  };

  // Antworten einer festen Frage mischen (Kopie), die richtige bleibt richtig
  const reshuffle = (rng, q) => {
    const order = L.shuffle(rng, [0, 1, 2, 3]);
    return Object.assign({}, q, { opts: order.map((i) => q.opts[i]), a: order.indexOf(q.a) });
  };
  const unseenFirst = (rng, list, seen) => {
    const s = new Set(seen || []);
    const sh = L.shuffle(rng, list);
    return sh.filter((q) => !s.has(q.id)).concat(sh.filter((q) => s.has(q.id)));
  };

  // ---------- Einen Durchgang zusammenstellen ----------
  // Run = { stage, started, parts: [{ part, qs }], answers (flach über alle Fragen), pos }
  // Grammatik und Hören: erst handgeschriebene Fragen, dann füllt die App auf. Teile ohne Fragen fallen weg.
  L.build = (key, items, bank, seen, seed) => {
    const st = L.stage(key), rng = L.rng(seed), n = L.PER_PART[st.kind];
    const isTarget = (it) => L.inStage(st, it);
    const fromBank = L.bankFor(key, bank);
    const parts = [];
    L.PARTS.forEach((part) => {
      const own = unseenFirst(rng, fromBank.filter((q) => q.part === part), seen).slice(0, n).map((q) => reshuffle(rng, q));
      const auto = own.length < n ? unseenFirst(rng, L.autoQuestions(part, items, rng, n * 3, isTarget), seen).slice(0, n - own.length) : [];
      const qs = own.concat(auto);
      if (qs.length) parts.push({ part, qs });
    });
    const total = parts.reduce((s, p) => s + p.qs.length, 0);
    return { stage: key, started: seed, parts, answers: Array(total).fill(null), pos: 0 };
  };
  L.flat = (run) => run.parts.flatMap((p) => p.qs);

  // ---------- Auswerten ----------
  const pct = (r, t) => (t ? Math.round((r / t) * 100) : 0);
  L.score = (run) => {
    let i = 0, right = 0, total = 0;
    const parts = run.parts.map((p) => {
      let r = 0;
      p.qs.forEach((q) => { if (run.answers[i] === q.a) r++; i++; });
      right += r; total += p.qs.length;
      return { part: p.part, right: r, total: p.qs.length, pct: pct(r, p.qs.length) };
    });
    const all = pct(right, total);
    return { parts, right, total, pct: all, passed: total > 0 && all >= L.PASS && parts.every((p) => p.pct >= L.PART_MIN) };
  };
  // Einträge hinter falsch oder nicht beantworteten Fragen – jeder nur einmal
  L.mistakes = (run) => {
    const out = new Set();
    L.flat(run).forEach((q, i) => { if (run.answers[i] !== q.a && q.ref) out.add(q.ref); });
    return Array.from(out);
  };
  // Bestes Ergebnis: bestanden schlägt nicht bestanden, sonst zählen die Prozent
  L.betterBest = (old, score) => !old || (!!score.passed !== !!old.passed ? !!score.passed : score.pct > old.pct);
})(window.App);
