/* Nihongo Techō – Anwenden: reine Logik (Zufallsfrage, Vergleich, Kalender). Läuft im Browser (App.aLogic) und in Node (Tests). */
'use strict';
(function (root) {
  // HTML-Entities, die writeArea erzeugt – nur die gängigen, keine volle Tabelle.
  const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
  const decodeEntities = (s) => s.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => ENTITIES[m]);

  // HTML aus writeArea in reinen Text: Furigana (<rt>/<rp>) samt Inhalt weg, Zeilenumbrüche an <br>/</p>/</div>/</li>, restliche Tags weg.
  const plainText = (html) => {
    const withBreaks = String(html || '')
      .replace(/<(rt|rp)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    return decodeEntities(withBreaks).trim();
  };

  // Anzahl nicht-leerer Sätze, getrennt an Satzzeichen (。！？!?) oder Zeilenumbruch.
  const countSentences = (text) => String(text || '')
    .split(/[。！？!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .length;

  // { [promptId]: { count, last } } aus Antworten (nur type-lose Liste von Antworten mit promptId/date).
  const answerStats = (answers) => {
    const stats = {};
    (answers || []).forEach((a) => {
      if (!a || !a.promptId) return;
      const s = stats[a.promptId] || { count: 0, last: '' };
      s.count += 1;
      if (!s.last || (a.date || '') > s.last) s.last = a.date || s.last;
      stats[a.promptId] = s;
    });
    return stats;
  };

  // Tage zwischen zwei ISO-Daten (b - a), UTC-basiert per Split (keine Zeitzonen-Verschiebung).
  const daysBetween = (a, b) => {
    const toUTC = (iso) => {
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso || '');
      return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
    };
    return Math.round((toUTC(b) - toUTC(a)) / 86400000);
  };

  // Fragen ohne hidden, gefiltert nach Level ('' = alle, 'own' = ohne _seed/_pack), sortiert nach order, dann created.
  const filterPrompts = (prompts, level) => {
    const lvl = level || '';
    return (prompts || [])
      .filter((p) => !p.hidden)
      .filter((p) => {
        if (lvl === '') return true;
        if (lvl === 'own') return !p._seed && !p._pack;
        return p.level === lvl;
      })
      .sort((a, b) => {
        const oa = Number.isFinite(a.order) ? a.order : Infinity;
        const ob = Number.isFinite(b.order) ? b.order : Infinity;
        return oa - ob || (+a.created || 0) - (+b.created || 0);
      });
  };

  // Gewichtete Zufallsauswahl: nie beantwortet -> 4, sonst 1 + min(3, Tage seit letzter Antwort / 14).
  const pickRandom = (prompts, answers, opts) => {
    const { level = '', lastId = '', today, rand = Math.random } = opts || {};
    const stats = answerStats(answers);
    let cands = filterPrompts(prompts, level);
    if (cands.length > 1 && lastId) cands = cands.filter((p) => p.id !== lastId);
    if (!cands.length) return null;
    const weight = (p) => {
      const st = stats[p.id];
      if (!st || !st.last) return 4;
      return 1 + Math.min(3, daysBetween(st.last, today) / 14);
    };
    const weights = cands.map(weight);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const r = rand() * total;
    let acc = 0;
    for (let i = 0; i < cands.length; i += 1) {
      acc += weights[i];
      if (acc > r) return cands[i];
    }
    return cands[cands.length - 1];
  };

  // Ids, die nur in newer vorkommen (nicht in older) – für Grammatik/Vokabel je Antwort-Snapshot.
  const diffAnswers = (older, newer) => {
    const oldG = new Set((older && older.grammarIds) || []);
    const oldV = new Set((older && older.vocabIds) || []);
    const newG = ((newer && newer.grammarIds) || []).filter((id) => !oldG.has(id));
    const newV = ((newer && newer.vocabIds) || []).filter((id) => !oldV.has(id));
    return { newGrammar: newG, newVocab: newV };
  };

  // Zum Markieren im Text: Vokabel-Kanji/Kana bzw. Grammatik-Patterns/Titel, ohne 〜/~, ohne Duplikate.
  const highlightTerms = (item) => {
    const strip = (s) => String(s || '').replace(/[〜~]/g, '').trim();
    let raw;
    if (item && item.type === 'vocab') {
      raw = [item.kanji, item.kana];
    } else {
      raw = (item && item.patterns && item.patterns.length) ? item.patterns : [item && item.title];
    }
    const seen = new Set();
    const out = [];
    raw.forEach((s) => {
      const t = strip(s);
      if (t.length >= 1 && !seen.has(t)) { seen.add(t); out.push(t); }
    });
    return out;
  };

  // 'YYYY-MM' -> Wochen Mo–So, von Montag <= 1. bis Sonntag >= letzter Tag des Monats.
  const monthGrid = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const last = new Date(Date.UTC(y, m, 0));
    const weekdayMon0 = (d) => (d.getUTCDay() + 6) % 7; // Mo=0 .. So=6
    const start = new Date(first); start.setUTCDate(start.getUTCDate() - weekdayMon0(first));
    const end = new Date(last); end.setUTCDate(end.getUTCDate() + (6 - weekdayMon0(last)));
    const toIso = (d) => d.toISOString().slice(0, 10);
    const weeks = [];
    let cur = new Date(start);
    while (cur <= end) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        week.push({ date: toIso(cur), day: cur.getUTCDate(), inMonth: cur.getUTCMonth() === m - 1 && cur.getUTCFullYear() === y });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  // 'YYYY-MM' um delta Monate verschieben.
  const shiftMonth = (ym, delta) => {
    const [y, m] = ym.split('-').map(Number);
    const total = (y * 12 + (m - 1)) + delta;
    const ny = Math.floor(total / 12);
    const nm = total - ny * 12 + 1;
    return `${ny}-${String(nm).padStart(2, '0')}`;
  };

  // Zählt Tagebuch-/Antwort-Einträge pro Tag im Monat (nur Items mit date im Monat).
  const monthMarks = (ym, journals, answers) => {
    const days = {};
    let journalCount = 0;
    let answerCount = 0;
    const bump = (list, key) => {
      (list || []).forEach((item) => {
        const d = item && item.date;
        if (!d || d.slice(0, 7) !== ym) return;
        if (!days[d]) days[d] = { journal: 0, answer: 0 };
        days[d][key] += 1;
        if (key === 'journal') journalCount += 1; else answerCount += 1;
      });
    };
    bump(journals, 'journal');
    bump(answers, 'answer');
    return { days, journalCount, answerCount };
  };

  const L = {
    plainText, countSentences, answerStats, daysBetween, filterPrompts, pickRandom,
    diffAnswers, highlightTerms, monthGrid, shiftMonth, monthMarks,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.App.aLogic = L;
})(this);
