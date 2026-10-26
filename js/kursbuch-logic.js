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

  // Eigenes Notizbuch: Kapitel in der Reihenfolge von chapterIds; Blätter des Hefts, die dort fehlen (z. B. nach dem Zusammenführen), hinten
  const bookChapters = (book, files) => {
    const own = files.filter((f) => f.bookId === book.id), byId = new Map(own.map((f) => [f.id, f]));
    const out = (book.chapterIds || []).map((id) => byId.get(id)).filter(Boolean), seen = new Set(out.map((f) => f.id));
    return out.concat(own.filter((f) => !seen.has(f.id)).sort((a, b) => (a.created || 0) - (b.created || 0)));
  };
  // Grammatikpunkte eines Hefts: die auf den Seiten verknüpften, jeder nur einmal – bei der ersten Seite, auf der er steht
  const topicsFromLinks = (pgs, isGrammar) => {
    const seen = new Set(), out = [];
    pgs.forEach((p) => p.linkIds.forEach((id) => { if (!seen.has(id) && isGrammar(id)) { seen.add(id); out.push({ itemId: id, sessionId: p.sessionId }); } }));
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

  // Farbfamilien der Notizbücher: Einband, Schrift auf den Reitern und vier Reiter-Töne derselben Familie
  const FAMILIES = [
    { key: 'salbei', name: 'Salbei', cover: '#2f4a3c', ink: '#22382c', tabs: ['#cfe6d6', '#b3d6bf', '#e2f0e6', '#a3cbb0'] },
    { key: 'sakura', name: 'Sakura', cover: '#a8506f', ink: '#6b2a45', tabs: ['#f7cfdc', '#f0b6ca', '#fbe3eb', '#e9a3bb'] },
    { key: 'lavendel', name: 'Lavendel', cover: '#5f4482', ink: '#4a2f5e', tabs: ['#e2d4f3', '#d0bdea', '#eee5f9', '#c2abe0'] },
    { key: 'himmel', name: 'Himmel', cover: '#36597a', ink: '#24405c', tabs: ['#cfe0f0', '#b6d0e8', '#e2edf7', '#a4c2df'] },
    { key: 'pfirsich', name: 'Pfirsich', cover: '#b0603a', ink: '#7a3a1c', tabs: ['#fbd9c2', '#f5c4a4', '#fde8da', '#eeb18c'] },
    { key: 'senf', name: 'Senf', cover: '#9a7a22', ink: '#5e4a12', tabs: ['#f5e6b0', '#eed98c', '#faf0cd', '#e6cc76'] },
    { key: 'tinte', name: 'Tinte', cover: '#2b3152', ink: '#262b48', tabs: ['#d5d8ec', '#c1c6e2', '#e5e7f4', '#b0b6d8'] },
    { key: 'kakao', name: 'Kakao', cover: '#5e4030', ink: '#4a3226', tabs: ['#ead9c8', '#dfc6ad', '#f3e8dd', '#d3b597'] },
  ];
  // Hefte ohne eigene Wahl: dieselbe Reihenfolge wie bisher die Karten in der Bibliothek (lila, rosa, grün)
  const HEFT_ROW = ['lavendel', 'sakura', 'salbei'];
  const HEX = /^#[0-9a-f]{6}$/i;
  const family = (key, fallback) => FAMILIES.find((f) => f.key === key) || FAMILIES.find((f) => f.key === fallback) || FAMILIES[0];
  const familyOfTone = (hex) => FAMILIES.find((f) => f.tabs.includes(String(hex).toLowerCase()));
  // Schrift auf einem Reiter: die dunkle Farbe der Familie, aus der der Ton stammt
  const tabInk = (hex) => (familyOfTone(hex) || { ink: '#4a3a3f' }).ink;
  // Farben eines Buchs. stored: { color, tabColors: { abschnittId: '#hex' } } (fehlt = Standard)
  // Jeder Abschnitt ohne eigene Wahl bekommt reihum einen Ton der Buch-Familie.
  const bookColors = (stored, sectionIds, fallback) => {
    const s = stored || {}, fam = family(s.color, fallback), own = s.tabColors || {};
    const tabs = {};
    sectionIds.forEach((id, i) => { tabs[id] = HEX.test(own[id] || '') ? own[id].toLowerCase() : fam.tabs[i % fam.tabs.length]; });
    return { family: fam, cover: fam.cover, tabs };
  };
  // Buchfarbe wechseln: eigene Reiter-Töne der alten Familie wandern auf denselben Ton der neuen, andere bleiben
  const recolor = (stored, key, fallback) => {
    const s = stored || {}, from = family(s.color, fallback), to = family(key);
    const tabColors = {};
    Object.entries(s.tabColors || {}).forEach(([id, hex]) => {
      if (!HEX.test(hex || '')) return;
      const k = from.tabs.indexOf(hex.toLowerCase());
      tabColors[id] = k >= 0 ? to.tabs[k] : hex.toLowerCase();
    });
    return Object.assign({}, s, { color: to.key, tabColors });
  };
  // Reiter-Ton setzen (null = wieder automatisch passend)
  const setTab = (stored, id, hex) => {
    const s = stored || {}, tabColors = Object.assign({}, s.tabColors);
    if (hex && HEX.test(hex)) tabColors[id] = hex.toLowerCase(); else delete tabColors[id];
    return Object.assign({}, s, { tabColors });
  };

  const K = { ZOOM_MAX, clampZoom, stepZoom, TOC_ROWS, courseSessions, pages, topics, bookChapters, topicsFromLinks, sessionPage, topicPage, tocSpreads, chunk, leafOf, spreadOfPage, spreadCount,
    FAMILIES, HEFT_ROW, family, tabInk, bookColors, recolor, setTab };
  if (typeof module !== 'undefined' && module.exports) module.exports = K; else root.App.kursbuchLogic = K;
})(this);
