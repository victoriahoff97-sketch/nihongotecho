/* Nihongo Techō – Japanese with Shun: Folgen aus dem Podcast-Feed nach Genki-Lektion bzw. Folgennummer einsortieren,
   „Gehört“-Stand (reine Logik, auch vom Build-Skript tools/build/build-shun.mjs benutzt) */
'use strict';
(function (App) {
  const S = App.shun = App.shun || {};

  // Specials, Interviews, Collabs usw. kommen nicht in die App (lang, meist N4–N3)
  const SKIP = /special|interview|collab|announcement|thank you|looking back/i;
  // Genki-Folgen: „Genki L1 …“, „L6-1 …“, „Genki 1 - L1 …“, „【Genki 2】L13 …“, „【Genki2】L21 …“
  const GENKI = /^\s*(?:【\s*Genki\s*\d?\s*】|Genki\s*\d?\s*-?)?\s*L(\d+)(?:-(\d+))?\b/i;
  // Normale Folgen: „Ep12“, „EP250“, „【N5-N4】Ep202“; „Eo89“ ist ein Tippfehler im Feed
  const EP = /\bE[po]\s*(\d+)/i;
  // Normale Folgen, die im Feed ohne Nummer stehen
  const NO_NUMBER = [[/^【N5\/N4】Do you like taking flight\?/, 242]];
  // Die erste Genki-Reihe lief 2021, die zweite ab August 2023
  const SERIE2 = '2022-06-01';

  S.classify = (title, date) => {
    if (SKIP.test(title)) return null;
    const fix = NO_NUMBER.find(([re]) => re.test(title));
    if (fix) return { kind: 'ep', n: fix[1] };
    const g = title.match(GENKI);
    if (g) return { kind: 'genki', serie: date < SERIE2 ? 2021 : 2023, lesson: +g[1], part: g[2] ? +g[2] : 0 };
    const e = title.match(EP);
    return e ? { kind: 'ep', n: +e[1] } : null;
  };

  S.build = (data) => {
    const genki = (data.genki || []).map(([id, serie, lesson, part, title, s, url, ja]) => ({ id, serie, lesson, part, title, s, url, ja: ja || '' }))
      .sort((a, b) => a.lesson - b.lesson || a.serie - b.serie || a.part - b.part);
    const eps = (data.eps || []).map(([id, n, title, s, url]) => ({ id, n, title, s, url })).sort((a, b) => a.n - b.n);
    return { genki, eps };
  };

  let cache = null;
  S.all = () => cache || (cache = S.build((typeof window !== 'undefined' && window.SHUN_DATA) || {}));
  S.byId = (id, src = S.all()) => src.genki.find((e) => e.id === id) || src.eps.find((e) => e.id === id) || null;
  S.forLesson = (lesson, src = S.all()) => src.genki.filter((e) => e.lesson === lesson);
  S.source = (lesson) => (lesson <= 12 ? 'Genki I' : 'Genki II');
  S.minutes = (e) => Math.max(1, Math.round(e.s / 60));

  // Stand aus älteren Backups hat noch kein shunHeard – dann gilt alles als ungehört
  S.next = (heard, src = S.all()) => {
    const h = new Set(heard || []);
    return src.eps.find((e) => !h.has(e.id)) || null;
  };
  // „Nächste Folge“ oben auf der Seite „Hören“: erst die Genki-Folgen der Reihe nach, danach die normalen
  S.nextUp = (heard, src = S.all()) => {
    const h = new Set(heard || []);
    return src.genki.find((e) => !h.has(e.id)) || S.next(heard, src);
  };
  // Ringe und Lektions-Kästchen auf der Seite „Hören“
  const count = (list, h) => ({ done: list.filter((e) => h.has(e.id)).length, total: list.length });
  S.progress = (heard, src = S.all()) => {
    const h = new Set(heard || []);
    return { genki: count(src.genki, h), eps: count(src.eps, h) };
  };
  S.lessonDone = (heard, lesson, src = S.all()) => count(S.forLesson(lesson, src), new Set(heard || []));
  S.toggle = (heard, id) => {
    const h = (heard || []).slice();
    const i = h.indexOf(id);
    if (i >= 0) h.splice(i, 1); else h.push(id);
    return h;
  };
})(window.App);
