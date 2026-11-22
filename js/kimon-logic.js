/* Nihongo Techō – 鬼門 Kimon: reine Logik
   Kimon (Dämonentor) nennt man im Japanischen etwas, woran man immer wieder scheitert. Hier landen die Wörter,
   die du am häufigsten nicht gewusst hast (wie Ankis „Lernbremse“, aber erst ab 15 Fehlern):
   Fehler beider Richtungen (Lesen und Deutsch → Japanisch bzw. Kanji schreiben) zählen zusammen.
   Ein Wort ist besiegt (退治), wenn jede Karte, bei der es Fehler gab, inzwischen „kann ich“ ist – es bleibt dann unten stehen. */
'use strict';
(function (App) {
  const K = App.kimonLogic = {};
  const W = App.writeLogic;

  K.MIN = 15;
  // Stärkste Stufe zuerst
  K.TIERS = [
    { k: 'oo', min: 40, jp: '大鬼', label: 'Erzfeind' },
    { k: 'oni', min: 25, jp: '鬼', label: 'Hartnäckig' },
    { k: 'ko', min: 15, jp: '小鬼', label: 'Lernbremse' },
  ];
  K.BEATEN = { k: 'beaten', jp: '退治', label: 'Besiegt' };
  K.TYPES = ['vocab', 'phrase', 'kanji'];

  K.tier = (n) => K.TIERS.find((t) => n >= t.min) || null;

  const lapses = (s) => (s && +s.lapses) || 0;

  // Zeilen der Wand: nicht besiegte nach Fehlern absteigend, besiegte darunter
  K.rows = (items, srs, min = K.MIN) => {
    const out = [];
    for (const it of items) {
      if (!it || !K.TYPES.includes(it.type) || it.char === '々') continue;
      const r = srs.get(it.id), a = srs.get(W.id(it.id));
      const read = lapses(r), active = lapses(a), total = read + active;
      if (total < min) continue;
      const failed = [read ? r : null, active ? a : null].filter(Boolean);
      out.push({ it, read, active, total, tier: K.tier(total), beaten: failed.every(W.isKnown) });
    }
    return out.sort((x, y) => (x.beaten - y.beaten) || (y.total - x.total));
  };

  // Karten für die Übungsrunde: nur Unbesiegte, je Richtung mit Fehlern eine Karte (Kanji aktiv = schreiben)
  K.entries = (rows) => rows.filter((r) => !r.beaten).flatMap((r) => {
    const e = [];
    if (r.read) e.push({ it: r.it, kind: 'read', dir: 'jp' });
    if (r.active) e.push(r.it.type === 'kanji' ? { it: r.it, kind: 'write', pad: true } : { it: r.it, kind: 'active', dir: 'de' });
    return e;
  });
})(window.App);
