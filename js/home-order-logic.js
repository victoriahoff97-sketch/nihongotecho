/* Nihongo Techō – Startseite: Reihenfolge der Leisten (reine Logik) */
'use strict';
(function (App) {
  // Gemerkt pro Gerät (localStorage „homeOrder“), nicht in den Einstellungen: Surface und iPad dürfen verschieden aussehen.
  // Gespeichert wird nur die Liste der Schlüssel in der gewünschten Reihenfolge.
  const H = App.homeOrderLogic = {};

  H.parse = (raw) => {
    try { const a = JSON.parse(raw || 'null'); return Array.isArray(a) ? a.filter((k) => typeof k === 'string') : null; } catch (e) { return null; }
  };

  // Ordnet die Standard-Schlüssel nach der gemerkten Liste. Unbekannte gemerkte Schlüssel fallen weg;
  // eine neue Leiste (nicht gemerkt) erscheint direkt hinter ihrem Vorgänger aus der Standard-Reihenfolge.
  H.order = (defaults, saved) => {
    if (!saved || !saved.length) return defaults.slice();
    const out = [];
    saved.forEach((k) => { if (defaults.includes(k) && !out.includes(k)) out.push(k); });
    defaults.forEach((k, i) => {
      if (out.includes(k)) return;
      let at = 0;
      for (let j = i - 1; j >= 0; j--) { const p = out.indexOf(defaults[j]); if (p >= 0) { at = p + 1; break; } }
      out.splice(at, 0, k);
    });
    return out;
  };

  // Verschiebt einen Schlüssel um einen Platz nach oben (-1) oder unten (+1) – für die Pfeiltasten am Griff
  H.move = (list, key, dir) => {
    const i = list.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return list.slice();
    const out = list.slice();
    out.splice(i, 1); out.splice(j, 0, key);
    return out;
  };
})(window.App = window.App || {});
