/* Nihongo Techō – Willkommenskarte auf der Startseite der Web-Version (Anzeige; Logik in welcome-logic.js) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const W = App.welcome = { pendingLink: null };
  const nav = typeof navigator === 'undefined' ? {} : navigator;
  let dictState = null; // bis setDict aufgerufen wird: bereit, wenn das Wörterbuch schon da ist

  // Nur unter einer Webadresse – nie beim Start aus dem Ordner (file://)
  const isWeb = () => typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:');

  W.env = () => {
    const st = (App.pwa && App.pwa.state) || {};
    return App.welcomeLogic.env({ ua: nav.userAgent || '', standalone: !!(st.standalone || nav.standalone), hasPrompt: !!st.installEvt, maxTouchPoints: nav.maxTouchPoints || 0 });
  };
  W.setDict = (state) => { dictState = state; W.refresh(); };

  // Erststart im Web: das kleine Wörterbuch (nur dict-common) von selbst laden – wirft nie
  W.autoDict = async () => {
    try {
      const marker = App.lsGet('dict-auto') || '';
      const { run } = App.welcomeLogic.dictAuto({ web: isWeb(), emptyLocal: App.backup.isEmptyLocal(), installed: App.dict.installed(), marker });
      if (!run) return;
      W.setDict('loading');
      let ok = true;
      try { await App.dict.install('dict-common'); } catch (e) { ok = false; console.error('Wörterbuch: Installation fehlgeschlagen', e); }
      App.lsSet('dict-auto', App.welcomeLogic.dictAutoNext(marker, ok));
      W.setDict(ok ? 'ready' : 'none');
    } catch (e) { console.error(e); }
  };

  const SHARE_SVG = '<svg class="welcome-step" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"/></svg>';
  const PLUS_SVG = '<svg class="welcome-step" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

  const b = (attrs, label, cls = '') => `<button class="btn ${cls}" ${attrs}>${label}</button>`;
  const copyBtn = b('data-welcome-act="copy"', `${icon('copy')} Adresse kopieren`, 'btn-primary btn-sm');

  // Titel, Erklärung und Knöpfe je Zeile und Variante
  const TEXT = {
    install: {
      button: ['Als App installieren', '', b('data-welcome-act="install"', `${icon('download')} Als App installieren`, 'btn-primary btn-sm')],
      'ios-steps': ['Als App installieren', `Tippe in Safari auf das Teilen-Symbol (iPad: oben rechts, iPhone: unten) ${SHARE_SVG} und dann auf ‚Zum Home-Bildschirm‘ ${PLUS_SVG}.`, ''],
      'open-in-browser': ['Als App installieren', 'Hier lässt sich die App nicht installieren. Öffne die Adresse in Chrome (iPhone/iPad: Safari).', copyBtn],
      menu: ['Als App installieren', 'Im Browser-Menü ‚App installieren‘ bzw. ‚Zum Startbildschirm hinzufügen‘ wählen.', ''],
      done: ['App ist installiert', '', ''],
    },
    genki: {
      open: ['Genki I ist freigeschaltet', '', ''],
      _: ['Genki I freischalten', '', b('data-welcome-act="genki"', 'Code eingeben', 'btn-sm')],
    },
    backup: {
      folder: ['Sicherung einrichten', '', b('data-bk="pick"', 'Ordner wählen', 'btn-sm')],
      manual: ['Sicherung', 'Sichern kannst du von Hand unter Einstellungen &gt; Sicherung.', ''],
    },
  };
  const ACCEPT = '.json,.ntpaket,.zip,application/json,application/zip';
  const fileLabel = (label) => `<label class="btn btn-sm">${label}<input type="file" accept="${ACCEPT}" data-welcome-file hidden></label>`;
  const fileInput = fileLabel('Backup-Datei wählen');

  const rowHtml = (r) => {
    let title, text = '', btns = '', extra = '';
    if (r.id === 'stand') {
      title = 'Ich habe schon einen Stand';
      // ein Knopf: mit Ordnerzugriff der Sicherungsordner (Backup-Datei als schlichter Textlink darunter), sonst die Backup-Datei
      const folder = r.variant === 'folder+file';
      btns = folder ? b('data-bk="pick"', 'Sicherungsordner wählen', 'btn-sm') : fileInput;
      if (folder) extra = `<p class="muted small">Kein Sicherungsordner? <label class="welcome-link">Backup-Datei öffnen<input type="file" accept="${ACCEPT}" data-welcome-file hidden></label></p>`;
    } else if (r.id === 'genki') {
      [title, text, btns] = TEXT.genki[r.done ? 'open' : '_'];
    } else if (r.id === 'backup') {
      [title, text, btns] = r.done ? ['Sicherung läuft', '', ''] : TEXT.backup[r.variant] || TEXT.backup.manual;
    } else {
      [title, text, btns] = TEXT.install[r.variant] || TEXT.install.menu;
    }
    return `<div class="welcome-row${r.done ? ' done' : ''}" data-welcome-row="${r.id}">
      <span class="welcome-mark">${r.done ? icon('check') : ''}</span>
      <div class="welcome-body"><b>${title}</b>${text ? `<p class="muted small">${text}</p>` : ''}${btns ? `<div class="row">${btns}</div>` : ''}${extra}</div></div>`;
  };

  // HTML der Karte oder '' (kein Web, „Später“ gewählt, alles erledigt)
  W.card = () => {
    if (!isWeb()) return '';
    const bk = App.backup;
    const st = bk.status();
    const res = App.welcomeLogic.rows({
      env: W.env(),
      genki: App.genki ? App.genki.state() : 'none',
      emptyLocal: bk.isEmptyLocal(),
      folderSupported: bk.supported(),
      backupOn: st.kind !== 'off' && st.kind !== 'unsupported',
      dict: dictState || (App.dict && App.dict.installed() ? 'ready' : 'none'),
      dismissed: App.lsGet('welcome') === 'off',
    });
    if (!res.show) return '';
    // Genki-Aufgaben kommen als eigene Datei (nie über die Webadresse): Hinweis, solange keine eingelesen sind
    const aufgabenLine = App.exercises && !App.exercises.dir()
      ? `<p class="muted small welcome-dict" data-welcome-aufgaben>Genki-Aufgaben: Die Übungsaufgaben aus dem Buch kommen als eigene Datei – von der Person, die dir die App gegeben hat. ${fileLabel("Aufgaben-Datei öffnen")}</p>` : "";
    // Wörterbuch: gleiche Zeile mit Haken wie die Schritte, aber kein zugesagter Anker (lädt von selbst, nichts zu tun)
    const dictLine = res.dictLine ? `<div class="welcome-row${res.dictLine === 'ready' ? ' done' : ''}" data-welcome-dict>
      <span class="welcome-mark">${res.dictLine === 'ready' ? icon('check') : ''}</span>
      <div class="welcome-body"><b>${res.dictLine === 'ready' ? 'Wörterbuch ist bereit' : 'Wörterbuch wird geladen …'}</b></div></div>` : '';
    return `<div class="card welcome" data-welcome>
      <div class="welcome-head"><div><h3>Willkommen bei Nihongo Techō</h3><p class="muted small">Ein paar kurze Schritte, dann ist alles eingerichtet.</p></div>
        ${b('data-welcome-act="later"', 'Später', 'btn-ghost btn-sm')}</div>
      ${res.rows.map(rowHtml).join('')}${dictLine}${aufgabenLine}</div>`;
  };

  // An Ort und Stelle neu zeichnen (wie refresh in pwa.js); die Sicherungs-Zeile auf der Startseite folgt mit
  W.refresh = () => {
    if (typeof document === 'undefined' || !document.querySelector) return;
    const html = W.card();
    const el = document.querySelector('[data-welcome]');
    if (el) { if (html) el.outerHTML = html; else el.remove(); }
    const h = document.querySelector('[data-backup-home]');
    if (h && App.backup.homeCard) h.innerHTML = App.backup.homeCard({ noRestoreHint: !!html });
    // Karte weg (alles erledigt oder „Später“): jetzt darf die Frage nach dem Rundgang kommen
    if (!html && App.tour) App.tour.askSoon();
  };

  // ---------- Einladungslink ----------
  const I = App.invite = {};
  const baseUrl = () => location.origin + location.pathname;

  // Beim Start (nach dem Laden der Daten, vor dem ersten Zeichnen): #freischalten=<Code> verarbeiten und die Adresse
  // sofort bereinigen. Der Code wird nur an unlock gereicht – nie gespeichert, geloggt oder angezeigt. Wirft nie.
  // Nur die Adresse bereinigen (auch wenn das Laden der Daten scheitert) → gelesener Hash oder null; wirft nie
  I.clean = () => {
    try {
      const r = App.inviteLogic.read(location.hash);
      if (r) {
        try { history.replaceState(null, '', location.pathname + location.search + '#/'); } catch (e) { try { location.hash = '#/'; } catch (e2) { /* nichts weiter möglich */ } }
      }
      return r;
    } catch (e) { return null; }
  };

  I.boot = async () => {
    try {
      const r = I.clean();
      if (!r) return;
      if (!isWeb() || !App.genki || !App.genki.present()) return;
      if (W.env().inApp) { if (r.code) W.pendingLink = App.inviteLogic.link(baseUrl(), r.code); return; }
      if (App.genki.state() === 'open') return;
      if (!r.code) { App.toast(INVITE.invalid); return; }
      try {
        await App.genki.unlock(r.code);
        App.toast('Genki I freigeschaltet');
      } catch (e) {
        if (e && e.code === 'GENKI_CODE') App.toast(INVITE.invalid);
        else { console.error('Einladung: Freischalten fehlgeschlagen', e && e.code ? e.code : 'Fehler'); App.toast(INVITE.failed); }
      }
    } catch (e) { console.error('Einladung: Fehler', e && e.code ? e.code : 'Fehler'); }
  };
  const INVITE = {
    invalid: 'Dieser Einladungslink gilt nicht (mehr). Den Code kannst du auf der Startseite von Hand eingeben.',
    failed: 'Freischalten hat nicht geklappt – bitte den Code von Hand eingeben.',
    wrong: 'Der Code stimmt nicht.',
    unsupported: 'Dieser Browser kann Genki nicht prüfen – bitte Chrome oder Edge verwenden.',
    check: 'Prüfen hat nicht geklappt – bitte noch einmal versuchen.',
    copied: 'Einladungslink kopiert',
    copyFailed: 'Link konnte nicht kopiert werden.',
  };

  // Formular „Einladungslink erstellen“ (Karte Web-App in pwa.js): Code prüfen, Link in die Zwischenablage, Feld leeren.
  // Der Link wird nie angezeigt; der Code bleibt nur im Feld und wird nach dem Kopieren geleert.
  let making = false;
  I.make = async (form) => {
    if (making) return;
    making = true;
    const input = form.querySelector('[data-invite-code]');
    const box = form.closest && form.closest('[data-invite]');
    const err = box && box.querySelector('[data-invite-err]');
    const show = (msg) => { if (err) { err.textContent = msg; err.hidden = !msg; } };
    try {
      show('');
      const code = input ? input.value : '';
      let ok;
      try { ok = await App.genki.check(code); } catch (e) {
        show(e && e.code === 'GENKI_UNSUPPORTED' ? INVITE.unsupported : INVITE.check);
        return;
      }
      if (!ok) { show(INVITE.wrong); return; }
      const link = App.inviteLogic.link(baseUrl(), code);
      try { await nav.clipboard.writeText(link); App.toast(INVITE.copied); } catch (e) { App.toast(INVITE.copyFailed); }
      if (input) input.value = '';
    } finally {
      making = false;
    }
  };

  if (typeof document === 'undefined' || !document.addEventListener) return;

  document.addEventListener('submit', (e) => {
    const form = e.target.closest && e.target.closest('form[data-invite-form]');
    if (!form) return;
    e.preventDefault();
    I.make(form);
  });

  const copyLink = async () => {
    const link = W.pendingLink || (location.origin + location.pathname);
    try { await nav.clipboard.writeText(link); App.toast('Adresse kopiert'); } catch (e) { App.toast('Kopieren hat nicht geklappt'); }
  };
  const ACT = {
    later: () => { App.lsSet('welcome', 'off'); W.refresh(); },
    install: async () => { if (App.pwa && App.pwa.install) await App.pwa.install(); W.refresh(); },
    copy: copyLink,
    genki: () => { const i = document.querySelector('[data-genki-code]'); if (i) { i.scrollIntoView && i.scrollIntoView({ block: 'center' }); i.focus(); } },
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-welcome-act], [data-welcome-show]');
    if (!t) return;
    if (t.matches('[data-welcome-show]')) {
      App.lsSet('welcome', '');
      if (location.hash === '#/' || location.hash === '' || location.hash === '#') App.render(); else location.hash = '#/';
      return;
    }
    const act = ACT[t.dataset.welcomeAct];
    if (act) Promise.resolve(act()).catch((er) => console.error(er));
  });
  document.addEventListener('change', async (e) => {
    const f = e.target.closest && e.target.closest('[data-welcome-file]');
    if (!f || !f.files[0]) return;
    const file = f.files[0];
    f.value = ''; // dieselbe Datei lässt sich nach einem Fehler noch einmal wählen
    try { const r = await App.paket.open(file); App.toast(r.text); App.render(); } catch (er) { App.toast(er.message); }
  });
})(window.App);
