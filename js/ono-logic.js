/* Nihongo Techō – Lautmalerei (オノマトペ): erkennt Vokabeln wie ごろごろ, わくわく, ドキドキ, しっかり über die
 * JMdict-Liste in js/ono-data.js und gibt ihnen das Schlagwort „lautmalerei“ (reine Logik) */
'use strict';
(function (App) {
  const O = App.ono = {};
  O.TAG = 'lautmalerei';
  O.LABEL = 'Lautmalerei (オノマトペ)';

  // Nachschlage-Index aus App.ONO_DATA ("kana,!kana|kanji,kanji"): kana = Schreibungen, die allein reichen;
  // pairs = „Kanji⇥Kana“ desselben Eintrags (mit „!“ markierte Kana gelten nur so, Gleichklang mit häufigen Wörtern)
  O.index = (rows) => {
    const kana = new Set();
    const pairs = new Set();
    for (const row of rows || []) {
      const [k, j] = String(row).split('|');
      const ks = k ? k.split(',') : [];
      ks.forEach((t) => { if (t[0] !== '!') kana.add(t); });
      for (const kj of (j ? j.split(',') : [])) ks.forEach((t) => pairs.add(kj + '\t' + t.replace(/^!/, '')));
    }
    return { kana, pairs };
  };

  const strip = (s) => String(s ?? '').replace(/[\s　〜～~]/g, '');
  // „ごろごろする“, „わくわくと“, „にこにこ(と)“: die Endung zählt nicht mit
  const bases = (s) => {
    const t = strip(s).replace(/[（(][^)）]*[)）]/g, '');
    const out = [t];
    const m = /^(.+?)(?:する|します|して|と|に)$/.exec(t);
    if (m) out.push(m[1]);
    const n = /^(.+?)(?:為る|する)$/.exec(t);
    if (n) out.push(n[1]);
    return [...new Set(out.filter(Boolean))];
  };
  const hasKanji = (s) => /[㐀-鿿]/.test(s);

  // true = die Vokabel ist ein Lautwort. Mit Kanji geschrieben: nur, wenn Kanji und Lesung zusammen zu einem
  // Eintrag gehören (救急 ist kein きゅうきゅう, 数 かず kein しばしば); sonst über die Kana-Schreibung
  O.is = (idx, it) => {
    if (!idx || !it || it.type !== 'vocab') return false;
    const kj = strip(it.kanji);
    if (kj && hasKanji(kj)) {
      const ks = bases(it.kana);
      return bases(kj).some((b) => ks.some((k) => idx.pairs.has(b + '\t' + k)));
    }
    return [kj, it.kana].filter(Boolean).some((s) => bases(s).some((b) => idx.kana.has(b)));
  };

  // Schlagwort setzen, einmal je Eintrag (onoAuto): wer es von Hand wieder löscht, bekommt es nicht zurück.
  // true = Eintrag geändert
  O.fill = (idx, it) => {
    if (!it || it.type !== 'vocab' || it.onoAuto || !O.is(idx, it)) return false;
    it.onoAuto = true;
    const tags = Array.isArray(it.tags) ? it.tags : [];
    if (!tags.includes(O.TAG)) it.tags = tags.concat(O.TAG);
    return true;
  };

  O.has = (it) => Array.isArray(it.tags) && it.tags.includes(O.TAG);
})(window.App);
