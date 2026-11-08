/* Nihongo Techō – Satz des Tages: Anstoß nach Wochentag aus Genki I (reine Logik, ohne DOM). Daten als 'JJJJ-MM-TT' (Ortszeit) */
'use strict';
(function (App) {
  const Y = App.dailyLogic = {};
  Y.START = '2026-11-09'; // ein Montag
  Y.MAX = 40;             // höchstens so viele Zeichen pro Satz

  const L12_FROM = 28;    // Lektion-12-Wörter ab START + 28 Tagen
  const WORD_POS = ['noun', 'verb', 'i-adj', 'na-adj'];
  // Wochenplan ab Montag (Abstand zu START modulo 7)
  const WEEK = ['word', 'question', 'grammar', 'word', 'today', 'chain', 'chain'];

  const pad = (x) => String(x).padStart(2, '0');
  const fmt = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  // Sommerzeit-fest über setDate
  const addDays = (date, n) => { const d = parse(date); d.setDate(d.getDate() + n); return fmt(d); };
  // ganze Tage seit START (über UTC, damit Zeitumstellungen nicht stören)
  const utc = (s) => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const offset = (date) => Math.round((utc(date) - utc(Y.START)) / 86400000);
  const mod7 = (n) => ((n % 7) + 7) % 7;

  Y.kindOf = (date) => WEEK[mod7(offset(date))];
  Y.vocabMaxLesson = (date) => (offset(date) >= L12_FROM ? 12 : 11);

  // Anzahl der Tage dieser Art mit Abstand in [0, n)
  const countBefore = (kind, n) => {
    if (n <= 0) return 0;
    const per = WEEK.filter((k) => k === kind).length;
    let c = Math.floor(n / 7) * per;
    for (let i = 0; i < n % 7; i++) if (WEEK[i] === kind) c++;
    return c;
  };

  const byId = (a, b) => (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);
  Y.pools = (seed, date) => {
    const genki = (seed || []).filter((x) => x && x.source === 'Genki I');
    const max = Y.vocabMaxLesson(date);
    return {
      word: genki.filter((x) => x.type === 'vocab' && Number(x.lesson) <= max && WORD_POS.includes(x.pos)).sort(byId),
      grammar: genki.filter((x) => x.type === 'grammar' && Number(x.lesson) <= 12).sort(byId),
    };
  };

  // Fester Zufall: FNV-1a als Startwert, mulberry32 als Folge
  const hash = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  };
  const mulberry32 = (a) => () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Eintrag Nummer index: Liste je Runde neu gemischt, innerhalb einer Runde keine Wiederholung
  const pick = (list, group, kind, index) => {
    const runde = Math.floor(index / list.length);
    const rnd = mulberry32(hash(String(group) + ':' + kind + ':' + runde));
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a[index % a.length];
  };

  Y.prompt = (date, group, seed, prompts) => {
    const kind = Y.kindOf(date);
    if (kind === 'today') return { kind };
    const n = Math.max(0, offset(date));
    const pr = prompts || {};
    if (kind === 'chain') {
      const chains = pr.chains || [];
      if (!chains.length) return { kind, locked: true };
      // Wochenend-Nummer +1: das Wochenende direkt vor START (Start-Sonntag) ist 0, das erste danach 1 – kein doppelter Anfang
      return { kind, chainStart: pick(chains, group, kind, Math.max(0, Math.floor(offset(date) / 7) + 1)) };
    }
    let list, index = countBefore(kind, n);
    if (kind === 'question') list = pr.questions || [];
    else {
      const pools = Y.pools(seed, date);
      list = pools[kind];
      // Wörter ab dem Lektion-12-Wechsel neu zählen
      if (kind === 'word' && n >= L12_FROM) index -= countBefore('word', L12_FROM);
    }
    if (!list.length) return { kind, locked: true };
    return { kind, item: pick(list, group, kind, index) };
  };

  Y.chainDays = (date) => {
    const k = mod7(offset(date));
    if (k === 5) return [date, addDays(date, 1)];
    if (k === 6) return [addDays(date, -1), date];
    return [];
  };
  // erster Montag (Abstand < 7): das Wochenende davor lag vor START, da gab es noch keine Kette
  Y.mondayChain = (date) => (offset(date) >= 7 && mod7(offset(date)) === 0 ? [addDays(date, -2), addDays(date, -1)] : []);

  Y.chainContext = (sentences) => (sentences || []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const JP = /[぀-ヿ㐀-鿿豈-﫿々]/;
  Y.checkText = (text) => {
    const t = String(text || '').trim();
    const len = Array.from(t).length;
    if (!len) return { ok: false, len, reason: 'leer' };
    if (len > Y.MAX) return { ok: false, len, reason: 'lang' };
    if (!JP.test(t)) return { ok: false, len, reason: 'kein-japanisch' };
    return { ok: true, len };
  };

  const stripFuri = (s) => String(s || '').replace(/\[[^\]]*\]/g, '');
  const JP_RUN = /[぀-ヿ㐀-鿿豈-﫿々]+/g;
  const MAX_SUB = 10; // längstes Textstück, das deinflektiert wird

  const usesWord = (text, w) => {
    const targets = [stripFuri(w.kanji), stripFuri(w.kana)].filter(Boolean);
    if (!targets.length) return false;
    if (targets.some((t) => text.includes(t))) return true;
    if (typeof App.deinflect !== 'function') return false;
    for (const run of text.match(JP_RUN) || []) {
      const ch = Array.from(run);
      for (let i = 0; i < ch.length; i++) {
        for (let j = i + 1; j <= Math.min(ch.length, i + MAX_SUB); j++) {
          const cands = App.deinflect(ch.slice(i, j).join(''));
          if (cands.some((c) => targets.includes(c.base))) return true;
        }
      }
    }
    return false;
  };

  // Muster wie 'XはYです': Platzhalter raus, jedes japanische Stück muss vorkommen.
  // ／, / und ・ trennen Varianten ('これ／それ／あれ／どれ'): eine Variante genügt.
  const usesGrammar = (text, g) => {
    const pattern = stripFuri(g.jp).replace(/\{[^}]*\}/g, ' ');
    const variants = pattern.split(/[／/・、]/);
    for (const v of variants) {
      const chunks = v.match(JP_RUN) || [];
      if (chunks.length && chunks.every((c) => text.includes(c))) return true;
    }
    return false; // auch, wenn nach dem Entfernen nichts übrig bleibt
  };

  Y.usesPrompt = (text, p) => {
    if (!p) return false;
    const t = stripFuri(text).replace(/[\s　]/g, '');
    if (p.type === 'grammar') return usesGrammar(t, p);
    return usesWord(t, p);
  };

  // ---------- Furigana von Hand korrigieren ----------
  // Notation 食[た]べる / {キャンプ場}[キャンプじょう] ↔ Stücke [{ t, r, edit }]: edit = Kanji darin (bekommt ein Lesungsfeld)
  const KJ = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reNote = new RegExp('\\{([^}]+)\\}\\[([^\\]]*)\\]|([' + KJ + ']+)\\[([^\\]]*)\\]', 'g');
  const reRun = new RegExp('([' + KJ + ']+)', 'g');
  const reK = new RegExp('[' + KJ + ']');
  const reAllK = new RegExp('^[' + KJ + ']+$');
  const plainParts = (txt, out) => txt.split(reRun).forEach((p, i) => { if (p) out.push({ t: p, r: '', edit: i % 2 === 1 }); });
  Y.furiSegments = (note) => {
    const s = String(note || ''), out = [];
    let last = 0, mm;
    reNote.lastIndex = 0;
    while ((mm = reNote.exec(s))) {
      plainParts(s.slice(last, mm.index), out);
      const t = mm[1] || mm[3];
      out.push({ t, r: mm[2] != null ? mm[2] : mm[4], edit: reK.test(t) });
      last = mm.index + mm[0].length;
    }
    plainParts(s.slice(last), out);
    return out;
  };
  // Stücke → Notation; leere Lesung = ohne Furigana
  Y.furiBuild = (segs) => (segs || []).map((x) => {
    const r = String(x.r || '').trim();
    if (!x.edit || !r || r === x.t) return x.t;
    return reAllK.test(x.t) ? `${x.t}[${r}]` : `{${x.t}}[${r}]`;
  }).join('');
  // Gilt die gespeicherte Notation noch für diesen Satz? (nach dem Bearbeiten nicht mehr)
  Y.furiFits = (note, text) => typeof note === 'string' && !!note && note.length <= 400
    && Y.furiSegments(note).map((x) => x.t).join('') === String(text || '');
})(window.App = window.App || {});
