/* Nihongo Techō – Web-Version (PWA): Service Worker anmelden, neue Versionen anbieten, Installation */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const nav = typeof navigator === 'undefined' ? {} : navigator;
  const sw = nav.serviceWorker;

  // Nur unter einer Webadresse. Beim Start aus dem Ordner (file://) gibt es keinen Service Worker, und auf einem
  // lokalen Entwicklungs-Server nur mit „?sw“ – sonst würde die Vorschau alte Dateien aus dem Zwischenspeicher zeigen.
  const enabledFor = (loc, controlled) => loc.protocol === 'https:'
    || (loc.protocol === 'http:' && (controlled || new URLSearchParams(loc.search).has('sw')));

  const state = { enabled: false, version: null, waiting: null, installEvt: null, standalone: false };

  const card = () => {
    if (!state.enabled) return '';
    const status = state.waiting ? 'Eine neue Version ist geladen und wartet auf den Neustart.'
      : state.version ? `Version ${esc(state.version)} · funktioniert auch ohne Internet.`
        : 'Wird für die Nutzung ohne Internet vorbereitet …';
    const install = state.standalone ? ''
      : state.installEvt ? `<button class="btn" data-pwa="install">${icon('download')} Als App installieren</button>`
        : '<p class="muted small">Als App installieren: im Browser-Menü „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen.</p>';
    // Einladungslink erstellen: nur, wo Genki-Daten dabei sind (Web-Version); Ablauf in welcome.js (App.invite.make)
    const invite = App.genki && App.genki.present() ? `<div class="invite-make" data-invite>
      <h4>Einladungslink erstellen</h4>
      <form class="row" data-invite-form>
        <input class="input" type="text" data-invite-code placeholder="XXXX-XXXX-XXXX-XXXX" aria-label="Freischaltcode" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn" type="submit">${icon('copy')} Link kopieren</button>
      </form>
      <p class="small" role="alert" data-invite-err hidden style="color:var(--shu)"></p>
      <p class="muted small">Nur persönlich weitergeben, nicht in Gruppen – wer den Link hat, kann Genki I freischalten.</p></div>` : '';
    return `<div class="card" data-pwa-card><h3>Web-App</h3><p class="muted small">${status}</p>
      <div class="row">${state.waiting
    ? `<button class="btn btn-primary" data-pwa="apply">${icon('replay')} Neue Version laden</button>`
    : `<button class="btn" data-pwa="check">${icon('replay')} Nach Update suchen</button>`}${install}<button class="btn btn-ghost btn-sm" data-welcome-show>Erste Schritte anzeigen</button></div>${invite}</div>`;
  };

  // install: Installation von außen auslösen (Willkommenskarte); false, wenn der Browser keine angeboten hat
  App.pwa = { enabledFor, state, card, install: async () => false };
  if (!sw || typeof location === 'undefined' || !enabledFor(location, !!sw.controller)) return;
  state.enabled = true;
  state.standalone = window.matchMedia('(display-mode: standalone)').matches;

  const refresh = () => {
    const el = document.querySelector('[data-pwa-card]'); if (el) el.outerHTML = card();
    if (App.welcome) App.welcome.refresh();
  };
  App.pwa.install = async () => {
    const evt = state.installEvt;
    if (!evt) return false;
    state.installEvt = null;
    evt.prompt();
    refresh();
    try { return (await evt.userChoice).outcome === 'accepted'; } catch (e) { return false; }
  };
  const apply = () => { if (state.waiting) state.waiting.postMessage('skipWaiting'); };
  const offer = (worker) => {
    state.waiting = worker;
    refresh();
    App.toast('Neue Version verfügbar', { label: 'Neu laden', fn: apply });
  };
  const askVersion = () => {
    if (!sw.controller) return;
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => { state.version = e.data; refresh(); };
    sw.controller.postMessage('version', [ch.port2]);
  };

  // Wechselt der Service Worker, weil eine neue Version übernommen wurde, die Seite einmal neu laden.
  // Beim allerersten Besuch (vorher keiner zuständig) nur die Version nachtragen.
  let hadController = !!sw.controller;
  let reloading = false;
  sw.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; askVersion(); return; }
    if (!reloading) { reloading = true; location.reload(); }
  });

  let reg = null;
  const watch = (worker) => worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && sw.controller) offer(worker);
  });
  sw.register('sw.js').then((r) => {
    reg = r;
    if (r.waiting && sw.controller) offer(r.waiting);
    if (r.installing) watch(r.installing);
    r.addEventListener('updatefound', () => watch(r.installing));
    askVersion();
  }).catch((e) => { console.warn('Service Worker nicht verfügbar:', e); state.enabled = false; refresh(); });

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installEvt = e; refresh(); });
  window.addEventListener('appinstalled', () => { state.installEvt = null; state.standalone = true; refresh(); });

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-pwa]');
    if (!b) return;
    const act = b.dataset.pwa;
    if (act === 'apply') apply();
    if (act === 'install') App.pwa.install();
    if (act === 'check' && reg) {
      try {
        await reg.update();
        if (!reg.installing && !reg.waiting) App.toast('Du hast die neueste Version');
      } catch (err) { App.toast('Keine Verbindung – Update-Suche nicht möglich'); }
    }
  });
})(window.App);
