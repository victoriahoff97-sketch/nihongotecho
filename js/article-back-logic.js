/* Nihongo Techō – „↩ Zum Artikel“: nach einer Übergabe aus dem Browser (Erweiterung am PC, Markieren-App auf Android)
   zurück zur Seite, von der der Text kam. Nur Logik, kein DOM. */
'use strict';
(function (App) {
  const str = (v) => (typeof v === 'string' ? v : '');
  const PKG = 'io.github.nihongotecho.markieren';
  // Android-Paketnamen (z. B. com.android.chrome, org.mozilla.firefox) – alles andere wird nie in eine Intent-Adresse geschrieben
  const isPkg = (s) => /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(str(s)) && str(s).length <= 120;
  const isWeb = (s) => /^https?:\/\//i.test(str(s));

  // Übergabe-Parameter → Rückweg oder null
  //  zurueck=ext            → neue Browser-Erweiterung: sie kennt den Tab, aus dem markiert wurde
  //  zurueck=<Paketname>    → Markieren-App auf Android: sie kennt die App, aus der markiert wurde (meist Chrome)
  //  nur ref (alte Erweiterung) → Artikel in einem neuen Tab öffnen
  const fromQuery = (query) => {
    const q = query || {};
    const z = str(q.zurueck).trim();
    const ref = str(q.ref).trim();
    const out = { ref: isWeb(ref) ? ref.slice(0, 2000) : '', quelle: str(q.quelle).trim().slice(0, 60) };
    if (z === 'ext') return Object.assign(out, { via: 'ext' });
    if (isPkg(z)) return Object.assign(out, { via: 'android', app: z });
    return out.ref ? Object.assign(out, { via: 'link' }) : null;
  };

  // Android: Markieren-App holt die Browser-App wieder nach vorn (mit dem offenen Artikel, ohne Neuladen)
  const backIntent = (app) => (isPkg(app) ? `intent://zurueck?app=${app}#Intent;scheme=nihongotecho;package=${PKG};end` : '');

  // Android: Webseite über die Markieren-App im richtigen Browser öffnen (nicht im kleinen Fenster über der App),
  // damit sie beim Zurückkommen noch da ist. Ohne Markieren-App öffnet Chrome die Adresse ganz normal.
  const openIntent = (url, app) => (isWeb(url)
    ? `intent://oeffnen?url=${encodeURIComponent(url)}${isPkg(app) ? '&app=' + app : ''}#Intent;scheme=nihongotecho;package=${PKG};S.browser_fallback_url=${encodeURIComponent(url)};end`
    : '');

  const label = (b) => (b && b.quelle ? `Zurück zu ${b.quelle}` : 'Zurück zum Artikel');

  App.articleBackLogic = { fromQuery, backIntent, openIntent, label, isPkg };
})(window.App);
