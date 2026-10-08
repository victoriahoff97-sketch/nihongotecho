/* Nihongo Techō – Niveau- und Bedeutungs-Helfer (JLPT-Index, deutsch/englisch) */
'use strict';
(function (App) {
  App.JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Leerzeichen, 〜/～/~ entfernen; Langvokal ー bleibt erhalten
  const norm = (s) => String(s ?? '').replace(/[\s〜～~]/g, '');

  // Eindeutiger Schluessel fuer eine Vokabel: Schreibung + Hiragana-Lesung
  App.vocabKey = (it) => {
    const writing = norm(it.kanji || it.kana || '');
    const kana = App.jp.toHira(norm(it.kana || ''));
    return writing + '|' + kana;
  };

  // Liest das JLPT-Niveau aus window.JLPT_INDEX (fehlt er, dann '')
  App.jlptOf = (it) => {
    const idx = window.JLPT_INDEX;
    if (!idx) return '';
    if (it.type === 'kanji') return (idx.k && idx.k[it.char]) || '';
    const key = App.vocabKey(it);
    if (idx.v && idx.v[key] !== undefined) return idx.v[key];
    const writing = norm(it.kanji || it.kana || '');
    if (idx.w && idx.w[writing] !== undefined) return idx.w[writing];
    return '';
  };

  // Niveau eines installierten Level-Pakets ('n5' -> 'N5'); unbekannt/nicht installiert -> ''
  const packLevel = (id) => {
    const installed = (App.store && App.store.packs) || {};
    if (!installed[id]) return '';
    const p = (window.PACKS || []).find((x) => x.id === id);
    if (p) return p.kind === 'level' && p.level ? p.level : '';
    const m = /^n([1-5])$/i.exec(String(id));
    return m ? 'N' + m[1] : '';
  };

  // Gespeichertes (automatisches) Niveau: Index-Treffer, sonst das leichteste Niveau der installierten
  // Level-Pakete, die den Eintrag fuehren (z. B. Kana-Seeds wie おいしい, die der Index nur mit Kanji kennt)
  App.levelFor = (it) => {
    const lvl = App.jlptOf(it);
    if (lvl) return lvl;
    if (!Array.isArray(it.packs)) return '';
    const lv = it.packs.map(packLevel).filter(Boolean);
    return lv.sort((a, b) => App.JLPT_LEVELS.indexOf(a) - App.JLPT_LEVELS.indexOf(b))[0] || '';
  };

  // Bedeutung: deutsch bevorzugt, sonst englisch
  App.meaning = (it) => {
    if (it.de) return { text: it.de, lang: 'de' };
    if (it.en) return { text: it.en, lang: 'en' };
    return { text: '', lang: '' };
  };

  // Bedeutung eines Beispielsatzes
  App.exMeaning = (ex) => ex.de || ex.en || '';

  // Fragewoerter (bekommen pos "question" statt pronoun/adverb/noun)
  const QUESTION_WORDS = ['何', 'なに', 'なん', 'どこ', 'いつ', 'だれ', 'どれ', 'どの', 'どう', 'どうして', 'なぜ', 'いくら', 'いくつ', 'どちら', 'どなた'];

  // Zeitbedeutung am Wort erkennbar (Tages-/Jahreszeiten, Wochentage, heute/gestern/morgen …)
  const TIME_RE = /[日年月週朝晩夜昨午夕春夏秋冬]|^(今|いま|おととし|おととい|あした|あさって|きのう|きょう|ゆうべ|けさ|こんばん)$/;

  // JMdict-Wortart-Tags -> { pos, cls? } (App-Wortarten, siehe DATA-SPEC.md).
  // word: Schreibung aus der Liste; ein vs-Nomen gilt nur als Verb, wenn es als "…する" gefuehrt wird.
  App.mapPos = (tags, word) => {
    const t = Array.isArray(tags) ? tags : [];
    const w = norm(word);
    const has = (x) => t.includes(x);
    const any = (re) => t.some((x) => re.test(x));
    const endsSuru = /(する|為る)$/.test(w);

    if (any(/^v5/)) return { pos: 'verb', cls: 'u' };
    if (any(/^v1/) || has('vz')) return { pos: 'verb', cls: 'ru' };
    if (has('vk')) return { pos: 'verb', cls: 'irr' };
    if (any(/^vs-/) || (has('vs') && endsSuru)) return { pos: 'verb', cls: 'irr' };
    if (QUESTION_WORDS.includes(w)) return { pos: 'question' };
    if (has('adj-i') || has('adj-ix')) return { pos: 'i-adj' };
    if (has('adj-na')) return { pos: 'na-adj' };
    if (has('adj-pn')) return { pos: 'expression' }; // Pränomen (この, 小さな)
    if (has('pn')) return { pos: 'pronoun' };
    // Zeitwoerter: n-t, oder adverbiales Nomen (n-adv bzw. im aktuellen JMdict n+adv) mit Zeitbedeutung
    const advNoun = has('n-adv') || (has('n') && has('adv'));
    if (has('n-t') || (advNoun && TIME_RE.test(w))) return { pos: 'time' };
    if (has('prt')) return { pos: 'particle' };
    if (has('ctr')) return { pos: 'counter' };
    if (has('conj')) return { pos: 'conjunction' };
    if (has('num')) return { pos: 'noun' }; // Zahlwort (一) geht vor pref/suf
    // n+adv ohne Zeitbedeutung: das zuerst genannte Tag entscheidet
    if (has('adv') && !(has('n') && t.indexOf('n') < t.indexOf('adv'))) return { pos: 'adverb' };
    if (has('n')) return { pos: 'noun' };
    if (has('exp') || has('int')) return { pos: 'expression' };
    if (has('pref') || has('suf')) return { pos: 'prefix-suffix' };
    return { pos: 'noun' };
  };

  // Mehrfachauswahl eines Filters steht mit | getrennt in der Adresse (src=Genki I|Unterricht, lvl=N5|N4)
  App.qList = (v) => (v ? String(v).split('|').filter(Boolean) : []);
  // Prüft, ob ein Eintrag zum Niveau-Filter passt: lvl ist 'N5'…'N1', 'none' (= kein Niveau), mehrere davon oder leer (= kein Filter)
  App.levelMatch = (it, lvl) => !lvl || App.qList(lvl).some((l) => (l === 'none' ? !it.level : it.level === l));
  // Prüft, ob ein Eintrag (oder eine Datei) zum Quellen-Filter passt
  App.srcMatch = (it, src) => !src || App.qList(src).includes(it.source);
  // Die Quelle, wenn genau eine gewählt ist (Vorbelegung für neue Einträge und Uploads), sonst ''
  App.oneSrc = (src) => { const l = App.qList(src); return l.length === 1 ? l[0] : ''; };

  // Setzt level fuer vocab/kanji ohne levelManual anhand des Index; liefert nur die geaenderten Eintraege
  App.applyJlptIndex = (items) => {
    const changed = [];
    items.forEach((it) => {
      if (it.type !== 'vocab' && it.type !== 'kanji') return;
      if (it.levelManual) return;
      const lvl = App.levelFor(it);
      if (it.level !== lvl) { it.level = lvl; changed.push(it); }
    });
    return changed;
  };
})(window.App);
