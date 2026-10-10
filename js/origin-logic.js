/* Nihongo Techō – Herkunft einer Lernrunde: Logik ohne DOM (von welcher Seite kam man in den Lernbereich, wohin geht es danach zurück) */
'use strict';
(function (App) {
  const O = App.originLogic = {};
  const norm = (hash) => (!hash || hash === '#' ? '#/' : hash);
  const pathOf = (hash) => norm(hash).slice(1).split('?')[0];
  const inPractice = (p) => p === '/ueben' || p.startsWith('/ueben/');
  // Seitenwechsel: liefert die neue Herkunft und – bei der Rückkehr dorthin – die Scroll-Position zum Wiederherstellen
  O.step = (origin, oldHash, newHash, scroll) => {
    const oldP = pathOf(oldHash), newP = pathOf(newHash);
    if (newP.startsWith('/ueben/')) {
      // Einstieg von außerhalb merken; Runde → Runde und der Weg über „Üben“ ändern nichts
      return { origin: inPractice(oldP) ? origin || null : { hash: norm(oldHash), scroll: scroll || 0 }, restore: null };
    }
    const back = origin && inPractice(oldP) && norm(newHash) === origin.hash;
    return { origin: null, restore: back ? origin.scroll : null };
  };
  // name: für die Zeile oben · to: für den Knopf „Zurück …“
  const LABELS = [
    ['/grammatik', 'Grammatik', 'zur Grammatik'], ['/karte', 'Lernlandkarte', 'zur Lernlandkarte'], ['/vokabeln', 'Vokabeln', 'zu den Vokabeln'],
    ['/kanji', 'Kanji', 'zu den Kanji'], ['/ausdruecke', 'Ausdrücke', 'zu den Ausdrücken'], ['/gleichklang', 'Gleichklang', 'zum Gleichklang'],
    ['/anwenden', 'Anwenden', 'zu Anwenden'], ['/unterricht', 'Unterricht', 'zum Unterricht'], ['/bibliothek', 'Bibliothek', 'zur Bibliothek'],
    ['/aufgabe', 'Buchaufgabe', 'zur Buchaufgabe'], ['/suche', 'Suche', 'zur Suche'], ['/eingang', 'Eingang', 'zum Eingang'], ['/saetze', 'Sätze', 'zu den Sätzen'],
  ];
  O.label = (hash) => {
    const p = pathOf(hash);
    if (p === '/') return { name: 'Start', to: 'zur Startseite' };
    const l = LABELS.find(([base]) => p === base || p.startsWith(base + '/'));
    return l ? { name: l[1], to: l[2] } : { name: 'Zurück', to: '' };
  };
  // Merker `nt-origin` lesen; unlesbar = keine Herkunft
  O.read = (ssGet) => { try { const o = JSON.parse(ssGet('nt-origin')); return o && typeof o.hash === 'string' ? { hash: o.hash, scroll: +o.scroll || 0 } : null; } catch (e) { return null; } };
})(window.App);
