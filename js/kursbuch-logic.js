/* Nihongo Techō – Kurs-Notizbuch: reine Logik (Seitenfolge, Inhaltsverzeichnis). Browser: App.kursbuchLogic, Node: module.exports */
'use strict';
(function (root) {
  // Zeilen pro Seite im Inhaltsverzeichnis (die Seite ist 30em breit und rund 42em hoch)
  const TOC_ROWS = 14;
  const trimC = (c) => String(c || '').trim();

  // Stunden eines Kurses, älteste zuerst (course '' = Stunden ohne Kurs)
  const courseSessions = (sessions, course) => sessions.filter((s) => trimC(s.course) === trimC(course))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (+a.number || 0) - (+b.number || 0));

  // Seitenfolge des Buchs. sessions: älteste zuerst, je { id, sheets: [{ id, pages: [{ inked, linkIds }] }] }.
  // Leere Seiten am Ende eines Blatts fallen weg, leere Seiten mittendrin bleiben (die Doppelseiten bleiben zusammen).
  // Dadurch beginnt jede Stunde links – außer die rechte Seite davor blieb leer, dann rückt sie dorthin nach.
  const pages = (sessions) => {
    const out = [];
    sessions.forEach((s) => (s.sheets || []).forEach((sh) => {
      let last = -1;
      sh.pages.forEach((p, i) => { if (p.inked) last = i; });
      for (let i = 0; i <= last; i++) out.push({ sessionId: s.id, fileId: sh.id, page: i, linkIds: sh.pages[i].linkIds || [] });
    }));
    return out;
  };

  // Grammatikpunkte des Kurses, jeder nur einmal – bei der ersten Stunde, in der er vorkommt
  const topics = (sessions) => {
    const seen = new Set(), out = [];
    sessions.forEach((s) => (s.grammarIds || []).forEach((id) => { if (!seen.has(id)) { seen.add(id); out.push({ itemId: id, sessionId: s.id }); } }));
    return out;
  };

  const sessionPage = (pgs, sessionId) => pgs.findIndex((p) => p.sessionId === sessionId);
  // Wo steht ein Grammatikpunkt? Auf der Seite, auf der er markiert ist – sonst am Anfang seiner Stunde
  const topicPage = (pgs, itemId, sessionId) => {
    const i = pgs.findIndex((p) => p.linkIds.includes(itemId));
    return i >= 0 ? i : sessionPage(pgs, sessionId);
  };

  // Inhaltsverzeichnis: links die Stunden, rechts die Themen – so viele Doppelseiten wie nötig
  const tocSpreads = (nSessions, nTopics) => Math.max(1, Math.ceil(nSessions / TOC_ROWS), Math.ceil(nTopics / TOC_ROWS));
  const chunk = (list, i) => list.slice(i * TOC_ROWS, (i + 1) * TOC_ROWS);
  // Blatt (0-basiert, über das ganze Buch) bzw. Doppelseite einer Notizseite
  const leafOf = (pageIdx, toc) => 2 * toc + pageIdx;
  const spreadOfPage = (pageIdx, toc) => Math.floor(leafOf(pageIdx, toc) / 2);
  const spreadCount = (nPages, toc) => toc + Math.ceil(nPages / 2);

  // Zoom: 100 % = ganze Doppelseite; die Knöpfe gehen in festen Stufen, Finger und Mausrad stufenlos
  const ZOOM_MAX = 4, ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4];
  const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(1, +z || 1));
  const stepZoom = (z, dir) => {
    const next = dir > 0 ? ZOOM_STEPS.find((s) => s > z + 0.01) : ZOOM_STEPS.slice().reverse().find((s) => s < z - 0.01);
    return next || clampZoom(z);
  };

  const K = { ZOOM_MAX, clampZoom, stepZoom, TOC_ROWS, courseSessions, pages, topics, sessionPage, topicPage, tocSpreads, chunk, leafOf, spreadOfPage, spreadCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = K; else root.App.kursbuchLogic = K;
})(this);
