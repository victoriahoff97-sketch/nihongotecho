const SW_BUILD = {"version":"53b6b58","files":["css/app.css","data/genki.enc.js","data/kanjivg.js","data/seed-prompts.js","data/seed-sample.js","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","js/accent.js","js/apply-logic.js","js/apply.js","js/autofill-logic.js","js/backup-logic.js","js/backup.js","js/core.js","js/deinflect.js","js/dict.js","js/dictscan.js","js/editors.js","js/formmap-logic.js","js/formmap.js","js/furi-logic.js","js/genki-logic.js","js/genki.js","js/homophone-logic.js","js/homophones.js","js/hw-logic.js","js/hw.js","js/inbox-logic.js","js/inbox.js","js/ink-book.js","js/ink-erase.js","js/ink-images.js","js/ink-pen.js","js/ink-select.js","js/ink-stickers.js","js/ink.js","js/jp.js","js/kanji-logic.js","js/lessons.js","js/level.js","js/lookup-logic.js","js/lookup.js","js/main.js","js/merge.js","js/packs.js","js/pdftext.js","js/practice.js","js/pwa.js","js/sentences.js","js/stroke.js","js/tatoeba.js","js/ui.js","js/unterricht-logic.js","js/views-more.js","js/views.js","js/vocabcheck.js","js/wanikani.js","js/wk-logic.js","js/write-logic.js","js/writearea.js","manifest.webmanifest","packs/LIZENZEN.txt","packs/accent-index.js","packs/kanji-index.js","packs/level-index.js","packs/manifest.js","packs/n4/grammar.js","packs/n4/kanji.js","packs/n4/strokes.js","packs/n4/vocab.js","packs/n5/grammar.js","packs/n5/kanji.js","packs/n5/vocab.js","packs/uk-index.js","vendor/pdfjs/pdf.min.js","vendor/pdfjs/pdf.worker.min.js","vendor/perfect-freehand/LICENSE","vendor/perfect-freehand/perfect-freehand.js"]};
/* Nihongo Techō – Service Worker der Web-Version (PWA): App-Dateien offline bereithalten.
   build-web.mjs stellt „const SW_BUILD = { version, files }“ voran; ohne diesen Kopf bleibt das Skript untätig. */
'use strict';
(function () {
  const BUILD = typeof SW_BUILD === 'undefined' ? null : SW_BUILD;
  const SCOPE = new URL('./', self.location.href).href;
  const FILES = new Set(BUILD ? BUILD.files : []);
  const APP_PREFIX = 'nt-app-';
  const APP_CACHE = BUILD ? APP_PREFIX + BUILD.version : null;
  const FONT_CACHE = 'nt-fonts';
  const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

  // 'shell' = gespeicherte index.html, 'precache' = gespeicherte App-Datei, 'fonts' = Schriften, 'network' = nicht eingreifen
  const strategyFor = (req) => {
    if (req.method !== 'GET') return 'network';
    const u = new URL(req.url);
    if (FONT_HOSTS.includes(u.hostname)) return 'fonts';
    const base = u.origin + u.pathname;
    if (!base.startsWith(SCOPE)) return 'network';
    const rel = decodeURIComponent(base.slice(SCOPE.length));
    if (req.mode === 'navigate' && (rel === '' || rel === 'index.html')) return 'shell';
    return FILES.has(rel) ? 'precache' : 'network';
  };

  // Alte App-Versionen aufräumen; Schriften und fremde Caches bleiben
  const staleCaches = (keys) => keys.filter((k) => k.startsWith(APP_PREFIX) && k !== APP_CACHE);

  self.SW = { strategyFor, staleCaches };
  if (!BUILD) return;

  const fromApp = async (request, key) => {
    const cache = await caches.open(APP_CACHE);
    return (await cache.match(key, { ignoreSearch: true })) || fetch(request);
  };

  // Schriften: einmal geladen, dann aus dem Speicher. Als CORS-Anfrage, damit die Antwort lesbar (nicht „opaque“) ist.
  const fromFonts = async (request) => {
    const cache = await caches.open(FONT_CACHE);
    const hit = await cache.match(request.url);
    if (hit) return hit;
    const res = await fetch(request.url, { mode: 'cors', credentials: 'omit' });
    if (res.ok) await cache.put(request.url, res.clone());
    return res;
  };

  // Neue Version komplett laden; schlägt eine Datei fehl, bleibt die alte Version aktiv
  self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(BUILD.files.map((f) => new Request(f, { cache: 'reload' })))));
  });

  self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys()
      .then((keys) => Promise.all(staleCaches(keys).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
  });

  self.addEventListener('fetch', (e) => {
    const kind = strategyFor(e.request);
    if (kind === 'network') return;
    if (kind === 'fonts') e.respondWith(fromFonts(e.request));
    else e.respondWith(fromApp(e.request, kind === 'shell' ? SCOPE + 'index.html' : e.request));
  });

  // Die Seite löst den Versionswechsel aus (Knopf „Neu laden“) und fragt die Version ab
  self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting') self.skipWaiting();
    if (e.data === 'version' && e.ports[0]) e.ports[0].postMessage(BUILD.version);
  });
})();
