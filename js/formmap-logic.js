/* Nihongo Techō – Lernlandkarte: Formen als Streckenplan (reine Daten und Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const F = App.formMap = {};

  // Zwei Karten; w/h = Zeichenfläche des Streckenplans
  F.MAPS = [
    { id: 'verb', title: 'Verben', w: 680, h: 500 },
    { id: 'adj', title: 'Adjektive', w: 680, h: 460 },
  ];
  // Jede Formenfamilie ist eine Linie mit eigener Farbe
  F.LINES = {
    start: { label: 'Start', color: 'var(--muted)' },
    masu: { label: 'ます-Linie', color: 'var(--murasaki)' },
    te: { label: 'て-Linie', color: 'var(--sora)' },
    nai: { label: 'ない-Linie', color: 'var(--daidai)' },
    i: { label: 'い-Linie', color: 'var(--ai)' },
    na: { label: 'な-Linie', color: 'var(--sakura)' },
  };

  // from = Formen, aus denen man diese ableitet · conj = Schlüssel für JP.conj bzw. JP.adj
  // grammar = Kennung des Grammatik-Eintrags · x/y = Station auf der Karte (Beschriftung steht darunter)
  // uses = Grammatik-Einträge, die diese Form benutzen (im Fenster der Station verlinkt)
  // out = Startstation: die Linien gehen erst nach einem kurzen gemeinsamen Stück auseinander
  F.FORMS = [
    { id: 'v-dict', map: 'verb', line: 'start', from: [], label: 'Wörterbuchform', conj: 'dict', grammar: 'g-g3-verbtypes', uses: ['g-g8-noga-suki', 'g-g8-to-omoimasu', 'g-g8-to-itteimashita', 'g-g8-informal', 'g-g9-noun-modify', 'g-g9-kara', 'g-g10-tsumori', 'g-g12-ndesu', 'g-g12-node', 'g-g12-deshou'], x: 70, y: 270, out: 60,
      rule: 'Die Grundform, wie sie im Wörterbuch steht. Aus ihr leitest du alle anderen Formen ab – je nach Verbgruppe (う-Verb, る-Verb oder unregelmäßig) etwas anders.' },
    { id: 'v-stem', map: 'verb', line: 'masu', from: ['v-dict'], label: 'ます-Stamm', conj: 'stem', grammar: 'g-g3-masu', uses: ['g-g7-stem-ni-iku', 'g-g12-sugiru'], x: 220, y: 130,
      rule: 'る-Verben: る weglassen. う-Verben: die letzte Silbe von der u-Reihe in die i-Reihe (く → き, む → み). する → し, くる → き.' },
    { id: 'v-masu', map: 'verb', line: 'masu', from: ['v-stem'], label: 'ます-Form', conj: 'masu', grammar: 'g-g3-masu', uses: ['g-g3-masenka', 'g-g3-frequency'], x: 360, y: 130,
      rule: 'ます-Stamm + ます. Verneint: ます-Stamm + ません.' },
    { id: 'v-mashita', map: 'verb', line: 'masu', from: ['v-masu'], label: 'ました', conj: 'mashita', grammar: 'g-g4-mashita', uses: ['g-g9-mou-mada'], x: 510, y: 130,
      rule: 'Vergangenheit: ます → ました. Verneint: ません → ませんでした.' },
    { id: 'v-mashou', map: 'verb', line: 'masu', from: ['v-masu'], label: 'ましょう', conj: 'mashou', grammar: 'g-g5-mashou', uses: ['g-g6-mashouka'], x: 510, y: 200,
      rule: 'ます → ましょう: „Lass uns …“.' },
    { id: 'v-tai', map: 'verb', line: 'masu', from: ['v-stem'], label: 'たい-Form', conj: 'taiplain', grammar: 'g-g11-tai', x: 360, y: 50,
      rule: 'ます-Stamm + たい: „möchte …“. Danach beugt sich たい wie ein い-Adjektiv (たくない, たかった).' },
    { id: 'v-te', map: 'verb', line: 'te', from: ['v-dict'], label: 'て-Form', conj: 'te', grammar: 'g-g6-te-form', uses: ['g-g6-tekudasai', 'g-g6-temoii', 'g-g6-tewaikenai', 'g-g6-te-connect', 'g-g7-teiru-progress', 'g-g7-teiru-state', 'g-g9-mou-mada'], x: 220, y: 270,
      rule: 'る-Verben: る → て. う-Verben nach der Endung: う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して. Ausnahme: 行く → 行って. する → して, くる → きて.' },
    { id: 'v-ta', map: 'verb', line: 'te', from: ['v-te'], label: 'た-Form', conj: 'ta', grammar: 'g-g9-short-past', uses: ['g-g9-informal-past', 'g-g9-quote-past', 'g-g11-koto-ga-aru', 'g-g12-hou-ga-ii'], x: 360, y: 270,
      rule: 'て-Form nehmen und て → た tauschen (で → だ).' },
    { id: 'v-tari', map: 'verb', line: 'te', from: ['v-ta'], label: 'たり-Form', conj: 'tari', grammar: 'g-g11-tari', x: 510, y: 270,
      rule: 'た-Form + り.' },
    { id: 'v-nai', map: 'verb', line: 'nai', from: ['v-dict'], label: 'ない-Form', conj: 'nai', grammar: 'g-g8-short-present', uses: ['g-g12-hou-ga-ii', 'g-g12-nakereba'], x: 220, y: 380,
      rule: 'る-Verben: る → ない. う-Verben: die letzte Silbe in die a-Reihe + ない (く → かない, う → わない). する → しない, くる → こない, ある → ない.' },
    { id: 'v-nakatta', map: 'verb', line: 'nai', from: ['v-nai'], label: 'なかった-Form', conj: 'nakatta', grammar: 'g-g9-short-past', uses: ['g-g9-quote-past'], x: 360, y: 380,
      rule: 'ない → なかった. (ない beugt sich wie ein い-Adjektiv.)' },
    { id: 'v-naide', map: 'verb', line: 'nai', from: ['v-nai'], label: 'ないで-Form', conj: 'naide', grammar: 'g-g8-naidekudasai', x: 360, y: 450,
      rule: 'ない-Form + で.' },

    { id: 'a-i', map: 'adj', line: 'start', from: [], label: 'い-Adjektiv', conj: 'plain', grammar: 'g-g5-adjectives', uses: ['g-g7-body', 'g-g10-yori', 'g-g10-ichiban', 'g-g10-adj-no', 'g-g10-naru', 'g-g12-sugiru'], x: 70, y: 120, out: 60,
      rule: 'Die Grundform endet auf い. Zum Beugen fällt das letzte い weg. Ausnahme: いい beugt sich als よ- (よくない, よかった).' },
    { id: 'a-i-neg', map: 'adj', line: 'i', from: ['a-i'], label: 'くない', conj: 'negp', grammar: 'g-g5-adj-conjugation', x: 250, y: 50,
      rule: 'Verneinung: い → くない.' },
    { id: 'a-i-pastneg', map: 'adj', line: 'i', from: ['a-i-neg'], label: 'くなかった', conj: 'pastnegp', grammar: 'g-g5-adj-conjugation', x: 420, y: 50,
      rule: 'Verneinte Vergangenheit: くない → くなかった.' },
    { id: 'a-i-past', map: 'adj', line: 'i', from: ['a-i'], label: 'かった', conj: 'pastp', grammar: 'g-g5-adj-conjugation', x: 250, y: 120,
      rule: 'Vergangenheit: い → かった.' },
    { id: 'a-i-te', map: 'adj', line: 'i', from: ['a-i'], label: 'くて', conj: 'te', grammar: 'g-g7-adj-te', x: 250, y: 190,
      rule: 'て-Form zum Verbinden: い → くて.' },
    { id: 'a-na', map: 'adj', line: 'start', from: [], label: 'な-Adjektiv', conj: 'plain', grammar: 'g-g5-adjectives', uses: ['g-g5-suki-kirai', 'g-g10-yori', 'g-g10-ichiban', 'g-g10-adj-no', 'g-g10-naru', 'g-g12-sugiru'], x: 70, y: 330, out: 60,
      rule: 'Die Grundform steht ohne な. Vor einem Nomen kommt な dazu (元気な人), sonst beugt sie sich wie ein Nomen mit です.' },
    { id: 'a-na-neg', map: 'adj', line: 'na', from: ['a-na'], label: 'じゃない', conj: 'negp', grammar: 'g-g5-adj-conjugation', uses: ['g-g2-janai'], x: 250, y: 260,
      rule: 'Verneinung: Grundform + じゃない.' },
    { id: 'a-na-pastneg', map: 'adj', line: 'na', from: ['a-na-neg'], label: 'じゃなかった', conj: 'pastnegp', grammar: 'g-g5-adj-conjugation', x: 420, y: 260,
      rule: 'Verneinte Vergangenheit: じゃない → じゃなかった.' },
    { id: 'a-na-past', map: 'adj', line: 'na', from: ['a-na'], label: 'でした', conj: 'past', grammar: 'g-g5-adj-conjugation', uses: ['g-g4-deshita'], x: 250, y: 330,
      rule: 'Vergangenheit: Grundform + でした.' },
    { id: 'a-na-te', map: 'adj', line: 'na', from: ['a-na'], label: 'で', conj: 'te', grammar: 'g-g7-adj-te', x: 250, y: 400,
      rule: 'て-Form zum Verbinden: Grundform + で.' },
  ];
  const BY_ID = new Map(F.FORMS.map((f) => [f.id, f]));
  F.form = (id) => BY_ID.get(id);
  F.formsOf = (mapId) => F.FORMS.filter((f) => f.map === mapId);
  F.usesOf = (form) => form.uses || [];

  const knownSet = (known) => new Set((Array.isArray(known) ? known : []).filter((id) => BY_ID.has(id)));

  // done = abgehakt · next = alle Vorgänger gekonnt (Startstationen immer) · later = ein Vorgänger fehlt
  F.status = (form, known) => {
    const k = knownSet(known);
    if (k.has(form.id)) return 'done';
    return form.from.every((id) => k.has(id)) ? 'next' : 'later';
  };
  // Haken setzen oder zurücknehmen; andere Formen bleiben unberührt, unbekannte Kennungen fliegen raus
  F.toggle = (known, id) => {
    const k = knownSet(known);
    if (!BY_ID.has(id)) return [...k];
    if (k.has(id)) k.delete(id); else k.add(id);
    return [...k];
  };
  F.progress = (mapId, known) => {
    const k = knownSet(known);
    const forms = F.formsOf(mapId);
    return { done: forms.filter((f) => k.has(f.id)).length, total: forms.length };
  };

  // Fest hinterlegte Beispielwörter, falls die eigenen Vokabeln eine Gruppe nicht hergeben
  const FALLBACK = {
    u: { kana: 'かく', kanji: '書く', de: 'schreiben', pos: 'verb', v: { cls: 'u' } },
    ru: { kana: 'たべる', kanji: '食べる', de: 'essen', pos: 'verb', v: { cls: 'ru' } },
    irr: { kana: 'する', kanji: 'する', de: 'machen', pos: 'verb', v: { cls: 'irr' } },
    'i-adj': { kana: 'たかい', kanji: '高い', de: 'teuer, hoch', pos: 'i-adj' },
    'na-adj': { kana: 'げんき', kanji: '元気', de: 'gesund, munter', pos: 'na-adj' },
  };
  const adjPos = (form) => (form.id.startsWith('a-na') ? 'na-adj' : 'i-adj');
  // Das Wort, mit dem die Station auf der Karte beschriftet wird
  F.sampleWord = (form) => (form.map === 'verb' ? FALLBACK.u : FALLBACK[adjPos(form)]);

  // Beispielwörter für das Fenster einer Station: Verben je eines pro Verbgruppe, Adjektive bis zu zwei
  F.samples = (form, vocab, rnd = Math.random) => {
    const pick = (list, n) => {
      const pool = list.slice(), out = [];
      while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      return out;
    };
    const words = (vocab || []).filter((w) => w && w.kana);
    if (form.map === 'verb') {
      return ['u', 'ru', 'irr'].map((cls) => pick(words.filter((w) => w.pos === 'verb' && w.v && w.v.cls === cls), 1)[0] || FALLBACK[cls]);
    }
    const pos = adjPos(form);
    const own = pick(words.filter((w) => w.pos === pos), 2);
    return own.length ? own : [FALLBACK[pos]];
  };

  const conj = (form, word) => (form.map === 'verb' ? JP.conj(word, form.conj) : JP.adj(word, form.conj));
  // Ein Beispiel: Vorgängerform → Form (in Furigana-Notation); Startstationen haben keinen Vorgänger
  F.example = (form, word) => {
    const prev = form.from.length ? BY_ID.get(form.from[0]) : null;
    return { from: prev ? conj(prev, word) : null, to: conj(form, word) };
  };

  // Strecke zwischen zwei Punkten: gerade auf gleicher Höhe, sonst ein weicher Bogen, der früh abbiegt
  // (so läuft er über bzw. unter den Beschriftungen der Nachbarstationen vorbei)
  F.path = (x1, y1, x2, y2) => {
    if (y1 === y2) return `M${x1} ${y1} L${x2} ${y2}`;
    const mx = x1 + (x2 - x1) * 0.4;
    return `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`;
  };
})(window.App);
