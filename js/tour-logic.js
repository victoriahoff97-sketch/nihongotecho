/* Nihongo Techō – Tutorial: reine Logik (Tour zur Seite, fehlende Ziele, Platz der Sprechblase). Browser: App.tourLogic, Node: module.exports */
'use strict';
(function (root) {
  const GAP = 12;    // Abstand Blase – Ziel
  const MARGIN = 8;  // Mindestabstand zum Fensterrand

  const PAGES = ['/grammatik', '/vokabeln', '/kanji', '/ausdruecke', '/gleichklang', '/ueben', '/anwenden', '/unterricht', '/bibliothek', '/pakete', '/einstellungen'];
  // Seiten ohne eigene Tour zeigen die der Seite, zu der sie gehören
  const ALIAS = { '/karte': '/grammatik', '/saetze': '/vokabeln', '/eingang': 'erweiterung' };

  // Welche Tour gehört zu dieser Adresse? Unterseiten nehmen die Tour ihrer Menüseite.
  const tourKeyFor = (path) => {
    const parts = String(path || '/').split('/').filter(Boolean);
    if (!parts.length) return '/';
    const base = '/' + parts[0];
    if (ALIAS[base]) return ALIAS[base];
    // eine einzelne Unterrichtsstunde ist vor allem ihr Schreibblatt
    if (base === '/unterricht' && parts.length > 1) return 'blatt';
    return PAGES.includes(base) ? base : 'rundgang';
  };

  // Schritte, deren Ziel gerade nicht auf der Seite ist, fallen weg; Schritte ohne Ziel stehen mittig und bleiben
  const visibleSteps = (steps, hasTarget) => (steps || []).filter((s) => !s.target || hasTarget(s.target));

  const clamp = (v, lo, hi) => Math.round(Math.max(lo, Math.min(v, Math.max(lo, hi))));

  // Platz der Blase: bevorzugte Seite, sonst unter dem Ziel, sonst darüber, sonst unten im Fenster – nie außerhalb
  const placeBubble = (target, bubble, viewport, prefer) => {
    const maxL = viewport.width - bubble.width - MARGIN, maxT = viewport.height - bubble.height - MARGIN;
    if (!target) return { left: clamp((viewport.width - bubble.width) / 2, MARGIN, maxL), top: clamp((viewport.height - bubble.height) / 2, MARGIN, maxT), side: 'center' };
    const cx = target.left + target.width / 2 - bubble.width / 2;
    const right = target.left + target.width + GAP, below = target.top + target.height + GAP, above = target.top - GAP - bubble.height;
    if (prefer === 'right' && right <= maxL && right >= MARGIN) return { left: Math.round(right), top: clamp(target.top + target.height / 2 - bubble.height / 2, MARGIN, maxT), side: 'right' };
    const fitsBelow = below <= maxT, fitsAbove = above >= MARGIN;
    // geklemmt wird auch hier: ist das Ziel weggescrollt, bleibt die Blase am Fensterrand stehen
    if (prefer === 'top' && fitsAbove) return { left: clamp(cx, MARGIN, maxL), top: clamp(above, MARGIN, maxT), side: 'top' };
    if (fitsBelow) return { left: clamp(cx, MARGIN, maxL), top: clamp(below, MARGIN, maxT), side: 'bottom' };
    if (fitsAbove) return { left: clamp(cx, MARGIN, maxL), top: clamp(above, MARGIN, maxT), side: 'top' };
    return { left: clamp(cx, MARGIN, maxL), top: clamp(maxT, MARGIN, maxT), side: 'bottom' };
  };

  // Die Frage „Rundgang?“ kommt genau einmal: auf der Startseite, wenn nichts anderes offen ist, und nicht in
  // In-App-Browsern (Instagram u. ä.), in denen ohnehin nichts gespeichert bleibt. Solange die Willkommenskarte
  // noch Schritte zeigt (setup), wartet sie: erst einrichten, dann der Rundgang.
  const shouldAsk = ({ asked, path, busy, inApp, setup }) => !asked && path === '/' && !busy && !inApp && !setup;

  const T = { GAP, MARGIN, tourKeyFor, visibleSteps, placeBubble, shouldAsk };
  if (typeof module !== 'undefined' && module.exports) module.exports = T; else root.App.tourLogic = T;
})(this);
