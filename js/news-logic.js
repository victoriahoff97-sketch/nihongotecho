/* Nihongo Techō – „Was ist neu“: welche Update-Notizen zeigen? Logik ohne DOM (in Node getestet) */
'use strict';
(function (App) {
  const N = App.newsLogic = {};
  N.MAX = 3; // höchstens die drei neuesten Updates auf einmal

  // news: neueste zuerst; seen: gesehene ids oder null (Gerät hat noch nie Neuigkeiten gesehen)
  // fresh: noch nichts Eigenes auf dem Gerät – neue Nutzer bekommen keine Neuigkeiten, nur den Merker
  N.pick = ({ news = [], seen = null, fresh = false } = {}) => {
    const ids = news.map((n) => n.id);
    if (seen == null && fresh) return { show: [], seen: ids };
    const known = new Set(seen || []);
    return { show: news.filter((n) => !known.has(n.id)).slice(0, N.MAX), seen: ids };
  };

  N.parse = (raw) => {
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v.map(String) : null; } catch (e) { return null; }
  };
})(window.App);
