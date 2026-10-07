/* Nihongo Techō – Furigana in der Abfrage: Lesung nur über Kanji, die man noch nicht lesen kann */
'use strict';
(function (App) {
  const JP = App.jp;
  const F = App.furiLogic = {};
  F.KNOWN_IVL = 21; // ab 3 Wochen Abstand gilt ein mit Karten geübtes Kanji als „kann ich lesen“ – wie beim Schreiben

  // Gelernt: als „Kann ich“ eingestuft oder mit Karten bis zum langen Abstand geübt – daran hängt auch der Lernstand „Kann ich“
  F.readKnown = (srs, id) => { const s = srs.get(id); return !!s && s.check !== 'unchecked' && (s.check === 'known' || (s.reps > 0 && s.ivl >= F.KNOWN_IVL)); };

  // Liefert eine Funktion Zeichen → „kann ich lesen“. Kanji ohne Eintrag in der Sammlung gelten als unbekannt.
  F.knownChars = (items, srs) => {
    const ids = new Map();
    for (const it of items.values()) if (it.type === 'kanji' && it.char) ids.set(it.char, it.id);
    return (c) => ids.has(c) && F.readKnown(srs, ids.get(c));
  };

  // Frageseite eines Worts oder Ausdrucks. known = null: Furigana über allen Kanji.
  // Die Lesung liegt je Kanji-Gruppe vor (午前 → ごぜん), deshalb fällt sie erst weg, wenn alle Kanji der Gruppe bekannt sind.
  F.wordHtml = (it, known) => {
    const s = it.type === 'vocab' ? (it.kanji ? JP.notate(it.kanji, it.kana) : it.kana || '') : it.jp;
    return JP.ruby(s, known && ((base) => Array.from(base).every((c) => c === '々' || !JP.hasKanji(c) || known(c))));
  };

  // Einstellung furiKnown: hide = bei gelernten Kanji ausblenden (Standard) · show = trotzdem anzeigen
  App.askHtml = (it) => F.wordHtml(it, App.store.settings.furiKnown === 'show' ? null : F.knownChars(App.store.items, App.store.srs));
})(window.App);
