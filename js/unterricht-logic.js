/* Nihongo Techō – Unterricht: reine Logik (Titel, Kurse, Papier pro Seite). Läuft im Browser (App.uLogic) und in Node (Tests). */
'use strict';
(function (root) {
  const DEFAULT_COURSE = 'Japanisch VHS FFM A';
  const PAPERS = [['lines', 'Liniert'], ['grid', 'Kariert'], ['kanji', 'Kanji-Raster 原稿'], ['dots', 'Punkte'], ['blank', 'Blanko']];
  const NO_COURSE = 'Ohne Kurs';
  const trimC = (c) => String(c || '').trim();
  const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '') || (+b.number || 0) - (+a.number || 0);

  // '2026-09-28' → '2026年9月28日' (per Split, keine Zeitzonen-Verschiebung)
  const jpDate = (iso) => {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso || '');
    return m ? `${m[1]}年${+m[2]}月${+m[3]}日` : '';
  };
  const isAutoTitle = (title, iso) => { const t = String(title || '').trim(); return t === '' || t === jpDate(iso); };

  const suggestCourse = (sessions) => {
    const withCourse = sessions.filter((s) => trimC(s.course)).sort(byDateDesc);
    return withCourse.length ? trimC(withCourse[0].course) : DEFAULT_COURSE;
  };
  const nextNumber = (sessions, course) => {
    const c = trimC(course);
    return sessions.filter((s) => trimC(s.course) === c).reduce((m, s) => Math.max(m, +s.number || 0), 0) + 1;
  };

  const groupByCourse = (sessions) => {
    const map = new Map();
    sessions.forEach((s) => {
      const c = trimC(s.course) || NO_COURSE;
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(s);
    });
    const groups = Array.from(map, ([course, list]) => ({ course, sessions: list.sort(byDateDesc) }));
    return groups.sort((a, b) => (b.sessions[0].date || '').localeCompare(a.sessions[0].date || ''));
  };
  const courseNeighbors = (sessions, s) => {
    const c = trimC(s.course);
    const list = sessions.filter((x) => trimC(x.course) === c).sort(byDateDesc);
    const i = list.indexOf(s);
    return { prev: list[i + 1] || null, next: i > 0 ? list[i - 1] : null };
  };

  // Kurzfassung neben dem Kursnamen, wenn der Kurs eingeklappt ist (sessions: neueste zuerst, wie aus groupByCourse)
  const courseSummary = (sessions, fmtDate) => {
    const n = sessions.length, last = sessions[0] && sessions[0].date;
    return `${n} ${n === 1 ? 'Stunde' : 'Stunden'}${last ? ' · zuletzt ' + fmtDate(last) : ''}`;
  };
  const toggleFolded = (folded, course) => {
    const list = folded || [];
    return list.includes(course) ? list.filter((c) => c !== course) : list.concat(course);
  };

  // Früher landete die laufende Nummer der Stunde im Feld „Lektion“ – bei Einträgen und Dateien aus dem Unterricht.
  // Leert das Feld (nur Quelle VHS-Kurs; Dateien nur, wenn sie an einer Stunde hängen) und gibt das Geänderte zurück.
  const CLASS_SOURCE = 'VHS-Kurs';
  const hasLesson = (x) => x.source === CLASS_SOURCE && x.lesson !== '' && x.lesson != null;
  const clearClassLessons = (items, files) => {
    const out = { items: items.filter((it) => it.type !== 'session' && hasLesson(it)), files: files.filter((f) => f.sessionId && hasLesson(f)) };
    out.items.concat(out.files).forEach((x) => { x.lesson = ''; });
    return out;
  };

  const pagePaper =(f, i) => (f.pagePapers && f.pagePapers[i]) || f.paper || 'lines';
  const extraPaper = (f, j) => (f.extraPapers && f.extraPapers[j]) || 'lines';
  const appendPaper = (f, paper, isNotebook) => {
    if (isNotebook) {
      const n = f.pages || 1;
      f.pagePapers = Array.from({ length: n }, (_, i) => pagePaper(f, i)).concat(paper);
      f.pages = n + 1;
    } else {
      const n = f.extraPages || 0;
      f.extraPapers = Array.from({ length: n }, (_, j) => extraPaper(f, j)).concat(paper);
      f.extraPages = n + 1;
    }
  };

  const L = { DEFAULT_COURSE, PAPERS, NO_COURSE, jpDate, isAutoTitle, suggestCourse, nextNumber, groupByCourse, courseNeighbors, courseSummary, toggleFolded, CLASS_SOURCE, clearClassLessons, pagePaper, extraPaper, appendPaper };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.App.uLogic = L;
})(this);
