/* Nihongo Techō – Kern: Hilfsfunktionen, Datenbank, Speicher, Router */
'use strict';
window.App = window.App || {};

(function (App) {
  // ---------- kleine Helfer ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p = 'u') => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtDate = (d) => { if (!d) return ''; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const fmtSize = (n) => n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // Lokales Kalenderdatum (nicht UTC) – sonst landen Einträge nach Mitternacht in Deutschland auf dem Vortag.
  const today = (d = new Date()) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  Object.assign(App, { $, $$, esc, uid, debounce, clamp, fmtDate, fmtSize, shuffle, pick, today });

  // ---------- Icons (Linien-Icons, 24er Raster) ----------
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    grammar: '<path d="M4 5h11a3 3 0 013 3v12H7a3 3 0 01-3-3z"/><path d="M4 17a3 3 0 013-3h11"/><path d="M8 8h6"/>',
    vocab: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6M7 13h10"/>',
    kanji: '<path d="M12 2.5v2.5"/><path d="M4 8.5v-3h16v3"/><path d="M7.5 9.5h8.5l-4 3.5"/><path d="M12 13v7c0 1.2-.9 1.7-2.4 1.3"/><path d="M4 16h16"/>', // 字
    phrase: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/><path d="M9 11h6M9 14h4"/>',
    session: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M7 9.5V15c0 1.5 2.5 3 5 3s5-1.5 5-3V9.5"/><path d="M21 7v6"/>',
    library: '<path d="M4 4h5v16H4zM10 4h4v16h-4z"/><path d="M15.5 5l3.8-1 3 15.5-3.8 1z"/>',
    practice: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 18l6-6-6-6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    starFill: '<path fill="currentColor" d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    speak: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    ballpen: '<path d="M17.5 3.5l3 3L9 18l-4.5 1.5L6 15z"/><path d="M15.5 5.5l3 3"/><path d="M19 2l3 3"/>',
    fountain: '<path d="M12 21.5l-5.5-9.5L9 4.5h6l2.5 7.5z"/><path d="M12 21.5V13"/><circle cx="12" cy="11.5" r="1.4"/><path d="M9 4.5V2h6v2.5"/>',
    highlighter: '<path d="M14 3l7 7-6.5 6.5-7-7z"/><path d="M8 9.5L4.5 17l2.5 2.5L14.5 16"/><path d="M3 21.5h8"/>',
    lasso: '<path stroke-dasharray="3 2.6" d="M12 3.5c-4.7 0-8.5 2.6-8.5 5.9s3.8 5.9 8.5 5.9 8.5-2.6 8.5-5.9S16.7 3.5 12 3.5z"/><path d="M7.5 14.6c-.6 1.4.9 2.2.9 3.9 0 1.2-.8 2-1.9 2"/>',
    pointer: '<path d="M5 3l6.5 17 2.6-7.2L21 10.2z"/><path d="M14.3 13l5.2 5.2"/>',
    imagePlus: '<path d="M21 12V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="M19 16v6M16 19h6"/>',
    marker: '<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/>',
    eraser: '<path d="M20 20H7L3 16a2 2 0 010-2.8L13.2 3a2 2 0 012.8 0l5 5a2 2 0 010 2.8L12 20"/><path d="M6 11l7 7"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h3"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
    hand: '<path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8"/><path d="M18 8a2 2 0 014 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 012.8-2.8L7 15"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
    replay: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
    step: '<path d="M5 4l10 8-10 8z"/><path d="M19 5v14"/>',
    link: '<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    cards: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.9 17.9A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.1-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2"/><path d="M1 1l22 22"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bold: '<path d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z"/>',
    italic: '<path d="M19 4h-9M14 20H5M15 4L9 20"/>',
    underline: '<path d="M6 3v7a6 6 0 0012 0V3M4 21h16"/>',
    h: '<path d="M6 4v16M18 4v16M6 12h12"/>',
    ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    ol: '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    highlight: '<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/>',
    ruby: '<path d="M4 20l5-12 5 12M5.5 16h7"/><path d="M15 4h5M17.5 4v4"/>',
    box: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 3v18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    notebook: '<path d="M6 3h13v18H6z"/><path d="M3 7h3M3 12h3M3 17h3M10 8h6M10 12h6"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
    lines: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    filePlus: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    package: '<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/><path d="M7.5 5.5l9 5"/>',
  };
  App.icon = (name, cls = '') => `<span class="ico ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.info}</svg></span>`;
  App.hydrateIcons = (root = document) => $$('[data-ico]', root).forEach((el) => { el.outerHTML = App.icon(el.dataset.ico); });

  // ---------- IndexedDB ----------
  const DB_NAME = 'nihongo-techo';
  let dbp = null;
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      // v2: Store 'dict' (Wörterbuch-Pakete). Upgrade legt nur fehlende Stores an – vorhandene Daten bleiben unberührt.
      const r = indexedDB.open(DB_NAME, 2);
      r.onupgradeneeded = () => {
        const db = r.result;
        const need = (name, keyPath) => (db.objectStoreNames.contains(name) ? null : db.createObjectStore(name, { keyPath }));
        need('items', 'id');
        need('files', 'id');
        need('blobs', 'id');
        need('ink', 'key');
        need('srs', 'id');
        need('meta', 'key');
        const dict = need('dict', 'id');
        if (dict) {
          dict.createIndex('k', 'k', { multiEntry: true });
          dict.createIndex('r', 'r', { multiEntry: true });
        }
      };
      // Upgrade blockiert (App in einem anderen Tab mit alter Version offen): sichtbar melden und weiter warten –
      // die Anfrage läuft von selbst weiter, sobald der andere Tab geschlossen ist
      r.onblocked = () => {
        console.warn('Datenbank-Upgrade wartet: bitte andere Tabs von Nihongo Techō schließen.');
        const view = document.getElementById('view');
        if (view) view.innerHTML = '<div class="card"><h3>Bitte andere Tabs schließen</h3><p>Nihongo Techō ist noch in einem anderen Tab/Fenster geöffnet. Bitte alle anderen Tabs schließen – die App lädt dann automatisch weiter.</p></div>';
      };
      r.onsuccess = () => {
        const db = r.result;
        // Ein anderer Tab will die Datenbank aktualisieren: Verbindung freigeben, damit er nicht blockiert, und um Neuladen bitten
        db.onversionchange = () => {
          db.close();
          const box = document.getElementById('toasts') || document.body;
          const t = document.createElement('div');
          t.className = 'toast';
          t.innerHTML = '<span>Nihongo Techō wurde in einem anderen Tab aktualisiert. Bitte diese Seite neu laden.</span><button>Neu laden</button>';
          t.querySelector('button').onclick = () => location.reload();
          box.appendChild(t);
        };
        res(db);
      };
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      const r = fn(s);
      if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }
  App.db = {
    get: (store, key) => tx(store, 'readonly', (s) => s.get(key)),
    all: (store) => tx(store, 'readonly', (s) => s.getAll()),
    put: (store, val) => tx(store, 'readwrite', (s) => s.put(val)),
    del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
    putMany: (store, vals) => tx(store, 'readwrite', (s) => { vals.forEach((v) => s.put(v)); }),
    clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
    delMany: (store, keys) => tx(store, 'readwrite', (s) => { keys.forEach((k) => s.delete(k)); }),
    // mehrere Schlüssel in einer Transaktion lesen (Ergebnis in derselben Reihenfolge, fehlende = undefined)
    getMany: (store, keys) => {
      const out = new Array(keys.length);
      return tx(store, 'readonly', (s) => { keys.forEach((k, i) => { const r = s.get(k); r.onsuccess = () => { out[i] = r.result; }; }); }).then(() => out);
    },
    // Cursor über den ganzen Store: fn(wert) → null = löschen, Objekt = ersetzen, sonst unverändert
    update: (store, fn) => tx(store, 'readwrite', (s) => {
      const r = s.openCursor();
      r.onsuccess = () => {
        const c = r.result;
        if (!c) return;
        const v = fn(c.value);
        if (v === null) c.delete(); else if (v) c.update(v);
        c.continue();
      };
    }),
    // je Schlüssel alle Datensätze über mehrere Indizes (vereinigt, ohne Doppelte) in einer readonly-Transaktion
    byIndex: (store, indexNames, keys) => {
      const out = new Map(keys.map((k) => [k, new Map()]));
      return tx(store, 'readonly', (s) => {
        keys.forEach((k) => indexNames.forEach((ix) => {
          const r = s.index(ix).getAll(k);
          r.onsuccess = () => { r.result.forEach((v) => out.get(k).set(v.id, v)); };
        }));
      }).then(() => new Map([...out].map(([k, m]) => [k, [...m.values()]])));
    },
  };

  // ---------- Speicher im Arbeitsspeicher ----------
  const S = App.store = {
    items: new Map(),   // alle Wissenseinträge (vocab, grammar, kanji, phrase, session)
    files: new Map(),   // Datei-Metadaten (Blob separat)
    srs: new Map(),
    inkCount: new Map(), // fileId -> Anzahl Seiten mit Notizen
    settings: null,
    listeners: new Set(),
    packs: {},          // meta.packs: installierte Pakete {id: {version, installed, chunksDone?, complete?}}
  };
  App.DEFAULT_SOURCES = [
    { name: 'Genki I', color: '#c8402a' },
    { name: 'Genki II', color: '#a23a55' },
    { name: 'Marugoto', color: '#2b8a8f' },
    { name: 'Minato', color: '#3f7fbf' },
    { name: 'VHS-Kurs', color: '#d0567a' },
    { name: 'NHK Easy', color: '#1f6f50' },
    { name: 'Anki', color: '#4c6ef5' },
    { name: 'WaniKani', color: '#d6338f' },
    { name: 'KaniWani', color: '#7a4b93' },
    { name: 'KameSame', color: '#2f9e44' },
    { name: 'Anime & Serien', color: '#e67700' },
    { name: 'JLPT', color: '#6741d9' },
    { name: 'Tagebuch', color: '#c8641e' },
    { name: 'Smalltalk', color: '#e0892f' },
    { name: 'Sonstiges', color: '#7d7f89' },
  ];
  const DEFAULT_SETTINGS = {
    name: '', theme: 'auto', furigana: 'on', course: 'VHS Japanisch A1', level: 12,
    sources: App.DEFAULT_SOURCES, penOnly: true, ttsRate: 0.9, newPerDay: 15, checkBatch: 15, sidebarCollapsed: false,
  };

  App.onChange = (fn) => S.listeners.add(fn);
  const emit = App.emit = (what) => S.listeners.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } });

  App.saveSettings = async (patch) => {
    Object.assign(S.settings, patch);
    await App.db.put('meta', { key: 'settings', value: S.settings });
    emit('settings');
  };
  App.sources = () => S.settings.sources;
  App.sourceColor = (name) => {
    const n = /^JLPT\b/.test(name || '') ? 'JLPT' : name; // „JLPT N5“ usw. teilen sich die Farbe der Quelle „JLPT“
    return (S.settings.sources.find((s) => s.name === name) || S.settings.sources.find((s) => s.name === n) || {}).color || '#7d7f89';
  };

  // ---------- Einträge ----------
  App.item = (id) => S.items.get(id);
  App.itemsOf = (type) => { const out = []; S.items.forEach((it) => { if (it.type === type) out.push(it); }); return out; };
  App.saveItem = async (it, { silent } = {}) => {
    const now = Date.now();
    if (!it.id) it.id = uid(it.type[0]);
    if (!it.created) it.created = now;
    it.updated = now;
    if (it._seed || it._pack) it._edited = true; // Nutzeränderung: Seed-/Paket-Updates überschreiben den Eintrag nicht mehr
    if ((it.type === 'vocab' || it.type === 'kanji') && !it.levelManual && App.levelFor) it.level = App.levelFor(it);
    S.items.set(it.id, it);
    await App.db.put('items', it);
    if (!silent) emit('items');
    return it;
  };
  App.deleteItem = async (id) => {
    const it = S.items.get(id);
    if (!it) return;
    S.items.delete(id);
    await App.db.del('items', id);
    await App.db.del('srs', id);
    S.srs.delete(id);
    if (it._seed) {
      const m = (await App.db.get('meta', 'deletedSeeds')) || { key: 'deletedSeeds', value: [] };
      m.value.push(id);
      await App.db.put('meta', m);
    }
    if (it._pack) {
      // Paket-Eintrag bewusst gelöscht: beim erneuten Freischalten/Aktualisieren nicht wieder hinzufügen
      const m = (await App.db.get('meta', 'deletedPackItems')) || { key: 'deletedPackItems', value: [] };
      if (!m.value.includes(id)) m.value.push(id);
      await App.db.put('meta', m);
    }
    // Verweise in Unterrichtsstunden entfernen
    for (const s of App.itemsOf('session')) {
      let ch = false;
      ['grammarIds', 'vocabIds', 'kanjiIds', 'phraseIds'].forEach((k) => {
        if (s[k] && s[k].includes(id)) { s[k] = s[k].filter((x) => x !== id); ch = true; }
      });
      if (ch) await App.saveItem(s, { silent: true });
    }
    // Verweise in Antworten/Tagebucheinträgen entfernen (dieselben Schlüssel wie bei Unterrichtsstunden)
    for (const a of [...App.itemsOf('answer'), ...App.itemsOf('journal')]) {
      let ch = false;
      ['vocabIds', 'grammarIds', 'newIds'].forEach((k) => {
        if (a[k] && a[k].includes(id)) { a[k] = a[k].filter((x) => x !== id); ch = true; }
      });
      if (ch) await App.saveItem(a, { silent: true });
    }
    // Wird eine Antwort/ein Tagebucheintrag selbst gelöscht: zugehöriges Notizblatt mitlöschen
    if ((it.type === 'answer' || it.type === 'journal') && App.filesFor) {
      for (const f of App.filesFor({ itemId: id })) await App.deleteFile(f.id);
    }
    emit('items');
  };

  // ---------- Dateien ----------
  App.addFile = async (blob, meta = {}) => {
    const id = uid('f');
    const f = {
      id, name: meta.name || blob.name || 'Datei', mime: blob.type || meta.mime || 'application/octet-stream', size: blob.size,
      source: meta.source || '', lesson: meta.lesson ?? '', section: meta.section || 'library', tags: meta.tags || [],
      sessionId: meta.sessionId || '', itemId: meta.itemId || '', role: meta.role || '', note: meta.note || '',
      created: Date.now(), pages: meta.pages || 0, paper: meta.paper || '',
    };
    await App.db.put('blobs', { id, blob });
    await App.db.put('files', f);
    S.files.set(id, f);
    emit('files');
    if (App.pdfText && App.fileKind(f) === 'pdf') App.pdfText.enqueue(id); // Text für die Suche einlesen
    return f;
  };
  App.updateFile = async (f) => { S.files.set(f.id, f); await App.db.put('files', f); emit('files'); };
  App.fileBlob = async (id) => (await App.db.get('blobs', id))?.blob;
  App.deleteFile = async (id) => {
    S.files.delete(id);
    await App.db.del('files', id);
    await App.db.del('blobs', id);
    const inks = await App.db.all('ink');
    for (const k of inks.filter((x) => x.fileId === id)) await App.db.del('ink', k.key);
    S.inkCount.delete(id);
    emit('files');
  };
  App.fileKind = (f) => {
    const n = (f.name || '').toLowerCase();
    if (f.mime === 'application/x-notebook') return 'notebook';
    if (f.mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
    if ((f.mime || '').startsWith('image/')) return 'image';
    if ((f.mime || '').startsWith('video/')) return 'video';
    if ((f.mime || '').startsWith('audio/')) return 'audio';
    if (/\.(pptx?|key|odp)$/.test(n)) return 'slides';
    if (/\.(docx?|odt|rtf|txt|md)$/.test(n)) return 'doc';
    if (/\.(apkg|csv|tsv|xlsx?)$/.test(n)) return 'deck';
    return 'other';
  };

  // ---------- SRS (vereinfachtes SM-2) ----------
  App.srsOf = (id) => S.srs.get(id);
  App.grade = async (id, g) => {
    const now = Date.now();
    const DAY = 864e5;
    const s = S.srs.get(id) || { id, ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now };
    if (s.check === 'unchecked') delete s.check; // wer eine Karte übt, prüft sie damit
    if (g === 0) { s.lapses++; s.reps = 0; s.ivl = 0; s.ease = Math.max(1.3, s.ease - 0.2); s.due = now + 10 * 60e3; }
    else {
      if (s.reps === 0) s.ivl = g === 1 ? 0.5 : g === 2 ? 1 : 4;
      else if (s.reps === 1) s.ivl = g === 1 ? 2 : g === 2 ? 3 : 6;
      else s.ivl = s.ivl * (g === 1 ? 1.2 : g === 2 ? s.ease : s.ease * 1.3);
      if (g === 1) s.ease = Math.max(1.3, s.ease - 0.15);
      if (g === 3) s.ease += 0.15;
      s.reps++;
      s.due = now + s.ivl * DAY;
    }
    s.last = now;
    S.srs.set(id, s);
    await App.db.put('srs', s);
    return s;
  };
  App.srsStage = (id) => { const s = S.srs.get(id); if (!s || !s.reps) return 0; return s.ivl >= 21 ? 2 : 1; };

  // ---------- Seed-Daten einspielen ----------
  const ORD = new Map();
  App.ord = (it) => (ORD.has(it.id) ? ORD.get(it.id) : 1e6 + (it.created || 0) / 1e7);
  const hash = (o) => { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  async function seed() {
    const deleted = new Set(((await App.db.get('meta', 'deletedSeeds')) || {}).value || []);
    const puts = [];
    (window.SEED || []).forEach((raw, i) => { if (raw) ORD.set(raw.id, i); });
    for (const raw of (window.SEED || [])) {
      if (!raw || !raw.id || deleted.has(raw.id)) continue;
      const h = hash(raw);
      const cur = S.items.get(raw.id);
      if (cur && (cur._edited || cur._seedHash === h)) continue;
      const it = Object.assign({}, cur || {}, JSON.parse(JSON.stringify(raw)), { _seed: true, _seedHash: h });
      if (!it.created) it.created = 0;
      // Seed-Daten tragen pauschal level:"N5" – das JLPT-Niveau kommt aus dem Index (außer bei manueller Wahl)
      if (it.levelManual && cur) it.level = cur.level; // manuelle Wahl bleibt
      else if ((it.type === 'vocab' || it.type === 'kanji') && App.levelFor) it.level = App.levelFor(it);
      S.items.set(it.id, it);
      puts.push(it);
    }
    if (puts.length) await App.db.putMany('items', puts);
  }

  // JLPT-Niveau einmalig pro Index-Version für alle Einträge setzen (Einträge mit levelManual bleiben unverändert)
  async function applyJlptIndexOnce() {
    const idx = window.JLPT_INDEX;
    if (!idx || !App.applyJlptIndex) return;
    const m = await App.db.get('meta', 'jlptIndexVersion');
    if (m && m.value === idx.version) return;
    const changed = App.applyJlptIndex(Array.from(S.items.values()));
    if (changed.length) await App.db.putMany('items', changed);
    await App.db.put('meta', { key: 'jlptIndexVersion', value: idx.version });
  }

  App.load = async () => {
    const [items, files, srs, settings, inks, packs] = await Promise.all([
      App.db.all('items'), App.db.all('files'), App.db.all('srs'), App.db.get('meta', 'settings'), App.db.all('ink'), App.db.get('meta', 'packs'),
    ]);
    S.packs = (packs && packs.value) || {};
    items.forEach((it) => S.items.set(it.id, it));
    files.forEach((f) => S.files.set(f.id, f));
    srs.forEach((s) => S.srs.set(s.id, s));
    inks.forEach((k) => { if (App.inkImages.hasInk(k)) S.inkCount.set(k.fileId, (S.inkCount.get(k.fileId) || 0) + 1); });
    S.settings = Object.assign({}, DEFAULT_SETTINGS, settings ? settings.value : {});
    // neue Standardquellen ergänzen
    App.DEFAULT_SOURCES.forEach((d) => { if (!S.settings.sources.some((s) => s.name === d.name)) S.settings.sources.push(d); });
    await seed();
    await applyJlptIndexOnce();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
  };

  // ---------- Router ----------
  const routes = [];
  App.route = (pattern, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re, keys, handler });
  };
  App.parseHash = () => {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    return { path, query };
  };
  App.go = (hash) => { if (location.hash === hash) App.render(); else location.hash = hash; };
  App.setQuery = (patch, replace = true) => {
    const { path, query } = App.parseHash();
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v == null || v === false) delete query[k]; else query[k] = v; });
    const qs = new URLSearchParams(query).toString();
    const h = '#' + path + (qs ? '?' + qs : '');
    if (replace) { history.replaceState(null, '', h); App.render(true); } else location.hash = h;
  };
  let cleanup = [];
  App.onLeave = (fn) => cleanup.push(fn);
  App.render = (keepScroll) => {
    const { path, query } = App.parseHash();
    cleanup.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    cleanup = [];
    const view = $('#view');
    const scroll = window.scrollY;
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        try { r.handler(view, params, query); } catch (e) { console.error(e); view.innerHTML = `<div class="card"><h3>Upps – Fehler beim Anzeigen</h3><pre class="small">${esc(e.stack || e)}</pre></div>`; }
        App.afterRender && App.afterRender(path);
        if (keepScroll) window.scrollTo(0, scroll); else window.scrollTo(0, 0);
        return;
      }
    }
    view.innerHTML = '<div class="empty-state"><div class="big">迷</div><h3>Seite nicht gefunden</h3><a class="btn" href="#/">Zur Startseite</a></div>';
  };
})(window.App);
