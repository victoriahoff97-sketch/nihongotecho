/* Nihongo Techō – Leiste „↩ Zum Artikel“ unter der Kopfzeile (wie „Weiter wiederholen“): nach einer Übergabe aus dem Browser
   zurück zur Seite, von der der Text kam. Logik in js/article-back-logic.js; am PC hilft die Erweiterung (extension/content.js),
   auf Android die Markieren-App (android/). Hält nur bis zum Schließen der App (sessionStorage). */
'use strict';
(function (App) {
  const L = App.articleBackLogic;
  const KEY = 'ntArticleBack', HELPER = 'ntAndroidHelper';
  const android = () => /Android/i.test((window.navigator && navigator.userAgent) || '');
  const ss = {
    get() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { if (v) sessionStorage.setItem(KEY, JSON.stringify(v)); else sessionStorage.removeItem(KEY); } catch (e) { /* nur für diese Seite */ } },
  };
  let cur = ss.get();

  const render = () => {
    const bar = document.getElementById('article-bar');
    if (!bar) return;
    bar.hidden = !cur;
    bar.innerHTML = cur ? `<button class="btn btn-sm btn-primary" data-article-back>↩ ${App.esc(L.label(cur))}</button><button class="icon-btn" data-article-drop title="Leiste ausblenden" aria-label="Leiste ausblenden">×</button>` : '';
  };

  // Übergabe-Parameter aus #/eingang merken (js/inbox.js), bevor die Adresse ersetzt wird
  const take = (query) => {
    const b = L.fromQuery(query);
    if (!b) return;
    cur = b;
    ss.set(b);
    // Die Markieren-App ist neu genug für den Rückweg → Webseiten aus der App künftig über sie im Browser öffnen
    if (b.via === 'android') { try { localStorage.setItem(HELPER, b.app); } catch (e) { /* dann wie bisher */ } }
    render();
  };

  const openRef = () => { if (cur && cur.ref) window.open(cur.ref, '_blank', 'noopener'); else App.toast('Der Artikel ist nicht bekannt – bitte im Browser zurückwechseln'); };

  // Erweiterung fragen; antwortet sie nicht (entfernt, App lokal aus dem Ordner), den Artikel in einem neuen Tab öffnen
  const viaExtension = () => {
    let done = false;
    const onMsg = (ev) => {
      if (ev.source !== window || !ev.data || ev.data.type !== 'nt-zurueck-ok') return;
      done = true;
      window.removeEventListener('message', onMsg);
    };
    window.addEventListener('message', onMsg);
    window.postMessage({ type: 'nt-zurueck' }, location.origin === 'null' ? '*' : location.origin);
    setTimeout(() => { if (!done) { window.removeEventListener('message', onMsg); openRef(); } }, 1200);
  };

  const go = () => {
    if (!cur) return;
    if (cur.via === 'ext') return viaExtension();
    if (cur.via === 'android') { const u = L.backIntent(cur.app); if (u) location.href = u; return; }
    openRef();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-article-back]')) { go(); return; }
    if (e.target.closest('[data-article-drop]')) { cur = null; ss.set(null); render(); return; }
    // Android mit Markieren-App: Lese-Kacheln (NHK Easy …) im Browser selbst öffnen statt im kleinen Fenster über der App,
    // sonst ist die Seite nach „Sätze erkennen“ weg
    const a = e.target.closest('a.read-tile[target="_blank"], a[data-read-out][target="_blank"]');
    if (!a || !android() || e.defaultPrevented) return;
    let helper = '';
    try { helper = localStorage.getItem(HELPER) || ''; } catch (err) { /* ohne */ }
    const u = L.isPkg(helper) && L.openIntent(a.href, helper);
    if (!u) return;
    e.preventDefault();
    location.href = u;
  });

  App.articleBack = { take, render, current: () => cur };
})(window.App);
