/* Nihongo Techō – Sortierung der Listen Vokabeln, Grammatik und Kanji (reine Logik, ohne DOM)
   Standard „Lektion“ = wie bisher nach Quelle + Lektion gruppiert.
   „Niveau“ = Gruppen N5 … N1 (aufsteigend) oder N1 … N5 (absteigend); Einträge ohne Niveau immer am Ende.
   Innerhalb einer Niveau-Gruppe bleibt die Lektions-Reihenfolge (byLesson der Seite).
   Gemerkt pro Gerät und Seite (localStorage „nt-listSort-<typ>“), siehe views.js. */
'use strict';
(function (App) {
  const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const KEYS = {
    lesson: 'Lektion',
    lvlUp: 'N5 → N1',
    lvlDown: 'N1 → N5',
  };
  const NONE = 'Ohne Niveau';
  const sortKey = (v) => (Object.prototype.hasOwnProperty.call(KEYS, v) ? v : 'lesson');
  const isLevel = (k) => k === 'lvlUp' || k === 'lvlDown';
  const levelOf = (it) => (it && LEVELS.includes(it.level) ? it.level : '');
  // Rang 0 = erste Gruppe; ohne Niveau bekommt immer den letzten Rang
  const rank = (it, key) => {
    const l = levelOf(it);
    if (!l) return LEVELS.length;
    const i = LEVELS.indexOf(l);
    return key === 'lvlDown' ? LEVELS.length - 1 - i : i;
  };
  // Sortiert eine Kopie; base = Vergleich der Seite für die Lektions-Reihenfolge
  const sort = (items, key, base) => {
    const k = sortKey(key);
    const out = items.slice().sort(base);
    if (!isLevel(k)) return out;
    // stabile Sortierung: innerhalb eines Niveaus bleibt die Lektions-Reihenfolge
    return out.sort((a, b) => rank(a, k) - rank(b, k));
  };
  // Gruppen nach Niveau in Reihenfolge der Sortierung: Map(Überschrift → Einträge)
  const groupByLevel = (sortedItems) => {
    const m = new Map();
    sortedItems.forEach((it) => { const g = levelOf(it) || NONE; if (!m.has(g)) m.set(g, []); m.get(g).push(it); });
    return m;
  };
  App.listSort = { KEYS, NONE, sortKey, isLevel, levelOf, sort, groupByLevel };
})(window.App = window.App || {});
