/* Nihongo Techō – Zurück-Taste: Logik ohne DOM (wie viele Seiten liegen in diesem Tab hinter der jetzigen) */
'use strict';
(function (App) {
  const N = App.navLogic = {};
  // Schrittnummer aus dem Verlaufseintrag lesen; fehlt sie, ist der Eintrag neu
  N.read = (state) => (state && Number.isInteger(state.ntIdx) && state.ntIdx >= 0 ? state.ntIdx : null);
  // Start und Neuladen: gemerkte Nummer weiterführen, sonst ist dies die erste Seite
  N.boot = (state) => { const i = N.read(state); return i == null ? 0 : i; };
  // Seitenwechsel: Vor/Zurück im Verlauf bringt die Nummer mit, eine neue Seite liegt eins hinter der bisherigen
  N.step = (state, cur) => { const i = N.read(state); return i == null ? cur + 1 : i; };
  N.canBack = (idx) => idx > 0;
  // Nummer im Eintrag ablegen, ohne anderes darin zu verlieren
  N.stamp = (state, idx) => Object.assign({}, state && typeof state === 'object' ? state : null, { ntIdx: idx });
})(window.App);
