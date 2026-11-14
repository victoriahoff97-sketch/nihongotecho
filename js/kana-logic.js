/* Nihongo Techō – Kana schreiben: Hiragana und Katakana als feste Liste (kein Eintrag in der Sammlung), Logik ohne DOM */
'use strict';
(function (App) {
  // Jedes Kana hat die Id „kana:<Zeichen>“; der Schreib-Stand liegt wie bei Kanji unter „w:<Id>“ im Speicher „srs“ –
  // so laufen Bewerten, Rückgängig, Backup und „Jetzt wiederholen“ ohne Sonderweg. Strichfolgen bringt data/kanjivg.js mit.
  const K = App.kanaLogic = {};
  const W = App.writeLogic;
  // Tabelle in der Reihenfolge, in der man sie lernt; Laute, die doppelt vorkommen, bekommen einen Hinweis
  const ROWS = [
    ['あ', 'あいうえお', 'a i u e o'], ['か', 'かきくけこ', 'ka ki ku ke ko'], ['さ', 'さしすせそ', 'sa shi su se so'],
    ['た', 'たちつてと', 'ta chi tsu te to'], ['な', 'なにぬねの', 'na ni nu ne no'], ['は', 'はひふへほ', 'ha hi fu he ho'],
    ['ま', 'まみむめも', 'ma mi mu me mo'], ['や', 'やゆよ', 'ya yu yo'], ['ら', 'らりるれろ', 'ra ri ru re ro'],
    ['わ', 'わをん', 'wa wo_(Partikel_o) n'],
    ['が', 'がぎぐげご', 'ga gi gu ge go', 1], ['ざ', 'ざじずぜぞ', 'za ji zu ze zo', 1],
    ['だ', 'だぢづでど', 'da ji_(von_chi) zu_(von_tsu) de do', 1], ['ば', 'ばびぶべぼ', 'ba bi bu be bo', 1], ['ぱ', 'ぱぴぷぺぽ', 'pa pi pu pe po', 1],
  ];
  K.SCRIPTS = { h: 'Hiragana', k: 'Katakana' };
  const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  K.id = (ch) => 'kana:' + ch;
  K.isId = (id) => typeof id === 'string' && id.startsWith('kana:');

  const build = (script) => ROWS.map(([label, chars, romaji, daku]) => {
    const rs = romaji.split(' ').map((r) => r.replace(/_/g, ' '));
    const lab = script === 'k' ? toKata(label) : label;
    const items = Array.from(chars).map((h, i) => {
      const char = script === 'k' ? toKata(h) : h;
      return { id: K.id(char), type: 'kana', char, romaji: rs[i], script, row: lab, daku: !!daku };
    });
    return { label: lab, daku: !!daku, items };
  });
  const TABLE = { h: build('h'), k: build('k') };
  const BY_ID = new Map();
  Object.values(TABLE).forEach((rows) => rows.forEach((r) => r.items.forEach((it) => BY_ID.set(it.id, it))));

  K.rows = (script) => TABLE[script === 'k' ? 'k' : 'h'];
  K.items = (script) => (script ? K.rows(script).flatMap((r) => r.items) : K.items('h').concat(K.items('k')));
  K.item = (id) => BY_ID.get(id) || null;
  // „ka“ als Aufgabe; bei Katakana mit Hinweis, welche Schrift gemeint ist
  K.prompt = (it) => it.romaji;

  // Runde: fällige (älteste zuerst) aus beiden Schriften, neue nur aus der gewählten – in der Reihenfolge der Tabelle.
  // Freigeschaltet ist jedes Kana sofort (anders als Kanji, die man erst lesen können muss).
  K.queue = (srs, now, script) => Object.assign({ items: K.items(script) }, W.queue(K.items(script), srs, now, () => true, K.items()));
  K.counts = (items, srs) => W.counts(items, srs, () => true);
  K.status = (srs, it) => W.status(srs, it.id);
  // Eine Lernrunde Neues = eine Tabellenzeile (fünf Zeichen) – so viel lässt sich auf einmal gut behalten
  K.NEW_MAX = 5;
})(window.App);
