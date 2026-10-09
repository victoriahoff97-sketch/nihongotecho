/* Nihongo Techō – Ordner-Sicherung: Browser-Seite (Ordner wählen, Erlaubnis, Zeitsteuerung, Anzeige).
   Die eigentliche Logik steht in backup-logic.js und arbeitet nur gegen das Ordner-Handle. */
'use strict';
(function (App) {
  const L = () => App.backupLogic;
  const K = App.backup = {};
  const WAIT = 5000;        // so lange nach der letzten Änderung wird geschrieben
  const START_WAIT = 3000;  // Abgleich nach dem Start

  let dir = null;       // Ordner-Handle der Sicherung
  let device = null;    // { id, name } dieses Geräts
  let state = null;     // Merkliste und letzter Stand (meta.backupState)
  let phase = 'off';    // off | ok | paused | error
  let detail = '';      // Klartext zum Fehler
  let ask = null;       // offene Rückfrage bei „pausiert“: permission | foreign | corrupt
  let askStand = null;  // der fremde Stand zur Rückfrage
  let progress = null;  // [fertig, gesamt] während eines großen Durchlaufs
  let timer = null;
  let running = null;   // laufender Durchlauf (Promise)
  let again = null;     // Auslöser während eines Durchlaufs: danach genau ein weiterer
  let restoring = false;

  const emit = () => { if (App.emit) App.emit('backup'); };
  const metaGet = async (key) => { const m = await App.db.get('meta', key); return m ? m.value : undefined; };
  const metaPut = (key, value) => App.db.put('meta', { key, value });
  const saveState = async () => { if (dir && state) { try { await metaPut('backupState', state); } catch (e) { console.error('Sicherung: Merkliste nicht gespeichert', e); } } };
  const visible = () => document.visibilityState === 'visible';
  const p2 = (n) => String(n).padStart(2, '0');
  const hm = (ms) => { const d = new Date(ms); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const when = (ms) => { const d = new Date(ms); return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${hm(ms)}`; };

  K.supported = () => 'showDirectoryPicker' in window;

  // ---------- Datenquelle und -senke für backup-logic ----------
  const mkSrc = () => {
    let rows = null; // Stiftnotizen je Durchlauf nur einmal lesen
    const ink = async () => rows || (rows = await App.db.all('ink'));
    return {
      snapshot: async () => Object.assign(await App.stateParts(), { items: Array.from(App.store.items.values()), files: Array.from(App.store.files.values()) }),
      inkIds: async () => Array.from(new Set((await ink()).map((r) => r.fileId))),
      inkOf: async (id) => (await ink()).filter((r) => r.fileId === id).sort((a, b) => a.page - b.page)
        .map((r) => { const c = Object.assign({}, r); delete c.key; delete c.fileId; return c; }),
      blobOf: async (id) => { const b = await App.db.get('blobs', id); return b ? b.blob : undefined; },
    };
  };
  // Ersetzt wird immer in EINER Datenbank-Transaktion (App.db.replace): schlägt etwas fehl, bleibt der lokale Stand unberührt.
  const dataOps = async (daten, files) => {
    // Level-Pakete kommen aus der Sicherung; der lokale Wörterbuch-Status bleibt
    const packs = {};
    Object.entries((await metaGet('packs')) || {}).forEach(([id, m]) => { if ((App.packById(id) || {}).kind !== 'level') packs[id] = m; });
    const meta = [
      { key: 'packs', value: Object.assign(packs, daten.packs || {}) },
      { key: 'deletedPackItems', value: daten.deletedPackItems || [] },
      { key: 'deletedSeeds', value: daten.deletedSeeds || [] },
    ];
    if (daten.settings) meta.push({ key: 'settings', value: daten.settings });
    const ops = [{ store: 'items', clear: true, put: daten.items }, { store: 'srs', clear: true, put: daten.srs || [] }, { store: 'meta', put: meta }];
    if (files) ops.push({ store: 'files', clear: true, put: daten.files || [] });
    return ops;
  };
  const sink = {
    replaceData: async (daten, { files }) => App.db.replace(await dataOps(daten, files)),
    replaceAll: async (daten, entries, inks) => {
      const rows = [];
      inks.forEach((k) => k.pages.forEach((p) => rows.push(Object.assign({}, p, { key: k.fileId + ':' + p.page, fileId: k.fileId }))));
      await App.db.replace((await dataOps(daten, true)).concat([
        { store: 'blobs', clear: true, put: entries.filter((e) => e.blob).map((e) => ({ id: e.id, blob: e.blob })) },
        { store: 'ink', clear: true, put: rows },
        { store: 'thumbs', clear: true }, // Vorschaubilder gehören zu den alten Dateien – werden neu erzeugt
      ]));
    },
  };
  const localDaten = async () => (K.isEmptyLocal() ? undefined : L().buildDaten(await mkSrc().snapshot()));

  // Gibt es auf diesem Gerät noch nichts Eigenes? (nur unberührte Seed-/Paket-Einträge, kein Lernstand, keine Dateien)
  K.isEmptyLocal = () => {
    const S = App.store;
    if (S.srs.size || S.files.size) return false;
    for (const it of S.items.values()) if (!(it._seed || it._pack) || it._edited || it.star) return false;
    return true;
  };

  // ---------- Erlaubnis ----------
  // Handles ohne Abfrage (privater Browser-Ordner) gelten als erlaubt
  const permission = async () => (dir && dir.queryPermission ? dir.queryPermission({ mode: 'readwrite' }) : 'granted');
  const request = async () => {
    if (!dir || !dir.requestPermission) return 'granted';
    try { return await dir.requestPermission({ mode: 'readwrite' }); } catch (e) { return 'denied'; }
  };

  // ---------- Zeitsteuerung ----------
  const stopTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const schedule = (ms, opts) => {
    stopTimer();
    timer = setTimeout(() => {
      timer = null;
      if (visible()) { K.flush(opts); return; }
      // verborgener Tab schreibt nicht; ein voller Abgleich bleibt für das Zurückkommen vorgemerkt
      if (opts && opts.full && state) state.dirty.full = true;
      emit();
    }, ms);
  };
  // Haken aus App.db: jeder Schreibzugriff auf die Datenbank
  const dbWritten = (store, keys) => {
    if (!dir || restoring) return;
    if (store === 'meta' && keys && keys.every((k) => String(k).startsWith('backup'))) return;
    const before = L().isDirty(state);
    if (L().touch(state, store, keys)) saveState();
    if (!L().isDirty(state)) return;
    schedule(WAIT);
    if (!before) emit();
  };

  const ERR = { gone: 'Der Sicherungsordner wurde nicht gefunden.', full: 'Der Datenträger ist voll.' };
  const pass = async (o) => {
    stopTimer();
    if ((await permission()) !== 'granted') { phase = 'paused'; ask = 'permission'; emit(); return; }
    try {
      const r = await L().run(dir, mkSrc(), state, {
        device, now: Date.now(), full: !!o.full, force: !!o.force,
        onProgress: (done, total) => { progress = total > 1 ? [done, total] : null; if (progress) emit(); },
      });
      if (r.status === 'foreign' || r.status === 'corrupt') { phase = 'paused'; ask = r.status; askStand = r.stand || null; }
      else if (r.failed) {
        phase = 'error'; ask = null; askStand = null;
        detail = (r.failed === 1 ? 'Eine Datei konnte' : r.failed + ' Dateien konnten') + ' nicht in den Ordner geschrieben werden. Einträge und Lernstand sind gesichert.';
      } else { phase = 'ok'; ask = null; askStand = null; detail = ''; }
    } catch (e) {
      const kind = L().errorKind(e);
      if (kind === 'permission') { phase = 'paused'; ask = 'permission'; }
      else { phase = 'error'; detail = ERR[kind] || String((e && e.message) || e); console.error('Sicherung fehlgeschlagen', e); }
    } finally {
      progress = null;
      await saveState();
    }
  };
  // Jetzt sichern. Es läuft nie mehr als ein Durchlauf; ein Auslöser währenddessen führt zu genau einem weiteren.
  K.flush = (o = {}) => {
    if (!dir || restoring) return Promise.resolve();
    if (running) { again = Object.assign(again || {}, o); return running; }
    running = (async () => {
      emit();
      try { await pass(o); } finally {
        running = null;
        const next = again; again = null;
        if (next && dir) K.flush(next); else emit();
      }
    })();
    return running;
  };
  // Warten, bis kein Durchlauf mehr läuft
  K.idle = async () => { while (running) await running; };

  // ---------- Zustand für die Anzeige ----------
  K.status = () => {
    if (!dir) return K.supported() ? { kind: 'off', text: '' } : { kind: 'unsupported', text: '' };
    const base = { folder: dir.name, device: device ? device.name : '', saved: state.saved || 0 };
    if (running || timer || (phase === 'ok' && L().isDirty(state))) {
      return Object.assign(base, { kind: 'busy', text: progress ? `Sichert … ${progress[0]} / ${progress[1]}` : 'Sichert …', progress: progress || undefined });
    }
    if (phase === 'paused') return Object.assign(base, { kind: 'paused', text: 'Sicherung pausiert – antippen', ask });
    if (phase === 'error') return Object.assign(base, { kind: 'error', text: 'Sicherung fehlgeschlagen', detail });
    return Object.assign(base, { kind: 'ok', text: state.saved ? `Gesichert · ${hm(state.saved)}` : 'Gesichert' });
  };

  // ---------- Rückfragen ----------
  K.ui = {
    // Dialog mit mehreren Knöpfen → Schlüssel des gewählten Knopfs oder null
    choose: (title, text, buttons) => new Promise((res) => {
      let done = false;
      const md = App.modal({
        title, body: `<p>${App.esc(text)}</p>`,
        foot: '<button class="btn btn-ghost" data-k="">Abbrechen</button>' + buttons.map((b) => `<button class="btn ${b.primary ? 'btn-primary' : ''} ${b.ghost ? 'btn-ghost' : ''}" data-k="${b.key}">${App.esc(b.label)}</button>`).join(''),
        onClose: () => { if (!done) res(null); },
      });
      md.el.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { done = true; res(b.dataset.k || null); md.close(); }; });
    }),
  };
  const CORRUPT_Q = 'Die Sicherung im Ordner ist beschädigt. Neu anlegen? Frühere Tagesstände bleiben erhalten.';
  const askCorrupt = () => App.confirm(CORRUPT_Q, { ok: 'Neu anlegen', title: 'Sicherung beschädigt' });
  const standText = (stand, word) => (stand ? `Im Ordner liegt ${word} von ${stand.device.name || 'einem anderen Gerät'}, ${when(stand.saved)}.` : `Im Ordner liegt schon ${word}.`);

  // ---------- Wiederherstellen ----------
  const restoreError = (e) => {
    if (e && e.code === 'BACKUP_CORRUPT') App.toast('Die Sicherung im Ordner ist beschädigt – es wurde nichts geändert.');
    else if (e && e.code === 'BACKUP_NONE') App.toast('In diesem Ordner liegt keine Sicherung.');
    else { console.error('Wiederherstellen fehlgeschlagen', e); App.toast('Wiederherstellen fehlgeschlagen: ' + ((e && e.message) || e)); }
  };
  // Ganzen Stand aus dem Ordner holen und neu laden → true bei Erfolg
  const doRestore = async () => {
    await K.idle();
    stopTimer();
    restoring = true;
    try {
      const r = await L().restore(dir, sink, state, { now: Date.now(), local: await localDaten() });
      await saveState();
      try { if (r.missing) sessionStorage.setItem('nt-backup-missing', String(r.missing)); } catch (e) { /* egal */ }
      location.reload(); // restoring bleibt gesetzt: bis zum Neuladen wird nichts mehr geschrieben
      return true;
    } catch (e) { restoring = false; restoreError(e); return false; }
  };
  K.restoreFromFolder = async () => {
    if (!dir) return K.pick({ mode: 'restore' });
    if ((await request()) !== 'granted') return undefined;
    if (!(await App.confirm('Alle Daten in dieser App werden durch den Stand aus dem Ordner ersetzt. Der jetzige Stand wird vorher im Ordner abgelegt.', { ok: 'Wiederherstellen', title: 'Aus Ordner wiederherstellen?' }))) return undefined;
    return doRestore();
  };
  K.versions = async () => (dir && (await permission()) === 'granted' ? L().listVersions(dir) : []);
  K.restoreVersion = async (name) => {
    if (!dir) return;
    await K.idle();
    stopTimer();
    restoring = true;
    try {
      await L().restoreVersion(dir, name, sink, state, { now: Date.now(), local: await localDaten() });
      await saveState();
      location.reload(); // restoring bleibt gesetzt: bis zum Neuladen wird nichts mehr geschrieben
    } catch (e) { restoring = false; restoreError(e); }
  };

  // ---------- Einrichten ----------
  const ensureDevice = async () => {
    if (device) return true;
    const a = await App.ask('Wie heißt dieses Gerät?', [{ label: 'Name in der Sicherung (z. B. PC oder Tablet)', value: 'PC' }]);
    if (!a) return false;
    device = { id: crypto.randomUUID(), name: a[0] || 'PC' };
    await metaPut('backupDevice', device);
    return true;
  };
  // Ordner verbinden. Nimmt jedes Ordner-Handle (auch den privaten Browser-Ordner in Tests).
  // mode: ask = bei vorhandener Sicherung fragen, restore = wiederherstellen, overwrite = überschreiben
  K.connect = async (handle, { mode = 'ask' } = {}) => {
    const r = await L().resolveDir(handle);
    let found = r.corrupt ? 'corrupt' : 'none', stand = r.stand;
    if (!r.corrupt) {
      try { stand = (await L().readBackup(r.dir)).stand; found = 'backup'; } catch (e) {
        if (e.code === 'BACKUP_CORRUPT') found = 'corrupt'; else if (e.code !== 'BACKUP_NONE') throw e;
      }
    }
    let what = 'overwrite';
    if (found === 'corrupt') { if (!(await askCorrupt())) return 'cancelled'; }
    else if (found === 'backup') {
      what = mode;
      if (mode === 'ask') {
        const empty = K.isEmptyLocal();
        what = await K.ui.choose('Sicherung gefunden', standText(stand, 'eine Sicherung'), [
          { key: 'restore', label: 'Wiederherstellen (ersetzt die Daten hier)', primary: empty },
          { key: 'overwrite', label: 'Überschreiben (ersetzt die Sicherung)', ghost: empty },
        ]);
        if (!what) return 'cancelled';
      }
    } else if (mode === 'restore') { App.toast('In diesem Ordner liegt keine Sicherung.'); return 'cancelled'; }
    if (!(await ensureDevice())) return 'cancelled';

    await K.idle();
    stopTimer();
    dir = r.dir; state = L().newState(); phase = 'ok'; ask = null; detail = '';
    await metaPut('backupDir', dir);
    await saveState();
    if (what === 'restore') {
      if (await doRestore()) return 'restored';
      await K.disconnect();
      return 'cancelled';
    }
    await K.flush({ full: true, force: true });
    return 'connected';
  };
  K.pick = async (opts) => {
    if (!K.supported()) return 'cancelled';
    let handle;
    try { handle = await window.showDirectoryPicker({ id: 'nihongo', mode: 'readwrite', startIn: 'documents' }); } catch (e) {
      if (e && e.name !== 'AbortError') { console.error(e); App.toast('Der Ordner konnte nicht geöffnet werden.'); }
      return 'cancelled';
    }
    try { return await K.connect(handle, opts); } catch (e) {
      console.error(e); App.toast('Der Ordner konnte nicht eingerichtet werden: ' + ((e && e.message) || e));
      return 'cancelled';
    }
  };
  // Nur im Arbeitsspeicher abhängen (vor „Alle Daten löschen“): ab jetzt wird nichts mehr in den Ordner geschrieben
  K.detach = async () => {
    await K.idle();
    stopTimer();
    dir = null; state = null; phase = 'off'; ask = null; detail = '';
  };
  K.disconnect = async () => {
    await K.idle();
    stopTimer();
    dir = null; state = null; phase = 'off'; ask = null; detail = '';
    await App.db.del('meta', 'backupDir');
    await App.db.del('meta', 'backupState');
    emit();
  };

  // Nach „pausiert“: Erlaubnis holen, offene Rückfrage stellen, nachholen
  K.resume = async () => {
    if (!dir) return;
    if ((await request()) !== 'granted') { phase = 'paused'; ask = 'permission'; emit(); return; }
    if (ask !== 'foreign' && ask !== 'corrupt') await K.flush({ full: true });
    if (ask === 'foreign') {
      const since = state.saved ? `Änderungen seit ${when(state.saved)} auf diesem Gerät gehen verloren` : 'die Daten auf diesem Gerät gehen verloren';
      const c = await K.ui.choose('Neuerer Stand im Ordner', `${standText(askStand, 'ein Stand')} „Übernehmen“ ersetzt alles hier – ${since}. „Meinen Stand behalten“ überschreibt den Stand im Ordner.`, [
        { key: 'take', label: 'Übernehmen' }, { key: 'keep', label: 'Meinen Stand behalten' },
      ]);
      if (c === 'take') await doRestore();
      else if (c === 'keep') await K.flush({ full: true, force: true });
    } else if (ask === 'corrupt') {
      if (await askCorrupt()) await K.flush({ full: true, force: true });
    }
  };

  // ---------- Oberfläche ----------
  const PAUSE_WHY = {
    permission: 'Der Browser braucht einmal deine Bestätigung für den Ordner.',
    foreign: 'Im Ordner liegt ein Stand von einem anderen Gerät.',
    corrupt: 'Die Sicherung im Ordner ist beschädigt.',
  };
  const HOME_WHY = {
    permission: 'der Browser braucht einmal deine Bestätigung.',
    foreign: 'im Ordner liegt ein Stand von einem anderen Gerät.',
    corrupt: 'die Sicherung im Ordner ist beschädigt.',
  };
  const btn = (bk, label, cls = '', ic = '') => `<button class="btn ${cls}" data-bk="${bk}">${ic ? App.icon(ic) + ' ' : ''}${label}</button>`;
  // Abschnitt „Automatische Sicherung“ in den Einstellungen (Inhalt von [data-backup-auto])
  K.card = () => {
    const st = K.status();
    const esc = App.esc;
    if (st.kind === 'unsupported') return '<p class="muted small">Automatische Sicherung geht in diesem Browser nicht – bitte Chrome am PC verwenden oder das Backup von Hand machen.</p>';
    if (st.kind === 'off') {
      return `<p class="muted small">Die App legt alle Daten von selbst in einen Ordner deiner Wahl. Liegt er in Google Drive, hast du zugleich eine Sicherung außer Haus.</p>
        <div class="stack">${btn('pick', 'Ordner wählen', 'btn-primary', 'backup')}${btn('restore', 'Aus Ordner wiederherstellen', 'btn-ghost btn-sm')}</div>`;
    }
    const cls = st.kind === 'paused' ? 'warn' : st.kind === 'error' ? 'bad' : 'ok';
    const why = st.kind === 'paused' ? PAUSE_WHY[st.ask] || '' : st.kind === 'error' ? st.detail : '';
    return `<p class="small"><b>Ordner:</b> ${esc(st.folder)} · <b>Gerät:</b> ${esc(st.device)}</p>
      <p class="backup-state ${cls}">${App.icon(cls === 'ok' ? 'backup' : 'alert')} <span>${esc(st.text.replace(' – antippen', ''))}${why ? ' – ' + esc(why) : ''}</span></p>
      <div class="stack">
        ${st.kind === 'paused' ? btn('resume', 'Sicherung fortsetzen', 'btn-primary') : ''}
        ${st.kind === 'error' ? btn('retry', 'Erneut versuchen', 'btn-primary') : ''}
        ${btn('flush', 'Jetzt sichern', st.kind === 'ok' || st.kind === 'busy' ? 'btn-primary' : '', 'backup')}
        ${btn('restore', 'Aus Ordner wiederherstellen')}
        ${btn('versions', 'Früheren Stand wiederherstellen')}
        <div class="row">${btn('pick', 'Anderen Ordner wählen', 'btn-ghost btn-sm')}${btn('disconnect', 'Sicherung trennen', 'btn-ghost btn-sm')}</div>
      </div>`;
  };
  // Tage mit Änderungen (Merker `changed-days`); unlesbar = leer
  const changedDays = () => App.remindLogic.readDays(App.lsGet);
  // Öffentlich, damit auch das Üben (schreibt ohne emit) einen Tag mit Änderungen zählen kann
  K.noteChange = () => { if (App.remindLogic) App.remindLogic.noteToday(App.lsGet, App.lsSet, App.today()); };
  // Hinweis auf der Startseite (Inhalt von [data-backup-home]); leer, wenn es nichts zu sagen gibt
  K.homeCard = (o) => {
    const st = K.status();
    if (st.kind === 'paused') {
      return `<div class="card backup-line"><span>${App.icon('alert')} Sicherung pausiert – ${HOME_WHY[st.ask] || HOME_WHY.permission}</span>${btn('resume', 'Sicherung fortsetzen', 'btn-primary btn-sm')}</div>`;
    }
    if (App.remindLogic && App.remindLogic.due({ days: changedDays(), backupOn: st.kind !== 'off' && st.kind !== 'unsupported' })) {
      return `<div class="card backup-line"><span>Lange nicht gesichert – jetzt Backup speichern</span>
        <span class="row">${btn('remind-save', 'Backup speichern', 'btn-primary btn-sm', 'backup')}${btn('remind-later', 'Später', 'btn-ghost btn-sm')}</span></div>`;
    }
    if (st.kind === 'off' && !(o && o.noRestoreHint) && K.isEmptyLocal() && App.lsGet('backup-hint') !== 'off') {
      return `<div class="card backup-line"><span><b>Sicherung einrichten</b><br><span class="muted small">Wähle einen Ordner – die App sichert dort von selbst. Liegt darin schon eine Sicherung, kannst du deine Daten zurückholen.</span></span>
        <span class="row">${btn('pick', 'Ordner wählen', 'btn-primary btn-sm', 'backup')}${btn('hide-hint', 'Ausblenden', 'btn-ghost btn-sm')}</span></div>`;
    }
    return '';
  };
  // Der Hinweis „mach regelmäßig ein Backup“ gilt nur, solange keine automatische Sicherung eingerichtet ist
  K.manualHint = () => !dir;
  // Status in der Seitenleiste
  K.renderStatus = () => {
    const el = document.getElementById && document.getElementById('backup-status');
    if (!el) return;
    const st = K.status();
    el.hidden = st.kind === 'off' || st.kind === 'unsupported';
    if (el.hidden) return;
    el.className = 'nav-link backup-status ' + (st.kind === 'paused' ? 'warn' : st.kind === 'error' ? 'bad' : '');
    el.title = st.text;
    el.innerHTML = `<span class="dot">${App.icon(st.kind === 'paused' || st.kind === 'error' ? 'alert' : 'backup')}</span><span class="lbl">${App.esc(st.text)}</span>`;
  };
  // Alles, was den Zustand zeigt, an Ort und Stelle auffrischen (ohne die Ansicht neu zu zeichnen)
  const refresh = () => {
    K.renderStatus();
    if (!document.querySelector) return;
    const a = document.querySelector('[data-backup-auto]'); if (a) a.innerHTML = K.card();
    const h = document.querySelector('[data-backup-home]'); if (h) h.innerHTML = K.homeCard({ noRestoreHint: !!(App.welcome && App.welcome.card()) });
    const m = document.querySelector('[data-backup-manual]'); if (m) m.hidden = !K.manualHint();
  };
  const versionsDialog = async () => {
    const list = await K.versions();
    const body = list.length
      ? `<p class="muted small">Zurückgeholt werden Einträge, Lernstand und Einstellungen. Anlagen und Stiftnotizen bleiben, wie sie jetzt sind. Der jetzige Stand wird vorher im Ordner abgelegt.</p>
        <div class="stack">${list.map((v) => `<button class="btn" data-ver="${App.esc(v.name)}">${App.esc(v.label)}</button>`).join('')}</div>`
      : '<p>Noch keine früheren Stände.</p>';
    const md = App.modal({ title: 'Früheren Stand wiederherstellen', body, foot: '<button class="btn" data-no>Schließen</button>' });
    md.el.querySelector('[data-no]').onclick = () => md.close();
    md.el.querySelectorAll('[data-ver]').forEach((b) => {
      b.onclick = async () => {
        md.close();
        if (await App.confirm(`Den Stand vom ${b.textContent} zurückholen?`, { ok: 'Zurückholen', title: 'Früheren Stand wiederherstellen' })) K.restoreVersion(b.dataset.ver);
      };
    });
  };
  const errorDialog = () => {
    const md = App.modal({ title: 'Sicherung fehlgeschlagen', body: `<p>${App.esc(K.status().detail || '')}</p><p class="muted small">Deine Daten in der App sind davon nicht betroffen. Die Änderungen werden nachgetragen, sobald das Schreiben wieder klappt.</p>`, foot: '<button class="btn" data-no>Schließen</button><button class="btn btn-primary" data-ok>Erneut versuchen</button>' });
    md.el.querySelector('[data-no]').onclick = () => md.close();
    md.el.querySelector('[data-ok]').onclick = () => { md.close(); K.flush({ full: true }); };
  };
  const ACT = {
    pick: () => K.pick(),
    restore: () => K.restoreFromFolder(),
    flush: () => K.flush({ full: true }),
    retry: () => K.flush({ full: true }),
    resume: () => K.resume(),
    versions: versionsDialog,
    disconnect: async () => { if (await App.confirm('Automatische Sicherung trennen? Die Dateien im Ordner bleiben liegen.', { ok: 'Trennen', title: 'Sicherung trennen' })) K.disconnect(); },
    'remind-save': async () => { await App.exportData({ withFiles: true }); refresh(); },
    'remind-later': () => { App.lsSet('changed-days', '[]'); refresh(); },
    'hide-hint': () => { App.lsSet('backup-hint', 'off'); refresh(); },
    status: () => { const k = K.status().kind; if (k === 'paused') K.resume(); else if (k === 'error') errorDialog(); else location.hash = '#/einstellungen'; },
  };
  const onClick = (e) => {
    const b = e.target.closest && e.target.closest('[data-bk], #backup-status');
    if (!b) return;
    const act = ACT[b.dataset.bk || 'status'];
    if (act) Promise.resolve(act()).catch((er) => { console.error(er); App.toast('Sicherung: ' + ((er && er.message) || er)); });
  };

  // ---------- Start ----------
  K.init = async () => {
    App.dbWritten = dbWritten;
    document.addEventListener('click', onClick);
    if (App.onChange) App.onChange((w) => {
      if (w === 'backup') refresh();
      else if (w !== 'route') K.noteChange();
    });
    try {
      const n = +sessionStorage.getItem('nt-backup-missing');
      if (n) { sessionStorage.removeItem('nt-backup-missing'); App.toast(n === 1 ? '1 Datei fehlt im Ordner.' : `${n} Dateien fehlen im Ordner.`); }
    } catch (e) { /* egal */ }
    document.addEventListener('visibilitychange', () => {
      if (!dir || restoring) return;
      // Verbergen/Schließen: sofort sichern. Zurückkommen: Liegengebliebenes nachholen (auch Stand eines anderen Geräts prüfen).
      if (L().isDirty(state) && phase !== 'paused') K.flush();
    });
    dir = (await metaGet('backupDir')) || null;
    device = (await metaGet('backupDevice')) || null;
    if (!dir) { emit(); return; }
    state = (await metaGet('backupState')) || L().newState();
    if (!device) { device = { id: crypto.randomUUID(), name: 'PC' }; await metaPut('backupDevice', device); }
    if ((await permission()) === 'granted') { phase = 'ok'; schedule(START_WAIT, { full: true }); }
    else { phase = 'paused'; ask = 'permission'; }
    emit();
  };
})(window.App);
