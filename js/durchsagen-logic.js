/* Nihongo Techō – „Durchsagen verstehen“: Lernstand und Adressen (reine Logik, getestet)
   Lernstand in settings.durchsagen: { <id>: { ok: true|false, n: Anzahl Versuche, at: 'JJJJ-MM-TT' } } */
'use strict';
(function (App) {
  const D = App.durchsagenLogic = {};
  D.embedUrl = (c) => `https://www.youtube-nocookie.com/embed/${c.yt}?start=${c.from}&end=${c.to}&rel=0&playsinline=1&enablejsapi=1&cc_load_policy=0`;
  D.watchUrl = (c) => `https://www.youtube.com/watch?v=${c.yt}${c.from ? `&t=${c.from}s` : ''}`;
  D.secs = (c) => c.to - c.from;
  D.len = (c) => { const s = D.secs(c); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // Zustand eines Ausschnitts: 'neu' | 'richtig' | 'nochmal'
  D.status = (res, id) => { const r = res && res[id]; return !r ? 'neu' : r.ok ? 'richtig' : 'nochmal'; };
  // Selbst eingestuft: neuer Lernstand (das Original bleibt unverändert)
  D.record = (res, id, ok, day) => {
    const old = (res && res[id]) || { n: 0 };
    return { ...(res || {}), [id]: { ok: !!ok, n: (old.n || 0) + 1, at: day } };
  };
  D.count = (list, res) => ({ ok: list.filter((c) => D.status(res, c.id) === 'richtig').length, total: list.length });
  // Gruppen in fester Reihenfolge, leere weglassen
  D.groups = (list, groups) => groups.map(([key, label]) => ({ key, label, items: list.filter((c) => c.group === key) })).filter((g) => g.items.length);
})(window.App);
