/* Nihongo Techō – Partikel-Muster und Verbklasse für eigene Verben aus dem Verb-Index der JLPT-Pakete (packs/verb-index.js). Browser: App.verbLogic, Node: module.exports */
'use strict';
(function (root) {
  const E = typeof module !== 'undefined' && module.exports ? require('./example-logic.js') : root.App.exampleLogic;

  // Index: Schlüssel wie example-logic → [Klasse, Partikel-Muster, deutsche Bedeutung]
  const isVerb = (it) => !!it && it.type === 'vocab' && (!it.pos || it.pos === 'verb');
  const hasUse = (it) => Array.isArray(it.use) && it.use.some((u) => u && u.jp);
  const hasCls = (it) => !!(it.v && it.v.cls);
  const needs = (it) => isVerb(it) && (!hasUse(it) || !hasCls(it));

  // {cls, use} zum Wort oder null
  const find = (index, it) => {
    const k = E.findKey(index, it);
    return k ? { cls: index.v[k][0], use: index.v[k][1] } : null;
  };

  // Ergänzt nur, was fehlt – selbst eingetragene Muster und Klassen bleiben; true = geändert
  const fill = (index, it) => {
    if (!needs(it)) return false;
    const hit = find(index, it);
    if (!hit) return false;
    let changed = false;
    if (!hasUse(it) && hit.use && hit.use.length) { it.use = hit.use.map((u) => ({ jp: u.jp, de: u.de })); changed = true; }
    if (!hasCls(it) && hit.cls) { it.v = Object.assign({}, it.v, { cls: hit.cls }); changed = true; }
    return changed;
  };

  const api = { needs, find, fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.verbLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
