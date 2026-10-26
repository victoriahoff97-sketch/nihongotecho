/* Nihongo Techō – Verb- und Adjektivformen für Konjugieren (reine Daten und Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const F = App.formMap = {};

  // Jede Formenfamilie ist eine Linie mit eigener Farbe; label = Name der Familie, wie ihn Lernende kennen (nicht „Linie“)
  F.LINES = {
    start: { label: 'Grundform', color: 'var(--muted)' },
    masu: { label: 'ます-Formen', color: 'var(--murasaki)' },
    te: { label: 'て-, た- und たり-Form', color: 'var(--sora)' },
    nai: { label: 'ない-Formen', color: 'var(--daidai)' },
    pot: { label: 'Potentialform', color: 'var(--matcha)' },
    vol: { label: 'Volitionalform', color: 'var(--shu)' },
    i: { label: 'い-Adjektive', color: 'var(--ai)' },
    na: { label: 'な-Adjektive', color: 'var(--sakura)' },
  };

  // map = verb | adj · from = Formen, aus denen man diese ableitet (leer = Grundform) · conj = Schlüssel für JP.conj bzw. JP.adj
  // ask = Frage beim Üben, wo der Name nur die Endung wäre · rule = Bildungsregel, die beim Aufdecken steht
  F.FORMS = [
    { id: 'v-dict', map: 'verb', line: 'start', from: [], label: 'Wörterbuchform', conj: 'dict',
      rule: 'Die Grundform, wie sie im Wörterbuch steht. Aus ihr leitest du alle anderen Formen ab – je nach Verbgruppe (う-Verb, る-Verb oder unregelmäßig) etwas anders.' },
    { id: 'v-stem', map: 'verb', line: 'masu', from: ['v-dict'], label: 'ます-Stamm', conj: 'stem',
      rule: 'る-Verben: る weglassen. う-Verben: die letzte Silbe von der u-Reihe in die i-Reihe (く → き, む → み). する → し, くる → き.' },
    { id: 'v-masu', map: 'verb', line: 'masu', from: ['v-stem'], label: 'ます-Form', ask: 'ます-Form (höflich)', conj: 'masu',
      rule: 'ます-Stamm + ます.' },
    { id: 'v-mashita', map: 'verb', line: 'masu', from: ['v-masu'], label: 'ました', ask: 'Past Positiv (höflich)', conj: 'mashita',
      rule: 'Vergangenheit: ます → ました.' },
    { id: 'v-masen', map: 'verb', line: 'masu', from: ['v-masu'], label: 'ません', ask: 'Present Negativ (höflich)', conj: 'masen',
      rule: 'Verneinung: ます → ません. Kurzform: ない-Form.' },
    { id: 'v-masendeshita', map: 'verb', line: 'masu', from: ['v-masen'], label: 'ませんでした', ask: 'Past Negativ (höflich)', conj: 'masendeshita',
      rule: 'Verneinte Vergangenheit: ません + でした. Kurzform: なかった-Form.' },
    { id: 'v-mashou', map: 'verb', line: 'masu', from: ['v-masu'], label: 'ましょう', ask: '„Lass uns …“ (höflich)', conj: 'mashou',
      rule: 'ます → ましょう: „Lass uns …“.' },
    { id: 'v-tai', map: 'verb', line: 'masu', from: ['v-stem'], label: 'たい-Form', conj: 'taiplain',
      rule: 'ます-Stamm + たい: „möchte …“. Danach beugt sich たい wie ein い-Adjektiv (たくない, たかった).' },
    { id: 'v-te', map: 'verb', line: 'te', from: ['v-dict'], label: 'て-Form', conj: 'te',
      rule: 'る-Verben: る → て. う-Verben nach der Endung: う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して. Ausnahme: 行く → 行って. する → して, くる → きて.' },
    { id: 'v-ta', map: 'verb', line: 'te', from: ['v-te'], label: 'た-Form', ask: 'た-Form (kurz)', conj: 'ta',
      rule: 'て-Form nehmen und て → た tauschen (で → だ).' },
    { id: 'v-tari', map: 'verb', line: 'te', from: ['v-ta'], label: 'たり-Form', conj: 'tari',
      rule: 'た-Form + り.' },
    { id: 'v-nai', map: 'verb', line: 'nai', from: ['v-dict'], label: 'ない-Form', ask: 'ない-Form (kurz)', conj: 'nai',
      rule: 'る-Verben: る → ない. う-Verben: die letzte Silbe in die a-Reihe + ない (く → かない, う → わない). する → しない, くる → こない, ある → ない.' },
    { id: 'v-nakatta', map: 'verb', line: 'nai', from: ['v-nai'], label: 'なかった-Form', ask: 'Past Negativ (kurz)', conj: 'nakatta',
      rule: 'ない → なかった. (ない beugt sich wie ein い-Adjektiv.)' },
    { id: 'v-naide', map: 'verb', line: 'nai', from: ['v-nai'], label: 'ないで-Form', conj: 'naide',
      rule: 'ない-Form + で.' },
    { id: 'v-pot', map: 'verb', line: 'pot', from: ['v-dict'], label: 'Potentialform', conj: 'potential',
      rule: '„Können“: る-Verben: る → られる. う-Verben: die letzte Silbe in die e-Reihe + る (く → ける, む → める). する → できる, くる → こられる. Das Ergebnis beugt sich wie ein る-Verb. Umgangssprachlich hört man bei る-Verben auch die Kurzform (食べれる).' },
    { id: 'v-vol', map: 'verb', line: 'vol', from: ['v-dict'], label: 'Volitionalform', conj: 'volitional',
      rule: 'Die Kurzform von 〜ましょう: る-Verben: る → よう. う-Verben: die letzte Silbe in die o-Reihe + う (く → こう, む → もう). する → しよう, くる → こよう.' },

    { id: 'a-i', map: 'adj', line: 'start', from: [], label: 'い-Adjektiv', conj: 'plain',
      rule: 'Die Grundform endet auf い. Zum Beugen fällt das letzte い weg. Ausnahme: いい beugt sich als よ- (よくない, よかった).' },
    { id: 'a-i-neg', map: 'adj', line: 'i', from: ['a-i'], label: 'くない', ask: 'Present Negativ (kurz)', conj: 'negp',
      rule: 'Verneinung, Kurzform: い → くない.' },
    { id: 'a-i-pastneg', map: 'adj', line: 'i', from: ['a-i-neg'], label: 'くなかった', ask: 'Past Negativ (kurz)', conj: 'pastnegp',
      rule: 'Verneinte Vergangenheit, Kurzform: くない → くなかった.' },
    { id: 'a-i-neg-desu', map: 'adj', line: 'i', from: ['a-i'], label: 'くないです', ask: 'Present Negativ (höflich)', conj: 'neg',
      rule: 'Verneinung, höflich: い → くないです.' },
    { id: 'a-i-pastneg-desu', map: 'adj', line: 'i', from: ['a-i-neg-desu'], label: 'くなかったです', ask: 'Past Negativ (höflich)', conj: 'pastneg',
      rule: 'Verneinte Vergangenheit, höflich: くないです → くなかったです.' },
    { id: 'a-i-past', map: 'adj', line: 'i', from: ['a-i'], label: 'かった', ask: 'Past Positiv (kurz)', conj: 'pastp',
      rule: 'Vergangenheit, Kurzform: い → かった.' },
    { id: 'a-i-past-desu', map: 'adj', line: 'i', from: ['a-i-past'], label: 'かったです', ask: 'Past Positiv (höflich)', conj: 'past',
      rule: 'Vergangenheit, höflich: かった + です. Nie 〜いでした.' },
    { id: 'a-i-te', map: 'adj', line: 'i', from: ['a-i'], label: 'くて', ask: 'て-Form', conj: 'te',
      rule: 'て-Form zum Verbinden: い → くて.' },
    { id: 'a-na', map: 'adj', line: 'start', from: [], label: 'な-Adjektiv', conj: 'plain',
      rule: 'Die Grundform steht ohne な. Vor einem Nomen kommt な dazu (元気な人), sonst beugt sie sich wie ein Nomen mit です.' },
    { id: 'a-na-neg', map: 'adj', line: 'na', from: ['a-na'], label: 'じゃない', ask: 'Present Negativ (kurz)', conj: 'negp',
      rule: 'Verneinung, Kurzform: Grundform + じゃない.' },
    { id: 'a-na-pastneg', map: 'adj', line: 'na', from: ['a-na-neg'], label: 'じゃなかった', ask: 'Past Negativ (kurz)', conj: 'pastnegp',
      rule: 'Verneinte Vergangenheit, Kurzform: じゃない → じゃなかった.' },
    { id: 'a-na-neg-desu', map: 'adj', line: 'na', from: ['a-na'], label: 'じゃないです', ask: 'Present Negativ (höflich)', conj: 'neg',
      rule: 'Verneinung, höflich: Grundform + じゃないです.' },
    { id: 'a-na-pastneg-desu', map: 'adj', line: 'na', from: ['a-na-neg-desu'], label: 'じゃなかったです', ask: 'Past Negativ (höflich)', conj: 'pastneg',
      rule: 'Verneinte Vergangenheit, höflich: じゃないです → じゃなかったです.' },
    { id: 'a-na-past', map: 'adj', line: 'na', from: ['a-na'], label: 'でした', ask: 'Past Positiv (höflich)', conj: 'past',
      rule: 'Vergangenheit, höflich: Grundform + でした.' },
    { id: 'a-na-pastp', map: 'adj', line: 'na', from: ['a-na'], label: 'だった', ask: 'Past Positiv (kurz)', conj: 'pastp',
      rule: 'Vergangenheit, Kurzform: Grundform + だった.' },
    { id: 'a-na-te', map: 'adj', line: 'na', from: ['a-na'], label: 'で', ask: 'て-Form', conj: 'te',
      rule: 'て-Form zum Verbinden: Grundform + で.' },
  ];
  const BY_ID = new Map(F.FORMS.map((f) => [f.id, f]));
  F.form = (id) => BY_ID.get(id);
  // Fest hinterlegte Beispielwörter für die Beschriftung der Formen
  const FALLBACK = {
    u: { kana: 'かく', kanji: '書く', de: 'schreiben', pos: 'verb', v: { cls: 'u' } },
    'i-adj': { kana: 'たかい', kanji: '高い', de: 'teuer, hoch', pos: 'i-adj' },
    'na-adj': { kana: 'げんき', kanji: '元気', de: 'gesund, munter', pos: 'na-adj' },
  };
  const adjPos = (form) => (form.id.startsWith('a-na') ? 'na-adj' : 'i-adj');
  // Das Wort, an dem eine Form gezeigt wird (z. B. 書く → 書いて)
  F.sampleWord = (form) => (form.map === 'verb' ? FALLBACK.u : FALLBACK[adjPos(form)]);

  const conj = (form, word) => (form.map === 'verb' ? JP.conj(word, form.conj) : JP.adj(word, form.conj));
  // Ein Beispiel: Vorgängerform → Form (in Furigana-Notation); Grundformen haben keinen Vorgänger
  F.example = (form, word) => {
    const prev = form.from.length ? BY_ID.get(form.from[0]) : null;
    return { from: prev ? conj(prev, word) : null, to: conj(form, word) };
  };
})(window.App);
